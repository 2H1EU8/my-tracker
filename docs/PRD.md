# Product requirements

## Status

Baseline approved for MVP planning. Implementation has not started.

## Actors

- **Owner**: the only local user in the MVP.
- **AI author**: an external AI tool that produces a plan file; it has no runtime access to the extension.
- **Browser background**: the Manifest V3 service worker that reconciles alarms and creates notifications.

## Functional requirements

### R-001 — New Tab shell

The extension must replace Chrome New Tab with the My Tracker interface.

Acceptance criteria:

- Loading an unpacked production build and opening a new tab displays My Tracker.
- Existing local data is rendered without a network request.
- The user can begin quick capture before nonessential decoration finishes.
- A failure to load one widget does not produce a blank page.

### R-002 — Quick capture and notes inbox

The owner can capture a text note from the home view.

Acceptance criteria:

- A non-empty trimmed note can be created by keyboard.
- Empty or whitespace-only notes are rejected inline.
- A note records stable ID, body, created time, updated time, and manual order.
- A note can optionally link to one goal or one task.
- A note remains unlinked when no target is selected.
- Editing, reordering, and manual deletion persist after reopening New Tab.
- Deletion is explicit; age or completion never auto-deletes a note.

### R-003 — Reminder lifecycle

The owner can create a one-time reminder with a local date and time.

Acceptance criteria:

- The UI stores the intended IANA time zone together with a normalized instant.
- A future reminder creates or updates a corresponding browser alarm.
- When the alarm fires, the background service worker creates a system notification.
- The persisted reminder changes from `scheduled` to `fired` and records `firedAt`.
- A fired or overdue reminder stays in the inbox until manual deletion.
- Editing the due date reschedules the browser alarm.
- Deleting the reminder clears its derived alarm.
- On extension startup, install, update, or browser startup, persisted scheduled reminders and Chrome alarms are reconciled.
- If the device is sleeping at the due time, notification occurs when Chrome processes the missed alarm after wake; the app must not claim exact delivery.
- If notification permission/API use fails, the reminder remains visible with a recoverable error state.

### R-004 — Goal cards

The home view shows each goal as a compact, original code-native pixel-pin note
card within the calm dark visual system.

Acceptance criteria:

- Collapsed cards show title and last updated time.
- Cards retain a deterministic user-defined order.
- Dragging reorders cards and persists the new order.
- Keyboard controls can produce the same reorder result.
- Opening a card navigates to that goal without losing home scroll/order state.
- Goals can be archived and later restored; permanent deletion requires confirmation.

### R-005 — Goal hierarchy

A goal contains ordered phases; a phase contains ordered tasks; a task contains ordered checklist items.

Acceptance criteria:

- The owner can create, rename, reorder, and delete a phase.
- The owner can create, edit, move, reorder, complete, and delete a task.
- A task belongs to exactly one goal and one phase.
- A checklist item belongs to exactly one task and can be checked or unchecked.
- A checklist item cannot appear as an independent Kanban card.
- Removing a non-empty phase requires an explicit choice to move or delete its tasks.
- Hierarchy and order persist after reopening.

### R-006 — Simple Kanban workflow

Tasks use exactly three MVP statuses: `todo`, `in_progress`, and `done`.

Acceptance criteria:

- The goal detail board exposes Todo, In Progress, and Done columns.
- Moving a card between columns changes status and updated time.
- Reordering within a column persists.
- A keyboard-accessible action can move a task to any valid status.
- Completing all checklist items does not silently mark the task Done.
- Marking a task Done does not silently check all checklist items.

### R-007 — Task deadline

A task may have a date-and-time deadline.

Acceptance criteria:

- The deadline stores the selected local time zone and normalized instant.
- A task with a deadline produces a notification at that time unless notification is explicitly disabled for the task.
- An overdue task remains visible and visually distinct without relying on color alone.
- Completing a task does not delete it.
- Editing or removing a deadline reconciles its derived alarm.

### R-008 — AI plan import

The owner can import one or more nested goals from a JSON document conforming to `schemas/my-tracker-ai-plan.schema.json`.

Acceptance criteria:

- The import accepts only the documented format and compatible schema version.
- The entire JSON document is parsed and validated before any domain write.
- A preview shows counts, hierarchy, deadlines, warnings, and the selected import mode.
- The owner explicitly confirms the import after preview.
- Invalid data displays actionable field paths and writes nothing.
- Duplicate `externalKey` values within one document are rejected.
- `create` mode always creates new local entities and local IDs.
- `merge` mode is deferred until a later milestone and must not be simulated with title matching.
- Imported strings are treated as text, never instructions or executable markup.
- The imported order matches array order in the document.

### R-009 — Backup export

The owner can export all app-owned data in a JSON document conforming to `schemas/my-tracker-backup.schema.json`.

Acceptance criteria:

- Export includes all goals, phases, tasks, checklist items, notes, reminders, settings, stable IDs, ordering, timestamps, and links.
- Export includes application version, schema version, export time, and time-zone metadata.
- Export does not include browser history, credentials, machine paths, or unrelated extension data.
- Export ordering is deterministic so equivalent datasets produce reviewable files apart from export metadata.

### R-010 — Backup restore

The owner can replace local app data with a compatible backup.

Acceptance criteria:

- The complete backup is validated before any write.
- The UI previews entity counts and warns that restore replaces current data.
- Restore requires explicit confirmation and recommends exporting the current state first.
- Restore is atomic from the user's perspective.
- Stable IDs and timestamps from the backup are preserved.
- After restore, derived alarms are fully reconciled from persisted reminder/task data.
- Incompatible future schema versions are rejected without data changes.

### R-011 — Settings

MVP settings cover only behavior needed by core workflows.

Acceptance criteria:

- Settings include time zone, reduced motion preference, task deadline notification default, backup export, plan import, and backup restore.
- Defaults are safe and local.
- No setting implies cloud behavior or account creation.

## Non-functional requirements

### NFR-001 — Local privacy

- Core functionality performs no network request.
- No telemetry, analytics, advertising, or crash upload is included.
- Imported and entered content remains on the local device unless the owner explicitly exports it.

### NFR-002 — Data integrity

- Every persisted entity has a stable ID and timestamps.
- Multi-entity writes use a transaction.
- Storage migrations are versioned, tested, and never silently discard unknown records.
- Import/restore failure leaves the prior dataset unchanged.

### NFR-003 — Performance

- The New Tab shell must remain usable with at least 25 goals, 100 phases, 2,000 tasks, 10,000 checklist items, and 1,000 notes/reminders in a seeded test dataset.
- The UI must not render every off-screen task card when it harms interaction latency.
- A performance budget must be measured on a production build before MVP sign-off; numerical timing thresholds are deferred until the first implementation baseline.

### NFR-004 — Accessibility

- All core actions are operable by keyboard.
- Focus is visible.
- Status is not represented by color alone.
- Text and controls meet WCAG 2.2 AA contrast targets.
- Reduced-motion preference is honored.

### NFR-005 — Security

- No dynamic code execution from user or imported content.
- Notes and descriptions render as text by default.
- File input has a documented size limit before release.
- Extension permissions stay limited to `alarms` and `notifications` unless a new requirement is approved. IndexedDB does not require the `storage` permission.

## Error and recovery policy

| Condition | Required behavior |
| --- | --- |
| Invalid local record | Quarantine/report it; do not erase the whole store. |
| Invalid import | Show validation paths; write nothing. |
| Restore failure | Roll back and retain the previous dataset. |
| Alarm missing | Recreate it from persisted scheduled data. |
| Orphan alarm | Clear it after comparing with persisted data. |
| Missed deadline | Mark overdue/fired and notify when Chrome next processes the event. |
| Storage quota/failure | Keep in-memory edit state, show a blocking save error, offer export when possible. |

## Open questions that do not block Milestone 1

- Exact production performance thresholds after a working baseline exists.
- Whether AI-plan `merge` should use an explicit source namespace plus external keys or a change-set protocol.
- Whether a later iCalendar adapter exports tasks as `VTODO` or only reminders/deadlines.
- Whether archived goals appear in default backup restore preview as a separate section.
