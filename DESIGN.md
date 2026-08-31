---
version: 1.2.0
name: my-tracker-design-system
status: M2 checklist and personal-inbox contract
description: >-
  A calm, local-first new-tab workspace with dark flat surfaces, readable UI
  typography, and small code-native pixel details. Goals appear as compact
  pixel-pin notes; quick capture, personal notes, and task checklists extend the
  same minimal interaction language without competing with project structure.
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
- Minimal: every persistent element must earn its place; one clear trigger is
  preferred over a permanently expanded form or a row of competing actions.
- Personal: goals resemble small pinned working notes rather than enterprise
  project tiles.
- Precise: status, order, focus, and save state are always explicit.
- Local: no account prompts, online indicators, social UI, or cloud language.

### Non-negotiable constraints

- No gradients, neon, glassmorphism, photographic textures, or large shadows.
- No proprietary fonts or third-party brand assets.
- No emoji, ad-hoc SVG, Unicode symbol, or mixed icon family as interface
  iconography. All application icons come from Phosphor Icons through
  `@phosphor-icons/react` and are bundled locally.
- Pixel styling is an accent, never the body type or a readability tax.
- Color never communicates task status, errors, or selection by itself.
- All pointer move/reorder actions have named keyboard equivalents.
- Decorative effects never block local data from rendering or capture from
  becoming usable.

### Minimalism as an interaction rule

Minimalism is a product constraint, not a visual theme. Design and Dev must
apply these rules before adding or expanding any control:

1. Keep only information needed to understand the current context or make the
   next decision. Local-storage implementation labels and repeated context copy
   do not belong in the resting UI.
2. Use one Phosphor icon trigger for a compact, familiar action. The trigger
   must retain a context-rich accessible name, visible focus, and tooltip.
3. Move create, rename, and secondary task actions into focused modal dialogs.
   Labels, validation, consequences, and Save/Cancel text remain visible inside
   the dialog; minimalism must not make decisions ambiguous.
4. Reveal card-level edit/action icons on hover or focus, and keep them visible
   on devices without hover.
5. Do not replace essential status, error, destructive, or recovery language
   with an icon alone.
6. Before shipping a new persistent button, show why it cannot be an existing
   card gesture, contextual icon, modal action, or progressive disclosure.

## 2. Information hierarchy

The M2 hierarchy follows the product model and keeps the Home reading and focus
order explicit:

```text
Application shell
  Home
    My Tracker / search placeholder
    Quick note composer
      Optional link disclosure
    Inbox / note count
      Note body / updated time / optional link context
      Edit / reorder / delete actions
    Goals / create icon
    Goal pin grid
      Goal title
      Updated time
      Double-click open / keyboard open
      Hover/focus edit icon
  Goal detail
    Back icon / goal title / edit icon / create-phase icon
    Phase rail
    Active phase board
      Todo
      In Progress
      Done
        Task cards
        Native task-title detail trigger
        Checklist progress when items exist
        Hover/focus edit and action icons
    Task detail dialog
      Task title / status / checklist progress
      Checklist quick-add
      Ordered native checkboxes
```

At any moment, the strongest visible element is the current context: Quick note
is first and immediately operable on Home while the Goal grid retains the
largest visual forms; the goal title leads Goal detail; task titles lead the
active phase. Application branding and controls remain quieter.

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
- Text input minimum height: `44px`; the quick-note textarea starts at `88px`,
  grows to `240px`, then scrolls its own content.
- Primary action minimum height: `44px`.
- Content maximum width: `1440px`; outer gutter is `16px`, `24px`, or
  `32px` depending on available width.
- Wide task-detail sheet width: `480px`; intermediate dialogs use at most
  `640px`; every variant remains inside the current dynamic viewport.

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
| `motion.standard` | `180ms` | Modal, menu, task move feedback |
| `motion.ease` | `cubic-bezier(0.2, 0, 0, 1)` | Default easing |

- Animate only `transform` and `opacity` when motion is needed.
- No entry cascade, ambient animation, looping cursor, or decorative rotation.
- Moving a task may use a brief opacity transition after the data commit; the
  destination position must not wait for animation.
- With reduced motion, duration becomes `0ms` for decorative transitions and
  focus/status changes remain immediate.

### 3.6 Iconography

- Phosphor Icons is the single application icon source. React implementation
  uses tree-shaken imports from `@phosphor-icons/react`; it must not fetch an
  icon font, sprite, SVG, or CDN asset at runtime.
- Default interface icons use the regular weight at `18–20px`. Bold weight is
  reserved for the primary add trigger; fill/duotone variants require a stated
  semantic reason.
- Icon-only triggers are always at least `44px × 44px`, have a context-rich
  `aria-label`, visible focus, and a tooltip available on hover/focus.
- Use `Plus` for create, `PencilSimple` for rename, `DotsThree` for secondary
  task actions, `ArrowLeft` for back, `MagnifyingGlass` for search, and
  `Circle` / `PlayCircle` / `CheckCircle` for task-status choices.
- M2 uses `LinkSimple` beside the visible `Add link` disclosure,
  `ListChecks` beside visible checklist progress, `CaretUp` / `CaretDown` for
  named adjacent note moves, `TrashSimple` only beside visible destructive
  text, and `X` for the named close control on dialogs and task detail.
- Checklist state uses a native checkbox and visible label. A Phosphor glyph
  must not replace its checked/unchecked semantics.
- M2 shows no filter icon or disabled reminder icon. Mixed-kind filters and
  reminder affordances remain absent until M3 has real reminder data.
- Destructive, error-recovery, and final confirmation actions retain visible
  text. An icon may support the label but never replaces the consequence.
- The Goal pin motif is product geometry, not interface iconography. It remains
  CSS pseudo-element geometry and loads no external image.

## 4. Signature component: Goal pixel pin

The Goal pin is My Tracker's distinctive element. It is a flat sticky-note card
with a small square pin mark, not a photograph or imitation of physical paper.

### Anatomy

```text
        [ 8 x 8 square pin head ]
               [ 2 x 6 stem ]
  +--------------------------------+
  | 03                        [edit]|
  | Ship My Tracker M1             |
  |                                |
  | Aug 29, 14:20                  |
  +--------------------------------+
```

- The card is a solid `note.*` surface with a one-pixel dark border.
- The pin uses a `::before` square and `::after` stem centered on the top edge.
- The pin and card use the same foreground color at different opacity. No
  external image, paper texture, curl, tape, pushpin illustration, or shadow.
- The compact number is decorative context; the accessible name is the goal
  title, updated time, and `Double-click or press Enter to open` instruction.
- Card content remains aligned to the standard spacing grid. The pixel motif is
  never used to distort text or hit targets.

### States

| State | Treatment | Required behavior |
| --- | --- | --- |
| Rest | Note color, dark text, dark one-pixel border | Title and updated time visible |
| Hover | Border becomes stronger; edit icon appears | Double-click opens; no rotation or lift |
| Focus-visible | `2px` outer focus ring with `2px` offset; edit icon appears | Enter or Space opens with a clear accessible name |
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
- A compact top row contains only `My Tracker` and a search-shaped placeholder.
  Search is visibly unavailable until implemented and must not pretend to work.
- Resting labels such as `Local only`, `Local New Tab`, and `Stored only in this
  Chrome profile` are removed. Local-only remains a product invariant and is
  communicated in settings/onboarding or when it changes a decision.
- Saving and failure state appears only while relevant as a compact status toast
  or error banner, then successful idle chrome clears.
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

Icon trigger:

- Transparent at rest with a `44px` hit target; quiet surface/border on hover.
- Uses only the canonical Phosphor mapping from section 3.6.
- Card-level triggers appear on hover/focus and remain visible without hover.

All buttons define rest, hover, focus-visible, pressed, disabled, and busy
states. Modal commit/cancel/retry buttons keep visible text; icon-only controls
are not used when the user must understand a consequence.

### 5.3 Inputs and modal editors

- Create and rename inputs do not remain expanded in the resting page. A Plus or
  PencilSimple trigger opens a native modal dialog.
- Inside the dialog, the label remains visible above the field; placeholder is
  an example, not a label.
- Dark `surface.2`, one-pixel interactive border, `4px` radius, `16px`
  horizontal padding.
- Focus uses the global focus token, not color fill alone.
- Enter confirms a single-line create/rename action; Escape cancels and restores
  the previous value.
- Empty or whitespace-only input shows an inline error and does not write.
- A failed save keeps the draft in the field and offers `Retry` and `Cancel`.
- Dialogs trap focus through the platform modal behavior, Escape cancels when no
  save is pending, and close returns focus to the icon trigger or newly created
  entity.

### 5.4 Phase rail

- Ordered horizontal list immediately below the goal heading.
- Active phase uses a bottom keyline, stronger text, and `aria-current`; inactive
  phases remain buttons/tabs with clear names.
- The rail scrolls horizontally when it cannot fit. It never wraps into an
  ambiguous two-dimensional tab order.
- A Plus icon beside the goal heading opens the create-phase modal; no persistent
  phase input occupies the rail.
- The active phase title exposes a PencilSimple icon on hover/focus and renames
  through a modal.
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
- Resting content is the task title only. PencilSimple and DotsThree triggers
  appear on hover/focus; they remain visible on devices without hover.
- PencilSimple opens rename. DotsThree opens the task-action modal containing
  status and within-column order choices. Deadline, checklist, priority, and
  description slots are deferred and must not appear as fake data.
- Hover changes border/surface only; focus-visible uses the global ring.
- The entire card is never an implicit drag handle.
- Renaming is immediate locally and visibly reports saving or failure.

### 5.7 Move and reorder controls

M1 uses the same explicit named actions for pointer and keyboard users inside
the task-action modal:

- `Move to Todo`, `Move to In Progress`, and `Move to Done` change status and
  append the task to the destination column.
- `Move before` and `Move after` reorder within the current status column.
- A successful move updates status/order as one user action, restores focus to
  the moved task, and announces its destination.
- Status choices use Phosphor `Circle`, `PlayCircle`, and `CheckCircle` with
  visible text. Order choices use `CaretUp` and `CaretDown` with visible text.
- Invalid actions are disabled with a visible reason such as `Current`,
  `Already first`, or `Already last`; they are not omitted.

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
| No notes | Inbox content area | Point to existing Quick note; do not duplicate create control |
| No goals | Home content area | Explain value and offer `Create goal` |
| No phases | Goal content area | Offer `Create phase` |
| No tasks | Active phase/column | Offer `Create task`; empty columns remain destinations |
| No checklist items | Task detail | Keep labeled quick-add visible and focusable |

The UI must never claim `Saved` before the repository write resolves.

### 5.9 Quick-note composer

- The composer is the first useful Home control after the skip link and shell.
  It appears before Inbox and Goals in both visual and DOM order.
- Use a visible `Quick note` label and a multiline plain-text textarea. The
  placeholder is an example, never the only label. A visible hint states
  `Control or Command + Enter to add`; Control+Enter and Meta+Enter
  (Command+Enter) submit, while Enter alone inserts a line.
- A visible `Add note` button provides the pointer and keyboard equivalent. It
  may include `Plus`, but the text label remains. While the write is pending it
  reads `Adding…`, prevents duplicate submission, and keeps the draft stable.
- Empty, whitespace-only, or trimmed bodies above 10,000 characters show an
  inline error connected with `aria-describedby`; the draft remains available
  and no note is written.
- Capture defaults to no link. `LinkSimple` plus visible `Add link` text expands
  optional controls without moving focus or blocking unlinked submission.
  Select `No link`, `Goal`, or `Task`; Goal reveals a labeled goal selector,
  while Task reveals a goal selector followed by a task selector whose option
  text includes phase and task title. Selecting a task stores only task
  identity. Duplicate titles remain distinguishable by Goal / Phase / Task
  context.
- If link choices are unavailable or fail to load, explain that the note can
  still be added without a link. Never disable the body or unlinked Add action
  because optional context is unavailable.
- Success clears the composer, appends the note to the inbox, focuses the new
  note container, and announces `Note added`. Failure preserves the draft and
  link choice, states that nothing was saved, and exposes Retry beside the
  composer.

### 5.10 Inbox and note card

- M2 renders a single `Inbox` section containing the written label and a
  tabular note count. Its item structure leaves room for a later kind/status
  slot, but M2 renders no empty slot, fake reminder, or visible filter.
- Empty copy is `No notes yet. Add one with Quick note.` It does not repeat a
  second create control.
- Notes form one ordered list. Each card shows the full plain-text body with
  preserved line breaks, semantic updated time, and optional non-interactive
  context text such as `Goal: Ship M2` or
  `Task: Ship M2 / Foundation / Add storage`. Link context does not promise
  navigation in M2.
- Note text uses `white-space: pre-wrap` and `overflow-wrap: anywhere`; long
  content never creates page-level horizontal scrolling. The card uses
  `surface.1`, a one-pixel border, and no note-color treatment so Goal pins
  remain visually distinctive.
- `PencilSimple` opens the edit-note dialog. The dialog contains a labeled
  textarea and the same optional-link controls as capture. Control+Enter,
  Meta+Enter (Command+Enter), or visible `Save changes` commits; Enter alone
  adds a line; Escape cancels when no save is pending. Failed save keeps the
  draft and the last persisted card visible until Retry succeeds or Cancel
  closes the dialog.
- `DotsThree` opens named note actions. `Move before` and `Move after` use
  `CaretUp` / `CaretDown`, visible text, and disabled reasons `Already first`
  or `Already last`. Success restores focus to the moved note action trigger
  and announces its new ordinal position. Failure preserves order and offers
  Retry.
- `Delete note` is text-labeled, visually separated, and may be supported by
  `TrashSimple`; it opens a focused replacement confirmation dialog naming a
  plain-text excerpt from the first non-empty line, truncated to 80 characters
  with an ellipsis when needed. `Cancel` and `Delete note` remain visible.
  Cancel or Escape writes nothing and returns focus to that note's DotsThree
  trigger. Confirmed deletion has no undo. Failure leaves the note and order
  unchanged and keeps `Retry` in the confirmation.
- After successful deletion, focus moves to the next note's action trigger,
  otherwise the previous note's trigger, otherwise the Quick note field. Notes
  never disappear because of age, task status, checklist state, or future
  reminder filtering.

### 5.11 Task-detail dialog

- The task title becomes a native button named
  `Open task details for <title>`. Its visible treatment remains the task title,
  not a new persistent icon. Pointer click, Enter, and Space produce the same
  result without replacing the existing PencilSimple rename or DotsThree task
  actions.
- Use one modal `dialog` implementation with responsive presentation. At
  `>=1200px` it is a right-aligned `480px` side sheet; from `720–1199px` it is a
  centered dialog no wider than `640px`; below `720px` it is a viewport-contained
  full-screen surface. The backdrop makes the board inert, and the panel owns
  its vertical scroll so focus is never hidden behind its header or footer.
- The header shows the task title, written current status, and an `X` control
  named `Close task details`. M2 does not add a second title editor, status
  picker, deadline, description, priority, or delete action; existing card
  controls remain authoritative.
- The task card shows `ListChecks` plus visible `completed / total` text only
  when checklist items exist. Task detail always shows the derived progress,
  including `0 / 0 complete` in the empty state. Progress and checkbox state
  never imply task status.
- On open, an empty checklist focuses its quick-add field. A populated checklist
  focuses the dialog heading with `tabindex="-1"` so the title and context are
  announced before item controls. Escape closes only when no save is pending;
  close always returns focus to the exact task-title button that opened it.
- Closing with an invalid or failed checklist draft keeps the draft available
  if the dialog remains open. If a close would discard an unsaved draft, require
  explicit confirmation instead of silently losing it.

### 5.12 Checklist

- A `Checklist` heading, visible `completed / total complete` text, labeled
  single-line `Add checklist item` input, and visible `Add item` action precede
  the ordered list. Enter submits; Escape follows the task-detail close policy
  and never silently discards a non-empty draft.
- Trim before validation. Empty, whitespace-only, or over-240-character titles
  show inline error, retain input, and write nothing. A valid item appends,
  starts unchecked, focuses its native checkbox, and announces the new item.
- Each row contains one native checkbox and a visible text label. Checked rows
  retain full readable text and add a written/assistive completed state; color
  or strikethrough may support but never replace checkbox semantics. The label
  and checkbox form one click target at least `44px` high.
- A toggle disables only the pending checkbox, exposes a quiet saving state,
  and updates progress only from the committed snapshot. Failure restores the
  persisted checked state, retains focus on that checkbox, and presents Retry
  adjacent to the row.
- Checklist completion never changes the task status or `completedAt`; moving a
  task to Done never checks an item. Checklist items never render as board
  cards.
- M2 exposes no checklist PencilSimple, DotsThree, drag handle, delete action,
  or reorder control. Rename, reorder, and deletion require a later PM decision.

## 6. Functional screens

### 6.1 Home — no notes or goals

Order:

1. Labeled Quick note composer and optional link disclosure.
2. `Inbox` heading, count `0`, and `No notes yet. Add one with Quick note.`
3. `Goals` heading and Plus icon.
4. Empty message: `No goals yet.`

The Quick note textarea is the first useful focus target. It remains usable with
no goal/task link choices. The Goals Plus opens the existing create-goal modal;
invalid note and goal submissions remain in their own fields for correction.

### 6.2 Home — populated

- Quick capture, Inbox, and Goals keep the same visual and DOM order at every
  width. Notes append in persisted order and do not auto-sort by updated time.
- Inbox has one plain-text ordered list with visible count, updated times,
  optional context, PencilSimple edit, and DotsThree actions. It has no M2
  filter, reminder row, or completed-note treatment.
- Goal pins use `repeat(auto-fit, minmax(240px, 1fr))` with a practical maximum
  width around `360px` so a single goal does not become a banner.
- DOM/tab order matches persisted goal order.
- Double-clicking a card opens it. Enter or Space on the focused card produces
  the same result; no pointer-only dependency is introduced.
- PencilSimple appears on hover/focus and opens the rename modal.
- Opening a Goal records/restores Home scroll position when navigating back.
- Goal archive/delete remains absent, and Home adds no decorative dashboard
  widget around the functional M2 surfaces.

### 6.3 Goal detail — no phases

- Back icon, goal title, PencilSimple, and Plus remain visible.
- The board is replaced by a focused empty state; Plus opens create phase.
- Do not render three meaningless empty columns before a phase exists.

### 6.4 Goal detail — phase without tasks

- Active phase appears in the phase rail.
- Three empty status columns are visible because they teach the fixed workflow
  and are valid destinations.
- The Plus icon beside the active phase opens the task modal and defaults the
  new task to Todo.

### 6.5 Goal detail — populated board

- The active phase is explicit in the rail and route/application state.
- Every task appears in exactly one status column.
- Create/rename modal flows and the pointer/keyboard task-action modal expose
  saving/saved/failure feedback.
- Each task title is the native trigger for task detail. Cards with checklist
  data show visible `completed / total` progress without changing column/status
  treatment.
- Cross-status moves append to the destination column deterministically.
- Reopening New Tab renders the persisted goal, phase, task, status, and order
  without celebratory or onboarding interruption.

### 6.6 Task detail — empty and populated checklist

- Empty detail shows task title, current written status, `0 / 0 complete`, the
  labeled Add checklist item field, and `No checklist items yet. Add the first
  step.` The quick-add field receives initial focus.
- Populated detail shows committed progress and one native checkbox/label row
  per persisted item in position order. Opening focuses the detail heading;
  successful creation focuses the new checkbox.
- Toggle progress changes only after the item write commits. A failed create or
  toggle keeps the persisted list trustworthy, retains the draft/focus context,
  and presents Retry in the same panel.
- Closing and reopening the New Tab restores item order/state and recomputes
  progress without changing task status.

### 6.7 Local storage failure

- Keep unsaved goal/task/note/checklist draft state in memory.
- Show a persistent page-level `Changes are not saved` banner and an adjacent
  error at the failed edit.
- Offer `Retry`. Do not offer export in M2 because backup export is not yet
  implemented.
- Navigation away from an unsaved edit requires an explicit warning if it would
  discard the draft.

## 7. Responsive behavior

Breakpoints are implementation starting points and must be adjusted through
content stress tests, not device-name assumptions.

| Range | Home | Goal board | Task detail |
| --- | --- | --- | --- |
| `>= 1200px` | Composer and one-column Inbox precede 3–5 goal pins | Three columns share available width; minimum `280px` each | Right-aligned `480px` modal side sheet |
| `720px–1199px` | Same order; 2–3 goal pins | Three-column board scrolls horizontally when needed | Centered modal, max `640px` and viewport-contained |
| `< 720px` | Same order; one goal pin per row | Horizontal board with sticky column headings; no page-level horizontal overflow outside board | Full dynamic-viewport dialog/page with internal vertical scroll |

- The phase rail and board are separate horizontal scroll regions with visible
  edges/labels; nested scrolling must not hide the active phase.
- Quick capture and Inbox use document flow, not a nested vertical scroller.
  Note order, line breaks, and full text remain readable; `overflow-wrap:
  anywhere` contains long tokens.
- On narrow widths, create/edit dialogs stay within the viewport and task-action
  options collapse without horizontal overflow.
- The task-detail header remains visible without covering focused controls; its
  content padding reserves space for any sticky header/footer. Closing the panel
  restores the board scroll position and exact task-title trigger.
- Goal title and actions wrap into two rows before controls shrink below `44px`.
- At `200%` zoom, quick capture, note edit/reorder/delete, task detail,
  checklist add/toggle, and all M1 actions remain reachable without overlap or
  page-level horizontal scrolling.

## 8. Keyboard, focus, and announcements

### Page entry

- A skip link moves focus to main content.
- Home focus order begins with Quick note, its Add note/link controls, Inbox
  notes/actions in persisted order, then Create goal and Goal pins. Goal detail
  begins with `Back to goals`, then goal title/action, phase rail, board, and
  card controls in visual order.
- No element receives surprise programmatic focus after hydration.

### Editing

- Plus/PencilSimple opens the appropriate modal and focuses its labeled input.
- Enter submits single-line create/rename; Escape closes when no save is pending.
- Closing returns focus to the trigger; successful creation may instead focus
  the created entity.
- Successful creation focuses the created entity or its title control.
- Failed creation keeps focus in the invalid/failed field and connects error text
  through `aria-describedby`.
- In Quick note and note edit, Enter inserts a line; Control/Command + Enter
  commits (`Meta+Enter` is Command+Enter on macOS). Add note/Save changes provide
  the same visible action. Checklist quick-add is single-line and Enter commits.
- Optional link disclosure receives focus only when the user opens it. Changing,
  removing, or failing to load a link never traps focus or disables unlinked
  capture.

### Task detail and checklist

- Pointer click, Enter, or Space on a task-title button opens detail. Empty
  detail focuses quick-add; populated detail focuses its heading.
- Tab stays inside the modal detail. A successful checklist create focuses the
  new native checkbox; a failed create keeps focus in the input; a failed toggle
  returns focus to the same checkbox after restoring its persisted state.
- Escape closes a clean, idle detail and returns focus to the exact task-title
  button. Saving blocks dismissal; a non-empty unsaved draft requires explicit
  discard confirmation.

### Moving

- DotsThree opens `Task actions`; every option keeps a context-rich accessible
  name, for example `Move Build shell to Done`.
- Move success announcement includes task, status, and ordinal position.
- Pointer and keyboard activation of a named move return focus to the same task.
- Do not use unmodified arrow keys to move tasks while they are reading/navigation
  keys. If a future direct reorder mode is added, it must be explicitly entered
  and announced.
- Note reorder uses only named `Move before` and `Move after` buttons in its
  action dialog. Success returns focus to that note's DotsThree trigger; no
  unmodified arrow-key or drag gesture changes note order.

### Focus appearance

- Every interactive element uses a visible `2px` focus ring with at least `2px`
  offset from its border.
- Focus is never removed just because pointer users prefer a quieter outline;
  use `:focus-visible` for keyboard-specific treatment.
- A scrolled task/phase is brought fully into view when it receives focus.

### Live regions

- Use one polite region for create, rename, save, move, note, and checklist
  success.
- Use an assertive region only when a failed save risks data loss.
- Checkbox state is already announced by its native control; announce the
  committed result/progress once, not on both click and snapshot refresh.
- Do not announce skeleton rows, every hover, or repeated `Saved` messages.

## 9. Required state matrix

Every M2 component review must cover the following where applicable:

| Category | States |
| --- | --- |
| Data | loading, empty, populated, malformed-record isolation if surfaced |
| Control | rest, hover, focus-visible, pressed, disabled, busy |
| Edit | pristine, dirty, invalid, saving, saved, save failed, retrying |
| Navigation | inactive, current, returning with restored focus/scroll |
| Move | available, invalid, moving, moved, move failed |
| Note | no link, goal link, task link, editing, reordered, delete confirming, delete failed |
| Checklist | empty, populated, unchecked, checked, creating, toggling, failed, retrying |
| Detail | closed, opening, wide sheet, narrow/full-screen, clean, unsaved draft, closing |
| Storage | available, write pending, write failed, unavailable/quota exceeded |
| Motion | default, reduced motion |

Archived, overdue, fired reminder, visible inbox-filter, import, backup, restore,
deadline, and checklist rename/reorder/delete states remain deferred and are not
M2 implementation claims.

## 10. Accessibility acceptance

- Text and interactive components meet WCAG 2.2 AA contrast targets.
- Status, current phase, selection, and errors have non-color cues.
- All core actions are keyboard operable with a logical focus order.
- Touch/pointer targets are at least `44px × 44px` or have equivalent hit area.
- Zoom to `200%` does not hide note capture/edit/reorder/delete, task-detail,
  checklist add/toggle, or retained M1 actions.
- Native checkboxes expose checked state; checklist progress and note links use
  written context and do not rely on icon/color alone.
- Modal task detail and note dialogs keep focus inside, keep focused controls
  unobscured, and restore a stable trigger on close.
- Reduced motion removes nonessential transition and any decorative transform.
- Goal/task titles remain text, never rasterized pixel art.
- Timestamps use semantic `time` elements with machine-readable values and clear
  visible labels.

## 11. Content voice

- Short, direct, and specific: `Create goal`, `Rename phase`, `Move to Done`.
- Resting UI avoids implementation reassurance such as `Local only` and
  repeated navigation labels. Tooltips name compact icon triggers.
- Use sentence case except short pixel labels such as `TODO`.
- Explain consequences before risky future actions; do not rely on iconography.
- Local-first copy is factual: `Saved on this device`, not `Synced` or `Online`.
- Error copy states what remains safe and what the user can do next.

Examples:

- Empty: `No goals yet. Create one to start planning.`
- Empty inbox: `No notes yet. Add one with Quick note.`
- Empty checklist: `No checklist items yet. Add the first step.`
- Saving: `Saving on this device…`
- Saved: `Saved on this device.`
- Validation: `Enter a goal title.`
- Note validation: `Enter a note.` / `Keep the note at 10,000 characters or fewer.`
- Checklist validation: `Enter a checklist item.`
- Delete: `Delete this note? This cannot be undone.`
- Failure: `This change was not saved. Your draft is still here.`

## 12. M2 handoff and deferred polish

M2 extends the completed M1 shell without redesigning it. Implementation should
consume the semantic tokens and interaction contracts above while keeping visual
work deliberately functional; final hardening remains M6.

Retained from M1:

- Dark flat shell and readable typography.
- Original code-native Goal pixel pin.
- Goal/phase/task create and rename modal states with Phosphor icon triggers.
- Fixed-status board with a compact task-action modal and pointer/keyboard named
  move/reorder actions.
- Header reduced to My Tracker and the visibly deferred search placeholder.
- Loading, empty, invalid, saving, saved, save-failed, and storage-failed states.
- Focus, announcements, reduced-motion baseline, and responsive fallback.
- Cross-status append and within-column before/after behavior.

Required in M2:

- Quick note first in Home order, multiline keyboard capture, optional
  progressively disclosed goal/task link, and no-link fallback.
- Plain-text Inbox with count, empty/populated states, stable appended order,
  timestamps, optional context, edit, named adjacent reorder, and confirmed
  deletion without undo.
- Native task-title detail trigger plus responsive modal side-sheet/full-screen
  presentation and exact focus restoration.
- Checklist progress, single-line quick-add, native check/uncheck, append order,
  failure rollback/retry, and independence from task status.
- Loading, invalid, saving, saved, failed, retry, delete-confirmation, empty,
  narrow, 200% zoom, keyboard-only, and reduced-motion states.
- No visible filter, reminder, deadline, task-description/priority, or fake data
  affordance.

Deferred:

- Final visual polish and stress tuning (M6).
- Drag-and-drop, goal/phase reordering UI, archive, and permanent deletion policy.
- Reminders, mixed-kind inbox filters, fired/overdue states, deadlines,
  checklist rename/reorder/delete, note conversion, search, import, backup, and
  restore surfaces.
- Additional note-color controls, decorative variations, and richer transitions.

Future work may refine tokens after implementation evidence, but it must preserve
the calm local-first character, accessible interaction contract, and original
pixel-pin identity.
