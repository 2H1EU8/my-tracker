import re

with open('entrypoints/newtab/style.css', 'r') as f:
    css = f.read()

# 1. Header margins
css = css.replace('margin-bottom: 16px;', 'margin-bottom: 8px;')

# 2. Shell padding
css = css.replace('padding: 0 24px;', 'padding: 0 16px;')

# 3. Layout gaps
css = css.replace('gap: 16px;', 'gap: 12px;')
css = css.replace('gap: 24px;', 'gap: 16px;') # for home-columns
css = css.replace('gap: 20px;', 'gap: 16px;') # just in case

# 4. Task card / Note card margins
css = css.replace('margin-bottom: 10px;', 'margin-bottom: 6px;')
css = css.replace('margin-bottom: 8px;', 'margin-bottom: 6px;')

# 5. Board gap and padding
css = css.replace('gap: 12px;\n  padding-bottom: 8px;\n  display: flex;', 'gap: 8px;\n  padding-bottom: 4px;\n  display: flex;')
css = css.replace('.kanban-column {\n  flex: 1;\n  min-width: 300px;\n  min-height: 200px;\n  border: none;\n  background: var(--surface-1);\n  border-radius: 8px;\n  padding: 12px;\n}', '.kanban-column {\n  flex: 1;\n  min-width: 280px;\n  min-height: 200px;\n  border: none;\n  background: var(--surface-1);\n  border-radius: 8px;\n  padding: 8px;\n}')

# 6. Make goal grid smaller gaps
css = css.replace('grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 16px;', 'grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));\n  gap: 12px;')

with open('entrypoints/newtab/style.css', 'w') as f:
    f.write(css)

