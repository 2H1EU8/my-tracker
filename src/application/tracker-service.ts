import { DomainError } from "../domain/errors";
import type {
  ChecklistItem,
  ChecklistProgressByTask,
  Goal,
  InboxSnapshot,
  Note,
  NoteLinkTarget,
  Phase,
  Task,
  TaskChecklistSnapshot,
  TaskStatus,
  WorkspaceSnapshot,
  Reminder,
} from "../domain/model";
import { isTaskStatus } from "../domain/model";
import {
  applyNoteLink,
  moveTaskToState,
  normalizeNoteBody,
  normalizeTitle,
  sortByPosition,
  validateNoteLinkTarget,
  withNormalizedNotePositions,
  withNormalizedTaskPositions,
} from "../domain/rules";
import type {
  ApplicationDependencies,
  StoreName,
  TrackerDatabase,
  TrackerRepositories,
} from "./ports";

export type ReorderPlacement = "before" | "after";

function noteStores(target: NoteLinkTarget): StoreName[] {
  switch (target.kind) {
    case "none":
      return ["notes"];
    case "goal":
      return ["goals", "notes"];
    case "task":
      return ["tasks", "notes"];
  }
}

async function requireNoteLinkTarget(
  repositories: TrackerRepositories,
  target: NoteLinkTarget,
): Promise<void> {
  switch (target.kind) {
    case "none":
      return;
    case "goal":
      if ((await repositories.goals.get(target.goalId)) === undefined) {
        throw new DomainError("not_found", "Linked goal not found.");
      }
      return;
    case "task":
      if ((await repositories.tasks.get(target.taskId)) === undefined) {
        throw new DomainError("not_found", "Linked task not found.");
      }
  }
}

export class TrackerService {
  constructor(
    private readonly database: TrackerDatabase,
    private readonly dependencies: ApplicationDependencies,
  ) {}

  async getWorkspace(): Promise<WorkspaceSnapshot> {
    return this.database.transaction(
      ["goals", "phases", "tasks"],
      "readonly",
      async (repositories) => {
        const [goals, phases, tasks] = await Promise.all([
          repositories.goals.list(),
          repositories.phases.list(),
          repositories.tasks.list(),
        ]);

        const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
        const phasesById = new Map(phases.map((phase) => [phase.id, phase]));

        for (const phase of phases) {
          if (!goalsById.has(phase.goalId)) {
            throw new DomainError(
              "parent_mismatch",
              `Phase ${phase.id} references a missing goal.`,
            );
          }
        }

        for (const task of tasks) {
          const phase = phasesById.get(task.phaseId);
          if (phase === undefined || phase.goalId !== task.goalId) {
            throw new DomainError(
              "parent_mismatch",
              `Task ${task.id} has an invalid goal or phase parent.`,
            );
          }
        }

        return {
          goals: sortByPosition(goals).map((goal) => ({
            goal,
            phases: sortByPosition(
              phases.filter((phase) => phase.goalId === goal.id),
            ).map((phase) => ({
              phase,
              tasks: sortByPosition(
                tasks.filter((task) => task.phaseId === phase.id),
              ),
            })),
          })),
        };
      },
    );
  }

  async getInbox(): Promise<InboxSnapshot> {
    return this.database.transaction(["notes", "reminders"], "readonly", async (repositories) => {
      const [notes, reminders] = await Promise.all([
        repositories.notes.list(),
        repositories.reminders.list(),
      ]);
      const items = [
        ...notes.map((note) => ({ kind: "note" as const, note })),
        ...reminders.map((reminder) => ({ kind: "reminder" as const, reminder })),
      ];
      return {
        items: items.sort((a, b) => {
          const timeA = a.kind === "note" ? a.note.createdAt : a.reminder.createdAt;
          const timeB = b.kind === "note" ? b.note.createdAt : b.reminder.createdAt;
          return timeB.localeCompare(timeA);
        }),
      };
    });
  }

  async getTaskChecklist(taskId: string): Promise<TaskChecklistSnapshot> {
    return this.database.transaction(
      ["tasks", "checklistItems"],
      "readonly",
      async (repositories) => {
        const task = await repositories.tasks.get(taskId);
        if (task === undefined) {
          throw new DomainError("not_found", "Task not found.");
        }

        return {
          task,
          checklistItems: sortByPosition(
            await repositories.checklistItems.listByTask(taskId),
          ),
        };
      },
    );
  }

  async getChecklistProgress(): Promise<ChecklistProgressByTask> {
    return this.database.transaction(
      ["checklistItems"],
      "readonly",
      async (repositories) => {
        const progress: ChecklistProgressByTask = {};
        for (const item of await repositories.checklistItems.list()) {
          const current = progress[item.taskId] ?? { completed: 0, total: 0 };
          progress[item.taskId] = {
            completed: current.completed + (item.isCompleted ? 1 : 0),
            total: current.total + 1,
          };
        }
        return progress;
      },
    );
  }

  async createGoal(rawTitle: string): Promise<Goal> {
    const title = normalizeTitle(rawTitle);
    const now = this.dependencies.clock();

    return this.database.transaction(["goals"], "readwrite", async (repositories) => {
      const siblings = await repositories.goals.list();
      const goal: Goal = {
        id: this.dependencies.createId(),
        title,
        status: "active",
        position: siblings.length,
        createdAt: now,
        updatedAt: now,
      };

      await repositories.goals.put(goal);
      return goal;
    });
  }

  async createPhase(goalId: string, rawTitle: string): Promise<Phase> {
    const title = normalizeTitle(rawTitle);
    const now = this.dependencies.clock();

    return this.database.transaction(
      ["goals", "phases"],
      "readwrite",
      async (repositories) => {
        const goal = await repositories.goals.get(goalId);
        if (goal === undefined) {
          throw new DomainError("not_found", "Goal not found.");
        }

        const siblings = await repositories.phases.listByGoal(goalId);
        const phase: Phase = {
          id: this.dependencies.createId(),
          goalId,
          title,
          position: siblings.length,
          createdAt: now,
          updatedAt: now,
        };

        await repositories.phases.put(phase);
        return phase;
      },
    );
  }

  async createTask(goalId: string, phaseId: string, rawTitle: string): Promise<Task> {
    const title = normalizeTitle(rawTitle);
    const now = this.dependencies.clock();

    return this.database.transaction(
      ["goals", "phases", "tasks"],
      "readwrite",
      async (repositories) => {
        const [goal, phase] = await Promise.all([
          repositories.goals.get(goalId),
          repositories.phases.get(phaseId),
        ]);

        if (goal === undefined || phase === undefined) {
          throw new DomainError("not_found", "Goal or phase not found.");
        }
        if (phase.goalId !== goal.id) {
          throw new DomainError(
            "parent_mismatch",
            "The selected phase does not belong to the selected goal.",
          );
        }

        const tasks = await repositories.tasks.listByPhase(phaseId);
        const todoSiblings = tasks.filter((task) => task.status === "todo");
        const task: Task = {
          id: this.dependencies.createId(),
          goalId,
          phaseId,
          title,
          status: "todo",
          priority: "medium",
          position: todoSiblings.length,
          notifyAtDue: true,
          createdAt: now,
          updatedAt: now,
        };

        await repositories.tasks.put(task);
        return task;
      },
    );
  }

  async createNote(
    rawBody: string,
    rawLinkTarget: NoteLinkTarget = { kind: "none" },
  ): Promise<Note> {
    const body = normalizeNoteBody(rawBody);
    const linkTarget = validateNoteLinkTarget(rawLinkTarget);
    const now = this.dependencies.clock();

    return this.database.transaction(
      noteStores(linkTarget),
      "readwrite",
      async (repositories) => {
        await requireNoteLinkTarget(repositories, linkTarget);
        const siblings = await repositories.notes.list();
        const note = applyNoteLink(
          {
            id: this.dependencies.createId(),
            body,
            position: siblings.length,
            createdAt: now,
            updatedAt: now,
          },
          linkTarget,
        );

        await repositories.notes.put(note);
        return note;
      },
    );
  }

  async createChecklistItem(taskId: string, rawTitle: string): Promise<ChecklistItem> {
    const title = normalizeTitle(rawTitle);
    const now = this.dependencies.clock();

    return this.database.transaction(
      ["tasks", "checklistItems"],
      "readwrite",
      async (repositories) => {
        const task = await repositories.tasks.get(taskId);
        if (task === undefined) {
          throw new DomainError("not_found", "Task not found.");
        }

        const siblings = await repositories.checklistItems.listByTask(taskId);
        const checklistItem: ChecklistItem = {
          id: this.dependencies.createId(),
          taskId,
          title,
          isCompleted: false,
          position: siblings.length,
          createdAt: now,
          updatedAt: now,
        };

        await repositories.checklistItems.put(checklistItem);
        return checklistItem;
      },
    );
  }

  async renameGoal(id: string, rawTitle: string): Promise<Goal> {
    const title = normalizeTitle(rawTitle);
    const now = this.dependencies.clock();

    return this.database.transaction(["goals"], "readwrite", async (repositories) => {
      const goal = await repositories.goals.get(id);
      if (goal === undefined) {
        throw new DomainError("not_found", "Goal not found.");
      }

      const renamed = { ...goal, title, updatedAt: now };
      await repositories.goals.put(renamed);
      return renamed;
    });
  }

  async renamePhase(id: string, rawTitle: string): Promise<Phase> {
    const title = normalizeTitle(rawTitle);
    const now = this.dependencies.clock();

    return this.database.transaction(["phases"], "readwrite", async (repositories) => {
      const phase = await repositories.phases.get(id);
      if (phase === undefined) {
        throw new DomainError("not_found", "Phase not found.");
      }

      const renamed = { ...phase, title, updatedAt: now };
      await repositories.phases.put(renamed);
      return renamed;
    });
  }

  async renameTask(id: string, rawTitle: string): Promise<Task> {
    const title = normalizeTitle(rawTitle);
    const now = this.dependencies.clock();

    return this.database.transaction(["tasks"], "readwrite", async (repositories) => {
      const task = await repositories.tasks.get(id);
      if (task === undefined) {
        throw new DomainError("not_found", "Task not found.");
      }

      const renamed = { ...task, title, updatedAt: now };
      await repositories.tasks.put(renamed);
      return renamed;
    });
  }

  async editNote(
    id: string,
    rawBody: string,
    rawLinkTarget: NoteLinkTarget,
  ): Promise<Note> {
    const body = normalizeNoteBody(rawBody);
    const linkTarget = validateNoteLinkTarget(rawLinkTarget);
    const now = this.dependencies.clock();

    return this.database.transaction(
      noteStores(linkTarget),
      "readwrite",
      async (repositories) => {
        const note = await repositories.notes.get(id);
        if (note === undefined) {
          throw new DomainError("not_found", "Note not found.");
        }
        await requireNoteLinkTarget(repositories, linkTarget);

        const edited = applyNoteLink(
          {
            id: note.id,
            body,
            position: note.position,
            createdAt: note.createdAt,
            updatedAt: now,
          },
          linkTarget,
        );
        await repositories.notes.put(edited);
        return edited;
      },
    );
  }

  async setChecklistItemCompleted(
    taskId: string,
    checklistItemId: string,
    isCompleted: boolean,
  ): Promise<ChecklistItem> {
    return this.database.transaction(
      ["tasks", "checklistItems"],
      "readwrite",
      async (repositories) => {
        const [task, checklistItem] = await Promise.all([
          repositories.tasks.get(taskId),
          repositories.checklistItems.get(checklistItemId),
        ]);
        if (task === undefined || checklistItem === undefined) {
          throw new DomainError("not_found", "Task or checklist item not found.");
        }
        if (checklistItem.taskId !== task.id) {
          throw new DomainError(
            "parent_mismatch",
            "The checklist item does not belong to the selected task.",
          );
        }
        if (checklistItem.isCompleted === isCompleted) {
          return checklistItem;
        }

        const updated: ChecklistItem = {
          ...checklistItem,
          isCompleted,
          updatedAt: this.dependencies.clock(),
        };
        await repositories.checklistItems.put(updated);
        return updated;
      },
    );
  }

  async reorderNote(
    id: string,
    targetNoteId: string,
    placement: ReorderPlacement,
  ): Promise<Note> {
    if (placement !== "before" && placement !== "after") {
      throw new DomainError("invalid_reorder_target", "Unknown note placement.");
    }

    return this.database.transaction(["notes"], "readwrite", async (repositories) => {
      const [note, target] = await Promise.all([
        repositories.notes.get(id),
        repositories.notes.get(targetNoteId),
      ]);
      if (note === undefined || target === undefined) {
        throw new DomainError("not_found", "Note or reorder target not found.");
      }
      if (note.id === target.id) {
        throw new DomainError(
          "invalid_reorder_target",
          "A note must be reordered around a different note.",
        );
      }

      const siblings = sortByPosition(await repositories.notes.list());
      const withoutNote = siblings.filter((candidate) => candidate.id !== note.id);
      const targetIndex = withoutNote.findIndex(
        (candidate) => candidate.id === target.id,
      );
      if (targetIndex < 0) {
        throw new DomainError(
          "invalid_reorder_target",
          "The reorder target is not a current note.",
        );
      }

      const insertionIndex = placement === "before" ? targetIndex : targetIndex + 1;
      withoutNote.splice(insertionIndex, 0, note);
      const normalized = withNormalizedNotePositions(
        withoutNote,
        this.dependencies.clock(),
      );
      const moved = normalized.find((candidate) => candidate.id === note.id);
      if (moved === undefined) {
        throw new DomainError("not_found", "Note disappeared during reorder.");
      }

      await repositories.notes.putMany(normalized);
      return moved;
    });
  }

  async deleteNote(id: string): Promise<Note> {
    return this.database.transaction(["notes"], "readwrite", async (repositories) => {
      const note = await repositories.notes.get(id);
      if (note === undefined) {
        throw new DomainError("not_found", "Note not found.");
      }

      const remaining = sortByPosition(
        (await repositories.notes.list()).filter((candidate) => candidate.id !== id),
      );
      const normalized = withNormalizedNotePositions(
        remaining,
        this.dependencies.clock(),
      );
      await repositories.notes.delete(id);
      await repositories.notes.putMany(normalized);
      return note;
    });
  }

  async moveTaskToStatus(id: string, targetStatus: TaskStatus): Promise<Task> {
    if (!isTaskStatus(targetStatus)) {
      throw new DomainError("invalid_status", "Unknown task status.");
    }

    return this.database.transaction(["tasks"], "readwrite", async (repositories) => {
      const task = await repositories.tasks.get(id);
      if (task === undefined) {
        throw new DomainError("not_found", "Task not found.");
      }
      if (task.status === targetStatus) {
        return task;
      }

      const now = this.dependencies.clock();
      const phaseTasks = await repositories.tasks.listByPhase(task.phaseId);
      const sourceSiblings = phaseTasks.filter(
        (candidate) => candidate.status === task.status && candidate.id !== task.id,
      );
      const targetSiblings = phaseTasks.filter(
        (candidate) => candidate.status === targetStatus,
      );
      const moved = moveTaskToState(task, targetStatus, targetSiblings.length, now);
      const writes = [
        ...withNormalizedTaskPositions(sortByPosition(sourceSiblings), now),
        ...withNormalizedTaskPositions([...sortByPosition(targetSiblings), moved], now),
      ];

      await repositories.tasks.putMany(writes);
      return moved;
    });
  }

  async reorderTask(
    id: string,
    targetTaskId: string,
    placement: ReorderPlacement,
  ): Promise<Task> {
    return this.database.transaction(["tasks"], "readwrite", async (repositories) => {
      const [task, target] = await Promise.all([
        repositories.tasks.get(id),
        repositories.tasks.get(targetTaskId),
      ]);

      if (task === undefined || target === undefined) {
        throw new DomainError("not_found", "Task or reorder target not found.");
      }
      if (
        task.id === target.id ||
        task.phaseId !== target.phaseId ||
        task.status !== target.status
      ) {
        throw new DomainError(
          "invalid_reorder_target",
          "Tasks can only be reordered around a different sibling in the same phase and status.",
        );
      }

      const now = this.dependencies.clock();
      const siblings = sortByPosition(
        (await repositories.tasks.listByPhase(task.phaseId)).filter(
          (candidate) => candidate.status === task.status,
        ),
      );
      const withoutTask = siblings.filter((candidate) => candidate.id !== task.id);
      const targetIndex = withoutTask.findIndex(
        (candidate) => candidate.id === target.id,
      );
      if (targetIndex < 0) {
        throw new DomainError(
          "invalid_reorder_target",
          "The reorder target is not a current sibling.",
        );
      }

      const insertionIndex = placement === "before" ? targetIndex : targetIndex + 1;
      withoutTask.splice(insertionIndex, 0, task);
      const normalized = withNormalizedTaskPositions(withoutTask, now);
      const moved = normalized.find((candidate) => candidate.id === task.id);
      if (moved === undefined) {
        throw new DomainError("not_found", "Task disappeared during reorder.");
      }

      await repositories.tasks.putMany(normalized);
      return moved;
    });
  }

  async createReminder(
    rawTitle: string,
    dueAt: string,
    timeZone: string,
    target: NoteLinkTarget,
  ): Promise<Reminder> {
    const title = normalizeTitle(rawTitle);
    const now = this.dependencies.clock();
    const id = this.dependencies.createId();

    const stores = noteStores(target);
    stores.push("reminders");
    
    return this.database.transaction(
      stores,
      "readwrite",
      async (repositories) => {
        await requireNoteLinkTarget(repositories, target);
        
        let reminder: Reminder = {
          id,
          title,
          dueAt,
          timeZone,
          state: "scheduled",
          createdAt: now,
          updatedAt: now,
        } as Reminder;
        
        if (target.kind === "goal") {
          reminder = { ...reminder, linkedGoalId: target.goalId } as Reminder;
        } else if (target.kind === "task") {
          reminder = { ...reminder, linkedTaskId: target.taskId } as Reminder;
        }
        
        await repositories.reminders.put(reminder);
        await this.dependencies.alarms.scheduleReminderAlarm(id, dueAt);
        return reminder;
      }
    );
  }

  async editReminder(
    id: string,
    rawTitle: string,
    dueAt: string,
    timeZone: string,
    target: NoteLinkTarget,
  ): Promise<Reminder> {
    const title = normalizeTitle(rawTitle);
    const now = this.dependencies.clock();

    const stores = noteStores(target);
    stores.push("reminders");
    
    return this.database.transaction(
      stores,
      "readwrite",
      async (repositories) => {
        const reminder = await repositories.reminders.get(id);
        if (reminder === undefined) {
          throw new DomainError("not_found", "Reminder not found.");
        }
        await requireNoteLinkTarget(repositories, target);
        
        let edited: Reminder = {
          id: reminder.id,
          title,
          dueAt,
          timeZone,
          state: reminder.state,
          createdAt: reminder.createdAt,
          updatedAt: now,
        } as Reminder;
        
        if (reminder.state === "fired") {
            edited = { ...edited, state: "fired", firedAt: reminder.firedAt } as Reminder;
        }

        if (target.kind === "goal") {
          edited = { ...edited, linkedGoalId: target.goalId } as Reminder;
        } else if (target.kind === "task") {
          edited = { ...edited, linkedTaskId: target.taskId } as Reminder;
        }
        
        await repositories.reminders.put(edited);
        if (edited.state === "scheduled") {
            await this.dependencies.alarms.scheduleReminderAlarm(edited.id, edited.dueAt);
        }
        return edited;
      }
    );
  }

  async deleteReminder(id: string): Promise<void> {
    return this.database.transaction(
      ["reminders"],
      "readwrite",
      async (repositories) => {
        const reminder = await repositories.reminders.get(id);
        if (reminder === undefined) {
          throw new DomainError("not_found", "Reminder not found.");
        }
        await repositories.reminders.delete(id);
        await this.dependencies.alarms.cancelReminderAlarm(id);
      }
    );
  }

  async setTaskDeadline(id: string, dueAt: string | undefined, timeZone: string | undefined, notifyAtDue: boolean): Promise<Task> {
    const now = this.dependencies.clock();
    return this.database.transaction(
      ["tasks"],
      "readwrite",
      async (repositories) => {
        const task = await repositories.tasks.get(id);
        if (task === undefined) {
          throw new DomainError("not_found", "Task not found.");
        }

        let updated: Task;
        if (dueAt !== undefined && timeZone !== undefined) {
            updated = { ...task, dueAt, timeZone, notifyAtDue, updatedAt: now } as Task;
        } else {
            updated = { ...task, notifyAtDue: false, updatedAt: now };
            delete (updated as any).dueAt;
            delete (updated as any).timeZone;
        }

        await repositories.tasks.put(updated);
        
        if (updated.dueAt !== undefined && updated.notifyAtDue) {
            await this.dependencies.alarms.scheduleTaskDeadlineAlarm(updated.id, updated.dueAt);
        } else {
            await this.dependencies.alarms.cancelTaskDeadlineAlarm(updated.id);
        }
        
        return updated;
      }
    );
  }

  async fireReminder(id: string): Promise<Reminder> {
    const now = this.dependencies.clock();
    return this.database.transaction(
      ["reminders"],
      "readwrite",
      async (repositories) => {
        const reminder = await repositories.reminders.get(id);
        if (reminder === undefined) {
          throw new DomainError("not_found", "Reminder not found.");
        }
        
        if (reminder.state === "fired") {
            return reminder;
        }
        
        const fired: Reminder = {
            ...reminder,
            state: "fired",
            firedAt: now,
            updatedAt: now,
        } as Reminder;
        
        await repositories.reminders.put(fired);
        return fired;
      }
    );
  }

}
