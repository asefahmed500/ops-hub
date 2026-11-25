import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { requestContext } from "./request-context.js";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger("http");

  use(req: Request, res: Response, next: NextFunction): void {
    const headerId = req.headers["x-request-id"];
    const requestId =
      (typeof headerId === "string" && headerId) ||
      `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    res.setHeader("X-Request-Id", requestId);

    const start = Date.now();
    requestContext.run({ requestId }, () => {
      res.on("finish", () => {
        // req.user is set by the auth guard during the request, so it is readable here
        const user = (req as Request & { user?: { id?: string } }).user;
        this.logger.log(
          JSON.stringify({
            requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Date.now() - start,
            userId: user?.id ?? null,
          }),
        );
      });
      next();
    });
  }
}
