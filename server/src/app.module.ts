import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DbModule } from "./db/db.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { UsersModule } from "./users/users.module.js";
import { MtoModule } from "./mto/mto.module.js";
import { HealthModule } from "./health/health.module.js";
import { AuditModule } from "./audit/audit.module.js";
import { PlatformModule } from "./platform/platform.module.js";
import { RequestContextMiddleware } from "./common/request-context.middleware.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AuthModule,
    UsersModule,
    MtoModule,
    HealthModule,
    AuditModule,
    PlatformModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
