import re

with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    content = f.read()

def replace_function(content, func_name, new_body):
    pattern = re.compile(rf'function {func_name}\([^)]*\)\s*{{.*?^}}', re.MULTILINE | re.DOTALL)
    if not pattern.search(content):
        print(f"Function {func_name} not found")
        return content
    return pattern.sub(new_body, content)

# 1. Update HomeView's goal grid to put rename button next to title inside a container
home_view_pattern = re.compile(r'(<h2 className="goal-title">\{goalTree\.goal\.title\}<\/h2>)(.*?)(<EntityDialog\s+dialogTitle="Rename goal"[^>]+triggerLabel=\{`Rename goal \$\{goalTree\.goal\.title\}`\}[^>]*\/>)', re.DOTALL)

def home_view_replacer(match):
    # We replace the h2 and the dialog with a combined container
    dialog = match.group(3)
    # We need to change the triggerClassName of the dialog to "inline-edit-button" and add onClick stop propagation
    dialog = dialog.replace('triggerClassName="card-icon goal-edit"', 'triggerClassName="inline-edit-button"')
    
    return f"""<div className="goal-title-container">
                        <h2 className="goal-title">{{goalTree.goal.title}}</h2>
                        <div onClick={{(e) => e.stopPropagation()}} onDoubleClick={{(e) => e.stopPropagation()}}>
                          {dialog}
                        </div>
                      </div>"""

new_content = home_view_pattern.sub(home_view_replacer, content)

# 2. Update GoalView header
goal_view_pattern = re.compile(r'(<h3 style=\{\{ margin: 0, fontSize: \'17px\', fontWeight: 500 \}\}>\{goalTree\.goal\.title\}<\/h3>\s*<\/div>\s*)(<EntityDialog\s+dialogTitle="Rename goal"[\s\S]*?triggerLabel=\{`Edit goal`\}\s*\/>)', re.DOTALL)

def goal_view_replacer(match):
    h3_and_div = match.group(1)
    dialog = match.group(2)
    # Put the dialog inside the div with the h3
    dialog = dialog.replace('triggerClassName="button-secondary"', 'triggerClassName="inline-edit-button"')
    return f"""<h3 style={{{{ margin: 0, fontSize: '17px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}}}>
            {{goalTree.goal.title}}
            {dialog}
          </h3>
        </div>"""
new_content = goal_view_pattern.sub(goal_view_replacer, new_content)

# 3. Update Board component to show Phase heading and edit button
board_pattern = re.compile(r'<div className="section-heading board-heading" style=\{\{ display: \'none\' \}\}>\s*<h2 id="phase-title">\{phaseTree\.phase\.title\}<\/h2>\s*<\/div>')
board_replacer = """<div className="section-heading board-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <h2 id="phase-title" style={{ margin: 0, fontSize: '15px' }}>{phaseTree.phase.title}</h2>
        <EntityDialog
          dialogTitle="Rename phase"
          initialValue={phaseTree.phase.title}
          inputId={`rename-phase-${phaseTree.phase.id}`}
          label="Phase title"
          onSubmit={onRenamePhase}
          placeholder="Phase title"
          submitLabel="Save changes"
          triggerClassName="inline-edit-button"
          triggerIcon={<PencilSimpleIcon aria-hidden="true" size={14} />}
          triggerLabel={`Rename phase ${phaseTree.phase.title}`}
        />
      </div>"""
new_content = new_content.replace(board_pattern.search(new_content).group(0), board_replacer)

# 4. Remove order-in-column options from TaskActionsDialog
order_in_column_pattern = re.compile(r'<fieldset className="task-option-group">\s*<legend>Order in column</legend>[\s\S]*?<\/fieldset>')
new_content = order_in_column_pattern.sub('', new_content)

# 5. Remove task rename from TaskActionsDialog
task_rename_in_dialog_pattern = re.compile(r'<div style=\{\{marginTop: \'24px\'\}\}>\s*<EntityDialog\s*dialogTitle="Rename task"[\s\S]*?triggerLabel=\{`Rename task \$\{task\.title\}`\}\s*\/>\s*<\/div>')
new_content = task_rename_in_dialog_pattern.sub('', new_content)

# 6. Put Task Rename in TaskCard header next to title
# The TaskDetailsDialog triggers using a button. We can put the edit button next to the TaskDetailsDialog button.
# Let's find TaskDetailsDialog in TaskCard and modify its heading
task_details_heading = re.compile(r'(<h4 className="task-title-heading">.*?<\/h4>)', re.DOTALL)
def task_details_heading_replacer(match):
    heading = match.group(1)
    if "inline-edit-button" in heading: return heading
    
    # We will inject the EntityDialog inside the h4, right after the button
    dialog = """<EntityDialog
          dialogTitle="Rename task"
          initialValue={task.title}
          inputId={`rename-task-${task.id}`}
          label="Task title"
          onSubmit={(title) => onRenameTask(task, title)}
          placeholder="Task title"
          submitLabel="Save changes"
          triggerClassName="inline-edit-button"
          triggerIcon={<PencilSimpleIcon aria-hidden="true" size={14} />}
          triggerLabel={`Rename task ${task.title}`}
        />"""
    return heading.replace('</h4>', f'{dialog}</h4>').replace('className="task-title-heading"', 'className="task-title-heading" style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}')

new_content = task_details_heading.sub(task_details_heading_replacer, new_content)

# 7. Remove order actions from NoteActionsDialog
note_order_actions_pattern = re.compile(r'<div className="task-option-grid note-order-actions">[\s\S]*?<\/div>\s*(?=<button\s*className="danger-action")')
new_content = note_order_actions_pattern.sub('', new_content)

with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(new_content)

