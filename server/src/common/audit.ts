import { Logger } from "@nestjs/common";
import { DbService, nowIso, uid } from "../db/db.service.js";
import { requestContext } from "./request-context.js";

const logger = new Logger("audit");

export interface AuditEntry {
  id: string;
  tenantId: string | null;
  at: string;
  requestId: string | null;
  userId: string | null;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
}

/**
 * Append-only audit record. Best-effort: a failed audit write is logged and
 * swallowed so it can never break the business operation it describes.
 */
export async function recordAudit(
  dbService: DbService,
  action: string,
  entity: string,
  entityId: string | null,
  summary = "",
): Promise<void> {
  const ctx = requestContext.getStore();
  const doc: AuditEntry = {
    id: uid("aud"),
    tenantId: ctx?.tenantId ?? null,
    at: nowIso(),
    requestId: ctx?.requestId ?? null,
    userId: ctx?.userId ?? null,
    userName: ctx?.userName ?? null,
    action,
    entity,
    entityId,
    summary,
  };
  try {
    await dbService.collection("auditLog").insertOne(doc as never);
  } catch (e) {
    logger.warn(`failed to record audit entry (${action} ${entity} ${entityId}): ${String(e)}`);
  }
}
