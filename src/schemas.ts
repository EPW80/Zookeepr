import { z } from "zod";

const text = z
  .string({ error: "is required" })
  .trim()
  .min(1, "is required")
  .max(100, "must be 100 characters or fewer");

export const newAnimalSchema = z.object({
  name: text,
  species: text,
  diet: text,
  personalityTraits: z
    .array(text, { error: "must be a list" })
    .max(20, "must have 20 or fewer items"),
});

export const newZookeeperSchema = z.object({
  name: text,
  age: z
    .number({ error: "must be a number" })
    .int("must be a whole number")
    .min(0, "must be 0 or more")
    .max(150, "must be 150 or less"),
  favoriteAnimal: text,
});

export type NewAnimal = z.infer<typeof newAnimalSchema>;
export type Animal = NewAnimal & { id: string };
export type NewZookeeper = z.infer<typeof newZookeeperSchema>;
export type Zookeeper = NewZookeeper & { id: string };

// Query strings can repeat a key (?a=1&a=2), so a value may be an array.
const queryValue = z.union([z.string(), z.array(z.string())]).optional();

// Use the first value, and treat a blank one as absent.
const singleQueryValue = queryValue.transform((value) => {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
});

export const animalQuerySchema = z.object({
  name: singleQueryValue,
  species: singleQueryValue,
  diet: singleQueryValue,
  // Accept ?personalityTraits=a&personalityTraits=b or ?personalityTraits=a,b
  personalityTraits: queryValue.transform((value) =>
    [value ?? []]
      .flat()
      .flatMap((trait) => trait.split(","))
      .map((trait) => trait.trim())
      .filter(Boolean),
  ),
});

export const zookeeperQuerySchema = z.object({
  name: singleQueryValue,
  favoriteAnimal: singleQueryValue,
  age: singleQueryValue.pipe(
    z.coerce
      .number<string>({ error: "must be a number" })
      .int("must be a whole number")
      .min(0, "must be 0 or more")
      .optional(),
  ),
});

export type AnimalQuery = z.infer<typeof animalQuerySchema>;
export type ZookeeperQuery = z.infer<typeof zookeeperQuerySchema>;
