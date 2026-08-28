import { DomainError } from "../domain/errors";
import type {
  Goal,
  Phase,
  Task,
  TaskStatus,
  WorkspaceSnapshot,
} from "../domain/model";
import { isTaskStatus } from "../domain/model";
import {
  moveTaskToState,
  normalizeTitle,
  sortByPosition,
  withNormalizedTaskPositions,
} from "../domain/rules";
import type { ApplicationDependencies, TrackerDatabase } from "./ports";

export type ReorderPlacement = "before" | "after";

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
}
