const {
  filterByQuery,
  findById,
  createNewAnimal,
  validateAnimal,
  buildAnimal,
} = require("../lib/animals.js");
const { animals } = require("../data/animals");

jest.mock("fs");

test("creates an animal object", () => {
  const animal = createNewAnimal(
    { name: "Darlene", id: "jhgdja3ng2" },
    [...animals]
  );

  expect(animal.name).toBe("Darlene");
  expect(animal.id).toBe("jhgdja3ng2");
});

test("filters by query", () => {
  const startingAnimals = [
    {
      id: "3",
      name: "Erica",
      species: "gorilla",
      diet: "omnivore",
      personalityTraits: ["quirky", "rash"],
    },
    {
      id: "4",
      name: "Noel",
      species: "bear",
      diet: "carnivore",
      personalityTraits: ["impish", "sassy", "brave"],
    },
  ];

  const updatedAnimals = filterByQuery({ species: "gorilla" }, startingAnimals);

  expect(updatedAnimals.length).toEqual(1);
});

test("finds by id", () => {
  const startingAnimals = [
    {
      id: "3",
      name: "Erica",
      species: "gorilla",
      diet: "omnivore",
      personalityTraits: ["quirky", "rash"],
    },
    {
      id: "4",
      name: "Noel",
      species: "bear",
      diet: "carnivore",
      personalityTraits: ["impish", "sassy", "brave"],
    },
  ];

  const result = findById("3", startingAnimals);

  expect(result.name).toBe("Erica");
});

test("validates personality traits", () => {
  const animal = {
    id: "3",
    name: "Erica",
    species: "gorilla",
    diet: "omnivore",
    personalityTraits: ["quirky", "rash"],
  };

  const invalidAnimal = {
    id: "3",
    name: "Erica",
    species: "gorilla",
    diet: "omnivore",
  };

  const result = validateAnimal(animal);
  const result2 = validateAnimal(invalidAnimal);

  expect(result).toBe(true);
  expect(result2).toBe(false);
});

test("filters by multiple personality traits in one comma-separated string", () => {
  const startingAnimals = [
    { id: "1", name: "A", species: "bear", diet: "omnivore", personalityTraits: ["hungry", "zany"] },
    { id: "2", name: "B", species: "bear", diet: "omnivore", personalityTraits: ["hungry"] },
  ];

  expect(filterByQuery({ personalityTraits: "hungry,zany" }, startingAnimals)).toHaveLength(1);
  expect(filterByQuery({ personalityTraits: ["hungry", "zany"] }, startingAnimals)).toHaveLength(1);
  expect(filterByQuery({ personalityTraits: "" }, startingAnimals)).toHaveLength(2);
});

test("rejects blank strings and non-string traits", () => {
  const base = { name: "Erica", species: "gorilla", diet: "omnivore", personalityTraits: ["quirky"] };

  expect(validateAnimal({ ...base, name: "   " })).toBe(false);
  expect(validateAnimal({ ...base, personalityTraits: [1] })).toBe(false);
});

test("buildAnimal keeps only known fields and assigns unique ids", () => {
  const body = { name: " Erica ", species: "gorilla", diet: "omnivore", personalityTraits: [], isAdmin: true };
  const a = buildAnimal(body);
  const b = buildAnimal(body);

  expect(Object.keys(a).sort()).toEqual(["diet", "id", "name", "personalityTraits", "species"]);
  expect(a.name).toBe("Erica");
  expect(a.id).not.toBe(b.id);
});
