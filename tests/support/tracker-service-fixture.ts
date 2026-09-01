import { TrackerService } from "../../src/application/tracker-service";
import { InMemoryTrackerDatabase } from "./in-memory-tracker-database";

export const noopAlarmScheduler = {
  scheduleReminderAlarm: async () => undefined,
  cancelReminderAlarm: async () => undefined,
  scheduleTaskDeadlineAlarm: async () => undefined,
  cancelTaskDeadlineAlarm: async () => undefined,
  clearAllAlarms: async () => undefined,
};

export const noopNotificationService = {
  notifyReminder: async () => undefined,
  notifyTaskDeadline: async () => undefined,
};

export function createTrackerServiceFixture() {
  const database = new InMemoryTrackerDatabase();
  let id = 0;
  let tick = 0;
  const service = new TrackerService(database, {
    createId: () => `id-${++id}`,
    clock: () => new Date(Date.UTC(2026, 7, 28, 10, 0, tick++)).toISOString(),
    alarms: noopAlarmScheduler,
    notifications: noopNotificationService,
  });

  return { database, service };
}
