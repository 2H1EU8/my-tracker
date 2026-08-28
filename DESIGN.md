---
version: 1.0.0
name: my-tracker-design-system
status: M1 specification
description: >-
  A calm, local-first new-tab workspace with dark flat surfaces, readable UI
  typography, and small code-native pixel details. Goals appear as compact
  pixel-pin notes; project structure remains more prominent than decoration.
---

# My Tracker design system

## 1. Design intent

My Tracker is a personal control surface, not a dashboard for a team. Opening a
new tab should reveal the next useful action without banners, feeds, account
chrome, or decorative delay.

The visual system keeps three abstract lessons from strong editorial products:

1. Hierarchy should be obvious before the user reads every label.
2. Product chrome should be restrained so the user's goals carry the emphasis.
3. Repeated geometry and spacing should make dense information feel ordered.

Everything else is original to My Tracker. The system does not use borrowed
brand assets, licensed fonts, promotional imagery, unrelated catalog patterns,
or copied reference components.

### Character

- Calm: low-glare dark canvas, stable layout, no continuous motion.
- Minimal: flat surfaces, one-pixel borders, almost no shadow.
- Personal: goals resemble small pinned working notes rather than enterprise
  project tiles.
- Precise: status, order, focus, and save state are always explicit.
- Local: no account prompts, online indicators, social UI, or cloud language.

### Non-negotiable constraints

- No gradients, neon, glassmorphism, photographic textures, or large shadows.
- No proprietary fonts or third-party brand assets.
- No emoji as interface iconography.
- Pixel styling is an accent, never the body type or a readability tax.
- Color never communicates task status, errors, or selection by itself.
- All pointer move/reorder actions have named keyboard equivalents.
- Decorative effects never block local data from rendering or capture from
  becoming usable.

## 2. Information hierarchy

The M1 hierarchy follows the product model, not visual novelty:

```text
Application shell
  Home
    Page identity
    Create goal
    Goal pin grid
      Goal title
      Updated time
      Open action
  Goal detail
    Back to goals / goal title / save state
    Phase rail
    Create phase
    Active phase board
      Todo
      In Progress
      Done
        Task cards
        Create task
```

At any moment, the strongest visible element is the current context: the goal
grid on Home, the goal title on Goal detail, and task titles inside the active
phase. Application branding and controls remain quieter.

## 3. Foundations

### 3.1 Color tokens

The core palette is neutral and low-glare. Note colors are decorative variants,
not semantic categories.

| Token | Value | Use |
| --- | --- | --- |
| `color.canvas` | `#10120F` | New Tab background |
| `color.surface.1` | `#171A16` | Primary application surfaces |
| `color.surface.2` | `#1D211C` | Columns, fields, secondary surfaces |
| `color.surface.3` | `#252A23` | Hovered neutral surface |
| `color.border` | `#353B32` | Default one-pixel divider |
| `color.border.strong` | `#5B6456` | Selected or emphasized border |
| `color.border.interactive` | `#66705F` | Resting input/button boundary; at least 3:1 against dark surfaces |
| `color.text.primary` | `#F2F1E9` | Headings and primary labels |
| `color.text.secondary` | `#B9BDB2` | Body copy and metadata |
| `color.text.muted` | `#92988D` | Low-emphasis helper text |
| `color.focus` | `#D7E58A` | Focus ring and current-context accent |
| `color.success` | `#A7D0A4` | Saved confirmation, paired with text/icon |
| `color.warning` | `#E1C77A` | Recoverable warning, paired with text/icon |
| `color.danger` | `#FF9B90` | Destructive/failure text and border |
| `color.info` | `#A8C9DF` | Informational message |
| `color.scrim` | `rgba(8, 9, 7, 0.72)` | Modal backdrop when later milestones need one |

Goal pin variants use dark text because their surfaces are intentionally lighter:

| Token | Value | On-color | Character |
| --- | --- | --- | --- |
| `note.amber` | `#CEB66F` | `#1B1911` | warm focus |
| `note.sage` | `#9DB69D` | `#121914` | steady progress |
| `note.blue` | `#91AEBE` | `#11181C` | cool planning |
| `note.mauve` | `#B49EB0` | `#1B141A` | reflective work |
| `note.clay` | `#BF917B` | `#1C1411` | active work |

Rules:

- A goal's note color is stable across sessions. M1 may derive it from the goal
  ID; later owner selection must preserve that value.
- Note colors never encode priority, status, ownership, or health.
- Destructive red is never used as a goal-note color.
- Disabled text remains legible; lower opacity is paired with a cursor/state
  change and is not used below `0.55` on the dark canvas.

### 3.2 Typography tokens

M1 must use local system fonts so New Tab rendering never waits for a font
download.

| Token | Font | Size / line | Weight | Use |
| --- | --- | --- | --- | --- |
| `type.page` | `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | `32px / 38px` | 650 | Page and goal title |
| `type.section` | same | `20px / 28px` | 650 | Section and column title |
| `type.card` | same | `16px / 24px` | 600 | Goal/task title |
| `type.body` | same | `15px / 24px` | 400 | Body and form text |
| `type.control` | same | `14px / 20px` | 600 | Buttons and actions |
| `type.meta` | same | `13px / 18px` | 500 | Timestamps and helper text |
| `type.pixel` | `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` | `11px / 16px` | 700 | Short status labels, counters, keyboard hints |

Typography rules:

- Body, input, and error copy always use the UI stack, never `type.pixel`.
- Pixel labels are brief, normally no more than three words.
- Uppercase is limited to short column/status labels with `0.06em` tracking.
- Use tabular numerals for counts and timestamps where alignment matters.
- Truncate only in repeatable grids. The full title remains available on focus
  and in the opened view.

### 3.3 Spacing and sizing

The system uses an 8 px rhythm with 4 px adjustments for compact internals.

| Token | Value | Typical use |
| --- | --- | --- |
| `space.0` | `0` | Reset |
| `space.0.5` | `2px` | Pixel motif only |
| `space.1` | `4px` | Tight metadata gap |
| `space.2` | `8px` | Control internals |
| `space.3` | `12px` | Compact card gap |
| `space.4` | `16px` | Standard padding |
| `space.6` | `24px` | Section/card padding |
| `space.8` | `32px` | Major group gap |
| `space.12` | `48px` | Page rhythm |
| `space.16` | `64px` | Wide-screen separation |

- Minimum pointer target: `44px × 44px`.
- Text input minimum height: `44px`.
- Primary action minimum height: `44px`.
- Content maximum width: `1440px`; outer gutter is `16px`, `24px`, or
  `32px` depending on available width.

### 3.4 Geometry and elevation

| Token | Value | Use |
| --- | --- | --- |
| `radius.none` | `0` | Pixel marks and dividers |
| `radius.control` | `4px` | Buttons, inputs, small menus |
| `radius.card` | `8px` | Task cards and columns |
| `radius.panel` | `12px` | Major panels |
| `border.default` | `1px solid #353B32` | Default separation |
| `border.interactive` | `1px solid #66705F` | Resting interactive controls |
| `border.focus` | `2px solid #D7E58A` | Visible focus ring |
| `shadow.rest` | `none` | Default surfaces |
| `shadow.overlay` | `0 8px 24px rgba(0,0,0,0.04)` | Menus/dialogs only |

Cards do not lift on hover. Hover is shown through border or surface color. The
single overlay shadow is reserved for a layer that truly sits above content.

### 3.5 Motion tokens

| Token | Value | Use |
| --- | --- | --- |
| `motion.fast` | `120ms` | Hover/focus color transitions |
| `motion.standard` | `180ms` | Menu, inline editor, task move feedback |
| `motion.ease` | `cubic-bezier(0.2, 0, 0, 1)` | Default easing |

- Animate only `transform` and `opacity` when motion is needed.
- No entry cascade, ambient animation, looping cursor, or decorative rotation.
- Moving a task may use a brief opacity transition after the data commit; the
  destination position must not wait for animation.
- With reduced motion, duration becomes `0ms` for decorative transitions and
  focus/status changes remain immediate.

### 3.6 Iconography

- Use small original inline SVG primitives with a consistent `2px` stroke and
  square or lightly rounded ends.
- Common actions use both icon and accessible name; destructive actions are not
  represented by an ambiguous icon alone.
- Pixel motifs are built with CSS borders, pseudo-elements, or inline SVG grid
  paths. They must not load external images.

## 4. Signature component: Goal pixel pin

The Goal pin is My Tracker's distinctive element. It is a flat sticky-note card
with a small square pin mark, not a photograph or imitation of physical paper.

### Anatomy

```text
        [ 8 x 8 square pin head ]
               [ 2 x 6 stem ]
  +--------------------------------+
  | GOAL 03                        |
  | Ship My Tracker M1             |
  |                                |
  | Updated 14:20             Open |
  +--------------------------------+
```

- The card is a solid `note.*` surface with a one-pixel dark border.
- The pin uses a `::before` square and `::after` stem centered on the top edge.
- The pin and card use the same foreground color at different opacity. No
  external image, paper texture, curl, tape, pushpin illustration, or shadow.
- The pixel eyebrow is decorative context; the accessible name is the goal title
  plus updated time.
- Card content remains aligned to the standard spacing grid. The pixel motif is
  never used to distort text or hit targets.

### States

| State | Treatment | Required behavior |
| --- | --- | --- |
| Rest | Note color, dark text, dark one-pixel border | Title and updated time visible |
| Hover | Border becomes stronger; open label gains underline | No rotation or lift |
| Focus-visible | `2px` outer focus ring with `2px` offset | Full card action has a clear name |
| Active/pressed | `translateY(1px)` or darker border | No scale collapse |
| Selected/open | Dark inset keyline plus `Current goal` text for assistive tech | Color is not the only cue |
| Saving | Inline `Saving` text with small square progress mark | Editing remains understandable |
| Save failed | Error strip below title; `Retry` action | Preserve the entered title |
| Disabled | Not used for persisted goals in M1 | Prefer explaining unavailable actions |

Goal cards are never randomly rotated. If a later decorative offset is tested,
it must be deterministic and removed in reduced-motion mode.

## 5. Core components

### 5.1 Application shell

- Full-viewport `color.canvas`; no splash illustration.
- A compact top row contains `My Tracker`, current context, and local save state.
- Main content renders independently of nonessential decoration.
- Loading uses stable skeleton blocks matching final dimensions. Do not replace
  the entire page with a centered spinner.

### 5.2 Buttons

Primary button:

- `color.text.primary` on `color.surface.3`, one-pixel strong border, `4px`
  radius, no shadow.
- One primary action per local section, such as `Create goal`.

Secondary button:

- Transparent or `color.surface.1`, interactive border, primary text.
- Used for cancel, retry, and lower-priority actions.

Text action:

- No container until hover/focus; underline on hover is allowed.
- Only for non-destructive low-emphasis actions.

All buttons define rest, hover, focus-visible, pressed, disabled, and busy states.
Busy controls retain their width and label context, for example `Creating goal`.

### 5.3 Inputs and inline editors

- Label remains visible above the field; placeholder is an example, not a label.
- Dark `surface.2`, one-pixel interactive border, `4px` radius, `16px`
  horizontal padding.
- Focus uses the global focus token, not color fill alone.
- Enter confirms a single-line create/rename action; Escape cancels and restores
  the previous value.
- Empty or whitespace-only input shows an inline error and does not write.
- A failed save keeps the draft in the field and offers `Retry` and `Cancel`.

### 5.4 Phase rail

- Ordered horizontal list immediately below the goal heading.
- Active phase uses a bottom keyline, stronger text, and `aria-current`; inactive
  phases remain buttons/tabs with clear names.
- The rail scrolls horizontally when it cannot fit. It never wraps into an
  ambiguous two-dimensional tab order.
- `Create phase` is visually separate from existing phases.
- M1 supports selecting and renaming a phase. Phase reordering and non-empty
  phase deletion are deferred.

### 5.5 Kanban column

- Three fixed columns appear in this order: Todo, In Progress, Done.
- Header includes the written status name and task count.
- Column color is neutral. Status is communicated by heading, position, and the
  task's named move actions.
- Empty column remains a valid move destination and shows `No tasks in this
  status` plus the relevant create/move hint.
- Pointer-operated named move controls are sufficient for M1. Drag-and-drop is
  deferred visual/interaction refinement, not an M1 exit gate.

### 5.6 Task card

- Flat `surface.1` card with one-pixel border and `8px` radius.
- M1 content: task title, phase context when needed, and visible move/reorder
  actions. Deadline, checklist, priority, and description slots are deferred and
  must not appear as fake data.
- Hover changes border/surface only; focus-visible uses the global ring.
- The entire card is never an implicit drag handle.
- Renaming is immediate locally and visibly reports saving or failure.

### 5.7 Move and reorder controls

M1 uses the same explicit named actions for pointer and keyboard users:

- `Move to Todo`, `Move to In Progress`, and `Move to Done` change status and
  append the task to the destination column.
- `Move before` and `Move after` reorder within the current status column.
- A successful move updates status/order as one user action, restores focus to
  the moved task, and announces its destination.
- Invalid actions are disabled with a discoverable reason; they are not omitted
  in a way that makes the order model unclear.

If a later milestone adds drag-and-drop, it must resolve to these same stored
results. The named-action path remains authoritative and cannot be removed.

### 5.8 Status messages

| Message | Placement | Behavior |
| --- | --- | --- |
| Loading local data | In-place skeleton plus quiet page-level label | No modal/blocking spinner |
| Saving | Beside the edited entity or in shell save indicator | Polite announcement only when useful |
| Saved | Same location, brief text confirmation | Must not shift layout |
| Save failed | Adjacent error panel with Retry | Draft stays in memory |
| Storage unavailable | Persistent blocking banner above content | Explain that changes cannot be trusted |
| No goals | Home content area | Explain value and offer `Create goal` |
| No phases | Goal content area | Offer `Create phase` |
| No tasks | Active phase/column | Offer `Create task`; empty columns remain destinations |

The UI must never claim `Saved` before the repository write resolves.

## 6. M1 functional screens

### 6.1 Home — no goals

Order:

1. Page label and local-only reassurance.
2. `Create goal` field/action.
3. Empty message: `No goals yet. Create one to start planning.`

The create field is the first task-specific focus target. Invalid submission is
reported inline without clearing the field.

### 6.2 Home — populated

- Goal pins use `repeat(auto-fit, minmax(240px, 1fr))` with a practical maximum
  width around `360px` so a single goal does not become a banner.
- DOM/tab order matches persisted goal order.
- Opening a Goal records/restores Home scroll position when navigating back.
- M1 has no archive/delete affordance and no decorative dashboard widgets.

### 6.3 Goal detail — no phases

- Back action, editable goal title, and save state remain visible.
- The board is replaced by a focused empty state with `Create phase`.
- Do not render three meaningless empty columns before a phase exists.

### 6.4 Goal detail — phase without tasks

- Active phase appears in the phase rail.
- Three empty status columns are visible because they teach the fixed workflow
  and are valid destinations.
- `Create task` belongs to the active phase and defaults to Todo.

### 6.5 Goal detail — populated board

- The active phase is explicit in the rail and route/application state.
- Every task appears in exactly one status column.
- Create/rename, pointer/keyboard named move, and within-column before/after
  reorder expose saving/saved/failure feedback.
- Cross-status moves append to the destination column deterministically.
- Reopening New Tab renders the persisted goal, phase, task, status, and order
  without celebratory or onboarding interruption.

### 6.6 Local storage failure

- Keep the unsaved field/task state in memory.
- Show a persistent page-level `Changes are not saved` banner and an adjacent
  error at the failed edit.
- Offer `Retry`. Do not offer export in M1 because backup export is not yet
  implemented.
- Navigation away from an unsaved edit requires an explicit warning if it would
  discard the draft.

## 7. Responsive behavior

Breakpoints are implementation starting points and must be adjusted through
content stress tests, not device-name assumptions.

| Range | Home | Goal board |
| --- | --- | --- |
| `>= 1200px` | 3–5 goal pins depending on width | Three columns share available width; minimum `280px` each |
| `720px–1199px` | 2–3 goal pins | Three-column board scrolls horizontally when needed |
| `< 720px` | One goal pin per row | Horizontal board with sticky column headings; no page-level horizontal overflow outside board |

- The phase rail and board are separate horizontal scroll regions with visible
  edges/labels; nested scrolling must not hide the active phase.
- On narrow widths, task create/edit can use an in-flow panel or full viewport
  sheet later; M1 inline forms must not overflow.
- Goal title and actions wrap into two rows before controls shrink below `44px`.
- At `200%` zoom, core M1 actions remain reachable and text does not overlap.

## 8. Keyboard, focus, and announcements

### Page entry

- A skip link moves focus to main content.
- Home focus order begins with `Create goal`; Goal detail begins with `Back to
  goals`, then goal title/action, phase rail, and board.
- No element receives surprise programmatic focus after hydration.

### Editing

- Enter submits single-line create/rename.
- Escape cancels and returns focus to the trigger.
- Successful creation focuses the created entity or its title control.
- Failed creation keeps focus in the invalid/failed field and connects error text
  through `aria-describedby`.

### Moving

- Task actions have context-rich names, for example `Move Build shell`.
- Move success announcement includes task, status, and ordinal position.
- Pointer and keyboard activation of a named move return focus to the same task.
- Do not use unmodified arrow keys to move tasks while they are reading/navigation
  keys. If a future direct reorder mode is added, it must be explicitly entered
  and announced.

### Focus appearance

- Every interactive element uses a visible `2px` focus ring with at least `2px`
  offset from its border.
- Focus is never removed just because pointer users prefer a quieter outline;
  use `:focus-visible` for keyboard-specific treatment.
- A scrolled task/phase is brought fully into view when it receives focus.

### Live regions

- Use one polite region for create, rename, save, and move success.
- Use an assertive region only when a failed save risks data loss.
- Do not announce skeleton rows, every hover, or repeated `Saved` messages.

## 9. Required state matrix

Every M1 component review must cover the following where applicable:

| Category | States |
| --- | --- |
| Data | loading, empty, populated, malformed-record isolation if surfaced |
| Control | rest, hover, focus-visible, pressed, disabled, busy |
| Edit | pristine, dirty, invalid, saving, saved, save failed, retrying |
| Navigation | inactive, current, returning with restored focus/scroll |
| Move | available, invalid, moving, moved, move failed |
| Storage | available, write pending, write failed, unavailable/quota exceeded |
| Motion | default, reduced motion |

Archived, overdue, fired reminder, import, backup, restore, checklist, and deadline
states remain documented in `docs/UX_SPEC.md` for later milestones but are not M1
implementation claims.

## 10. Accessibility acceptance

- Text and interactive components meet WCAG 2.2 AA contrast targets.
- Status, current phase, selection, and errors have non-color cues.
- All core actions are keyboard operable with a logical focus order.
- Touch/pointer targets are at least `44px × 44px` or have equivalent hit area.
- Zoom to `200%` does not hide create, rename, move, retry, or navigation actions.
- Reduced motion removes nonessential transition and any decorative transform.
- Goal/task titles remain text, never rasterized pixel art.
- Timestamps use semantic `time` elements with machine-readable values and clear
  visible labels.

## 11. Content voice

- Short, direct, and specific: `Create goal`, `Rename phase`, `Move to Done`.
- Use sentence case except short pixel labels such as `TODO`.
- Explain consequences before risky future actions; do not rely on iconography.
- Local-first copy is factual: `Saved on this device`, not `Synced` or `Online`.
- Error copy states what remains safe and what the user can do next.

Examples:

- Empty: `No goals yet. Create one to start planning.`
- Saving: `Saving on this device…`
- Saved: `Saved on this device.`
- Validation: `Enter a goal title.`
- Failure: `This change was not saved. Your draft is still here.`

## 12. M1 handoff and deferred polish

M1 implementation should consume the semantic tokens and interaction contracts
above while keeping visual implementation deliberately light. The required M1
design outcome is a coherent, accessible functional shell—not final art
direction.

Required in M1:

- Dark flat shell and readable typography.
- Original code-native Goal pixel pin.
- Goal/phase/task create and rename states.
- Fixed-status board with pointer and keyboard named move/reorder actions.
- Loading, empty, invalid, saving, saved, save-failed, and storage-failed states.
- Focus, announcements, reduced-motion baseline, and responsive fallback.
- Cross-status append and within-column before/after behavior.

Deferred:

- Final visual polish and stress tuning (M6).
- Drag-and-drop, goal/phase reordering UI, archive, and permanent deletion policy.
- Notes, reminders, deadlines, checklist, import, backup, and restore surfaces.
- Additional note-color controls, decorative variations, and richer transitions.

Future work may refine tokens after implementation evidence, but it must preserve
the calm local-first character, accessible interaction contract, and original
pixel-pin identity.
