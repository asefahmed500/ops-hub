import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { DbService } from "../db/db.service.js";
import { IS_PUBLIC_KEY } from "./public.decorator.js";
import { requestContext } from "./request-context.js";

interface JwtPayload {
  sub?: string;
  tenantId?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly dbService: DbService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const header: string = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException();

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }

    // Defense in depth: the token's tenant must match the user's tenant
    const user = await this.dbService
      .collection("users")
      .findOne({ id: payload.sub ?? "", tenantId: payload.tenantId ?? "", active: { $ne: false } });
    if (!user) throw new UnauthorizedException();

    const tenant = await this.dbService.collection("tenants").findOne({ id: user.tenantId });
    if (!tenant || tenant.status === "suspended") {
      throw new UnauthorizedException("Your company workspace is suspended. Contact the platform administrator.");
    }

    const tenantName = typeof tenant.name === "string" ? tenant.name : undefined;
    const { passwordHash: _hash, _id: _oid, ...safe } = user;
    request.user = { ...safe, companyName: tenantName };

    // Actor + tenant available to services (scoping, audit) via the request context
    const store = requestContext.getStore();
    if (store) {
      store.userId = safe.id;
      store.userName = safe.name;
      store.tenantId = safe.tenantId;
      store.role = safe.role;
    }
    return true;
  }
}
