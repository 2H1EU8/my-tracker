import os

with open("src/application/tracker-service.ts", "r") as f:
    content = f.read()

# Find the last closing brace which closes the TrackerService class
last_brace_index = content.rfind("}")

method_code = """

  async importAiPlan(plan: unknown): Promise<{ goalsImported: number, phasesImported: number, tasksImported: number, checklistItemsImported: number }> {
    const { validateAiPlan } = await import("./ai-plan-schema.js");
    if (!validateAiPlan(plan)) {
      throw new DomainError("invalid_ai_plan", "Invalid AI plan format: " + JSON.stringify(validateAiPlan.errors));
    }

    const now = this.dependencies.clock();
    let goalsImported = 0;
    let phasesImported = 0;
    let tasksImported = 0;
    let checklistItemsImported = 0;

    return this.database.transaction(
      ["goals", "phases", "tasks", "checklistItems"],
      "readwrite",
      async (repositories) => {
        const baseGoalPosition = (await repositories.goals.list()).length;
        
        const goalsToInsert = [];
        const phasesToInsert = [];
        const tasksToInsert = [];
        const checklistItemsToInsert = [];

        // Cast plan to any to bypass type check since we validated it
        const typedPlan = plan as any;

        for (const [goalIndex, goal] of typedPlan.goals.entries()) {
          const goalId = this.dependencies.createId();
          goalsToInsert.push({
            id: goalId,
            title: goal.title,
            status: "active",
            position: baseGoalPosition + goalIndex,
            createdAt: now,
            updatedAt: now,
          });
          goalsImported++;

          for (const [phaseIndex, phase] of goal.phases.entries()) {
            const phaseId = this.dependencies.createId();
            phasesToInsert.push({
              id: phaseId,
              goalId: goalId,
              title: phase.title,
              position: phaseIndex,
              createdAt: now,
              updatedAt: now,
            });
            phasesImported++;

            for (const [taskIndex, task] of phase.tasks.entries()) {
              const taskId = this.dependencies.createId();
              
              let dueAt = undefined;
              let timeZone = undefined;
              let notifyAtDue = true;
              
              if (task.deadline) {
                dueAt = task.deadline.at;
                timeZone = task.deadline.timeZone;
                if (task.deadline.notifyAtDue !== undefined) {
                    notifyAtDue = task.deadline.notifyAtDue;
                }
              }

              tasksToInsert.push({
                id: taskId,
                goalId: goalId,
                phaseId: phaseId,
                title: task.title,
                status: task.status || "todo",
                priority: task.priority || "medium",
                position: taskIndex,
                dueAt,
                timeZone,
                notifyAtDue,
                createdAt: now,
                updatedAt: now,
              });
              tasksImported++;

              if (task.checklist) {
                for (const [itemIndex, item] of task.checklist.entries()) {
                  const itemId = this.dependencies.createId();
                  checklistItemsToInsert.push({
                    id: itemId,
                    taskId: taskId,
                    title: item.title,
                    isCompleted: item.isCompleted || false,
                    position: itemIndex,
                    createdAt: now,
                    updatedAt: now,
                  });
                  checklistItemsImported++;
                }
              }
            }
          }
        }

        if (goalsToInsert.length > 0) await repositories.goals.putMany(goalsToInsert as any[]);
        if (phasesToInsert.length > 0) await repositories.phases.putMany(phasesToInsert as any[]);
        if (tasksToInsert.length > 0) await repositories.tasks.putMany(tasksToInsert as any[]);
        if (checklistItemsToInsert.length > 0) await repositories.checklistItems.putMany(checklistItemsToInsert as any[]);
        
        for (const task of tasksToInsert) {
           if (task.dueAt !== undefined && task.notifyAtDue) {
               await this.dependencies.alarms.scheduleTaskDeadlineAlarm(task.id, task.dueAt);
           }
        }

        return { goalsImported, phasesImported, tasksImported, checklistItemsImported };
      }
    );
  }
"""

new_content = content[:last_brace_index] + method_code + content[last_brace_index:]

with open("src/application/tracker-service.ts", "w") as f:
    f.write(new_content)

