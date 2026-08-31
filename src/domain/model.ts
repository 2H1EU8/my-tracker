export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export const GOAL_STATUSES = ["active", "completed", "archived"] as const;
export const GOAL_COLORS = ["amber", "sage", "blue", "mauve", "clay"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type GoalStatus = (typeof GOAL_STATUSES)[number];
export type GoalColor = (typeof GOAL_COLORS)[number];

export type EntityId = string;
export type UtcTimestamp = string;

export interface Goal {
  id: EntityId;
  title: string;
  description?: string;
  status: GoalStatus;
  color?: GoalColor;
  position: number;
  createdAt: UtcTimestamp;
  updatedAt: UtcTimestamp;
}

export interface Phase {
  id: EntityId;
  goalId: EntityId;
  title: string;
  description?: string;
  position: number;
  createdAt: UtcTimestamp;
  updatedAt: UtcTimestamp;
}

export interface ChecklistItem {
  id: EntityId;
  taskId: EntityId;
  title: string;
  isCompleted: boolean;
  position: number;
  createdAt: UtcTimestamp;
  updatedAt: UtcTimestamp;
}

export type NoteLinkTarget =
  | { kind: "none" }
  | { kind: "goal"; goalId: EntityId }
  | { kind: "task"; taskId: EntityId };

export interface NoteBase {
  id: EntityId;
  body: string;
  position: number;
  createdAt: UtcTimestamp;
  updatedAt: UtcTimestamp;
}

export type Note = NoteBase &
  (
    | {
        linkedGoalId?: never;
        linkedTaskId?: never;
      }
    | {
        linkedGoalId: EntityId;
        linkedTaskId?: never;
      }
    | {
        linkedGoalId?: never;
        linkedTaskId: EntityId;
      }
  );

interface TaskBase {
  id: EntityId;
  goalId: EntityId;
  phaseId: EntityId;
  title: string;
  description?: string;
  priority: TaskPriority;
  position: number;
  notifyAtDue: boolean;
  createdAt: UtcTimestamp;
  updatedAt: UtcTimestamp;
}

export type Task = TaskBase &
  (
    | {
        dueAt: UtcTimestamp;
        timeZone: string;
      }
    | {
        dueAt?: never;
        timeZone?: never;
      }
  ) &
  (
    | {
        status: "done";
        completedAt: UtcTimestamp;
      }
    | {
        status: "todo" | "in_progress";
        completedAt?: never;
      }
  );

export interface PhaseTree {
  phase: Phase;
  tasks: Task[];
}

export interface GoalTree {
  goal: Goal;
  phases: PhaseTree[];
}

export interface WorkspaceSnapshot {
  goals: GoalTree[];
}

export interface NoteInboxItem {
  kind: "note";
  note: Note;
}

export type InboxItem = NoteInboxItem;

export interface InboxSnapshot {
  items: InboxItem[];
}

export interface TaskChecklistSnapshot {
  task: Task;
  checklistItems: ChecklistItem[];
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}
