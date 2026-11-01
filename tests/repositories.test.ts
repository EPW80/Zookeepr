import { beforeEach, describe, expect, test } from "vitest";
import { openDatabase, type Db } from "../src/db.js";
import { createAnimalRepository } from "../src/repositories/animals.js";
import { createZookeeperRepository } from "../src/repositories/zookeepers.js";
import { seedIfEmpty } from "../src/seed.js";

let db: Db;

beforeEach(() => {
  db = openDatabase(":memory:");
});

describe("animal repository", () => {
  const erica = {
    name: "Erica",
    species: "gorilla",
    diet: "omnivore",
    personalityTraits: ["quirky", "rash"],
  };
  const noel = {
    name: "Noel",
    species: "bear",
    diet: "carnivore",
    personalityTraits: ["impish", "sassy", "brave"],
  };

  test("creates and finds an animal by id", () => {
    const animals = createAnimalRepository(db);
    const created = animals.create(erica);

    expect(created).toEqual({ id: expect.any(String), ...erica });
    expect(animals.findById(created.id)).toEqual(created);
    expect(animals.findById("missing")).toBeUndefined();
  });

  test("assigns unique ids", () => {
    const animals = createAnimalRepository(db);
    expect(animals.create(erica).id).not.toBe(animals.create(erica).id);
  });

  test("filters by species, diet and name", () => {
    const animals = createAnimalRepository(db);
    animals.create(erica);
    animals.create(noel);

    expect(animals.list({ species: "gorilla" }).map((a) => a.name)).toEqual([
      "Erica",
    ]);
    expect(animals.list({ diet: "carnivore" }).map((a) => a.name)).toEqual([
      "Noel",
    ]);
    expect(animals.list({ name: "Noel", species: "gorilla" })).toEqual([]);
    expect(animals.list()).toHaveLength(2);
  });

  test("requires every requested trait", () => {
    const animals = createAnimalRepository(db);
    animals.create(erica);
    animals.create(noel);

    expect(
      animals
        .list({ personalityTraits: ["sassy", "brave"] })
        .map((a) => a.name),
    ).toEqual(["Noel"]);
    expect(animals.list({ personalityTraits: ["sassy", "quirky"] })).toEqual(
      [],
    );
  });
});

describe("zookeeper repository", () => {
  test("creates, finds and filters zookeepers, including age 0", () => {
    const zookeepers = createZookeeperRepository(db);
    const baby = zookeepers.create({
      name: "Baby",
      age: 0,
      favoriteAnimal: "otter",
    });
    zookeepers.create({ name: "Raksha", age: 31, favoriteAnimal: "penguin" });

    expect(zookeepers.findById(baby.id)).toEqual(baby);
    expect(zookeepers.list({ age: 0 })).toEqual([baby]);
    expect(zookeepers.list({ favoriteAnimal: "penguin" })).toHaveLength(1);
    expect(zookeepers.list()).toHaveLength(2);
  });
});

describe("seedIfEmpty", () => {
  test("loads the starting catalog once", () => {
    seedIfEmpty(db);
    seedIfEmpty(db);

    expect(createAnimalRepository(db).count()).toBe(10);
    expect(createZookeeperRepository(db).count()).toBe(9);
    expect(createAnimalRepository(db).findById("0")?.name).toBe("Spindle");
  });

  test("leaves a table that already has rows alone", () => {
    createAnimalRepository(db).create({
      name: "Solo",
      species: "otter",
      diet: "piscivore",
      personalityTraits: [],
    });
    seedIfEmpty(db);

    expect(createAnimalRepository(db).count()).toBe(1);
    expect(createZookeeperRepository(db).count()).toBe(9);
  });
});
