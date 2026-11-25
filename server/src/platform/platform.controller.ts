import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, UseGuards } from "@nestjs/common";
import { DbService, nowIso, stripDoc } from "../db/db.service.js";
import { PlatformGuard } from "../common/platform.guard.js";
import { recordAudit } from "../common/audit.js";

export interface TenantWithCounts {
  id: string;
  name: string;
  slug: string;
  inviteCode: string;
  status: "active" | "suspended";
  createdAt: string;
  users: number;
  logs: number;
  rotations: number;
  reviews: number;
}

export interface PlatformOverview {
  tenants: { total: number; active: number; suspended: number };
  users: number;
  logs: number;
  rotations: number;
  reviews: number;
  pendingReviews: number;
}

@UseGuards(PlatformGuard)
@Controller("platform")
export class PlatformController {
  constructor(private readonly dbService: DbService) {}

  private async count(name: string, filter: Record<string, unknown> = {}): Promise<number> {
    return this.dbService.collection(name).countDocuments(filter);
  }

  @Get("overview")
  async overview(): Promise<PlatformOverview> {
    const tenants = await this.dbService.collection("tenants").find().toArray();
    const [users, logs, rotations, reviews, pendingReviews] = await Promise.all([
      this.count("users", { role: { $ne: "platform_admin" } }),
      this.count("logs"),
      this.count("rotations"),
      this.count("reviews"),
      this.count("reviews", { status: "pending" }),
    ]);
    return {
      tenants: {
        total: tenants.length,
        active: tenants.filter((t) => t.status === "active").length,
        suspended: tenants.filter((t) => t.status === "suspended").length,
      },
      users,
      logs,
      rotations,
      reviews,
      pendingReviews,
    };
  }

  @Get("tenants")
  async listTenants(): Promise<TenantWithCounts[]> {
    const tenants = await this.dbService.collection("tenants").find().sort({ createdAt: -1 }).toArray();
    const result: TenantWithCounts[] = [];
    for (const t of tenants) {
      const [users, logs, rotations, reviews] = await Promise.all([
        this.count("users", { tenantId: t.id, role: { $ne: "platform_admin" } }),
        this.count("logs", { tenantId: t.id }),
        this.count("rotations", { tenantId: t.id }),
        this.count("reviews", { tenantId: t.id }),
      ]);
      result.push({ ...(stripDoc(t as never) as TenantWithCounts), users, logs, rotations, reviews });
    }
    return result;
  }

  @Patch("tenants/:id")
  async setStatus(@Param("id") id: string, @Body() body: { status?: string }): Promise<TenantWithCounts> {
    const status = body?.status;
    if (status !== "active" && status !== "suspended") {
      throw new BadRequestException("status must be active or suspended");
    }
    const doc = await this.dbService
      .collection("tenants")
      .findOneAndUpdate({ id }, { $set: { status, updatedAt: nowIso() } }, { returnDocument: "after" });
    if (!doc) throw new NotFoundException("Tenant not found");
    await recordAudit(this.dbService, status === "suspended" ? "suspend" : "activate", "tenants", id);
    return stripDoc(doc as never) as TenantWithCounts;
  }
}
