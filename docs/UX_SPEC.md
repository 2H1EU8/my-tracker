# UX specification

## Experience statement

My Tracker turns New Tab into a quiet personal work surface. It should feel
immediate, private, and stable: dark flat chrome, readable text, clear project
structure, and a restrained pixel-pin motif that makes goals recognizable.

Minimalism here means fewer competing decisions, not hidden behavior. Current
context, timestamps, task status, save state, errors, and destructive
consequences remain visible when relevant.

The canonical visual tokens and component anatomy live in [`DESIGN.md`](../DESIGN.md).
This document defines flows, interaction behavior, responsive rules, and state
expectations.

## Product-level information architecture

```text
New Tab / Home
  Quick capture (M2)
  Notes and reminders inbox (M2-M3)
  Goal pixel-pin grid
  Settings / Import / Backup (M4-M5)

Goal detail
  Back to goals / goal actions
  Ordered phase rail
  Todo | In Progress | Done board
  Task detail (M2+)
    Description
    Deadline
    Checklist
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

M1 includes title-only create and rename for goals, phases, and tasks; three
fixed status columns; pointer- and keyboard-operable named task actions; local
loading/save/error states; and persistence after reopen.

M1 intentionally defers notes, reminders, checklist, deadlines, task detail,
archive/delete, goal/phase reordering UI, import/export/restore, drag-and-drop,
and final visual polish. Deferred affordances must not appear enabled or be
represented with fake data.

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
2. Compact product/context header.
3. Primary create or navigation action for the current screen.
4. Current data surface.
5. One polite live region shared by routine result messages.

The shell may display `Saving on this device`, `Saved on this device`, or
`Changes are not saved`. It must never say `Synced` or imply a server.

## Home

### M1 empty state

- `Create goal` is the first task-specific focus target.
- A visible label accompanies the title input.
- Enter submits; whitespace-only or over-240-character input shows an inline
  error and performs no write.
- The empty state says what to do next and does not use a decorative illustration
  as the only explanation.

### M1 populated state

- Goals appear in persisted order as original code-native pixel-pin notes.
- Each card shows the goal title and last updated time.
- The whole-card open action has an accessible name containing the title.
- Note color is decorative and stable; it does not encode goal status.
- Opening a goal preserves/restores Home scroll position when the user returns
  during the same page session.
- Rename exposes saving, saved, failed, retry, and cancel behavior without
  discarding the draft.

### Later Home additions

- M2 quick capture becomes the first useful focus target and creates a note by
  default. Reminder mode reveals local date and time.
- The inbox shows notes, scheduled reminders, fired reminders, and overdue items.
- Filters are All, Notes, and Reminders.
- Linking to a goal/task remains optional.
- Fired reminders stay visible until manual deletion.
- Goal reorder later provides both direct manipulation and named `Move before`,
  `Move after`, `Move to start`, and `Move to end` commands.

## Goal detail

### Context header

- `Back to goals` appears before the editable goal title.
- The goal title is the strongest heading; application branding stays secondary.
- Rename can be started without replacing the whole page with an editing mode.
- Enter confirms, Escape cancels, and failed persistence restores neither a false
  `Saved` state nor the old value over the user's draft.

### Phase rail

- Phases form one ordered horizontal rail.
- The selected phase uses text, a keyline, and `aria-current`; color alone is not
  the selected-state cue.
- The rail scrolls horizontally instead of wrapping into multiple ambiguous rows.
- Selecting a phase changes the board context without changing any task status.
- When no phase exists, show `Add phase` and do not show a misleading board.
- M1 supports add, select, and rename. Phase reordering and deletion are deferred.

### Kanban board

- Columns are always ordered Todo, In Progress, Done.
- Each header contains the full status label and task count.
- Empty columns remain valid named move destinations and explain their empty
  state.
- A task created in the active phase enters Todo at the end of the column.
- A task card shows its title and explicit move/reorder actions in M1. Do not show
  placeholder deadline, priority, checklist, or description content.

### Deterministic task movement

The M1 baseline is explicit named controls, operable by pointer and keyboard:

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

### Task detail after M1

- Open in a side panel on wide viewports and as a full-screen dialog/page on
  narrow viewports.
- Title editing remains immediate but visibly saves or reports failure.
- Checklist entry supports quick keyboard creation.
- Deadline uses local date/time input and displays the active time zone.
- Permanent deletion is visibly separated and requires the product-defined
  confirmation.
- Marking a task Done does not silently check checklist items, and completing a
  checklist does not silently change task status.

## Functional state specification

### Loading

- Use stable skeleton blocks matching goal cards or board columns.
- Keep the page heading and local context readable.
- Do not expose create/edit controls until their repository dependency is ready,
  unless the implementation safely queues the operation.

### Empty

| Context | Message | Primary action |
| --- | --- | --- |
| No goals | `No goals yet. Create one to start planning.` | `Create goal` |
| Goal without phases | `Add a phase to organize this goal.` | `Add phase` |
| Phase without tasks | `No tasks in this phase yet.` | `Add task` |
| Empty status column | `No tasks in this status.` | Contextual move/create hint |

### Saving and saved

- Show save state next to the edited entity or in a stable shell location.
- Do not shift surrounding layout when text changes from Saving to Saved.
- Announce successful creates, renames, and moves once; avoid repetitive chatter.
- `Saved` appears only after the repository write resolves.

### Save failed

- Preserve the attempted title or action context in memory.
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
- Keep invalid content in the field for correction.
- Connect inline error text to the input with `aria-describedby`.
- Render all user titles as text, never HTML or executable content.

### Deferred lifecycle states

- Archived goals remain recoverable and visually distinct when archive ships.
- Overdue tasks remain visible with text/icon treatment, not color alone.
- Fired reminders remain visible with a `Fired` label until manually deleted.
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
- The board may scroll horizontally below its three-column minimum width; column
  headings remain visible and each column is at least wide enough for readable
  task controls.
- The phase rail may scroll independently but must keep the current phase visible.
- At narrow widths, title/actions wrap before hit targets shrink below 44 px.
- Exact production breakpoints are confirmed through long-title, large-count,
  200% zoom, and narrow-content stress tests rather than device presets.

Starting layout ranges are `>=1200px`, `720–1199px`, and `<720px`; these are
implementation hypotheses, not permanent device categories.

## Keyboard and focus behavior

- Provide a skip link to main content.
- Home M1 focus order starts with Create goal. When quick capture ships, it
  becomes the first useful field.
- Goal detail order is Back, goal context/edit, phase rail, board columns, then
  card actions in visual order.
- Enter submits a valid single-line create/rename form; Escape cancels and
  restores focus to the trigger.
- A successful create focuses the created item or its title control.
- A moved task keeps focus after DOM relocation.
- Dialogs in later milestones trap focus and return it to their trigger.
- Do not overload plain arrow keys for task movement. A future direct reorder mode
  must be explicitly entered and announced.

## Accessibility acceptance

- All core actions are keyboard operable and have visible focus.
- Text and controls meet WCAG 2.2 AA contrast targets.
- Status, error, selection, and current phase never rely on color alone.
- Control targets are at least 44 px square or provide an equivalent hit area.
- Focus returns to the moved, closed, or saved item after interaction.
- Live regions announce move/save/import results without excessive repetition.
- Timestamps use semantic `time` values and clear human labels.
- At 200% zoom, no M1 action is clipped, overlapped, or pointer-only.
- Reduced motion preserves all information and functionality.

## M1 acceptance review

Design review for M1 checks:

1. Loading never flashes a false empty dataset.
2. Empty Goal, Phase, and Task states provide the correct next action.
3. Goal/Phase/Task create and rename cover invalid, saving, saved, and failed
   states without draft loss.
4. Board exposes exactly Todo, In Progress, and Done.
5. Pointer and keyboard users can invoke the same named status/reorder actions.
6. Cross-status movement appends; before/after changes order only within a column.
7. Focus and announcements survive task relocation.
8. Reopen presents persisted hierarchy, status, and order without network use.
9. The shell follows the calm flat direction without claiming final M6 polish.
