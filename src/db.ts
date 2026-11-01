import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type Db = DatabaseSync;

const schema = `
  CREATE TABLE IF NOT EXISTS animals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    diet TEXT NOT NULL,
    personality_traits TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(personality_traits)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS zookeepers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0),
    favorite_animal TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

/**
 * Open (or create) the SQLite database and make sure the tables exist.
 * Pass ":memory:" for a throwaway database, as the tests do.
 */
export function openDatabase(file: string): Db {
  if (file !== ":memory:") {
    mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(schema);
  return db;
}
