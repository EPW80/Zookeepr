import { createApp, type AppOptions } from "../src/app.js";
import { openDatabase } from "../src/db.js";
import { seedIfEmpty } from "../src/seed.js";

/** A fresh app backed by an in-memory database holding the starting catalog. */
export function makeApp(options: Omit<AppOptions, "db"> = {}) {
  const db = openDatabase(":memory:");
  seedIfEmpty(db);
  const app = createApp({ db, writeLimit: false, ...options });
  return { app, db };
}
