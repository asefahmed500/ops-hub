import { Module } from "@nestjs/common";
import { MtoController } from "./mto.controllers.js";
import { MtoHrController, MtoStateController } from "./mto.hr.controllers.js";
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

@Module({
  controllers: [MtoController, MtoHrController, MtoStateController],
  providers: [
    RotationsService,
    LogsService,
    TasksService,
    GoalsService,
    ReviewsService,
    NotificationsService,
    ProgrammeService,
    AnalyticsService,
  ],
  exports: [ProgrammeService, RotationsService, AnalyticsService],
})
export class MtoModule {}
