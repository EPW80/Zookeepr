# Zookeepr

A small catalog of zoo animals and the zookeepers who look after them. An Express 5 API stores records in SQLite and serves a plain HTML, CSS and JavaScript front end for adding and searching them.

![Demo of adding and searching animals](./public/assets/images/demo.gif)

## Stack

- **Server:** Node.js 26 LTS (24 or later supported), Express 5, TypeScript
- **Database:** SQLite through Node's built-in `node:sqlite` (no native modules to install)
- **Validation:** Zod
- **Security:** Helmet headers, rate-limited writes, JSON error responses with no stack traces
- **Front end:** HTML, CSS and vanilla JavaScript modules, no build step
- **Logging:** pino, JSON in production
- **Tooling:** Vitest and Supertest, Playwright, ESLint, Prettier, GitHub Actions, Docker

## Getting started

You need Node.js 24 or later; 26 is the current LTS and what `.nvmrc`, Docker and CI use (`nvm use` picks it up).

```sh
npm install
npm run dev
```

Open http://localhost:3001. On first start the database is created at `data/zookeepr.db` and filled with the starting catalog from `data/animals.json` and `data/zookeepers.json`. Those JSON files are only read, never written.

## Scripts

| Command                 | What it does                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`           | Run the server with TypeScript directly, restarting on changes                     |
| `npm run build`         | Compile `src/` to `dist/`                                                          |
| `npm start`             | Run the compiled server (run `npm run build` first)                                |
| `npm test`              | Run the unit and API tests once                                                    |
| `npm run test:watch`    | Run tests on every change                                                          |
| `npm run test:coverage` | Run tests with a coverage report; fails below the thresholds in `vitest.config.ts` |
| `npm run test:e2e`      | Build the app and run the Playwright browser tests against it                      |
| `npm run lint`          | ESLint                                                                             |
| `npm run format`        | Format with Prettier                                                               |
| `npm run typecheck`     | Type-check the server, tests and front-end JavaScript                              |
| `npm run check`         | Lint, format check, typecheck and unit tests                                       |

## Configuration

Copy `.env.example` to `.env` for local overrides. `npm run dev` reads it; in production, set these in your host's environment.

| Variable        | Default            | Purpose                                                                                                      |
| --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `PORT`          | `3001`             | Port to listen on                                                                                            |
| `DATABASE_PATH` | `data/zookeepr.db` | SQLite file. Put it on a persistent disk in production.                                                      |
| `TRUST_PROXY`   | unset              | Number of proxies in front of the app (`1` on Render), so rate limiting sees real client IPs                 |
| `LOG_LEVEL`     | `info`             | `debug`, `info`, `warn`, `error` or `silent`. Logs are JSON unless running in a terminal outside production. |

## API

All endpoints return JSON. Errors look like `{ "error": "age must be a number" }`.

| Method | Path                  | Notes                                                                                                                  |
| ------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/animals`        | Filters: `name`, `species`, `diet`, `personalityTraits` (comma-separated or repeated; an animal must have every trait) |
| `GET`  | `/api/animals/:id`    | 404 if not found                                                                                                       |
| `POST` | `/api/animals`        | Body: `{ name, species, diet, personalityTraits: string[] }`. Returns 201 with the new animal.                         |
| `GET`  | `/api/zookeepers`     | Filters: `name`, `age`, `favoriteAnimal`                                                                               |
| `GET`  | `/api/zookeepers/:id` | 404 if not found                                                                                                       |
| `POST` | `/api/zookeepers`     | Body: `{ name, age, favoriteAnimal }`. `age` is a whole number from 0 to 150.                                          |
| `GET`  | `/api/health`         | `{ "status": "ok" }`, for health checks                                                                                |

Unknown fields in a POST body are dropped. Strings are trimmed and limited to 100 characters. POSTs are limited to 50 per IP per 15 minutes.

## Deployment

### Docker

Every commit on `main` that passes CI is published to GitHub Container Registry, tagged `latest` and with its commit SHA:

```sh
docker run -p 3001:3001 -v zookeepr-data:/data ghcr.io/epw80/zookeepr:latest
```

Or build it yourself with `docker build -t zookeepr .`. The image runs as a non-root user and keeps the database in the `/data` volume, so records survive restarts and upgrades.

### Render

`render.yaml` is a [Render Blueprint](https://render.com/docs/blueprint-spec) for a Node web service with a 1 GB persistent disk. Persistent disks need a paid instance type. On the free plan the database is wiped on every deploy and restart.

## Changing the database schema

Schema changes live in the `migrations` array in `src/db.ts`. Each one runs once, in order, when the server starts, and SQLite's `user_version` records how many have run. Add a new entry to the end of the array; never edit or reorder one that has shipped.

## Project structure

```
src/
  server.ts          Entry point: config, database, graceful shutdown
  app.ts             Express app: middleware, routes, error handling
  db.ts              Opens SQLite and runs schema migrations
  seed.ts            Loads data/*.json into an empty database
  schemas.ts         Zod schemas for request bodies and query strings
  errors.ts          JSON error handler
  logger.ts          pino logger setup
  repositories/      SQL for animals and zookeepers
  routes/            API and HTML page routes
public/              Static front end
tests/               Vitest suites, run against an in-memory database
  e2e/               Playwright browser tests, run against the built app
data/                Starting catalog
```

## Contributor

Erik Williams
