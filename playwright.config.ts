import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const port = 3210;
// Set once in the main process; test workers inherit it, so every run gets
// its own fresh database and the real data/ folder is never touched.
process.env.E2E_DATABASE_PATH ??= path.join(
  tmpdir(),
  `zookeepr-e2e-${process.pid}.db`,
);

export default defineConfig({
  testDir: "tests/e2e",
  globalTeardown: "./tests/e2e/teardown.ts",
  // The tests share one server and database
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    // Optional: point at an already-installed Chromium instead of the
    // one `npx playwright install` downloads
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && node dist/server.js",
    url: `http://localhost:${port}/api/health`,
    env: {
      PORT: String(port),
      DATABASE_PATH: process.env.E2E_DATABASE_PATH,
    },
    reuseExistingServer: false,
  },
});
