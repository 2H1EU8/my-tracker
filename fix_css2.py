import re

with open('entrypoints/newtab/style.css', 'r') as f:
    css = f.read()

# Remove the `.quick-note-section form` completely
css = re.sub(r'\.quick-note-section form\s*\{[^}]+\}', '', css, flags=re.MULTILINE | re.DOTALL)
# And the media query one
css = css.replace('.quick-note-section form > label,', '')

with open('entrypoints/newtab/style.css', 'w') as f:
    f.write(css)

