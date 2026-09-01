import re

with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    content = f.read()

# 1. Update BoardProps, GoalViewProps, TaskCardProps to accept phaseId
content = content.replace(
    'onMoveTask: (task: Task, status: TaskStatus) => Promise<unknown>;',
    'onMoveTask: (task: Task, status: TaskStatus, phaseId?: string) => Promise<unknown>;'
)

# 2. Update the TrackerApp component where onMoveTask is passed
content = content.replace(
    'onMoveTask={(task, status) =>\n              service.moveTask(task.id, { status })\n            }',
    'onMoveTask={(task, status, phaseId) =>\n              service.moveTask(task.id, { status, phaseId })\n            }'
)

# 3. Update the drop event in GoalView to pass phaseId
content = content.replace(
    'onMoveTask({ id: draggedId } as Task, "todo"); // Wait, move to phase needs onMoveTask to support phaseId.',
    'onMoveTask({ id: draggedId } as Task, "todo", phase.id);'
)

with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(content)
