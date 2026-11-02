import { describe, expect, test } from "vitest";
import { createLogger, silentLogger } from "../src/logger.js";

describe("createLogger", () => {
  test("defaults to info and honours LOG_LEVEL", () => {
    expect(createLogger({ NODE_ENV: "production" }).level).toBe("info");
    expect(
      createLogger({ NODE_ENV: "production", LOG_LEVEL: "debug" }).level,
    ).toBe("debug");
  });

  test("the test logger discards everything", () => {
    expect(silentLogger.level).toBe("silent");
  });
});
