import { describe, expect, it } from "vitest";
import { TASK_STATUSES, type Task } from "../../src/domain/model";
import {
  moveTaskToState,
  normalizeNoteBody,
  normalizeTitle,
  validateNoteLinkTarget,
} from "../../src/domain/rules";

const TODO_TASK: Task = {
  id: "task-1",
  goalId: "goal-1",
  phaseId: "phase-1",
  title: "Ship the slice",
  status: "todo",
  priority: "medium",
  position: 0,
  notifyAtDue: true,
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
};

describe("domain rules", () => {
  it("trims a title and enforces the schema maximum", () => {
    expect(normalizeTitle("  Durable goal  ")).toBe("Durable goal");
    expect(normalizeTitle("x".repeat(240))).toHaveLength(240);
    expect(normalizeTitle("🚀".repeat(240))).toBe("🚀".repeat(240));
    expect(() => normalizeTitle("   ")).toThrow("Title must not be empty");
    expect(() => normalizeTitle("x".repeat(241))).toThrow(
      "Title must be 240 characters or fewer",
    );
    expect(() => normalizeTitle("🚀".repeat(241))).toThrow(
      "Title must be 240 characters or fewer",
    );
  });

  it("trims note bodies and enforces the backup-schema text maximum", () => {
    expect(normalizeNoteBody("  First line\nSecond line  ")).toBe(
      "First line\nSecond line",
    );
    expect(normalizeNoteBody("x".repeat(10_000))).toHaveLength(10_000);
    expect(normalizeNoteBody("🚀".repeat(10_000))).toBe("🚀".repeat(10_000));
    expect(() => normalizeNoteBody(" \n ")).toThrow("Note body must not be empty");
    expect(() => normalizeNoteBody("x".repeat(10_001))).toThrow(
      "Note body must be 10,000 characters or fewer",
    );
    expect(() => normalizeNoteBody("🚀".repeat(10_001))).toThrow(
      "Note body must be 10,000 characters or fewer",
    );
  });

  it("accepts exactly one optional note link target", () => {
    expect(validateNoteLinkTarget({ kind: "none" })).toEqual({ kind: "none" });
    expect(validateNoteLinkTarget({ kind: "goal", goalId: "goal-1" })).toEqual({
      kind: "goal",
      goalId: "goal-1",
    });
    expect(validateNoteLinkTarget({ kind: "task", taskId: "task-1" })).toEqual({
      kind: "task",
      taskId: "task-1",
    });
    expect(() =>
      validateNoteLinkTarget({
        kind: "goal",
        goalId: "goal-1",
        taskId: "task-1",
      } as never),
    ).toThrow("one goal, one task, or no target");
    expect(() => validateNoteLinkTarget({ kind: "reminder" } as never)).toThrow(
      "one goal, one task, or no target",
    );
    expect(() => validateNoteLinkTarget(null as never)).toThrow(
      "one goal, one task, or no target",
    );
  });

  it("exposes exactly the three fixed task statuses", () => {
    expect(TASK_STATUSES).toEqual(["todo", "in_progress", "done"]);
  });

  it("sets completedAt when done and clears it when reopened", () => {
    const completed = moveTaskToState(
      TODO_TASK,
      "done",
      0,
      "2026-08-28T01:00:00.000Z",
    );
    expect(completed).toMatchObject({
      status: "done",
      completedAt: "2026-08-28T01:00:00.000Z",
      goalId: TODO_TASK.goalId,
      phaseId: TODO_TASK.phaseId,
      priority: TODO_TASK.priority,
      notifyAtDue: TODO_TASK.notifyAtDue,
    });

    const reopened = moveTaskToState(
      completed,
      "in_progress",
      0,
      "2026-08-28T02:00:00.000Z",
    );
    expect(reopened.status).toBe("in_progress");
    expect(reopened.goalId).toBe(TODO_TASK.goalId);
    expect(reopened.phaseId).toBe(TODO_TASK.phaseId);
    expect("completedAt" in reopened).toBe(false);
  });
});
