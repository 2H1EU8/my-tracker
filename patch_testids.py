import re

with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    content = f.read()

# Add data-testid to QuickNote capture form
content = content.replace('className="capture-bar-form"', 'className="capture-bar-form" data-testid="capture-bar-form"')
content = content.replace('className="capture-bar-input"', 'className="capture-bar-input" data-testid="capture-bar-input"')

# Add data-testid to Inbox notes
content = content.replace('className="note-card" data-note-id', 'className="note-card" data-testid={`note-card-${note.id}`} data-note-id')

# Add data-testid to Goals
content = content.replace('className={`goal-pin note-${noteColor(goalTree.goal.id)} ${tiltClass}`}', 'className={`goal-pin note-${noteColor(goalTree.goal.id)} ${tiltClass}`} data-testid={`goal-pin-${goalTree.goal.id}`}')
content = content.replace('className="goal-open-surface"', 'className="goal-open-surface" data-testid={`goal-open-surface-${goalTree.goal.id}`}')
content = content.replace('className="new-goal-button"', 'className="new-goal-button" data-testid="new-goal-button"')

# Add data-testid to Phases
content = content.replace('data-phase-id={phase.id}', 'data-phase-id={phase.id} data-testid={`phase-tab-${phase.id}`}')

with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(content)

