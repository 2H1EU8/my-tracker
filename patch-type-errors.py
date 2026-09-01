import sys
import re
import os

# 1. entrypoints/background.ts
with open('entrypoints/background.ts', 'r') as f:
    bg_ts = f.read()

bg_ts = bg_ts.replace('import { defineBackground } from "wxt/sandbox";\n', 'import { defineBackground } from "wxt/sandbox";\n// @ts-expect-error auto-import works\n')

# Actually WXT auto-imports defineBackground, let's just remove the import
bg_ts = bg_ts.replace('import { defineBackground } from "wxt/sandbox";\n', '')
bg_ts = bg_ts.replace('browser.runtime.getURL', 'browser.runtime.getURL')

with open('entrypoints/background.ts', 'w') as f:
    f.write(bg_ts)

# 2. TrackerApp.tsx
with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    tracker_app = f.read()

tracker_app = tracker_app.replace('a.note.createdAt', '(a.kind === "note" ? a.note.createdAt : a.reminder.createdAt)')
tracker_app = tracker_app.replace('b.note.createdAt', '(b.kind === "note" ? b.note.createdAt : b.reminder.createdAt)')
tracker_app = tracker_app.replace('item.note.createdAt', '(item.kind === "note" ? item.note.createdAt : item.reminder.createdAt)')
tracker_app = tracker_app.replace('item.note.updatedAt', '(item.kind === "note" ? item.note.updatedAt : item.reminder.updatedAt)')
tracker_app = tracker_app.replace('item.note.id', '(item.kind === "note" ? item.note.id : item.reminder.id)')

with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(tracker_app)

# 3. browser.runtime.getURL in notifications.ts
with open('src/infrastructure/browser/notifications.ts', 'r') as f:
    notif = f.read()

# Using a generic way to access getURL to avoid type error
notif = notif.replace('browser.runtime.getURL("/icon/128.png")', '(browser.runtime as any).getURL("/icon/128.png")')

with open('src/infrastructure/browser/notifications.ts', 'w') as f:
    f.write(notif)
