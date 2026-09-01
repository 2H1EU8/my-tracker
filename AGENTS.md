# Project instructions for AI agents

## Mission

Build My Tracker as a fast, calm, local-first Chrome new-tab extension for personal notes, reminders, and visual planning of large projects.

Do not turn the MVP into a cloud product, collaboration platform, AI chat app, or Jira clone.

## Read before working

Read these sources in order:

1. `README.md`
2. `docs/PRODUCT_BRIEF.md`
3. `docs/PRD.md`
4. The document relevant to the task: `UX_SPEC.md`, `ARCHITECTURE.md`, or `DATA_CONTRACT.md`
5. `docs/DECISIONS.md`
6. The applicable role file under `docs/agents/`

Treat the JSON Schemas in `schemas/` as the machine-readable source of truth for import and export formats. If prose and a schema disagree, stop, report the conflict, and reconcile both in the same change.

## Product invariants

- MVP target: Chrome Manifest V3, installed manually as an unpacked extension.
- Primary surface: replacement New Tab page.
- Local-only by default; no account, network dependency, telemetry, or cloud sync.
- Core hierarchy: `Goal -> Phase -> Task -> Checklist item`.
- Checklist items are not independent Kanban cards.
- Default task statuses: `todo`, `in_progress`, `done`.
- A note or reminder may link to a goal or task, but linking is optional.
- A fired reminder remains visible until the user deletes it.
- A task deadline includes date and time. Overdue tasks remain visible.
- AI is outside the runtime MVP. AI-generated plans enter through a reviewed, schema-validated file import.
- Exported backups must remain usable across compatible future application versions.

## Engineering boundaries

- Keep domain logic independent from React, WXT, Chrome APIs, and storage implementations.
- Access persistence only through repository interfaces. UI components must not call IndexedDB or `chrome.storage` directly.
- Treat IndexedDB records as local projections of the documented domain model, not as the public interchange format.
- Treat persisted reminder records as the source of truth. `chrome.alarms` entries are a derived scheduling mechanism and must be reconciled on startup.
- Register Manifest V3 background listeners synchronously at module startup.
- Never depend on service-worker global variables, `setTimeout`, or `setInterval` for durable reminder state.
- Parse imported JSON as untrusted input. Validate the complete document before writing any record.
- Import must be atomic from the user's perspective: all accepted data is written or none is.
- Never evaluate imported text as code, HTML, Markdown with unsafe HTML, or agent instructions.
- Preserve stable identifiers and timestamps during backup restore. Generate new local identifiers for AI-plan imports unless a safe merge key is explicitly supplied.
- Schema changes require a migration plan, backward-compatibility notes, updated examples, and an entry in `docs/DECISIONS.md`.
- Do not add a production dependency without documenting why platform APIs and existing dependencies are insufficient.

## UX boundaries

- Optimize New Tab for fast load and keyboard-first capture.
- Preserve the calm dark, pixel-accented visual direction in `docs/UX_SPEC.md`.
- Pixel styling must not reduce body-text readability or accessibility.
- Drag-and-drop must always have a keyboard-accessible alternative.
- Do not hide destructive actions behind ambiguous icons. Confirm permanent bulk deletion and backup replacement.
- Do not auto-delete notes, tasks, or fired reminders.

## Required workflow

Before code changes:

1. State the user outcome and acceptance criteria.
2. Inspect affected callers, tests, types, schemas, and nearby patterns.
3. Identify the smallest end-to-end slice.
4. Record unresolved product questions instead of guessing across a product boundary.

During implementation:

1. Keep changes within one coherent slice.
2. Add or update tests with behavior changes.
3. Update affected documentation and schemas in the same change.
4. Preserve unrelated user work.

Before completion:

1. Run the narrowest relevant tests first.
2. Run configured lint, type-check, build, and broader tests when proportionate.
3. Exercise the acceptance scenario manually when browser behavior changed.
4. Review the final diff for unrelated changes.
5. Report checks run, failures, assumptions, and remaining risks.

After done any task or session:
- Clean up your temp file, scratch scripts,.. you make while implementation the task.
- Create a log-xxx.md in docs/agents/logs follow format:
```markdown
- Task: <Brief task description>
### Issues: <Brief issues description>

### The solution: <Listing the solutions the agent choose to solve issues>

### The changed: <Brief what you changed and the file you changed>

### Blocker: <Brief blocker>
```



## Definition of ready

A work item is ready for implementation only when it has:

- A user-visible outcome.
- In-scope and out-of-scope behavior.
- Acceptance criteria including empty, error, and persistence states.
- Data/schema impact.
- UX states and keyboard behavior when applicable.
- A verification plan.

If any of these materially changes the solution, the PM agent must resolve it before development.

## Definition of done

- Acceptance criteria pass.
- Data survives closing and reopening the New Tab page.
- Import changes reject invalid input without partial writes.
- Reminder changes account for browser restart and sleeping-device behavior.
- Relevant unit, integration, and end-to-end checks pass.
- Documentation and decision records match implemented behavior.
- No new remote access, permission, telemetry, or secret handling was introduced without explicit approval.

## Agent handoffs

- Discovery agent: resolves unknowns and updates durable decisions; does not invent product facts.
- PM agent: turns decisions into scoped, testable work items.
- Design agent: specifies interaction and visual states without changing product scope.
- Dev agent: implements only ready items and reports contract conflicts.
- QA agent: validates behavior, persistence, import safety, and reminder recovery.

Use `docs/agents/README.md` to select the role. Handoffs must reference repository artifacts, not chat-only conclusions.
