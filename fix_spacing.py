import re

with open('entrypoints/newtab/style.css', 'r') as f:
    css = f.read()

# Make app shell full width
css = re.sub(r'\.app-shell\s*\{[^}]+\}', '.app-shell {\n  width: 100%;\n  padding: 0 24px;\n  padding-bottom: 32px;\n  overflow-x: clip;\n}', css)

# Reduce app-header margins
css = re.sub(r'\.app-header\s*\{[^{}]*margin-bottom:[^;]+;[^{}]*\}', lambda m: m.group(0).replace('margin-bottom: 48px', 'margin-bottom: 16px').replace('margin-bottom: 40px', 'margin-bottom: 16px').replace('min-height: 80px', 'min-height: 56px').replace('min-height: 72px', 'min-height: 56px'), css)

# Reduce home-layout gap
css = css.replace('.home-layout {\n  display: flex;\n  flex-direction: column;\n  gap: 24px;\n}', '.home-layout {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n}')

# Phase rail margin
css = css.replace('.phase-rail {\n  border-bottom: none;\n  margin-bottom: 24px;\n}', '.phase-rail {\n  border-bottom: none;\n  margin-bottom: 16px;\n}')

# Board gap
css = css.replace('.board {\n  gap: 16px;\n  padding-bottom: 8px;\n}', '.board {\n  gap: 12px;\n  padding-bottom: 8px;\n  display: flex;\n  overflow-x: auto;\n}')
css = css.replace('.kanban-column {\n  min-height: 200px;', '.kanban-column {\n  flex: 1;\n  min-width: 300px;\n  min-height: 200px;')

with open('entrypoints/newtab/style.css', 'w') as f:
    f.write(css)

