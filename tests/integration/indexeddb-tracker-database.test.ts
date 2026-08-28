import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { TrackerService } from "../../src/application/tracker-service";
import type {
  StoreName,
  TrackerDatabase,
  TrackerRepositories,
  TransactionMode,
} from "../../src/application/ports";
import { FailNextWriteDatabase } from "../../src/infrastructure/db/fail-next-write-database";
import { IndexedDbTrackerDatabase } from "../../src/infrastructure/db/indexeddb-tracker-database";

let databaseSequence = 0;

function createFixture(databaseName?: string) {
  const database = new IndexedDbTrackerDatabase(
    indexedDB,
    databaseName ?? `my-tracker-test-${++databaseSequence}`,
  );
  let id = 0;
  let tick = 0;
  const service = new TrackerService(database, {
    createId: () => `id-${++id}`,
    clock: () => new Date(Date.UTC(2026, 7, 28, 11, 0, tick++)).toISOString(),
  });

  return { database, service };
}

describe("IndexedDbTrackerDatabase", () => {
  beforeEach(() => {
    databaseSequence += 1;
  });

  it("persists normalized hierarchy records after closing and reopening", async () => {
    const name = `my-tracker-reopen-${databaseSequence}`;
    const first = createFixture(name);
    const goal = await first.service.createGoal("Durable goal");
    const phase = await first.service.createPhase(goal.id, "M1");
    const task = await first.service.createTask(goal.id, phase.id, "Persist this task");
    const second = await first.service.createTask(goal.id, phase.id, "Second task");
    const third = await first.service.createTask(goal.id, phase.id, "Third task");
    await first.service.renameTask(task.id, "Persist renamed task");
    await first.service.moveTaskToStatus(task.id, "in_progress");
    await first.service.reorderTask(third.id, second.id, "before");
    await first.database.close();

    const reopened = createFixture(name);
    const workspace = await reopened.service.getWorkspace();
    const persistedTasks = workspace.goals[0]?.phases[0]?.tasks ?? [];
    const persistedTask = persistedTasks.find((candidate) => candidate.id === task.id);

    expect(workspace.goals[0]?.goal.id).toBe(goal.id);
    expect(workspace.goals[0]?.phases[0]?.phase.id).toBe(phase.id);
    expect(persistedTask).toMatchObject({
      id: task.id,
      title: "Persist renamed task",
      status: "in_progress",
      position: 0,
    });
    expect(
      persistedTasks
        .filter((candidate) => candidate.status === "todo")
        .map((candidate) => [candidate.id, candidate.position]),
    ).toEqual([
      [third.id, 0],
      [second.id, 1],
    ]);
    await reopened.database.close();
  });

  it("rolls back writes when an operation fails before transaction commit", async () => {
    const { database, service } = createFixture();
    const goal = await service.createGoal("Goal");
    const phase = await service.createPhase(goal.id, "Phase");
    const task = await service.createTask(goal.id, phase.id, "Persisted title");

    await expect(
      database.transaction(["tasks"], "readwrite", async (repositories) => {
        await repositories.tasks.put({ ...task, title: "Must roll back" });
        throw new Error("Simulated failure after a write request.");
      }),
    ).rejects.toThrow("Simulated failure");

    const persistedTask = (await service.getWorkspace()).goals[0]?.phases[0]?.tasks[0];
    expect(persistedTask?.title).toBe("Persisted title");
    await database.close();
  });

  it("commits cross-status normalization atomically and keeps contiguous order", async () => {
    const { database, service } = createFixture();
    const goal = await service.createGoal("Goal");
    const phase = await service.createPhase(goal.id, "Phase");
    const first = await service.createTask(goal.id, phase.id, "First");
    const second = await service.createTask(goal.id, phase.id, "Second");
    const third = await service.createTask(goal.id, phase.id, "Third");

    await service.moveTaskToStatus(first.id, "done");
    await service.moveTaskToStatus(third.id, "done");
    await service.moveTaskToStatus(first.id, "todo");

    const tasks = (await service.getWorkspace()).goals[0]?.phases[0]?.tasks ?? [];
    expect(
      tasks
        .filter((task) => task.status === "todo")
        .map((task) => [task.id, task.position, "completedAt" in task]),
    ).toEqual([
      [second.id, 0, false],
      [first.id, 1, false],
    ]);
    expect(
      tasks
        .filter((task) => task.status === "done")
        .map((task) => [task.id, task.position, "completedAt" in task]),
    ).toEqual([[third.id, 0, true]]);
    await database.close();
  });

  it("surfaces one write failure and succeeds on retry without a partial create", async () => {
    const fixture = createFixture();
    const failingDatabase = new FailNextWriteDatabase(fixture.database);
    const service = new TrackerService(failingDatabase, {
      createId: () => "goal-retry",
      clock: () => "2026-08-28T12:00:00.000Z",
    });

    await expect(service.createGoal("Retry me")).rejects.toThrow("Simulated save failure");
    expect((await service.getWorkspace()).goals).toEqual([]);

    await expect(service.createGoal("Retry me")).resolves.toMatchObject({
      id: "goal-retry",
      title: "Retry me",
    });
    expect((await service.getWorkspace()).goals).toHaveLength(1);
    await fixture.database.close();
  });

  it("aborts a multi-record move after an IndexedDB write and preserves the reconnect snapshot", async () => {
    const name = `my-tracker-mid-write-${databaseSequence}`;
    const fixture = createFixture(name);
    const goal = await fixture.service.createGoal("Goal");
    const phase = await fixture.service.createPhase(goal.id, "Phase");
    const first = await fixture.service.createTask(goal.id, phase.id, "First");
    await fixture.service.createTask(goal.id, phase.id, "Second");
    await fixture.service.createTask(goal.id, phase.id, "Third");
    const before = await fixture.service.getWorkspace();

    const failAfterOneTaskWrite: TrackerDatabase = {
      transaction<T>(
        stores: readonly StoreName[],
        mode: TransactionMode,
        operation: (repositories: TrackerRepositories) => Promise<T>,
      ): Promise<T> {
        return fixture.database.transaction(stores, mode, (repositories) =>
          operation({
            goals: repositories.goals,
            phases: repositories.phases,
            tasks: {
              get: (id) => repositories.tasks.get(id),
              list: () => repositories.tasks.list(),
              listByPhase: (phaseId) => repositories.tasks.listByPhase(phaseId),
              put: (task) => repositories.tasks.put(task),
              putMany: async (tasks) => {
                const firstWrite = tasks[0];
                if (firstWrite !== undefined) {
                  await repositories.tasks.put(firstWrite);
                }
                throw new Error("Simulated failure after one task write.");
              },
            },
          }),
        );
      },
    };
    const failingService = new TrackerService(failAfterOneTaskWrite, {
      createId: () => "unused-id",
      clock: () => "2026-08-28T13:00:00.000Z",
    });

    await expect(failingService.moveTaskToStatus(first.id, "done")).rejects.toThrow(
      "after one task write",
    );
    await fixture.database.close();

    const reopened = createFixture(name);
    expect(await reopened.service.getWorkspace()).toEqual(before);
    await reopened.database.close();
  });
});
