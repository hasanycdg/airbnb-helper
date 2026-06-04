import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Append-only audit trail. Best-effort: never throws into the caller. */
export async function audit(input: {
  action: string;
  organizationId?: string | null;
  actorUserId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipHash?: string | null;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        organizationId: input.organizationId ?? null,
        actorUserId: input.actorUserId ?? null,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        metadata: input.metadata,
        ipHash: input.ipHash ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record", input.action, err);
  }
}
