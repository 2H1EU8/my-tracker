# Roadmap

## Delivery principle

Each milestone proves one risky product invariant end to end. Do not build all domain layers first and postpone user-visible verification.

## M0 — Documentation and contracts

Status: complete as a planning baseline.

Deliverables:

- Product brief, PRD, UX specification, architecture, data contract, roadmap, and research.
- Root `AGENTS.md` and specialist role instructions.
- AI-plan and backup JSON Schemas.
- Valid AI plan example and reusable generation prompt.

Exit gate:

- Documents agree on hierarchy, statuses, reminder lifecycle, local-only scope, and import/restore semantics.
- Machine-readable examples validate against their schemas.

## M1 — Durable goal vertical slice

Status: complete, with the 2026-08-30 minimal-interface refinement applied.
All 22 acceptance criteria pass, including the unpacked New Tab, real IndexedDB
reopen, and offline no-external-request gate.

Ready work item: [`docs/work-items/M1_DURABLE_GOAL_SLICE.md`](work-items/M1_DURABLE_GOAL_SLICE.md)

Outcome:

```text
Open New Tab -> create Goal -> add Phase -> add Task -> move Task -> reopen -> state remains
```

In scope:

- WXT Manifest V3 shell and React New Tab.
- Domain types and IndexedDB repositories for goal/phase/task.
- Title-only create/rename modal flows for goals, phases, and tasks, exposed by
  canonical Phosphor icon triggers.
- Three-column board with deterministic task status movement and within-column ordering through pointer-operable and keyboard-operable controls.
- Production build and unpacked installation instructions.

Out of scope:

- Notes, reminders, checklist items, deadlines, import/export, archive/delete flows, goal/phase reordering, drag-and-drop polish, and final visual polish.

Execution order:

- Dev may implement domain rules, repository ports, persistence, and application use cases while Design finishes the personalized design specification.
- The M1 UI follows the enforced minimal interaction language in `DESIGN.md`:
  a My Tracker/search shell, progressive-disclosure modals, and no resting
  implementation labels or expanded edit forms.
- Final visual-system refinement remains in M6 and must not delay business-logic verification.

Exit gate:

- The journey passes in a real unpacked Chrome profile using both pointer-operable and keyboard-operable task controls.
- Unit/integration tests prove hierarchy, move, order, and persistence.
- No network request in the journey.
- QA records independent evidence for empty, invalid-input, save-failure, and close/reopen persistence states and recommends pass.

## M2 — Checklist and personal inbox

Status: implementation complete and automated gates passing; real unpacked-Chrome
QA remains pending, so M2 is not yet accepted.

Ready work item: [`docs/work-items/M2_CHECKLIST_PERSONAL_INBOX.md`](work-items/M2_CHECKLIST_PERSONAL_INBOX.md)

Outcome:

Capture small work without opening a goal, and break tasks into checklists.

In scope:

- Quick notes and optional goal/task links.
- Checklist items in task detail.
- Inbox filtering and retained completed/fired states scaffolding.

M2 keeps the inbox boundary ready for filtering but shows no redundant Notes-only
filter control. Reminder records, visible mixed-kind filters, and fired-state
presentation remain part of the cohesive M3 reminder lifecycle slice rather than
appearing as nonfunctional M2 controls.

Exit gate:

- Notes and checklist data survive reopen/restart.
- Optional linking never blocks capture.
- Keyboard flows and empty/error states pass.

## M3 — Reminder delivery

Status: implementation complete and automated gates passing; real unpacked-Chrome QA remains pending, so M3 is not yet accepted.

Ready work item: [`docs/work-items/M3_REMINDER_DELIVERY.md`](work-items/M3_REMINDER_DELIVERY.md)

Outcome:

Create a date/time reminder or task deadline and receive a system notification even when New Tab is not open.

In scope:

- Background entrypoint.
- Alarm/notification adapters.
- Reminder state and alarm reconciliation.
- Overdue, sleep/wake, browser restart, edit, and delete behavior.

Exit gate:

- Real notification test passes in a dedicated Chrome profile.
- Missing/orphan alarm reconciliation tests pass.
- Fired reminder remains until manual deletion.
- Product copy discloses delivery limitations.

## M4 — AI plan import

Status: implementation complete and automated gates passing; QA validation remains pending.

Ready work item: [`docs/work-items/M4_AI_PLAN_IMPORT.md`](work-items/M4_AI_PLAN_IMPORT.md)

Outcome:

Generate a large plan externally, preview it, and create goals without retyping.

In scope:

- JSON file selection, schema and semantic validation.
- Preview and create-only import.
- Transactional writes and result summary.
- Error paths with no partial data.

Exit gate:

- Example plan imports with correct hierarchy/order.
- Invalid, duplicate-key, broken-reference, oversized, and transaction-failure cases write nothing.
- At least one real AI tool can follow the documented prompt and produce a valid file after review.

## M5 — Backup and restore

Status: implementation complete and automated gates passing; QA validation remains pending.

Ready work item: [`docs/work-items/M5_BACKUP_RESTORE.md`](work-items/M5_BACKUP_RESTORE.md)

Outcome:

Export the complete local state and restore it in a clean profile.

In scope:

- Deterministic backup export.
- Validate/preview/confirm replace restore.
- Database migration fixtures and post-restore alarm reconciliation.

Exit gate:

- Round-trip equivalence test passes.
- Clean-profile manual restore passes.
- Incompatible version and corrupted backup preserve existing data.

## M6 — Visual system and hardening

Outcome:

Make the product pleasant enough for daily New Tab use without weakening speed or accessibility.

In scope:

- Final tokens, pixel accents, sticky goal cards, responsive behavior.
- Reduced motion, keyboard polish, focus management.
- Seeded stress dataset and performance budget.
- Permission, Content Security Policy, and privacy audit.

Exit gate:

- WCAG 2.2 AA checks for core flows.
- Production stress dataset remains usable.
- No unnecessary permissions or network requests.
- Seven-day owner trial completed with issues recorded.

## M7 — Rich notes and view modal

Outcome:

Improve the note reading experience and support lightweight text formatting.

In scope:

- A dedicated view modal for reading notes, keeping the inbox view compact.
- The note composer continues to accept raw text.
- The view modal renders lightweight Markdown formatting (headings, checklists, blockquotes).
- Safe rendering using a sanitized library to prevent XSS (no arbitrary HTML execution).

Exit gate:

- Note view modal opens on note click and is fully keyboard accessible.
- Markdown syntax renders correctly as headings, checklists, or blockquotes in the view modal.
- Cross-Site Scripting (XSS) prevention is validated.

## Post-MVP candidates

These require fresh discovery and are not commitments:

- AI-plan merge/update protocol.
- iCalendar `VTODO` import/export adapter.
- Recurring reminders and snooze.
- User-configurable status workflow.
- Cloud or peer sync with explicit conflict semantics.
- External PM integrations.
- Chrome Web Store packaging and policy review.
- Filter inbox/quick notes by date.
