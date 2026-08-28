# M1 durable goal vertical slice

## Status

In progress. This item is ready for implementation, but the milestone is not complete until Dev supplies the required build and test evidence and QA independently passes the exit gate.

## User outcome

The owner can open a My Tracker New Tab, create a goal with a phase and task, move and reorder that task in the three-status workflow, close the page, and reopen it without losing hierarchy, order, or status.

## Why now

This is the smallest end-to-end slice that proves the riskiest early invariant: application use cases can preserve the documented `Goal -> Phase -> Task` hierarchy in local IndexedDB storage while a Manifest V3 New Tab UI remains usable without a network dependency.

## Locked decisions

- The product is a manually installed Chrome Manifest V3 New Tab extension.
- M1 is local-only and adds no account, network access, telemetry, runtime AI, host permission, alarm, or notification behavior.
- Domain logic remains independent of React, WXT, Chrome APIs, and IndexedDB.
- Presentation invokes application use cases; it never reads or writes IndexedDB directly.
- Task statuses are exactly `todo`, `in_progress`, and `done`.
- A task belongs to exactly one goal and one phase, and its `goalId` must match the goal that owns its phase.
- Cross-status movement appends the task to the destination column. Reordering before or after another task changes order only within the current phase and status.
- Public AI-plan and backup JSON Schemas remain unchanged in M1.
- M1 UI is functional rather than visually final. The personalized design documentation guides the shell and core states after Design completes it; final visual polish remains M6 work.

## In scope

- A WXT/React New Tab shell that can be built for unpacked Chrome installation.
- Domain entities, invariants, repository ports, application use cases, and IndexedDB adapters for goals, phases, and tasks.
- Create and title-only rename operations for goals, phases, and tasks.
- Deterministic sibling positions and task movement between the three fixed statuses.
- A minimal home/goal/phase/board presentation sufficient to run the acceptance journey.
- Pointer-operable and keyboard-operable named controls for task status movement and within-column reordering.
- Loading, empty, invalid-input, save-failed, retry, saved, and persisted-after-reopen states.
- Unit, IndexedDB integration, production-build, and unpacked-Chrome acceptance evidence.
- Local unpacked-installation instructions.

## Out of scope

- Goal archival, restoration, permanent deletion, and any cascade-delete behavior.
- Phase or task deletion, including the non-empty-phase removal decision.
- Goal and phase reordering UI.
- Moving tasks between phases.
- Descriptions, priorities exposed in UI, deadlines, task notifications, checklist items, notes, reminders, settings, import, export, and restore.
- Drag-and-drop as an M1 exit requirement. Named move/reorder controls satisfy the functional pointer and keyboard paths; richer drag behavior remains a later UI refinement.
- Final typography, animation, responsive polish, acceptance screenshots, and complete design-system implementation.
- Chrome Web Store publication or any remote deployment.

## Preconditions

- `README.md`, `docs/PRODUCT_BRIEF.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATA_CONTRACT.md`, `docs/DECISIONS.md`, and the public schemas remain the product and data-contract sources of truth.
- Design finishes the personalized `DESIGN.md` and related design documentation before Dev treats presentation styling or detailed layout as stable.
- Dev may proceed immediately with domain, application, persistence, and test work because the business rules below do not depend on final visual choices.

## Functional rules

### Titles

- Goal, phase, and task titles are trimmed before validation and persistence.
- A title must contain a non-whitespace character and be at most 240 characters after trimming, matching the committed public contract.
- Duplicate titles are allowed; identity comes from stable opaque IDs, not titles.
- Invalid input produces an inline error and performs no write.

### Creation defaults

- A new goal is `active` and is appended after existing goals.
- A new phase is appended after existing phases in its goal.
- A new task is created in `todo`, with priority `medium`, `notifyAtDue: true`, no deadline, no `completedAt`, and a position appended after existing `todo` tasks in its phase.
- Created entities receive stable opaque IDs plus UTC `createdAt` and `updatedAt` timestamps.

### Rename

- Rename changes only the selected entity title and its `updatedAt` timestamp.
- A failed rename leaves the last persisted title intact and keeps the attempted value available for correction or retry.

### Task move and order

- Board queries and ordering are scoped to the selected phase.
- A cross-status move updates the task status, appends it after current destination siblings, and normalizes source and destination positions to unique contiguous non-negative integers.
- Moving a task to `done` sets `completedAt`; moving it out of `done` clears `completedAt`.
- Reordering before or after another task is valid only when both tasks belong to the same phase and status.
- A move targeting an unknown task, phase, goal, status, or invalid sibling relationship is rejected without partial writes.
- Any multi-record position update occurs in one storage transaction.

## Acceptance criteria

### Shell and local-only boundary

1. A production build can be loaded unpacked in Chrome and its New Tab override opens My Tracker.
2. The acceptance journey performs no network request and requires no account or external service.
3. A widget or storage failure produces a visible recoverable state rather than a blank page.

### Empty and loading states

4. Before IndexedDB loading resolves, the UI shows a loading state and does not briefly present a false empty dataset.
5. With no goals, the user sees a clear empty state and an operable Create goal action.
6. A goal with no phases offers Add phase. A phase with no tasks still shows Todo, In Progress, and Done as valid empty columns and offers Add task.

### Create and edit

7. The owner can create a valid goal, open it, add a valid phase, select it, and add a valid task without using a mouse.
8. The owner can rename each created goal, phase, and task, and the persisted UI reflects the trimmed title.
9. Empty, whitespace-only, and over-240-character titles show an inline error, preserve the editable value, and write no entity or partial hierarchy.
10. Titles render as text and are never evaluated as HTML or code.

### Hierarchy, movement, and order

11. A task cannot be created for a missing phase or with a `goalId` inconsistent with its phase.
12. The board exposes exactly Todo, In Progress, and Done.
13. The owner can move a task from Todo to In Progress through a pointer-operable named control and through keyboard operation of the same behavior.
14. A cross-status move appends to the destination; before/after controls reorder within a column; the result remains deterministic after reload.
15. After a keyboard move or reorder, focus remains on the moved task or an equivalent stable task control, and a concise status change is exposed to assistive technology.
16. Completing and reopening a task applies the documented `completedAt` rule without changing its phase or silently changing any unrelated record.

### Persistence and recovery

17. Closing and reopening New Tab restores goal, phase, task, titles, task status, and sibling order from IndexedDB. Persisting the previously selected view is not required.
18. Simulated repository failure during create, rename, or move leaves the previously persisted dataset consistent, reports Save failed, retains user input where applicable, and provides a retry path.
19. Failed multi-record movement or normalization commits none of its writes.
20. Initial database creation and subsequent reopen preserve records without a migration or schema-version error.

### Scope and packaging

21. The production manifest requests no permission or host access unnecessary for this M1 journey.
22. Installation documentation identifies the exact production-build directory to load unpacked and the reopen scenario to exercise.

## Data and schema impact

- M1 introduces the initial internal IndexedDB database version with normalized `goals`, `phases`, and `tasks` stores behind repository interfaces.
- Required lookup behavior includes ordered goals, phases by `goalId`, and tasks by `phaseId` plus `status` and `position`. Exact IndexedDB index names are infrastructure details.
- Local entity fields align with `docs/DATA_CONTRACT.md` and the backup schema even though backup export is deferred. Optional descriptions, colors, and deadlines may remain absent.
- The initial database initializer and repository transaction behavior require integration tests. Any later database-version change requires a forward migration and old-version fixture.
- No public import/export schema, example, or format version changes in this work item.

## Functional UX and accessibility expectations

- The functional shell follows the hierarchy Home -> Goal -> Phase -> three-column board. Route shape and visual composition may follow the approved Design output without changing entity semantics.
- Create and rename controls have visible labels, visible focus, inline validation, and an explicit saving/saved/failed state where persistence is not immediate.
- Enter submits a valid focused create/rename form. Escape cancels editing and restores the last persisted value.
- Every task move/reorder action has an explicit accessible name containing the task and destination or direction.
- Status is communicated by column heading and text, not color alone.
- Empty columns remain understandable and operable without a pointer.
- M1 does not gate on pixel-perfect styling, decorative rotation, motion, or drag sensors. Those choices must not reduce keyboard access or readability when added later.

## Verification plan and required evidence

### Dev evidence

- Unit tests: title validation, creation defaults, parent consistency, exact status set, completed-state transition, append-on-status-move, within-column reorder, and invalid-move rejection.
- Integration tests against an isolated disposable IndexedDB implementation: CRUD persistence, hierarchy queries, transaction rollback, position normalization, and close/reopen behavior.
- Repository-configured lint, type-check, test, and production build commands.
- Manifest inspection for the New Tab override, permissions, and host permissions.
- Unpacked-installation instructions and the resolved build-directory path.

### QA evidence

QA records scenarios using `docs/agents/QA_AGENT.md` for:

1. Empty store -> create goal -> add phase -> add task.
2. Pointer-operable move Todo -> In Progress and before/after reorder.
3. Keyboard-only create, rename, move, and reorder with visible focus.
4. Invalid-title rejection with no write.
5. Simulated save/transaction failure with no partial state and successful retry.
6. Close/reopen New Tab persistence in a real unpacked Chrome profile.
7. Production journey with no observed network request or undocumented permission.

M1 remains `in progress` until QA links evidence for these scenarios and recommends pass.

## Handoffs

### PM -> Design

- Objective and scope source: this work item plus `docs/ROADMAP.md` M1.
- Locked behavior: title-only create/rename, fixed status board, append-on-cross-status move, within-column before/after reorder, functional error/empty/persistence states.
- Design-owned files: `DESIGN.md`, `docs/UX_SPEC.md`, and any other explicitly design-scoped documentation.
- Do not expand M1 into deletion, goal/phase reorder, drag-and-drop implementation, or final polish.

### PM -> Dev

- Objective and acceptance source: this work item.
- Start with domain rules, repository ports, IndexedDB integration, and application use cases; implement only the minimal UI needed to expose the acceptance path after Design documentation is stable.
- Expected technical files: WXT/package scaffold, domain/application/infrastructure modules, New Tab entrypoint, tests, and unpacked-installation documentation.
- Stop and return to PM if implementation requires changing entity semantics, public schemas, permissions, or the deferred deletion policy.

### Dev -> QA

- Provide the production build identifier/path, exact verification commands and results, browser/profile preconditions, seeded or setup steps, and any fault-injection mechanism used for save/transaction failures.
- Identify unverified browser behavior and link implementation changes to the numbered acceptance criteria above.

## Dependencies and open questions

- Dev owns the technical choice between native IndexedDB APIs and a thin maintained wrapper. Before adding a production dependency, document why platform APIs and existing dependencies are insufficient and record the implementation decision in `docs/DECISIONS.md`.
- The drag-and-drop library remains deferred to a later UI/accessibility spike; named controls are the M1 baseline.
- No product question currently requires owner input. Any proposed change to deletion semantics, public data contracts, permissions, or the local-only boundary must return to PM and may require owner approval.
