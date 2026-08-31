# M2 QA test plan

## Status

`Planned — not executed.` This plan is ready for execution after Design and Dev
complete the handoffs required by
[`docs/work-items/M2_CHECKLIST_PERSONAL_INBOX.md`](../work-items/M2_CHECKLIST_PERSONAL_INBOX.md).
M2 remains blocked from a QA Pass recommendation until every acceptance
criterion has independent evidence from the exact production build.

## Objective

Determine whether the owner can capture, link, edit, reorder, and explicitly
delete durable notes from New Tab, and create and independently check task
checklist items, without losing M1 data or changing task status implicitly.

Primary scope and acceptance source:

- `docs/work-items/M2_CHECKLIST_PERSONAL_INBOX.md`

Supporting contracts:

- `docs/PRD.md` R-001, R-002, R-005, R-006, and applicable NFRs
- `docs/ARCHITECTURE.md`
- `docs/DATA_CONTRACT.md`
- `docs/UX_SPEC.md`
- `DESIGN.md`
- `schemas/my-tracker-backup.schema.json`

## Locked scope boundary

- M2 includes note create, edit, optional link, named before/after reorder, and
  confirmed permanent deletion.
- M2 checklist behavior is create plus check/uncheck only. Checklist rename,
  reorder, and deletion are not M2 failures because they are explicitly
  deferred.
- M2 exposes no reminder creation, reminder records, date/time controls,
  overdue/fired state, visible `All`/`Notes` filters, or fake `Reminders` filter.
- M2 adds no background entrypoint, alarm or notification behavior, network
  access, host permission, or Chrome permission.
- Goal, phase, and task deletion remain out of scope, so M2 does not invent link
  cleanup or cascade behavior for a later target deletion.
- The public AI-plan and backup schema versions do not change in M2.

## Independence and evidence policy

- Dev test output is handoff input, not an automatic QA Pass.
- QA re-runs configured checks and independently exercises the production build.
- Static source inspection, component rendering on loopback, and
  `fake-indexeddb` do not replace required unpacked-Chrome evidence.
- Every final scenario records the exact build path, package version, source
  revision supplied by Dev, generated-manifest hash, New Tab bundle hash, and
  test-profile identity without recording personal browser data.
- A failed or blocked acceptance criterion prevents an M2 Pass recommendation.
- No database reset, extension-data deletion, profile deletion, or other
  destructive cleanup is performed without fresh target-specific approval.

## Disposable-profile precautions

Manual scenarios use a dedicated disposable Chrome profile containing no
personal browsing data, account session, extensions, or unrelated My Tracker
data.

1. Record the dedicated profile directory and confirm it is not the owner's
   normal Chrome profile before loading the extension.
2. Load only the exact production directory supplied by Dev.
3. Do not inspect, modify, disable, or remove extensions in another profile.
4. Seed only synthetic names and note bodies from this plan.
5. Preserve the profile through the full reopen, browser-restart, offline, and
   v1-to-v2 upgrade scenarios; do not clear its extension data between scenarios
   unless a scenario explicitly requires a second fresh disposable profile.
6. If the dedicated profile cannot be verified, mark affected Chrome scenarios
   `blocked`. Do not substitute the owner's personal profile without fresh,
   explicit, target-specific approval.

The real-upgrade scenario uses a second dedicated profile because it must first
run an identified M1/v1 production artifact and then the M2/v2 artifact against
the same extension-owned IndexedDB. Dev must provide reproducible artifact
identifiers and exact reload steps; QA must not guess from an unlabelled build.

## Evidence classes

| Code | Evidence class | Purpose |
| --- | --- | --- |
| `U` | Unit automation | Pure validation, link union, ordering, checklist independence, and use-case rules |
| `I` | IndexedDB integration automation | Real adapter behavior with disposable `fake-indexeddb`, v1 fixtures, reconnect, transactions, and rollback |
| `B` | Build/static inspection | Type-check, complete suite, production package, manifest, bundled-asset, and local-only boundaries |
| `C` | Real unpacked Chrome | User-visible interaction, real IndexedDB, focus, responsive behavior, reopen/restart, and offline evidence |
| `D` | Documentation/handoff | Reproducible build identity, profile setup, migration setup, and fault-injection instructions |

Current repository automation is Vitest in a Node environment with unit and
`fake-indexeddb` integration suites. No browser end-to-end or component-DOM
script is currently configured. QA reports that fact and does not invent a lint,
component, or E2E command.

## Required Dev handoff before execution

QA execution starts only after Dev provides:

- Stable source revision, package version, exact production output directory,
  and hashes for the generated manifest, New Tab bundle, and CSS bundle.
- Exact results for `pnpm test:unit`, `pnpm test:integration`,
  `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Generated manifest path and a statement of any new entrypoint, permission,
  host access, or dependency. M2 expects none of the first three.
- A v1 fixture that was created with the committed version-1 store layout, not
  by opening a version-2 adapter and calling it v1, plus its expected complete
  Goal/Phase/Task records.
- An identified M1/v1 unpacked production artifact and exact safe steps for the
  real-profile M1-to-M2 upgrade scenario.
- A page-local, one-shot load-delay/load-failure/write-failure QA seam for the
  production UI. The write seam must be reusable, by opening a fresh page, for
  note create, edit, reorder, delete, checklist create, and checklist toggle.
- An integration-only fault seam that fails after at least one write inside a
  multi-record note reorder or delete transaction so rollback is genuinely
  proven.
- Seed/setup instructions for duplicate Goal/Task titles, multiple notes, and a
  task with multiple checklist items.
- Any known unverified browser behavior, migration limitation, or expected
  failure.

If a handoff item is absent, QA may execute unaffected scenarios but records the
dependent results as `blocked`.

## Acceptance-criteria traceability

| AC | Requirement summary | Primary evidence | Scenarios | Required pass evidence |
| --- | --- | --- | --- | --- |
| 1 | Loading does not flash false-empty inbox or enable capture early | `C` | Q06 | Delayed-load recording shows loading first; capture remains unavailable until repositories are ready |
| 2 | Quick capture is first useful Home field; keyboard/button create trimmed unlinked note | `U`, `C` | Q02, Q07 | Domain defaults plus Control+Enter, Command/Meta+Enter, and Add note production paths |
| 3 | Invalid note lengths retain draft and write nothing | `U`, `I`, `C` | Q02, Q08 | Boundary assertions, unchanged store, inline associated error, retained draft |
| 4 | Unlinked capture works with no goals/tasks | `U`, `I`, `C` | Q02, Q07 | Fresh-profile note with neither link field and no hierarchy dependency |
| 5 | Link exactly one Goal/Task; edit/change/remove; duplicate labels distinguishable | `U`, `I`, `C` | Q02, Q05, Q09 | Transactional target validation and production link-picker/edit evidence |
| 6 | Inbox count/empty state; no visible fake filters/reminders; filter-ready read boundary | `U`, `C` | Q02, Q06, Q10 | Read-model assertion and production empty/populated screenshots/DOM evidence |
| 7 | Plain text, updated time, optional context, long wrapping without page overflow | `U`, `C` | Q02, Q08, Q10 | Literal unsafe-looking text, semantic time/context, narrow long-text evidence |
| 8 | Edit/reorder/confirmed delete by pointer/keyboard persists | `U`, `I`, `C` | Q02, Q05, Q11 | Deterministic before/after/delete snapshots and reopened production UI |
| 9 | No note auto-deletion from time, task status, or checklist state | `U`, `I`, `C` | Q02, Q12 | State-transition assertions plus retained production note after related actions/restart |
| 10 | Native task-title button opens detail; Escape safely closes and restores exact focus | `C` | Q13, Q20 | Pointer/Enter/Space paths and focus evidence on the originating title button |
| 11 | Wide side panel; narrow and 200% zoom remain fully operable | `C` | Q14 | Screenshots/recording at agreed wide/narrow viewports and 200% zoom |
| 12 | Empty checklist, labeled quick-add, Enter appends unchecked item and focuses stable item | `U`, `I`, `C` | Q02, Q03, Q13 | Default/order assertions and production empty-to-populated focus path |
| 13 | Invalid checklist titles retain input and write nothing | `U`, `I`, `C` | Q02, Q15 | 0/whitespace/241 boundaries, unchanged store, associated inline error |
| 14 | Toggle/reopen/restart persists state and derived progress | `U`, `I`, `C` | Q02, Q03, Q16, Q17 | Stored state/progress assertions and real browser-restart evidence |
| 15 | Items are not Kanban cards; checklist/task completion are independent | `U`, `I`, `C` | Q02, Q16 | Bidirectional independence assertions and production board/detail evidence |
| 16 | IndexedDB v2 stores contract fields and deterministic positions behind ports | `I`, `B` | Q03 | Store/index/record assertions through the production adapter, not UI storage access |
| 17 | v1-to-v2 upgrade preserves every M1 record and field | `I`, `C` | Q04, Q22 | Exact before/after fixture plus real dedicated-profile upgrade evidence |
| 18 | Reopen preserves notes, links/order, items/state/order | `I`, `C` | Q03, Q17 | New adapter connection and closed/reopened New Tab comparisons |
| 19 | All listed mutation failures preserve prior state/context and retry | `I`, `C` | Q05, Q18, Q19 | One case per mutation family, unchanged reopen snapshot, successful exactly-once retry |
| 20 | Multi-record normalization/delete commits all or none | `I` | Q05 | Failure after an IndexedDB write followed by reconnect equals pre-operation snapshot |
| 21 | Keyboard, visible focus, modal containment/cancel/restore, creation focus | `C` | Q07, Q09, Q11, Q13, Q20 | Keyboard-only recording with active-element/focus-return evidence |
| 22 | State/consequence not color-only; announcements are concise | `C` | Q16, Q18, Q20 | Visible text/native semantics and captured polite/assertive live-region output |
| 23 | No external request, permission, host access, or remote asset | `B`, `C` | Q01, Q21 | Generated manifest, static scan, Offline journey, preserved Network log |
| 24 | Production unpacked create/mutate/reopen journey passes in disposable profile | `B`, `C`, `D` | Q01, Q06-Q21 | Exact build loads as New Tab and the complete production journey passes |

## Automated and static scenarios

### Q01 — Configured checks, production package, and scope boundary

Preconditions:

- Dev identifies one stable source revision and build.
- Existing dependencies are installed; QA does not update packages.

Steps:

1. Run `pnpm test:unit`, `pnpm test:integration`, `pnpm typecheck`,
   `pnpm test`, and `pnpm build`.
2. Record command, exit status, duration, test counts, and complete failure
   summaries.
3. Resolve the generated Chrome MV3 directory and inspect the generated
   manifest, not only `wxt.config.ts`.
4. Verify the New Tab override points to an existing bundled page.
5. Verify `permissions` and `host_permissions` remain empty and there is no M2
   background entrypoint.
6. Search source and production output for remote fonts/assets, API URLs,
   telemetry/account clients, `fetch`, XHR, WebSocket, beacon, alarm,
   notification, reminder, and filter-control behavior. Investigate each
   finding rather than treating raw string matches as proof.
7. Confirm the public schema files and schema versions are unchanged by M2.

Expected:

- Configured commands exit zero.
- Production output is self-contained and loads `newtab.html` as the override.
- M2 adds no permission, host access, background/reminder surface, network
  dependency, or public-schema change.
- No unrelated build artifact or generated file is treated as source evidence.

### Q02 — Domain and application invariants

Automated assertions must cover:

- Note body trimming; exactly 10,000 characters accepted after trimming; 10,001,
  empty, and whitespace-only rejected.
- Enter/newline content preserves internal line breaks while only leading and
  trailing whitespace is trimmed.
- Note defaults: opaque ID, UTC `createdAt === updatedAt`, contiguous append
  position, and neither link field.
- Link union: none, existing Goal, or existing Task; task link stores only
  `linkedTaskId`; both fields, unknown link kind, and missing target reject with
  no write.
- Duplicate Goal/Task titles do not affect identity; link labels/read data carry
  enough parent context for presentation to distinguish them.
- Editing body/link changes only intended fields and `updatedAt`; removing a
  link does not mutate its former target.
- Note before/after reorder is sibling-only and normalizes positions; missing,
  self, and stale targets reject with no write.
- Note deletion removes exactly the selected note, never its target, and
  normalizes remaining positions.
- No clock advance, task-status move, checklist create, or checklist toggle
  deletes a note.
- Checklist title uses the exact existing 1-to-240 rule.
- Checklist default: opaque ID, correct `taskId`, unchecked, contiguous append
  position, and UTC timestamps.
- Toggle changes only `isCompleted` and item `updatedAt`; checking all items does
  not change task status/`completedAt`, and moving a task to or from Done does
  not alter any checklist record.
- Unknown task/item and mismatched item/task parent reject without a write.
- The M2 read model returns notes and task checklist data without adding a
  visible reminder/filter concept or coupling persistence to React.

Expected: deterministic assertions use fixed clocks/IDs and compare complete
before/after state for every rejected command.

### Q03 — IndexedDB v2 stores, queries, and reconnect persistence

Preconditions:

- Use `fake-indexeddb` with a unique disposable database name per test.
- Exercise `IndexedDbTrackerDatabase`, not only the in-memory adapter.

Steps:

1. Open a fresh database at version 2.
2. Verify `goals`, `phases`, `tasks`, `checklistItems`, and `notes` exist and the
   new stores support checklist-by-task/position and note-position lookup.
3. Create multiple goals/phases/tasks, unlinked/Goal-linked/Task-linked notes,
   and multiple checklist items across at least two tasks.
4. Edit and reorder notes; toggle checklist items.
5. Close the adapter and open a new adapter connection to the same database.
6. Compare stable IDs, timestamps, links, parents, bodies/titles, state, and
   deterministic positions with the committed pre-close snapshot.
7. Verify sibling positions are unique, contiguous, and scoped correctly.

Expected: the version-2 adapter persists complete contract-aligned records and
queries them only through repository interfaces.

### Q04 — Forward migration from an authentic v1 fixture

Preconditions:

- The fixture creates the exact committed v1 stores/indexes and records before
  any v2 code opens it.
- Fixture data contains multiple goals, phases, and tasks across all statuses,
  nontrivial positions, and a Done task with `completedAt`.

Steps:

1. Open the fixture as v1 and capture every store name, record, field, and order.
2. Close the v1 connection.
3. Open the same named database through the M2 adapter.
4. Assert the database version is 2 and the new stores/indexes exist.
5. Compare every pre-existing Goal/Phase/Task record byte-for-byte or through a
   field-complete deep equality check.
6. Assert the new stores are empty and writable.
7. Create a note and checklist item, close, reconnect, and verify both new and
   migrated data.

Expected: migration only adds missing v2 stores/indexes; it changes or removes
no v1 record. A fixture fabricated by v2 initialization is invalid evidence.

### Q05 — Transaction atomicity and post-write rollback

Steps:

1. Seed at least four notes in known order and record the full workspace.
2. Inject failure after at least one IndexedDB write during note reorder
   normalization; let the transaction abort, close, reconnect, and compare the
   complete dataset with the pre-operation snapshot.
3. Repeat for confirmed note deletion after the delete or one normalization
   write has been requested.
4. Inject create/edit/link/checklist-create/checklist-toggle failures before
   commit and assert no record or field changed.
5. Prove a normal retry commits the intended operation exactly once with no
   duplicate ID, skipped position, or stale link.

Expected: every failed operation leaves exact prior persisted state; successful
retry produces one normalized commit.

## Real unpacked Chrome scenarios

All scenarios below use the exact production build in the verified disposable
profile. Pointer checks and keyboard checks are recorded separately where both
are required.

### Q06 — Unpacked install, delayed loading, and empty Home

Preconditions:

- Fresh disposable profile with no My Tracker data.
- Deterministic first-load delay and one-shot load-failure QA URLs supplied by
  Dev.

Steps:

1. Load the production directory unpacked and open New Tab.
2. Record navigation through IndexedDB resolution with delayed loading enabled.
3. Confirm no false no-notes/no-goals content appears before loading completes
   and note capture is not enabled early.
4. Confirm Home order is quick capture, specific empty notes inbox with count
   zero, then Goals.
5. Confirm no visible inbox filter, Reminder affordance, date/time input, or
   fired/overdue copy appears.
6. Trigger the one-shot load failure, confirm the shell remains visible with a
   recoverable Retry, and retry into the unchanged real dataset.

Expected: My Tracker replaces New Tab; loading and failure states are honest,
nonblank, and recoverable; the empty M2 surface contains no fake M3 feature.

### Q07 — Multiline quick capture and unlinked keyboard paths

Steps:

1. With no goals or tasks, use the skip link and inspect the first useful Home
   focus target.
2. Enter `  First line`, press Enter, then enter `second line  `.
3. Confirm Enter added a line and did not submit.
4. Submit using Control+Enter and verify one displayed note whose stored body is
   `First line\nsecond line` and has no link.
5. Create a second unlinked note using Meta+Enter.
6. Create a third unlinked note using the visible `Add note` button.
7. Confirm each path appends exactly once and moves focus to the created note or
   an equivalent stable note control.

Expected: quick capture is first, local, multiline, keyboard-efficient, and
independent of Goal/Task existence or link-option loading.

### Q08 — Note validation boundaries and safe plain-text rendering

Steps:

1. Submit empty and whitespace-only bodies.
2. Submit 10,001 characters after trimming.
3. For each invalid case, verify an inline programmatically associated error,
   retained draft/focus, and no note after reopen.
4. Submit exactly 10,000 characters after trimming and verify acceptance.
5. Create/edit a note containing `<img src=x onerror=alert(1)>`,
   `<strong>literal</strong>`, `{{7*7}}`, Markdown-looking text, and multiple
   lines.
6. Inspect the rendered result and console.

Expected: invalid bodies never write; accepted content is visible literal text,
creates no user-authored element, executes nothing, and preserves intended
internal line breaks.

### Q09 — Optional link create/edit/remove and duplicate context

Preconditions:

- Two goals have the same title.
- Two tasks have the same title under different Goal/Phase parents.

Steps:

1. Open progressively disclosed link choices without blocking typing.
2. Verify duplicate Goal and Task labels include distinguishing parent context.
3. Create one Goal-linked note and one Task-linked note.
4. Confirm the Task-linked note displays task context and does not also store a
   Goal link.
5. Edit a note from Goal link to Task link, then remove the link entirely.
6. Cancel one edit with Escape and verify persisted body/link remain unchanged
   and focus returns to the exact edit trigger.
7. Through the documented test seam or automated companion evidence, attempt a
   missing target and mutually present link IDs; verify no write.

Expected: links are optional, exclusive, identity-based, distinguishable, and
transactionally validated. Editing/removing a link never mutates the target.

### Q10 — Inbox count, timestamps, context, and long-text layout

Steps:

1. Observe the no-notes message and zero count in a fresh state.
2. Create unlinked and linked notes and verify the count after each operation.
3. Edit one note and verify its visible updated time changes with semantic time
   data while untouched notes retain their time.
4. Confirm optional context is written text, not color-only.
5. At wide and narrow viewports, create a long unbroken token and a multiline
   body; verify text wraps or breaks safely without page-level horizontal
   scrolling.
6. Confirm no redundant `All`/`Notes` control or fake `Reminders` control is
   present in empty or populated states.

Expected: the inbox communicates count, content, update time, and context
without implying unavailable kinds or breaking the New Tab layout.

### Q11 — Note edit, named reorder, confirmation, and deletion persistence

Preconditions: notes `A`, `B`, `C`, `D` appear in that order.

Steps:

1. Edit `B` by pointer, then edit it by keyboard; verify draft, Save, Cancel,
   failure, and focus-return behavior where applicable.
2. Use named pointer action to move `D` before `C`; verify `A, B, D, C`.
3. Use the keyboard to move `A` after `B`; verify `B, A, D, C`.
4. Open Delete for `A`. Verify the focused confirmation names the note and
   exposes visible consequence text.
5. Press Escape; verify no write and focus returns to `A`'s delete trigger.
6. Reopen confirmation and confirm deletion. Verify `B, D, C` with contiguous
   positions. Focus moves to the next note's action trigger, otherwise the
   previous note's trigger, otherwise the Quick note field.
7. Close and reopen New Tab and compare body, link, order, and deletion result.

Expected: pointer and keyboard operations produce identical deterministic
state; deletion is never icon-only, implicit, or undo-based.

### Q12 — No automatic note deletion

Steps:

1. Record a note linked to a task with both unchecked and checked checklist
   items.
2. Check every item, move the task to Done, move it back to In Progress, and
   restart the dedicated profile. Unit coverage separately advances a fake
   clock to prove elapsed time is not a deletion trigger.
3. Reopen New Tab after each change.

Expected: the note remains with the same ID, body, link, and position until the
owner explicitly deletes it.

### Q13 — Task-detail opening, empty checklist, create, and focus

Steps:

1. Verify each task title is a native button named `Open task details for
   <title>` and rename/task-action controls remain separate.
2. Open the same task detail separately by pointer click, Enter, and Space.
3. With no checklist items, verify specific empty guidance and a labeled
   quick-add field receives focus; progress reads `0 / 0 complete`.
4. Submit `  First checklist step  ` with Enter.
5. Confirm it appears once, unchecked, at position one, progress reads `0 / 1`,
   and focus moves to its checkbox or an equivalent stable control.
6. Press Escape while no save is pending and verify detail closes and focus
   returns to the exact originating task-title button.
7. Reopen the now-populated detail and verify its heading receives initial focus
   before the checklist controls.

Expected: task detail is explicit and accessible, and checklist creation
preserves the existing rename/action paths.

### Q14 — Wide, narrow, and 200% task-detail layout

Steps:

1. At `>=1200px`, verify the modal is a right-aligned `480px` side sheet.
2. At `720–1199px`, verify it is a centered dialog no wider than `640px`.
3. Below `720px`, verify it is a dynamic-viewport-contained full-screen
   surface.
4. Test long task/checklist titles, enough items to require its own scrolling,
   and 200% browser zoom.
5. Tab through every detail action and verify labels, checkboxes, errors, and
   close remain visible and unobscured by the header/footer, without page-level
   overflow or clipped controls.

Expected: layout form changes at the documented breakpoint without changing
semantics, losing focus, or hiding any M2 action.

### Q15 — Checklist validation and safe text

Steps:

1. Submit empty and whitespace-only checklist titles.
2. Submit 241 characters.
3. Verify each invalid value remains in the field with associated inline error
   and no new item after reopen.
4. Submit exactly 240 characters and verify acceptance.
5. Create an item containing HTML-, Markdown-, expression-, and
   instruction-looking text.

Expected: the existing title boundary is enforced, invalid input never writes,
and all accepted title content renders only as text.

### Q16 — Checklist toggle, progress, and Kanban independence

Preconditions: one Todo task has three unchecked checklist items.

Steps:

1. Check one item and verify native checkbox state plus progress `1 / 3`.
2. Uncheck it and verify `0 / 3`.
3. Check all items and verify `3 / 3` while the task remains Todo with no
   `completedAt`.
4. Move the task to Done using the existing task-action path and verify item
   states/titles/order do not change.
5. Reopen the task to In Progress and verify checklist state still does not
   change.
6. Inspect the board and confirm the task card shows written checklist progress
   when items exist, but no checklist item appears as an independent Kanban
   card.
7. Capture visible status/progress text and live-region behavior; verify neither
   relies on color or repeats announcements unnecessarily.

Expected: checklist and Kanban completion are independent in both directions.

### Q17 — Close/reopen and browser-restart persistence

Preconditions:

- Dataset contains at least four notes with all link variants and non-default
  order.
- At least two tasks contain multiple checklist items with mixed checked states.

Steps:

1. Record complete note and checklist state in the production UI.
2. Close the New Tab page and open a new one in the same profile.
3. Compare note bodies, links, order, count, item titles, parents, order, states,
   and progress.
4. Close every Chrome window for the dedicated profile using the documented
   non-destructive procedure.
5. Reopen that same dedicated profile and New Tab, then repeat the comparison.
6. Confirm M1 Goal/Phase/Task hierarchy, status, and order also remain intact.

Expected: real extension IndexedDB survives page close and browser restart with
no selected-view persistence requirement unless Design explicitly adds one.

### Q18 — One-shot save failures and exactly-once retry

Preconditions:

- Dev documents a production-build page-local seam that rejects the next write
  before commit and is exhausted after one failure.
- Record a store/UI snapshot before every case.

Run separate cases for:

1. Note create.
2. Note body/link edit.
3. Note reorder.
4. Confirmed note delete.
5. Checklist create.
6. Checklist check and uncheck.

For each case:

1. Trigger the operation.
2. Verify `Changes are not saved`, contextual error, Retry, stable focus, and
   retained draft/action context as applicable.
3. Verify the UI does not falsely show persisted placement, deletion, checkbox,
   progress, or link state.
4. Without closing a failed create/edit draft, open a second normal New Tab or
   use the documented safe read path and confirm the previous persisted dataset
   is unchanged.
5. Retry in-page after the one-shot failure is exhausted.
6. Confirm the intended change commits once, error state clears, and reopen
   contains no duplicate or partial result.

Expected: every M2 mutation has an honest recoverable failure path.

### Q19 — Multi-record UI failure and persisted rollback companion

Steps:

1. Use the one-shot production seam to fail note reorder and note delete; verify
   the item/order remains visibly unchanged and Retry succeeds.
2. Pair each UI record with the Q05 post-write integration result for the same
   operation.
3. Reopen the production New Tab after failure and after retry.

Expected: Chrome evidence proves recovery UX; Q05 proves that a failure after a
write request still commits all or none. Neither evidence class substitutes for
the other.

### Q20 — Keyboard, focus containment, cancellation, and announcements

Complete the full M2 journey without a mouse:

1. Enter Home through the skip link and reach quick capture first.
2. Create, edit, link/unlink, reorder, cancel deletion, and confirm deletion.
3. Open task detail, create an item, toggle it twice, and close detail.
4. In every modal/dialog, verify focus cannot escape to background controls.
5. Verify Escape cancels only when no save is pending and returns focus to the
   exact stable trigger.
6. Verify a non-empty unsaved draft requires explicit discard confirmation and
   is never silently lost.
7. Verify successful creation focuses the created note/item or an equivalent
   stable control.
8. Verify focus rings are visible throughout and controls meet the documented
   hit-area behavior.
9. Capture polite success and assertive data-loss-risk announcements; verify
   checkbox state, progress, link context, failure, and deletion consequence all
   have non-color text/native semantics and no repeated chatter.

Expected: the complete M2 journey is keyboard-operable with deterministic focus
and understandable status.

### Q21 — Offline, permissions, and local bundled assets

Preconditions:

- Production build installed in the disposable profile.
- DevTools Network log cleared with Preserve log enabled.

Steps:

1. Inspect the installed extension permission panel and generated manifest.
2. Set DevTools Network throttling to Offline.
3. Reload New Tab and execute unlinked/linked note create, edit, reorder,
   confirmed delete, task-detail open, checklist create/toggle, and reopen.
4. Inspect preserved requests for HTTP(S), WebSocket, remote fonts/images/icons,
   analytics, telemetry, accounts, APIs, or other external access.
5. Confirm no alarm, notification, storage, tabs, history, identity, scripting,
   or host permission was added for M2.
6. Restore Network throttling after evidence is captured.

Expected: the journey succeeds offline with only local `chrome-extension://`
resources and no expanded permission surface.

### Q22 — Real-profile M1/v1 to M2/v2 upgrade

Preconditions:

- A second verified disposable profile.
- Identified M1/v1 and M2/v2 production artifacts with hashes and safe reload
  steps from Dev.

Steps:

1. Load the identified M1 artifact and create multiple Goals/Phases/Tasks,
   including all statuses, reordered siblings, and a Done task.
2. Record full visible M1 hierarchy, status, order, titles, and completion state
   where observable.
3. Close M1 New Tab pages as instructed so no stale connection is intentionally
   left blocking the upgrade.
4. Update/reload the same unpacked extension installation to the identified M2
   artifact without clearing extension data.
5. Open New Tab and verify every M1 record and visible state remains unchanged.
6. Create notes and checklist items, close/reopen, restart the dedicated profile,
   and verify both migrated and new M2 data.
7. Record any upgrade-blocked/error state. Do not clear data to make a failure
   disappear.

Expected: the production upgrade preserves M1 state and enables durable M2
stores without manual reset, migration error, or permission prompt.

## Result recording

Use this format for every executed scenario:

```text
Scenario:
Acceptance criteria:
Build/version:
Artifact hashes:
Profile:
Preconditions:
Steps:
Expected:
Observed:
Evidence:
Result: pass | fail | blocked
Risk/notes:
Defect/requirement link:
```

Result meanings:

- `pass`: the expected result was directly observed against the identified
  build with the required evidence class.
- `fail`: execution completed and product behavior contradicted the locked
  requirement. Record a reproducible defect and exact criterion.
- `blocked`: the required environment, handoff, artifact, seam, permission, or
  observable evidence was unavailable. Blocked is not Pass and is not proof of a
  product defect.

Do not convert a blocked real-Chrome criterion to Pass using source inspection,
fake IndexedDB, or a loopback-served page.

## Acceptance result ledger

Fill this table during execution; do not mark a criterion Pass from Dev's claim
alone.

| AC | Result | Scenario evidence | Defect/risk |
| --- | --- | --- | --- |
| 1 | Not run | Q06 | |
| 2 | Not run | Q02, Q07 | |
| 3 | Not run | Q02, Q08 | |
| 4 | Not run | Q02, Q07 | |
| 5 | Not run | Q02, Q05, Q09 | |
| 6 | Not run | Q02, Q06, Q10 | |
| 7 | Not run | Q02, Q08, Q10 | |
| 8 | Not run | Q02, Q05, Q11 | |
| 9 | Not run | Q02, Q12 | |
| 10 | Not run | Q13, Q20 | |
| 11 | Not run | Q14 | |
| 12 | Not run | Q02, Q03, Q13 | |
| 13 | Not run | Q02, Q15 | |
| 14 | Not run | Q02, Q03, Q16, Q17 | |
| 15 | Not run | Q02, Q16 | |
| 16 | Not run | Q03 | |
| 17 | Not run | Q04, Q22 | |
| 18 | Not run | Q03, Q17 | |
| 19 | Not run | Q05, Q18, Q19 | |
| 20 | Not run | Q05, Q19 | |
| 21 | Not run | Q07, Q09, Q11, Q13, Q20 | |
| 22 | Not run | Q16, Q18, Q20 | |
| 23 | Not run | Q01, Q21 | |
| 24 | Not run | Q01, Q06-Q21 | |

## Release recommendation rule

Recommend `Pass` only when:

- all 24 acceptance criteria are Pass;
- the exact production build passes the real unpacked create -> mutate ->
  close/reopen and browser-restart journeys;
- automated v1-to-v2 migration and post-write rollback evidence passes;
- the real dedicated-profile M1-to-M2 upgrade passes;
- no unresolved data-loss, partial-write, unsafe-rendering, keyboard-blocking, or
  undocumented permission/network defect remains; and
- final documentation, schema, manifest, and implemented behavior are
  consistent.

Recommend `Fail` for a reproducible requirement violation. Recommend `Blocked`
when required evidence cannot be obtained. A partial result such as `23 Pass, 0
Fail, 1 Blocked` is still not an M2 Pass.
