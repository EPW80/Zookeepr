const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function filterByQuery(query, zookeepers) {
  let filteredResults = zookeepers;

  if (query.age !== undefined && query.age !== "") {
    filteredResults = filteredResults.filter(
      (zookeeper) => zookeeper.age === Number(query.age)
    );
  }
  if (query.favoriteAnimal) {
    filteredResults = filteredResults.filter(
      (zookeeper) => zookeeper.favoriteAnimal === query.favoriteAnimal
    );
  }
  if (query.name) {
    filteredResults = filteredResults.filter(
      (zookeeper) => zookeeper.name === query.name
    );
  }
  return filteredResults;
}

function findById(id, zookeepers) {
  return zookeepers.find((zookeeper) => zookeeper.id === id);
}

function createNewZookeeper(body, zookeepers) {
  const zookeeper = body;
  zookeepers.push(zookeeper);
  fs.writeFileSync(
    path.join(__dirname, "../data/zookeepers.json"),
    JSON.stringify({ zookeepers }, null, 2)
  );
  return zookeeper;
}

function validateZookeeper(zookeeper) {
  if (!isNonEmptyString(zookeeper.name)) {
    return false;
  }
  if (!Number.isInteger(zookeeper.age) || zookeeper.age < 0) {
    return false;
  }
  if (!isNonEmptyString(zookeeper.favoriteAnimal)) {
    return false;
  }
  return true;
}

// Build a new zookeeper from only the known fields, with a unique id
function buildZookeeper(body) {
  return {
    id: crypto.randomUUID(),
    name: body.name.trim(),
    age: body.age,
    favoriteAnimal: body.favoriteAnimal.trim(),
  };
}

module.exports = {
  filterByQuery,
  findById,
  createNewZookeeper,
  validateZookeeper,
  buildZookeeper,
};
