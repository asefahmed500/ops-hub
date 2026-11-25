import { Module, Global } from "@nestjs/common";
import { DbService } from "./db.service.js";
import { SeedService } from "./seed.service.js";

@Global()
@Module({
  providers: [DbService, SeedService],
  exports: [DbService, SeedService],
})
export class DbModule {}
