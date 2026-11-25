import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CollectionService, notify } from "../db/collection.service.js";
import { DbService, nowIso, stripDoc, uid } from "../db/db.service.js";
import { requestContext } from "../common/request-context.js";
import {
  Goal,
  LogEntry,
  MentorNote,
  MtoNotification,
  MtoTask,
  Programme,
  Review,
  ReviewStatus,
  Rotation,
  RotationObjective,
  RotationStatus,
  SafeUser,
  TraineeSummary,
} from "../common/types.js";

function ctx() {
  const store = requestContext.getStore();
  if (!store?.tenantId || !store.userId) throw new ForbiddenException("Workspace context missing");
  return store;
}

@Injectable()
export class RotationsService extends CollectionService<Rotation> {
  constructor(dbService: DbService) {
    super(dbService, "rotations", "rot");
  }

  async reorderless() {
    return this.findAll();
  }

  async setStatus(id: string, status: RotationStatus): Promise<Rotation> {
    if (!["done", "active", "upcoming"].includes(status)) throw new BadRequestException("Invalid rotation status");
    const doc = await this.update(id, { status } as Partial<Rotation>);
    if (!doc) throw new NotFoundException("Rotation not found");
    return doc;
  }

  /** Trainee toggles an objective checkbox on the ACTIVE (or any) rotation. */
  async toggleObjective(rotationId: string, objectiveId: string): Promise<Rotation> {
    const rotation = await this.findAll().then((rs) => rs.find((r) => r.id === rotationId));
    if (!rotation) throw new NotFoundException("Rotation not found");
    const objectives: RotationObjective[] = (rotation.objectives ?? []).map((o) =>
      o.id === objectiveId ? { ...o, done: !o.done } : o,
    );
    const doc = await this.update(rotationId, { objectives } as Partial<Rotation>);
    if (!doc) throw new NotFoundException("Rotation not found");
    return doc;
  }

  async createRotation(body: { name?: string; window?: string; status?: string; objectives?: string[] }): Promise<Rotation> {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) throw new BadRequestException("Rotation name is required");
    const all = await this.findAll();
    const objectives: RotationObjective[] = (body.objectives ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => ({ id: uid("obj"), title: t, done: false }));
    return this.create({
      name,
      window: (typeof body.window === "string" && body.window.trim()) || "",
      status: (["done", "active", "upcoming"].includes(body.status as string) ? body.status : "upcoming") as RotationStatus,
      order: all.length,
      objectives,
    } as Partial<Rotation>);
  }
}

@Injectable()
export class LogsService extends CollectionService<LogEntry> {
  constructor(dbService: DbService) {
    super(dbService, "logs", "log");
  }

  async listForCaller(caller: SafeUser): Promise<LogEntry[]> {
    const all = await this.findAll();
    const scoped = caller.role === "hr" ? all : all.filter((l) => l.authorId === caller.id);
    return scoped.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
  }

  async createLog(body: { text?: string; tags?: string[] }, caller: SafeUser): Promise<LogEntry> {
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) throw new BadRequestException("Write something first");
    const tags = Array.isArray(body.tags) ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6) : [];
    return this.create({
      text,
      tags: tags.length ? tags : ["General"],
      authorId: caller.id,
      authorName: caller.name,
      at: nowIso(),
    } as Partial<LogEntry>);
  }

  /** Only the author (or an HR admin) may change or remove a log. */
  private canManage(item: LogEntry, caller: SafeUser): void {
    if (caller.role !== "hr" && item.authorId !== caller.id) {
      throw new NotFoundException("Log not found");
    }
  }

  async updateForCaller(id: string, body: { text?: string; tags?: string[] }, caller: SafeUser): Promise<LogEntry> {
    const log = (await this.findAll()).find((l) => l.id === id);
    if (!log) throw new NotFoundException("Log not found");
    this.canManage(log, caller);
    const patch: Partial<LogEntry> = {};
    if (typeof body?.text === "string") {
      const text = body.text.trim();
      if (!text) throw new BadRequestException("Write something first");
      patch.text = text;
    }
    if (Array.isArray(body?.tags)) patch.tags = body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6);
    const doc = await this.update(id, patch);
    if (!doc) throw new NotFoundException("Log not found");
    return doc;
  }

  async removeForCaller(id: string, caller: SafeUser): Promise<boolean> {
    const log = (await this.findAll()).find((l) => l.id === id);
    if (!log) throw new NotFoundException("Log not found");
    this.canManage(log, caller);
    return this.remove(id);
  }
}

@Injectable()
export class TasksService extends CollectionService<MtoTask> {
  constructor(dbService: DbService) {
    super(dbService, "mtoTasks", "mtask");
  }

  ownOnly(item: MtoTask, caller: SafeUser): void {
    if (item.ownerId !== caller.id) throw new NotFoundException("Task not found");
  }

  async listOwn(caller: SafeUser): Promise<MtoTask[]> {
    const mine = (await this.findAll()).filter((t) => t.ownerId === caller.id);
    return mine.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async createTask(body: { title?: string; due?: string }, caller: SafeUser): Promise<MtoTask> {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) throw new BadRequestException("Task title is required");
    return this.create({
      title,
      due: (typeof body.due === "string" && body.due.trim()) || "Today",
      done: false,
      ownerId: caller.id,
    } as Partial<MtoTask>);
  }

  async setDone(id: string, done: boolean, caller: SafeUser): Promise<MtoTask> {
    const task = (await this.findAll()).find((t) => t.id === id);
    if (!task) throw new NotFoundException("Task not found");
    this.ownOnly(task, caller);
    const doc = await this.update(id, { done } as Partial<MtoTask>);
    if (!doc) throw new NotFoundException("Task not found");
    return doc;
  }

  async removeForCaller(id: string, caller: SafeUser): Promise<boolean> {
    const task = (await this.findAll()).find((t) => t.id === id);
    if (!task) throw new NotFoundException("Task not found");
    this.ownOnly(task, caller);
    return this.remove(id);
  }
}

@Injectable()
export class GoalsService extends CollectionService<Goal> {
  constructor(dbService: DbService) {
    super(dbService, "goals", "goal");
  }

  async listOwn(caller: SafeUser): Promise<Goal[]> {
    return (await this.findAll()).filter((g) => g.ownerId === caller.id);
  }

  async createGoal(body: { title?: string }, caller: SafeUser): Promise<Goal> {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) throw new BadRequestException("Goal title is required");
    return this.create({ title, progress: 0, ownerId: caller.id } as Partial<Goal>);
  }

  async addProgress(id: string, delta: number, caller: SafeUser): Promise<Goal> {
    const goal = (await this.findAll()).find((g) => g.id === id);
    if (!goal) throw new NotFoundException("Goal not found");
    if (goal.ownerId !== caller.id) throw new NotFoundException("Goal not found");
    if (!Number.isFinite(delta)) throw new BadRequestException("Invalid progress delta");
    const progress = Math.max(0, Math.min(100, (goal.progress ?? 0) + delta));
    const doc = await this.update(id, { progress } as Partial<Goal>);
    if (!doc) throw new NotFoundException("Goal not found");
    return doc;
  }

  async removeForCaller(id: string, caller: SafeUser): Promise<boolean> {
    const goal = (await this.findAll()).find((g) => g.id === id);
    if (!goal || goal.ownerId !== caller.id) throw new NotFoundException("Goal not found");
    return this.remove(id);
  }
}

@Injectable()
export class ReviewsService extends CollectionService<Review> {
  constructor(dbService: DbService) {
    super(dbService, "reviews", "rvw");
  }

  async listForCaller(caller: SafeUser): Promise<Review[]> {
    const all = await this.findAll();
    return (caller.role === "hr" ? all : all.filter((r) => r.traineeId === caller.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createReview(
    body: { traineeId?: string; dept?: string; kind?: string; due?: string },
    caller: SafeUser,
  ): Promise<Review> {
    if (caller.role !== "hr") throw new ForbiddenException("HR only");
    const traineeId = typeof body.traineeId === "string" ? body.traineeId : "";
    if (!traineeId) throw new BadRequestException("Select a trainee");
    const tenantId = requestContext.getStore()?.tenantId ?? "";
    const trainee = await this.dbService.collection("users").findOne({ id: traineeId, tenantId, role: "trainee" });
    if (!trainee) throw new NotFoundException("Trainee not found");
    const doc = await this.create({
      traineeId,
      traineeName: (trainee as { name?: string }).name ?? "Trainee",
      dept: (typeof body.dept === "string" && body.dept.trim()) || (trainee as { dept?: string }).dept || "General",
      kind: (typeof body.kind === "string" && body.kind.trim()) || "evaluation",
      due: (typeof body.due === "string" && body.due.trim()) || "This week",
      status: "pending",
      rating: null,
      comment: "",
    } as Partial<Review>);
    await notify(
      this.dbService,
      (doc as Review).tenantId,
      traineeId,
      "Review submitted",
      `${caller.name} added a ${(body.kind ?? "evaluation")} review for you`,
    );
    return doc;
  }

  async decide(
    id: string,
    outcome: "approved" | "changes_requested",
    rating: number | null,
    comment: string,
    caller: SafeUser,
  ): Promise<Review> {
    if (caller.role !== "hr") throw new ForbiddenException("HR only");
    const review = (await this.findAll()).find((r) => r.id === id);
    if (!review) throw new NotFoundException("Review not found");
    if (review.status !== "pending") throw new BadRequestException("Review already decided");
    const safeRating = Number.isFinite(rating) ? Math.max(1, Math.min(5, Math.round(rating as number))) : null;
    if (outcome === "approved" && !safeRating) throw new BadRequestException("Give a rating first");
    const doc = await this.update(id, {
      status: outcome as ReviewStatus,
      rating: safeRating,
      comment: (comment ?? "").trim(),
      decidedAt: nowIso(),
    } as Partial<Review>);
    if (!doc) throw new NotFoundException("Review not found");
    await notify(
      this.dbService,
      review.tenantId,
      review.traineeId,
      outcome === "approved" ? "Review approved" : "Changes requested",
      outcome === "approved"
        ? `Your ${review.kind} review was approved${safeRating ? ` (${safeRating}/5)` : ""}`
        : `HR asked for updates on your ${review.kind} review`,
    );
    return doc;
  }

  async addMentorNote(body: { traineeId?: string; text?: string }, caller: SafeUser): Promise<MentorNote> {
    if (caller.role !== "hr") throw new ForbiddenException("HR only");
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const traineeId = typeof body.traineeId === "string" ? body.traineeId : "";
    if (!traineeId || !text) throw new BadRequestException("Trainee and note text are required");
    const tenantId = requestContext.getStore()?.tenantId ?? "";
    const trainee = await this.dbService.collection("users").findOne({ id: traineeId, tenantId, role: "trainee" });
    if (!trainee) throw new NotFoundException("Trainee not found");
    const col = this.dbService.collection<MentorNote>("mentorNotes");
    const doc = { id: uid("note"), tenantId, traineeId, authorName: caller.name, text, at: nowIso() } as never;
    await col.insertOne(doc);
    return doc as unknown as MentorNote;
  }

  async mentorNotesFor(caller: SafeUser): Promise<MentorNote[]> {
    const tenantId = requestContext.getStore()?.tenantId ?? "";
    const filter = caller.role === "hr" ? { tenantId } : { tenantId, traineeId: caller.id };
    const docs = await this.dbService.collection<MentorNote>("mentorNotes").find(filter).toArray();
    return docs.map((d) => ({ ...(d as unknown as MentorNote) })).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
  }
}

@Injectable()
export class NotificationsService {
  constructor(private readonly dbService: DbService) {}

  private scope() {
    const store = ctx();
    return { tenantId: store.tenantId, userId: store.userId };
  }

  async listMine(): Promise<MtoNotification[]> {
    const { tenantId, userId } = this.scope();
    const docs = await this.dbService
      .collection<MtoNotification>("notifications")
      .find({ tenantId, userId })
      .sort({ at: -1 })
      .limit(50)
      .toArray();
    return docs.map((d) => ({ ...d }) as MtoNotification);
  }

  async markRead(id: string): Promise<void> {
    const { tenantId, userId } = this.scope();
    await this.dbService
      .collection<MtoNotification>("notifications")
      .updateOne({ id, tenantId, userId }, { $set: { read: true } });
  }

  async markAllRead(): Promise<void> {
    const { tenantId, userId } = this.scope();
    await this.dbService
      .collection<MtoNotification>("notifications")
      .updateMany({ tenantId, userId, read: false }, { $set: { read: true } });
  }
}

@Injectable()
export class ProgrammeService extends CollectionService<Programme> {
  constructor(dbService: DbService) {
    super(dbService, "programmes", "prg");
  }

  async getForTenant(tenantId: string): Promise<Programme> {
    const existing = await this.dbService.collection<Programme>("programmes").findOne({ tenantId });
    if (existing) return stripDoc<Programme>(existing as never);
    const col = this.dbService.collection<Programme>("programmes");
    const doc = {
      id: uid("prg"),
      tenantId,
      lengthMonths: 12,
      startDate: new Date().toISOString().slice(0, 10),
      language: "en",
      supervisorsViewLogs: true,
      traineesExport: true,
      createdAt: nowIso(),
    } as never;
    await col.insertOne(doc as never);
    return stripDoc<Programme>(doc as never);
  }

  async getMine(): Promise<Programme> {
    return this.getForTenant(this.tenantScope());
  }

  async updateSettings(patch: { lengthMonths?: number; startDate?: string; language?: string; supervisorsViewLogs?: boolean; traineesExport?: boolean }): Promise<Programme> {
    const allowed: Partial<Programme> = {};
    if (patch.lengthMonths != null && [6, 12, 18].includes(patch.lengthMonths)) allowed.lengthMonths = patch.lengthMonths;
    if (typeof patch.startDate === "string" && patch.startDate.trim()) allowed.startDate = patch.startDate.trim();
    if (patch.language === "en" || patch.language === "bn") allowed.language = patch.language;
    if (typeof patch.supervisorsViewLogs === "boolean") allowed.supervisorsViewLogs = patch.supervisorsViewLogs;
    if (typeof patch.traineesExport === "boolean") allowed.traineesExport = patch.traineesExport;
    if (!Object.keys(allowed).length) throw new BadRequestException("Nothing to update");
    const current = await this.getMine();
    const doc = await this.update(current.id, allowed);
    if (!doc) throw new NotFoundException("Programme not found");
    return doc;
  }
}


