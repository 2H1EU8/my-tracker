import re

with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    content = f.read()

# 1. Add onRenameTask to TaskDetailsDialogProps
props_pattern = re.compile(r'interface TaskDetailsDialogProps \{([\s\S]*?)\}')
def props_replacer(match):
    inner = match.group(1)
    if 'onRenameTask' not in inner:
        return f'interface TaskDetailsDialogProps {{{inner}\n  onRenameTask: (task: Task, title: string) => Promise<void>;\n}}'
    return match.group(0)
content = props_pattern.sub(props_replacer, content)

# 2. Add onRenameTask to TaskDetailsDialog function signature
sig_pattern = re.compile(r'function TaskDetailsDialog\(\{\s*checklistState,\s*onCreateChecklistItem,\s*onRefreshChecklist,\s*onSetChecklistItemCompleted,\s*setChecklistState,\s*task,\s*\}\:\s*TaskDetailsDialogProps\)\s*\{')
def sig_replacer(match):
    return match.group(0).replace('task,\n}:', 'task,\n  onRenameTask,\n}:')
content = sig_pattern.sub(sig_replacer, content)

# 3. Add onRenameTask to TaskDetailsDialog calls inside TaskCard
call_pattern = re.compile(r'<TaskDetailsDialog\s+checklistState=\{checklistState\}\s+onCreateChecklistItem=\{onCreateChecklistItem\}\s+onRefreshChecklist=\{refreshChecklist\}\s+onSetChecklistItemCompleted=\{onSetChecklistItemCompleted\}\s+setChecklistState=\{setChecklistState\}\s+task=\{task\}\s*\/>')
def call_replacer(match):
    return match.group(0).replace('task={task}', 'task={task}\n          onRenameTask={onRenameTask}')
content = call_pattern.sub(call_replacer, content)

with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(content)

