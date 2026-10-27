const fs = require("fs");
const request = require("supertest");
const app = require("../app");

// Don't let route tests rewrite the real data files
jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});

test("GET /api/animals filters by comma-separated traits", async () => {
  const res = await request(app).get("/api/animals?personalityTraits=hungry,zany");

  expect(res.status).toBe(200);
  expect(res.body.length).toBeGreaterThan(0);
  res.body.forEach((animal) => {
    expect(animal.personalityTraits).toEqual(expect.arrayContaining(["hungry", "zany"]));
  });
});

test("GET /api/animals/:id returns 404 for a missing id", async () => {
  const res = await request(app).get("/api/animals/does-not-exist");

  expect(res.status).toBe(404);
});

test("unknown /api routes return a JSON 404, not index.html", async () => {
  const res = await request(app).get("/api/nope");

  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: "Not found" });
});

test("POST /api/animals strips unknown fields and assigns a unique id", async () => {
  const body = { name: "Darlene", species: "otter", diet: "piscivore", personalityTraits: ["zany"], isAdmin: true };

  const first = await request(app).post("/api/animals").send(body);
  const second = await request(app).post("/api/animals").send(body);

  expect(first.status).toBe(200);
  expect(first.body.isAdmin).toBeUndefined();
  expect(first.body.id).not.toBe(second.body.id);
});

test("POST /api/zookeepers rejects a missing age", async () => {
  const res = await request(app).post("/api/zookeepers").send({ name: "Kim", favoriteAnimal: "dolphin" });

  expect(res.status).toBe(400);
});
