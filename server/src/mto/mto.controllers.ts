import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Request } from "@nestjs/common";
import {
  GoalsService,
  LogsService,
  NotificationsService,
  ProgrammeService,
  ReviewsService,
  RotationsService,
  TasksService,
} from "./mto.services.js";
import { SafeUser } from "../common/types.js";

interface CallerReq {
  user: SafeUser;
}

@Controller()
export class MtoController {
  constructor(
    private readonly rotations: RotationsService,
    private readonly logs: LogsService,
    private readonly tasks: TasksService,
    private readonly goals: GoalsService,
    private readonly reviews: ReviewsService,
    private readonly notifications: NotificationsService,
    private readonly programme: ProgrammeService,
  ) {}

  /* --- rotations --- */
  @Get("rotations")
  rotationsList() {
    return this.rotations.findAll();
  }

  @Post("rotations")
  rotationsCreate(@Body() body: { name?: string; window?: string; status?: string; objectives?: string[] }, @Request() req: CallerReq) {
    if (req.user.role !== "hr") throw new BadRequestException("HR only");
    return this.rotations.createRotation(body);
  }

  @Patch("rotations/:id")
  rotationsPatch(@Param("id") id: string, @Body() body: { status?: string }, @Request() req: CallerReq) {
    if (req.user.role !== "hr") throw new BadRequestException("HR only");
    return this.rotations.setStatus(id, body?.status as never);
  }

  @Post("rotations/:id/objectives/:objectiveId/toggle")
  objectiveToggle(@Param("id") id: string, @Param("objectiveId") objectiveId: string) {
    return this.rotations.toggleObjective(id, objectiveId);
  }

  /* --- logs --- */
  @Get("logs")
  logsList(@Request() req: CallerReq) {
    return this.logs.listForCaller(req.user);
  }

  @Post("logs")
  logsCreate(@Body() body: { text?: string; tags?: string[] }, @Request() req: CallerReq) {
    return this.logs.createLog(body, req.user);
  }

  @Patch("logs/:id")
  logsUpdate(@Param("id") id: string, @Body() body: { text?: string; tags?: string[] }, @Request() req: CallerReq) {
    return this.logs.updateForCaller(id, body, req.user);
  }

  @Post("logs/:id/delete")
  logsDelete(@Param("id") id: string, @Request() req: CallerReq) {
    return this.logs.removeForCaller(id, req.user);
  }

  /* --- tasks --- */
  @Get("mto-tasks")
  tasksList(@Request() req: CallerReq) {
    return this.tasks.listOwn(req.user);
  }

  @Post("mto-tasks")
  tasksCreate(@Body() body: { title?: string; due?: string }, @Request() req: CallerReq) {
    return this.tasks.createTask(body, req.user);
  }

  @Patch("mto-tasks/:id")
  async tasksToggle(@Param("id") id: string, @Body() body: { done?: boolean }, @Request() req: CallerReq) {
    return this.tasks.setDone(id, body?.done === true, req.user);
  }

  @Post("mto-tasks/:id/delete")
  tasksDelete(@Param("id") id: string, @Request() req: CallerReq) {
    return this.tasks.removeForCaller(id, req.user);
  }

  /* --- goals --- */
  @Get("goals")
  goalsList(@Request() req: CallerReq) {
    return this.goals.listOwn(req.user);
  }

  @Post("goals")
  goalsCreate(@Body() body: { title?: string }, @Request() req: CallerReq) {
    return this.goals.createGoal(body, req.user);
  }

  @Post("goals/:id/progress")
  goalsProgress(@Param("id") id: string, @Body() body: { delta?: number }, @Request() req: CallerReq) {
    return this.goals.addProgress(id, Number(body?.delta ?? 10), req.user);
  }

  @Post("goals/:id/delete")
  goalsDelete(@Param("id") id: string, @Request() req: CallerReq) {
    return this.goals.removeForCaller(id, req.user);
  }

  /* --- reviews + mentor notes --- */
  @Get("reviews")
  reviewsList(@Request() req: CallerReq) {
    return this.reviews.listForCaller(req.user);
  }

  @Post("reviews")
  reviewsCreate(@Body() body: { traineeId?: string; dept?: string; kind?: string; due?: string }, @Request() req: CallerReq) {
    return this.reviews.createReview(body, req.user);
  }

  @Post("reviews/:id/decide")
  reviewsDecide(
    @Param("id") id: string,
    @Body() body: { outcome?: string; rating?: number; comment?: string },
    @Request() req: CallerReq,
  ) {
    const outcome = body?.outcome === "approved" ? "approved" : body?.outcome === "changes_requested" ? "changes_requested" : null;
    if (!outcome) throw new BadRequestException("outcome must be approved or changes_requested");
    return this.reviews.decide(id, outcome, Number(body?.rating) || null, body?.comment ?? "", req.user);
  }

  @Post("mentor-notes")
  mentorNoteCreate(@Body() body: { traineeId?: string; text?: string }, @Request() req: CallerReq) {
    return this.reviews.addMentorNote(body, req.user);
  }

  @Get("mentor-notes")
  mentorNotesList(@Request() req: CallerReq) {
    return this.reviews.mentorNotesFor(req.user);
  }

  /* --- notifications --- */
  @Get("notifications")
  notificationsList() {
    return this.notifications.listMine();
  }

  @Patch("notifications/:id")
  async notificationRead(@Param("id") id: string, @Body() body: { read?: boolean }) {
    if (body?.read) await this.notifications.markRead(id);
    return { ok: true };
  }

  @Post("notifications/read-all")
  async notificationsReadAll() {
    await this.notifications.markAllRead();
    return { ok: true };
  }

  /* --- programme settings --- */
  @Get("programme")
  programmeGet() {
    return this.programme.getMine();
  }

  @Patch("programme")
  programmePatch(@Body() body: { lengthMonths?: number; startDate?: string; language?: string; supervisorsViewLogs?: boolean; traineesExport?: boolean }, @Request() req: CallerReq) {
    if (req.user.role !== "hr") throw new BadRequestException("HR only");
    return this.programme.updateSettings(body);
  }
}


