"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { InventoryStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOrg, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { DEFAULT_INVENTORY_ITEMS } from "@/lib/constants";

export type InventoryState = { error?: string; success?: boolean } | undefined;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Verify a property belongs to the active org, return property or null. */
async function getOwnedProperty(propertyId: string, organizationId: string) {
  return db.property.findFirst({
    where: { id: propertyId, organizationId },
    select: { id: true, name: true },
  });
}

/** Verify an inventory item belongs to the active org (via property). */
async function getOwnedItem(itemId: string, organizationId: string) {
  return db.inventoryItem.findFirst({
    where: {
      id: itemId,
      property: { organizationId },
    },
    include: { property: { select: { id: true } } },
  });
}

/** Verify a restock task belongs to the active org (via property). */
async function getOwnedRestockTask(taskId: string, organizationId: string) {
  return db.restockTask.findFirst({
    where: {
      id: taskId,
      property: { organizationId },
    },
    include: { property: { select: { id: true } } },
  });
}

// ── Add item ───────────────────────────────────────────────────────────────

const addItemSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  name: z.string().min(1, "Name is required").max(100),
  category: z.string().max(60).optional(),
  unit: z.string().max(30).optional(),
  threshold: z.coerce.number().int().min(0).optional(),
  quantity: z.coerce.number().int().min(0).optional(),
});

export async function addItem(
  _prev: InventoryState,
  formData: FormData,
): Promise<InventoryState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = addItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const property = await getOwnedProperty(parsed.data.propertyId, ctx.organization.id);
  if (!property) return { error: "Property not found." };

  const item = await db.inventoryItem.create({
    data: {
      propertyId: parsed.data.propertyId,
      name: parsed.data.name.trim(),
      category: parsed.data.category?.trim() || null,
      unit: parsed.data.unit?.trim() || null,
      threshold: parsed.data.threshold ?? null,
      quantity: parsed.data.quantity ?? null,
      currentStatus: "OK",
    },
  });

  await audit({
    action: "inventory.item.create",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "InventoryItem",
    targetId: item.id,
  });

  revalidatePath("/inventory");
  return { success: true };
}

// ── Update item ────────────────────────────────────────────────────────────

const updateItemSchema = z.object({
  itemId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
  category: z.string().max(60).optional(),
  unit: z.string().max(30).optional(),
  threshold: z.coerce.number().int().min(0).optional(),
  quantity: z.coerce.number().int().min(0).optional(),
});

export async function updateItem(
  _prev: InventoryState,
  formData: FormData,
): Promise<InventoryState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = updateItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const item = await getOwnedItem(parsed.data.itemId, ctx.organization.id);
  if (!item) return { error: "Item not found." };

  await db.inventoryItem.update({
    where: { id: parsed.data.itemId },
    data: {
      name: parsed.data.name.trim(),
      category: parsed.data.category?.trim() || null,
      unit: parsed.data.unit?.trim() || null,
      threshold: parsed.data.threshold ?? null,
      quantity: parsed.data.quantity ?? null,
    },
  });

  await audit({
    action: "inventory.item.update",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "InventoryItem",
    targetId: parsed.data.itemId,
  });

  revalidatePath("/inventory");
  return { success: true };
}

// ── Set item status ────────────────────────────────────────────────────────

export async function setItemStatus(formData: FormData): Promise<void> {
  const ctx = await requireOrg();
  const itemId = String(formData.get("itemId"));
  const status = String(formData.get("status")) as InventoryStatus;

  if (!["OK", "LOW", "EMPTY"].includes(status)) return;

  const item = await getOwnedItem(itemId, ctx.organization.id);
  if (!item) return;

  await db.inventoryItem.update({
    where: { id: itemId },
    data: {
      currentStatus: status,
      ...(status === "OK" ? { lastRestockedAt: new Date() } : {}),
    },
  });

  await audit({
    action: `inventory.item.status.${status.toLowerCase()}`,
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "InventoryItem",
    targetId: itemId,
  });

  revalidatePath("/inventory");
}

// ── Delete item ────────────────────────────────────────────────────────────

export async function deleteItem(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const itemId = String(formData.get("itemId"));

  const item = await getOwnedItem(itemId, ctx.organization.id);
  if (!item) return;

  await db.inventoryItem.delete({ where: { id: itemId } });

  await audit({
    action: "inventory.item.delete",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "InventoryItem",
    targetId: itemId,
  });

  revalidatePath("/inventory");
}

// ── Seed defaults ──────────────────────────────────────────────────────────

export async function seedDefaults(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const propertyId = String(formData.get("propertyId"));

  const property = await getOwnedProperty(propertyId, ctx.organization.id);
  if (!property) return;

  // Only add items that don't already exist by name for this property
  const existing = await db.inventoryItem.findMany({
    where: { propertyId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((i) => i.name));

  const toCreate = DEFAULT_INVENTORY_ITEMS.filter(
    (d) => !existingNames.has(d.name),
  );

  if (toCreate.length === 0) {
    revalidatePath("/inventory");
    return;
  }

  await db.inventoryItem.createMany({
    data: toCreate.map((d) => ({
      propertyId,
      name: d.name,
      category: d.category,
      unit: d.unit,
      currentStatus: "OK" as InventoryStatus,
    })),
  });

  await audit({
    action: "inventory.seed.defaults",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Property",
    targetId: propertyId,
    metadata: { count: toCreate.length },
  });

  revalidatePath("/inventory");
}

// ── Create restock task ────────────────────────────────────────────────────

const createRestockTaskSchema = z.object({
  propertyId: z.string().min(1),
  inventoryItemId: z.string().optional(),
  title: z.string().min(1, "Title is required").max(200),
  note: z.string().max(500).optional(),
});

export async function createRestockTask(
  _prev: InventoryState,
  formData: FormData,
): Promise<InventoryState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = createRestockTaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const property = await getOwnedProperty(parsed.data.propertyId, ctx.organization.id);
  if (!property) return { error: "Property not found." };

  // If an item id was provided, verify it belongs to the same org
  if (parsed.data.inventoryItemId) {
    const item = await getOwnedItem(parsed.data.inventoryItemId, ctx.organization.id);
    if (!item) return { error: "Inventory item not found." };
  }

  const task = await db.restockTask.create({
    data: {
      propertyId: parsed.data.propertyId,
      inventoryItemId: parsed.data.inventoryItemId || null,
      title: parsed.data.title.trim(),
      note: parsed.data.note?.trim() || null,
      status: "PENDING",
    },
  });

  await audit({
    action: "inventory.restock.create",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "RestockTask",
    targetId: task.id,
  });

  revalidatePath("/inventory");
  return { success: true };
}

// ── Complete restock task ──────────────────────────────────────────────────

export async function completeRestockTask(formData: FormData): Promise<void> {
  const ctx = await requireOrg();
  const taskId = String(formData.get("taskId"));

  const task = await getOwnedRestockTask(taskId, ctx.organization.id);
  if (!task) return;

  await db.$transaction(async (tx) => {
    await tx.restockTask.update({
      where: { id: taskId },
      data: { status: "DONE", completedAt: new Date() },
    });

    // If task is linked to an item, mark it as restocked (OK)
    const fullTask = await tx.restockTask.findUnique({
      where: { id: taskId },
      select: { inventoryItemId: true },
    });
    if (fullTask?.inventoryItemId) {
      await tx.inventoryItem.update({
        where: { id: fullTask.inventoryItemId },
        data: { currentStatus: "OK", lastRestockedAt: new Date() },
      });
    }
  });

  await audit({
    action: "inventory.restock.complete",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "RestockTask",
    targetId: taskId,
  });

  revalidatePath("/inventory");
}
