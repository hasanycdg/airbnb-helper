"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { buildMediaKey, createUploadTarget } from "@/lib/storage";

export type CleaningState = { error?: string; success?: boolean } | undefined;

/** Upload target for a cleaning photo (item proof / damage). Org-scoped. */
export async function requestCleaningUpload(input: {
  taskId: string;
  fileName: string;
  contentType: string;
}): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  const ctx = await requireOrg();
  if (!can(ctx.role, "cleaning:complete")) return null;
  if (!input.contentType.startsWith("image/")) return null;
  const task = await db.cleaningTask.findFirst({
    where: { id: input.taskId, organizationId: ctx.organization.id },
    select: { id: true, propertyId: true },
  });
  if (!task) return null;
  const key = buildMediaKey(ctx.organization.id, task.propertyId, `cleaning-${input.fileName}`);
  const target = await createUploadTarget(key, input.contentType);
  return { uploadUrl: target.uploadUrl, publicUrl: target.publicUrl };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function loadOrgTask(taskId: string, orgId: string) {
  return db.cleaningTask.findFirst({
    where: { id: taskId, organizationId: orgId },
    include: {
      items: { orderBy: [{ room: "asc" }, { order: "asc" }] },
      assignedTo: { select: { id: true, name: true, email: true } },
      inspectedBy: { select: { id: true, name: true } },
      property: { select: { id: true, publicName: true } },
    },
  });
}

// ── createTask ───────────────────────────────────────────────────────────────

const createTaskSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  templateId: z.string().optional(),
  assignedToId: z.string().optional(),
  title: z.string().optional(),
  dueAt: z.string().optional(),
});

export async function createTask(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  if (!can(ctx.role, "cleaning:manage")) {
    return { error: "You don't have permission to create cleaning tasks." };
  }

  const parsed = createTaskSchema.safeParse({
    propertyId: formData.get("propertyId"),
    templateId: formData.get("templateId") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    title: formData.get("title") || undefined,
    dueAt: formData.get("dueAt") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Org-scope the property check
  const property = await db.property.findFirst({
    where: { id: parsed.data.propertyId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!property) return { error: "Property not found." };

  // Validate assignee is in the org
  let assignedToId: string | null = null;
  if (parsed.data.assignedToId) {
    const member = await db.organizationMember.findFirst({
      where: { organizationId: ctx.organization.id, userId: parsed.data.assignedToId },
    });
    if (!member) return { error: "Assignee not found in your organization." };
    assignedToId = parsed.data.assignedToId;
  }

  // Load template items if a template was selected
  let templateItems: { label: string; room: string | null; order: number }[] = [];
  if (parsed.data.templateId) {
    const template = await db.cleaningChecklistTemplate.findFirst({
      where: { id: parsed.data.templateId, organizationId: ctx.organization.id },
      include: { items: { orderBy: { order: "asc" } } },
    });
    if (!template) return { error: "Checklist template not found." };
    templateItems = template.items.map((item) => ({
      label: item.label,
      room: item.room ?? null,
      order: item.order,
    }));
  }

  const task = await db.cleaningTask.create({
    data: {
      propertyId: parsed.data.propertyId,
      organizationId: ctx.organization.id,
      templateId: parsed.data.templateId ?? null,
      title: parsed.data.title?.trim() || null,
      assignedToId,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      items: {
        create: templateItems.map((item) => ({
          label: item.label,
          room: item.room,
          order: item.order,
        })),
      },
    },
  });

  await audit({
    action: "cleaning.task.create",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "CleaningTask",
    targetId: task.id,
  });

  revalidatePath("/cleaning");
  return { success: true };
}

// ── toggleItem ───────────────────────────────────────────────────────────────

export async function toggleItem(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireOrg();

  if (!can(ctx.role, "cleaning:complete")) {
    return { error: "You don't have permission to update checklist items." };
  }

  const itemId = String(formData.get("itemId"));
  const taskId = String(formData.get("taskId"));

  // Org-scope via task
  const task = await db.cleaningTask.findFirst({
    where: { id: taskId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!task) return { error: "Task not found." };

  const item = await db.cleaningTaskItem.findFirst({
    where: { id: itemId, taskId },
    select: { id: true, isDone: true },
  });
  if (!item) return { error: "Checklist item not found." };

  await db.cleaningTaskItem.update({
    where: { id: itemId },
    data: {
      isDone: !item.isDone,
      doneAt: !item.isDone ? new Date() : null,
    },
  });

  revalidatePath(`/cleaning/${taskId}`);
  return { success: true };
}

// ── setItemPhoto ─────────────────────────────────────────────────────────────

const setItemPhotoSchema = z.object({
  itemId: z.string().min(1),
  taskId: z.string().min(1),
  photoUrl: z.string().url("Must be a valid URL").or(z.literal("")),
});

export async function setItemPhoto(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireOrg();

  if (!can(ctx.role, "cleaning:complete")) {
    return { error: "You don't have permission to upload photos." };
  }

  const parsed = setItemPhotoSchema.safeParse({
    itemId: formData.get("itemId"),
    taskId: formData.get("taskId"),
    photoUrl: formData.get("photoUrl"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const task = await db.cleaningTask.findFirst({
    where: { id: parsed.data.taskId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!task) return { error: "Task not found." };

  await db.cleaningTaskItem.updateMany({
    where: { id: parsed.data.itemId, taskId: parsed.data.taskId },
    data: { photoUrl: parsed.data.photoUrl || null },
  });

  revalidatePath(`/cleaning/${parsed.data.taskId}`);
  return { success: true };
}

// ── setItemNote ──────────────────────────────────────────────────────────────

export async function setItemNote(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireOrg();

  if (!can(ctx.role, "cleaning:complete")) {
    return { error: "You don't have permission to add notes." };
  }

  const itemId = String(formData.get("itemId"));
  const taskId = String(formData.get("taskId"));
  const note = String(formData.get("note") || "");

  const task = await db.cleaningTask.findFirst({
    where: { id: taskId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!task) return { error: "Task not found." };

  await db.cleaningTaskItem.updateMany({
    where: { id: itemId, taskId },
    data: { note: note.trim() || null },
  });

  revalidatePath(`/cleaning/${taskId}`);
  return { success: true };
}

// ── setTaskStatus ────────────────────────────────────────────────────────────

const setTaskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "INSPECTED"]),
});

export async function setTaskStatus(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireOrg();

  const parsed = setTaskStatusSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // CLEANER can move to IN_PROGRESS/COMPLETED; INSPECTED requires cleaning:manage
  const isManageAction = parsed.data.status === "INSPECTED";
  if (isManageAction && !can(ctx.role, "cleaning:manage")) {
    return { error: "Only managers and owners can mark a task as inspected." };
  }
  if (!can(ctx.role, "cleaning:complete")) {
    return { error: "You don't have permission to update task status." };
  }

  const task = await loadOrgTask(parsed.data.taskId, ctx.organization.id);
  if (!task) return { error: "Task not found." };

  const now = new Date();
  const data: {
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "INSPECTED";
    startedAt?: Date | null;
    completedAt?: Date | null;
    inspectedAt?: Date | null;
    inspectedById?: string | null;
  } = { status: parsed.data.status };

  if (parsed.data.status === "IN_PROGRESS" && !task.startedAt) {
    data.startedAt = now;
  }
  if (parsed.data.status === "COMPLETED") {
    data.completedAt = now;
  }
  if (parsed.data.status === "INSPECTED") {
    data.inspectedAt = now;
    data.inspectedById = ctx.user.id;
  }
  // Allow un-starting (back to PENDING)
  if (parsed.data.status === "PENDING") {
    data.startedAt = null;
    data.completedAt = null;
    data.inspectedAt = null;
    data.inspectedById = null;
  }

  await db.cleaningTask.update({
    where: { id: parsed.data.taskId },
    data,
  });

  await audit({
    action: `cleaning.task.status.${parsed.data.status.toLowerCase()}`,
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "CleaningTask",
    targetId: parsed.data.taskId,
  });

  revalidatePath(`/cleaning/${parsed.data.taskId}`);
  revalidatePath("/cleaning");
  return { success: true };
}

// ── inspectTask ──────────────────────────────────────────────────────────────

export async function inspectTask(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const taskId = String(formData.get("taskId"));
  const task = await db.cleaningTask.findFirst({
    where: { id: taskId, organizationId: ctx.organization.id },
    select: { id: true, status: true },
  });
  if (!task) return { error: "Task not found." };

  await db.cleaningTask.update({
    where: { id: taskId },
    data: {
      status: "INSPECTED",
      inspectedAt: new Date(),
      inspectedById: ctx.user.id,
    },
  });

  await audit({
    action: "cleaning.task.inspected",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "CleaningTask",
    targetId: taskId,
  });

  revalidatePath(`/cleaning/${taskId}`);
  revalidatePath("/cleaning");
  return { success: true };
}

// ── setReadyForNextGuest ─────────────────────────────────────────────────────

export async function setReadyForNextGuest(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireOrg();

  if (!can(ctx.role, "cleaning:complete")) {
    return { error: "You don't have permission to update this task." };
  }

  const taskId = String(formData.get("taskId"));
  const ready = formData.get("ready") === "true";

  const task = await db.cleaningTask.findFirst({
    where: { id: taskId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!task) return { error: "Task not found." };

  await db.cleaningTask.update({
    where: { id: taskId },
    data: { readyForNextGuest: ready },
  });

  await audit({
    action: ready ? "cleaning.task.ready_for_guest" : "cleaning.task.not_ready_for_guest",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "CleaningTask",
    targetId: taskId,
  });

  revalidatePath(`/cleaning/${taskId}`);
  revalidatePath("/cleaning");
  return { success: true };
}

// ── assignTask ───────────────────────────────────────────────────────────────

export async function assignTask(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const taskId = String(formData.get("taskId"));
  const assignedToId = String(formData.get("assignedToId") || "");

  const task = await db.cleaningTask.findFirst({
    where: { id: taskId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!task) return { error: "Task not found." };

  let resolvedAssigneeId: string | null = null;
  if (assignedToId) {
    const member = await db.organizationMember.findFirst({
      where: { organizationId: ctx.organization.id, userId: assignedToId },
    });
    if (!member) return { error: "Assignee not found in your organization." };
    resolvedAssigneeId = assignedToId;
  }

  await db.cleaningTask.update({
    where: { id: taskId },
    data: { assignedToId: resolvedAssigneeId },
  });

  await audit({
    action: "cleaning.task.assign",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "CleaningTask",
    targetId: taskId,
    metadata: { assignedToId: resolvedAssigneeId },
  });

  revalidatePath(`/cleaning/${taskId}`);
  revalidatePath("/cleaning");
  return { success: true };
}

// ── reportDamage ─────────────────────────────────────────────────────────────

const reportDamageSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  roomLocation: z.string().optional(),
});

export async function reportDamage(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireOrg();

  if (!can(ctx.role, "cleaning:complete")) {
    return { error: "You don't have permission to report damage." };
  }

  const parsed = reportDamageSchema.safeParse({
    taskId: formData.get("taskId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    roomLocation: formData.get("roomLocation") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const task = await db.cleaningTask.findFirst({
    where: { id: parsed.data.taskId, organizationId: ctx.organization.id },
    select: { id: true, propertyId: true },
  });
  if (!task) return { error: "Task not found." };

  const issue = await db.issue.create({
    data: {
      propertyId: task.propertyId,
      organizationId: ctx.organization.id,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      category: "BROKEN_ITEM",
      urgency: "MEDIUM",
      status: "NEW",
      source: "CLEANING",
      roomLocation: parsed.data.roomLocation?.trim() || null,
    },
  });

  await audit({
    action: "cleaning.damage.reported",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Issue",
    targetId: issue.id,
    metadata: { cleaningTaskId: parsed.data.taskId },
  });

  revalidatePath(`/cleaning/${parsed.data.taskId}`);
  revalidatePath("/issues");
  return { success: true };
}

// ── reportMissingInventory ────────────────────────────────────────────────────

const reportMissingInventorySchema = z.object({
  taskId: z.string().min(1),
  inventoryItemId: z.string().min(1),
  status: z.enum(["LOW", "EMPTY"]),
});

export async function reportMissingInventory(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireOrg();

  if (!can(ctx.role, "inventory:report")) {
    return { error: "You don't have permission to report inventory." };
  }

  const parsed = reportMissingInventorySchema.safeParse({
    taskId: formData.get("taskId"),
    inventoryItemId: formData.get("inventoryItemId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const task = await db.cleaningTask.findFirst({
    where: { id: parsed.data.taskId, organizationId: ctx.organization.id },
    select: { id: true, propertyId: true },
  });
  if (!task) return { error: "Task not found." };

  // Verify inventory item belongs to the same property
  const invItem = await db.inventoryItem.findFirst({
    where: { id: parsed.data.inventoryItemId, propertyId: task.propertyId },
    select: { id: true, name: true },
  });
  if (!invItem) return { error: "Inventory item not found." };

  await db.inventoryItem.update({
    where: { id: parsed.data.inventoryItemId },
    data: { currentStatus: parsed.data.status },
  });

  await audit({
    action: "cleaning.inventory.reported",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "InventoryItem",
    targetId: parsed.data.inventoryItemId,
    metadata: { cleaningTaskId: parsed.data.taskId, status: parsed.data.status },
  });

  revalidatePath(`/cleaning/${parsed.data.taskId}`);
  revalidatePath("/inventory");
  return { success: true };
}

// ── addTaskPhoto ─────────────────────────────────────────────────────────────

const addTaskPhotoSchema = z.object({
  taskId: z.string().min(1),
  photoUrl: z.string().url("Must be a valid URL"),
});

export async function addTaskPhoto(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireOrg();

  if (!can(ctx.role, "cleaning:complete")) {
    return { error: "You don't have permission to upload photos." };
  }

  const parsed = addTaskPhotoSchema.safeParse({
    taskId: formData.get("taskId"),
    photoUrl: formData.get("photoUrl"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const task = await db.cleaningTask.findFirst({
    where: { id: parsed.data.taskId, organizationId: ctx.organization.id },
    select: { id: true, photos: true },
  });
  if (!task) return { error: "Task not found." };

  if (task.photos.length >= 20) {
    return { error: "Maximum 20 proof photos per task." };
  }

  await db.cleaningTask.update({
    where: { id: parsed.data.taskId },
    data: { photos: { push: parsed.data.photoUrl } },
  });

  revalidatePath(`/cleaning/${parsed.data.taskId}`);
  return { success: true };
}

// ── updateTaskNotes ──────────────────────────────────────────────────────────

export async function updateTaskNotes(
  _prev: CleaningState,
  formData: FormData,
): Promise<CleaningState> {
  const ctx = await requireOrg();

  if (!can(ctx.role, "cleaning:complete")) {
    return { error: "You don't have permission to update task notes." };
  }

  const taskId = String(formData.get("taskId"));
  const notes = String(formData.get("notes") || "");

  const task = await db.cleaningTask.findFirst({
    where: { id: taskId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!task) return { error: "Task not found." };

  await db.cleaningTask.update({
    where: { id: taskId },
    data: { notes: notes.trim() || null },
  });

  revalidatePath(`/cleaning/${taskId}`);
  return { success: true };
}
