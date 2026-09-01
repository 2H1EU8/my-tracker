import re

with open('entrypoints/newtab/style.css', 'r') as f:
    css = f.read()

# Replace the layout css
new_layout_css = """
/* New Layout Styles */
.home-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.home-columns {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 32px;
}

.capture-bar-form {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 14px;
  min-height: 44px;
  transition: border-color var(--motion-fast) var(--motion-ease);
}
.capture-bar-form:focus-within {
  border-color: var(--focus);
}
.capture-bar-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 14px;
  padding: 0;
  min-height: auto;
  outline: none;
}
.capture-bar-input::placeholder {
  color: var(--text-secondary);
}
.shortcut-hint {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--border-strong);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 6px;
}

.inbox-column, .goals-column {
  display: flex;
  flex-direction: column;
}

.inbox-count-label, .goals-count-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
}

.goals-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.new-goal-button {
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 100px;
  width: 100%;
}
.new-goal-button:hover {
  background: var(--surface-1);
  color: var(--text);
  border-color: var(--border-strong);
}

.goal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.goal-pin {
  background: var(--surface-2);
  border-radius: 8px;
  padding: 16px;
  position: relative;
  transition: transform var(--motion-fast) var(--motion-ease), border-color var(--motion-fast) var(--motion-ease);
}
.goal-pin::before, .goal-pin::after {
  display: none; /* Remove old pin pseudo-elements */
}
.goal-pin.tilt-left {
  transform: rotate(-0.6deg);
}
.goal-pin.tilt-right {
  transform: rotate(0.6deg);
}
.goal-pin:hover {
  transform: scale(1.02);
  z-index: 10;
}
.goal-title {
  font-weight: 500;
  font-size: 15px;
  margin: 0 0 12px 0;
  min-height: auto;
}
.goal-meta {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-secondary);
  margin: 0;
}

.note-card {
  padding: 12px;
  margin-bottom: 8px;
}
.note-body {
  font-size: 13px;
  margin: 0 0 6px 0;
}

/* Kanban Board Styling */
.board-section {
  padding-top: 0;
  border-top: none;
}
.board {
  gap: 16px;
  padding-bottom: 8px;
}
.kanban-column {
  min-height: 200px;
  border: none;
  background: transparent;
  padding: 0;
}
.kanban-column > header {
  background: transparent;
  border-bottom: none;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.kanban-column h3 {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: lowercase;
}
.task-card {
  padding: 12px;
  margin-bottom: 10px;
}
.task-card-header h4 {
  font-size: 13px;
  font-weight: 400;
  margin-bottom: 8px;
}
.task-checklist-progress {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-secondary);
  margin: 8px 0 0 0;
}
.task-card:focus-within {
  border-color: var(--focus);
}

.phase-rail {
  border-bottom: none;
  margin-bottom: 24px;
}
.phase-rail button {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  min-height: 32px;
}
.phase-rail .phase-active {
  background: var(--note-clay);
  color: #4A1B0C;
  font-weight: 500;
  border-color: transparent;
}
.phase-rail button:not(.phase-active) {
  border: 1px solid var(--border);
}

.inbox-list-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
"""

# Append or replace the layout css
if "/* New Layout Styles */" not in css:
    css += new_layout_css
    with open('entrypoints/newtab/style.css', 'w') as f:
        f.write(css)

