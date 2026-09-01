import sys
import re

dummy_deps = """clock: () => new Date().toISOString(),
      createId: () => crypto.randomUUID(),
      alarms: {
        scheduleReminderAlarm: async () => {},
        cancelReminderAlarm: async () => {},
        scheduleTaskDeadlineAlarm: async () => {},
        cancelTaskDeadlineAlarm: async () => {},
      } as any,
      notifications: {
        notifyReminder: async () => {},
        notifyTaskDeadline: async () => {},
      } as any"""

# Patch tests/integration/indexeddb-tracker-database.test.ts
with open('tests/integration/indexeddb-tracker-database.test.ts', 'r') as f:
    itest = f.read()

itest = itest.replace("""{
      clock: () => new Date().toISOString(),
      createId: () => crypto.randomUUID(),
    }""", "{\n      " + dummy_deps + "\n    }")
itest = itest.replace('a.note.createdAt', '(a.kind === "note" ? a.note.createdAt : a.reminder.createdAt)')
itest = itest.replace('b.note.createdAt', '(b.kind === "note" ? b.note.createdAt : b.reminder.createdAt)')
itest = itest.replace('item.note.id', '(item.kind === "note" ? item.note.id : item.reminder.id)')
with open('tests/integration/indexeddb-tracker-database.test.ts', 'w') as f:
    f.write(itest)

# Patch tests/support/tracker-service-fixture.ts
with open('tests/support/tracker-service-fixture.ts', 'r') as f:
    tfix = f.read()

tfix = tfix.replace("""clock: () => now.toISOString(),
      createId: () => String(++idCounter),""", dummy_deps.replace('new Date().toISOString()', 'now.toISOString()').replace('crypto.randomUUID()', 'String(++idCounter)'))
with open('tests/support/tracker-service-fixture.ts', 'w') as f:
    f.write(tfix)

# Patch tests/unit/tracker-service.test.ts
with open('tests/unit/tracker-service.test.ts', 'r') as f:
    utest = f.read()

utest = utest.replace('a.note.createdAt', '(a.kind === "note" ? a.note.createdAt : a.reminder.createdAt)')
utest = utest.replace('b.note.createdAt', '(b.kind === "note" ? b.note.createdAt : b.reminder.createdAt)')
utest = utest.replace('item.note.id', '(item.kind === "note" ? item.note.id : item.reminder.id)')
with open('tests/unit/tracker-service.test.ts', 'w') as f:
    f.write(utest)

with open('tests/support/in-memory-tracker-database.ts', 'r') as f:
    imem = f.read()
if "InMemoryReminderRepository" not in imem:
    imem = """class InMemoryReminderRepository {
  private reminders: any[] = [];
  async get(id: any) { return this.reminders.find(r => r.id === id); }
  async list() { return this.reminders; }
  async put(r: any) { this.reminders = this.reminders.filter(x => x.id !== r.id); this.reminders.push(r); }
  async putMany(rs: any[]) { for (const r of rs) { await this.put(r); } }
  async delete(id: any) { this.reminders = this.reminders.filter(r => r.id !== id); }
}
""" + imem

imem = imem.replace("""notes: new InMemoryNoteRepository(),""", """notes: new InMemoryNoteRepository(),
      reminders: new InMemoryReminderRepository(),""")
imem = imem.replace("return repositories.notes.list();", "return (await repositories.notes.list()).concat(await repositories.reminders.list());")
with open('tests/support/in-memory-tracker-database.ts', 'w') as f:
    f.write(imem)

