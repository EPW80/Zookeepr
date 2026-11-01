import path from "node:path";
import express, { type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import type { Db } from "./db.js";
import { errorHandler } from "./errors.js";
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
}

export function createApp({
  db,
  writeLimit = 50,
  trustProxy = false,
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
  app.use(express.json({ limit: "10kb" }));
  app.use(express.static(publicDir));

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
  app.use(errorHandler);

  return app;
}
