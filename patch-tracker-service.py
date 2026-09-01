import sys
import re

with open('src/application/tracker-service.ts', 'r') as f:
    content = f.read()

# Fix getInbox
old_get_inbox = """  async getInbox(): Promise<InboxSnapshot> {
    return this.database.transaction(["notes"], "readonly", async (repositories) => {
      const notes = sortByPosition(await repositories.notes.list());
      return {
        items: notes.map((note) => ({ kind: "note" as const, note })),
      };
    });
  }"""
new_get_inbox = """  async getInbox(): Promise<InboxSnapshot> {
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
  }"""
content = content.replace(old_get_inbox, new_get_inbox)

# We need to import Reminder, ReminderLinkTarget etc.
# Wait, let's see how model is imported.
import_model = "import type {\n  ChecklistItem,\n  ChecklistProgressByTask,\n  Goal,\n  InboxSnapshot,\n  Note,\n  NoteLinkTarget,\n  Phase,\n  Task,\n  TaskChecklistSnapshot,\n  TaskStatus,\n  WorkspaceSnapshot,\n} from \"../domain/model\";"
new_import_model = "import type {\n  ChecklistItem,\n  ChecklistProgressByTask,\n  Goal,\n  InboxSnapshot,\n  Note,\n  NoteLinkTarget,\n  Phase,\n  Task,\n  TaskChecklistSnapshot,\n  TaskStatus,\n  WorkspaceSnapshot,\n  Reminder,\n} from \"../domain/model\";"
content = content.replace(import_model, new_import_model)

# Add new methods at the end before last closing brace
new_methods = """
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
"""

content = content[:content.rfind('}')] + new_methods + "\n}\n"

with open('src/application/tracker-service.ts', 'w') as f:
    f.write(content)
