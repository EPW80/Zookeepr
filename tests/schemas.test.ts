import { describe, expect, test } from "vitest";
import {
  animalQuerySchema,
  newAnimalSchema,
  newZookeeperSchema,
  zookeeperQuerySchema,
} from "../src/schemas.js";

const animal = {
  name: "Erica",
  species: "gorilla",
  diet: "omnivore",
  personalityTraits: ["quirky", "rash"],
};
const zookeeper = { name: "Raksha", age: 31, favoriteAnimal: "penguin" };

describe("newAnimalSchema", () => {
  test("accepts a valid animal and trims strings", () => {
    expect(newAnimalSchema.parse({ ...animal, name: " Erica " }).name).toBe(
      "Erica",
    );
  });

  test("strips unknown fields", () => {
    expect(newAnimalSchema.parse({ ...animal, isAdmin: true })).toEqual(animal);
  });

  test.each([
    ["missing traits", { ...animal, personalityTraits: undefined }],
    ["blank name", { ...animal, name: "   " }],
    ["non-string trait", { ...animal, personalityTraits: [1] }],
    ["overlong species", { ...animal, species: "x".repeat(101) }],
  ])("rejects %s", (_label, input) => {
    expect(newAnimalSchema.safeParse(input).success).toBe(false);
  });
});

describe("newZookeeperSchema", () => {
  test("accepts age 0", () => {
    expect(newZookeeperSchema.safeParse({ ...zookeeper, age: 0 }).success).toBe(
      true,
    );
  });

  test.each([["67"], [-1], [2.5], [Number.NaN], [null]])(
    "rejects age %s",
    (age) => {
      expect(newZookeeperSchema.safeParse({ ...zookeeper, age }).success).toBe(
        false,
      );
    },
  );
});

describe("query schemas", () => {
  test("splits comma-separated and repeated traits", () => {
    expect(
      animalQuerySchema.parse({ personalityTraits: "hungry, zany" })
        .personalityTraits,
    ).toEqual(["hungry", "zany"]);
    expect(
      animalQuerySchema.parse({ personalityTraits: ["hungry", "zany,loving"] })
        .personalityTraits,
    ).toEqual(["hungry", "zany", "loving"]);
  });

  test("treats blank values as absent", () => {
    expect(
      animalQuerySchema.parse({ diet: "", personalityTraits: "" }),
    ).toEqual({
      name: undefined,
      species: undefined,
      diet: undefined,
      personalityTraits: [],
    });
    expect(zookeeperQuerySchema.parse({ age: "" }).age).toBeUndefined();
  });

  test("coerces age and rejects non-numbers", () => {
    expect(zookeeperQuerySchema.parse({ age: "0" }).age).toBe(0);
    expect(zookeeperQuerySchema.safeParse({ age: "abc" }).success).toBe(false);
  });
});
