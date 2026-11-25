import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { SafeUser } from "./types.js";

interface RequestWithUser {
  user?: SafeUser;
}

/** Only the platform operator (superadmin) may pass. */
@Injectable()
export class PlatformGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.user?.role !== "platform_admin") throw new ForbiddenException("Platform admin only");
    return true;
  }
}
