import { expect, test } from "vitest";
import { TrackerService } from "../../src/application/tracker-service";
import { InMemoryTrackerDatabase } from "../support/in-memory-tracker-database";

test("createReminder", async () => {
  const database = new InMemoryTrackerDatabase();
  const alarms: any = {
    scheduleReminderAlarm: async () => {},
    cancelReminderAlarm: async () => {},
    scheduleTaskDeadlineAlarm: async () => {},
    cancelTaskDeadlineAlarm: async () => {},
    clearAllAlarms: async () => {},
  };
  const notifications: any = {};
  const service = new TrackerService(database, {
    clock: () => "2026-09-04T00:00:00Z",
    createId: () => "id-1",
    alarms,
    notifications,
  });

  try {
    const reminder = await service.createReminder("Test", "2026-09-05T00:00:00Z", "UTC", { kind: "none" });
    expect(reminder.title).toBe("Test");
  } catch (err: any) {
    console.error("CREATE REMINDER ERROR:", err.message);
    throw err;
  }
});
