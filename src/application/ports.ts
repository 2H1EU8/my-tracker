import type { ChecklistItem, Goal, Note, Phase, Task, Reminder } from "../domain/model";

export type StoreName =
  | "goals"
  | "phases"
  | "tasks"
  | "checklistItems"
  | "notes"
  | "reminders";
export type TransactionMode = "readonly" | "readwrite";

export interface GoalRepository {
  get(id: string): Promise<Goal | undefined>;
  list(): Promise<Goal[]>;
  put(goal: Goal): Promise<void>;
  putMany(goals: readonly Goal[]): Promise<void>;
}

export interface PhaseRepository {
  get(id: string): Promise<Phase | undefined>;
  list(): Promise<Phase[]>;
  listByGoal(goalId: string): Promise<Phase[]>;
  put(phase: Phase): Promise<void>;
  putMany(phases: readonly Phase[]): Promise<void>;
}

export interface TaskRepository {
  get(id: string): Promise<Task | undefined>;
  list(): Promise<Task[]>;
  listByPhase(phaseId: string): Promise<Task[]>;
  put(task: Task): Promise<void>;
  putMany(tasks: readonly Task[]): Promise<void>;
}

export interface ChecklistItemRepository {
  get(id: string): Promise<ChecklistItem | undefined>;
  list(): Promise<ChecklistItem[]>;
  listByTask(taskId: string): Promise<ChecklistItem[]>;
  put(checklistItem: ChecklistItem): Promise<void>;
  putMany(checklistItems: readonly ChecklistItem[]): Promise<void>;
}

export interface NoteRepository {
  get(id: string): Promise<Note | undefined>;
  list(): Promise<Note[]>;
  put(note: Note): Promise<void>;
  putMany(notes: readonly Note[]): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ReminderRepository {
  get(id: string): Promise<Reminder | undefined>;
  list(): Promise<Reminder[]>;
  put(reminder: Reminder): Promise<void>;
  putMany(reminders: readonly Reminder[]): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface TrackerRepositories {
  goals: GoalRepository;
  phases: PhaseRepository;
  tasks: TaskRepository;
  checklistItems: ChecklistItemRepository;
  notes: NoteRepository;
  reminders: ReminderRepository;
}

export interface TrackerDatabase {
  transaction<T>(
    stores: readonly StoreName[],
    mode: TransactionMode,
    operation: (repositories: TrackerRepositories) => Promise<T>,
  ): Promise<T>;
}


export interface AlarmScheduler {
  scheduleReminderAlarm(id: string, dueAt: string): Promise<void>;
  cancelReminderAlarm(id: string): Promise<void>;
  scheduleTaskDeadlineAlarm(id: string, dueAt: string): Promise<void>;
  cancelTaskDeadlineAlarm(id: string): Promise<void>;
}

export interface NotificationService {
  notifyReminder(id: string, title: string, details?: string): Promise<void>;
  notifyTaskDeadline(id: string, title: string): Promise<void>;
}

export interface ApplicationDependencies {
  alarms: AlarmScheduler;
  notifications: NotificationService;
  clock: () => string;
  createId: () => string;
}
