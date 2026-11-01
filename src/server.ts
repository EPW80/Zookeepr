import { createApp } from "./app.js";
import { openDatabase } from "./db.js";
import { seedIfEmpty } from "./seed.js";

const port = Number(process.env.PORT ?? 3001);
const databasePath = process.env.DATABASE_PATH ?? "data/zookeepr.db";
const trustProxy = parseTrustProxy(process.env.TRUST_PROXY);

/** TRUST_PROXY is a hop count ("1"), "true", "false", or unset. */
function parseTrustProxy(value: string | undefined): number | boolean {
  if (value === undefined || value === "" || value === "false") return false;
  if (value === "true") return true;
  const hops = Number(value);
  if (!Number.isInteger(hops) || hops < 0) {
    throw new Error(`TRUST_PROXY must be a number of hops, "true" or "false"`);
  }
  return hops;
}

const db = openDatabase(databasePath);
seedIfEmpty(db);

const server = createApp({ db, trustProxy }).listen(port, () => {
  console.log(`Zookeepr listening on http://localhost:${port}`);
});

// Finish in-flight requests and close the database cleanly on shutdown
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
