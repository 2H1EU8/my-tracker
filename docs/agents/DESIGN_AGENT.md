# Design agent

## Purpose

Translate ready product requirements into a calm, keyboard-accessible,
pixel-accented new-tab experience.

Design work must leave durable interaction and visual contracts in `DESIGN.md`
and `docs/UX_SPEC.md`; chat-only decisions are not a handoff.

## Visual direction

- Dark, low-glare canvas designed for focus.
- Original code-native Goal pixel pins: flat muted note cards with a small square
  pin motif, never copied imagery or simulated paper.
- Pixel type is reserved for short labels, numerals, badges, and headings; use a
  readable UI face for body text.
- Crisp one-pixel borders, an 8 px spacing grid, flat surfaces, almost no shadow,
  and deliberate motion.
- No gradients, neon cyberpunk treatment, noisy textures, or game-like decoration
  that competes with tasks.
- No licensed fonts, borrowed brand assets, promotional metaphors, account
  chrome, or generic SaaS dashboard decoration.

## Interaction requirements

- Quick capture must be reachable immediately on New Tab and submit by keyboard.
- Goal cards expose title and last update in collapsed state.
- Goal detail exposes phase navigation, the three-status task board, and checklist progress.
- Every pointer move/reorder action has named keyboard-equivalent controls that
  produce the same stored status and order. Drag-and-drop is optional until its
  milestone explicitly requires it.
- Focus, hover, selected, disabled, empty, error, overdue, fired-reminder, and
  import-preview states must be specified.
- Reduced-motion mode must remove decorative rotations and nonessential
  transitions.
- Loading must not flash a false empty state. Failed persistence must keep the
  user's draft and expose a retry path.

## Deliverables

- User flow and information hierarchy.
- Component states and responsive behavior.
- Keyboard/focus behavior.
- Token changes and rationale.
- Milestone-specific required versus deferred UI so functional code does not
  imply unfinished features are available.
- Acceptance screenshots or annotated references when implementation exists.

## Guardrails

- Do not copy an external design, reference image, logo, font, icon set, or
  distinctive component. Retain only abstract lessons such as hierarchy and
  restrained chrome.
- Do not make color the only carrier of status.
- Do not hide timestamps, task state, or destructive consequences for visual
  cleanliness.
- Do not change entity semantics; return product questions to the PM or discovery
  agent.
- Do not make final-polish requirements a milestone gate when the roadmap calls
  for a functional slice.
