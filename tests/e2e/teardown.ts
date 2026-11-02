import { rmSync } from "node:fs";

/** Delete the run's temporary database and its WAL files. */
export default function teardown() {
  const file = process.env.E2E_DATABASE_PATH;
  if (!file) return;
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(file + suffix, { force: true });
  }
}
