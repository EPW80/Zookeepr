import path from "node:path";
import { Router } from "express";

export function createHtmlRouter(publicDir: string): Router {
  const router = Router();
  const page = (file: string) => path.join(publicDir, file);

  router.get("/", (_req, res) => res.sendFile(page("index.html")));
  router.get("/animals", (_req, res) => res.sendFile(page("animals.html")));
  router.get("/zookeepers", (_req, res) =>
    res.sendFile(page("zookeepers.html")),
  );
  // Any other page falls back to the home page, but a missing file
  // (anything with an extension, like /assets/nope.png) is a real 404
  router.get("/{*splat}", (req, res) => {
    if (path.extname(req.path)) {
      res.status(404).type("text").send("Not found");
      return;
    }
    res.sendFile(page("index.html"));
  });

  return router;
}
