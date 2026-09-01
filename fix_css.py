import re

with open('entrypoints/newtab/style.css', 'r') as f:
    css = f.read()

# Remove the old grid styles that conflict with the new capture bar
css = re.sub(r'\.quick-note-section form \{[^}]+\}', '', css)
css = re.sub(r'\.quick-note-section form > label,', '', css)

# Make sure .capture-bar-form has higher specificity or just remove the parent class in the component
# I'll just change the component class in TrackerApp.tsx instead, it's safer.
