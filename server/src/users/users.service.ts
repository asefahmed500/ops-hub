import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DbService, nowIso, uid } from "../db/db.service.js";
import { Role, SafeUser, UserDoc } from "../common/types.js";
import { EMAIL_RE } from "../common/validation.js";
import { recordAudit } from "../common/audit.js";
import { requestContext } from "../common/request-context.js";
import bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DbService) {}

  /** Tenant admins manage their own company only. */
  private scope(): string {
    const tenantId = requestContext.getStore()?.tenantId;
    if (!tenantId) throw new ForbiddenException("Workspace context missing");
    return tenantId;
  }

  private sanitize(u: UserDoc & { _id?: unknown }): SafeUser {
    const { passwordHash: _hash, _id: _oid, ...rest } = u;
    return rest;
  }

  async findAll(): Promise<SafeUser[]> {
    const col = this.dbService.collection<UserDoc>("users");
    return (await col.find({ tenantId: this.scope() }).toArray()).map((u) => this.sanitize(u));
  }

  async create(body: { name?: string; email?: string; password?: string; role?: Role }): Promise<SafeUser> {
    const { name, email, password, role } = body || {};
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || !password) {
      throw new BadRequestException("Name, email and password are required");
    }
    // Same rules as company registration so both account paths are identical
    if (!EMAIL_RE.test(email.trim())) {
      throw new BadRequestException("Please enter a valid email address");
    }
    if (typeof password !== "string" || password.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }
    const tenantId = this.scope();
    const col = this.dbService.collection<UserDoc>("users");
    const exists = await col.findOne({ email: email.toLowerCase().trim() });
    if (exists) throw new ConflictException("A user with this email already exists");

    const doc: UserDoc = {
      id: uid("usr"),
      tenantId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: bcrypt.hashSync(password, 10),
      role: role === "hr" ? "hr" : "trainee",
      active: true,
      createdAt: nowIso(),
    };
    await col.insertOne(doc);
    await recordAudit(this.dbService, "create", "users", doc.id, `${doc.role} — ${doc.email}`);
    return this.sanitize(doc);
  }

  async update(
    id: string,
    body: { name?: string; role?: Role; password?: string; active?: boolean },
    requestingUser: SafeUser,
  ): Promise<SafeUser> {
    const { name, role, password, active } = body || {};
    const patch: Partial<UserDoc> = {};
    if (name != null) {
      if (typeof name !== "string" || !name.trim()) throw new BadRequestException("Invalid name");
      patch.name = name.trim();
    }
    if (role != null) {
      if (requestingUser.id === id && role !== requestingUser.role) {
        throw new BadRequestException("You cannot change your own role");
      }
      patch.role = role === "hr" ? "hr" : "trainee";
    }
    if (password) {
      if (typeof password !== "string" || password.length < 8) {
        throw new BadRequestException("Password must be at least 8 characters");
      }
      patch.passwordHash = bcrypt.hashSync(password, 10);
    }
    if (typeof active === "boolean") {
      if (requestingUser.id === id && !active) {
        throw new BadRequestException("You cannot deactivate your own account");
      }
      patch.active = active;
    }
    if (!Object.keys(patch).length) throw new BadRequestException("Nothing to update");

    const col = this.dbService.collection<UserDoc>("users");
    const doc = await col.findOneAndUpdate({ id, tenantId: this.scope() }, { $set: patch }, { returnDocument: "after" });
    if (!doc) throw new NotFoundException("User not found");

    // Keep denormalized display names in sync after a rename
    if (patch.name) {
      const db = this.dbService.db;
      await Promise.all([
        db.collection("tasks").updateMany({ assigneeId: id }, { $set: { assignee: patch.name } }),
        db.collection("fieldJobs").updateMany({ technicianId: id }, { $set: { technician: patch.name } }),
        db.collection("incidents").updateMany({ reportedById: id }, { $set: { reportedBy: patch.name } }),
        db.collection("sops").updateMany({ ownerId: id }, { $set: { owner: patch.name } }),
      ]);
    }
    const changes = Object.keys(patch)
      .filter((k) => k !== "passwordHash")
      .join(", ");
    await recordAudit(this.dbService, patch.active === false ? "deactivate" : "update", "users", id, changes);
    return this.sanitize(doc);
  }

  async remove(id: string, requestingUser: SafeUser): Promise<{ ok: boolean }> {
    if (requestingUser.id === id) throw new BadRequestException("You cannot delete your own account");
    const tenantId = this.scope();
    const col = this.dbService.collection<UserDoc>("users");
    const result = await col.updateOne({ id, tenantId }, { $set: { active: false } });
    if (!result.matchedCount) throw new NotFoundException("User not found");

    // Unassign pending tasks and field jobs from deactivated user (within this tenant)
    const db = this.dbService.db;
    await Promise.all([
      db.collection("tasks").updateMany({ assigneeId: id, tenantId, status: { $ne: "done" } }, { $set: { assigneeId: null, assignee: "Unassigned" } }),
      db.collection("fieldJobs").updateMany({ technicianId: id, tenantId, status: { $nin: ["completed", "cancelled"] } }, { $set: { technicianId: null, technician: "Unassigned" } }),
    ]);

    await recordAudit(this.dbService, "deactivate", "users", id, `deactivated by ${requestingUser.name}`);
    return { ok: true };
  }
}
