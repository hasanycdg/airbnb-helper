"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  setActiveOrg,
  verifyPassword,
} from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";
import { DEFAULT_CLEANING_CHECKLIST } from "@/lib/constants";
import { nanoid } from "nanoid";

export type ActionState = { error?: string } | undefined;

const registerSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const user = await db.user.create({
    data: {
      email,
      name: parsed.data.name.trim(),
      hashedPassword: await hashPassword(parsed.data.password),
    },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
    activeOrgId: null,
  });
  await audit({ action: "user.register", actorUserId: user.id });

  redirect("/onboarding");
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
    include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!user || !user.hashedPassword) return { error: "Invalid email or password." };

  const ok = await verifyPassword(parsed.data.password, user.hashedPassword);
  if (!ok) return { error: "Invalid email or password." };

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
    activeOrgId: user.memberships[0]?.organizationId ?? null,
  });
  await audit({ action: "user.login", actorUserId: user.id });

  redirect(user.memberships.length ? "/dashboard" : "/onboarding");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  await destroySession();
  if (session) await audit({ action: "user.logout", actorUserId: session.userId });
  redirect("/login");
}

const orgSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
});

export async function createOrganizationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = orgSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Ensure a unique slug.
  const base = slugify(parsed.data.name) || "org";
  let slug = base;
  for (let i = 0; i < 50; i++) {
    const exists = await db.organization.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${base}-${nanoid(4).toLowerCase()}`;
  }

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const org = await db.organization.create({
    data: {
      name: parsed.data.name.trim(),
      slug,
      trialEndsAt,
      members: { create: { userId: session.userId, role: "OWNER" } },
      subscription: { create: { plan: "TRIAL", status: "TRIALING", currentPeriodEnd: trialEndsAt } },
      cleaningChecklistTemplates: {
        create: {
          name: "Standard turnover",
          isDefault: true,
          items: {
            create: DEFAULT_CLEANING_CHECKLIST.map((item, index) => ({
              label: item.label,
              room: item.room,
              order: index,
            })),
          },
        },
      },
    },
  });

  await setActiveOrg(org.id);
  await audit({ action: "organization.create", organizationId: org.id, actorUserId: session.userId });

  redirect("/dashboard");
}

export async function switchOrganizationAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const orgId = String(formData.get("organizationId"));

  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: session.userId } },
  });
  if (membership) await setActiveOrg(orgId);
  redirect("/dashboard");
}
