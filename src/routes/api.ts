import { Router, type RequestHandler } from "express";
import type { AnimalRepository } from "../repositories/animals.js";
import type { ZookeeperRepository } from "../repositories/zookeepers.js";
import {
  animalQuerySchema,
  newAnimalSchema,
  newZookeeperSchema,
  zookeeperQuerySchema,
} from "../schemas.js";

interface ApiDeps {
  animals: AnimalRepository;
  zookeepers: ZookeeperRepository;
  /** Middleware run before every POST, e.g. a rate limiter. */
  beforeWrite: RequestHandler[];
}

export function createApiRouter({
  animals,
  zookeepers,
  beforeWrite,
}: ApiDeps): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Validation errors thrown by .parse() are turned into 400s by the error
  // handler in app.ts.
  router.get("/animals", (req, res) => {
    res.json(animals.list(animalQuerySchema.parse(req.query)));
  });

  router.get("/animals/:id", (req, res) => {
    const animal = animals.findById(req.params.id);
    if (!animal) {
      res.status(404).json({ error: "Animal not found." });
      return;
    }
    res.json(animal);
  });

  router.post("/animals", ...beforeWrite, (req, res) => {
    res.status(201).json(animals.create(newAnimalSchema.parse(req.body)));
  });

  router.get("/zookeepers", (req, res) => {
    res.json(zookeepers.list(zookeeperQuerySchema.parse(req.query)));
  });

  router.get("/zookeepers/:id", (req, res) => {
    const zookeeper = zookeepers.findById(req.params.id);
    if (!zookeeper) {
      res.status(404).json({ error: "Zookeeper not found." });
      return;
    }
    res.json(zookeeper);
  });

  router.post("/zookeepers", ...beforeWrite, (req, res) => {
    res.status(201).json(zookeepers.create(newZookeeperSchema.parse(req.body)));
  });

  router.use((_req, res) => {
    res.status(404).json({ error: "Not found." });
  });

  return router;
}
