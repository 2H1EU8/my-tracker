const fs = require('fs');
let code = fs.readFileSync('src/application/ports.ts', 'utf-8');

const portsToAppend = `
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
`;

code = code.replace(/export interface ApplicationDependencies {/, portsToAppend + '\nexport interface ApplicationDependencies {\n  alarms: AlarmScheduler;');

fs.writeFileSync('src/application/ports.ts', code);
