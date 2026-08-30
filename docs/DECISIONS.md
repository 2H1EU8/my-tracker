# Decision log

This file records approved product and architecture decisions. Update it when a decision changes; do not silently rewrite history.

## D-001 — Chrome New Tab is the MVP surface

- Date: 2026-08-28
- Status: accepted
- Decision: Build a Chrome Manifest V3 extension that replaces New Tab and is installed manually/unpacked for the MVP.
- Rationale: It keeps the tracker available in the owner's existing workflow and minimizes distribution scope.
- Consequence: New Tab performance is a core quality attribute; Chrome Web Store work is deferred.

## D-002 — Local-only MVP

- Date: 2026-08-28
- Status: accepted
- Decision: No account, backend, cloud sync, analytics, collaboration, runtime AI, or third-party integration.
- Rationale: Privacy, speed, and personal workflow are more valuable than cross-device behavior for MVP.
- Consequence: Export/restore is required for backup; uninstall can otherwise remove data.

## D-003 — Four-level project model

- Date: 2026-08-28
- Status: accepted
- Decision: Use `Goal -> Phase -> Task -> Checklist item`.
- Rationale: This represents a large AI coding plan without making small steps full Kanban cards.
- Consequence: Early wording “Big Task” maps to `Task`; “Small Task” maps to `Checklist item`.

## D-004 — Three fixed task statuses

- Date: 2026-08-28
- Status: accepted
- Decision: MVP statuses are `todo`, `in_progress`, and `done`.
- Rationale: The owner requested a basic personal workflow rather than Jira-level configuration.
- Consequence: Blocked state is expressed in task detail or notes until a future workflow decision.

## D-005 — Optional note/reminder linking

- Date: 2026-08-28
- Status: accepted
- Decision: Notes and reminders can link to a goal or task, but linking is never required.
- Rationale: Quick capture must remain low friction.

## D-006 — Fired reminders persist

- Date: 2026-08-28
- Status: accepted
- Decision: Reminders notify at their date/time and remain visible after firing until manually deleted.
- Rationale: Notification delivery is not equivalent to user acknowledgement.
- Consequence: Reminder state records `scheduled` or `fired`; no auto-cleanup job exists.

## D-007 — JSON Schema is the primary interchange foundation

- Date: 2026-08-28
- Status: accepted
- Decision: Use JSON Schema Draft 2020-12 with two formats: nested AI plan and normalized backup.
- Rationale: No single common task standard preserves the full product hierarchy. JSON is reliable for AI generation and programmatic validation.
- Consequence: iCalendar is a future lossy adapter, not the backup source of truth.

## D-008 — AI is external to the runtime MVP

- Date: 2026-08-28
- Status: accepted
- Decision: AI tools generate a JSON file outside My Tracker; the user reviews and imports it.
- Rationale: Avoids credentials, network access, provider lock-in, and an AI UI while solving manual re-entry.
- Consequence: Import preview and validation are mandatory. Runtime prompt execution is out of scope.

## D-009 — Persist domain data in IndexedDB behind repositories

- Date: 2026-08-28
- Status: accepted for implementation validation
- Decision: Use normalized IndexedDB stores behind application repository ports.
- Rationale: The hierarchy, transactions, indexed due-time lookup, and potentially large AI plans are a better fit than independent whole-array storage keys.
- Consequence: A small implementation spike must validate the chosen IndexedDB wrapper, migration ergonomics, and service-worker access before broad feature work.

## D-010 — Chrome alarms are derived state

- Date: 2026-08-28
- Status: accepted
- Decision: Persist reminders/deadlines as truth and reconcile `chrome.alarms`; use `chrome.notifications` on due events.
- Rationale: Manifest V3 service workers are ephemeral and alarms may be lost or delayed.
- Consequence: Startup, edit, delete, and restore paths require reconciliation tests.

## D-011 — Calm dark UI with restrained pixel styling

- Date: 2026-08-28
- Status: accepted
- Decision: Use dark low-glare surfaces, sticky-note goal cards, and pixel accents without sacrificing readable body type or accessibility.
- Rationale: Matches the requested focused vibe while keeping daily use practical.

## D-012 — English project documentation

- Date: 2026-08-28
- Status: accepted
- Decision: Project and agent documentation is written in English.
- Rationale: The owner selected English for durable technical artifacts.

## D-013 — Use native IndexedDB for the M1 adapter

- Date: 2026-08-28
- Status: accepted for M1
- Decision: Implement database version 1 with the browser's native IndexedDB API behind typed repository and transaction ports. M1 creates normalized `goals`, `phases`, and `tasks` stores without a production storage dependency.
- Rationale: Three stores and the M1 transaction patterns are small enough to keep the native adapter explicit, while focused integration tests can validate open, reopen, commit, and rollback behavior.
- Trade-off: Native request and transaction lifetimes require more adapter code and careful tests than a promise wrapper.
- Revisit trigger: Re-evaluate a thin maintained wrapper before M4/M5 if import/restore transactions, migrations, or measured maintenance cost make the native adapter materially harder to keep correct.

## D-014 — Minimal interaction language and Phosphor Icons

- Date: 2026-08-30
- Status: accepted
- Decision: Enforce minimalism as an interaction constraint. Resting screens use
  one primary icon trigger per context; create, rename, and secondary task
  actions open focused modal dialogs. All application icons come from the
  locally bundled `@phosphor-icons/react` package.
- Rationale: The completed M1 logic was sound, but persistent forms, repeated
  buttons, and implementation labels made the New Tab surface visually noisy
  and slow to scan. A single maintained icon family plus progressive disclosure
  gives Design and Dev one enforceable language without hiding validation or
  consequences.
- Dependency rationale: Platform glyphs, emoji, and hand-authored SVGs do not
  provide the approved consistent family or maintainable React API. The package
  is tree-shaken into the extension build, requires no runtime network request,
  and adds no Chrome permission.
- Consequence: Plus, PencilSimple, DotsThree, ArrowLeft, MagnifyingGlass, and the
  documented task-status icons are canonical. Icon-only triggers require
  accessible names, tooltips, visible focus, and 44 px hit targets. Modal
  commit/cancel/retry and destructive actions retain visible text.

## Deferred decisions

| Topic | Decide by | Default until decided |
| --- | --- | --- |
| IndexedDB wrapper revisit | M4 implementation start | Keep the tested native M1 adapter unless import/restore or migration complexity justifies a thin wrapper. |
| Drag-and-drop library | M1 UI spike | Require keyboard alternative and testability. |
| Runtime JSON Schema validator | M4 start | Must support Draft 2020-12 and actionable paths. |
| Import merge/update semantics | Post-MVP discovery | Create-only import. |
| iCalendar adapter scope | Post-MVP discovery | JSON only. |
| Numeric performance budgets | M6 after M1 baseline | Use seeded datasets and record baseline first. |
