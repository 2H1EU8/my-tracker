import sys
import re

files = [
    'src/features/tracker/TrackerApp.tsx',
    'tests/integration/indexeddb-tracker-database.test.ts',
    'tests/unit/tracker-service.test.ts'
]

for fpath in files:
    with open(fpath, 'r') as f:
        content = f.read()

    content = re.sub(r'(\w+)\.note\.createdAt', r'(\1.kind === "note" ? \1.note.createdAt : \1.reminder.createdAt)', content)
    content = re.sub(r'(\w+)\.note\.updatedAt', r'(\1.kind === "note" ? \1.note.updatedAt : \1.reminder.updatedAt)', content)
    content = re.sub(r'(\w+)\.note\.id', r'(\1.kind === "note" ? \1.note.id : \1.reminder.id)', content)

    with open(fpath, 'w') as f:
        f.write(content)

with open('entrypoints/background.ts', 'r') as f:
    bg = f.read()
bg = 'import { defineBackground } from "wxt/sandbox";\n' + bg
bg = bg.replace('// @ts-expect-error auto-import works\n', '')
bg = bg.replace('reminder.title, reminder.details', 'reminder.title, reminder.details || ""')
bg = bg.replace('taskTitle)', 'taskTitle || "")')
with open('entrypoints/background.ts', 'w') as f:
    f.write(bg)

with open('tests/support/in-memory-tracker-database.ts', 'r') as f:
    imem = f.read()
imem = imem.replace("return repositories.notes.list();", "return (await repositories.notes.list()).concat(await repositories.reminders.list());")
with open('tests/support/in-memory-tracker-database.ts', 'w') as f:
    f.write(imem)

