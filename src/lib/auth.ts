import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type {
  Organization,
  OrganizationMember,
  Role,
  Subscription,
  User,
} from "@prisma/client";
import { db } from "@/lib/db";
import { env, isProd } from "@/lib/env";

const COOKIE = "stayguide_session";
const SECRET = new TextEncoder().encode(env.authSecret);
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  userId: string;
  email: string;
  name: string | null;
  isSuperAdmin: boolean;
  activeOrgId: string | null;
}

// ── Password helpers ─────────────────────────────────────────────────────

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Session cookie (JWT) ─────────────────────────────────────────────────

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: (payload.name as string | null) ?? null,
      isSuperAdmin: Boolean(payload.isSuperAdmin),
      activeOrgId: (payload.activeOrgId as string | null) ?? null,
    };
  } catch {
    return null;
  }
});

/** Re-issue the session cookie pointing at a different active organization. */
export async function setActiveOrg(orgId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await createSession({ ...session, activeOrgId: orgId });
}

// ── Loaders ───────────────────────────────────────────────────────────────

export type UserWithMemberships = User & {
  memberships: (OrganizationMember & {
    organization: Organization & { subscription: Subscription | null };
  })[];
};

export const getCurrentUser = cache(async (): Promise<UserWithMemberships | null> => {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: { organization: { include: { subscription: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
});

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireSuperAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!session.isSuperAdmin) redirect("/dashboard");
  return session;
}

// ── Organization context ─────────────────────────────────────────────────

export interface OrgContext {
  session: SessionPayload;
  user: UserWithMemberships;
  organization: Organization & { subscription: Subscription | null };
  membership: OrganizationMember;
  role: Role;
}

export const getOrgContext = cache(async (): Promise<OrgContext | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await getCurrentUser();
  if (!user || user.memberships.length === 0) return null;

  const membership =
    user.memberships.find((m) => m.organizationId === session.activeOrgId) ??
    user.memberships[0];

  return {
    session,
    user,
    organization: membership.organization,
    membership,
    role: membership.role,
  };
});

export async function requireOrg(): Promise<OrgContext> {
  await requireAuth();
  const ctx = await getOrgContext();
  if (!ctx) redirect("/onboarding");
  // NOTE: do not persist activeOrgId here — requireOrg runs during Server
  // Component render, where cookie mutation is forbidden in Next 15. The
  // cookie is set in auth actions (login / onboarding / switch); when it is
  // stale or null, getOrgContext transparently falls back to the first
  // membership, which is sufficient for read paths.
  return ctx;
}

export async function requireRole(allowed: Role[]): Promise<OrgContext> {
  const ctx = await requireOrg();
  if (!allowed.includes(ctx.role)) redirect("/dashboard");
  return ctx;
}
