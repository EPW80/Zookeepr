import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // The entry point only wires config together; it's covered by the
      // browser tests and the Docker smoke test instead
      exclude: ["src/server.ts"],
      reporter: ["text", "text-summary"],
      // Just under the current figures, so coverage can't quietly drop
      thresholds: { statements: 92, branches: 88, functions: 95, lines: 92 },
    },
  },
});
