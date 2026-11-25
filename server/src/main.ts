import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix("api");

  const config = app.get(ConfigService);
  if (!config.get<string>("AUTH_SECRET")) {
    console.warn("[opshub-api] WARNING: AUTH_SECRET not set — using insecure development fallback");
  }
  const port = Number(config.get<string>("PORT") || 3001);
  await app.listen(port);
  console.log(`[opshub-api] listening on http://localhost:${port}`);
}

void bootstrap();
