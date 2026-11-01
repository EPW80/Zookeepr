import { readFileSync } from "node:fs";
import { z } from "zod";
import type { Db } from "./db.js";
import { createAnimalRepository } from "./repositories/animals.js";
import { createZookeeperRepository } from "./repositories/zookeepers.js";
import { newAnimalSchema, newZookeeperSchema } from "./schemas.js";

// data/*.json is the starting catalog. It is read once to fill an empty
// database and is never written to.
const dataDir = new URL("../data/", import.meta.url);

const animalsFile = z.object({
  animals: z.array(newAnimalSchema.extend({ id: z.string() })),
});
const zookeepersFile = z.object({
  zookeepers: z.array(newZookeeperSchema.extend({ id: z.string() })),
});

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(new URL(name, dataDir), "utf8"));
}

/** Load the starting catalog into any table that is still empty. */
export function seedIfEmpty(db: Db): void {
  const animals = createAnimalRepository(db);
  const zookeepers = createZookeeperRepository(db);

  db.exec("BEGIN");
  try {
    if (animals.count() === 0) {
      for (const { id, ...animal } of animalsFile.parse(
        readJson("animals.json"),
      ).animals) {
        animals.create(animal, id);
      }
    }
    if (zookeepers.count() === 0) {
      for (const { id, ...zookeeper } of zookeepersFile.parse(
        readJson("zookeepers.json"),
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
