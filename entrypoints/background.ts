import { browser } from "wxt/browser";
import { TrackerService } from "../src/application/tracker-service";
import { IndexedDbTrackerDatabase } from "../src/infrastructure/db/indexeddb-tracker-database";
import { BrowserAlarmScheduler } from "../src/infrastructure/browser/alarms";
import { BrowserNotificationService } from "../src/infrastructure/browser/notifications";

export default defineBackground(() => {
  const database = new IndexedDbTrackerDatabase(self.indexedDB);
  const alarms = new BrowserAlarmScheduler();
  const notifications = new BrowserNotificationService();
  const service = new TrackerService(database, {
    clock: () => new Date().toISOString(),
    createId: () => crypto.randomUUID(),
    alarms,
    notifications,
  });

  browser.alarms.onAlarm.addListener(async (alarm) => {
    try {
      if (alarm.name.startsWith("my-tracker:reminder:")) {
        const id = alarm.name.split(":")[2];
        const reminder = await service.fireReminder(id);
        await notifications.notifyReminder(id, reminder.title, reminder.details || "");
      } else if (alarm.name.startsWith("my-tracker:task-deadline:")) {
        const id = alarm.name.split(":")[2];
        const workspace = await service.getWorkspace();
        // find task
        let taskTitle = "Task";
        for (const goalTree of workspace.goals) {
            for (const phaseTree of goalTree.phases) {
                for (const task of phaseTree.tasks) {
                    if (task.id === id) {
                        taskTitle = task.title;
                    }
                }
            }
        }
        await notifications.notifyTaskDeadline(id, taskTitle || "");
      }
    } catch (err) {
      console.error("Failed to process alarm", err);
    }
  });

  async function reconcileAlarms() {
    try {
      const inbox = await service.getInbox();
      const workspace = await service.getWorkspace();
      const reminders = inbox.items.filter(item => item.kind === "reminder").map(item => item.reminder);
      const tasks = workspace.goals.flatMap(g => g.phases).flatMap(p => p.tasks);

      const existingAlarms = await browser.alarms.getAll();
      const alarmMap = new Map(existingAlarms.map(a => [a.name, a]));

      for (const reminder of reminders) {
        if (reminder.state === "scheduled") {
            const time = new Date(reminder.dueAt).getTime();
            if (time <= Date.now()) {
                const fired = await service.fireReminder(reminder.id);
                await notifications.notifyReminder(fired.id, fired.title, fired.details);
                await alarms.cancelReminderAlarm(reminder.id);
            } else {
                const alarmName = `my-tracker:reminder:${reminder.id}`;
                if (!alarmMap.has(alarmName)) {
                    await alarms.scheduleReminderAlarm(reminder.id, reminder.dueAt);
                }
            }
        }
      }

      for (const task of tasks) {
          if (task.dueAt && task.notifyAtDue) {
              const time = new Date(task.dueAt).getTime();
              const alarmName = `my-tracker:task-deadline:${task.id}`;
              if (time <= Date.now()) {
                  // Alarm should have fired, but it's overdue
                  if (alarmMap.has(alarmName)) {
                      await alarms.cancelTaskDeadlineAlarm(task.id);
                  }
              } else {
                  if (!alarmMap.has(alarmName)) {
                      await alarms.scheduleTaskDeadlineAlarm(task.id, task.dueAt);
                  }
              }
          }
      }
    } catch (err) {
      console.error("Reconciliation failed", err);
    }
  }

  browser.runtime.onStartup.addListener(() => {
    void reconcileAlarms();
  });

  browser.runtime.onInstalled.addListener(() => {
    void reconcileAlarms();
  });
});
