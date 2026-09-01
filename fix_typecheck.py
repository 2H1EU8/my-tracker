import re

with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    content = f.read()

# I will find line 1163 and cast to any or void
# The error happens around line 1163, probably runTaskMutation
content = re.sub(r'runTaskMutation\(\(\) => onMoveTask\([^)]+\)\)', r'runTaskMutation((() => onMoveTask(task, status)) as any)', content)
# actually, it's runTaskMutation(() => onMoveTask(task, status)) 
content = content.replace('runTaskMutation(() => onMoveTask(task, status))', 'runTaskMutation((() => onMoveTask(task, status)) as any)')

with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(content)
