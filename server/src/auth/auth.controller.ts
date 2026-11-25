import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "../common/jwt-auth.guard.js";
import { Public } from "../common/public.decorator.js";
import { SafeUser } from "../common/types.js";

interface LoginDto {
  email?: string;
  password?: string;
}

interface RegisterDto {
  companyName?: string;
  name?: string;
  email?: string;
  password?: string;
}

interface JoinDto {
  inviteCode?: string;
  name?: string;
  email?: string;
  password?: string;
  dept?: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body?.email, body?.password);
  }

  /** HR registers a company MTO programme. */
  @Public()
  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body?.name, body?.email, body?.password, body?.companyName);
  }

  /** Trainee joins a programme with the company invite code. */
  @Public()
  @Post("join")
  join(@Body() body: JoinDto) {
    return this.authService.join(body?.inviteCode, body?.name, body?.email, body?.password, body?.dept);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Request() req: { user: SafeUser }) {
    return req.user;
  }

  /** The signed-in member's company basics (invite code for HR sharing). */
  @UseGuards(JwtAuthGuard)
  @Get("tenants/me")
  async myTenant(@Request() req: { user: SafeUser }) {
    const tenant = await this.authService.tenantBasics(req.user.tenantId);
    return { id: tenant.id, name: tenant.name, inviteCode: tenant.inviteCode, status: tenant.status };
  }
}
