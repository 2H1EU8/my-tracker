import sys

with open('entrypoints/newtab/main.tsx', 'r') as f:
    content = f.read()

import_alarms = """import { BrowserAlarmScheduler } from "../../src/infrastructure/browser/alarms";
import { BrowserNotificationService } from "../../src/infrastructure/browser/notifications";
"""
content = import_alarms + content

service_init = """const service = new TrackerService(database, {
  clock: () => new Date().toISOString(),
  createId: () => crypto.randomUUID(),
});"""
new_service_init = """const service = new TrackerService(database, {
  clock: () => new Date().toISOString(),
  createId: () => crypto.randomUUID(),
  alarms: new BrowserAlarmScheduler(),
  notifications: new BrowserNotificationService(),
});"""

content = content.replace(service_init, new_service_init)

with open('entrypoints/newtab/main.tsx', 'w') as f:
    f.write(content)
