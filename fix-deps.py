import re

dummy_deps = """
      alarms: {
        scheduleReminderAlarm: async () => {},
        cancelReminderAlarm: async () => {},
        scheduleTaskDeadlineAlarm: async () => {},
        cancelTaskDeadlineAlarm: async () => {},
      },
      notifications: {
        notifyReminder: async () => {},
        notifyTaskDeadline: async () => {},
      },"""

def add_deps(fpath):
    with open(fpath, 'r') as f:
        content = f.read()
    
    content = re.sub(r'(createId:\s*\([^)]*\)\s*=>\s*[^,}]+,?)', r'\1' + dummy_deps, content)
    
    with open(fpath, 'w') as f:
        f.write(content)

add_deps('tests/integration/indexeddb-tracker-database.test.ts')
add_deps('tests/support/tracker-service-fixture.ts')
add_deps('tests/unit/tracker-service.test.ts')

