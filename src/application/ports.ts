import type { Goal, Phase, Task } from "../domain/model";

export type StoreName = "goals" | "phases" | "tasks";
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

export interface TrackerRepositories {
  goals: GoalRepository;
  phases: PhaseRepository;
  tasks: TaskRepository;
}

export interface TrackerDatabase {
  transaction<T>(
    stores: readonly StoreName[],
    mode: TransactionMode,
    operation: (repositories: TrackerRepositories) => Promise<T>,
  ): Promise<T>;
}

export interface ApplicationDependencies {
  clock: () => string;
  createId: () => string;
}
