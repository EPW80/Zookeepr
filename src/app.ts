import path from "node:path";
import express, { type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Db } from "./db.js";
import { createErrorHandler } from "./errors.js";
import { silentLogger, type Logger } from "./logger.js";
import { createAnimalRepository } from "./repositories/animals.js";
import { createZookeeperRepository } from "./repositories/zookeepers.js";
import { createApiRouter } from "./routes/api.js";
import { createHtmlRouter } from "./routes/html.js";

// src/ and dist/ both sit one level below the project root
const publicDir = path.resolve(import.meta.dirname, "../public");

export interface AppOptions {
  db: Db;
  /** Max POST requests per IP per 15 minutes, or false to turn the limit off. */
  writeLimit?: number | false;
  /** Express "trust proxy" setting; set it when running behind a load balancer. */
  trustProxy?: number | boolean;
  /** Where request and error logs go. Silent by default. */
  logger?: Logger;
}

export function createApp({
  db,
  writeLimit = 50,
  trustProxy = false,
  logger = silentLogger,
}: AppOptions) {
  const app = express();
  app.set("trust proxy", trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        // Upgrading requests would break every asset when the app is
        // opened over plain HTTP, e.g. a container on a LAN address.
        // Hosts that serve HTTPS redirect HTTP to it themselves.
        directives: { upgradeInsecureRequests: null },
      },
    }),
  );
  // Static files are served before the request logger, so only page and
  // API requests are logged
  app.use(express.static(publicDir));
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/api/health" },
      // Keep log lines short, and never log headers such as cookies
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500
          ? "error"
          : res.statusCode >= 400
            ? "warn"
            : "info",
    }),
  );
  app.use(express.json({ limit: "10kb" }));

  const beforeWrite: RequestHandler[] =
    writeLimit === false
      ? []
      : [
          rateLimit({
            windowMs: 15 * 60 * 1000,
            limit: writeLimit,
            standardHeaders: "draft-8",
            legacyHeaders: false,
            message: { error: "Too many requests. Please try again later." },
          }),
        ];

  app.use(
    "/api",
    createApiRouter({
      animals: createAnimalRepository(db),
      zookeepers: createZookeeperRepository(db),
      beforeWrite,
    }),
  );
  app.use(createHtmlRouter(publicDir));
  app.use(createErrorHandler(logger));

  return app;
}
