import { describe, expect, it } from "vitest";
import { createTrackerServiceFixture } from "../support/tracker-service-fixture";

describe("TrackerService", () => {
  it("creates the durable hierarchy with contract-aligned defaults", async () => {
    const { service } = createTrackerServiceFixture();
    const goal = await service.createGoal("  Build M1  ");
    const phase = await service.createPhase(goal.id, "Foundation");
    const task = await service.createTask(goal.id, phase.id, "Create stores");

    expect(goal).toMatchObject({ title: "Build M1", status: "active", position: 0 });
    expect(task).toMatchObject({
      goalId: goal.id,
      phaseId: phase.id,
      status: "todo",
      priority: "medium",
      position: 0,
      notifyAtDue: true,
    });
    expect("completedAt" in task).toBe(false);

    const workspace = await service.getWorkspace();
    expect(workspace.goals[0]?.phases[0]?.tasks[0]?.id).toBe(task.id);
  });

  it("rejects an inconsistent goal and phase without creating a task", async () => {
    const { service } = createTrackerServiceFixture();
    const firstGoal = await service.createGoal("First");
    const secondGoal = await service.createGoal("Second");
    const phase = await service.createPhase(firstGoal.id, "Owned by first");

    await expect(
      service.createTask(secondGoal.id, phase.id, "Invalid parent"),
    ).rejects.toMatchObject({ code: "parent_mismatch" });

    const workspace = await service.getWorkspace();
    expect(workspace.goals[0]?.phases[0]?.tasks).toEqual([]);
  });

  it("allows duplicate titles while preserving distinct IDs and append order", async () => {
    const { service } = createTrackerServiceFixture();
    const first = await service.createGoal("Duplicate");
    const second = await service.createGoal("Duplicate");

    expect(first.id).not.toBe(second.id);
    expect([first.position, second.position]).toEqual([0, 1]);
    expect((await service.getWorkspace()).goals.map(({ goal }) => goal.title)).toEqual([
      "Duplicate",
      "Duplicate",
    ]);
  });

  it("renames only the requested entity with a trimmed title", async () => {
    const { service } = createTrackerServiceFixture();
    const goal = await service.createGoal("Original goal");
    const phase = await service.createPhase(goal.id, "Original phase");
    const task = await service.createTask(goal.id, phase.id, "Original task");
    const untouchedTask = await service.createTask(goal.id, phase.id, "Untouched task");

    const renamedGoal = await service.renameGoal(goal.id, " Renamed goal ");
    const renamedPhase = await service.renamePhase(phase.id, " Renamed phase ");
    const renamedTask = await service.renameTask(task.id, " Renamed task ");

    expect(renamedGoal.title).toBe("Renamed goal");
    expect(renamedPhase.title).toBe("Renamed phase");
    expect(renamedTask.title).toBe("Renamed task");
    expect(renamedTask.phaseId).toBe(phase.id);
    expect(renamedTask.updatedAt).not.toBe(task.updatedAt);
    expect({ ...renamedTask, title: task.title, updatedAt: task.updatedAt }).toEqual(task);
    const workspace = await service.getWorkspace();
    expect(
      workspace.goals[0]?.phases[0]?.tasks.find(
        (candidate) => candidate.id === untouchedTask.id,
      ),
    ).toEqual(untouchedTask);
  });

  it("appends cross-status moves and normalizes source and destination positions", async () => {
    const { service } = createTrackerServiceFixture();
    const goal = await service.createGoal("Goal");
    const phase = await service.createPhase(goal.id, "Phase");
    const first = await service.createTask(goal.id, phase.id, "First");
    const second = await service.createTask(goal.id, phase.id, "Second");
    const third = await service.createTask(goal.id, phase.id, "Third");

    await service.moveTaskToStatus(first.id, "in_progress");
    await service.moveTaskToStatus(third.id, "in_progress");

    const tasks = (await service.getWorkspace()).goals[0]?.phases[0]?.tasks ?? [];
    const todo = tasks.filter((task) => task.status === "todo");
    const inProgress = tasks.filter((task) => task.status === "in_progress");
    expect(todo.map((task) => [task.title, task.position])).toEqual([["Second", 0]]);
    expect(inProgress.map((task) => [task.title, task.position])).toEqual([
      ["First", 0],
      ["Third", 1],
    ]);
    expect(second.status).toBe("todo");
  });

  it("reorders only within one phase and status", async () => {
    const { service } = createTrackerServiceFixture();
    const goal = await service.createGoal("Goal");
    const phase = await service.createPhase(goal.id, "Phase");
    const first = await service.createTask(goal.id, phase.id, "First");
    const second = await service.createTask(goal.id, phase.id, "Second");
    const third = await service.createTask(goal.id, phase.id, "Third");

    await service.reorderTask(third.id, first.id, "before");
    let tasks = (await service.getWorkspace()).goals[0]?.phases[0]?.tasks ?? [];
    expect(tasks.map((task) => [task.title, task.position])).toEqual([
      ["Third", 0],
      ["First", 1],
      ["Second", 2],
    ]);

    await service.reorderTask(third.id, second.id, "after");
    tasks = (await service.getWorkspace()).goals[0]?.phases[0]?.tasks ?? [];
    expect(tasks.map((task) => [task.title, task.position])).toEqual([
      ["First", 0],
      ["Second", 1],
      ["Third", 2],
    ]);

    await service.moveTaskToStatus(second.id, "done");
    await expect(service.reorderTask(second.id, first.id, "before")).rejects.toMatchObject({
      code: "invalid_reorder_target",
    });

    tasks = (await service.getWorkspace()).goals[0]?.phases[0]?.tasks ?? [];
    expect(tasks.find((task) => task.id === second.id)?.status).toBe("done");
  });

  it("rejects invalid titles without writing", async () => {
    const { service } = createTrackerServiceFixture();

    await expect(service.createGoal("  ")).rejects.toMatchObject({ code: "invalid_title" });
    expect((await service.getWorkspace()).goals).toEqual([]);
  });

  it("rejects unknown runtime statuses and missing move targets without writes", async () => {
    const { service } = createTrackerServiceFixture();
    const goal = await service.createGoal("Goal");
    const phase = await service.createPhase(goal.id, "Phase");
    const task = await service.createTask(goal.id, phase.id, "Task");
    const before = await service.getWorkspace();

    await expect(
      service.moveTaskToStatus(task.id, "blocked" as never),
    ).rejects.toMatchObject({ code: "invalid_status" });
    await expect(service.moveTaskToStatus("missing-task", "done")).rejects.toMatchObject({
      code: "not_found",
    });

    expect(await service.getWorkspace()).toEqual(before);
  });
});
