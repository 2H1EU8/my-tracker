import type { NotificationService } from "../../application/ports";
import { browser } from "wxt/browser";

export class BrowserNotificationService implements NotificationService {
  async notifyReminder(id: string, title: string, details?: string): Promise<void> {
    await browser.notifications.create(`reminder-${id}`, {
      type: "basic",
      iconUrl: (browser.runtime as any).getURL("/icon/128.png"),
      title: "Reminder: " + title,
      message: details || "It is time for your scheduled reminder.",
    });
  }

  async notifyTaskDeadline(id: string, title: string): Promise<void> {
    await browser.notifications.create(`task-deadline-${id}`, {
      type: "basic",
      iconUrl: (browser.runtime as any).getURL("/icon/128.png"),
      title: "Task Due: " + title,
      message: "A task you are tracking is now due.",
    });
  }
}
