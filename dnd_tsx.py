import re

with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    content = f.read()

def replace_function(content, func_name, new_body):
    pattern = re.compile(rf'function {func_name}\([^)]*\)\s*{{.*?^}}', re.MULTILINE | re.DOTALL)
    if not pattern.search(content):
        print(f"Function {func_name} not found")
        return content
    return pattern.sub(new_body, content)


# 1. Update NoteCard
note_card_pattern = re.compile(r'function NoteCard\(\{[\s\S]*?\}\:\s*NoteCardProps\)\s*\{[\s\S]*?return\s*\(\s*<article[\s\S]*?<\/article>\s*\);\s*\}')
note_card_body = """function NoteCard({
  goals,
  nextNote,
  note,
  onDelete,
  onEdit,
  onReorder,
  previousNote,
  workspaceFailed,
}: NoteCardProps) {
  const linkLabel = noteLinkLabel(note, goals);
  const [dragOver, setDragOver] = useState<"before" | "after" | null>(null);

  return (
    <article 
      className={`note-card ${dragOver ? `drag-over-${dragOver}` : ""}`} 
      data-testid={`note-card-${note.id}`} 
      data-note-id={note.id} 
      tabIndex={-1}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("tracker/note", note.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("tracker/note")) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const isTop = e.clientY < rect.top + rect.height / 2;
        setDragOver(isTop ? "before" : "after");
      }}
      onDragLeave={() => setDragOver(null)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const placement = dragOver;
        setDragOver(null);
        if (!placement) return;
        const draggedId = e.dataTransfer.getData("tracker/note");
        if (draggedId && draggedId !== note.id) {
          // Fake a Note object for the dragged item since onReorder only needs the IDs in TrackerApp
          onReorder({ id: draggedId } as Note, note, placement);
        }
      }}
    >
      <div className="note-card-header" style={{ pointerEvents: dragOver ? 'none' : 'auto' }}>
        <p className="note-body">{note.body}</p>
        <div className="card-actions note-card-actions">
          <NoteEditorDialog
            goals={goals}
            note={note}
            onEdit={onEdit}
            workspaceFailed={workspaceFailed}
          />
          <NoteActionsDialog
            nextNote={nextNote}
            note={note}
            onDelete={onDelete}
            onReorder={onReorder}
            previousNote={previousNote}
          />
        </div>
      </div>
      {linkLabel && <p className="note-context" style={{ pointerEvents: dragOver ? 'none' : 'auto' }}>{linkLabel}</p>}
    </article>
  );
}"""
content = note_card_pattern.sub(note_card_body, content)

# 2. Update TaskCard
# Wait, TaskCard is large. Let's patch its return statement like before.
task_card_start = content.find("function TaskCard({")
task_card_end = content.find("function TaskDetailsDialog({")

if task_card_start != -1 and task_card_end != -1:
    task_card_code = content[task_card_start:task_card_end]
    new_return = """const [dragOver, setDragOver] = useState<"before" | "after" | null>(null);

  return (
    <article 
      className={`task-card ${dragOver ? `drag-over-${dragOver}` : ""}`} 
      data-task-id={task.id} 
      tabIndex={-1} 
      style={task.status === "in_progress" ? { border: '2px solid var(--focus)' } : task.status === "done" ? { opacity: 0.7 } : {}}
      data-testid={`task-card-${task.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("tracker/task", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("tracker/task")) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const isTop = e.clientY < rect.top + rect.height / 2;
        setDragOver(isTop ? "before" : "after");
      }}
      onDragLeave={() => setDragOver(null)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const placement = dragOver;
        setDragOver(null);
        if (!placement) return;
        const draggedId = e.dataTransfer.getData("tracker/task");
        if (draggedId && draggedId !== task.id) {
          onReorderTask({ id: draggedId } as Task, task, placement);
        }
      }}
    >
      <div className="task-card-header" style={{ pointerEvents: dragOver ? 'none' : 'auto' }}>
        <TaskDetailsDialog
          checklistState={checklistState}
          onCreateChecklistItem={onCreateChecklistItem}
          onRefreshChecklist={refreshChecklist}
          onSetChecklistItemCompleted={onSetChecklistItemCompleted}
          setChecklistState={setChecklistState}
          task={task}
          onRenameTask={onRenameTask}
        />
        <div className="card-actions">
          <button
            aria-label={`Open actions for ${task.title}`}
            className="icon-button card-icon"
            data-tooltip="Task actions"
            onClick={() => {
              setActionError(undefined);
              setRetryTaskAction(undefined);
              setIsActionsOpen(true);
            }}
            ref={actionsTriggerRef}
            title="Task actions"
            type="button"
            data-testid={`task-actions-${task.id}`}
          >
            <DotsThreeIcon aria-hidden="true" size={20} weight="bold" />
          </button>
        </div>
      </div>
      <div style={{ pointerEvents: dragOver ? 'none' : 'auto' }}>
        {task.status === "in_progress" && visibleChecklistProgress !== undefined && visibleChecklistProgress.total > 0 && (
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', marginBottom: '6px', marginTop: '6px' }}>
             <div style={{ width: `${(visibleChecklistProgress.completed / visibleChecklistProgress.total) * 100}%`, height: '100%', background: 'var(--focus)', borderRadius: '2px' }}></div>
          </div>
        )}
        {visibleChecklistProgress !== undefined && visibleChecklistProgress.total > 0 ? (
          <p className="task-checklist-progress">
            {visibleChecklistProgress.completed} of {visibleChecklistProgress.total} checked
          </p>
        ) : null}
      </div>
      
      {checklistState.status === "failed" ? (
        <p className="task-checklist-load-error">Checklist unavailable. Open task details to retry.</p>
      ) : null}
      {isActionsOpen ? (
        <dialog
          aria-labelledby={`${actionReasonId}-title`}
          className="entity-dialog task-dialog"
          onCancel={(event) => {
            if (isMutatingRef.current) {
              event.preventDefault();
            }
          }}
          onClose={() => {
            setIsActionsOpen(false);
            setActionError(undefined);
            setRetryTaskAction(undefined);
            requestAnimationFrame(() => actionsTriggerRef.current?.focus());
          }}
          ref={actionsDialogRef}
        >
          <div aria-busy={isMutating} className="dialog-form">
            <div className="dialog-header">
              <div>
                <h2 id={`${actionReasonId}-title`}>Task actions</h2>
                <p>{task.title}</p>
              </div>
              <button
                aria-label="Close task actions"
                className="icon-button dialog-close"
                disabled={isMutating}
                onClick={closeActions}
                title="Close"
                type="button"
              >
                <XIcon aria-hidden="true" size={18} weight="bold" />
              </button>
            </div>
            {isMutating ? (
              <p className="task-action-state" id={mutationReasonId}>
                Updating task…
              </p>
            ) : null}
            <fieldset className="task-option-group">
              <legend>Status</legend>
              <div className="task-option-grid task-status-options">
                {TASK_STATUSES.map((status) => {
                  const isCurrentStatus = task.status === status;
                  const StatusIcon =
                    status === "todo"
                      ? CircleIcon
                      : status === "in_progress"
                        ? PlayCircleIcon
                        : CheckCircleIcon;
                  return (
                    <button
                      aria-label={`Move ${task.title} to ${STATUS_LABELS[status]}`}
                      aria-describedby={isMutating ? mutationReasonId : undefined}
                      aria-pressed={isCurrentStatus}
                      className="task-option"
                      disabled={isMutating || isCurrentStatus}
                      key={status}
                      onClick={() => void runTaskMutation(() => onMoveTask(task, status))}
                      type="button"
                    >
                      <StatusIcon aria-hidden="true" size={20} />
                      <span>{STATUS_LABELS[status]}</span>
                      {isCurrentStatus ? <small>Current</small> : null}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            {actionError === undefined ? null : (
              <div className="task-action-error">
                <p className="field-error">{actionError}</p>
                {retryTaskAction === undefined ? null : (
                  <button
                    onClick={() => void runTaskMutation(retryTaskAction)}
                    type="button"
                  >
                    Retry last action
                  </button>
                )}
              </div>
            )}
          </div>
        </dialog>
      ) : null}
    </article>
  );
}"""
    return_pattern = re.compile(r'return \(\s*<article[\s\S]*?^\s*\);\s*^}', re.MULTILINE | re.DOTALL)
    if return_pattern.search(task_card_code):
        new_task_card = return_pattern.sub(new_return, task_card_code)
        content = content.replace(task_card_code, new_task_card)

# 3. Update Board component to support column dropping
board_pattern = re.compile(r'function Board\(\{[\s\S]*?\}\:\s*BoardProps\)\s*\{[\s\S]*?return\s*\(\s*<section[\s\S]*?<\/section>\s*\);\s*\}')
board_body = """function Board({
  checklistProgress,
  onCreateChecklistItem,
  onCreateTask,
  onGetTaskChecklist,
  onMoveTask,
  onRenamePhase,
  onRenameTask,
  onReorderTask,
  onSetChecklistItemCompleted,
  phaseTree,
}: BoardProps) {
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  return (
    <section className="board-section" aria-labelledby="phase-title">
      <div className="section-heading board-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
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
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <EntityDialog
          dialogTitle="Create task"
          inputId="new-task-title"
          label="Task title"
          onSubmit={onCreateTask}
          placeholder="Next useful step"
          submitLabel="Create task"
          triggerIcon={<PlusIcon aria-hidden="true" size={16} style={{marginRight: '6px'}} />}
          triggerLabel="New task"
        />
      </div>

      {phaseTree.tasks.length === 0 ? (
        <p className="board-empty-message">No tasks in this phase yet.</p>
      ) : null}

      <div className="board">
        {TASK_STATUSES.map((status) => {
          const tasks = sortByPosition(
            phaseTree.tasks.filter((task) => task.status === status),
          );
          return (
            <section 
              className={`kanban-column ${dragOverCol === status ? 'drag-over-column' : ''}`} 
              key={status}
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes("tracker/task")) return;
                e.preventDefault();
                setDragOverCol(status);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverCol(null);
                const draggedId = e.dataTransfer.getData("tracker/task");
                if (draggedId) {
                  // We just need the ID to move it
                  onMoveTask({ id: draggedId } as Task, status);
                }
              }}
            >
              <header style={{ pointerEvents: dragOverCol === status ? 'none' : 'auto' }}>
                <h3>{STATUS_LABELS[status]} &middot; {tasks.length}</h3>
              </header>
              {tasks.length > 0 ? (
                <div className="task-list" style={{ pointerEvents: dragOverCol === status ? 'none' : 'auto' }}>
                  {tasks.map((task, index) => (
                    <TaskCard
                      checklistProgress={checklistProgress?.[task.id]}
                      key={task.id}
                      nextTask={tasks[index + 1]}
                      onCreateChecklistItem={onCreateChecklistItem}
                      onGetTaskChecklist={onGetTaskChecklist}
                      onMoveTask={onMoveTask}
                      onRenameTask={onRenameTask}
                      onReorderTask={onReorderTask}
                      onSetChecklistItemCompleted={onSetChecklistItemCompleted}
                      previousTask={tasks[index - 1]}
                      task={task}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}"""
content = board_pattern.sub(board_body, content)

with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(content)
