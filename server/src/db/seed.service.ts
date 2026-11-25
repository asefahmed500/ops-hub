import { Injectable, OnModuleInit } from "@nestjs/common";
import { DbService, nowIso } from "./db.service.js";
import bcrypt from "bcryptjs";
import { Goal, LogEntry, MentorNote, MtoTask, Programme, Review, Rotation, RotationObjective } from "../common/types.js";

export const DEMO_TENANT_ID = "tnt_demo";
export const PLATFORM_TENANT_ID = "tnt_platform";

const ALL_TENANT_COLLECTIONS = [
  "users",
  "notifications",
  "rotations",
  "logs",
  "mtoTasks",
  "goals",
  "reviews",
  "mentorNotes",
  "programmes",
  "auditLog",
];

const ROTATION_TEMPLATE: Array<{ name: string; window: string; status: Rotation["status"]; objectives: string[] }> = [
  { name: "Finance", window: "Jan – Feb", status: "done", objectives: ["Budget basics", "Month-end close", "Cash-flow report"] },
  { name: "Marketing", window: "Mar – Apr", status: "active", objectives: ["Campaign planning", "Dealer visits", "Market report", "Social metrics"] },
  { name: "Operations", window: "May – Jun", status: "upcoming", objectives: ["Supply chain", "Quality checks"] },
  { name: "Sales", window: "Jul – Aug", status: "upcoming", objectives: ["Pipeline", "Client calls"] },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly dbService: DbService) {}

  /** Turn a company name into a unique URL-safe slug. */
  async slugify(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "workspace";
    const tenants = this.dbService.collection("tenants");
    let slug = base;
    let n = 2;
    while (await tenants.findOne({ slug })) {
      slug = `${base}-${n}`;
      n++;
    }
    return slug;
  }

  async onModuleInit(): Promise<void> {
    await this.ensureSystemTenants();
    await this.migrateExistingData();
    await this.seedDemoTenant();
    await this.ensureIndexes();
    console.log("[seed] MTO Compass tenant bootstrap complete");
  }

  private async ensureSystemTenants(): Promise<void> {
    const tenants = this.dbService.collection("tenants");
    if (!(await tenants.findOne({ id: DEMO_TENANT_ID }))) {
      await tenants.insertOne({
        id: DEMO_TENANT_ID,
        name: "MTO Compass Demo",
        slug: "demo",
        inviteCode: "MTO-DEMO-2026",
        status: "active",
        createdAt: nowIso(),
      } as never);
    }
    if (!(await tenants.findOne({ id: PLATFORM_TENANT_ID }))) {
      await tenants.insertOne({
        id: PLATFORM_TENANT_ID,
        name: "OpsHub Platform",
        slug: "platform",
        inviteCode: "PLATFORM",
        status: "active",
        createdAt: nowIso(),
      } as never);
    }

    const users = this.dbService.collection("users");
    if (!(await users.findOne({ email: "platform@opshub.local" }))) {
      await users.insertOne({
        id: "usr_platform",
        tenantId: PLATFORM_TENANT_ID,
        name: "Platform Admin",
        email: "platform@opshub.local",
        passwordHash: bcrypt.hashSync("platform123", 10),
        role: "platform_admin",
        active: true,
        createdAt: nowIso(),
      } as never);
      console.log("[seed] platform admin created (platform@opshub.local / platform123)");
    }
  }

  /** One-time migration: stamp existing documents into the demo tenant. Idempotent. */
  private async migrateExistingData(): Promise<void> {
    for (const name of ALL_TENANT_COLLECTIONS) {
      const result = await this.dbService
        .collection(name)
        .updateMany({ tenantId: { $exists: false } }, { $set: { tenantId: DEMO_TENANT_ID } });
      if (result.modifiedCount) console.log(`[seed] migrated ${result.modifiedCount} ${name} docs into demo tenant`);
    }
  }

  private async insertUser(doc: Record<string, unknown>): Promise<void> {
    const users = this.dbService.collection("users");
    if (!(await users.findOne({ email: doc.email as string }))) {
      await users.insertOne({ active: true, createdAt: nowIso(), ...doc } as never);
    }
  }

  private async seedDemoTenant(): Promise<void> {
    const users = this.dbService.collection("users");
    if ((await users.countDocuments({ tenantId: DEMO_TENANT_ID })) > 0) return;

    const hash = (pw: string) => bcrypt.hashSync(pw, 10);
    await this.insertUser({ id: "usr_hr", tenantId: DEMO_TENANT_ID, name: "Mr. Rahman", email: "hr@opshub.local", passwordHash: hash("hr123456"), role: "hr" });
    await this.insertUser({ id: "usr_nusrat", tenantId: DEMO_TENANT_ID, name: "Nusrat Jahan", email: "nusrat@opshub.local", passwordHash: hash("trainee123"), role: "trainee", dept: "Marketing" });
    await this.insertUser({ id: "usr_tanvir", tenantId: DEMO_TENANT_ID, name: "Tanvir Hasan", email: "tanvir@opshub.local", passwordHash: hash("trainee123"), role: "trainee", dept: "Finance" });
    await this.insertUser({ id: "usr_mim", tenantId: DEMO_TENANT_ID, name: "Mim Akter", email: "mim@opshub.local", passwordHash: hash("trainee123"), role: "trainee", dept: "Operations" });
    await this.insertUser({ id: "usr_rafi", tenantId: DEMO_TENANT_ID, name: "Rafi Ahmed", email: "rafi@opshub.local", passwordHash: hash("trainee123"), role: "trainee", dept: "Sales" });
    console.log("[seed] demo MTO company created — HR: hr@opshub.local / hr123456 · trainees: nusrat@opshub.local / trainee123");

    const obj = (title: string, done = false): RotationObjective => ({ id: `obj_${Math.random().toString(36).slice(2, 8)}`, title, done });
    const rotationsCol = this.dbService.collection("rotations");
    if ((await rotationsCol.countDocuments({ tenantId: DEMO_TENANT_ID })) === 0) {
      const docs = ROTATION_TEMPLATE.map((r, i) => ({
        id: `rot_${i + 1}`,
        tenantId: DEMO_TENANT_ID,
        name: r.name,
        window: r.window,
        status: r.status,
        order: i,
        objectives: r.objectives.map((t) => obj(t, r.status === "done" || (r.status === "active" && t === "Campaign planning"))),
        createdAt: nowIso(),
      }));
      await rotationsCol.insertMany(docs as never);
    }

    const logsCol = this.dbService.collection<LogEntry>("logs");
    if ((await logsCol.countDocuments({ tenantId: DEMO_TENANT_ID })) === 0) {
      const logs: LogEntry[] = [
        { id: "log_1", tenantId: DEMO_TENANT_ID, authorId: "usr_nusrat", authorName: "Nusrat Jahan", text: "Dealer visit notes, Chattogram", tags: ["Marketing", "Dealers"], at: daysAgo(1), createdAt: daysAgo(1) },
        { id: "log_2", tenantId: DEMO_TENANT_ID, authorId: "usr_nusrat", authorName: "Nusrat Jahan", text: "Drafted Q2 campaign brief", tags: ["Reporting"], at: daysAgo(3), createdAt: daysAgo(3) },
        { id: "log_3", tenantId: DEMO_TENANT_ID, authorId: "usr_tanvir", authorName: "Tanvir Hasan", text: "Month-end close walkthrough with Finance lead", tags: ["Finance"], at: daysAgo(2), createdAt: daysAgo(2) },
        { id: "log_4", tenantId: DEMO_TENANT_ID, authorId: "usr_mim", authorName: "Mim Akter", text: "Warehouse quality checklist trial run", tags: ["Operations"], at: daysAgo(1), createdAt: daysAgo(1) },
      ];
      await logsCol.insertMany(logs as never);
    }

    const tasksCol = this.dbService.collection<MtoTask>("mtoTasks");
    if ((await tasksCol.countDocuments({ tenantId: DEMO_TENANT_ID })) === 0) {
      const tasks: MtoTask[] = [
        { id: "mtask_1", tenantId: DEMO_TENANT_ID, ownerId: "usr_nusrat", title: "Send Q2 campaign report", due: "5 PM", done: false, createdAt: daysAgo(1) },
        { id: "mtask_2", tenantId: DEMO_TENANT_ID, ownerId: "usr_nusrat", title: "1:1 with mentor", due: "3 PM", done: false, createdAt: daysAgo(1) },
        { id: "mtask_3", tenantId: DEMO_TENANT_ID, ownerId: "usr_nusrat", title: "Update dealer list", due: "Fri", done: true, createdAt: daysAgo(4) },
      ];
      await tasksCol.insertMany(tasks as never);
    }

    const goalsCol = this.dbService.collection<Goal>("goals");
    if ((await goalsCol.countDocuments({ tenantId: DEMO_TENANT_ID })) === 0) {
      const goals: Goal[] = [
        { id: "goal_1", tenantId: DEMO_TENANT_ID, ownerId: "usr_nusrat", title: "Excel for business", progress: 70, createdAt: daysAgo(20) },
        { id: "goal_2", tenantId: DEMO_TENANT_ID, ownerId: "usr_nusrat", title: "Business writing (Bangla/English)", progress: 30, createdAt: daysAgo(15) },
      ];
      await goalsCol.insertMany(goals as never);
    }

    const notesCol = this.dbService.collection<MentorNote>("mentorNotes");
    if ((await notesCol.countDocuments({ tenantId: DEMO_TENANT_ID })) === 0) {
      const note: MentorNote = { id: "note_1", tenantId: DEMO_TENANT_ID, traineeId: "usr_nusrat", authorName: "Mr. Rahman", text: "Good ownership. Work on presenting numbers.", at: daysAgo(6) };
      await notesCol.insertOne(note as never);
    }

    const reviewsCol = this.dbService.collection<Review>("reviews");
    if ((await reviewsCol.countDocuments({ tenantId: DEMO_TENANT_ID })) === 0) {
      const reviews: Review[] = [
        { id: "rvw_1", tenantId: DEMO_TENANT_ID, traineeId: "usr_tanvir", traineeName: "Tanvir Hasan", dept: "Finance", kind: "evaluation", due: "Due Fri", status: "pending", rating: null, comment: "", createdAt: daysAgo(2), decidedAt: null },
        { id: "rvw_2", tenantId: DEMO_TENANT_ID, traineeId: "usr_rafi", traineeName: "Rafi Ahmed", dept: "Sales", kind: "mid-term", due: "Due 8 Nov", status: "pending", rating: null, comment: "", createdAt: daysAgo(1), decidedAt: null },
        { id: "rvw_3", tenantId: DEMO_TENANT_ID, traineeId: "usr_mim", traineeName: "Mim Akter", dept: "Operations", kind: "orientation", due: "Done", status: "approved", rating: 4, comment: "Solid start.", createdAt: daysAgo(10), decidedAt: daysAgo(8) },
      ];
      await reviewsCol.insertMany(reviews as never);
    }

    const progCol = this.dbService.collection<Programme>("programmes");
    if ((await progCol.countDocuments({ tenantId: DEMO_TENANT_ID })) === 0) {
      const programme: Programme = {
        id: "prg_demo",
        tenantId: DEMO_TENANT_ID,
        lengthMonths: 12,
        startDate: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10),
        language: "en",
        supervisorsViewLogs: true,
        traineesExport: true,
        createdAt: nowIso(),
      };
      await progCol.insertOne(programme as never);
    }
  }

  /** Clone the programme skeleton (rotations + settings) for a freshly registered company. */
  async cloneStarterTemplate(tenantId: string): Promise<void> {
    const rotationsCol = this.dbService.collection("rotations");
    if ((await rotationsCol.countDocuments({ tenantId })) === 0) {
      const docs = ROTATION_TEMPLATE.map((r, i) => ({
        id: `rot_${tenantId.slice(-6)}_${i}`,
        tenantId,
        name: r.name,
        window: r.window,
        status: "upcoming",
        order: i,
        objectives: r.objectives.map((title) => ({ id: `obj_${Math.random().toString(36).slice(2, 8)}`, title, done: false })),
        createdAt: nowIso(),
      }));
      await rotationsCol.insertMany(docs as never);
    }
    const progCol = this.dbService.collection<Programme>("programmes");
    if ((await progCol.countDocuments({ tenantId })) === 0) {
      await progCol.insertOne({
        id: `prg_${tenantId.slice(-8)}`,
        tenantId,
        lengthMonths: 12,
        startDate: new Date().toISOString().slice(0, 10),
        language: "en",
        supervisorsViewLogs: true,
        traineesExport: true,
        createdAt: nowIso(),
      } as never);
    }
    console.log(`[seed] programme template cloned into tenant ${tenantId}`);
  }

  private async ensureIndexes(): Promise<void> {
    try {
      await Promise.all([
        this.dbService.collection("tenants").createIndexes([
          { key: { id: 1 }, unique: true },
          { key: { slug: 1 }, unique: true },
          { key: { inviteCode: 1 } },
        ]),
        this.dbService.collection("users").createIndexes([
          { key: { id: 1 }, unique: true },
          { key: { email: 1 }, unique: true },
          { key: { tenantId: 1, role: 1 } },
        ]),
        this.dbService.collection("rotations").createIndexes([
          { key: { tenantId: 1, id: 1 }, unique: true },
          { key: { tenantId: 1, order: 1 } },
        ]),
        this.dbService.collection("logs").createIndexes([
          { key: { tenantId: 1, id: 1 }, unique: true },
          { key: { tenantId: 1, authorId: 1, at: -1 } },
        ]),
        this.dbService.collection("mtoTasks").createIndexes([
          { key: { tenantId: 1, id: 1 }, unique: true },
          { key: { tenantId: 1, ownerId: 1 } },
        ]),
        this.dbService.collection("goals").createIndexes([
          { key: { tenantId: 1, id: 1 }, unique: true },
          { key: { tenantId: 1, ownerId: 1 } },
        ]),
        this.dbService.collection("reviews").createIndexes([
          { key: { tenantId: 1, id: 1 }, unique: true },
          { key: { tenantId: 1, traineeId: 1, status: 1 } },
        ]),
        this.dbService.collection("notifications").createIndexes([
          { key: { id: 1 }, unique: true },
          { key: { tenantId: 1, userId: 1, at: -1 } },
        ]),
        this.dbService.collection("mentorNotes").createIndexes([
          { key: { id: 1 }, unique: true },
          { key: { tenantId: 1, traineeId: 1, at: -1 } },
        ]),
        this.dbService.collection("programmes").createIndexes([
          { key: { id: 1 }, unique: true },
          { key: { tenantId: 1 }, unique: true },
        ]),
        this.dbService.collection("auditLog").createIndexes([
          { key: { id: 1 }, unique: true },
          { key: { tenantId: 1, at: -1 } },
        ]),
      ]);
      console.log("[seed] MTO indexes ensured");
    } catch (e) {
      console.warn("[seed] Index creation warning:", e);
    }
  }
}
