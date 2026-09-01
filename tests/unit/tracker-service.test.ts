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
    const firstPhase = await service.createPhase(first.id, "Same phase");
    const secondPhase = await service.createPhase(second.id, "Same phase");
    const firstTask = await service.createTask(first.id, firstPhase.id, "Same task");
    const secondTask = await service.createTask(second.id, secondPhase.id, "Same task");

    expect(first.id).not.toBe(second.id);
    expect(firstTask.id).not.toBe(secondTask.id);
    expect([first.position, second.position]).toEqual([0, 1]);
    const workspace = await service.getWorkspace();
    expect(workspace.goals.map(({ goal }) => goal.title)).toEqual([
      "Duplicate",
      "Duplicate",
    ]);
    expect(
      workspace.goals.map(({ goal, phases }) => ({
        goalId: goal.id,
        phaseId: phases[0]?.phase.id,
        taskId: phases[0]?.tasks[0]?.id,
        taskTitle: phases[0]?.tasks[0]?.title,
      })),
    ).toEqual([
      {
        goalId: first.id,
        phaseId: firstPhase.id,
        taskId: firstTask.id,
        taskTitle: "Same task",
      },
      {
        goalId: second.id,
        phaseId: secondPhase.id,
        taskId: secondTask.id,
        taskTitle: "Same task",
      },
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

  it("creates, edits, and unlinks ordered notes through a filter-ready inbox", async () => {
    const { service } = createTrackerServiceFixture();
    const goal = await service.createGoal("Goal");
    const phase = await service.createPhase(goal.id, "Phase");
    const task = await service.createTask(goal.id, phase.id, "Task");

    const unlinked = await service.createNote("  First note  ");
    const linkedToGoal = await service.createNote("Goal context", {
      kind: "goal",
      goalId: goal.id,
    });
    const linkedToTask = await service.createNote("Task context", {
      kind: "task",
      taskId: task.id,
    });
    const workspaceBeforeEdit = await service.getWorkspace();

    expect(unlinked).toMatchObject({ body: "First note", position: 0 });
    expect("linkedGoalId" in unlinked).toBe(false);
    expect("linkedTaskId" in unlinked).toBe(false);
    expect(linkedToGoal).toMatchObject({ linkedGoalId: goal.id, position: 1 });
    expect(linkedToTask).toMatchObject({ linkedTaskId: task.id, position: 2 });

    const edited = await service.editNote(linkedToGoal.id, " Updated context ", {
      kind: "task",
      taskId: task.id,
    });
    expect(edited).toMatchObject({
      body: "Updated context",
      linkedTaskId: task.id,
      position: linkedToGoal.position,
      createdAt: linkedToGoal.createdAt,
    });
    expect("linkedGoalId" in edited).toBe(false);
    expect(await service.getWorkspace()).toEqual(workspaceBeforeEdit);

    const unlinkedAgain = await service.editNote(edited.id, edited.body, {
      kind: "none",
    });
    expect("linkedGoalId" in unlinkedAgain).toBe(false);
    expect("linkedTaskId" in unlinkedAgain).toBe(false);
    expect((await service.getInbox()).items.map(({ kind }) => kind)).toEqual([
      "note",
      "note",
      "note",
    ]);

    await service.deleteNote(linkedToTask.id);
    expect(await service.getWorkspace()).toEqual(workspaceBeforeEdit);
    expect(
      (await service.getInbox()).items.some(
        (item) => item.kind === "note" && item.note.id === linkedToTask.id,
      ),
    ).toBe(false);
  });

  it("rejects invalid note bodies and links without writing", async () => {
    const { service } = createTrackerServiceFixture();

    await expect(service.createNote(" \n ")).rejects.toMatchObject({
      code: "invalid_note_body",
    });
    await expect(
      service.createNote("Missing goal", { kind: "goal", goalId: "missing" }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(
      service.createNote("Two links", {
        kind: "goal",
        goalId: "goal-1",
        taskId: "task-1",
      } as never),
    ).rejects.toMatchObject({ code: "invalid_note_link" });

    expect((await service.getInbox()).items).toEqual([]);
  });

  it("reorders and deletes notes with contiguous positions", async () => {
    const { service } = createTrackerServiceFixture();
    const first = await service.createNote("First");
    const second = await service.createNote("Second");
    const third = await service.createNote("Third");

    await service.reorderNote(third.id, first.id, "before");
    expect(
      (await service.getInbox()).items
        .filter((item) => item.kind === "note")
        .map(({ note }) => [note.body, note.position]),
    ).toEqual([
      ["Third", 0],
      ["First", 1],
      ["Second", 2],
    ]);

    await service.deleteNote(first.id);
    expect(
      (await service.getInbox()).items
        .filter((item) => item.kind === "note")
        .map(({ note }) => [note.body, note.position]),
    ).toEqual([
      ["Third", 0],
      ["Second", 1],
    ]);
    const beforeRejectedReorders = await service.getInbox();
    await expect(service.reorderNote(second.id, second.id, "before")).rejects.toMatchObject(
      { code: "invalid_reorder_target" },
    );
    await expect(service.reorderNote(second.id, "missing", "after")).rejects.toMatchObject(
      { code: "not_found" },
    );
    await expect(
      service.reorderNote(second.id, third.id, "sideways" as never),
    ).rejects.toMatchObject({ code: "invalid_reorder_target" });
    expect(await service.getInbox()).toEqual(beforeRejectedReorders);
  });

  it("creates and toggles checklist items without mutating task state", async () => {
    const { service } = createTrackerServiceFixture();
    const goal = await service.createGoal("Goal");
    const phase = await service.createPhase(goal.id, "Phase");
    const task = await service.createTask(goal.id, phase.id, "Task");
    const linkedNote = await service.createNote("Task context remains", {
      kind: "task",
      taskId: task.id,
    });
    const first = await service.createChecklistItem(task.id, " First step ");
    const second = await service.createChecklistItem(task.id, "Second step");

    expect(first).toMatchObject({
      taskId: task.id,
      title: "First step",
      isCompleted: false,
      position: 0,
    });
    expect(second.position).toBe(1);

    const completed = await service.setChecklistItemCompleted(task.id, first.id, true);
    const afterToggle = await service.getTaskChecklist(task.id);
    expect(completed).toMatchObject({ isCompleted: true, taskId: task.id });
    expect(afterToggle.task).toEqual(task);
    expect(afterToggle.checklistItems.map((item) => item.isCompleted)).toEqual([
      true,
      false,
    ]);
    expect(await service.getChecklistProgress()).toEqual({
      [task.id]: { completed: 1, total: 2 },
    });

    await service.setChecklistItemCompleted(task.id, second.id, true);
    const afterAllChecked = await service.getTaskChecklist(task.id);
    expect(afterAllChecked.task).toEqual(task);
    expect(afterAllChecked.checklistItems.map((item) => item.isCompleted)).toEqual([
      true,
      true,
    ]);
    expect(await service.getChecklistProgress()).toEqual({
      [task.id]: { completed: 2, total: 2 },
    });

    await service.moveTaskToStatus(task.id, "done");
    const afterTaskDone = await service.getTaskChecklist(task.id);
    expect(afterTaskDone.task.status).toBe("done");
    expect(afterTaskDone.checklistItems.map((item) => item.isCompleted)).toEqual([
      true,
      true,
    ]);
    await service.moveTaskToStatus(task.id, "in_progress");
    const afterTaskReopened = await service.getTaskChecklist(task.id);
    expect(afterTaskReopened.task.status).toBe("in_progress");
    expect(afterTaskReopened.checklistItems.map((item) => item.isCompleted)).toEqual([
      true,
      true,
    ]);
    expect(await service.getChecklistProgress()).toEqual({
      [task.id]: { completed: 2, total: 2 },
    });
    expect(
      (await service.getInbox()).items.find((item) => item.kind === "note")?.note,
    ).toEqual(linkedNote);
  });

  it("rejects checklist parent mismatches and missing parents without writes", async () => {
    const { service } = createTrackerServiceFixture();
    const goal = await service.createGoal("Goal");
    const phase = await service.createPhase(goal.id, "Phase");
    const firstTask = await service.createTask(goal.id, phase.id, "First task");
    const secondTask = await service.createTask(goal.id, phase.id, "Second task");
    const item = await service.createChecklistItem(firstTask.id, "Step");

    await expect(
      service.setChecklistItemCompleted(secondTask.id, item.id, true),
    ).rejects.toMatchObject({ code: "parent_mismatch" });
    await expect(service.createChecklistItem("missing", "Step")).rejects.toMatchObject({
      code: "not_found",
    });
    await expect(
      service.setChecklistItemCompleted(firstTask.id, "missing", true),
    ).rejects.toMatchObject({ code: "not_found" });

    expect((await service.getTaskChecklist(firstTask.id)).checklistItems).toEqual([
      item,
    ]);
  });

  it("round-trips backup and restore deterministically", async () => {
    const { service } = createTrackerServiceFixture();
    
    // Create some data
    const goal = await service.createGoal("Backup Goal");
    const phase = await service.createPhase(goal.id, "Backup Phase");
    const task = await service.createTask(goal.id, phase.id, "Backup Task");
    await service.createChecklistItem(task.id, "Backup Checklist");
    await service.createNote("Backup Note", { kind: "none" });

    const originalBackup = await service.exportBackup("0.1.0");
    
    // Modify database to simulate overwrite
    await service.createGoal("Should be erased");
    
    // Restore
    await service.restoreBackup(originalBackup);
    
    const restoredBackup = await service.exportBackup("0.1.0");
    
    // Should be exactly identical
    expect({ ...restoredBackup, exportedAt: "" }).toEqual({ ...originalBackup, exportedAt: "" });
    
    // Verify erased is gone
    const workspace = await service.getWorkspace();
    expect(workspace.goals.length).toBe(1);
    expect(workspace.goals[0]?.goal.title).toBe("Backup Goal");
  });

});
