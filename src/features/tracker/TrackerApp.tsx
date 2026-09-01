
import {
  ArrowLeftIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CircleIcon,
  DotsThreeIcon,
  LinkSimpleIcon,
  ListChecksIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlayCircleIcon,
  PlusIcon,
  UploadSimpleIcon,
  TrashSimpleIcon,
  XIcon,
  GearIcon,
  PencilIcon,
  TrashIcon
} from "@phosphor-icons/react";
import {
  type Dispatch,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
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
  type ChecklistItem,
  type ChecklistProgress,
  type ChecklistProgressByTask,
  type Goal,
  type GoalTree,
  type InboxSnapshot,
  type Note,
  type NoteLinkTarget,
  type Phase,
  type PhaseTree,
  type Task,
  type TaskChecklistSnapshot,
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
  refresh: () => Promise<unknown>;
}

type LinkDraft =
  | { kind: "none" }
  | { kind: "goal"; goalId: string }
  | { kind: "task"; goalId: string; taskId: string };

type ChecklistLoadState =
  | { status: "loading" }
  | { status: "loaded"; items: ChecklistItem[] }
  | { status: "failed"; error: string };

interface EntityDialogProps {
  dialogTitle: string;
  initialValue?: string;
  inputId: string;
  label: string;
  onSubmit: (title: string) => Promise<unknown>;
  placeholder: string;
  submitLabel: string;
  triggerClassName?: string;
  triggerIcon: ReactNode;
  triggerLabel: string;
  multiline?: boolean;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof DomainError) {
    return error.message;
  }
  return "This change was not saved. Your draft is still here.";
}

interface TaskContext {
  goal: Goal;
  phase: Phase;
  task: Task;
}

function findTaskContext(
  goals: readonly GoalTree[] | undefined,
  taskId: string,
): TaskContext | undefined {
  if (goals === undefined) {
    return undefined;
  }

  for (const goalTree of goals) {
    for (const phaseTree of goalTree.phases) {
      const task = phaseTree.tasks.find((candidate) => candidate.id === taskId);
      if (task !== undefined) {
        return { goal: goalTree.goal, phase: phaseTree.phase, task };
      }
    }
  }
  return undefined;
}

function linkDraftForNote(
  note: Note,
  goals: readonly GoalTree[] | undefined,
): LinkDraft {
  if (note.linkedGoalId !== undefined) {
    return { kind: "goal", goalId: note.linkedGoalId };
  }
  if (note.linkedTaskId !== undefined) {
    return {
      kind: "task",
      goalId: findTaskContext(goals, note.linkedTaskId)?.goal.id ?? "",
      taskId: note.linkedTaskId,
    };
  }
  return { kind: "none" };
}

function linkTargetForDraft(draft: LinkDraft): NoteLinkTarget {
  if (draft.kind === "none") {
    return draft;
  }
  if (draft.kind === "goal" && draft.goalId !== "") {
    return { kind: "goal", goalId: draft.goalId };
  }
  if (draft.kind === "task" && draft.taskId !== "") {
    return { kind: "task", taskId: draft.taskId };
  }
  throw new DomainError(
    "invalid_note_link",
    `Choose a ${draft.kind} to link, or select No link.`,
  );
}

function noteMatchesLinkDraft(note: Note, draft: LinkDraft): boolean {
  switch (draft.kind) {
    case "none":
      return note.linkedGoalId === undefined && note.linkedTaskId === undefined;
    case "goal":
      return note.linkedGoalId === draft.goalId;
    case "task":
      return note.linkedTaskId === draft.taskId;
  }
}

function noteLinkLabel(
  note: Note,
  goals: readonly GoalTree[] | undefined,
): string | undefined {
  if (note.linkedGoalId !== undefined) {
    const goal = goals?.find(({ goal: candidate }) => candidate.id === note.linkedGoalId);
    return goal === undefined ? "Goal unavailable" : `Goal: ${goal.goal.title}`;
  }
  if (note.linkedTaskId !== undefined) {
    const context = findTaskContext(goals, note.linkedTaskId);
    return context === undefined
      ? "Task unavailable"
      : `Task: ${context.goal.title} / ${context.phase.title} / ${context.task.title}`;
  }
  return undefined;
}

function noteExcerpt(body: string): string {
  const firstLine = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? body.trim();
  return firstLine.length <= 80 ? firstLine : `${firstLine.slice(0, 79)}…`;
}

interface OptionalLinkFieldsProps {
  disabled: boolean;
  draft: LinkDraft;
  goals: readonly GoalTree[] | undefined;
  idPrefix: string;
  onChange: (draft: LinkDraft) => void;
  workspaceFailed: boolean;
}

function OptionalLinkFields({
  disabled,
  draft,
  goals,
  idPrefix,
  onChange,
  workspaceFailed,
}: OptionalLinkFieldsProps) {
  const linkTargetsReady = goals !== undefined && !workspaceFailed;
  const selectedGoal =
    draft.kind === "none"
      ? undefined
      : goals?.find(({ goal }) => goal.id === draft.goalId);
  const taskOptions =
    selectedGoal?.phases.flatMap(({ phase, tasks }) =>
      tasks.map((task) => ({ phase, task })),
    ) ?? [];

  function selectKind(kind: LinkDraft["kind"]) {
    if (kind === "none") {
      onChange({ kind: "none" });
      return;
    }
    if (kind === "goal") {
      onChange({ kind, goalId: goals?.[0]?.goal.id ?? "" });
      return;
    }

    const firstGoalWithTask = goals?.find((goalTree) =>
      goalTree.phases.some(({ tasks }) => tasks.length > 0),
    );
    const firstTask = firstGoalWithTask?.phases.find(({ tasks }) => tasks.length > 0)
      ?.tasks[0];
    onChange({
      kind,
      goalId: firstGoalWithTask?.goal.id ?? "",
      taskId: firstTask?.id ?? "",
    });
  }

  return (
    <fieldset className="link-fields" disabled={disabled}>
      <legend>Optional link</legend>
      <label htmlFor={`${idPrefix}-link-kind`}>Link to</label>
      <select
        id={`${idPrefix}-link-kind`}
        onChange={(event) => selectKind(event.currentTarget.value as LinkDraft["kind"])}
        value={draft.kind}
      >
        <option value="none">No link</option>
        <option disabled={!linkTargetsReady || goals.length === 0} value="goal">
          Goal
        </option>
        <option
          disabled={
            !linkTargetsReady ||
            !goals.some((goalTree) =>
              goalTree.phases.some(({ tasks }) => tasks.length > 0),
            )
          }
          value="task"
        >
          Task
        </option>
      </select>

      {workspaceFailed ? (
        <p className="field-help">Links are unavailable. You can still add this note without one.</p>
      ) : goals === undefined ? (
        <p className="field-help">Loading optional link choices. Unlinked notes remain available.</p>
      ) : goals.length === 0 ? (
        <p className="field-help">No goals are available. This note will remain unlinked.</p>
      ) : null}

      {draft.kind === "goal" ? (
        <>
          <label htmlFor={`${idPrefix}-goal`}>Goal</label>
          <select
            id={`${idPrefix}-goal`}
            onChange={(event) =>
              onChange({ kind: "goal", goalId: event.currentTarget.value })
            }
            value={draft.goalId}
          >
            <option value="">Choose a goal</option>
            {goals?.map((goalTree, index) => (
              <option key={goalTree.goal.id} value={goalTree.goal.id}>
                {`Goal ${String(index + 1).padStart(2, "0")} · ${goalTree.goal.title}`}
              </option>
            ))}
          </select>
        </>
      ) : null}

      {draft.kind === "task" ? (
        <>
          <label htmlFor={`${idPrefix}-task-goal`}>Goal containing task</label>
          <select
            id={`${idPrefix}-task-goal`}
            onChange={(event) => {
              const goalId = event.currentTarget.value;
              const goalTree = goals?.find(({ goal }) => goal.id === goalId);
              const firstTask = goalTree?.phases.find(({ tasks }) => tasks.length > 0)
                ?.tasks[0];
              onChange({ kind: "task", goalId, taskId: firstTask?.id ?? "" });
            }}
            value={draft.goalId}
          >
            <option value="">Choose a goal</option>
            {goals?.map((goalTree, index) => (
              <option key={goalTree.goal.id} value={goalTree.goal.id}>
                {`Goal ${String(index + 1).padStart(2, "0")} · ${goalTree.goal.title}`}
              </option>
            ))}
          </select>
          <label htmlFor={`${idPrefix}-task`}>Task</label>
          <select
            id={`${idPrefix}-task`}
            onChange={(event) =>
              onChange({
                kind: "task",
                goalId: draft.goalId,
                taskId: event.currentTarget.value,
              })
            }
            value={draft.taskId}
          >
            <option value="">Choose a task</option>
            {taskOptions.map(({ phase, task }) => (
              <option key={task.id} value={task.id}>
                {`${phase.title} / ${task.title}`}
              </option>
            ))}
          </select>
          {selectedGoal !== undefined && taskOptions.length === 0 ? (
            <p className="field-help">This goal has no tasks. Choose another goal or No link.</p>
          ) : null}
        </>
      ) : null}
    </fieldset>
  );
}


interface ImportPlanDialogProps {
  onImport: (content: string) => Promise<{ goalsImported: number; phasesImported: number; tasksImported: number; checklistItemsImported: number }>;
}


interface BackupSettingsDialogProps {
  onExport: () => Promise<unknown>;
  onRestore: (backupData: unknown) => Promise<unknown>;
}

function BackupSettingsDialog({ onExport, onRestore }: BackupSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string>();
  const [successSummary, setSuccessSummary] = useState<string>();
  const [previewSummary, setPreviewSummary] = useState<string>();
  const [parsedData, setParsedData] = useState<any>();
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFileContent(undefined);
      setFileName(undefined);
      setError(undefined);
      setSuccessSummary(undefined);
      setPreviewSummary(undefined);
      setParsedData(undefined);
      setIsRestoring(false);
      setIsExporting(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("File is too large. Maximum size is 15MB.");
      return;
    }

    setFileName(file.name);
    setError(undefined);
    setSuccessSummary(undefined);
    setPreviewSummary(undefined);
    setParsedData(undefined);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setFileContent(result);
        try {
          const parsed = JSON.parse(result);
          setParsedData(parsed);
          
          if (parsed && parsed.data) {
            const d = parsed.data;
            setPreviewSummary(`This backup contains ${d.goals?.length || 0} goals, ${d.phases?.length || 0} phases, ${d.tasks?.length || 0} tasks, ${d.checklistItems?.length || 0} checklist items, ${d.notes?.length || 0} notes, and ${d.reminders?.length || 0} reminders.`);
          } else {
             setError("Invalid backup file format.");
          }
        } catch (e) {
          setError("Failed to parse JSON file.");
        }
      } else {
        setError("Failed to read file.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const confirmRestore = async () => {
    if (!parsedData) return;
    setIsRestoring(true);
    setError(undefined);
    try {
      await onRestore(parsedData);
      setSuccessSummary("Backup restored successfully. Your data has been replaced.");
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during restore.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        aria-label="Settings and Backup"
        className="icon-button"
        onClick={() => setIsOpen(true)}
        ref={triggerRef}
        title="Settings and Backup"
        type="button"
      >
        <GearIcon aria-hidden="true" size={20} weight="bold" />
      </button>

      {isOpen && (
        <dialog
          className="entity-dialog"
          onClose={() => setIsOpen(false)}
          ref={(el) => { if (el && isOpen && !el.open) { el.showModal(); } }}
        >
          <div className="dialog-header">
            <h2>Settings and Backup</h2>
            <button className="icon-button dialog-close" onClick={() => setIsOpen(false)}><XIcon size={20}/></button>
          </div>
          {successSummary ? (
            <div className="import-success">
              <p>{successSummary}</p>
              <div className="dialog-actions">
                <button
                  className="button-primary"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="backup-settings-content">
              <h3>Export Backup</h3>
              <p>Export your complete local state to a JSON file.</p>
              <button
                className="button-secondary"
                disabled={isExporting || isRestoring}
                onClick={() => void handleExport()}
                type="button"
                style={{ margin: "8px 0 24px" }}
              >
                {isExporting ? "Exporting..." : "Export Backup"}
              </button>

              <hr style={{ margin: "16px 0", borderTop: "1px solid var(--border-color)" }} />

              <h3>Restore Backup</h3>
              <p>Select a JSON backup file to restore.</p>
              <input
                accept="application/json,.json"
                className="file-input"
                disabled={isRestoring || isExporting}
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
                style={{ margin: "16px 0" }}
              />

              {previewSummary && !error && (
                <div className="import-preview" style={{ background: "var(--background-raised)", padding: "12px", borderRadius: "8px", margin: "16px 0" }}>
                  <p><strong>File:</strong> {fileName}</p>
                  <p>{previewSummary}</p>
                  <p style={{ color: "var(--error-color)", marginTop: "8px", fontWeight: "bold" }}>
                    Warning: Restoring will completely replace all existing local data. This action cannot be undone.
                  </p>
                </div>
              )}

              {error && (
                <div className="error-banner" style={{ margin: "16px 0" }}>
                  <p>{error}</p>
                </div>
              )}

              <div className="dialog-actions">
                <button
                  disabled={isRestoring || isExporting}
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="button-primary"
                  disabled={isRestoring || isExporting || !parsedData || !!error}
                  onClick={() => void confirmRestore()}
                  type="button"
                  style={{ background: "var(--error-color)" }}
                >
                  {isRestoring ? "Restoring..." : "Confirm Restore"}
                </button>
              </div>
            </div>
          )}
        </dialog>
      )}
    </>
  );
}


function ImportPlanDialog({ onImport }: ImportPlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string>();
  const [successSummary, setSuccessSummary] = useState<string>();
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    } else {
      setFileContent(undefined);
      setFileName(undefined);
      setError(undefined);
      setSuccessSummary(undefined);
      setIsImporting(false);
    }
  }, [isOpen]);

  const close = () => {
    dialogRef.current?.close();
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    setFileName(file.name);
    setError(undefined);
    setSuccessSummary(undefined);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setFileContent(result);
      } else {
        setError("Failed to read file.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!fileContent) return;
    setIsImporting(true);
    setError(undefined);
    try {
      const parsed = JSON.parse(fileContent);
      const summary = await onImport(parsed);
      setSuccessSummary(`Imported ${summary.goalsImported} goals, ${summary.phasesImported} phases, ${summary.tasksImported} tasks, and ${summary.checklistItemsImported} checklist items.`);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during import.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <button
        aria-label="Import AI Plan"
        className="icon-button"
        onClick={() => setIsOpen(true)}
        ref={triggerRef}
        title="Import AI Plan"
        type="button"
      >
        <UploadSimpleIcon aria-hidden="true" size={20} weight="bold" />
      </button>

      {isOpen ? (
        <dialog
          aria-labelledby="import-plan-title"
          className="entity-dialog"
          onCancel={(event) => {
            if (isImporting) {
              event.preventDefault();
            }
          }}
          onClose={close}
          ref={dialogRef}
        >
          <div className="dialog-header">
            <h2 id="import-plan-title">Import AI Plan</h2>
            <button
              className="icon-button dialog-close"
              disabled={isImporting}
              onClick={close}
              title="Close"
              type="button"
            >
              <XIcon aria-hidden="true" size={20} />
            </button>
          </div>
          <div className="dialog-body">
            {successSummary ? (
              <div className="import-success">
                <p>{successSummary}</p>
                <div className="dialog-actions">
                  <button
                    className="button-primary"
                    onClick={close}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="import-plan-content">
                <p>Select a JSON AI Plan file to import.</p>
                <input
                  accept="application/json,.json"
                  className="file-input"
                  disabled={isImporting}
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  type="file"
                  style={{ margin: "16px 0" }}
                />

                {fileContent && !error && (
                  <div className="import-preview" style={{ background: "var(--background-raised)", padding: "12px", borderRadius: "8px", margin: "16px 0" }}>
                    <p><strong>File:</strong> {fileName}</p>
                    <p>Preview ready. The plan will be added to your current goals.</p>
                  </div>
                )}

                {error && (
                  <div className="error-banner" style={{ margin: "16px 0" }}>
                    <p>{error}</p>
                  </div>
                )}

                <div className="dialog-actions">
                  <button
                    disabled={isImporting}
                    onClick={close}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="button-primary"
                    disabled={isImporting || !fileContent || !!error}
                    onClick={() => void confirmImport()}
                    type="button"
                  >
                    {isImporting ? "Importing..." : "Confirm Import"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </dialog>
      ) : null}
    </>
  );
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
  multiline = false,
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
  const [workspaceLoadError, setWorkspaceLoadError] = useState<string>();
  const [inbox, setInbox] = useState<InboxSnapshot>();
  const [inboxLoadError, setInboxLoadError] = useState<string>();
  const [checklistProgress, setChecklistProgress] =
    useState<ChecklistProgressByTask>();
  const [checklistProgressLoadError, setChecklistProgressLoadError] =
    useState<string>();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [announcement, setAnnouncement] = useState("");
  const [urgentAnnouncement, setUrgentAnnouncement] = useState("");
  const [retryOperation, setRetryOperation] = useState<RetryOperation>();

  
  const onExportBackup = async () => {
    try {
      const backup = await service.exportBackup(chrome.runtime.getManifest().version);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed", error);
      throw error;
    }
  };

  const onRestoreBackup = async (backupData: unknown) => {
    setSaveState("saving");
    try {
      await service.restoreBackup(backupData);
      await loadWorkspace();
      setSaveState("saved");
      setRetryOperation(undefined);
    } catch (error) {
      setSaveState("failed");
      setRetryOperation(undefined);
      throw error;
    }
  };

  const onImportPlan = async (parsedPlan: unknown) => {
    let summary: any;
    await performMutation(
      async () => {
        summary = await service.importAiPlan(parsedPlan);
      },
      "Plan imported successfully.",
      () => undefined,
      "local",
      () => loadWorkspace()
    );
    return summary;
  };

  const [pendingFocusSelector, setPendingFocusSelector] = useState<string>();
  const [selectedGoalId, setSelectedGoalId] = useState<string>();
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>();
  const homeScrollPosition = useRef(0);

  const refreshWorkspace = useCallback(async () => {
    try {
      const workspace = await service.getWorkspace();
      setSnapshot(workspace);
      setWorkspaceLoadError(undefined);
    } catch (error) {
      setWorkspaceLoadError("Goals could not be loaded. Retry this section.");
      throw error;
    }
  }, [service]);

  const refreshInbox = useCallback(async () => {
    try {
      const nextInbox = await service.getInbox();
      setInbox(nextInbox);
      setInboxLoadError(undefined);
    } catch (error) {
      setInboxLoadError("Notes could not be loaded. Retry this section.");
      throw error;
    }
  }, [service]);

  const refreshChecklistProgress = useCallback(async () => {
    try {
      setChecklistProgress(await service.getChecklistProgress());
      setChecklistProgressLoadError(undefined);
    } catch (error) {
      setChecklistProgressLoadError(
        "Checklist summaries could not be loaded. Task details can still retry.",
      );
      throw error;
    }
  }, [service]);

  const loadWorkspace = useCallback(async () => {
    setAnnouncement("");
    try {
      await refreshWorkspace();
    } catch {
      setAnnouncement("Goals could not be loaded. Retry the Goals section.");
    }
  }, [refreshWorkspace]);

  const loadInbox = useCallback(async () => {
    setAnnouncement("");
    try {
      await refreshInbox();
    } catch {
      setAnnouncement("Notes could not be loaded. Retry the Inbox section.");
    }
  }, [refreshInbox]);

  const loadChecklistProgress = useCallback(async () => {
    try {
      await refreshChecklistProgress();
    } catch {
      setAnnouncement(
        "Checklist summaries could not be loaded. Retry from the goal board.",
      );
    }
  }, [refreshChecklistProgress]);

  useEffect(() => {
    void loadWorkspace();
    void loadInbox();
    void loadChecklistProgress();
  }, [loadChecklistProgress, loadInbox, loadWorkspace]);

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
  }, [inbox, pendingFocusSelector, snapshot]);

  const selectedGoal = useMemo(
    () => snapshot?.goals.find(({ goal }) => goal.id === selectedGoalId),
    [selectedGoalId, snapshot],
  );
  const selectedPhase = useMemo(
    () => selectedGoal?.phases.find(({ phase }) => phase.id === selectedPhaseId),
    [selectedGoal, selectedPhaseId],
  );

  const getTaskChecklist = useCallback(
    (taskId: string) => service.getTaskChecklist(taskId),
    [service],
  );

  const performMutation = useCallback(
    async <T,>(
      action: () => Promise<T>,
      successMessage: string | ((result: T) => string),
      getFocusSelector?: () => string | undefined,
      retryMode: "global" | "local" = "global",
      refresh: () => Promise<void> = refreshWorkspace,
    ): Promise<T> => {
      setSaveState("saving");
      setAnnouncement("");
      setUrgentAnnouncement("");
      let result: T;
      try {
        result = await action();
      } catch (error) {
        if (
          error instanceof DomainError &&
          (error.code === "invalid_title" ||
            error.code === "invalid_note_body" ||
            error.code === "invalid_note_link")
        ) {
          setSaveState("idle");
          throw error;
        }
        setSaveState(retryMode === "local" ? "idle" : "failed");
        setRetryOperation(
          retryMode === "global"
            ? {
                action,
                successMessage: successMessage as RetryOperation["successMessage"],
                getFocusSelector,
                refresh,
              }
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
        await refresh();
      } catch {
        setSaveState("saved");
        setAnnouncement("Saved on this device. Retry loading the view.");
        setRetryOperation(undefined);
        return result;
      }

      setRetryOperation(undefined);
      setSaveState("saved");
      setAnnouncement(
        typeof successMessage === "function" ? successMessage(result) : successMessage,
      );
      setPendingFocusSelector(getFocusSelector?.());
      return result;
    },
    [refreshWorkspace],
  );

  async function retryLastOperation() {
    if (retryOperation === undefined) {
      return;
    }
    const { action, getFocusSelector, refresh, successMessage } = retryOperation;
    try {
      await performMutation(action, successMessage, getFocusSelector, "global", refresh);
    } catch {
      // The shared failure banner remains available for another retry.
    }
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

      {selectedGoal !== undefined && workspaceLoadError !== undefined ? (
        <section className="error-banner">
          <p>{workspaceLoadError}</p>
          <button onClick={() => void loadWorkspace()} type="button">
            Retry goals
          </button>
        </section>
      ) : null}

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
        {selectedGoal === undefined ? (
          <HomeView
            goals={snapshot?.goals}
            goalsError={workspaceLoadError}
            inbox={inbox}
            inboxError={inboxLoadError}
            onCreateNote={(body, linkTarget) => {
              let createdId = "";
              return performMutation(
                async () => {
                  const note = await service.createNote(body, linkTarget);
                  createdId = note.id;
                  return note;
                },
                "Note added.",
                () =>
                  createdId === "" ? undefined : `[data-note-id="${createdId}"]`,
                "local",
                refreshInbox,
              );
            }}
            onImportPlan={onImportPlan}
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
            onDeleteNote={(note) => {
              const notes = inbox?.items.filter(item => item.kind === "note").map((item: any) => item.note) ?? [];
              const index = notes.findIndex((candidate) => candidate.id === note.id);
              const focusId = notes[index + 1]?.id ?? notes[index - 1]?.id;
              return performMutation(
                () => service.deleteNote(note.id),
                "Note deleted.",
                () =>
                  focusId === undefined
                    ? "#quick-note-body"
                    : `[data-note-id="${focusId}"] .note-actions-trigger`,
                "local",
                refreshInbox,
              );
            }}
            onEditNote={(note, body, linkTarget) =>
              performMutation(
                () => service.editNote(note.id, body, linkTarget),
                "Note updated.",
                () => `[data-note-id="${note.id}"]`,
                "local",
                refreshInbox,
              )
            }
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
            onReorderNote={(note, target, placement) =>
              performMutation(
                () => service.reorderNote(note.id, target.id, placement),
                (moved) =>
                  `${noteExcerpt(note.body)} moved to position ${moved.position + 1}.`,
                () => `[data-note-id="${note.id}"] .note-actions-trigger`,
                "local",
                refreshInbox,
              )
            }
            onRetryGoals={loadWorkspace}
            onRetryInbox={loadInbox}
                      onExportBackup={onExportBackup}
            onRestoreBackup={onRestoreBackup}
          />
        ) : (
          <GoalView
            checklistProgress={checklistProgress}
            checklistProgressError={checklistProgressLoadError}
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
            onCreateTask={(title, status = "todo") => {
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
                    status
                  );
                  createdId = task.id;
                  return task;
                },
                "Task created.",
                () =>
                  createdId === ""
                    ? undefined
                    : `[data-task-id="${createdId}"]`,
                "local",
              );
            }}
            onCreateChecklistItem={(taskId, title) =>
              performMutation(
                () => service.createChecklistItem(taskId, title),
                "Checklist item added.",
                undefined,
                "local",
                refreshChecklistProgress,
              )
            }
            onRenameChecklistItem={(taskId, checklistItemId, title) =>
              performMutation(
                () => service.renameChecklistItem(taskId, checklistItemId, title),
                "Checklist item updated.",
                undefined,
                "local",
              )
            }
            onDeleteChecklistItem={(taskId, checklistItemId) =>
              performMutation(
                () => service.deleteChecklistItem(taskId, checklistItemId),
                "Checklist item deleted.",
                undefined,
                "local",
                refreshChecklistProgress,
              )
            }
            onGetTaskChecklist={getTaskChecklist}
            onMoveTask={(task, status) =>
              performMutation(
                () => service.moveTaskToStatus(task.id, status),
                (result) => {
                  const moved = result as Task;
                  return `${task.title} moved to ${STATUS_LABELS[status]}, position ${moved.position + 1}.`;
                },
                () => `[data-task-id="${task.id}"]`,
                "local",
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
                "local",
              )
            }
            onSelectPhase={setSelectedPhaseId}
            onSetChecklistItemCompleted={(taskId, checklistItemId, isCompleted) =>
              performMutation(
                () =>
                  service.setChecklistItemCompleted(
                    taskId,
                    checklistItemId,
                    isCompleted,
                  ),
                isCompleted ? "Checklist item completed." : "Checklist item reopened.",
                undefined,
                "local",
                refreshChecklistProgress,
              )
            }
            onRetryChecklistProgress={loadChecklistProgress}
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

interface HomeViewProps {
  goals: GoalTree[] | undefined;
  goalsError: string | undefined;
  inbox: InboxSnapshot | undefined;
  inboxError: string | undefined;
  onCreateNote: (body: string, linkTarget: NoteLinkTarget) => Promise<Note>;
  onCreateGoal: (title: string) => Promise<unknown>;
  onDeleteNote: (note: Note) => Promise<Note>;
  onEditNote: (
    note: Note,
    body: string,
    linkTarget: NoteLinkTarget,
  ) => Promise<Note>;
  onOpenGoal: (goal: GoalTree) => void;
  onRenameGoal: (goal: Goal, title: string) => Promise<unknown>;
  onReorderNote: (
    note: Note,
    target: Note,
    placement: ReorderPlacement,
  ) => Promise<Note>;
  onRetryGoals: () => Promise<unknown>;
  onRetryInbox: () => Promise<unknown>;
  onImportPlan: (plan: unknown) => Promise<any>;
  onExportBackup: () => Promise<unknown>;
  onRestoreBackup: (backupData: unknown) => Promise<unknown>;
}

function HomeView({
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
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <EntityDialog
                dialogTitle="New Note"
                inputId="new-note-body"
                label="Note content"
                multiline={true}
                onSubmit={(body) => onCreateNote(body, { kind: "none" })}
                placeholder="Capture a note or reminder"
                submitLabel="Create note"
                triggerClassName="icon-button"
                triggerIcon={<PlusIcon aria-hidden="true" size={18} />}
                triggerLabel="New note"
              />
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
                    className={`goal-pin note-${noteColor(goalTree.goal.id)} ${tiltClass}`} data-testid={`goal-pin-${goalTree.goal.id}`}
                    data-goal-id={goalTree.goal.id}
                    key={goalTree.goal.id}
                  >
                    <div
                      aria-label={`Open goal ${goalTree.goal.title}. Double-click or press Enter.`}
                      className="goal-open-surface" data-testid={`goal-open-surface-${goalTree.goal.id}`}
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
}

interface QuickNoteComposerProps {
  goals: readonly GoalTree[] | undefined;
  isReady: boolean;
  onCreate: (body: string, linkTarget: NoteLinkTarget) => Promise<Note>;
  workspaceFailed: boolean;
}

function QuickNoteComposer({
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
      <form aria-busy={isSaving} onSubmit={submit} ref={formRef} className="capture-bar-form" data-testid="capture-bar-form">
        <PlusIcon aria-hidden="true" size={16} color="#9C948A" />
        <input
          className="capture-bar-input" data-testid="capture-bar-input"
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
}

interface InboxViewProps {
  goals: readonly GoalTree[] | undefined;
  inbox: InboxSnapshot | undefined;
  loadError: string | undefined;
  onDelete: (note: Note) => Promise<Note>;
  onEdit: (note: Note, body: string, linkTarget: NoteLinkTarget) => Promise<Note>;
  onReorder: (
    note: Note,
    target: Note,
    placement: ReorderPlacement,
  ) => Promise<Note>;
  onRetry: () => Promise<unknown>;
  workspaceFailed: boolean;
}

function InboxView({
  goals,
  inbox,
  loadError,
  onDelete,
  onEdit,
  onReorder,
  onRetry,
  workspaceFailed,
}: InboxViewProps) {
  const notes = inbox?.items.filter(item => item.kind === "note").map((item: any) => item.note);
  return (
    <section aria-labelledby="inbox-title" className="inbox-column">
      <h2 id="inbox-title" className="sr-only">Inbox</h2>
      <div className="inbox-header-actions">
        <p className="inbox-count-label">Inbox &middot; {notes === undefined ? "—" : notes.length}</p>
      </div>
      
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
}

interface NoteCardProps {
  goals: readonly GoalTree[] | undefined;
  nextNote: Note | undefined;
  note: Note;
  onDelete: (note: Note) => Promise<Note>;
  onEdit: (note: Note, body: string, linkTarget: NoteLinkTarget) => Promise<Note>;
  onReorder: (
    note: Note,
    target: Note,
    placement: ReorderPlacement,
  ) => Promise<Note>;
  previousNote: Note | undefined;
  workspaceFailed: boolean;
}

function NoteCard({
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
}

interface NoteEditorDialogProps {
  goals: readonly GoalTree[] | undefined;
  note: Note;
  onEdit: (note: Note, body: string, linkTarget: NoteLinkTarget) => Promise<Note>;
  workspaceFailed: boolean;
}

function NoteEditorDialog({
  goals,
  note,
  onEdit,
  workspaceFailed,
}: NoteEditorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [body, setBody] = useState(note.body);
  const [linkDraft, setLinkDraft] = useState<LinkDraft>(() =>
    linkDraftForNote(note, goals),
  );
  const [isLinkOpen, setIsLinkOpen] = useState(
    note.linkedGoalId !== undefined || note.linkedTaskId !== undefined,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const errorId = `edit-note-${note.id}-error`;
  const isDirty = body !== note.body || !noteMatchesLinkDraft(note, linkDraft);

  useEffect(() => {
    if (isOpen && dialogRef.current !== null && !dialogRef.current.open) {
      dialogRef.current.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  function open() {
    setBody(note.body);
    const nextLink = linkDraftForNote(note, goals);
    setLinkDraft(nextLink);
    setIsLinkOpen(nextLink.kind !== "none");
    setError(undefined);
    setShowDiscardConfirmation(false);
    setIsOpen(true);
  }

  function requestClose() {
    if (isSaving) {
      return;
    }
    if (isDirty) {
      setShowDiscardConfirmation(true);
      return;
    }
    dialogRef.current?.close();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    setError(undefined);
    try {
      await onEdit(note, body, linkTargetForDraft(linkDraft));
      dialogRef.current?.close();
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        aria-label={`Edit note ${noteExcerpt(note.body)}`}
        className="icon-button card-icon"
        data-tooltip="Edit note"
        onClick={open}
        ref={triggerRef}
        title="Edit note"
        type="button"
      >
        <PencilSimpleIcon aria-hidden="true" size={17} />
      </button>
      {isOpen ? (
        <dialog
          aria-labelledby={`edit-note-${note.id}-title`}
          className="entity-dialog note-editor-dialog"
          onCancel={(event) => {
            if (isSaving || isDirty) {
              event.preventDefault();
              if (!isSaving) {
                setShowDiscardConfirmation(true);
              }
            }
          }}
          onClose={() => {
            setIsOpen(false);
            setError(undefined);
            setShowDiscardConfirmation(false);
            requestAnimationFrame(() => triggerRef.current?.focus());
          }}
          ref={dialogRef}
        >
          <form aria-busy={isSaving} className="dialog-form" onSubmit={submit} ref={formRef}>
            <div className="dialog-header">
              <h2 id={`edit-note-${note.id}-title`}>Edit note</h2>
              <button
                aria-label="Close edit note"
                className="icon-button dialog-close"
                disabled={isSaving}
                onClick={requestClose}
                title="Close"
                type="button"
              >
                <XIcon aria-hidden="true" size={18} weight="bold" />
              </button>
            </div>
            <label htmlFor={`edit-note-${note.id}-body`}>Note body</label>
            <textarea
              aria-describedby={error === undefined ? undefined : errorId}
              aria-invalid={error === undefined ? undefined : true}
              id={`edit-note-${note.id}-body`}
              onChange={(event) => setBody(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
              readOnly={isSaving}
              ref={inputRef}
              value={body}
            />
            <button
              aria-expanded={isLinkOpen}
              className="link-disclosure"
              disabled={isSaving}
              onClick={() => setIsLinkOpen((current) => !current)}
              type="button"
            >
              <LinkSimpleIcon aria-hidden="true" size={18} />
              {isLinkOpen ? "Hide link" : "Add link"}
            </button>
            {isLinkOpen ? (
              <OptionalLinkFields
                disabled={isSaving}
                draft={linkDraft}
                goals={goals}
                idPrefix={`edit-note-${note.id}`}
                onChange={setLinkDraft}
                workspaceFailed={workspaceFailed}
              />
            ) : null}
            {error === undefined ? null : (
              <p className="field-error" id={errorId}>
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <button disabled={isSaving} onClick={requestClose} type="button">
                Cancel
              </button>
              <button className="button-primary" disabled={isSaving} type="submit">
                {isSaving ? "Saving…" : error === undefined ? "Save changes" : "Retry"}
              </button>
            </div>
            {showDiscardConfirmation ? (
              <section className="discard-checklist-draft" role="alert">
                <div>
                  <h3>Discard note changes?</h3>
                  <p>Your unsaved note draft and link choice will be lost.</p>
                </div>
                <div className="dialog-actions">
                  <button
                    onClick={() => {
                      setShowDiscardConfirmation(false);
                      requestAnimationFrame(() => inputRef.current?.focus());
                    }}
                    type="button"
                  >
                    Keep editing
                  </button>
                  <button
                    className="button-danger"
                    onClick={() => dialogRef.current?.close()}
                    type="button"
                  >
                    Discard changes
                  </button>
                </div>
              </section>
            ) : null}
          </form>
        </dialog>
      ) : null}
    </>
  );
}

interface NoteActionsDialogProps {
  nextNote: Note | undefined;
  note: Note;
  onDelete: (note: Note) => Promise<Note>;
  onReorder: (
    note: Note,
    target: Note,
    placement: ReorderPlacement,
  ) => Promise<Note>;
  previousNote: Note | undefined;
}

function NoteActionsDialog({
  nextNote,
  note,
  onDelete,
  onReorder,
  previousNote,
}: NoteActionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"actions" | "delete">("actions");
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string>();
  const [retryAction, setRetryAction] = useState<(() => Promise<void>)>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current !== null && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isOpen]);

  async function run(action: () => Promise<unknown>) {
    if (isMutating) {
      return;
    }
    setIsMutating(true);
    setError(undefined);
    setRetryAction(() => async () => {
      await run(action);
    });
    try {
      await action();
      dialogRef.current?.close();
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsMutating(false);
    }
  }

  function showDeleteConfirmation() {
    setView("delete");
    setError(undefined);
    setRetryAction(undefined);
    requestAnimationFrame(() => deleteCancelRef.current?.focus());
  }

  return (
    <>
      <button
        aria-label={`Open note actions for ${noteExcerpt(note.body)}`}
        className="icon-button card-icon note-actions-trigger"
        data-tooltip="Note actions"
        onClick={() => {
          setView("actions");
          setError(undefined);
          setRetryAction(undefined);
          setIsOpen(true);
        }}
        ref={triggerRef}
        title="Note actions"
        type="button"
      >
        <DotsThreeIcon aria-hidden="true" size={20} weight="bold" />
      </button>
      {isOpen ? (
        <dialog
          aria-describedby={
            view === "delete" ? `note-delete-${note.id}-consequence` : undefined
          }
          aria-labelledby={`note-actions-${note.id}-title`}
          className="entity-dialog note-actions-dialog"
          onCancel={(event) => {
            if (isMutating) {
              event.preventDefault();
            }
          }}
          onClose={() => {
            setIsOpen(false);
            setError(undefined);
            setRetryAction(undefined);
            requestAnimationFrame(() => triggerRef.current?.focus());
          }}
          ref={dialogRef}
        >
          <div aria-busy={isMutating} className="dialog-form">
            <div className="dialog-header">
              <div>
                <h2 id={`note-actions-${note.id}-title`}>
                  {view === "actions" ? "Note actions" : "Delete note?"}
                </h2>
                <p>{noteExcerpt(note.body)}</p>
              </div>
              <button
                aria-label="Close note actions"
                className="icon-button dialog-close"
                disabled={isMutating}
                onClick={() => dialogRef.current?.close()}
                title="Close"
                type="button"
              >
                <XIcon aria-hidden="true" size={18} weight="bold" />
              </button>
            </div>
            {view === "actions" ? (
              <>
                <button
                  className="danger-action"
                  disabled={isMutating}
                  onClick={showDeleteConfirmation}
                  type="button"
                >
                  <TrashSimpleIcon aria-hidden="true" size={18} />
                  Delete note
                </button>
              </>
            ) : (
              <div className="delete-confirmation">
                <p id={`note-delete-${note.id}-consequence`}>
                  This permanently deletes this note. This action cannot be undone.
                </p>
                <div className="dialog-actions">
                  <button
                    disabled={isMutating}
                    onClick={() => dialogRef.current?.close()}
                    ref={deleteCancelRef}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="button-danger"
                    disabled={isMutating}
                    onClick={() => void run(() => onDelete(note))}
                    type="button"
                  >
                    <TrashSimpleIcon aria-hidden="true" size={18} />
                    {isMutating ? "Deleting…" : error === undefined ? "Delete note" : "Retry delete"}
                  </button>
                </div>
              </div>
            )}
            {error === undefined ? null : <p className="field-error">{error}</p>}
            {view === "actions" && error !== undefined && retryAction !== undefined ? (
              <button onClick={() => void retryAction()} type="button">
                Retry last action
              </button>
            ) : null}
          </div>
        </dialog>
      ) : null}
    </>
  );
}

interface GoalViewProps {
  checklistProgress: ChecklistProgressByTask | undefined;
  checklistProgressError: string | undefined;
  goalTree: GoalTree;
  onBack: () => void;
  onCreateChecklistItem: (taskId: string, title: string) => Promise<ChecklistItem>;
  onCreatePhase: (title: string) => Promise<unknown>;
  onCreateTask: (title: string, status?: import("../../domain/model").TaskStatus) => Promise<unknown>;
  onGetTaskChecklist: (taskId: string) => Promise<TaskChecklistSnapshot>;
  onMoveTask: (task: Task, status: TaskStatus, phaseId?: string) => Promise<unknown>;
  onRenameGoal: (title: string) => Promise<unknown>;
  onRenamePhase: (phase: Phase, title: string) => Promise<unknown>;
  onRenameTask: (task: Task, title: string) => Promise<unknown>;
  onReorderTask: (
    task: Task,
    target: Task,
    placement: ReorderPlacement,
  ) => Promise<unknown>;
  onSelectPhase: (phaseId: string) => void;
  onSetChecklistItemCompleted: (
    taskId: string,
    checklistItemId: string,
    isCompleted: boolean,
  ) => Promise<ChecklistItem>;
  onRetryChecklistProgress: () => Promise<unknown>;
  selectedPhase: PhaseTree | undefined;
  onRenameChecklistItem: (taskId: string, checklistItemId: string, title: string) => Promise<unknown>;
  onDeleteChecklistItem: (taskId: string, checklistItemId: string) => Promise<unknown>;
}

function GoalView({
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
  onRenameChecklistItem,
  onDeleteChecklistItem,
  onRetryChecklistProgress,
  selectedPhase,
}: GoalViewProps) {
  const [dragOverPhase, setDragOverPhase] = useState<string | null>(null);

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
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {goalTree.goal.title}
            <EntityDialog
          dialogTitle="Rename goal"
          initialValue={goalTree.goal.title}
          inputId={`rename-goal-${goalTree.goal.id}`}
          label="Goal title"
          onSubmit={onRenameGoal}
          placeholder="Goal title"
          submitLabel="Save changes"
          triggerClassName="inline-edit-button"
          triggerIcon={<PencilSimpleIcon aria-hidden="true" size={12} style={{marginRight: '6px'}}/>}
          triggerLabel={`Edit goal`}
        />
          </h3>
        </div>
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
                className={`${phase.id === selectedPhase?.phase.id ? "phase-active" : ""} ${dragOverPhase === phase.id ? "drag-over-phase" : ""}`}
                data-phase-id={phase.id} data-testid={`phase-tab-${phase.id}`}
                key={phase.id}
                onClick={() => onSelectPhase(phase.id)}
                type="button"

                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes("tracker/task")) return;
                  e.preventDefault();
                  setDragOverPhase(phase.id);
                }}
                onDragLeave={() => setDragOverPhase(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverPhase(null);
                  const draggedId = e.dataTransfer.getData("tracker/task");
                  if (draggedId) {
                    // Update phase of task (requires changes in onMoveTask)
                    onMoveTask({ id: draggedId } as Task, "todo", phase.id); 
                  }
                }}
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
              onRenameChecklistItem={onRenameChecklistItem}
              onDeleteChecklistItem={onDeleteChecklistItem}
              phaseTree={selectedPhase}
            />
          )}
        </>
      )}
    </section>
  );
}

interface BoardProps {
  checklistProgress: ChecklistProgressByTask | undefined;
  phaseTree: PhaseTree;
  onCreateChecklistItem: (taskId: string, title: string) => Promise<ChecklistItem>;
  onCreateTask: (title: string, status?: import("../../domain/model").TaskStatus) => Promise<unknown>;
  onGetTaskChecklist: (taskId: string) => Promise<TaskChecklistSnapshot>;
  onMoveTask: (task: Task, status: TaskStatus, phaseId?: string) => Promise<unknown>;
  onRenamePhase: (title: string) => Promise<unknown>;
  onRenameTask: (task: Task, title: string) => Promise<unknown>;
  onReorderTask: (
    task: Task,
    target: Task,
    placement: ReorderPlacement,
  ) => Promise<unknown>;
  onSetChecklistItemCompleted: (
    taskId: string,
    checklistItemId: string,
    isCompleted: boolean,
  ) => Promise<ChecklistItem>;
  onRenameChecklistItem: (taskId: string, checklistItemId: string, title: string) => Promise<unknown>;
  onDeleteChecklistItem: (taskId: string, checklistItemId: string) => Promise<unknown>;
}

function Board({
  checklistProgress,
  onCreateChecklistItem,
  onCreateTask,
  onGetTaskChecklist,
  onMoveTask,
  onRenamePhase,
  onRenameTask,
  onReorderTask,
  onSetChecklistItemCompleted,
  onRenameChecklistItem,
  onDeleteChecklistItem,
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
              <header 
                className="kanban-column-header" 
                style={{ pointerEvents: dragOverCol === status ? 'none' : 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <h3>{STATUS_LABELS[status]} &middot; {tasks.length}</h3>
                <div className="kanban-column-actions">
                  <EntityDialog
                    dialogTitle={`Create task in ${STATUS_LABELS[status]}`}
                    inputId={`new-task-title-${status}`}
                    label="Task title"
                    onSubmit={(title) => onCreateTask(title, status)}
                    placeholder="Next useful step"
                    submitLabel="Create task"
                    triggerClassName="icon-button column-add-btn"
                    triggerIcon={<PlusIcon aria-hidden="true" size={16} />}
                    triggerLabel=""
                  />
                </div>
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
                      onRenameChecklistItem={onRenameChecklistItem}
                      onDeleteChecklistItem={onDeleteChecklistItem}
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
}

interface TaskCardProps {
  checklistProgress: ChecklistProgress | undefined;
  task: Task;
  previousTask: Task | undefined;
  nextTask: Task | undefined;
  onCreateChecklistItem: (taskId: string, title: string) => Promise<ChecklistItem>;
  onGetTaskChecklist: (taskId: string) => Promise<TaskChecklistSnapshot>;
  onMoveTask: (task: Task, status: TaskStatus, phaseId?: string) => Promise<unknown>;
  onRenameTask: (task: Task, title: string) => Promise<unknown>;
  onReorderTask: (
    task: Task,
    target: Task,
    placement: ReorderPlacement,
  ) => Promise<unknown>;
  onSetChecklistItemCompleted: (
    taskId: string,
    checklistItemId: string,
    isCompleted: boolean,
  ) => Promise<ChecklistItem>;
  onRenameChecklistItem: (taskId: string, checklistItemId: string, title: string) => Promise<unknown>;
  onDeleteChecklistItem: (taskId: string, checklistItemId: string) => Promise<unknown>;
}

function TaskCard({
  checklistProgress,
  nextTask,
  onCreateChecklistItem,
  onGetTaskChecklist,
  onMoveTask,
  onRenameTask,
  onReorderTask,
  onSetChecklistItemCompleted,
  onRenameChecklistItem,
  onDeleteChecklistItem,
  previousTask,
  task,
}: TaskCardProps) {
  const actionReasonId = useId();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [retryTaskAction, setRetryTaskAction] = useState<
    (() => Promise<unknown>) | undefined
  >();
  const [checklistState, setChecklistState] = useState<ChecklistLoadState>({
    status: "loading",
  });
  const isMutatingRef = useRef(false);
  const actionsDialogRef = useRef<HTMLDialogElement>(null);
  const actionsTriggerRef = useRef<HTMLButtonElement>(null);
  const mutationReasonId = `${actionReasonId}-pending`;

  const refreshChecklist = useCallback(async () => {
    setChecklistState({ status: "loading" });
    try {
      const snapshot = await onGetTaskChecklist(task.id);
      const items = sortByPosition(snapshot.checklistItems);
      setChecklistState({ status: "loaded", items });
      return items;
    } catch (error) {
      setChecklistState({ status: "failed", error: getErrorMessage(error) });
      throw error;
    }
  }, [onGetTaskChecklist, task.id]);

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

  async function runTaskMutation(action: () => Promise<unknown>) {
    if (isMutatingRef.current) {
      return;
    }

    isMutatingRef.current = true;
    setIsMutating(true);
    setActionError(undefined);
    setRetryTaskAction(() => action);
    try {
      await action();
      setRetryTaskAction(undefined);
      actionsDialogRef.current?.close();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      isMutatingRef.current = false;
      setIsMutating(false);
    }
  }

  const visibleChecklistProgress =
    checklistState.status === "loaded"
      ? {
          completed: checklistState.items.filter((item) => item.isCompleted).length,
          total: checklistState.items.length,
        }
      : checklistProgress;

  const [dragOver, setDragOver] = useState<"before" | "after" | null>(null);

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
          onRenameChecklistItem={onRenameChecklistItem}
          onDeleteChecklistItem={onDeleteChecklistItem}
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
                      onClick={() => void runTaskMutation((() => onMoveTask(task, status)) as any)}
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
}

interface TaskDetailsDialogProps {
  checklistState: ChecklistLoadState;
  onCreateChecklistItem: (taskId: string, title: string) => Promise<ChecklistItem>;
  onRefreshChecklist: () => Promise<ChecklistItem[]>;
  onSetChecklistItemCompleted: (
    taskId: string,
    checklistItemId: string,
    isCompleted: boolean,
  ) => Promise<ChecklistItem>;
  setChecklistState: Dispatch<SetStateAction<ChecklistLoadState>>;
  task: Task;

  onRenameTask: (task: Task, title: string) => Promise<unknown>;
  onRenameChecklistItem: (taskId: string, checklistItemId: string, title: string) => Promise<unknown>;
  onDeleteChecklistItem: (taskId: string, checklistItemId: string) => Promise<unknown>;
}

function TaskDetailsDialog({
  checklistState,
  onCreateChecklistItem,
  onRefreshChecklist,
  onSetChecklistItemCompleted,
  onRenameChecklistItem,
  onDeleteChecklistItem,
  setChecklistState,
  task,
  onRenameTask,
}: TaskDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [draft, setDraft] = useState("");
  const [createError, setCreateError] = useState<string>();
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [toggleErrors, setToggleErrors] = useState<Record<string, string | undefined>>(
    {},
  );
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = `task-details-${task.id}-title`;
  const inputId = `checklist-${task.id}-title`;
  const createErrorId = `checklist-${task.id}-error`;
  const items = checklistState.status === "loaded" ? checklistState.items : [];
  const completedCount = items.filter((item) => item.isCompleted).length;
  const isBusy = isOpening || pendingToggleIds.size > 0;

  useEffect(() => {
    if (!isOpen || dialogRef.current === null || dialogRef.current.open) {
      return;
    }

    dialogRef.current.showModal();
    requestAnimationFrame(() => {
      if (items.length === 0) {
        inputRef.current?.focus();
      } else {
        headingRef.current?.focus();
      }
    });
  }, [isOpen, items.length]);

  async function openDetails() {
    if (isOpening) {
      return;
    }

    setIsOpening(true);
    try {
      if (checklistState.status !== "loaded") {
        await onRefreshChecklist();
      }
      setCreateError(undefined);
      setToggleErrors({});
      setShowDiscardConfirmation(false);
      setIsOpen(true);
    } catch {
      // The card keeps a recoverable checklist-loading message and title retry target.
    } finally {
      setIsOpening(false);
    }
  }

  function closeWithoutDiscarding() {
    if (isBusy) {
      return;
    }
    if (draft.trim().length > 0) {
      setShowDiscardConfirmation(true);
      return;
    }
    dialogRef.current?.close();
  }

  function discardAndClose() {
    setDraft("");
    setCreateError(undefined);
    setShowDiscardConfirmation(false);
    dialogRef.current?.close();
  }

  async function createChecklistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isOpening) {
      return;
    }

    setIsOpening(true);
    setCreateError(undefined);
    setShowDiscardConfirmation(false);
    try {
      const created = await onCreateChecklistItem(task.id, draft);
      setChecklistState((current) => ({
        status: "loaded",
        items: sortByPosition([
          ...(current.status === "loaded" ? current.items : []),
          created,
        ]),
      }));
      setDraft("");
      requestAnimationFrame(() => {
        document.getElementById(`checklist-${created.id}-completed`)?.focus();
      });
    } catch (error) {
      setCreateError(getErrorMessage(error));
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      setIsOpening(false);
    }
  }

  async function toggleChecklistItem(item: ChecklistItem, isCompleted: boolean) {
    if (pendingToggleIds.has(item.id)) {
      return;
    }

    setPendingToggleIds((current) => new Set(current).add(item.id));
    setToggleErrors((current) => ({ ...current, [item.id]: undefined }));
    try {
      const updated = await onSetChecklistItemCompleted(task.id, item.id, isCompleted);
      setChecklistState((current) =>
        current.status === "loaded"
          ? {
              status: "loaded",
              items: current.items.map((candidate) =>
                candidate.id === updated.id ? updated : candidate,
              ),
            }
          : current,
      );
    } catch (error) {
      setToggleErrors((current) => ({
        ...current,
        [item.id]: getErrorMessage(error),
      }));
    } finally {
      setPendingToggleIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      requestAnimationFrame(() => {
        document.getElementById(`checklist-${item.id}-completed`)?.focus();
      });
    }
  }

  return (
    <>
      <h4 className="task-title-heading" style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <button
          aria-busy={isOpening}
          aria-label={`Open task details for ${task.title}`}
          className="task-title-button"
          onClick={() => void openDetails()}
          ref={triggerRef}
          type="button"
        >
          {task.title}
        </button>
      <EntityDialog
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
        /></h4>
      {isOpen ? (
        <dialog
          aria-labelledby={titleId}
          className="task-detail-dialog"
          onCancel={(event) => {
            if (isBusy || draft.trim().length > 0) {
              event.preventDefault();
              if (!isBusy) {
                setShowDiscardConfirmation(true);
              }
            }
          }}
          onClose={() => {
            setIsOpen(false);
            setCreateError(undefined);
            setShowDiscardConfirmation(false);
            requestAnimationFrame(() => triggerRef.current?.focus());
          }}
          ref={dialogRef}
        >
          <div className="task-detail-layout">
            <header className="task-detail-header">
              <div>
                <h2 id={titleId} ref={headingRef} tabIndex={-1}>
                  {task.title}
                </h2>
                <p>{STATUS_LABELS[task.status]}</p>
              </div>
              <button
                aria-label="Close task details"
                className="icon-button dialog-close"
                disabled={isBusy}
                onClick={closeWithoutDiscarding}
                title="Close task details"
                type="button"
              >
                <XIcon aria-hidden="true" size={18} weight="bold" />
              </button>
            </header>

            <div className="task-detail-content">
              <div className="checklist-heading">
                <h3>Checklist</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p aria-live="polite" style={{ margin: 0 }}>
                    {completedCount} / {items.length} complete
                  </p>
                  <EntityDialog
                    dialogTitle="New Checklist Item"
                    inputId="new-checklist-item"
                    label="Item title"
                    onSubmit={(title) => onCreateChecklistItem(task.id, title).then(() => onRefreshChecklist())}
                    placeholder="A small next step"
                    submitLabel="Add item"
                    triggerClassName="icon-button"
                    triggerIcon={<PlusIcon aria-hidden="true" size={16} />}
                    triggerLabel=""
                  />
                </div>
              </div>

              {items.length === 0 ? (
                <p className="checklist-empty">
                  No checklist items yet. Add the first step.
                </p>
              ) : (
                <div className="checklist-list">
                  {items.map((item) => {
                    const isPending = pendingToggleIds.has(item.id);
                    const error = toggleErrors[item.id];
                    return (
                      <div className="checklist-row" key={item.id}>
                        <label style={{ flex: 1 }}>
                          <input
                            checked={item.isCompleted}
                            disabled={isPending}
                            id={`checklist-${item.id}-completed`}
                            onChange={(event) =>
                              void toggleChecklistItem(item, event.currentTarget.checked)
                            }
                            type="checkbox"
                          />
                          <span>{item.title}</span>
                          {item.isCompleted ? (
                            <span className="checklist-state">Completed</span>
                          ) : null}
                        </label>
                        <div style={{ display: 'flex', gap: '4px', opacity: 0.6 }}>
                          <EntityDialog
                            dialogTitle="Edit Checklist Item"
                            initialValue={item.title}
                            inputId={`edit-checklist-item-${item.id}`}
                            label="Item title"
                            onSubmit={(title) => onRenameChecklistItem(task.id, item.id, title).then(() => onRefreshChecklist())}
                            placeholder="A small next step"
                            submitLabel="Save"
                            triggerClassName="icon-button"
                            triggerIcon={<PencilIcon aria-hidden="true" size={14} />}
                            triggerLabel=""
                          />
                          <button
                            className="icon-button"
                            onClick={() => onDeleteChecklistItem(task.id, item.id).then(() => onRefreshChecklist())}
                            title="Delete item"
                            type="button"
                          >
                            <TrashIcon aria-hidden="true" size={14} />
                          </button>
                        </div>
                        {isPending ? (
                          <p className="checklist-row-state" role="status">
                            Saving…
                          </p>
                        ) : null}
                        {error === undefined ? null : (
                          <div className="checklist-row-error">
                            <p className="field-error">{error}</p>
                            <button
                              onClick={() =>
                                void toggleChecklistItem(item, !item.isCompleted)
                              }
                              type="button"
                            >
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {showDiscardConfirmation ? (
                <section className="discard-checklist-draft" role="alert">
                  <div>
                    <h3>Discard checklist draft?</h3>
                    <p>Your unsaved checklist text will be lost.</p>
                  </div>
                  <div className="dialog-actions">
                    <button
                      onClick={() => {
                        setShowDiscardConfirmation(false);
                        requestAnimationFrame(() => inputRef.current?.focus());
                      }}
                      type="button"
                    >
                      Keep editing
                    </button>
                    <button className="button-danger" onClick={discardAndClose} type="button">
                      Discard and close
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
