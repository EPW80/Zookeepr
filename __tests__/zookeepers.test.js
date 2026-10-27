const {
  filterByQuery,
  findById,
  createNewZookeeper,
  validateZookeeper,
  buildZookeeper,
} = require("../lib/zookeepers.js");
const { zookeepers } = require("../data/zookeepers");

jest.mock("fs");
test("creates a zookeeper object", () => {
  const zookeeper = createNewZookeeper(
    { name: "Darlene", id: "jhgdja3ng2" },
    [...zookeepers]
  );

  expect(zookeeper.name).toBe("Darlene");
  expect(zookeeper.id).toBe("jhgdja3ng2");
});

test("filters by query", () => {
  const startingZookeepers = [
    {
      id: "2",
      name: "Raksha",
      age: 31,
      favoriteAnimal: "penguin",
    },
    {
      id: "3",
      name: "Isabella",
      age: 67,
      favoriteAnimal: "bear",
    },
  ];

  const updatedZookeepers = filterByQuery({ age: 31 }, startingZookeepers);

  expect(updatedZookeepers.length).toEqual(1);
});

test("finds by id", () => {
  const startingZookeepers = [
    {
      id: "2",
      name: "Raksha",
      age: 31,
      favoriteAnimal: "penguin",
    },
    {
      id: "3",
      name: "Isabella",
      age: 67,
      favoriteAnimal: "bear",
    },
  ];

  const result = findById("3", startingZookeepers);

  expect(result.name).toBe("Isabella");
});

test("validates age", () => {
  const zookeeper = {
    id: "2",
    name: "Raksha",
    age: 31,
    favoriteAnimal: "penguin",
  };

  const invalidZookeeper = {
    id: "3",
    name: "Isabella",
    age: "67",
    favoriteAnimal: "bear",
  };

  const result = validateZookeeper(zookeeper);
  const result2 = validateZookeeper(invalidZookeeper);

  expect(result).toBe(true);
  expect(result2).toBe(false);
});

test("accepts age 0 and rejects negative, fractional or blank values", () => {
  const base = { name: "Kim", favoriteAnimal: "dolphin" };

  expect(validateZookeeper({ ...base, age: 0 })).toBe(true);
  expect(validateZookeeper({ ...base, age: -1 })).toBe(false);
  expect(validateZookeeper({ ...base, age: 2.5 })).toBe(false);
  expect(validateZookeeper({ ...base, age: NaN })).toBe(false);
  expect(validateZookeeper({ ...base, age: 30, name: "  " })).toBe(false);
});

test("filters by age 0", () => {
  const startingZookeepers = [
    { id: "1", name: "A", age: 0, favoriteAnimal: "bear" },
    { id: "2", name: "B", age: 31, favoriteAnimal: "bear" },
  ];

  expect(filterByQuery({ age: "0" }, startingZookeepers)).toHaveLength(1);
  expect(filterByQuery({ age: "" }, startingZookeepers)).toHaveLength(2);
});

test("buildZookeeper keeps only known fields and assigns unique ids", () => {
  const body = { name: "Kim", age: 28, favoriteAnimal: "dolphin", isAdmin: true };
  const a = buildZookeeper(body);

  expect(Object.keys(a).sort()).toEqual(["age", "favoriteAnimal", "id", "name"]);
  expect(a.id).not.toBe(buildZookeeper(body).id);
});
