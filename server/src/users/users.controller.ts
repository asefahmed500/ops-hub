import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { AdminGuard } from "../common/admin.guard.js";
import { Role, SafeUser } from "../common/types.js";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<SafeUser[]> {
    return this.usersService.findAll();
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() body: { name?: string; email?: string; password?: string; role?: Role }) {
    return this.usersService.create(body);
  }

  @UseGuards(AdminGuard)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() body: { name?: string; role?: Role; password?: string; active?: boolean },
    @Request() req: { user: SafeUser },
  ) {
    return this.usersService.update(id, body, req.user);
  }

  @UseGuards(AdminGuard)
  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: { user: SafeUser }) {
    return this.usersService.remove(id, req.user);
  }
}
