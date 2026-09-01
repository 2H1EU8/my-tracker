# M2 checklist and personal inbox

## Status

Implementation complete in the working tree; automated verification passes.
Real unpacked-Chrome QA remains pending, so this work item is not yet accepted.

## Implementation handoff — 2026-08-31

- Delivered note capture, edit, optional linking, named reordering, and confirmed
  deletion, plus task-detail checklist create and check/uncheck behavior.
- Added IndexedDB v2 checklist/note persistence and recovery that permits retrying
  a blocked v1-to-v2 upgrade through the same database adapter.
- Preserved the public schemas, extension permissions, local-only boundary, and
  independent task/checklist status semantics.
- On 2026-09-01, independent QA passed `pnpm typecheck`, `pnpm test:unit`
  (18 tests), `pnpm test:integration` (11 tests), `pnpm test` (29 tests),
  `pnpm build`, and `git diff --check`. Q01–Q015 pass; Q016–Q22 await
  user-executed Chrome evidence because browser control policy cannot interact
  with `chrome-extension://` pages.
- QA must execute the production build from `.output/chrome-mv3` against the
  scenarios in `docs/qa/M2_TEST_PLAN.md`, including close/reopen persistence,
  keyboard flows, IndexedDB upgrade, error recovery, and offline/network checks.
- On 2026-09-01, the repository gained an isolated Playwright production-
  extension regression runner. Its tagged M2 journey now covers note/checklist
  state, checklist/Kanban independence, and New Tab reopen persistence. The
  remaining real Chrome restart, Offline, identified-artifact upgrade, and
  visual/manual evidence stay required by the test plan.

## User outcome

The owner can capture a durable note immediately from New Tab, optionally attach
it to one goal or task, and break a task into independently completable checklist
items without changing the task's Kanban status.

## Why now

M1 proved the durable `Goal -> Phase -> Task` path. M2 completes the documented
four-level hierarchy and adds the low-friction personal inbox promised by R-002
before reminder delivery introduces background and permission concerns in M3.

## Locked decisions

- M2 remains local-only and adds no account, network request, telemetry, runtime
  AI, host permission, alarm, notification, import, export, or restore behavior.
- The public AI-plan and backup schemas already define checklist items and notes;
  their formats and schema versions do not change in M2.
- The internal IndexedDB database advances from version 1 to version 2 with
  forward-created `checklistItems` and `notes` stores. Existing goals, phases,
  and tasks must survive the upgrade unchanged.
- A note link is optional and is exactly one of no link, one goal, or one task.
  A task link stores only `linkedTaskId`; it does not duplicate the owning goal
  as `linkedGoalId`.
- New notes and checklist items append after their current siblings. Explicit
  named controls, not drag-and-drop, provide M2 note reordering.
- Completing a checklist item never changes its task status or `completedAt`.
  Moving a task to Done never changes its checklist items.
- Reminder creation, persisted reminder records, alarm delivery, fired-state UI,
  and visible mixed-kind filters ship together in M3. M2 keeps the inbox read
  model filter-ready but shows no redundant `All`/`Notes` control and no fake
  Reminders control while notes are the only available inbox kind.
- Individual note deletion is an explicit text-labeled action in a focused
  confirmation dialog. Notes are never deleted because of age or any completion
  state.

## In scope

- A Home quick-capture composer before the Goals section.
- Create, edit, reorder, and manually delete notes.
- Optional note linking to an existing goal or existing task, including changing
  or removing a link while editing.
- A notes inbox with a count, empty states, stable ordering, timestamps, optional
  link context, plain-text rendering, and a structure ready for M3 item kinds.
- Task detail opened from a task card, implemented as a side panel on wide
  viewports and a viewport-contained dialog/page on narrow viewports.
- Create checklist items from task detail, check and uncheck them, show derived
  completed/total progress, and persist order/state.
- Loading, invalid input, save failure, retry, deletion confirmation, empty,
  and reopen/restart states.
- Domain rules, repository ports, application use cases, IndexedDB v2 migration,
  in-memory test adapter, UI, focused tests, production build, and unpacked
  Chrome acceptance evidence.

## Out of scope

- Reminder creation, date/time input, alarms, notifications, overdue/fired
  behavior, or any visible inbox filter control.
- Task deadlines, task descriptions, or priority editing.
- Checklist rename, reorder, or deletion. Items append in M2; those lifecycle
  operations require a later explicit scope decision.
- Note-to-task conversion, rich note view modals, Markdown rendering (deferred to M7), search, archive, tags, bulk
  deletion, or automatic cleanup.
- Goal/phase/task deletion, goal/phase reordering, drag-and-drop polish, import,
  export, restore, settings, and M6 visual hardening.
- Any public interchange schema or Chrome permission change.

## Preconditions and handoff

- Objective source: this work item, `docs/ROADMAP.md` M2, PRD R-002/R-005/R-006,
  and the existing public schemas.
- Locked product boundaries are listed above. A requested change to deletion,
  link semantics, checklist/task status coupling, public schemas, or permissions
  returns to PM before implementation continues.
- Design updates `DESIGN.md` and `docs/UX_SPEC.md` with the exact quick capture,
  inbox, note action, task-detail, checklist, responsive, keyboard, focus, and
  error states before Dev treats presentation details as stable.
- Dev owns source, adapters, migrations, and automated tests after this item is
  Ready. QA owns `docs/qa/M2_TEST_PLAN.md` and independent evidence.

## Functional rules

### Note body and capture

- Trim leading and trailing whitespace before validation and persistence.
- A note body must contain at least one non-whitespace character and may contain
  at most 10,000 characters after trimming, matching the backup schema `text`
  definition.
- The quick-capture field is the first useful Home focus target. It supports
  multiple lines; `Control+Enter` and `Meta+Enter` submit, while Enter alone adds
  a line. A visible `Add note` button provides the same behavior.
- Capture defaults to unlinked. Choosing or loading link options must never block
  typing or creation of an unlinked note.
- A created note receives a stable opaque ID, UTC timestamps, and the next
  contiguous inbox position.

### Optional links

- Link choices are `none`, an existing goal, or an existing task.
- Link labels include enough parent context to distinguish duplicate titles.
- Creation or edit validates the chosen target in the same transaction as the
  note write. Missing targets, mutually present goal/task IDs, or an unknown link
  kind reject the operation and write nothing.
- Removing a link changes only link fields and `updatedAt`; it does not delete or
  rename the target.
- M2 does not define cascade behavior for later goal/task deletion because those
  deletion flows remain out of scope.

### Note edit, order, and deletion

- Editing can change the body and optional link. Failed persistence keeps the
  draft and last persisted note visible until retry succeeds or the user cancels.
- Reordering moves one note immediately before or after a current sibling, then
  normalizes all inbox positions to unique contiguous non-negative integers in
  one transaction.
- Invalid or missing reorder targets write nothing.
- Deletion requires a focused confirmation naming the note. On confirmation,
  delete the note and normalize remaining positions in one transaction.
- Canceling or pressing Escape closes the confirmation without a write and
  returns focus to that note's action trigger. M2 uses confirmation rather than
  an undo queue; undo remains outside this slice.
- A failed delete keeps the note and current order unchanged and exposes Retry.

### Checklist

- A task-detail view belongs to one existing task and shows its title, current
  status text, derived `completed / total` checklist progress, and ordered items.
- The task title is a native button named `Open task details for <title>`.
  Pointer click, Enter, or Space opens detail; Escape closes when no save is in
  progress and returns focus to that exact task trigger.
- Checklist titles use the existing trimmed 1–240 character title rule.
- A new item appends after current items and starts with `isCompleted: false`.
- Checking or unchecking updates only that item and its `updatedAt`; identity,
  task parent, title, position, and task status remain unchanged.
- An unknown task or checklist item, or an item/task parent mismatch, rejects the
  operation without a write.
- User text renders as text, never HTML, Markdown with unsafe HTML, code, or
  instructions.

## Acceptance criteria

### Home and inbox

1. Loading local data does not flash a false empty inbox or enable capture before
   its repository dependencies are ready.
2. Quick capture is the first useful Home field and creates a trimmed unlinked
   note with `Control+Enter`, `Meta+Enter`, or the visible Add note action.
3. Empty, whitespace-only, and over-10,000-character bodies show an inline error,
   retain the draft, and write no note.
4. Creating an unlinked note remains possible when there are no goals or tasks.
5. The owner can optionally link a note to exactly one existing goal or task,
   can later change or remove that link, and duplicate titles remain
   distinguishable by parent context.
6. The notes inbox exposes a count and a specific no-notes message. It exposes no
   redundant or nonfunctional filter control and does not imply reminder support;
   its read/view boundary can add real item kinds in M3 without changing notes.
7. Notes show plain-text body, updated time, and optional link context; long text
   wraps without creating page-level horizontal scrolling.
8. The owner can edit, move a note before/after an adjacent note, and explicitly
   confirm deletion using pointer or keyboard. The same order and deletion result
   remain after reopen.
9. A note is never auto-deleted because of time, task status, or checklist state.

### Task checklist

10. A native task-title button opens task detail by pointer, Enter, or Space
    without replacing the existing rename or task-action controls. Escape closes
    when safe and restores focus to that exact title button.
11. Task detail is a side panel on wide layouts and remains fully operable inside
    the viewport on narrow layouts and at 200% zoom.
12. With no items, task detail explains the empty checklist and focuses a labeled
    quick-add field. Valid Enter submission appends an unchecked item and focuses
    the created checkbox or an equivalent stable item control.
13. Empty, whitespace-only, and over-240-character checklist titles show inline
    error, retain input, and write nothing.
14. Checking and unchecking an item persists after New Tab reopen and browser
    restart while progress text updates from the stored item states.
15. Checklist items never render as Kanban cards. Completing all items does not
    move the task, and moving the task to Done does not check any item.

### Persistence, migration, and recovery

16. IndexedDB v2 stores notes and checklist items with stable IDs, timestamps,
    parent/link fields, and deterministic positions behind repository interfaces.
17. Opening an existing v1 database upgrades it to v2 without changing or losing
    any goal, phase, task, status, completed timestamp, or position.
18. Closing/reopening New Tab preserves notes, optional links, note order,
    checklist items, checklist state, and checklist order.
19. Simulated create, edit, reorder, delete, checklist-create, or checklist-toggle
    failure leaves the previous persisted dataset consistent, keeps the relevant
    draft/context, and exposes a retry path.
20. Every multi-record normalization or delete commits all writes or none.

### Accessibility and scope

21. All M2 actions are keyboard operable with visible focus; dialogs trap focus,
    Escape cancels when safe, closing restores a stable trigger, and successful
    creation focuses the created note/item or an equivalent stable control.
22. Checkbox state, progress, link context, save failure, and deletion consequence
    do not rely on color alone and are announced without repetitive live-region
    chatter.
23. The production journey performs no external request, adds no Chrome
    permission or host access, and loads only locally bundled assets.
24. A production build can be loaded unpacked and the note/checklist create ->
    mutate -> close/reopen journey passes in a disposable Chrome profile.

## Data and schema impact

- Add local `ChecklistItem` and `Note` domain types aligned with
  `docs/DATA_CONTRACT.md` and `schemas/my-tracker-backup.schema.json`.
- Add `checklistItems` and `notes` repository ports and IndexedDB stores. Required
  lookup behavior is checklist items by `taskId` plus position and notes by
  position. Exact index names remain infrastructure details.
- Advance the internal database version to 2. The forward migration only creates
  missing stores/indexes and must be covered by a v1 fixture plus reopen test.
- Include checklist data and notes in the application read model without making
  React or storage implementations part of the domain.
- No public schema, example, format version, Chrome manifest permission, or
  deployment configuration changes are required.

## UX and accessibility impact

- Home order becomes quick capture, inbox, then Goals. Quick capture is the first
  useful focus target.
- Create note remains visible and low-friction; link selection is progressively
  disclosed and optional.
- Secondary note actions use the existing Phosphor/icon plus focused-dialog
  language. Destructive confirmation retains visible text.
- Task detail follows the side-panel/full-screen responsive contract already in
  `docs/UX_SPEC.md`; checklist input and checkbox controls use native semantics.
- All icon-only controls retain contextual names, tooltips, 44 px targets, and
  visible focus. When mixed-kind filters ship in M3, they must use native pressed
  or selected semantics; M2 renders no visible filter control.

## Verification evidence

### Dev

- Unit: note-body limits, link union, checklist defaults/toggle independence,
  normalization, invalid parent/target rejection, and no-write failures.
- Integration: v1→v2 migration, reopen persistence, link integrity, note reorder
  and delete atomicity, checklist persistence, and rollback after a partial
  multi-record attempt.
- Static: configured type-check, complete test suite, production build, manifest
  permission inspection, and final diff review.

### Design

- Review Home and task-detail empty, populated, invalid, saving, saved, failed,
  retry, delete-confirmation, narrow, 200% zoom, keyboard, and reduced-motion
  states against `DESIGN.md` and `docs/UX_SPEC.md`.

### QA

- Execute `docs/qa/M2_TEST_PLAN.md` against the production unpacked build in a
  disposable Chrome profile.
- Record scenario, build/version, preconditions, steps, expected, observed,
  evidence, result, and risk for every M2 acceptance criterion.
- Recommend Pass only after real IndexedDB reopen/restart, keyboard-only paths,
  failure injection, and Offline network evidence pass with no data-loss defect.

## Dependencies and open questions

- No owner decision blocks the documented M2 slice.
- Checklist edit/reorder/delete and future goal/task deletion link behavior are
  intentionally deferred; they must return to PM rather than being inferred by
  Dev or Design.
- Real browser restart evidence requires a disposable Chrome profile. Automated
  IndexedDB tests do not replace that acceptance evidence.
