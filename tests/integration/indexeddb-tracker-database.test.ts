import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { TrackerService } from "../../src/application/tracker-service";
import type {
  StoreName,
  TrackerDatabase,
  TrackerRepositories,
  TransactionMode,
} from "../../src/application/ports";
import type { Goal, Phase, Task } from "../../src/domain/model";
import { FailNextWriteDatabase } from "../../src/infrastructure/db/fail-next-write-database";
import { IndexedDbTrackerDatabase } from "../../src/infrastructure/db/indexeddb-tracker-database";

let databaseSequence = 0;

function requestCompletion(request: IDBRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(), { once: true });
    request.addEventListener(
      "error",
      () => reject(request.error ?? new Error("IndexedDB request failed.")),
      { once: true },
    );
  });
}

function transactionCompletion(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener(
      "abort",
      () => reject(transaction.error ?? new Error("IndexedDB transaction aborted.")),
      { once: true },
    );
    transaction.addEventListener(
      "error",
      () => reject(transaction.error ?? new Error("IndexedDB transaction failed.")),
      { once: true },
    );
  });
}

async function seedVersionOneDatabase(
  name: string,
  records: { goal: Goal; phase: Phase; task: Task },
): Promise<void> {
  const openRequest = indexedDB.open(name, 1);
  openRequest.addEventListener("upgradeneeded", () => {
    const database = openRequest.result;
    const goals = database.createObjectStore("goals", { keyPath: "id" });
    goals.createIndex("by-position", ["position", "id"], { unique: true });
    const phases = database.createObjectStore("phases", { keyPath: "id" });
    phases.createIndex("by-goal-position", ["goalId", "position", "id"], {
      unique: true,
    });
    const tasks = database.createObjectStore("tasks", { keyPath: "id" });
    tasks.createIndex("by-phase-position", ["phaseId", "position", "id"], {
      unique: false,
    });
    tasks.createIndex(
      "by-phase-status-position",
      ["phaseId", "status", "position", "id"],
      { unique: true },
    );
  });
  await requestCompletion(openRequest);

  const database = openRequest.result;
  const transaction = database.transaction(["goals", "phases", "tasks"], "readwrite");
  transaction.objectStore("goals").put(records.goal);
  transaction.objectStore("phases").put(records.phase);
  transaction.objectStore("tasks").put(records.task);
  await transactionCompletion(transaction);
  database.close();
}

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

  it("persists note links, note order, and checklist state after reopen", async () => {
    const name = `my-tracker-m2-reopen-${databaseSequence}`;
    const first = createFixture(name);
    const goal = await first.service.createGoal("Durable goal");
    const phase = await first.service.createPhase(goal.id, "M2");
    const task = await first.service.createTask(goal.id, phase.id, "Persist M2 data");
    const firstNote = await first.service.createNote("First note", {
      kind: "goal",
      goalId: goal.id,
    });
    const secondNote = await first.service.createNote("Second note", {
      kind: "task",
      taskId: task.id,
    });
    await first.service.reorderNote(secondNote.id, firstNote.id, "before");
    const checklistItem = await first.service.createChecklistItem(
      task.id,
      "Persist checklist state",
    );
    await first.service.setChecklistItemCompleted(task.id, checklistItem.id, true);
    await first.database.close();

    const reopened = createFixture(name);
    expect((await reopened.service.getInbox()).items.map(({ note }) => note)).toEqual([
      expect.objectContaining({
        id: secondNote.id,
        linkedTaskId: task.id,
        position: 0,
      }),
      expect.objectContaining({
        id: firstNote.id,
        linkedGoalId: goal.id,
        position: 1,
      }),
    ]);
    expect((await reopened.service.getTaskChecklist(task.id)).checklistItems).toEqual([
      expect.objectContaining({
        id: checklistItem.id,
        taskId: task.id,
        isCompleted: true,
        position: 0,
      }),
    ]);
    await reopened.database.close();
  });

  it("upgrades a populated v1 database to v2 without changing M1 records", async () => {
    const name = `my-tracker-v1-upgrade-${databaseSequence}`;
    const goal: Goal = {
      id: "v1-goal",
      title: "Existing goal",
      status: "active",
      position: 0,
      createdAt: "2026-08-28T07:00:00.000Z",
      updatedAt: "2026-08-28T07:00:00.000Z",
    };
    const phase: Phase = {
      id: "v1-phase",
      goalId: goal.id,
      title: "Existing phase",
      position: 0,
      createdAt: "2026-08-28T07:01:00.000Z",
      updatedAt: "2026-08-28T07:01:00.000Z",
    };
    const task: Task = {
      id: "v1-task",
      goalId: goal.id,
      phaseId: phase.id,
      title: "Existing completed task",
      status: "done",
      priority: "high",
      position: 0,
      notifyAtDue: true,
      completedAt: "2026-08-28T07:03:00.000Z",
      createdAt: "2026-08-28T07:02:00.000Z",
      updatedAt: "2026-08-28T07:03:00.000Z",
    };
    await seedVersionOneDatabase(name, { goal, phase, task });

    const upgraded = createFixture(name);
    expect(await upgraded.service.getWorkspace()).toEqual({
      goals: [
        {
          goal,
          phases: [{ phase, tasks: [task] }],
        },
      ],
    });
    expect((await upgraded.service.getInbox()).items).toEqual([]);
    expect((await upgraded.service.getTaskChecklist(task.id)).checklistItems).toEqual([]);

    const note = await upgraded.service.createNote("Created after upgrade", {
      kind: "task",
      taskId: task.id,
    });
    const checklistItem = await upgraded.service.createChecklistItem(
      task.id,
      "Created after upgrade",
    );
    await upgraded.database.close();

    const reopened = createFixture(name);
    expect((await reopened.service.getWorkspace()).goals[0]?.phases[0]?.tasks[0]).toEqual(
      task,
    );
    expect((await reopened.service.getInbox()).items[0]?.note).toEqual(note);
    expect((await reopened.service.getTaskChecklist(task.id)).checklistItems[0]).toEqual(
      checklistItem,
    );
    await reopened.database.close();
  });

  it("retries a blocked v1 to v2 upgrade through the same adapter", async () => {
    const name = `my-tracker-blocked-upgrade-${databaseSequence}`;
    const goal: Goal = {
      id: "blocked-goal",
      title: "Blocked upgrade goal",
      status: "active",
      position: 0,
      createdAt: "2026-08-28T07:00:00.000Z",
      updatedAt: "2026-08-28T07:00:00.000Z",
    };
    const phase: Phase = {
      id: "blocked-phase",
      goalId: goal.id,
      title: "Blocked phase",
      position: 0,
      createdAt: "2026-08-28T07:01:00.000Z",
      updatedAt: "2026-08-28T07:01:00.000Z",
    };
    const task: Task = {
      id: "blocked-task",
      goalId: goal.id,
      phaseId: phase.id,
      title: "Blocked task",
      status: "todo",
      priority: "medium",
      position: 0,
      notifyAtDue: true,
      createdAt: "2026-08-28T07:02:00.000Z",
      updatedAt: "2026-08-28T07:02:00.000Z",
    };
    await seedVersionOneDatabase(name, { goal, phase, task });

    const blockerRequest = indexedDB.open(name, 1);
    await requestCompletion(blockerRequest);
    const blocker = blockerRequest.result;
    const upgraded = createFixture(name);

    await expect(upgraded.service.getInbox()).rejects.toThrow("upgrade is blocked");
    blocker.close();

    await expect(upgraded.service.getInbox()).resolves.toEqual({ items: [] });
    expect((await upgraded.service.getWorkspace()).goals[0]?.goal).toEqual(goal);
    await upgraded.database.close();
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
            checklistItems: repositories.checklistItems,
            notes: repositories.notes,
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

  it("rolls back note reorder after a partial IndexedDB normalization write", async () => {
    const name = `my-tracker-note-reorder-rollback-${databaseSequence}`;
    const fixture = createFixture(name);
    const first = await fixture.service.createNote("First");
    await fixture.service.createNote("Second");
    const third = await fixture.service.createNote("Third");
    const before = await fixture.service.getInbox();

    const failAfterOneNoteWrite: TrackerDatabase = {
      transaction<T>(
        stores: readonly StoreName[],
        mode: TransactionMode,
        operation: (repositories: TrackerRepositories) => Promise<T>,
      ): Promise<T> {
        return fixture.database.transaction(stores, mode, (repositories) =>
          operation({
            ...repositories,
            notes: {
              get: (id) => repositories.notes.get(id),
              list: () => repositories.notes.list(),
              put: (note) => repositories.notes.put(note),
              delete: (id) => repositories.notes.delete(id),
              putMany: async (notes) => {
                const firstWrite = notes[0];
                if (firstWrite !== undefined) {
                  await repositories.notes.put(firstWrite);
                }
                throw new Error("Simulated failure after one note write.");
              },
            },
          }),
        );
      },
    };
    const failingService = new TrackerService(failAfterOneNoteWrite, {
      createId: () => "unused-id",
      clock: () => "2026-08-28T14:00:00.000Z",
    });

    await expect(failingService.reorderNote(third.id, first.id, "before")).rejects.toThrow(
      "after one note write",
    );
    await fixture.database.close();

    const reopened = createFixture(name);
    expect(await reopened.service.getInbox()).toEqual(before);
    await reopened.database.close();
  });

  it("rolls back note deletion and position normalization together", async () => {
    const name = `my-tracker-note-delete-rollback-${databaseSequence}`;
    const fixture = createFixture(name);
    const first = await fixture.service.createNote("First");
    await fixture.service.createNote("Second");
    await fixture.service.createNote("Third");
    const before = await fixture.service.getInbox();

    const failAfterDelete: TrackerDatabase = {
      transaction<T>(
        stores: readonly StoreName[],
        mode: TransactionMode,
        operation: (repositories: TrackerRepositories) => Promise<T>,
      ): Promise<T> {
        return fixture.database.transaction(stores, mode, (repositories) =>
          operation({
            ...repositories,
            notes: {
              get: (id) => repositories.notes.get(id),
              list: () => repositories.notes.list(),
              put: (note) => repositories.notes.put(note),
              delete: (id) => repositories.notes.delete(id),
              putMany: async () => {
                throw new Error("Simulated failure after note deletion.");
              },
            },
          }),
        );
      },
    };
    const failingService = new TrackerService(failAfterDelete, {
      createId: () => "unused-id",
      clock: () => "2026-08-28T15:00:00.000Z",
    });

    await expect(failingService.deleteNote(first.id)).rejects.toThrow(
      "after note deletion",
    );
    await fixture.database.close();

    const reopened = createFixture(name);
    expect(await reopened.service.getInbox()).toEqual(before);
    await reopened.database.close();
  });
});
