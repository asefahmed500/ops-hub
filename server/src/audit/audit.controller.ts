import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { DbService, stripDoc } from "../db/db.service.js";
import { AdminGuard } from "../common/admin.guard.js";
import { AuditEntry } from "../common/audit.js";

@Controller("audit")
export class AuditController {
  constructor(private readonly dbService: DbService) {}

  /** Latest audit entries — append-only trail, admins only. */
  @UseGuards(AdminGuard)
  @Get()
  async list(@Query("limit") limit?: string): Promise<AuditEntry[]> {
    const parsed = Number(limit);
    const capped = Number.isFinite(parsed) ? Math.min(200, Math.max(1, Math.floor(parsed))) : 50;
    const docs = await this.dbService
      .collection<AuditEntry>("auditLog")
      .find()
      .sort({ at: -1 })
      .limit(capped)
      .toArray();
    return docs.map((d) => stripDoc<AuditEntry>(d as never));
  }
}
