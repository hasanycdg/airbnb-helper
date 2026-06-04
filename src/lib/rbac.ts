import { Role } from "@prisma/client";

/**
 * Role-based permission matrix. Organization roles, from most to least
 * privileged: OWNER → MANAGER → CLEANER. Super-admin (platform staff) is a
 * separate flag on the User and bypasses these checks via dedicated guards.
 */
export type Permission =
  | "org:manage" // settings, branding, delete
  | "billing:manage"
  | "members:manage"
  | "property:manage" // create/edit/delete properties & guides
  | "guide:edit"
  | "media:manage"
  | "qr:manage"
  | "messages:manage"
  | "ai:configure"
  | "issues:view"
  | "issues:manage"
  | "cleaning:view"
  | "cleaning:manage" // create/assign tasks
  | "cleaning:complete" // tick checklist, upload photos
  | "inventory:view"
  | "inventory:manage"
  | "inventory:report" // mark low/empty/restocked
  | "recommendations:manage"
  | "reviews:manage"
  | "analytics:view";

const MATRIX: Record<Role, Permission[]> = {
  OWNER: [
    "org:manage",
    "billing:manage",
    "members:manage",
    "property:manage",
    "guide:edit",
    "media:manage",
    "qr:manage",
    "messages:manage",
    "ai:configure",
    "issues:view",
    "issues:manage",
    "cleaning:view",
    "cleaning:manage",
    "cleaning:complete",
    "inventory:view",
    "inventory:manage",
    "inventory:report",
    "recommendations:manage",
    "reviews:manage",
    "analytics:view",
  ],
  MANAGER: [
    "property:manage",
    "guide:edit",
    "media:manage",
    "qr:manage",
    "messages:manage",
    "ai:configure",
    "issues:view",
    "issues:manage",
    "cleaning:view",
    "cleaning:manage",
    "cleaning:complete",
    "inventory:view",
    "inventory:manage",
    "inventory:report",
    "recommendations:manage",
    "reviews:manage",
    "analytics:view",
  ],
  CLEANER: [
    "issues:view",
    "cleaning:view",
    "cleaning:complete",
    "inventory:view",
    "inventory:report",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  MANAGER: "Property manager",
  CLEANER: "Cleaner / staff",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: "Full access including billing, team and organization settings.",
  MANAGER: "Manages properties, guides, messages, cleaning and reports.",
  CLEANER: "Sees assigned cleaning tasks, checklists, restocking and issues.",
};
