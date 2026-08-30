import {
  ArrowLeftIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CircleIcon,
  DotsThreeIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlayCircleIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReorderPlacement, TrackerService } from "../../application/tracker-service";
import { DomainError } from "../../domain/errors";
import {
  TASK_STATUSES,
  type Goal,
  type GoalTree,
  type Phase,
  type PhaseTree,
  type Task,
  type TaskStatus,
  type WorkspaceSnapshot,
} from "../../domain/model";
import { sortByPosition } from "../../domain/rules";

interface TrackerAppProps {
  service: TrackerService;
}

type SaveState = "idle" | "saving" | "saved" | "failed";

interface RetryOperation {
  action: () => Promise<unknown>;
  successMessage: string | ((result: unknown) => string);
  getFocusSelector: (() => string | undefined) | undefined;
}

interface EntityDialogProps {
  dialogTitle: string;
  initialValue?: string;
  inputId: string;
  label: string;
  onSubmit: (title: string) => Promise<void>;
  placeholder: string;
  submitLabel: string;
  triggerClassName?: string;
  triggerIcon: ReactNode;
  triggerLabel: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof DomainError) {
    return error.message;
  }
  return "This change was not saved. Your draft is still here.";
}

function EntityDialog({
  dialogTitle,
  initialValue = "",
  inputId,
  label,
  onSubmit,
  placeholder,
  submitLabel,
  triggerClassName,
  triggerIcon,
  triggerLabel,
}: EntityDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(initialValue);
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const errorId = `${inputId}-error`;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  function open() {
    setDraft(initialValue);
    setError(undefined);
    setIsOpen(true);
  }

  function close() {
    if (!isSavingRef.current) {
      dialogRef.current?.close();
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setError(undefined);

    try {
      await onSubmit(draft);
      dialogRef.current?.close();
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        aria-label={triggerLabel}
        className={`icon-button${triggerClassName === undefined ? "" : ` ${triggerClassName}`}`}
        data-tooltip={triggerLabel}
        onClick={open}
        ref={triggerRef}
        title={triggerLabel}
        type="button"
      >
        {triggerIcon}
      </button>
      {isOpen ? (
        <dialog
          aria-labelledby={`${inputId}-dialog-title`}
          className="entity-dialog"
          onCancel={(event) => {
            if (isSavingRef.current) {
              event.preventDefault();
            }
          }}
          onClose={() => {
            setIsOpen(false);
            setDraft(initialValue);
            setError(undefined);
            requestAnimationFrame(() => triggerRef.current?.focus());
          }}
          ref={dialogRef}
        >
          <form aria-busy={isSaving} className="dialog-form" onSubmit={submit}>
            <div className="dialog-header">
              <h2 id={`${inputId}-dialog-title`}>{dialogTitle}</h2>
              <button
                aria-label={`Close ${dialogTitle.toLowerCase()}`}
                className="icon-button dialog-close"
                disabled={isSaving}
                onClick={close}
                title="Close"
                type="button"
              >
                <XIcon aria-hidden="true" size={18} weight="bold" />
              </button>
            </div>
            <label htmlFor={inputId}>{label}</label>
            <input
              aria-describedby={error === undefined ? undefined : errorId}
              aria-invalid={error === undefined ? undefined : true}
              autoComplete="off"
              id={inputId}
              maxLength={241}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Escape" && !isSavingRef.current) {
                  event.preventDefault();
                  close();
                }
              }}
              placeholder={placeholder}
              readOnly={isSaving}
              ref={inputRef}
              value={draft}
            />
            {error === undefined ? null : (
              <p className="field-error" id={errorId}>
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <button disabled={isSaving} onClick={close} type="button">
                Cancel
              </button>
              <button className="button-primary" disabled={isSaving} type="submit">
                {isSaving ? "Saving…" : error === undefined ? submitLabel : "Retry"}
              </button>
            </div>
          </form>
        </dialog>
      ) : null}
    </>
  );
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

function noteColor(goalId: string): string {
  const variants = ["amber", "sage", "blue", "mauve", "clay"];
  let hash = 0;
  for (const character of goalId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return variants[hash % variants.length] ?? "amber";
}

function formatUpdatedAt(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function AppHeader() {
  return (
    <header className="app-header">
      <p className="brand">My Tracker</p>
      <label className="search-shell">
        <MagnifyingGlassIcon aria-hidden="true" size={18} />
        <span className="sr-only">Search goals and tasks</span>
        <input
          aria-label="Search goals and tasks — coming soon"
          disabled
          placeholder="Search"
          type="search"
        />
      </label>
    </header>
  );
}

export function TrackerApp({ service }: TrackerAppProps) {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>();
  const [loadError, setLoadError] = useState<string>();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [announcement, setAnnouncement] = useState("");
  const [urgentAnnouncement, setUrgentAnnouncement] = useState("");
  const [retryOperation, setRetryOperation] = useState<RetryOperation>();
  const [pendingFocusSelector, setPendingFocusSelector] = useState<string>();
  const [selectedGoalId, setSelectedGoalId] = useState<string>();
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>();
  const homeScrollPosition = useRef(0);

  const loadWorkspace = useCallback(async () => {
    setLoadError(undefined);
    setAnnouncement("");
    try {
      const workspace = await service.getWorkspace();
      setSnapshot(workspace);
    } catch {
      setLoadError("Local storage is unavailable. Retry loading.");
      setAnnouncement("Local data could not be loaded. Retry loading.");
    }
  }, [service]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (saveState !== "saved") {
      return;
    }
    const timeout = window.setTimeout(() => setSaveState("idle"), 1600);
    return () => window.clearTimeout(timeout);
  }, [saveState]);

  useEffect(() => {
    if (pendingFocusSelector === undefined) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(pendingFocusSelector)?.focus();
      setPendingFocusSelector(undefined);
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [pendingFocusSelector, snapshot]);

  const selectedGoal = useMemo(
    () => snapshot?.goals.find(({ goal }) => goal.id === selectedGoalId),
    [selectedGoalId, snapshot],
  );
  const selectedPhase = useMemo(
    () => selectedGoal?.phases.find(({ phase }) => phase.id === selectedPhaseId),
    [selectedGoal, selectedPhaseId],
  );

  const performMutation = useCallback(
    async (
      action: () => Promise<unknown>,
      successMessage: string | ((result: unknown) => string),
      getFocusSelector?: () => string | undefined,
      retryMode: "global" | "local" = "global",
    ) => {
      setSaveState("saving");
      setAnnouncement("");
      setUrgentAnnouncement("");
      let result: unknown;
      try {
        result = await action();
      } catch (error) {
        if (error instanceof DomainError && error.code === "invalid_title") {
          setSaveState("idle");
          throw error;
        }
        setSaveState("failed");
        setRetryOperation(
          retryMode === "global"
            ? { action, successMessage, getFocusSelector }
            : undefined,
        );
        if (retryMode === "local") {
          setUrgentAnnouncement(
            "Changes are not saved. Your draft is still here. Retry from the current form.",
          );
        } else {
          setAnnouncement("This action was not saved. Retry the last action.");
        }
        throw error;
      }

      try {
        const workspace = await service.getWorkspace();
        setSnapshot(workspace);
      } catch {
        setSaveState("saved");
        setLoadError("The change was saved, but the view could not be refreshed.");
        setAnnouncement("Saved on this device. Retry loading the view.");
        setRetryOperation(undefined);
        return;
      }

      setRetryOperation(undefined);
      setSaveState("saved");
      setAnnouncement(
        typeof successMessage === "function" ? successMessage(result) : successMessage,
      );
      setPendingFocusSelector(getFocusSelector?.());
    },
    [service],
  );

  async function retryLastOperation() {
    if (retryOperation === undefined) {
      return;
    }
    const { action, getFocusSelector, successMessage } = retryOperation;
    try {
      await performMutation(action, successMessage, getFocusSelector);
    } catch {
      // The shared failure banner remains available for another retry.
    }
  }

  if (snapshot === undefined && loadError === undefined) {
    return <LoadingShell />;
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      {saveState === "idle" ? null : (
        <p className={`save-toast save-state-${saveState}`} role="status">
          {saveState === "saving" ? "Saving…" : null}
          {saveState === "saved" ? "Saved" : null}
          {saveState === "failed" ? "Changes are not saved" : null}
        </p>
      )}

      {loadError === undefined ? null : (
        <section className="error-banner">
          <p>Local data could not be loaded. {loadError}</p>
          <button onClick={() => void loadWorkspace()} type="button">
            Retry loading
          </button>
        </section>
      )}

      {saveState !== "failed" ? null : (
        <section className="error-banner">
          <p>
            {retryOperation === undefined
              ? "This change was not saved. Your draft is still here."
              : "This action was not saved. Existing local data is unchanged."}
          </p>
          {retryOperation === undefined ? null : (
            <button onClick={() => void retryLastOperation()} type="button">
              Retry last save
            </button>
          )}
        </section>
      )}

      <main id="main-content">
        {snapshot === undefined ? null : selectedGoal === undefined ? (
          <HomeView
            goals={snapshot.goals}
            onCreateGoal={async (title) => {
              let createdId = "";
              await performMutation(
                async () => {
                  const goal = await service.createGoal(title);
                  createdId = goal.id;
                },
                "Goal created.",
                () =>
                  createdId === ""
                    ? undefined
                    : `[data-goal-id="${createdId}"] .goal-open-surface`,
                "local",
              );
            }}
            onOpenGoal={(goalTree) => {
              homeScrollPosition.current = window.scrollY;
              setSelectedGoalId(goalTree.goal.id);
              setSelectedPhaseId(goalTree.phases[0]?.phase.id);
            }}
            onRenameGoal={(goal, title) =>
              performMutation(
                () => service.renameGoal(goal.id, title),
                `Renamed goal to ${title.trim()}.`,
                undefined,
                "local",
              )
            }
          />
        ) : (
          <GoalView
            goalTree={selectedGoal}
            onBack={() => {
              setSelectedGoalId(undefined);
              setSelectedPhaseId(undefined);
              requestAnimationFrame(() => window.scrollTo(0, homeScrollPosition.current));
            }}
            onCreatePhase={(title) => {
              let createdId = "";
              return performMutation(
                async () => {
                  const phase = await service.createPhase(selectedGoal.goal.id, title);
                  createdId = phase.id;
                  setSelectedPhaseId(phase.id);
                  return phase;
                },
                "Phase created.",
                () =>
                  createdId === ""
                    ? undefined
                    : `[data-phase-id="${createdId}"]`,
                "local",
              );
            }}
            onCreateTask={(title) => {
              if (selectedPhase === undefined) {
                return Promise.reject(new DomainError("not_found", "Select a phase first."));
              }
              let createdId = "";
              return performMutation(
                async () => {
                  const task = await service.createTask(
                    selectedGoal.goal.id,
                    selectedPhase.phase.id,
                    title,
                  );
                  createdId = task.id;
                  return task;
                },
                "Task created in Todo.",
                () =>
                  createdId === ""
                    ? undefined
                    : `[data-task-id="${createdId}"]`,
                "local",
              );
            }}
            onMoveTask={(task, status) =>
              performMutation(
                () => service.moveTaskToStatus(task.id, status),
                (result) => {
                  const moved = result as Task;
                  return `${task.title} moved to ${STATUS_LABELS[status]}, position ${moved.position + 1}.`;
                },
                () => `[data-task-id="${task.id}"]`,
              )
            }
            onRenameGoal={(title) =>
              performMutation(
                () => service.renameGoal(selectedGoal.goal.id, title),
                `Renamed goal to ${title.trim()}.`,
                undefined,
                "local",
              )
            }
            onRenamePhase={(phase, title) =>
              performMutation(
                () => service.renamePhase(phase.id, title),
                `Renamed phase to ${title.trim()}.`,
                undefined,
                "local",
              )
            }
            onRenameTask={(task, title) =>
              performMutation(
                () => service.renameTask(task.id, title),
                `Renamed task to ${title.trim()}.`,
                undefined,
                "local",
              )
            }
            onReorderTask={(task, target, placement) =>
              performMutation(
                () => service.reorderTask(task.id, target.id, placement),
                (result) => {
                  const moved = result as Task;
                  return `${task.title} moved ${placement} ${target.title}, position ${moved.position + 1}.`;
                },
                () => `[data-task-id="${task.id}"]`,
              )
            }
            onSelectPhase={setSelectedPhaseId}
            selectedPhase={selectedPhase}
          />
        )}
      </main>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <div aria-live="assertive" className="sr-only">
        {urgentAnnouncement}
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="app-shell" aria-busy="true">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      <main id="main-content">
        <h1>Loading local data</h1>
        <div className="skeleton-grid" aria-hidden="true">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </main>
    </div>
  );
}

interface HomeViewProps {
  goals: GoalTree[];
  onCreateGoal: (title: string) => Promise<void>;
  onOpenGoal: (goal: GoalTree) => void;
  onRenameGoal: (goal: Goal, title: string) => Promise<void>;
}

function HomeView({ goals, onCreateGoal, onOpenGoal, onRenameGoal }: HomeViewProps) {
  return (
    <section>
      <div className="section-heading page-heading">
        <h1>Goals</h1>
        <EntityDialog
          dialogTitle="Create goal"
          inputId="new-goal-title"
          label="Goal title"
          onSubmit={onCreateGoal}
          placeholder="Ship the next release"
          submitLabel="Create goal"
          triggerIcon={<PlusIcon aria-hidden="true" size={20} weight="bold" />}
          triggerLabel="Create goal"
        />
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <h2>No goals yet</h2>
          <p>Use the plus button to create your first goal.</p>
        </div>
      ) : (
        <div className="goal-grid">
          {goals.map((goalTree, index) => {
            const updatedLabel = formatUpdatedAt(goalTree.goal.updatedAt);
            return (
              <article
                className={`goal-pin note-${noteColor(goalTree.goal.id)}`}
                data-goal-id={goalTree.goal.id}
                key={goalTree.goal.id}
              >
                <div
                  aria-label={`Open goal ${goalTree.goal.title}. Updated ${updatedLabel}. Double-click or press Enter.`}
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
                  <span className="goal-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2>{goalTree.goal.title}</h2>
                  <time dateTime={goalTree.goal.updatedAt}>{updatedLabel}</time>
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
        </div>
      )}
    </section>
  );
}

interface GoalViewProps {
  goalTree: GoalTree;
  onBack: () => void;
  onCreatePhase: (title: string) => Promise<void>;
  onCreateTask: (title: string) => Promise<void>;
  onMoveTask: (task: Task, status: TaskStatus) => Promise<void>;
  onRenameGoal: (title: string) => Promise<void>;
  onRenamePhase: (phase: Phase, title: string) => Promise<void>;
  onRenameTask: (task: Task, title: string) => Promise<void>;
  onReorderTask: (
    task: Task,
    target: Task,
    placement: ReorderPlacement,
  ) => Promise<void>;
  onSelectPhase: (phaseId: string) => void;
  selectedPhase: PhaseTree | undefined;
}

function GoalView({
  goalTree,
  onBack,
  onCreatePhase,
  onCreateTask,
  onMoveTask,
  onRenameGoal,
  onRenamePhase,
  onRenameTask,
  onReorderTask,
  onSelectPhase,
  selectedPhase,
}: GoalViewProps) {
  return (
    <section>
      <button
        aria-label="Back to goals"
        className="icon-button back-button"
        data-tooltip="Back to goals"
        onClick={onBack}
        title="Back to goals"
        type="button"
      >
        <ArrowLeftIcon aria-hidden="true" size={20} />
      </button>
      <div className="section-heading goal-heading">
        <div className="title-actions">
          <h1>{goalTree.goal.title}</h1>
          <EntityDialog
            dialogTitle="Rename goal"
            initialValue={goalTree.goal.title}
            inputId={`rename-goal-${goalTree.goal.id}`}
            label="Goal title"
            onSubmit={onRenameGoal}
            placeholder="Goal title"
            submitLabel="Save changes"
            triggerIcon={<PencilSimpleIcon aria-hidden="true" size={18} />}
            triggerLabel={`Rename goal ${goalTree.goal.title}`}
          />
        </div>
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

      {goalTree.phases.length === 0 ? (
        <div className="empty-state">
          <h2>Add a phase to organize this goal</h2>
          <p>The board appears after the first phase is created.</p>
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
          </nav>
          {selectedPhase === undefined ? null : (
            <Board
              onCreateTask={onCreateTask}
              onMoveTask={onMoveTask}
              onRenamePhase={(title) => onRenamePhase(selectedPhase.phase, title)}
              onRenameTask={onRenameTask}
              onReorderTask={onReorderTask}
              phaseTree={selectedPhase}
            />
          )}
        </>
      )}
    </section>
  );
}

interface BoardProps {
  phaseTree: PhaseTree;
  onCreateTask: (title: string) => Promise<void>;
  onMoveTask: (task: Task, status: TaskStatus) => Promise<void>;
  onRenamePhase: (title: string) => Promise<void>;
  onRenameTask: (task: Task, title: string) => Promise<void>;
  onReorderTask: (
    task: Task,
    target: Task,
    placement: ReorderPlacement,
  ) => Promise<void>;
}

function Board({
  onCreateTask,
  onMoveTask,
  onRenamePhase,
  onRenameTask,
  onReorderTask,
  phaseTree,
}: BoardProps) {
  return (
    <section className="board-section" aria-labelledby="phase-title">
      <div className="section-heading board-heading">
        <div className="title-actions">
          <h2 id="phase-title">{phaseTree.phase.title}</h2>
          <EntityDialog
            dialogTitle="Rename phase"
            initialValue={phaseTree.phase.title}
            inputId={`rename-phase-${phaseTree.phase.id}`}
            label="Phase title"
            onSubmit={onRenamePhase}
            placeholder="Phase title"
            submitLabel="Save changes"
            triggerIcon={<PencilSimpleIcon aria-hidden="true" size={18} />}
            triggerLabel={`Rename phase ${phaseTree.phase.title}`}
          />
        </div>
        <EntityDialog
          dialogTitle="Create task"
          inputId="new-task-title"
          label="Task title"
          onSubmit={onCreateTask}
          placeholder="Next useful step"
          submitLabel="Create task"
          triggerIcon={<PlusIcon aria-hidden="true" size={20} weight="bold" />}
          triggerLabel="Create task"
        />
      </div>

      {phaseTree.tasks.length === 0 ? (
        <p className="board-empty-message">No tasks in this phase yet. Add a task to Todo.</p>
      ) : null}

      <div className="board">
        {TASK_STATUSES.map((status) => {
          const tasks = sortByPosition(
            phaseTree.tasks.filter((task) => task.status === status),
          );
          return (
            <section className="kanban-column" key={status}>
              <header>
                <h3>{STATUS_LABELS[status]}</h3>
                <span className="task-count">{tasks.length}</span>
              </header>
              {tasks.length === 0 ? (
                <p className="column-empty">No tasks in this status.</p>
              ) : (
                <div className="task-list">
                  {tasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      nextTask={tasks[index + 1]}
                      onMoveTask={onMoveTask}
                      onRenameTask={onRenameTask}
                      onReorderTask={onReorderTask}
                      previousTask={tasks[index - 1]}
                      task={task}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

interface TaskCardProps {
  task: Task;
  previousTask: Task | undefined;
  nextTask: Task | undefined;
  onMoveTask: (task: Task, status: TaskStatus) => Promise<void>;
  onRenameTask: (task: Task, title: string) => Promise<void>;
  onReorderTask: (
    task: Task,
    target: Task,
    placement: ReorderPlacement,
  ) => Promise<void>;
}

function TaskCard({
  nextTask,
  onMoveTask,
  onRenameTask,
  onReorderTask,
  previousTask,
  task,
}: TaskCardProps) {
  const actionReasonId = useId();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const isMutatingRef = useRef(false);
  const actionsDialogRef = useRef<HTMLDialogElement>(null);
  const actionsTriggerRef = useRef<HTMLButtonElement>(null);
  const mutationReasonId = `${actionReasonId}-pending`;

  useEffect(() => {
    if (!isActionsOpen) {
      return;
    }
    const dialog = actionsDialogRef.current;
    if (dialog !== null && !dialog.open) {
      dialog.showModal();
    }
  }, [isActionsOpen]);

  function closeActions() {
    if (!isMutatingRef.current) {
      actionsDialogRef.current?.close();
    }
  }

  async function runTaskMutation(action: () => Promise<void>) {
    if (isMutatingRef.current) {
      return;
    }

    isMutatingRef.current = true;
    setIsMutating(true);
    setActionError(undefined);
    try {
      await action();
      actionsDialogRef.current?.close();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      isMutatingRef.current = false;
      setIsMutating(false);
    }
  }

  return (
    <article className="task-card" data-task-id={task.id} tabIndex={-1}>
      <div className="task-card-header">
        <h4>{task.title}</h4>
        <div className="card-actions">
          <EntityDialog
            dialogTitle="Rename task"
            initialValue={task.title}
            inputId={`rename-task-${task.id}`}
            label="Task title"
            onSubmit={(title) => onRenameTask(task, title)}
            placeholder="Task title"
            submitLabel="Save changes"
            triggerClassName="card-icon"
            triggerIcon={<PencilSimpleIcon aria-hidden="true" size={17} />}
            triggerLabel={`Rename task ${task.title}`}
          />
          <button
            aria-label={`Open actions for ${task.title}`}
            className="icon-button card-icon"
            data-tooltip="Task actions"
            onClick={() => {
              setActionError(undefined);
              setIsActionsOpen(true);
            }}
            ref={actionsTriggerRef}
            title="Task actions"
            type="button"
          >
            <DotsThreeIcon aria-hidden="true" size={20} weight="bold" />
          </button>
        </div>
      </div>
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
              <p className="field-error">{actionError}</p>
            )}
          </div>
        </dialog>
      ) : null}
    </article>
  );
}
