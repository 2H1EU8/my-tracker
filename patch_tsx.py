import re

with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    content = f.read()

def replace_function(content, func_name, new_body):
    pattern = re.compile(rf'function {func_name}\([^)]*\)\s*{{.*?^}}', re.MULTILINE | re.DOTALL)
    if not pattern.search(content):
        print(f"Function {func_name} not found")
        return content
    return pattern.sub(new_body, content)

home_view = """function HomeView({
  goals,
  goalsError,
  inbox,
  inboxError,
  onCreateGoal,
  onCreateNote,
  onDeleteNote,
  onEditNote,
  onOpenGoal,
  onRenameGoal,
  onReorderNote,
  onRetryGoals,
  onRetryInbox,
  onImportPlan,
  onExportBackup,
  onRestoreBackup,
}: HomeViewProps) {
  return (
    <div className="home-layout">
      <QuickNoteComposer
        goals={goals}
        isReady={inbox !== undefined && inboxError === undefined}
        onCreate={onCreateNote}
        workspaceFailed={goalsError !== undefined}
      />
      <div className="home-columns">
        <InboxView
          goals={goals}
          inbox={inbox}
          loadError={inboxError}
          onDelete={onDeleteNote}
          onEdit={onEditNote}
          onReorder={onReorderNote}
          onRetry={onRetryInbox}
          workspaceFailed={goalsError !== undefined}
        />

        <section aria-labelledby="goals-title" className="goals-column">
          <h1 id="goals-title" className="sr-only">Goals</h1>
          <div className="goals-header-actions">
            <p className="goals-count-label">Goals &middot; {goals?.length ?? 0}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <BackupSettingsDialog onExport={onExportBackup} onRestore={onRestoreBackup} />
              <ImportPlanDialog onImport={onImportPlan} />
            </div>
          </div>

          {goalsError !== undefined ? (
            <div className="error-banner section-error">
              <p>{goalsError}</p>
              <button onClick={() => void onRetryGoals()} type="button">
                Retry goals
              </button>
            </div>
          ) : goals === undefined ? (
            <div aria-label="Loading local goals" className="skeleton-grid">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ) : (
            <div className="goal-grid">
              {goals.map((goalTree, index) => {
                const totalTasks = goalTree.phases.reduce((acc, phase) => acc + phase.tasks.length, 0);
                const isEven = index % 2 === 0;
                const tiltClass = isEven ? "tilt-left" : "tilt-right";
                
                return (
                  <article
                    className={`goal-pin note-${noteColor(goalTree.goal.id)} ${tiltClass}`}
                    data-goal-id={goalTree.goal.id}
                    key={goalTree.goal.id}
                  >
                    <div
                      aria-label={`Open goal ${goalTree.goal.title}. Double-click or press Enter.`}
                      className="goal-open-surface"
                      onDoubleClick={() => onOpenGoal(goalTree)}
                      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenGoal(goalTree);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <h2 className="goal-title">{goalTree.goal.title}</h2>
                      
                      <div className="goal-progress-track">
                        <div className="goal-progress-fill" style={{ width: totalTasks > 0 ? '50%' : '0%' }}></div>
                      </div>
                      
                      <p className="goal-meta">
                        {goalTree.phases.length} phases &middot; {totalTasks} tasks left
                      </p>
                    </div>
                    
                    <EntityDialog
                      dialogTitle="Rename goal"
                      initialValue={goalTree.goal.title}
                      inputId={`rename-goal-${goalTree.goal.id}`}
                      label="Goal title"
                      onSubmit={(title) => onRenameGoal(goalTree.goal, title)}
                      placeholder="Goal title"
                      submitLabel="Save changes"
                      triggerClassName="card-icon goal-edit"
                      triggerIcon={<PencilSimpleIcon aria-hidden="true" size={18} />}
                      triggerLabel={`Rename goal ${goalTree.goal.title}`}
                    />
                  </article>
                );
              })}
              
              <EntityDialog
                dialogTitle="Create goal"
                inputId="new-goal-title"
                label="Goal title"
                onSubmit={onCreateGoal}
                placeholder="New goal"
                submitLabel="Create goal"
                triggerClassName="new-goal-button"
                triggerIcon={<PlusIcon aria-hidden="true" size={15} />}
                triggerLabel="New goal"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}"""

quick_note = """function QuickNoteComposer({
  goals,
  isReady,
  onCreate,
  workspaceFailed,
}: QuickNoteComposerProps) {
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isReady || isSaving || draft.trim().length === 0) return;

    setIsSaving(true);
    setError(undefined);
    try {
      await onCreate(draft, { kind: "none" });
      setDraft("");
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-labelledby="quick-note-title" className="quick-note-section">
      <h2 id="quick-note-title" className="sr-only">Capture a note</h2>
      <form aria-busy={isSaving} onSubmit={submit} ref={formRef} className="capture-bar-form">
        <PlusIcon aria-hidden="true" size={16} color="#9C948A" />
        <input
          className="capture-bar-input"
          disabled={!isReady || isSaving}
          onChange={(event) => setDraft(event.currentTarget.value)}
          placeholder="Capture a note or reminder"
          ref={inputRef}
          value={draft}
          aria-invalid={error === undefined ? undefined : true}
        />
        <span className="shortcut-hint">N</span>
      </form>
      {error && <p className="field-error">{error}</p>}
    </section>
  );
}"""

inbox_view = """function InboxView({
  goals,
  inbox,
  loadError,
  onDelete,
  onEdit,
  onReorder,
  onRetry,
  workspaceFailed,
}: InboxViewProps) {
  const notes = inbox?.items.map((item) => item.note);
  return (
    <section aria-labelledby="inbox-title" className="inbox-column">
      <h2 id="inbox-title" className="sr-only">Inbox</h2>
      <p className="inbox-count-label">Inbox &middot; {notes === undefined ? "—" : notes.length}</p>
      
      {loadError !== undefined ? (
        <div className="error-banner section-error">
          <p>{loadError}</p>
          <button onClick={() => void onRetry()} type="button">Retry inbox</button>
        </div>
      ) : notes === undefined ? (
        <div aria-label="Loading local notes" className="inbox-skeleton">
          <div /><div />
        </div>
      ) : notes.length === 0 ? (
        <p className="inbox-empty">No notes yet. Add one above.</p>
      ) : (
        <div className="inbox-list-compact">
          {notes.map((note, index) => (
            <NoteCard
              goals={goals}
              key={note.id}
              nextNote={notes[index + 1]}
              note={note}
              onDelete={onDelete}
              onEdit={onEdit}
              onReorder={onReorder}
              previousNote={notes[index - 1]}
              workspaceFailed={workspaceFailed}
            />
          ))}
        </div>
      )}
    </section>
  );
}"""

note_card = """function NoteCard({
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
  return (
    <article className="note-card" data-note-id={note.id} tabIndex={-1}>
      <div className="note-card-header">
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
      {linkLabel && <p className="note-context">{linkLabel}</p>}
    </article>
  );
}"""

goal_view = """function GoalView({
  checklistProgress,
  checklistProgressError,
  goalTree,
  onBack,
  onCreateChecklistItem,
  onCreatePhase,
  onCreateTask,
  onGetTaskChecklist,
  onMoveTask,
  onRenameGoal,
  onRenamePhase,
  onRenameTask,
  onReorderTask,
  onSelectPhase,
  onSetChecklistItemCompleted,
  onRetryChecklistProgress,
  selectedPhase,
}: GoalViewProps) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            aria-label="Back to goals"
            className="icon-button"
            style={{ border: 'none', padding: '4px' }}
            onClick={onBack}
            title="Back to goals"
            type="button"
          >
            <ArrowLeftIcon aria-hidden="true" size={20} />
          </button>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 500 }}>{goalTree.goal.title}</h3>
        </div>
        <EntityDialog
          dialogTitle="Rename goal"
          initialValue={goalTree.goal.title}
          inputId={`rename-goal-${goalTree.goal.id}`}
          label="Goal title"
          onSubmit={onRenameGoal}
          placeholder="Goal title"
          submitLabel="Save changes"
          triggerClassName="button-secondary"
          triggerIcon={<PencilSimpleIcon aria-hidden="true" size={12} style={{marginRight: '6px'}}/>}
          triggerLabel={`Edit goal`}
        />
      </div>

      {checklistProgressError !== undefined ? (
        <div className="error-banner section-error checklist-summary-error">
          <p>{checklistProgressError}</p>
          <button onClick={() => void onRetryChecklistProgress()} type="button">
            Retry checklist summaries
          </button>
        </div>
      ) : null}

      {goalTree.phases.length === 0 ? (
        <div className="empty-state" style={{marginTop: '24px'}}>
          <h2>Add a phase to organize this goal</h2>
          <EntityDialog
            dialogTitle="Create phase"
            inputId="new-phase-title"
            label="Phase title"
            onSubmit={onCreatePhase}
            placeholder="Foundation"
            submitLabel="Create phase"
            triggerIcon={<PlusIcon aria-hidden="true" size={20} weight="bold" />}
            triggerLabel="Create phase"
          />
        </div>
      ) : (
        <>
          <nav aria-label="Goal phases" className="phase-rail">
            {goalTree.phases.map(({ phase }) => (
              <button
                aria-current={phase.id === selectedPhase?.phase.id ? "page" : undefined}
                className={phase.id === selectedPhase?.phase.id ? "phase-active" : undefined}
                data-phase-id={phase.id}
                key={phase.id}
                onClick={() => onSelectPhase(phase.id)}
                type="button"
              >
                {phase.title}
              </button>
            ))}
            <EntityDialog
              dialogTitle="Create phase"
              inputId="new-phase-title"
              label="Phase title"
              onSubmit={onCreatePhase}
              placeholder="Next phase"
              submitLabel="Create phase"
              triggerIcon={<PlusIcon aria-hidden="true" size={14} style={{marginRight:'4px'}} />}
              triggerLabel="New phase"
            />
          </nav>
          {selectedPhase === undefined ? null : (
            <Board
              checklistProgress={checklistProgress}
              onCreateChecklistItem={onCreateChecklistItem}
              onCreateTask={onCreateTask}
              onGetTaskChecklist={onGetTaskChecklist}
              onMoveTask={onMoveTask}
              onRenamePhase={(title) => onRenamePhase(selectedPhase.phase, title)}
              onRenameTask={onRenameTask}
              onReorderTask={onReorderTask}
              onSetChecklistItemCompleted={onSetChecklistItemCompleted}
              phaseTree={selectedPhase}
            />
          )}
        </>
      )}
    </section>
  );
}"""

board = """function Board({
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
  return (
    <section className="board-section" aria-labelledby="phase-title">
      <div className="section-heading board-heading" style={{ display: 'none' }}>
        <h2 id="phase-title">{phaseTree.phase.title}</h2>
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
            <section className="kanban-column" key={status}>
              <header>
                <h3>{STATUS_LABELS[status]} &middot; {tasks.length}</h3>
              </header>
              {tasks.length > 0 ? (
                <div className="task-list">
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


content = replace_function(content, 'HomeView', home_view)
content = replace_function(content, 'QuickNoteComposer', quick_note)
content = replace_function(content, 'InboxView', inbox_view)
content = replace_function(content, 'NoteCard', note_card)
content = replace_function(content, 'GoalView', goal_view)
content = replace_function(content, 'Board', board)

# TaskCard is more complex, let's replace its return statement inside the function instead
task_card_start = content.find("function TaskCard({")
task_card_end = content.find("function TaskDetailsDialog({")

if task_card_start != -1 and task_card_end != -1:
    task_card_code = content[task_card_start:task_card_end]
    new_return = """return (
    <article 
      className="task-card" 
      data-task-id={task.id} 
      tabIndex={-1} 
      style={task.status === "in_progress" ? { border: '2px solid var(--focus)' } : task.status === "done" ? { opacity: 0.7 } : {}}
      data-testid={`task-card-${task.id}`}
    >
      <div className="task-card-header">
        <TaskDetailsDialog
          checklistState={checklistState}
          onCreateChecklistItem={onCreateChecklistItem}
          onRefreshChecklist={refreshChecklist}
          onSetChecklistItemCompleted={onSetChecklistItemCompleted}
          setChecklistState={setChecklistState}
          task={task}
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
            <fieldset className="task-option-group">
              <legend>Order in column</legend>
              <div className="task-option-grid">
                <button
                  aria-label={
                    previousTask === undefined
                      ? `${task.title} is already first`
                      : `Move ${task.title} before ${previousTask.title}`
                  }
                  aria-describedby={isMutating ? mutationReasonId : undefined}
                  className="task-option"
                  disabled={isMutating || previousTask === undefined}
                  onClick={() => {
                    if (previousTask !== undefined) {
                      void runTaskMutation(() =>
                        onReorderTask(task, previousTask, "before"),
                      );
                    }
                  }}
                  type="button"
                >
                  <CaretUpIcon aria-hidden="true" size={20} />
                  <span>Move before</span>
                  {previousTask === undefined ? <small>Already first</small> : null}
                </button>
                <button
                  aria-label={
                    nextTask === undefined
                      ? `${task.title} is already last`
                      : `Move ${task.title} after ${nextTask.title}`
                  }
                  aria-describedby={isMutating ? mutationReasonId : undefined}
                  className="task-option"
                  disabled={isMutating || nextTask === undefined}
                  onClick={() => {
                    if (nextTask !== undefined) {
                      void runTaskMutation(() =>
                        onReorderTask(task, nextTask, "after"),
                      );
                    }
                  }}
                  type="button"
                >
                  <CaretDownIcon aria-hidden="true" size={20} />
                  <span>Move after</span>
                  {nextTask === undefined ? <small>Already last</small> : null}
                </button>
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
            <div style={{marginTop: '24px'}}>
              <EntityDialog
                dialogTitle="Rename task"
                initialValue={task.title}
                inputId={`rename-task-${task.id}`}
                label="Task title"
                onSubmit={(title) => onRenameTask(task, title)}
                placeholder="Task title"
                submitLabel="Save changes"
                triggerClassName="button-secondary"
                triggerIcon={<PencilSimpleIcon aria-hidden="true" size={16} style={{marginRight: '8px'}} />}
                triggerLabel={`Rename task ${task.title}`}
              />
            </div>
          </div>
        </dialog>
      ) : null}
    </article>
  );
}"""
    
    # We replace the return statement using regex
    return_pattern = re.compile(r'return \(\s*<article className="task-card".*?^\s*\);\s*^}', re.MULTILINE | re.DOTALL)
    if return_pattern.search(task_card_code):
        new_task_card = return_pattern.sub(new_return, task_card_code)
        content = content.replace(task_card_code, new_task_card)
    else:
        print("TaskCard return pattern not found")


with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(content)

