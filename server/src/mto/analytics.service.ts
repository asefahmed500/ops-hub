import { BadRequestException, Injectable } from "@nestjs/common";
import { DbService } from "../db/db.service.js";
import { requestContext } from "../common/request-context.js";
import { ProgrammeService, RotationsService } from "./mto.services.js";
import { DeptProgressPoint, ReportsBundle, TraineeSummary, UserDoc, WeeklyLogsPoint } from "../common/types.js";

/** Shared HR analytics: trainee progress, reports aggregates. */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dbService: DbService,
    private readonly rotationsService: RotationsService,
    private readonly programmeService: ProgrammeService,
  ) {}

  scope(): string {
    const tenantId = requestContext.getStore()?.tenantId;
    if (!tenantId) throw new BadRequestException("Workspace context missing");
    return tenantId;
  }

  async weeksElapsed(): Promise<number> {
    const programme = await this.programmeService.getMine();
    const start = new Date(programme.startDate).getTime();
    const elapsed = Math.floor((Date.now() - start) / (7 * 86400000)) + 1;
    const cap = Math.max(1, Math.round(programme.lengthMonths * 4.33));
    return Math.min(cap, Math.max(1, elapsed));
  }

  /** Explainable progress: 50% rotation objectives + 25% log activity + 25% reviews approved. */
  async progressFor(traineeId: string, weeks: number): Promise<number> {
    const tenantId = this.scope();
    const rotations = await this.rotationsService.findAll();
    const objTotal = rotations.reduce((s, r) => s + (r.objectives?.length ?? 0), 0);
    const objDone = rotations.reduce((s, r) => s + (r.objectives ?? []).filter((o) => o.done).length, 0);
    const logCount = await this.dbService.collection("logs").countDocuments({ tenantId, authorId: traineeId });
    const reviews = await this.dbService.collection("reviews").find({ tenantId, traineeId }).toArray();
    const revTotal = reviews.length;
    const revApproved = reviews.filter((r) => r.status === "approved").length;
    const objRatio = objTotal ? objDone / objTotal : 0;
    const logRatio = Math.min(1, logCount / Math.max(4, weeks));
    const revRatio = revTotal ? revApproved / revTotal : 0;
    return Math.round((0.5 * objRatio + 0.25 * logRatio + 0.25 * revRatio) * 100);
  }

  async traineeSummaries(): Promise<TraineeSummary[]> {
    const tenantId = this.scope();
    const weeks = await this.weeksElapsed();
    const docs = await this.dbService
      .collection<UserDoc>("users")
      .find({ tenantId, role: "trainee" })
      .toArray();
    const summaries: TraineeSummary[] = [];
    for (const d of docs) {
      const u = d as UserDoc & { _id?: unknown };
      summaries.push({
        id: u.id,
        name: u.name,
        email: u.email,
        dept: u.dept ?? "Orientation",
        week: weeks,
        progress: u.active === false ? 0 : await this.progressFor(u.id, weeks),
        active: u.active !== false,
      });
    }
    return summaries.sort((a, b) => b.progress - a.progress);
  }

  async reports(): Promise<ReportsBundle> {
    const tenantId = this.scope();
    const summaries = await this.traineeSummaries();

    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weeklyLogs: WeeklyLogsPoint[] = [];
    let logsThisWeek = 0;
    for (let w = 7; w >= 0; w--) {
      const start = new Date(monday.getTime() - w * 7 * 86400000);
      const end = new Date(start.getTime() + 7 * 86400000);
      const count = await this.dbService.collection("logs").countDocuments({
        tenantId,
        at: { $gte: start.toISOString(), $lt: end.toISOString() },
      });
      if (w === 0) logsThisWeek = count;
      weeklyLogs.push({
        label: `${String(start.getDate()).padStart(2, "0")} ${start.toLocaleString("en", { month: "short" })}`,
        count,
      });
    }

    const byDept = new Map<string, number[]>();
    for (const t of summaries) {
      const list = byDept.get(t.dept) ?? [];
      list.push(t.progress);
      byDept.set(t.dept, list);
    }
    const deptProgress: DeptProgressPoint[] = [...byDept.entries()].map(([dept, list]) => ({
      dept,
      progress: Math.round(list.reduce((s, p) => s + p, 0) / list.length),
    }));

    return { weeklyLogs, deptProgress, logsThisWeek };
  }
}
