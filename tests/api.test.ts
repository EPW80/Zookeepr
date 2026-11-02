import request from "supertest";
import { describe, expect, test } from "vitest";
import { makeApp } from "./helpers.js";

const newAnimal = {
  name: "Darlene",
  species: "otter",
  diet: "piscivore",
  personalityTraits: ["zany"],
};

describe("animals API", () => {
  test("lists the seeded animals", async () => {
    const res = await request(makeApp().app).get("/api/animals");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(10);
  });

  test("filters by comma-separated traits", async () => {
    const res = await request(makeApp().app).get(
      "/api/animals?personalityTraits=hungry,zany",
    );

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const animal of res.body) {
      expect(animal.personalityTraits).toEqual(
        expect.arrayContaining(["hungry", "zany"]),
      );
    }
  });

  test("handles a very long trait list without a server error", async () => {
    const traits = Array(1001).fill("hungry").join(",");
    const res = await request(makeApp().app).get(
      `/api/animals?personalityTraits=${traits}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("gets one animal, or a JSON 404", async () => {
    const { app } = makeApp();

    expect((await request(app).get("/api/animals/0")).body.name).toBe(
      "Spindle",
    );
    const missing = await request(app).get("/api/animals/does-not-exist");
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: "Animal not found." });
  });

  test("creates an animal, strips unknown fields and persists it", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post("/api/animals")
      .send({ ...newAnimal, isAdmin: true });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(String), ...newAnimal });
    expect(
      (await request(app).get(`/api/animals/${res.body.id}`)).body,
    ).toEqual(res.body);
  });

  test("rejects an invalid animal with a readable message", async () => {
    const res = await request(makeApp().app)
      .post("/api/animals")
      .send({ ...newAnimal, name: " " });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "name is required" });
  });
});

describe("zookeepers API", () => {
  test("filters by age 0 after creating one", async () => {
    const { app } = makeApp();
    await request(app)
      .post("/api/zookeepers")
      .send({ name: "Baby & Co", age: 0, favoriteAnimal: "otter" })
      .expect(201);

    const res = await request(app).get("/api/zookeepers?age=0");
    expect(res.body.map((z: { name: string }) => z.name)).toEqual([
      "Baby & Co",
    ]);
  });

  test("rejects a missing age and a non-numeric age filter", async () => {
    const { app } = makeApp();

    const post = await request(app)
      .post("/api/zookeepers")
      .send({ name: "Kim", favoriteAnimal: "dolphin" });
    expect(post.status).toBe(400);
    expect(post.body.error).toBe("age must be a number");

    const get = await request(app).get("/api/zookeepers?age=abc");
    expect(get.status).toBe(400);
  });
});

describe("errors and edge cases", () => {
  test("unknown /api routes return a JSON 404, not index.html", async () => {
    const res = await request(makeApp().app).get("/api/nope");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found." });
  });

  test("malformed JSON returns a JSON 400 without a stack trace", async () => {
    const res = await request(makeApp().app)
      .post("/api/animals")
      .set("Content-Type", "application/json")
      .send("{bad json");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Request body is not valid JSON." });
    expect(res.text).not.toMatch(/node_modules|at JSON\.parse/);
  });

  test("oversized and unsupported-charset bodies keep their 4xx status", async () => {
    const { app } = makeApp();
    const tooLarge = await request(app)
      .post("/api/animals")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ name: "x".repeat(20_000) }));
    const badCharset = await request(app)
      .post("/api/animals")
      .set("Content-Type", "application/json; charset=foo")
      .send("{}");

    expect(tooLarge.status).toBe(413);
    expect(badCharset.status).toBe(415);
    expect(badCharset.text).not.toMatch(/node_modules/);
  });

  test("a POST with no body is a 400, not a crash", async () => {
    const res = await request(makeApp().app).post("/api/animals");

    expect(res.status).toBe(400);
  });

  test("rate-limits writes", async () => {
    const { app } = makeApp({ writeLimit: 2 });
    for (let i = 0; i < 2; i++) {
      await request(app).post("/api/animals").send(newAnimal).expect(201);
    }
    const limited = await request(app).post("/api/animals").send(newAnimal);

    expect(limited.status).toBe(429);
    expect(limited.body.error).toMatch(/Too many requests/);
    // Reads are not limited
    await request(app).get("/api/animals").expect(200);
  });

  test("sets security headers", async () => {
    const res = await request(makeApp().app).get("/api/health");

    expect(res.body).toEqual({ status: "ok" });
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["content-security-policy"]).not.toMatch(
      /upgrade-insecure-requests/,
    );
  });
});

describe("HTML pages", () => {
  test.each(["/", "/animals", "/zookeepers", "/some/unknown/page"])(
    "serves %s",
    async (path) => {
      const res = await request(makeApp().app).get(path);

      expect(res.status).toBe(200);
      expect(res.type).toBe("text/html");
    },
  );
});

test("a missing static file is a 404, not the home page", async () => {
  const res = await request(makeApp().app).get("/assets/images/nope.png");

  expect(res.status).toBe(404);
  expect(res.type).not.toBe("text/html");
});
