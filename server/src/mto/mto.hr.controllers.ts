import { BadRequestException, Controller, Get, NotFoundException, Param, Post, Query, Request } from "@nestjs/common";
import { DbService } from "../db/db.service.js";
import { notify } from "../db/collection.service.js";
import { AnalyticsService } from "./analytics.service.js";
import {
  GoalsService,
  LogsService,
  NotificationsService,
  ProgrammeService,
  ReviewsService,
  RotationsService,
  TasksService,
} from "./mto.services.js";
import { MtoState, SafeUser, TraineeSummary, UserDoc } from "../common/types.js";

interface CallerReq {
  user: SafeUser;
}

@Controller()
export class MtoHrController {
  constructor(
    private readonly dbService: DbService,
    private readonly analytics: AnalyticsService,
    private readonly logsService: LogsService,
  ) {}

  private scope(): string {
    return this.analytics.scope();
  }

  @Get("trainees")
  async trainees(@Request() req: CallerReq): Promise<TraineeSummary[]> {
    if (req.user.role !== "hr") throw new BadRequestException("HR only");
    return this.analytics.traineeSummaries();
  }

  @Post("trainees/:id/reminder")
  async remind(@Param("id") id: string, @Request() req: CallerReq) {
    if (req.user.role !== "hr") throw new BadRequestException("HR only");
    const tenantId = this.scope();
    const trainee = await this.dbService.collection<UserDoc>("users").findOne({ id, tenantId, role: "trainee" });
    if (!trainee) throw new NotFoundException("Trainee not found");
    await notify(this.dbService, tenantId, trainee.id, "Reminder from HR", "Please update your logs this week");
    return { ok: true };
  }

  @Get("reports")
  async reports(@Request() req: CallerReq) {
    if (req.user.role !== "hr") throw new BadRequestException("HR only");
    return this.analytics.reports();
  }

  @Get("reports/export")
  async exportCsv(@Request() req: CallerReq, @Query("scope") scope?: string): Promise<{ filename: string; content: string }> {
    void scope;
    const tenantId = this.scope();
    const isHr = req.user.role === "hr";
    const programme = await this.dbService.collection("programmes").findOne({ tenantId });
    const canExport = isHr || (programme as { traineesExport?: boolean } | null)?.traineesExport === true;
    if (!canExport) throw new BadRequestException("Exports are disabled by your HR");
    const filter: Record<string, unknown> = { tenantId };
    if (!isHr) filter.authorId = req.user.id;
    const logs = await this.dbService.collection("logs").find(filter).sort({ at: -1 }).toArray();
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      "date,author,text,tags",
      ...(logs as unknown as Array<{ at: string; authorName?: string; text?: string; tags?: string[] }>).map((l) =>
        [l.at, l.authorName ?? "", esc(l.text), esc((l.tags ?? []).join("|"))].join(","),
      ),
    ];
    return {
      filename: isHr ? "mto-logs-export.csv" : "my-logs-export.csv",
      content: rows.join("\n"),
    };
  }
}

@Controller("state")
export class MtoStateController {
  constructor(
    private readonly dbService: DbService,
    private readonly analytics: AnalyticsService,
    private readonly logsService: LogsService,
    private readonly reviewsService: ReviewsService,
    private readonly rotationsService: RotationsService,
    private readonly tasksService: TasksService,
    private readonly goalsService: GoalsService,
    private readonly notificationsService: NotificationsService,
    private readonly programmeService: ProgrammeService,
  ) {}

  @Get()
  async get(@Request() req: CallerReq): Promise<MtoState> {
    const me = req.user;
    const programme = await this.programmeService.getMine();
    const [rotations, logs, tasks, goals, reviews, notifications, mentorNotes] = await Promise.all([
      this.rotationsService.findAll(),
      this.logsService.listForCaller(me),
      this.tasksService.listOwn(me),
      this.goalsService.listOwn(me),
      this.reviewsService.listForCaller(me),
      this.notificationsService.listMine(),
      this.reviewsService.mentorNotesFor(me),
    ]);
    const isHr = me.role === "hr";
    const trainees = isHr ? await this.analytics.traineeSummaries() : [];
    const reports = isHr ? await this.analytics.reports() : null;
    return {
      me,
      programme,
      rotations: rotations.sort((a, b) => a.order - b.order),
      logs,
      tasks,
      goals,
      mentorNotes,
      reviews,
      trainees,
      notifications,
      reports,
    };
  }
}
