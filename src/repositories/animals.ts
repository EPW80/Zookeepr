import { randomUUID } from "node:crypto";
import type { SQLInputValue } from "node:sqlite";
import type { Db } from "../db.js";
import type { Animal, AnimalQuery, NewAnimal } from "../schemas.js";

interface AnimalRow {
  id: string;
  name: string;
  species: string;
  diet: string;
  personality_traits: string;
}

const columns = "id, name, species, diet, personality_traits";

function toAnimal(row: AnimalRow): Animal {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    diet: row.diet,
    personalityTraits: JSON.parse(row.personality_traits) as string[],
  };
}

export function createAnimalRepository(db: Db) {
  const selectById = db.prepare(`SELECT ${columns} FROM animals WHERE id = ?`);
  const insert = db.prepare(
    `INSERT INTO animals (${columns}) VALUES (?, ?, ?, ?, ?)`,
  );

  return {
    list(query: Partial<AnimalQuery> = {}): Animal[] {
      const conditions: string[] = [];
      const params: SQLInputValue[] = [];

      for (const field of ["name", "species", "diet"] as const) {
        const value = query[field];
        if (value) {
          conditions.push(`${field} = ?`);
          params.push(value);
        }
      }
      // Every requested trait must be present. One clause compares against
      // a JSON array of the requested traits, however many there are.
      const traits = [...new Set(query.personalityTraits ?? [])];
      if (traits.length) {
        conditions.push(
          `NOT EXISTS (
            SELECT 1 FROM json_each(?) AS wanted
            WHERE wanted.value NOT IN (SELECT value FROM json_each(personality_traits))
          )`,
        );
        params.push(JSON.stringify(traits));
      }

      const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
      const rows = db
        .prepare(`SELECT ${columns} FROM animals ${where} ORDER BY rowid`)
        .all(...params) as unknown as AnimalRow[];
      return rows.map(toAnimal);
    },

    findById(id: string): Animal | undefined {
      const row = selectById.get(id) as AnimalRow | undefined;
      return row && toAnimal(row);
    },

    create(input: NewAnimal, id: string = randomUUID()): Animal {
      insert.run(
        id,
        input.name,
        input.species,
        input.diet,
        JSON.stringify(input.personalityTraits),
      );
      return { id, ...input };
    },

    count(): number {
      const row = db.prepare("SELECT COUNT(*) AS n FROM animals").get() as {
        n: number;
      };
      return row.n;
    },
  };
}

export type AnimalRepository = ReturnType<typeof createAnimalRepository>;
