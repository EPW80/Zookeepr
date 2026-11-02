import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, test } from "vitest";
import { migrations, openDatabase } from "../src/db.js";
import { createAnimalRepository } from "../src/repositories/animals.js";

const version = (db: DatabaseSync) =>
  (db.prepare("PRAGMA user_version").get() as { user_version: number })
    .user_version;

let file: string;

beforeEach(() => {
  file = path.join(mkdtempSync(path.join(tmpdir(), "zookeepr-db-")), "test.db");
});

const animal = {
  name: "Erica",
  species: "gorilla",
  diet: "omnivore",
  personalityTraits: ["quirky"],
};

describe("migrations", () => {
  test("a new database runs every migration", () => {
    const db = openDatabase(file);

    expect(version(db)).toBe(migrations.length);
    db.close();
  });

  test("reopening a migrated database keeps its data and version", () => {
    const first = openDatabase(file);
    createAnimalRepository(first).create(animal);
    first.close();

    const second = openDatabase(file);
    expect(version(second)).toBe(migrations.length);
    expect(createAnimalRepository(second).count()).toBe(1);
    second.close();
  });

  test("upgrades a database created before migrations existed", () => {
    // Databases from before versioning have the tables but user_version 0
    const legacy = new DatabaseSync(file);
    legacy.exec(migrations[0] ?? "");
    legacy
      .prepare(
        "INSERT INTO animals (id, name, species, diet) VALUES ('old', 'Old', 'bear', 'omnivore')",
      )
      .run();
    legacy.close();

    const db = openDatabase(file);
    expect(version(db)).toBe(migrations.length);
    expect(createAnimalRepository(db).findById("old")?.name).toBe("Old");
    db.close();
  });

  test("refuses a database from a newer version of the app", () => {
    const newer = new DatabaseSync(file);
    newer.exec(`PRAGMA user_version = ${migrations.length + 1}`);
    newer.close();

    expect(() => openDatabase(file)).toThrow(/newer than this app supports/);
  });
});
