import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type Db = DatabaseSync;

/**
 * Schema changes, in order. Each runs once, in a transaction, and the
 * database's user_version records how many have run. Only ever append:
 * never edit or reorder a migration that has shipped.
 */
export const migrations: readonly string[] = [
  // 1: initial tables. IF NOT EXISTS lets databases created before
  // migrations existed (user_version 0, tables present) upgrade cleanly.
  `  CREATE TABLE IF NOT EXISTS animals (
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
  `,
];

function migrate(db: Db): void {
  const { user_version: current } = db.prepare("PRAGMA user_version").get() as {
    user_version: number;
  };
  if (current > migrations.length) {
    throw new Error(
      `Database schema version ${current} is newer than this app supports (${migrations.length}).`,
    );
  }
  for (let version = current; version < migrations.length; version++) {
    db.exec("BEGIN");
    try {
      db.exec(migrations[version] ?? "");
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }
}

/**
 * Open (or create) the SQLite database and bring its schema up to date.
 * Pass ":memory:" for a throwaway database, as the tests do.
 */
export function openDatabase(file: string): Db {
  if (file !== ":memory:") {
    mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const db = new DatabaseSync(file);
  try {
    db.exec("PRAGMA journal_mode = WAL;");
    migrate(db);
  } catch (err) {
    db.close();
    throw err;
  }
  return db;
}
