# UX specification

## Experience statement

My Tracker turns New Tab into a quiet personal work surface. It should feel
immediate, private, and stable: dark flat chrome, readable text, clear project
structure, and a restrained pixel-pin motif that makes goals recognizable.

Minimalism here means fewer persistent decisions, progressive disclosure, and
one clear action per context—not hidden consequences. Current context,
timestamps, task status, save state, errors, and destructive consequences remain
visible when relevant. Resting implementation labels and expanded forms do not.

The canonical visual tokens and component anatomy live in [`DESIGN.md`](../DESIGN.md).
This document defines flows, interaction behavior, responsive rules, and state
expectations.

## Product-level information architecture

```text
New Tab / Home
  Quick note capture (M2)
    Optional Goal or Task link disclosure
  Notes inbox (M2; filter-ready, no visible filters)
  Goal pixel-pin grid
  Settings / Import / Backup (M4-M5)

Goal detail
  Back to goals / goal actions
  Ordered phase rail
  Todo | In Progress | Done board
  Task detail (M2)
    Current task title and status
    Checklist progress
    Checklist quick-add and native checkboxes
  Later task detail
    Description / priority / deadline
    Optional linked notes/reminders
```

## M1 functional boundary

M1 proves one durable journey:

```text
Open New Tab
  -> create Goal
  -> open Goal
  -> add Phase
  -> select Phase
  -> add Task
  -> move/reorder Task
  -> close and reopen
  -> see the same hierarchy, status, and order
```

M1 includes modal title-only create and rename for goals, phases, and tasks;
three fixed status columns; a compact pointer- and keyboard-operable task-action
modal; local loading/save/error states; and persistence after reopen.

M1 intentionally defers notes, reminders, checklist, deadlines, task detail,
archive/delete, goal/phase reordering UI, import/export/restore, drag-and-drop,
and final visual polish. Deferred affordances must not appear enabled or be
represented with fake data.

## M2 functional boundary

M2 proves two durable journeys while preserving every M1 interaction:

```text
Open New Tab
  -> capture an optionally linked note
  -> edit / move / explicitly delete a note
  -> close and reopen
  -> see the same note data and order

Open a task
  -> add checklist items
  -> check and uncheck an item
  -> close and reopen
  -> see the same checklist order and state without task-status coupling
```

M2 includes multiline note capture, progressively disclosed optional Goal/Task
links, an ordered notes Inbox, note edit/adjacent reorder/confirmed delete, a
native task-title detail trigger, responsive modal task detail, checklist append
and native checkbox toggle, and their loading/error/retry/focus states.

M2 intentionally excludes reminders, visible Inbox filters, deadlines,
descriptions, priority editing, checklist rename/reorder/delete, Markdown/HTML,
search, conversion, archive/bulk actions, and all later import/backup work. The
Inbox read model may accept more item kinds in M3, but M2 must not show empty
filter chrome, fake reminder rows, or `Coming soon` controls.

## Global shell

### Useful-first rendering

- Render the dark canvas and stable content frame immediately.
- While IndexedDB is loading, show in-place skeletons and the label `Loading
  local data`; do not flash a false empty state.
- A failing widget or query must not create a blank page. Keep the shell and a
  recoverable error action visible.
- No remote font, image, account, network, or telemetry request may be required
  for the core New Tab experience.

### Page-level order

1. Skip link.
2. Compact `My Tracker` plus search-placeholder header.
3. On Home: Quick note, Inbox, then Goals.
4. In Goal detail: current heading/action, phase rail, then active board.
5. One polite live region shared by routine result messages.

Resting labels such as `Local only`, `Local New Tab`, and `Stored only in this
Chrome profile` are omitted. The shell may briefly display `Saving`, `Saved`, or
`Changes are not saved` while relevant. It must never say `Synced` or imply a
server.

## Home

### M1 empty state

- The Plus icon beside `Goals` is the first task-specific focus target.
- It opens a modal with a visible title-input label.
- Enter submits; whitespace-only or over-240-character input shows an inline
  error and performs no write.
- The empty state says what to do next and does not use a decorative illustration
  as the only explanation.

### M1 populated state

- Goals appear in persisted order as original code-native pixel-pin notes.
- Each card shows the goal title and last updated time.
- Double-click opens a card. Enter or Space on the focused card is the keyboard
  equivalent, and the accessible name contains the title and instruction.
- Note color is decorative and stable; it does not encode goal status.
- Opening a goal preserves/restores Home scroll position when the user returns
  during the same page session.
- PencilSimple appears on card hover/focus and opens the rename modal. Rename
  exposes saving, saved, failed, retry, and cancel behavior without discarding
  the draft.

### M2 Quick note

- Quick note is first in Home visual and DOM order and its labeled textarea is
  the first useful focus target. It supports multiple lines; Control+Enter and
  Meta+Enter (Command+Enter) submit, Enter inserts a line, and visible
  `Add note` provides the same commit action.
- Trim before validation. Empty/whitespace-only or over-10,000-character input
  shows an inline error, retains the draft, and performs no write.
- Capture defaults to no link. `LinkSimple` plus visible `Add link` text reveals
  labeled `No link`, `Goal`, and `Task` choices. Goal selection identifies the
  goal; Task selection shows Goal / Phase / Task context but persists only the
  task link. Duplicate names therefore remain distinguishable.
- Optional target loading never blocks the textarea or unlinked Add action. If
  targets are absent or unavailable, say that the note can still be added
  without a link.
- During save, keep the draft stable, prevent duplicate submission, show
  `Adding…`, and do not claim success before commit. Success clears capture,
  appends the note, focuses the created note container, and politely announces
  `Note added`. Failure preserves body/link choice and offers Retry locally.

### M2 notes Inbox

- Inbox follows Quick note and precedes Goals in both visual and DOM order. Its
  heading shows the full `Inbox` label and a tabular note count.
- M2 has only notes, so it shows no `All`, `Notes`, `Reminders`, filter icon,
  disabled reminder mode, fired/overdue state, or placeholder item. The list
  structure is filter-ready for M3 without presenting unfinished behavior.
- Empty copy is `No notes yet. Add one with Quick note.` and adds no duplicate
  create button.
- Each ordered note shows the complete plain-text body with preserved line
  breaks, semantic updated time, and optional non-interactive context such as
  `Goal: Ship M2` or `Task: Ship M2 / Foundation / Add storage`. Long text and
  tokens wrap without page-level horizontal scrolling.
- PencilSimple opens edit with a labeled textarea and the same optional-link
  controls. Control+Enter, Meta+Enter (Command+Enter), or visible `Save changes`
  commits; Escape cancels when idle. Failed save keeps the draft and last
  persisted card visible until Retry succeeds or Cancel closes.
- DotsThree opens note actions. Named `Move before` and `Move after` operate on
  adjacent notes only; unavailable actions remain disabled with `Already first`
  or `Already last`. Success returns focus to the moved note action trigger and
  announces its position. Failure leaves stored order unchanged and offers
  Retry.
- Visible `Delete note` opens a focused confirmation naming the first non-empty
  plain-text line, truncated to 80 characters with an ellipsis, and states that
  deletion cannot be undone. Cancel/Escape writes nothing and returns focus to
  the same DotsThree trigger. Failed delete keeps note/order unchanged and
  exposes Retry. Successful delete focuses the next note action, otherwise the
  previous, otherwise Quick note.
- New notes append; none auto-delete because of age, task status, checklist
  state, or future reminder filtering.

### Later Home additions

- M3 adds reminder mode, scheduled/fired/overdue item states, and real mixed-kind
  Inbox filters together; fired reminders stay visible until manual deletion.
- Goal reorder later provides both direct manipulation and named `Move before`,
  `Move after`, `Move to start`, and `Move to end` commands.

## Goal detail

### Context header

- An ArrowLeft icon appears before the goal title with the accessible name and
  tooltip `Back to goals`.
- The goal title is the strongest heading; application branding stays secondary.
- PencilSimple opens rename in a modal without replacing the page.
- Enter confirms, Escape cancels, and failed persistence restores neither a false
  `Saved` state nor the old value over the user's draft.

### Phase rail

- Phases form one ordered horizontal rail.
- The selected phase uses text, a keyline, and `aria-current`; color alone is not
  the selected-state cue.
- The rail scrolls horizontally instead of wrapping into multiple ambiguous rows.
- Selecting a phase changes the board context without changing any task status.
- When no phase exists, the goal-heading Plus opens create phase and the page
  does not show a misleading board.
- M1 supports add, select, and rename. Phase reordering and deletion are deferred.

### Kanban board

- Columns are always ordered Todo, In Progress, Done.
- Each header contains the full status label and task count.
- Empty columns remain valid named move destinations and explain their empty
  state.
- A task created in the active phase enters Todo at the end of the column.
- A task card uses its title as a native button named
  `Open task details for <title>`, plus hover/focus PencilSimple and DotsThree
  triggers. DotsThree opens explicit status/reorder actions. When real checklist
  items exist, the card adds `ListChecks` plus written `completed / total`
  progress; it never shows placeholder deadline, priority, or description.

### Deterministic task movement

The M1 baseline is explicit named controls inside the task-action modal,
operable by pointer and keyboard:

- `Move to Todo`, `Move to In Progress`, and `Move to Done` change status and
  append the task to the destination column.
- `Move before` and `Move after` reorder only inside the current phase and status.
- Unavailable actions are disabled with a discoverable reason.
- After a successful action, focus returns to the moved task and a polite live
  region announces its status and ordinal position.
- A failed move leaves persisted data unchanged, keeps a stable focus target, and
  presents `Retry`.

Drag-and-drop is later refinement, not an M1 exit requirement. When added, it
must use the same append/reorder rules and retain the named controls.

### M2 task detail and checklist

- Pointer click, Enter, or Space on the native task-title button opens one modal
  task-detail implementation. It is a right-aligned `480px` side sheet at
  `>=1200px`, a centered dialog no wider than `640px` at `720–1199px`, and a
  dynamic-viewport-contained full-screen dialog/page below `720px`.
- The modal backdrop makes the board inert. Detail owns its vertical scroll and
  reserves space around any sticky header/footer so keyboard focus is not
  obscured.
- Header content is task title, written current status, and X icon named
  `Close task details`. M2 keeps the existing card PencilSimple rename and
  DotsThree task actions; it does not duplicate title editing or status controls
  inside detail.
- Detail always shows derived `completed / total complete`. A card shows progress
  only when items exist. Progress, status, and checkbox state remain independent.
- `Checklist` contains a visible single-line `Add checklist item` label/input,
  visible `Add item` action, then native checkbox/label rows in persisted order.
  Enter appends; empty/whitespace-only or over-240-character input shows an
  inline error, retains the draft, and writes nothing.
- Empty detail says `No checklist items yet. Add the first step.` and focuses the
  quick-add input. Populated detail initially focuses its heading with
  `tabindex="-1"`. Successful create focuses the new checkbox.
- Toggle state and progress update from the committed snapshot. While pending,
  disable only that checkbox. Failure restores its persisted state, retains
  focus, and exposes Retry adjacent to the row.
- Each checkbox and visible label share a click target at least 44px high.
- Escape closes only when no save is pending and no draft would be silently
  lost. Closing returns focus to the exact task-title button and restores board
  scroll. Checklist items never become cards; all checked never means task Done,
  and task Done never checks items.
- M2 exposes no checklist rename, reorder, delete, or drag handle and no task
  description, priority, deadline, or deletion control.

### Task detail after M2

- Description/priority, local date/time deadline with active time zone, linked
  notes/reminders, checklist lifecycle actions, and task deletion require their
  later milestone/product decisions.

## Functional state specification

### Loading

- Use stable skeleton blocks matching goal cards or board columns.
- Keep the page heading and local context readable.
- Do not expose create/edit controls until their repository dependency is ready,
  unless the implementation safely queues the operation.
- M2 Home skeletons reserve Quick note, Inbox heading/count, note rows, and Goals
  without flashing `No notes yet`. Task detail does not open until its checklist
  dependency is ready.

### Empty

| Context | Message | Primary action |
| --- | --- | --- |
| No notes | `No notes yet. Add one with Quick note.` | Use the existing Quick note field above; no duplicate button |
| No goals | `No goals yet.` | Goals-heading Plus icon opens create modal |
| Goal without phases | `Add a phase to organize this goal.` | Goal-heading Plus icon opens create modal |
| Phase without tasks | `No tasks in this phase yet.` | Phase-heading Plus icon opens create modal |
| Empty status column | `No tasks in this status.` | Contextual move/create hint |
| Task without checklist | `No checklist items yet. Add the first step.` | Focus labeled Add checklist item field |

### Saving and saved

- Show save state next to the edited entity or in a stable shell location.
- Do not shift surrounding layout when text changes from Saving to Saved.
- Announce successful creates, renames, and moves once; avoid repetitive chatter.
- `Saved` appears only after the repository write resolves.

### Save failed

- Preserve the attempted title or action context in memory.
- Preserve note body/link choices and checklist title/toggle context in memory;
  keep the last persisted card/item visible until a retry commits.
- State `This change was not saved. Your draft is still here.` where applicable.
- Offer `Retry`; offer `Cancel` for title editing.
- Never optimistically leave the UI looking persisted after rollback.
- If navigation would discard an unsaved draft, warn before leaving.

### Storage unavailable or quota exceeded

- Show a persistent page-level `Changes are not saved` banner.
- Keep readable prior data and in-memory draft state where safe.
- Provide Retry. Do not promise backup/export before M5 exists.
- Use an assertive announcement only when there is a real risk of losing an edit.

### Invalid input

- Trim before validation; require one non-whitespace character; maximum length is
  240 characters for M1 entity titles.
- M2 checklist titles use the same 1–240-character rule. Note bodies require
  1–10,000 characters after trimming and keep internal line breaks.
- Keep invalid content in the field for correction.
- Connect inline error text to the input with `aria-describedby`.
- Render all user titles as text, never HTML or executable content.

### Deferred lifecycle states

- Archived goals remain recoverable and visually distinct when archive ships.
- Overdue tasks remain visible with text/icon treatment, not color alone.
- Fired reminders remain visible with a `Fired` label until manually deleted.
- Visible All/Notes/Reminders filters appear only when M3 has real item kinds;
  M2 includes no disabled or redundant filter state.
- Import/restore surfaces require preview, validation, progress, success, and
  rollback-failure states before those milestones can ship.

## Import flow (M4)

```text
Choose JSON file
  -> parse and validate without writes
  -> preview goals/phases/tasks/checklists and warnings
  -> choose Create mode
  -> confirm
  -> transactional import
  -> result summary with links to created goals
```

The preview must show file format/version, hierarchy counts, goal and phase
structure, interpreted deadlines, actionable JSON paths, and a statement that
imported text does not execute. Invalid input writes nothing.

## Backup restore flow (M5)

1. Validate the complete backup.
2. Compare current and incoming entity counts.
3. Recommend exporting current data.
4. Require explicit `Replace local data` confirmation.
5. Restore transactionally and reconcile derived alarms.

Restore is intentionally more cautious than plan import because it replaces the
current local dataset.

## Visual behavior

### Color and surfaces

- Base is charcoal/warm near-black, never pure black.
- Surfaces are crisp and flat, separated by one-pixel borders.
- Goal notes use muted amber, sage, blue, mauve, or clay.
- Saturated red is reserved for failure and destructive action.
- No gradients, neon, glass treatment, paper textures, or photography.

### Typography and pixel accent

- Readable system sans carries headings, body, inputs, and controls.
- System monospace is limited to short status labels, counters, keyboard hints,
  and the small Goal eyebrow.
- Goal/task titles remain real text, never pixel-art images.
- Original pixel accents use CSS/SVG squares and grid-aligned marks only.

### Iconography and progressive disclosure

- Every application icon comes from Phosphor Icons via the locally bundled
  `@phosphor-icons/react` package; core use never fetches icon assets.
- Plus creates, PencilSimple renames, DotsThree opens task actions, ArrowLeft
  navigates back, and MagnifyingGlass identifies the deferred search field.
- M2 adds LinkSimple beside visible `Add link`, ListChecks beside visible
  checklist progress, CaretUp/CaretDown beside named adjacent note moves,
  TrashSimple only beside visible destructive text, and X for named close.
  Native checkboxes carry checklist state; no icon replaces checkbox semantics.
- M2 renders no filter/reminder icon because the corresponding behavior is M3.
- Icon-only triggers retain `44px` hit areas, visible focus, accessible names,
  and hover/focus tooltips. Card actions appear on hover/focus and remain visible
  without hover.
- Create, rename, and task actions use modal dialogs. Dialog decisions retain
  visible text; errors, destructive consequences, and retry are never icon-only.

### Geometry and depth

- 8 px spacing rhythm with selected 4 px internal adjustments.
- Crisp one-pixel borders; 4–12 px radii depending on component size.
- No resting card shadow. Small overlay shadow is allowed only for actual menus
  or dialogs.
- Goal pixel pins use a square head and short stem drawn in code; no reference
  image or licensed asset is required.

### Motion

- Short transitions may clarify focus, navigation, and committed task movement.
- No continuous animation or staggered New Tab reveal.
- Data placement never waits for animation.
- `prefers-reduced-motion` and the in-app setting remove nonessential motion.

## Responsive behavior

- Desktop Chrome New Tab is the primary target.
- Goal cards flow from several columns to one without page-level horizontal
  scrolling.
- Home keeps Quick note, Inbox, then Goals in matching visual/DOM order at every
  width. Quick note and Inbox remain in document flow rather than a nested
  vertical scroller; note bodies use preserved line breaks and wrap long tokens.
- The board may scroll horizontally below its three-column minimum width; column
  headings remain visible and each column is at least wide enough for readable
  task controls.
- The phase rail may scroll independently but must keep the current phase visible.
- At narrow widths, titles wrap, dialogs remain inside the viewport, and icon
  hit targets never shrink below 44 px.
- Task detail is a `480px` right sheet at `>=1200px`, centered and at most
  `640px` from `720–1199px`, and a full dynamic-viewport surface below `720px`.
  Its own scroll area keeps focused controls clear of its header/footer.
- Exact production breakpoints are confirmed through long-title, large-count,
  200% zoom, and narrow-content stress tests rather than device presets.

Starting layout ranges are `>=1200px`, `720–1199px`, and `<720px`; these are
implementation hypotheses, not permanent device categories.

## Keyboard and focus behavior

- Provide a skip link to main content.
- Home M2 focus order is Quick note body, Add note/link disclosure and revealed
  link fields, Inbox note actions in persisted order, then Create goal and Goal
  pins. Loading never moves focus into a false empty state.
- Goal detail order is Back icon, goal title/edit, create phase, phase rail,
  board context/create task, then card edit/actions in visual order.
- Within each M2 task card, the native title detail button precedes its existing
  PencilSimple rename and DotsThree actions.
- Enter submits a valid single-line create/rename form; Escape cancels and
  restores focus to the trigger.
- In multiline note fields, Enter inserts a line and Control+Enter or Meta+Enter
  (Command+Enter) commits. Checklist quick-add is single-line and Enter commits.
- Native modal behavior traps focus while open. Closing returns focus to the
  trigger unless a successful creation focuses the created entity.
- A successful create focuses the created item or its title control.
- A moved task keeps focus after DOM relocation.
- Note edit/actions/delete-confirm and task-detail dialogs trap focus. Empty task
  detail focuses checklist quick-add; populated detail focuses its heading.
  Closing restores the exact trigger. Pending saves block dismissal and a
  non-empty unsaved draft requires explicit discard confirmation.
- Successful note creation focuses the new note container; successful checklist
  creation focuses the new checkbox. Failed note/checklist creation keeps focus
  with the retained draft, and a failed toggle restores focus to its checkbox.
- Note reorder uses named Move before/after controls only and returns focus to
  the moved note's DotsThree trigger.
- Do not overload plain arrow keys for task movement. A future direct reorder mode
  must be explicitly entered and announced.

## Accessibility acceptance

- All core actions are keyboard operable and have visible focus.
- Text and controls meet WCAG 2.2 AA contrast targets.
- Status, error, selection, and current phase never rely on color alone.
- Control targets are at least 44 px square or provide an equivalent hit area.
- Focus returns to the moved, closed, or saved item after interaction.
- Live regions announce move/save/import results without excessive repetition.
- Native checkbox state, written checklist progress, and written note link
  context do not rely on color or icon alone. Toggle success is announced once,
  not once for the checkbox and again for the refreshed count.
- Timestamps use semantic `time` values and clear human labels.
- At 200% zoom, no M1 or M2 capture, note action, task-detail, checklist,
  confirmation, retry, or navigation action is clipped, overlapped, or
  pointer-only.
- Reduced motion preserves all information and functionality.

## M1 acceptance review

Design review for M1 checks:

1. Loading never flashes a false empty dataset.
2. Empty Goal, Phase, and Task states expose one correct Plus action.
3. Goal/Phase/Task modal create and rename cover invalid, saving, saved, and
   failed states without draft loss or background interaction.
4. Board exposes exactly Todo, In Progress, and Done.
5. Pointer and keyboard users can invoke the same named status/reorder actions
   from the compact task-action modal.
6. Cross-status movement appends; before/after changes order only within a column.
7. Focus and announcements survive task relocation.
8. Reopen presents persisted hierarchy, status, and order without network use.
9. The shell follows the enforced minimal direction: My Tracker + deferred
   search, no resting local-implementation labels, Phosphor icons only, and no
   persistent create/rename/task-action forms.

## M2 acceptance review

Design review for M2 checks:

1. Loading reserves Quick note, Inbox, and Goals without flashing false empty
   data or enabling capture before its repository dependency is ready.
2. Quick note is first in Home order; multiline typing, Control/Command+Enter,
   visible Add note, optional progressive link, trim/limits, pending, success,
   failure, and Retry states are explicit.
3. No goals/tasks or failed optional target loading never blocks an unlinked
   note. Goal and Task choices are mutually exclusive and duplicate task titles
   have Goal / Phase / Task context.
4. Inbox exposes written label/count, exact empty copy, stable appended order,
   full plain-text wrapping, semantic updated time, and optional written link
   context with no filter or reminder affordance.
5. Note edit preserves body/link draft on failure; DotsThree provides named
   adjacent moves; deletion requires visible confirmation, has no undo, and
   preserves the note/order on failure.
6. Successful create/reorder/delete and dialog cancel restore the documented
   stable focus target and make one useful live announcement.
7. Each task title is a native detail button while PencilSimple and DotsThree
   remain separate controls. Pointer, Enter, and Space open the same task.
8. Task detail uses right sheet, centered, and full-screen presentations at the
   documented widths; it traps focus, remains viewport-contained at 200% zoom,
   and returns to the exact task-title trigger.
9. Empty/populated checklist states expose written progress, labeled quick-add,
   native checkboxes, validation, pending, failure/rollback, Retry, and created
   checkbox focus.
10. Checklist completion and task Done remain independent, and no checklist
    rename/reorder/delete, task deadline/description/priority, visible filter,
    reminder, or fake deferred affordance appears.
11. Reopening New Tab restores note body/link/order and checklist title/order/
    checked state without network, new permission, or locally unbundled asset.
12. Narrow, long-text, large-count, keyboard-only, no-hover, reduced-motion, and
    save/delete failure evidence is recorded before M2 is accepted.
