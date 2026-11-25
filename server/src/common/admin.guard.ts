import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { SafeUser } from "./types.js";

interface RequestWithUser {
  user?: SafeUser;
}

/** Company HR admins (and the platform operator for emergencies) may pass. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.user?.role !== "hr" && request.user?.role !== "platform_admin") {
      throw new ForbiddenException("HR only");
    }
    return true;
  }
}
