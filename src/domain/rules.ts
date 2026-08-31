import { DomainError } from "./errors";
import type {
  EntityId,
  Note,
  NoteBase,
  NoteLinkTarget,
  Task,
  TaskStatus,
  UtcTimestamp,
} from "./model";

export const TITLE_MAX_LENGTH = 240;
export const NOTE_BODY_MAX_LENGTH = 10_000;

function codePointLength(value: string): number {
  return Array.from(value).length;
}

export function normalizeTitle(title: string): string {
  const normalized = title.trim();

  if (normalized.length === 0) {
    throw new DomainError("invalid_title", "Title must not be empty.");
  }

  if (codePointLength(normalized) > TITLE_MAX_LENGTH) {
    throw new DomainError(
      "invalid_title",
      `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`,
    );
  }

  return normalized;
}

export function normalizeNoteBody(body: string): string {
  const normalized = body.trim();

  if (normalized.length === 0) {
    throw new DomainError("invalid_note_body", "Note body must not be empty.");
  }

  if (codePointLength(normalized) > NOTE_BODY_MAX_LENGTH) {
    throw new DomainError(
      "invalid_note_body",
      `Note body must be ${NOTE_BODY_MAX_LENGTH.toLocaleString("en-US")} characters or fewer.`,
    );
  }

  return normalized;
}

export function validateNoteLinkTarget(target: NoteLinkTarget): NoteLinkTarget {
  if (target === null || typeof target !== "object") {
    throw new DomainError(
      "invalid_note_link",
      "A note can link to one goal, one task, or no target.",
    );
  }

  const candidate = target as {
    kind?: unknown;
    goalId?: unknown;
    taskId?: unknown;
  };
  const hasGoalId = Object.prototype.hasOwnProperty.call(candidate, "goalId");
  const hasTaskId = Object.prototype.hasOwnProperty.call(candidate, "taskId");

  if (candidate.kind === "none" && !hasGoalId && !hasTaskId) {
    return target;
  }
  if (
    candidate.kind === "goal" &&
    hasGoalId &&
    !hasTaskId &&
    typeof candidate.goalId === "string" &&
    candidate.goalId.length > 0
  ) {
    return target;
  }
  if (
    candidate.kind === "task" &&
    hasTaskId &&
    !hasGoalId &&
    typeof candidate.taskId === "string" &&
    candidate.taskId.length > 0
  ) {
    return target;
  }

  throw new DomainError(
    "invalid_note_link",
    "A note can link to one goal, one task, or no target.",
  );
}

export function applyNoteLink(base: NoteBase, target: NoteLinkTarget): Note {
  switch (target.kind) {
    case "none":
      return base;
    case "goal":
      return { ...base, linkedGoalId: target.goalId };
    case "task":
      return { ...base, linkedTaskId: target.taskId };
  }
}

export function comparePositionThenId<T extends { id: EntityId; position: number }>(
  left: T,
  right: T,
): number {
  return left.position - right.position || left.id.localeCompare(right.id);
}

export function sortByPosition<T extends { id: EntityId; position: number }>(
  entities: readonly T[],
): T[] {
  return [...entities].sort(comparePositionThenId);
}

export function moveTaskToState(
  task: Task,
  status: TaskStatus,
  position: number,
  now: UtcTimestamp,
): Task {
  const shared = {
    ...task,
    status,
    position,
    updatedAt: now,
  };

  if (status === "done") {
    return {
      ...shared,
      status,
      completedAt: task.status === "done" ? task.completedAt : now,
    };
  }

  const { completedAt: _completedAt, ...reopened } = shared;
  return {
    ...reopened,
    status,
  };
}

export function withNormalizedTaskPositions(
  tasks: readonly Task[],
  now: UtcTimestamp,
): Task[] {
  return tasks.map((task, position) =>
    task.position === position
      ? task
      : moveTaskToState(task, task.status, position, now),
  );
}

export function withNormalizedNotePositions(
  notes: readonly Note[],
  now: UtcTimestamp,
): Note[] {
  return notes.map((note, position) =>
    note.position === position
      ? note
      : {
          ...note,
          position,
          updatedAt: now,
        },
  );
}
