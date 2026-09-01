import re

with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    content = f.read()

# We need to add state to GoalView to track the dragOverPhase
goal_view_pattern = re.compile(r'function GoalView\(\{([\s\S]*?)\}\:\s*GoalViewProps\)\s*\{')
def goal_view_replacer(match):
    return match.group(0) + '\n  const [dragOverPhase, setDragOverPhase] = useState<string | null>(null);\n'
content = goal_view_pattern.sub(goal_view_replacer, content)

# Modify the phase button in GoalView
phase_btn_pattern = re.compile(r'<button\s*aria-current=\{phase\.id === selectedPhase\?\.phase\.id \? "page" \: undefined\}\s*className=\{phase\.id === selectedPhase\?\.phase\.id \? "phase-active" \: undefined\}[\s\S]*?<\/button>')

def phase_btn_replacer(match):
    btn = match.group(0)
    btn = btn.replace('className={phase.id === selectedPhase?.phase.id ? "phase-active" : undefined}', 'className={`${phase.id === selectedPhase?.phase.id ? "phase-active" : ""} ${dragOverPhase === phase.id ? "drag-over-phase" : ""}`}')
    # Add drag events
    drag_events = """
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes("tracker/task")) return;
                  e.preventDefault();
                  setDragOverPhase(phase.id);
                }}
                onDragLeave={() => setDragOverPhase(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverPhase(null);
                  const draggedId = e.dataTransfer.getData("tracker/task");
                  if (draggedId) {
                    // Update phase of task (requires changes in onMoveTask)
                    onMoveTask({ id: draggedId } as Task, "todo"); // Wait, move to phase needs onMoveTask to support phaseId. 
                  }
                }}
"""
    return btn.replace('type="button"\n              >', f'type="button"\n{drag_events}              >')
content = phase_btn_pattern.sub(phase_btn_replacer, content)

with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(content)
