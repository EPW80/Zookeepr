import { randomUUID } from "node:crypto";
import type { SQLInputValue } from "node:sqlite";
import type { Db } from "../db.js";
import type { NewZookeeper, Zookeeper, ZookeeperQuery } from "../schemas.js";

interface ZookeeperRow {
  id: string;
  name: string;
  age: number;
  favorite_animal: string;
}

const columns = "id, name, age, favorite_animal";

function toZookeeper(row: ZookeeperRow): Zookeeper {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    favoriteAnimal: row.favorite_animal,
  };
}

export function createZookeeperRepository(db: Db) {
  const selectById = db.prepare(
    `SELECT ${columns} FROM zookeepers WHERE id = ?`,
  );
  const insert = db.prepare(
    `INSERT INTO zookeepers (${columns}) VALUES (?, ?, ?, ?)`,
  );

  return {
    list(query: Partial<ZookeeperQuery> = {}): Zookeeper[] {
      const conditions: string[] = [];
      const params: SQLInputValue[] = [];

      if (query.name) {
        conditions.push("name = ?");
        params.push(query.name);
      }
      if (query.age !== undefined) {
        conditions.push("age = ?");
        params.push(query.age);
      }
      if (query.favoriteAnimal) {
        conditions.push("favorite_animal = ?");
        params.push(query.favoriteAnimal);
      }

      const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
      const rows = db
        .prepare(`SELECT ${columns} FROM zookeepers ${where} ORDER BY rowid`)
        .all(...params) as unknown as ZookeeperRow[];
      return rows.map(toZookeeper);
    },

    findById(id: string): Zookeeper | undefined {
      const row = selectById.get(id) as ZookeeperRow | undefined;
      return row && toZookeeper(row);
    },

    create(input: NewZookeeper, id: string = randomUUID()): Zookeeper {
      insert.run(id, input.name, input.age, input.favoriteAnimal);
      return { id, ...input };
    },

    count(): number {
      const row = db.prepare("SELECT COUNT(*) AS n FROM zookeepers").get() as {
        n: number;
      };
      return row.n;
    },
  };
}

export type ZookeeperRepository = ReturnType<typeof createZookeeperRepository>;
