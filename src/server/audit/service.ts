import "server-only";

import { getDb, hasDatabaseConfig } from "@/db/client";
import { auditEvents } from "@/db/schema";
import { logger } from "@/lib/logger";

type AuditInput = {
  organizationId?: string | null;
  actorId?: string | null;
  eventType: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
};

export async function recordAuditEvent(input: AuditInput) {
  logger.info(input.eventType, {
    organizationId: input.organizationId ?? null,
    actorId: input.actorId ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload ?? {},
  });

  if (!hasDatabaseConfig()) {
    return;
  }

  const db = getDb();

  await db.insert(auditEvents).values({
    organizationId: input.organizationId ?? null,
    actorId: input.actorId ?? null,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload ?? {},
  });
}
