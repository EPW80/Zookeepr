const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function filterByQuery(query, animalsArray) {
  let filteredResults = animalsArray;
  if (query.personalityTraits) {
    // Accept ?personalityTraits=a&personalityTraits=b or ?personalityTraits=a,b
    const personalityTraitsArray = []
      .concat(query.personalityTraits)
      .flatMap((trait) => String(trait).split(","))
      .map((trait) => trait.trim())
      .filter(Boolean);
    personalityTraitsArray.forEach((trait) => {
      filteredResults = filteredResults.filter(
        (animal) => animal.personalityTraits.indexOf(trait) !== -1
      );
    });
  }
  if (query.diet) {
    filteredResults = filteredResults.filter(
      (animal) => animal.diet === query.diet
    );
  }
  if (query.species) {
    filteredResults = filteredResults.filter(
      (animal) => animal.species === query.species
    );
  }
  if (query.name) {
    filteredResults = filteredResults.filter(
      (animal) => animal.name === query.name
    );
  }
  return filteredResults;
}

function findById(id, animalsArray) {
  return animalsArray.find((animal) => animal.id === id);
}

function createNewAnimal(body, animalsArray) {
  const animal = body;
  animalsArray.push(animal);
  fs.writeFileSync(
    path.join(__dirname, "../data/animals.json"),
    JSON.stringify({ animals: animalsArray }, null, 2)
  );
  return animal;
}

function validateAnimal(animal) {
  if (!isNonEmptyString(animal.name)) {
    return false;
  }
  if (!isNonEmptyString(animal.species)) {
    return false;
  }
  if (!isNonEmptyString(animal.diet)) {
    return false;
  }
  if (
    !Array.isArray(animal.personalityTraits) ||
    !animal.personalityTraits.every((trait) => typeof trait === "string")
  ) {
    return false;
  }
  return true;
}

// Build a new animal from only the known fields, with a unique id
function buildAnimal(body) {
  return {
    id: crypto.randomUUID(),
    name: body.name.trim(),
    species: body.species.trim(),
    diet: body.diet.trim(),
    personalityTraits: body.personalityTraits,
  };
}

module.exports = {
  filterByQuery,
  findById,
  createNewAnimal,
  validateAnimal,
  buildAnimal,
};
