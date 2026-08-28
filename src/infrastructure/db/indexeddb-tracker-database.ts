import type {
  GoalRepository,
  PhaseRepository,
  StoreName,
  TaskRepository,
  TrackerDatabase,
  TrackerRepositories,
  TransactionMode,
} from "../../application/ports";
import type { Goal, Phase, Task } from "../../domain/model";
import { sortByPosition } from "../../domain/rules";

export const TRACKER_DATABASE_NAME = "my-tracker";
export const TRACKER_DATABASE_VERSION = 1;

const INDEX_GOAL_POSITION = "by-position";
const INDEX_PHASE_GOAL_POSITION = "by-goal-position";
const INDEX_TASK_PHASE_POSITION = "by-phase-position";
const INDEX_TASK_PHASE_STATUS_POSITION = "by-phase-status-position";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener(
      "error",
      () => reject(request.error ?? new Error("IndexedDB request failed.")),
      { once: true },
    );
  });
}

function transactionResult(transaction: IDBTransaction): Promise<void> {
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

function openDatabase(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, TRACKER_DATABASE_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const database = request.result;

      if (!database.objectStoreNames.contains("goals")) {
        const goals = database.createObjectStore("goals", { keyPath: "id" });
        goals.createIndex(INDEX_GOAL_POSITION, ["position", "id"], { unique: true });
      }

      if (!database.objectStoreNames.contains("phases")) {
        const phases = database.createObjectStore("phases", { keyPath: "id" });
        phases.createIndex(INDEX_PHASE_GOAL_POSITION, ["goalId", "position", "id"], {
          unique: true,
        });
      }

      if (!database.objectStoreNames.contains("tasks")) {
        const tasks = database.createObjectStore("tasks", { keyPath: "id" });
        tasks.createIndex(INDEX_TASK_PHASE_POSITION, ["phaseId", "position", "id"], {
          unique: false,
        });
        tasks.createIndex(
          INDEX_TASK_PHASE_STATUS_POSITION,
          ["phaseId", "status", "position", "id"],
          { unique: true },
        );
      }
    });

    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener(
      "error",
      () => reject(request.error ?? new Error("Could not open IndexedDB.")),
      { once: true },
    );
    request.addEventListener(
      "blocked",
      () => reject(new Error("IndexedDB upgrade is blocked by another open page.")),
      { once: true },
    );
  });
}

class IndexedDbGoalRepository implements GoalRepository {
  constructor(private readonly transaction: IDBTransaction) {}

  private get store(): IDBObjectStore {
    return this.transaction.objectStore("goals");
  }

  get(id: string): Promise<Goal | undefined> {
    return requestResult(this.store.get(id) as IDBRequest<Goal | undefined>);
  }

  async list(): Promise<Goal[]> {
    const goals = await requestResult(this.store.getAll() as IDBRequest<Goal[]>);
    return sortByPosition(goals);
  }

  async put(goal: Goal): Promise<void> {
    await requestResult(this.store.put(goal));
  }

  async putMany(goals: readonly Goal[]): Promise<void> {
    await Promise.all(goals.map((goal) => requestResult(this.store.put(goal))));
  }
}

class IndexedDbPhaseRepository implements PhaseRepository {
  constructor(private readonly transaction: IDBTransaction) {}

  private get store(): IDBObjectStore {
    return this.transaction.objectStore("phases");
  }

  get(id: string): Promise<Phase | undefined> {
    return requestResult(this.store.get(id) as IDBRequest<Phase | undefined>);
  }

  async list(): Promise<Phase[]> {
    const phases = await requestResult(this.store.getAll() as IDBRequest<Phase[]>);
    return phases.sort(
      (left, right) =>
        left.goalId.localeCompare(right.goalId) ||
        left.position - right.position ||
        left.id.localeCompare(right.id),
    );
  }

  async listByGoal(goalId: string): Promise<Phase[]> {
    const index = this.store.index(INDEX_PHASE_GOAL_POSITION);
    const range = IDBKeyRange.bound(
      [goalId, 0, ""],
      [goalId, Number.MAX_SAFE_INTEGER, "\uffff"],
    );
    const phases = await requestResult(index.getAll(range) as IDBRequest<Phase[]>);
    return sortByPosition(phases);
  }

  async put(phase: Phase): Promise<void> {
    await requestResult(this.store.put(phase));
  }

  async putMany(phases: readonly Phase[]): Promise<void> {
    await Promise.all(phases.map((phase) => requestResult(this.store.put(phase))));
  }
}

class IndexedDbTaskRepository implements TaskRepository {
  constructor(private readonly transaction: IDBTransaction) {}

  private get store(): IDBObjectStore {
    return this.transaction.objectStore("tasks");
  }

  get(id: string): Promise<Task | undefined> {
    return requestResult(this.store.get(id) as IDBRequest<Task | undefined>);
  }

  async list(): Promise<Task[]> {
    const tasks = await requestResult(this.store.getAll() as IDBRequest<Task[]>);
    return tasks.sort(
      (left, right) =>
        left.phaseId.localeCompare(right.phaseId) ||
        left.status.localeCompare(right.status) ||
        left.position - right.position ||
        left.id.localeCompare(right.id),
    );
  }

  async listByPhase(phaseId: string): Promise<Task[]> {
    const index = this.store.index(INDEX_TASK_PHASE_POSITION);
    const range = IDBKeyRange.bound(
      [phaseId, 0, ""],
      [phaseId, Number.MAX_SAFE_INTEGER, "\uffff"],
    );
    return requestResult(index.getAll(range) as IDBRequest<Task[]>);
  }

  async put(task: Task): Promise<void> {
    await requestResult(this.store.put(task));
  }

  async putMany(tasks: readonly Task[]): Promise<void> {
    await Promise.all(tasks.map((task) => requestResult(this.store.put(task))));
  }
}

function repositoriesFor(transaction: IDBTransaction): TrackerRepositories {
  return {
    goals: new IndexedDbGoalRepository(transaction),
    phases: new IndexedDbPhaseRepository(transaction),
    tasks: new IndexedDbTaskRepository(transaction),
  };
}

export class IndexedDbTrackerDatabase implements TrackerDatabase {
  private connectionPromise: Promise<IDBDatabase> | undefined;

  constructor(
    private readonly factory: IDBFactory,
    private readonly name = TRACKER_DATABASE_NAME,
  ) {}

  async transaction<T>(
    stores: readonly StoreName[],
    mode: TransactionMode,
    operation: (repositories: TrackerRepositories) => Promise<T>,
  ): Promise<T> {
    const database = await this.getConnection();
    const transaction = database.transaction(stores, mode);
    const completion = transactionResult(transaction);

    try {
      const result = await operation(repositoriesFor(transaction));
      await completion;
      return result;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // The transaction may already have aborted because an IndexedDB request failed.
      }
      await completion.catch(() => undefined);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.connectionPromise === undefined) {
      return;
    }

    const connection = this.connectionPromise;
    this.connectionPromise = undefined;
    const database = await connection;
    database.close();
  }

  private getConnection(): Promise<IDBDatabase> {
    this.connectionPromise ??= openDatabase(this.factory, this.name);
    return this.connectionPromise;
  }
}
