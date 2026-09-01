import re

with open('entrypoints/newtab/style.css', 'r') as f:
    css = f.read()

css = css.replace('gap: 32px;', 'gap: 20px;') # applies to home-columns

# The board kanban columns also need to look like Jira: grey backgrounds, padding inside.
# Jira's columns have a grey background with tasks inside.
# We have `.kanban-column` which is transparent.
# The user wants Jira-like layout:
# Jira has column backgrounds. Let's add a subtle background.
css = css.replace('.kanban-column {\n  min-height: 200px;\n  border: none;\n  background: transparent;\n  padding: 0;\n}', '.kanban-column {\n  flex: 1;\n  min-width: 300px;\n  min-height: 200px;\n  border: none;\n  background: var(--surface-1);\n  border-radius: 8px;\n  padding: 12px;\n}')

# Wait, `fix_spacing.py` already modified `.kanban-column` to:
# .kanban-column {\n  flex: 1;\n  min-width: 300px;\n  min-height: 200px;\n  border: none;\n  background: transparent;\n  padding: 0;\n}
# Let's use regex to replace it
css = re.sub(r'\.kanban-column\s*\{[^}]+\}', '.kanban-column {\n  flex: 1;\n  min-width: 300px;\n  min-height: 200px;\n  border: none;\n  background: var(--surface-1);\n  border-radius: 8px;\n  padding: 12px;\n}', css)

with open('entrypoints/newtab/style.css', 'w') as f:
    f.write(css)

