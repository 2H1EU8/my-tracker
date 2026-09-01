import sys

with open('src/application/ports.ts', 'r') as f:
    content = f.read()

append_str = """
export interface AlarmScheduler {
  scheduleReminderAlarm(id: string, dueAt: string): Promise<void>;
  cancelReminderAlarm(id: string): Promise<void>;
  scheduleTaskDeadlineAlarm(id: string, dueAt: string): Promise<void>;
  cancelTaskDeadlineAlarm(id: string): Promise<void>;
}

export interface NotificationService {
  notifyReminder(id: string, title: string, details?: string): Promise<void>;
  notifyTaskDeadline(id: string, title: string): Promise<void>;
}
"""

content = content.replace("export interface ApplicationDependencies {", append_str + "\nexport interface ApplicationDependencies {\n  alarms: AlarmScheduler;\n  notifications: NotificationService;")

with open('src/application/ports.ts', 'w') as f:
    f.write(content)
