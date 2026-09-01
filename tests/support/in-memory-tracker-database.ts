import type {
  ChecklistItemRepository,
  GoalRepository,
  NoteRepository,
  PhaseRepository,
  ReminderRepository,
  StoreName,
  TaskRepository,
  TrackerDatabase,
  TrackerRepositories,
  TransactionMode,
} from "../../src/application/ports";
import type {
  ChecklistItem,
  Goal,
  Note,
  Phase,
  Reminder,
  Task,
} from "../../src/domain/model";
import { sortByPosition } from "../../src/domain/rules";

interface Records {
  goals: Map<string, Goal>;
  phases: Map<string, Phase>;
  tasks: Map<string, Task>;
  checklistItems: Map<string, ChecklistItem>;
  notes: Map<string, Note>;
  reminders: Map<string, Reminder>;
}

function copyEntity<T extends object>(entity: T): T {
  return { ...entity };
}

function copyRecords(records: Records): Records {
  return {
    goals: new Map(
      [...records.goals].map(([id, goal]) => [id, copyEntity(goal)]),
    ),
    phases: new Map(
      [...records.phases].map(([id, phase]) => [id, copyEntity(phase)]),
    ),
    tasks: new Map(
      [...records.tasks].map(([id, task]) => [id, copyEntity(task)]),
    ),
    checklistItems: new Map(
      [...records.checklistItems].map(([id, checklistItem]) => [
        id,
        copyEntity(checklistItem),
      ]),
    ),
    notes: new Map(
      [...records.notes].map(([id, note]) => [id, copyEntity(note)]),
    ),
    reminders: new Map(
      [...records.reminders].map(([id, reminder]) => [id, copyEntity(reminder)]),
    ),
  };
}

class InMemoryReminderRepository implements ReminderRepository {
  constructor(private readonly records: Map<string, Reminder>) {}

  async get(id: string): Promise<Reminder | undefined> {
    const reminder = this.records.get(id);
    return reminder === undefined ? undefined : copyEntity(reminder);
  }

  async list(): Promise<Reminder[]> {
    return [...this.records.values()]
      .map(copyEntity)
      .sort((left, right) => left.dueAt.localeCompare(right.dueAt));
  }

  async put(reminder: Reminder): Promise<void> {
    this.records.set(reminder.id, copyEntity(reminder));
  }

  async putMany(reminders: readonly Reminder[]): Promise<void> {
    for (const reminder of reminders) {
      await this.put(reminder);
    }
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  async clear(): Promise<void> {
    this.records.clear();
  }
}

class InMemoryGoalRepository implements GoalRepository {

  async clear(): Promise<void> {
    this.records.clear();
  }
  constructor(private readonly records: Map<string, Goal>) {}

  async get(id: string): Promise<Goal | undefined> {
    const goal = this.records.get(id);
    return goal === undefined ? undefined : copyEntity(goal);
  }

  async list(): Promise<Goal[]> {
    return sortByPosition([...this.records.values()].map(copyEntity));
  }

  async put(goal: Goal): Promise<void> {
    this.records.set(goal.id, copyEntity(goal));
  }

  async putMany(goals: readonly Goal[]): Promise<void> {
    for (const goal of goals) {
      await this.put(goal);
    }
  }
}

class InMemoryPhaseRepository implements PhaseRepository {

  async clear(): Promise<void> {
    this.records.clear();
  }
  constructor(private readonly records: Map<string, Phase>) {}

  async get(id: string): Promise<Phase | undefined> {
    const phase = this.records.get(id);
    return phase === undefined ? undefined : copyEntity(phase);
  }

  async list(): Promise<Phase[]> {
    return [...this.records.values()].map(copyEntity);
  }

  async listByGoal(goalId: string): Promise<Phase[]> {
    return sortByPosition(
      [...this.records.values()]
        .filter((phase) => phase.goalId === goalId)
        .map(copyEntity),
    );
  }

  async put(phase: Phase): Promise<void> {
    this.records.set(phase.id, copyEntity(phase));
  }

  async putMany(phases: readonly Phase[]): Promise<void> {
    for (const phase of phases) {
      await this.put(phase);
    }
  }
}

class InMemoryTaskRepository implements TaskRepository {

  async clear(): Promise<void> {
    this.records.clear();
  }
  constructor(private readonly records: Map<string, Task>) {}

  async get(id: string): Promise<Task | undefined> {
    const task = this.records.get(id);
    return task === undefined ? undefined : copyEntity(task);
  }

  async list(): Promise<Task[]> {
    return [...this.records.values()].map(copyEntity);
  }

  async listByPhase(phaseId: string): Promise<Task[]> {
    return [...this.records.values()]
      .filter((task) => task.phaseId === phaseId)
      .map(copyEntity);
  }

  async put(task: Task): Promise<void> {
    this.records.set(task.id, copyEntity(task));
  }

  async putMany(tasks: readonly Task[]): Promise<void> {
    for (const task of tasks) {
      await this.put(task);
    }
  }
}

class InMemoryChecklistItemRepository implements ChecklistItemRepository {

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  async clear(): Promise<void> {
    this.records.clear();
  }
  constructor(private readonly records: Map<string, ChecklistItem>) {}

  async get(id: string): Promise<ChecklistItem | undefined> {
    const checklistItem = this.records.get(id);
    return checklistItem === undefined ? undefined : copyEntity(checklistItem);
  }

  async list(): Promise<ChecklistItem[]> {
    return [...this.records.values()]
      .map(copyEntity)
      .sort(
        (left, right) =>
          left.taskId.localeCompare(right.taskId) ||
          left.position - right.position ||
          left.id.localeCompare(right.id),
      );
  }

  async listByTask(taskId: string): Promise<ChecklistItem[]> {
    return sortByPosition(
      [...this.records.values()]
        .filter((checklistItem) => checklistItem.taskId === taskId)
        .map(copyEntity),
    );
  }

  async put(checklistItem: ChecklistItem): Promise<void> {
    this.records.set(checklistItem.id, copyEntity(checklistItem));
  }

  async putMany(checklistItems: readonly ChecklistItem[]): Promise<void> {
    for (const checklistItem of checklistItems) {
      await this.put(checklistItem);
    }
  }
}

class InMemoryNoteRepository implements NoteRepository {

  async clear(): Promise<void> {
    this.records.clear();
  }
  constructor(private readonly records: Map<string, Note>) {}

  async get(id: string): Promise<Note | undefined> {
    const note = this.records.get(id);
    return note === undefined ? undefined : copyEntity(note);
  }

  async list(): Promise<Note[]> {
    return sortByPosition([...this.records.values()].map(copyEntity));
  }

  async put(note: Note): Promise<void> {
    this.records.set(note.id, copyEntity(note));
  }

  async putMany(notes: readonly Note[]): Promise<void> {
    for (const note of notes) {
      await this.put(note);
    }
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }
}

function repositoriesFor(records: Records): TrackerRepositories {
  return {
    goals: new InMemoryGoalRepository(records.goals),
    phases: new InMemoryPhaseRepository(records.phases),
    tasks: new InMemoryTaskRepository(records.tasks),
    checklistItems: new InMemoryChecklistItemRepository(records.checklistItems),
    notes: new InMemoryNoteRepository(records.notes),
    reminders: new InMemoryReminderRepository(records.reminders),
  };
}

export class InMemoryTrackerDatabase implements TrackerDatabase {
  private records: Records = {
    goals: new Map(),
    phases: new Map(),
    tasks: new Map(),
    checklistItems: new Map(),
    notes: new Map(),
    reminders: new Map(),
  };

  async transaction<T>(
    _stores: readonly StoreName[],
    mode: TransactionMode,
    operation: (repositories: TrackerRepositories) => Promise<T>,
  ): Promise<T> {
    const workingRecords = copyRecords(this.records);
    const result = await operation(repositoriesFor(workingRecords));

    if (mode === "readwrite") {
      this.records = workingRecords;
    }

    return result;
  }
}
