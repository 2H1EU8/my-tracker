import {
  type FormEvent,
  type KeyboardEvent,
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

type PendingNavigation =
  | { type: "back" }
  | { type: "phase"; phaseId: string };

interface RetryOperation {
  action: () => Promise<unknown>;
  successMessage: string | ((result: unknown) => string);
  getFocusSelector: (() => string | undefined) | undefined;
}

interface EntityFormProps {
  buttonLabel: string;
  inputId: string;
  label: string;
  onSubmit: (title: string) => Promise<void>;
  placeholder: string;
}

interface RenameEditorProps {
  entityLabel: string;
  title: string;
  onDraftStateChange?: (editorId: string, hasUnsavedDraft: boolean) => void;
  onRename: (title: string) => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof DomainError) {
    return error.message;
  }
  return "This change was not saved. Your draft is still here.";
}

function EntityForm({
  buttonLabel,
  inputId,
  label,
  onSubmit,
  placeholder,
}: EntityFormProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const errorId = `${inputId}-error`;

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
      setDraft("");
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <form aria-busy={isSaving} className="entity-form" onSubmit={submit}>
      <label htmlFor={inputId}>{label}</label>
      <div className="form-row">
        <input
          id={inputId}
          aria-describedby={error === undefined ? undefined : errorId}
          aria-invalid={error === undefined ? undefined : true}
          autoComplete="off"
          maxLength={241}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !isSavingRef.current) {
              setDraft("");
              setError(undefined);
            }
          }}
          placeholder={placeholder}
          readOnly={isSaving}
          value={draft}
        />
        <button className="button-primary" disabled={isSaving} type="submit">
          {isSaving ? `${buttonLabel}…` : error === undefined ? buttonLabel : `Retry ${buttonLabel.toLowerCase()}`}
        </button>
      </div>
      {error === undefined ? null : (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </form>
  );
}

function RenameEditor({
  entityLabel,
  onDraftStateChange,
  onRename,
  title,
}: RenameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editorId = useId();
  const errorId = `${editorId}-error`;
  const hasUnsavedDraft =
    isEditing && (draft !== title || error !== undefined || isSaving);

  useEffect(() => {
    onDraftStateChange?.(editorId, hasUnsavedDraft);
  }, [editorId, hasUnsavedDraft, onDraftStateChange]);

  useEffect(
    () => () => onDraftStateChange?.(editorId, false),
    [editorId, onDraftStateChange],
  );

  function cancel() {
    setDraft(title);
    setError(undefined);
    setIsEditing(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
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
      await onRename(draft);
      setIsEditing(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <button
        aria-label={`Rename ${entityLabel} ${title}`}
        className="button-text"
        onClick={() => {
          setDraft(title);
          setIsEditing(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        ref={triggerRef}
        type="button"
      >
        Rename {entityLabel}
      </button>
    );
  }

  return (
    <form aria-busy={isSaving} className="rename-form" onSubmit={submit}>
      <label className="rename-label" htmlFor={editorId}>
        New {entityLabel} title
      </label>
      <input
        aria-describedby={error === undefined ? undefined : errorId}
        aria-invalid={error === undefined ? undefined : true}
        id={editorId}
        maxLength={241}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === "Escape" && !isSavingRef.current) {
            event.preventDefault();
            cancel();
          }
        }}
        readOnly={isSaving}
        ref={inputRef}
        value={draft}
      />
      <button disabled={isSaving} type="submit">
        {isSaving ? "Saving…" : error === undefined ? "Save" : "Retry"}
      </button>
      <button disabled={isSaving} onClick={cancel} type="button">
        Cancel
      </button>
      {error === undefined ? null : (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </form>
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
      <header className="app-header">
        <div>
          <p className="pixel-label">LOCAL NEW TAB</p>
          <p className="brand">My Tracker</p>
        </div>
        <p className={`save-state save-state-${saveState}`}>
          {saveState === "saving" ? "Saving on this device…" : null}
          {saveState === "saved" ? "Saved on this device." : null}
          {saveState === "failed" ? "Changes are not saved." : null}
          {saveState === "idle" ? "Local only" : null}
        </p>
      </header>

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
                    : `[data-goal-id="${createdId}"] .goal-open`,
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
      <header className="app-header">
        <div>
          <p className="pixel-label">LOCAL NEW TAB</p>
          <p className="brand">My Tracker</p>
        </div>
        <p className="save-state">Loading local data</p>
      </header>
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
      <div className="page-heading">
        <div>
          <p className="eyebrow">Goals</p>
          <h1>Your project pins</h1>
          <p>Stored only in this Chrome profile.</p>
        </div>
        <EntityForm
          buttonLabel="Create goal"
          inputId="new-goal-title"
          label="Goal title"
          onSubmit={onCreateGoal}
          placeholder="Ship My Tracker M1"
        />
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <h2>No goals yet</h2>
          <p>Create one to start planning.</p>
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
                <p className="pixel-label">GOAL {String(index + 1).padStart(2, "0")}</p>
                <h2>{goalTree.goal.title}</h2>
                <time dateTime={goalTree.goal.updatedAt}>Updated {updatedLabel}</time>
                <div className="goal-actions">
                  <button
                    aria-label={`Open goal ${goalTree.goal.title}. Updated ${updatedLabel}`}
                    className="goal-open"
                    onClick={() => onOpenGoal(goalTree)}
                    type="button"
                  >
                    Open goal
                  </button>
                  <RenameEditor
                    entityLabel="goal"
                    onRename={(title) => onRenameGoal(goalTree.goal, title)}
                    title={goalTree.goal.title}
                  />
                </div>
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
  const [draftEditorIds, setDraftEditorIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [boardDraftEditorIds, setBoardDraftEditorIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation>();
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const navigationTriggerRef = useRef<HTMLButtonElement>(null);
  const hasUnsavedRename = draftEditorIds.size > 0;
  const hasUnsavedBoardRename = boardDraftEditorIds.size > 0;
  const backWarningId = "discard-rename-warning";

  const handleDraftStateChange = useCallback(
    (editorId: string, hasUnsavedDraft: boolean) => {
      setDraftEditorIds((currentIds) => {
        const nextIds = new Set(currentIds);
        if (hasUnsavedDraft) {
          nextIds.add(editorId);
        } else {
          nextIds.delete(editorId);
        }
        if (nextIds.size === currentIds.size) {
          return currentIds;
        }
        return nextIds;
      });
    },
    [],
  );

  const handleBoardDraftStateChange = useCallback(
    (editorId: string, hasUnsavedDraft: boolean) => {
      handleDraftStateChange(editorId, hasUnsavedDraft);
      setBoardDraftEditorIds((currentIds) => {
        const nextIds = new Set(currentIds);
        if (hasUnsavedDraft) {
          nextIds.add(editorId);
        } else {
          nextIds.delete(editorId);
        }
        return nextIds.size === currentIds.size ? currentIds : nextIds;
      });
    },
    [handleDraftStateChange],
  );

  useEffect(() => {
    if (
      (pendingNavigation?.type === "back" && !hasUnsavedRename) ||
      (pendingNavigation?.type === "phase" && !hasUnsavedBoardRename)
    ) {
      setPendingNavigation(undefined);
    }
  }, [hasUnsavedBoardRename, hasUnsavedRename, pendingNavigation]);

  function requestBackNavigation() {
    if (!hasUnsavedRename) {
      onBack();
      return;
    }

    navigationTriggerRef.current = backButtonRef.current;
    setPendingNavigation({ type: "back" });
    requestAnimationFrame(() => keepEditingRef.current?.focus());
  }

  function requestPhaseNavigation(
    phaseId: string,
    trigger: HTMLButtonElement,
  ) {
    if (phaseId === selectedPhase?.phase.id) {
      return;
    }
    if (!hasUnsavedBoardRename) {
      onSelectPhase(phaseId);
      return;
    }

    navigationTriggerRef.current = trigger;
    setPendingNavigation({ type: "phase", phaseId });
    requestAnimationFrame(() => keepEditingRef.current?.focus());
  }

  function keepEditing() {
    setPendingNavigation(undefined);
    requestAnimationFrame(() => navigationTriggerRef.current?.focus());
  }

  function discardRenameAndNavigate() {
    const navigation = pendingNavigation;
    setPendingNavigation(undefined);
    if (navigation?.type === "back") {
      onBack();
    } else if (navigation?.type === "phase") {
      onSelectPhase(navigation.phaseId);
    }
  }

  return (
    <section>
      <button
        aria-describedby={
          pendingNavigation?.type === "back" ? backWarningId : undefined
        }
        className="back-button"
        onClick={requestBackNavigation}
        ref={backButtonRef}
        type="button"
      >
        Back to goals
      </button>
      {pendingNavigation === undefined ? null : (
        <section className="navigation-warning" aria-labelledby={backWarningId}>
          <div>
            <h2 id={backWarningId}>Discard the rename draft?</h2>
            <p>
              A rename has unsaved changes. {pendingNavigation.type === "back"
                ? "Going back"
                : "Switching phases"} will discard the draft.
            </p>
          </div>
          <div className="warning-actions">
            <button onClick={keepEditing} ref={keepEditingRef} type="button">
              Keep editing
            </button>
            <button
              className="button-danger"
              onClick={discardRenameAndNavigate}
              type="button"
            >
              Discard draft and {pendingNavigation.type === "back" ? "go back" : "switch phase"}
            </button>
          </div>
        </section>
      )}
      <div className="goal-heading">
        <div>
          <p className="eyebrow">Current goal</p>
          <h1>{goalTree.goal.title}</h1>
          <RenameEditor
            entityLabel="goal"
            onDraftStateChange={handleDraftStateChange}
            onRename={onRenameGoal}
            title={goalTree.goal.title}
          />
        </div>
        <EntityForm
          buttonLabel="Add phase"
          inputId="new-phase-title"
          label="Phase title"
          onSubmit={onCreatePhase}
          placeholder="Foundation"
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
                aria-describedby={
                  pendingNavigation?.type === "phase" &&
                  pendingNavigation.phaseId === phase.id
                    ? backWarningId
                    : undefined
                }
                aria-current={phase.id === selectedPhase?.phase.id ? "page" : undefined}
                className={phase.id === selectedPhase?.phase.id ? "phase-active" : undefined}
                data-phase-id={phase.id}
                key={phase.id}
                onClick={(event) =>
                  requestPhaseNavigation(phase.id, event.currentTarget)
                }
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
              onDraftStateChange={handleBoardDraftStateChange}
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
  onDraftStateChange: (editorId: string, hasUnsavedDraft: boolean) => void;
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
  onDraftStateChange,
  onMoveTask,
  onRenamePhase,
  onRenameTask,
  onReorderTask,
  phaseTree,
}: BoardProps) {
  return (
    <section className="board-section" aria-labelledby="phase-title">
      <div className="board-heading">
        <div>
          <p className="eyebrow">Active phase</p>
          <h2 id="phase-title">{phaseTree.phase.title}</h2>
          <RenameEditor
            entityLabel="phase"
            onDraftStateChange={onDraftStateChange}
            onRename={onRenamePhase}
            title={phaseTree.phase.title}
          />
        </div>
        <EntityForm
          buttonLabel="Add task"
          inputId="new-task-title"
          label="Task title"
          onSubmit={onCreateTask}
          placeholder="Create normalized stores"
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
                      onDraftStateChange={onDraftStateChange}
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
  onDraftStateChange: (editorId: string, hasUnsavedDraft: boolean) => void;
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
  onDraftStateChange,
  onMoveTask,
  onRenameTask,
  onReorderTask,
  previousTask,
  task,
}: TaskCardProps) {
  const actionReasonId = useId();
  const [isMutating, setIsMutating] = useState(false);
  const isMutatingRef = useRef(false);
  const mutationReasonId = `${actionReasonId}-pending`;

  async function runTaskMutation(action: () => Promise<void>) {
    if (isMutatingRef.current) {
      return;
    }

    isMutatingRef.current = true;
    setIsMutating(true);
    try {
      await action();
    } catch {
      // The shared save banner and retry action report the mutation failure.
    } finally {
      isMutatingRef.current = false;
      setIsMutating(false);
    }
  }

  return (
    <article className="task-card" data-task-id={task.id} tabIndex={-1}>
      <h4>{task.title}</h4>
      <RenameEditor
        entityLabel="task"
        onDraftStateChange={onDraftStateChange}
        onRename={(title) => onRenameTask(task, title)}
        title={task.title}
      />
      <div
        aria-busy={isMutating}
        aria-label={`Task actions for ${task.title}`}
        className="task-controls"
        role="group"
      >
        {isMutating ? (
          <p className="task-action-state" id={mutationReasonId}>
            Updating task…
          </p>
        ) : null}
        <div className="task-control-section">
          <p className="task-control-label">Status</p>
          <div className="task-status-controls">
            {TASK_STATUSES.map((status) => {
              const isCurrentStatus = task.status === status;
              const reasonId = `${actionReasonId}-${status}`;
              return (
                <div className="task-action" key={status}>
                  <button
                    aria-describedby={
                      isMutating
                        ? mutationReasonId
                        : isCurrentStatus
                          ? reasonId
                          : undefined
                    }
                    aria-disabled={isMutating || isCurrentStatus || undefined}
                    aria-label={`Move ${task.title} to ${STATUS_LABELS[status]}`}
                    onClick={() => {
                      if (!isMutatingRef.current && !isCurrentStatus) {
                        void runTaskMutation(() => onMoveTask(task, status));
                      }
                    }}
                    type="button"
                  >
                    {STATUS_LABELS[status]}
                  </button>
                  {isCurrentStatus ? (
                    <span className="action-reason" id={reasonId}>
                      Current status
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="task-control-section">
          <p className="task-control-label">Order in column</p>
          <div className="task-order-controls">
            <div className="task-action">
              <button
                aria-describedby={
                  isMutating
                    ? mutationReasonId
                    : previousTask === undefined
                      ? `${actionReasonId}-before`
                      : undefined
                }
                aria-disabled={isMutating || previousTask === undefined || undefined}
                aria-label={`Move ${task.title} before ${previousTask?.title ?? "the first task"}`}
                onClick={() => {
                  if (!isMutatingRef.current && previousTask !== undefined) {
                    void runTaskMutation(() =>
                      onReorderTask(task, previousTask, "before"),
                    );
                  }
                }}
                type="button"
              >
                Move before
              </button>
              {previousTask === undefined ? (
                <span className="action-reason" id={`${actionReasonId}-before`}>
                  Already first
                </span>
              ) : null}
            </div>
            <div className="task-action">
              <button
                aria-describedby={
                  isMutating
                    ? mutationReasonId
                    : nextTask === undefined
                      ? `${actionReasonId}-after`
                      : undefined
                }
                aria-disabled={isMutating || nextTask === undefined || undefined}
                aria-label={`Move ${task.title} after ${nextTask?.title ?? "the last task"}`}
                onClick={() => {
                  if (!isMutatingRef.current && nextTask !== undefined) {
                    void runTaskMutation(() =>
                      onReorderTask(task, nextTask, "after"),
                    );
                  }
                }}
                type="button"
              >
                Move after
              </button>
              {nextTask === undefined ? (
                <span className="action-reason" id={`${actionReasonId}-after`}>
                  Already last
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
