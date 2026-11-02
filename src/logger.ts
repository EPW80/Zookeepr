import { createRequire } from "node:module";
import { pino, type Logger } from "pino";

export type { Logger };

/**
 * JSON logs in production and anywhere output isn't a terminal; readable
 * logs when running locally in a terminal. LOG_LEVEL overrides the level.
 */
export function createLogger(env: NodeJS.ProcessEnv = process.env): Logger {
  const pretty =
    env.NODE_ENV !== "production" && process.stdout.isTTY && hasPinoPretty();
  return pino({
    level: env.LOG_LEVEL ?? "info",
    ...(pretty ? { transport: { target: "pino-pretty" } } : {}),
  });
}

/** A logger that discards everything, the default for tests. */
export const silentLogger: Logger = pino({ level: "silent" });

// pino-pretty is a dev dependency, so it's missing from production installs
function hasPinoPretty(): boolean {
  try {
    createRequire(import.meta.url).resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
}
