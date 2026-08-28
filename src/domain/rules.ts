import { DomainError } from "./errors";
import type { EntityId, Task, TaskStatus, UtcTimestamp } from "./model";

export const TITLE_MAX_LENGTH = 240;

export function normalizeTitle(title: string): string {
  const normalized = title.trim();

  if (normalized.length === 0) {
    throw new DomainError("invalid_title", "Title must not be empty.");
  }

  if (normalized.length > TITLE_MAX_LENGTH) {
    throw new DomainError(
      "invalid_title",
      `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`,
    );
  }

  return normalized;
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
