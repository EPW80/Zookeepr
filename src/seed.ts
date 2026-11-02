import { readFileSync } from "node:fs";
import { z } from "zod";
import type { Db } from "./db.js";
import { createAnimalRepository } from "./repositories/animals.js";
import { createZookeeperRepository } from "./repositories/zookeepers.js";

// data/*.json is the starting catalog. It is read once to fill an empty
// database and is never written to.
const defaultDataDir = new URL("../data/", import.meta.url);

// Records saved by older versions of the app were never length- or
// range-limited, so import them with type checks only. New records still go
// through the stricter POST schemas in schemas.ts.
const text = z.string().trim().min(1);

const animalsFile = z.object({
  animals: z.array(
    z.object({
      id: z.string(),
      name: text,
      species: text,
      diet: text,
      personalityTraits: z.array(z.string()),
    }),
  ),
});
const zookeepersFile = z.object({
  zookeepers: z.array(
    z.object({
      id: z.string(),
      name: text,
      age: z.number().int().min(0),
      favoriteAnimal: text,
    }),
  ),
});

function readJson(dataDir: URL, name: string): unknown {
  return JSON.parse(readFileSync(new URL(name, dataDir), "utf8"));
}

/** Load the starting catalog into any table that is still empty. */
export function seedIfEmpty(db: Db, dataDir: URL = defaultDataDir): void {
  const animals = createAnimalRepository(db);
  const zookeepers = createZookeeperRepository(db);

  db.exec("BEGIN");
  try {
    if (animals.count() === 0) {
      for (const { id, ...animal } of animalsFile.parse(
        readJson(dataDir, "animals.json"),
      ).animals) {
        animals.create(animal, id);
      }
    }
    if (zookeepers.count() === 0) {
      for (const { id, ...zookeeper } of zookeepersFile.parse(
        readJson(dataDir, "zookeepers.json"),
      ).zookeepers) {
        zookeepers.create(zookeeper, id);
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
