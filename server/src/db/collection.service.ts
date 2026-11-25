import { BadRequestException } from "@nestjs/common";
import type { Document } from "mongodb";
import { DbService, nowIso, stripDoc, uid } from "./db.service.js";
import { recordAudit } from "../common/audit.js";
import { requestContext } from "../common/request-context.js";
import { LogEntry, MtoNotification, Programme, Review, Rotation, MtoTask, Goal, MentorNote } from "../common/mto.types.js";

/** Keys that would corrupt documents or trigger driver errors when used in $set. */
function sanitizePatch<T extends object>(patch: T): Partial<T> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (key.includes(".") || key.startsWith("$") || key === "__proto__" || key === "constructor") {
      continue;
    }
    clean[key] = value;
  }
  return clean as Partial<T>;
}

/**
 * Base repository for every multi-tenant MTO Compass collection.
 * Tenant scope comes ONLY from the authenticated request context — never from
 * the request body — so one implementation enforces isolation for all entities.
 */
export abstract class CollectionService<T extends { id: string }> {
  constructor(
    protected readonly dbService: DbService,
    private readonly collectionName: string,
    private readonly idPrefix: string,
  ) {}

  protected tenantScope(): string {
    const tenantId = requestContext.getStore()?.tenantId;
    if (!tenantId) throw new BadRequestException("Workspace context missing");
    return tenantId;
  }

  async findAll(): Promise<T[]> {
    const col = this.dbService.collection(this.collectionName);
    const docs = await col.find({ tenantId: this.tenantScope() }).toArray();
    return docs.map((d) => stripDoc<T>(d as never));
  }

  async create(body: Partial<T>, prepare?: (body: Partial<T>) => Partial<T>): Promise<T> {
    const col = this.dbService.collection(this.collectionName);
    const doc = {
      ...sanitizePatch(body),
      ...(prepare ? prepare(sanitizePatch(body)) : null),
      id: uid(this.idPrefix),
      tenantId: this.tenantScope(),
      createdAt: nowIso(),
    } as unknown as T & Document;
    await col.insertOne(doc as never);
    await recordAudit(this.dbService, "create", this.collectionName, doc.id, this.describe(doc as T));
    return stripDoc<T>(doc as never);
  }

  async update(id: string, patch: Partial<T>): Promise<T | null> {
    const clean = sanitizePatch(patch) as Record<string, unknown>;
    delete clean.id;
    delete clean.tenantId;
    delete clean.createdAt;
    delete clean._id;
    if (!Object.keys(clean).length) throw new BadRequestException("Nothing to update");

    const col = this.dbService.collection(this.collectionName);
    const doc = await col.findOneAndUpdate(
      { id, tenantId: this.tenantScope() },
      { $set: clean },
      { returnDocument: "after" },
    );
    if (!doc) return null;
    await recordAudit(this.dbService, "update", this.collectionName, id, Object.keys(clean).join(", "));
    return stripDoc<T>(doc as never);
  }

  async remove(id: string): Promise<boolean> {
    const col = this.dbService.collection(this.collectionName);
    const result = await col.deleteOne({ id, tenantId: this.tenantScope() });
    if (result.deletedCount > 0) {
      await recordAudit(this.dbService, "delete", this.collectionName, id);
    }
    return result.deletedCount > 0;
  }

  private describe(doc: T): string {
    const title = (doc as { title?: unknown; name?: unknown; text?: unknown }).title ??
      (doc as { name?: unknown }).name ?? (doc as { text?: unknown }).text;
    return typeof title === "string" ? title.slice(0, 80) : "";
  }
}

/** Notification helper — best-effort, never breaks the caller. */
export async function notify(
  dbService: DbService,
  tenantId: string,
  userId: string,
  title: string,
  message: string,
): Promise<void> {
  const doc: MtoNotification = {
    id: uid("ntf"),
    tenantId,
    userId,
    title,
    message,
    read: false,
    at: nowIso(),
  };
  dbService
    .collection<MtoNotification>("notifications")
    .insertOne(doc as never)
    .catch((e) => console.warn("[notify] failed:", String(e)));
}

/** Convenience re-exports keep module files short. */
export type { Rotation, LogEntry, MtoTask, Goal, MentorNote, Review, Programme };
