import re

with open('entrypoints/newtab/style.css', 'r') as f:
    css = f.read()

new_css = """
/* Drag and Drop Indicators */
.drag-over-before {
  border-top: 2px solid var(--focus) !important;
}
.drag-over-after {
  border-bottom: 2px solid var(--focus) !important;
}
.drag-over-column {
  background: var(--surface-2) !important;
  border-radius: 8px;
}
.drag-over-phase {
  background: var(--surface-2) !important;
  color: var(--text) !important;
}
.note-card[draggable="true"], .task-card[draggable="true"] {
  cursor: grab;
}
.note-card[draggable="true"]:active, .task-card[draggable="true"]:active {
  cursor: grabbing;
}
"""

if "/* Drag and Drop Indicators */" not in css:
    css += new_css
    with open('entrypoints/newtab/style.css', 'w') as f:
        f.write(css)

