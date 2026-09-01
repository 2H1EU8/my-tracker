import type { AlarmScheduler } from "../../application/ports";
import { browser } from "wxt/browser";

export class BrowserAlarmScheduler implements AlarmScheduler {
  async scheduleReminderAlarm(id: string, dueAt: string): Promise<void> {
    const time = new Date(dueAt).getTime();
    if (time > Date.now()) {
      await browser.alarms.create(`my-tracker:reminder:${id}`, {
        when: time,
      });
    } else {
        await browser.alarms.create(`my-tracker:reminder:${id}`, {
            when: Date.now() + 1000,
        });
    }
  }

  async cancelReminderAlarm(id: string): Promise<void> {
    await browser.alarms.clear(`my-tracker:reminder:${id}`);
  }

  async scheduleTaskDeadlineAlarm(id: string, dueAt: string): Promise<void> {
    const time = new Date(dueAt).getTime();
    if (time > Date.now()) {
      await browser.alarms.create(`my-tracker:task-deadline:${id}`, {
        when: time,
      });
    } else {
        await browser.alarms.create(`my-tracker:task-deadline:${id}`, {
            when: Date.now() + 1000,
        });
    }
  }

  async cancelTaskDeadlineAlarm(id: string): Promise<void> {
    await browser.alarms.clear(`my-tracker:task-deadline:${id}`);
  }

  async clearAllAlarms(): Promise<void> {
    await browser.alarms.clearAll();
  }
}
