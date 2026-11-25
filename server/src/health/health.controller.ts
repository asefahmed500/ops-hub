import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { DbService } from "../db/db.service.js";
import { Public } from "../common/public.decorator.js";

@Controller()
export class HealthController {
  constructor(private readonly dbService: DbService) {}

  /** Process liveness — cheap, no dependencies. */
  @Public()
  @Get("health")
  health() {
    return { status: "ok", uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() };
  }

  /** Readiness — verifies the API can actually reach MongoDB. */
  @Public()
  @Get("ready")
  async ready() {
    try {
      await this.dbService.db.command({ ping: 1 });
      return { status: "ready" };
    } catch {
      throw new ServiceUnavailableException("Database unreachable");
    }
  }
}
