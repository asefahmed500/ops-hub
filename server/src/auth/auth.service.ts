import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DbService, nowIso, uid } from "../db/db.service.js";
import { SafeUser, UserDoc } from "../common/types.js";
import { EMAIL_RE } from "../common/validation.js";
import { SeedService } from "../db/seed.service.js";
import bcrypt from "bcryptjs";

export interface AuthSession {
  token: string;
  user: SafeUser;
  inviteCode?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dbService: DbService,
    private readonly seedService: SeedService,
  ) {}

  private async issueSession(user: UserDoc): Promise<AuthSession> {
    const { _id: _oid, passwordHash: _hash, ...safe } = user as UserDoc & { _id?: unknown };
    const tenant = await this.dbService.collection("tenants").findOne({ id: user.tenantId });
    const token = await this.jwtService.signAsync({
      sub: safe.id,
      tenantId: safe.tenantId,
      role: safe.role,
      name: safe.name,
    });
    return { token, user: { ...safe, companyName: tenant?.name }, inviteCode: tenant?.inviteCode };
  }

  private async tenantGate(tenantId: string): Promise<void> {
    const tenant = await this.dbService.collection("tenants").findOne({ id: tenantId });
    if (!tenant || tenant.status === "suspended") {
      throw new UnauthorizedException("Your company workspace is suspended. Contact the platform administrator.");
    }
  }

  async tenantBasics(tenantId: string): Promise<{ id: string; name: string; inviteCode: string; status: string }> {
    const tenants = this.dbService.collection("tenants");
    const tenant = await tenants.findOne({ id: tenantId });
    if (!tenant) throw new UnauthorizedException("Workspace not found");
    return {
      id: tenant.id,
      name: (tenant as { name?: string }).name ?? "",
      inviteCode: (tenant as { inviteCode?: string }).inviteCode ?? "",
      status: (tenant as { status?: string }).status ?? "active",
    };
  }

  async login(email?: string, password?: string): Promise<AuthSession> {
    if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
      throw new UnauthorizedException("Email and password are required");
    }
    const users = this.dbService.collection<UserDoc>("users");
    const user = await users.findOne({ email: email.toLowerCase().trim() });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid email or password");
    }
    if (user.active === false) throw new UnauthorizedException("Account is deactivated");
    await this.tenantGate(user.tenantId);
    return this.issueSession(user);
  }

  /** HR registers the company programme and becomes its admin. */
  async register(
    name?: string,
    email?: string,
    password?: string,
    companyName?: string,
  ): Promise<AuthSession> {
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const cleanCompany = typeof companyName === "string" ? companyName.trim() : "";
    if (cleanCompany.length < 2) throw new BadRequestException("Please enter your company name");
    if (cleanName.length < 2) throw new BadRequestException("Please enter your full name");
    if (!EMAIL_RE.test(cleanEmail)) throw new BadRequestException("Please enter a valid email address");
    if (typeof password !== "string" || password.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }

    const users = this.dbService.collection<UserDoc>("users");
    if (await users.findOne({ email: cleanEmail })) {
      throw new ConflictException("An account with this email already exists. Try signing in instead.");
    }

    const tenants = this.dbService.collection("tenants");
    const slug = await this.seedService.slugify(cleanCompany);
    const inviteCode = `MTO-${slug.split("-")[0].toUpperCase().slice(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const tenantId = uid("tnt");
    await tenants.insertOne({
      id: tenantId,
      name: cleanCompany,
      slug,
      inviteCode,
      status: "active",
      createdAt: nowIso(),
    } as never);

    const doc: UserDoc = {
      id: uid("usr"),
      tenantId,
      name: cleanName,
      email: cleanEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "hr",
      active: true,
      createdAt: nowIso(),
    };
    await users.insertOne(doc);

    await this.seedService.cloneStarterTemplate(tenantId);
    const session = await this.issueSession(doc);
    return { ...session, inviteCode };
  }

  /** Trainee joins an existing company programme with the invite code from HR. */
  async join(
    inviteCode?: string,
    name?: string,
    email?: string,
    password?: string,
    dept?: string,
  ): Promise<AuthSession> {
    const code = typeof inviteCode === "string" ? inviteCode.trim().toUpperCase() : "";
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const cleanDept = typeof dept === "string" && dept.trim() ? dept.trim() : "Orientation";
    if (!code) throw new BadRequestException("Enter the company code from HR");
    if (cleanName.length < 2) throw new BadRequestException("Please enter your full name");
    if (!EMAIL_RE.test(cleanEmail)) throw new BadRequestException("Please enter a valid email address");
    if (typeof password !== "string" || password.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }

    const tenant = await this.dbService.collection("tenants").findOne({ inviteCode: code });
    if (!tenant) throw new BadRequestException("Company code not recognized — check with HR");
    if (tenant.status === "suspended") throw new BadRequestException("This company workspace is suspended");

    const users = this.dbService.collection<UserDoc>("users");
    if (await users.findOne({ email: cleanEmail })) {
      throw new ConflictException("An account with this email already exists. Try signing in instead.");
    }

    const doc: UserDoc = {
      id: uid("usr"),
      tenantId: tenant.id,
      name: cleanName,
      email: cleanEmail,
      dept: cleanDept,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "trainee",
      active: true,
      createdAt: nowIso(),
    };
    await users.insertOne(doc);

    const rotations = this.dbService.collection("rotations");
    if ((await rotations.countDocuments({ tenantId: tenant.id })) === 0) {
      await this.seedService.cloneStarterTemplate(tenant.id);
    }
    return this.issueSession(doc);
  }
}
