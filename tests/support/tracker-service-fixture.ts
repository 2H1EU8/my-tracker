import { TrackerService } from "../../src/application/tracker-service";
import { InMemoryTrackerDatabase } from "./in-memory-tracker-database";

export function createTrackerServiceFixture() {
  const database = new InMemoryTrackerDatabase();
  let id = 0;
  let tick = 0;
  const service = new TrackerService(database, {
    createId: () => `id-${++id}`,
    clock: () => new Date(Date.UTC(2026, 7, 28, 10, 0, tick++)).toISOString(),
  });

  return { database, service };
}
