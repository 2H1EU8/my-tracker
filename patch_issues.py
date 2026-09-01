import re

with open('entrypoints/newtab/style.css', 'r') as f:
    css = f.read()

new_css = """
/* Fixes for long titles and spacing */
.note-body {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: anywhere;
}

.dialog-header p, .task-detail-header h2, .dialog-form p, .delete-confirmation p {
  overflow-wrap: anywhere;
}

.backup-settings-content, .import-plan-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}
.backup-settings-content h3, .import-plan-content h3 {
  margin: 0;
}
.backup-settings-content p, .import-plan-content p {
  margin: 0;
  color: var(--text-secondary);
}
.backup-settings-content hr {
  margin: 8px 0;
  border: none;
  border-top: 1px solid var(--border);
}

.inline-edit-button {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
}
.inline-edit-button:hover {
  background: var(--surface-3);
  color: var(--text);
}

.goal-title-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.goal-title-container .goal-title {
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: anywhere;
}
"""

if "/* Fixes for long titles and spacing */" not in css:
    css += new_css
    with open('entrypoints/newtab/style.css', 'w') as f:
        f.write(css)

