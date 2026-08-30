# M1 QA test plan

## Status

`Pass` as of 2026-08-30. Automated/static execution, the production-bundle
preflight, the final unpacked New Tab/offline Chrome acceptance run, and the
minimal-interface regression below are complete. The prior environment-only
blocker is resolved and M1 is ready to hand off to M2.

This document defines independent QA coverage and records the combined execution
evidence for the M1 durable goal vertical slice. The 2026-08-28 blocked report is
retained as historical evidence and is superseded by the owner-authorized final
acceptance run below.

## Minimal-interface regression — 2026-08-30

This regression covers the owner-requested M1 UI refinement without changing
the accepted hierarchy, storage, ordering, or status behavior.

- Production directory: `.output/chrome-mv3`.
- Manifest SHA-256:
  `7cc10705cdbc6f95aa3151b6345cdbb0486df94bbb1284815cb383da66f8cb15`.
- New Tab bundle SHA-256:
  `1d5a241a067f2e5ef88f45d2299ab27dcdf2c05aaae0a8eb164fbddb43344921`.
- Generated CSS SHA-256:
  `65416a2bafcc78ebb2139f25704a4aeb4d17216b4bf3a7301e255449c125a7c6`.

Automated results against this exact workspace:

- Type-check passed.
- Unit suite passed: 11/11.
- IndexedDB integration suite passed: 5/5.
- Full suite passed: 16/16.
- Production build passed; the generated manifest still has empty
  `permissions` and `host_permissions`.
- `git diff --check` passed.

Observed in connected Chrome against the exact production bundle served from
loopback, using an isolated loopback origin rather than the installed
extension's IndexedDB:

- Desktop and 390-by-844 responsive layouts show only `My Tracker`, the
  deferred Search field, current section context, and essential icon triggers.
  The removed implementation labels and expanded forms do not appear.
- Plus opens labeled Goal, Phase, and Task dialogs. Empty submission stays in
  the dialog with `Title must not be empty.` and performs no write.
- A single click on a Goal does not open it; double-click opens it. Enter on the
  same focusable surface also opens it.
- PencilSimple opens rename dialogs. Escape closes a rename dialog and returns
  focus to the originating icon trigger.
- DotsThree opens the Task actions dialog with explicit status and order names,
  disabled-state reasons, and Phosphor status/order icons.
- No browser console warning or error was recorded during the journey.

The already-installed unpacked extension must be reloaded once after the new
bundle hashes are written so Chrome drops the cached manifest and old asset
names. That refresh is an installation handoff, not a product-code blocker; the
production files themselves passed the UI regression above.

## QA preflight addendum — 2026-08-29 (pre-final)

This addendum records evidence gathered against the rebuilt production bundle
after the UI/design handoff and the double-submit fix. It supplements the
independent 2026-08-28 report; it does not redefine the unpacked-Chrome exit
gate.

- Source revision before the uncommitted fix: `d000fb2`.
- Production directory: `.output/chrome-mv3`.
- Manifest SHA-256:
  `7cc10705cdbc6f95aa3151b6345cdbb0486df94bbb1284815cb383da66f8cb15`.
- New Tab bundle SHA-256:
  `7120f1a87380fee12be7ba546b63808b0332787da4f3dc2891f8c2ade835845c`.
- Generated CSS SHA-256:
  `baa3bfd379109a3a65626958c2eda1da199fdfa757840cc9f61c1b90aed0e94d`.

Observed in an isolated in-app browser context against the exact production
bundle served from loopback:

- Delayed loading rendered before the real empty state; the one-shot load
  failure rendered Retry and recovered the unchanged dataset.
- Goal, phase, and task create/rename paths, inline empty/whitespace/241-character
  validation, literal markup rendering, move/reorder, draft guards, focus return,
  announcements, IndexedDB reopen, and create/rename/move retry paths worked.
- A 640 CSS-pixel viewport had no horizontal overflow and retained a minimum
  44-pixel button height. Reduced-motion emulation produced zero-duration
  transitions and no running animation.
- CDP observed only the loopback HTML, JavaScript, and CSS requests; no external
  request occurred.
- A real double-click created one Goal. A defect where the second click could
  leave a false empty-title error was fixed and retested with one record and no
  inline error.

Observed in an agent-created localhost tab in connected Chrome, without reading
or claiming any existing user tab:

- Enter created Goal -> Phase -> Task without pointer activation.
- Enter moved the task to In Progress; focus returned to the moved task article
  and the polite live region announced its title, destination, and position.
- A second new Chrome tab in the same profile reopened the persisted hierarchy
  and In Progress status.

These results removed the known code/UI blockers and substantially de-risked
Q04–Q13. At this preflight point they were not substitutes for loading
`.output/chrome-mv3` unpacked, proving the New Tab override, and repeating the
journey with DevTools Offline. The final run below subsequently supplied that
environment-specific evidence.

## Final unpacked Chrome acceptance — 2026-08-29

The owner explicitly authorized using the personal Chrome profile to resolve the
last environment blocker. This was a one-time exception to the preferred
disposable-profile precondition; no unrelated tab, extension, browser data, or
extension data was modified or deleted.

- Production directory loaded unpacked: `.output/chrome-mv3`.
- Manifest SHA-256:
  `7cc10705cdbc6f95aa3151b6345cdbb0486df94bbb1284815cb383da66f8cb15`.
- New Tab bundle SHA-256:
  `7120f1a87380fee12be7ba546b63808b0332787da4f3dc2891f8c2ade835845c`.
- Generated CSS SHA-256:
  `baa3bfd379109a3a65626958c2eda1da199fdfa757840cc9f61c1b90aed0e94d`.

Observed against the actual unpacked New Tab override:

- Chrome opened My Tracker from the local extension page and exposed the true
  empty Goal state.
- Enter created `M1 Chrome Acceptance` -> `Runtime Gate` ->
  `Verify unpacked Chrome gate` without pointer activation of the forms.
- Named task controls moved the task Todo -> In Progress -> Done, with the live
  status text reporting each destination and position.
- A second New Tab restored the same Goal, Phase, Task, and Done status from the
  real profile IndexedDB.
- With DevTools Network throttling set to Offline, the task moved Done -> Todo
  and the page reloaded successfully with the updated persisted state.
- The preserved offline reload log contained exactly three successful local
  resources: `newtab.html`, `newtab-gATWsLrj.js`, and
  `newtab-Dx44ytRf.css`, all using `chrome-extension://`. No HTTP(S), WebSocket,
  or external request appeared.
- Network throttling was restored to No throttling after the run.
- The owner completed the documented Developer mode -> Load unpacked -> New Tab
  sequence from the exact runbook path, closing the Q14 fresh-reader blocker.

Result: `pass`. This execution closes Q04, Q05, Q07–Q10, Q13, and Q14. Q06,
Q11, and Q12 use the earlier deterministic production-bundle preflight evidence;
Q01–Q03 use the automated/static evidence below. Together they cover all 22
acceptance criteria without a remaining release blocker.

## Objective

Determine whether the owner can create, rename, move, reorder, close, and reopen
a local `Goal -> Phase -> Task` hierarchy without losing status or sibling order,
while preserving the M1 local-only, accessibility, transaction, packaging, and
recovery boundaries.

Primary scope and acceptance source:

- `docs/work-items/M1_DURABLE_GOAL_SLICE.md`

Supporting contracts:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_CONTRACT.md`
- `docs/UX_SPEC.md`
- `DESIGN.md`

## Independence and evidence policy

- Dev's test output is input to QA, not an automatic QA pass.
- QA re-runs configured checks and independently exercises the production build.
- Results from files observed while Dev is still implementing are diagnostic only.
- Every final result records the exact build path/version and the state of the
  working tree supplied by Dev.
- A failed or blocked acceptance criterion prevents an M1 Pass recommendation.
- No database reset, extension-data deletion, or destructive cleanup is performed
  without fresh target-specific approval. Automated integration tests must use
  unique disposable database names/factories.
- Manual Chrome execution normally uses a dedicated test profile. The final
  environment blocker used the personal profile only after explicit owner
  approval, as recorded above. Launching or controlling Chrome remains a
  separate execution action requiring the approval applicable at that time.

Final evidence uses the QA role format:

```text
Scenario:
Build/version:
Preconditions:
Steps:
Expected:
Observed:
Evidence:
Result: pass | fail | blocked
Risk/notes:
```

## Evidence classes

| Code | Evidence class | Purpose |
| --- | --- | --- |
| `U` | Unit | Pure title, status, timestamp, ordering, and invariant rules |
| `I` | Integration | Real repository/use-case behavior with disposable IndexedDB |
| `B` | Build/static inspection | Type-check, tests, production package, manifest, bundle boundary |
| `C` | Manual unpacked Chrome | User-visible journey, focus, persistence, failure UI, no-network |
| `D` | Documentation | Reproducible unpacked installation and acceptance instructions |

Configured repository commands to re-run after Dev handoff:

```text
pnpm test:unit
pnpm test:integration
pnpm typecheck
pnpm test
pnpm build
```

There is currently no configured lint script. QA must report that fact instead
of inventing a lint command.

## Required Dev handoff before execution

QA execution starts only after Dev provides:

- Stable production build identifier and exact generated directory to load.
- Exact command results for unit, integration, type-check, full test, and build.
- Generated manifest path.
- Dedicated-profile setup and reopen steps.
- Documented fault-injection path for load failure and for the next create,
  rename, or move write.
- Integration fault injection capable of failing after at least one write inside
  a multi-record transaction, so rollback is actually exercised.
- Any known unverified browser behavior.

## Acceptance criteria traceability

| AC | Requirement summary | Primary evidence | Planned scenarios | Pass evidence |
| --- | --- | --- | --- | --- |
| 1 | Production build loads unpacked and overrides New Tab | `B`, `C` | Q01, Q04 | Successful build; generated manifest; Chrome screenshot/recording of New Tab |
| 2 | Journey has no network/account/external dependency | `B`, `C` | Q13 | No HTTP(S) request in preserved Network log; journey succeeds offline |
| 3 | Widget/storage failure is visible and recoverable | `C` | Q12 | Error state and successful Retry; no blank page |
| 4 | Loading is visible without false-empty flash | `C` plus deterministic test seam | Q04 | Delayed-load recording shows Loading then correct state, never empty-first |
| 5 | Empty store offers operable Create goal | `C` | Q04 | Fresh-profile recording and keyboard activation |
| 6 | Empty goal/phase states expose Add phase, three columns, Add task | `C` | Q05, Q07 | Screenshots/recording at both hierarchy states |
| 7 | Full create journey works without mouse | `C` | Q05 | Keyboard-only recording with visible focus |
| 8 | Goal, phase, and task rename persist trimmed titles | `U`, `I`, `C` | Q02, Q06 | Automated assertions plus reopened UI |
| 9 | Empty/whitespace/>240 titles error inline and write nothing | `U`, `I`, `C` | Q02, Q06 | Error/focus recording and unchanged store snapshot |
| 10 | Titles render as text, never HTML/code | `U` or component test, `C` | Q06 | Literal markup visible; no generated element/execution |
| 11 | Missing/mismatched parents reject task creation | `U`, `I` | Q02 | Domain error plus unchanged transaction snapshot |
| 12 | Board exposes exactly three fixed statuses | `U`, `C` | Q02, Q07 | Exact constant assertion and board screenshot |
| 13 | Pointer and keyboard named Todo -> In Progress movement | `C` | Q08, Q09 | Separate pointer and keyboard recordings against reset data |
| 14 | Cross-status append; within-column before/after; persists | `U`, `I`, `C` | Q03, Q08, Q10 | Ordered snapshots before/after and after reopen |
| 15 | Focus remains on moved task and status is announced | `C` | Q09 | Visible focus plus assistive/live-region evidence |
| 16 | Done sets `completedAt`; reopening clears it without collateral change | `U`, `I`, `C` | Q02, Q08 | Repository assertions plus UI hierarchy/status check |
| 17 | Reopen restores hierarchy, titles, status, and order | `I`, `C` | Q03, Q10 | New connection test and closed/reopened New Tab recording |
| 18 | Create/rename/move failure is consistent, keeps input, and retries | `I`, `C` | Q11 | Three failure records, prior state snapshots, successful retries |
| 19 | Failed multi-record write commits nothing | `I` | Q03 | Mid-transaction failure and reopened unchanged snapshot |
| 20 | Initial DB creation and later reopen have no version error | `I`, `C` | Q03, Q10 | First-open/reconnection assertions and Chrome reopen |
| 21 | Manifest has no unnecessary permission/host access | `B` | Q01, Q13 | Parsed generated manifest attached to evidence |
| 22 | Installation docs name build directory and reopen scenario | `D`, `C` | Q14 | Fresh reader follows exact instructions successfully |

## Automated scenarios

### Q01 — Configured checks, production package, and manifest

Preconditions:

- Dev handoff identifies one stable revision/build.
- Dependencies are already installed; QA does not update packages.

Steps:

1. Run configured unit, integration, type-check, full-test, and build commands.
2. Record command, exit status, duration, and complete failure summaries.
3. Resolve the generated Chrome MV3 output directory from WXT output/docs.
4. Inspect the generated manifest, not only `wxt.config.ts`.
5. Verify the New Tab override points to an existing bundled page.
6. Verify there are no host permissions and no M1-unnecessary permissions.
7. Search the production output for remote font/CDN/API URL dependencies and
   telemetry/account client code; investigate every finding.

Expected:

- All configured checks exit zero.
- Manifest version is 3 and New Tab resolves inside the package.
- M1 requests no alarms, notifications, storage, tabs, history, identity,
  scripting, host permissions, or remote access.
- Package contains only the local assets required for M1.

Evidence: command logs, generated manifest excerpt, output directory listing,
and static boundary-search results.

### Q02 — Domain rules and use-case invariants

Automated assertions must cover:

- Title normalization: exact 240 characters accepted; 241 rejected; empty and
  whitespace-only rejected; surrounding whitespace trimmed.
- Duplicate titles allowed with distinct opaque IDs.
- Goal defaults: `active`, appended position, timestamps.
- Phase appended inside its goal.
- Task defaults: Todo, medium priority, notifications enabled, no deadline/time
  zone, no `completedAt`, appended Todo position.
- Rename changes only title and `updatedAt` for the selected entity.
- Missing goal/phase and mismatched `task.goalId`/phase ownership reject without
  a task write.
- Status values are exactly `todo`, `in_progress`, `done`; unknown runtime input
  rejects.
- Moving into Done sets `completedAt`; moving out clears it; phase/goal and
  unrelated task fields remain unchanged.
- Unknown task and invalid reorder relationships reject.
- Both before and after reorder directions are covered.

Expected: deterministic assertions pass with fixed clocks/IDs and include state
before and after every rejected command.

### Q03 — IndexedDB persistence, normalization, and rollback

Preconditions:

- Use `fake-indexeddb` with a unique disposable database name per test.
- Exercise `IndexedDbTrackerDatabase`, not only the in-memory fake.

Steps:

1. Open database version 1 and create multiple goals, phases, and tasks.
2. Close the adapter, create a new adapter connection to the same disposable
   database, and compare the full ordered workspace.
3. Move a Todo task to a populated In Progress column and assert destination
   append plus contiguous unique positions in source/destination.
4. Exercise before and after reorder within a populated column, reconnect, and
   assert deterministic order.
5. Inject a failure after one or more writes during `putMany`/normalization.
6. Let the repository transaction reject, close, reconnect, and assert that
   every task retains its exact pre-operation status, position, timestamps, and
   `completedAt` state.
7. Verify the initial schema creation and same-version reopen complete without
   migration/version errors.

Expected: successful writes survive new connections; failed multi-record writes
leave no partial state.

Evidence: named integration test output and before/after snapshots without
sensitive or unrelated local data.

## Manual Chrome scenarios

Manual scenarios use a fresh dedicated Chrome profile and the exact unpacked
production directory from Dev. No personal profile or existing extension data is
used.

### Q04 — Unpacked install, loading, and empty Home

Preconditions:

- Fresh dedicated profile with no My Tracker data.
- A deterministic QA load-delay seam or equivalent repeatable evidence method.

Steps:

1. Load the production directory unpacked.
2. Open a new tab.
3. Record from navigation start through IndexedDB resolution.
4. Activate the skip link and continue by keyboard.
5. Confirm the empty Goal state and Create goal action.

Expected:

- My Tracker replaces New Tab.
- `Loading local data` appears before data is resolved.
- `No goals yet` does not appear before loading completes.
- No blank page, onboarding modal, account prompt, or remote dependency appears.
- Create goal is keyboard operable with visible focus.

### Q05 — Keyboard-only create hierarchy and empty transitions

Steps:

1. Without a mouse, create `  Release M1  ` by entering the spaced title.
2. Confirm the displayed goal title is `Release M1` and focus moves to a stable
   control for that goal.
3. Open the goal by keyboard.
4. Confirm the no-phase state offers Add phase and does not show a false board.
5. Create `Foundation` and confirm it is selected/current.
6. Confirm Todo, In Progress, and Done all appear while empty.
7. Create `Build durable repository` and confirm it appears last in Todo.

Expected: the full creation journey is possible using Tab plus Enter/Space;
focus is always visible and the hierarchy is correct.

### Q06 — Rename, validation boundaries, and safe text rendering

Test each Goal, Phase, and Task form/editor where applicable:

1. Submit empty and whitespace-only content.
2. Submit 241 characters.
3. Confirm inline error, preserved editable content, associated error, and no
   new/renamed entity after reopening.
4. Submit exactly 240 characters and confirm acceptance.
5. Rename with surrounding spaces and confirm trimmed persistence.
6. Press Escape during rename and confirm the persisted title is restored and
   focus returns to Rename.
7. Create/rename a title containing `<strong>literal-title</strong>` and
   `{{7*7}}`.

Expected: invalid values never write; literal markup remains visible text; no
element is generated from it, no expression is evaluated, and no page script or
navigation is triggered.

### Q07 — Board structure and empty columns

Steps:

1. Open a populated goal and select a phase with no tasks.
2. Confirm exact visible order: Todo, In Progress, Done.
3. Confirm every empty column has understandable text.
4. Confirm Add task is associated with the selected phase and creates in Todo.

Expected: there are exactly three fixed columns, status is written as text, and
empty columns remain understandable without drag-and-drop.

### Q08 — Pointer named movement, append, reorder, and Done lifecycle

Preconditions:

- Todo contains `A`, `B`, `C` in that order.
- In Progress contains `P1`, `P2` in that order.

Steps:

1. With the pointer, activate `Move B to In Progress`.
2. Confirm In Progress order is `P1`, `P2`, `B`.
3. Activate `Move C before A`; confirm Todo order is `C`, `A`.
4. Activate a valid Move after operation and confirm the inverse order change.
5. Move `B` to Done, then back to In Progress.
6. Confirm goal, phase, and unrelated task records remain unchanged through the
   corresponding integration evidence.

Expected: named controls—not drag sensors—produce deterministic append and
same-column reorder behavior. Done/reopen behavior matches the data contract.

### Q09 — Keyboard movement, focus, and announcement

Preconditions: reset to a known order equivalent to Q08.

Steps:

1. Tab to `Move B to In Progress` and activate it with the keyboard.
2. Without clicking, confirm the moved task retains visible focus or an
   equivalent stable task control is focused.
3. Capture the polite live-region/VoiceOver announcement containing task title,
   destination status, and ordinal position.
4. Keyboard-activate Move before and Move after on a multi-task column.
5. Confirm focus remains associated with the moved task after each DOM change.
6. Confirm disabled current-status and edge reorder actions expose an
   understandable unavailable state without requiring color.

Expected: keyboard and pointer paths store identical results and announcements
are concise, contextual, and non-repeating.

### Q10 — Close and reopen persistence

Steps:

1. Record all goal/phase/task titles, selected phase data, statuses, and orders
   after Q08 or Q09.
2. Close the New Tab page.
3. Open a new tab in the same dedicated profile.
4. Reopen the same goal and phase.
5. Compare hierarchy, trimmed titles, status, and sibling order.
6. Repeat after closing and reopening Chrome if Dev includes browser-restart
   evidence in the handoff; record this as extra risk coverage, not a substitute
   for the required New Tab reopen.

Expected: persisted data is identical. Restoring the previously selected view is
not required.

### Q11 — Create, rename, and move save failures with retry

Preconditions:

- Dev documents a production-build QA seam that fails the selected next write
  once without touching a personal profile.
- Seeded state is recorded before each case.

Run three separate cases:

1. Fail Create goal or Add task.
2. Fail a Goal/Phase/Task rename with a changed draft.
3. Fail a cross-status move that would update multiple records.

For each case:

1. Trigger the operation.
2. Confirm `Changes are not saved`, local adjacent error where applicable, Retry,
   retained editable input/context, and no false persisted placement.
3. Reopen/read the store and confirm the previous dataset is unchanged.
4. Activate Retry once the one-shot failure is exhausted.
5. Confirm the intended operation commits exactly once, errors clear, focus is
   sensible, and reopen shows the successful result.

Expected: failures are recoverable and never leave partial or duplicate data.

### Q12 — Initial load/widget failure recovery

Preconditions: deterministic QA seam for a rejected initial repository read or
an equivalent controlled widget error.

Steps:

1. Open New Tab with the failure enabled.
2. Confirm the shell and a visible error/retry action render instead of a blank
   page.
3. Exhaust/disable the one-shot failure and activate Retry.
4. Confirm the real empty or populated dataset renders.

Expected: load failure is visible, actionable, and recoverable without clearing
the existing store.

### Q13 — No-network and permission boundary

Preconditions:

- Production build in the dedicated profile.
- Chrome DevTools Network log is cleared and Preserve log enabled.

Steps:

1. Inspect the installed extension permission panel and generated manifest.
2. Set DevTools network throttling to Offline.
3. Reload/open New Tab and perform create Goal -> Phase -> Task -> move -> reopen.
4. Inspect all logged requests and filter for `http://`, `https://`, WebSocket,
   analytics, telemetry, remote fonts, and remote images.

Expected: journey succeeds offline; no account/external service appears; no
HTTP(S)/WebSocket request occurs; permissions/host access remain empty for M1.

Evidence: permission screenshot, preserved Network log or HAR, and generated
manifest excerpt.

### Q14 — Installation documentation as a fresh-reader test

Steps:

1. Follow only the documented install commands and path.
2. Load the exact documented directory unpacked.
3. Execute the documented reopen journey.
4. Record any missing assumption, ambiguous path, development-only directory, or
   step that depends on prior chat.

Expected: a fresh reader can build, identify the directory, install, open New
Tab, and exercise close/reopen without hidden knowledge.

## QA execution report — 2026-08-28 (superseded)

### Build under test

- Workspace: `/Users/macbookpro/Workspaces/my-tracker`
- Package version: `0.1.0`
- WXT build target: Chrome MV3 production
- Production directory: `.output/chrome-mv3`
- Manifest SHA-256:
  `7cc10705cdbc6f95aa3151b6345cdbb0486df94bbb1284815cb383da66f8cb15`
- New Tab bundle SHA-256:
  `80ada6fec4bea5e6ad4971be294e6e5b045426980ae797668c853a44537cd729`

QA rebuilt the directory before inspection. No dependency command, source edit,
database deletion, Git stage/commit/push, or remote action was performed.

### Command evidence

| Command | Result | Observed evidence |
| --- | --- | --- |
| `pnpm test:unit` | Pass | 2 files, 11 tests passed |
| `pnpm test:integration` | Pass | 1 file, 5 tests passed |
| `pnpm typecheck` | Pass | `tsc --noEmit`, exit 0, no diagnostics |
| `pnpm test` | Pass | 3 files, 16 tests passed |
| `pnpm build` | Pass | WXT 0.21.4 production Chrome MV3 build, 4 files, 219.91 kB |
| `pnpm run test:integration -- --reporter=verbose` | Pass | Supplemental independent rerun; same 5 integration tests passed |

There is no configured lint script, so no lint command was invented or run.

### Static package evidence

- Generated `manifest.json` has `manifest_version: 3`.
- `chrome_url_overrides.newtab` is `newtab.html`, and that file exists in the
  production directory.
- Generated `permissions` and `host_permissions` are both empty arrays.
- The manifest has no background script, content script, external connection,
  or other permission-bearing M1 surface.
- Source scan found no application `fetch`, XHR, WebSocket, beacon, analytics,
  telemetry, remote-font, or remote-asset URL.
- Production bundle scan found no XHR, WebSocket, beacon, telemetry vendor, or
  remote-font string. Its only protocol strings are React's inert minified-error
  help URL and standard W3 namespace identifiers.
- The bundle contains one Vite module-preload polyfill `fetch` call. The generated
  HTML has no `modulepreload` link, and all script/style references are local
  extension paths; this is not evidence of an external runtime request.
- Production CSS contains no `url(...)` or `@font-face` rule.
- `docs/M1_RUNBOOK.md` names `.output/chrome-mv3`, disposable-profile unpacked
  installation steps, the close/reopen journey, DevTools Network inspection,
  and all three bounded QA query switches.

### Automated fault and rollback evidence

- `qaDelayLoadMs` is clamped to 0–5000 ms and delays only the first read in the
  page-local QA adapter.
- `qaFailLoadOnce` rejects one initial read and then allows Retry to use the real
  unchanged repository.
- `qaFailNextWrite` rejects one write before its transaction begins and then
  permits an in-page retry.
- The integration suite independently injects failure after one task write in a
  multi-record move, aborts the IndexedDB transaction, closes the connection,
  reconnects to the same disposable database, and compares the complete
  workspace with the pre-move snapshot.
- Reconnect coverage also proves hierarchy, renamed title, status, and Todo order
  survive a new adapter connection.
- `fake-indexeddb` databases use test-specific names and contain no user data.

### Scenario evidence

```text
Scenario: Q01 — Configured checks, production package, and manifest
Build/version: 0.1.0; manifest SHA-256 7cc10705...f8cb15
Preconditions: Existing installed dependencies; QA rebuilt production output.
Steps: Re-ran all configured checks; parsed generated manifest; inspected output and bundle strings.
Expected: Checks pass; valid New Tab MV3 package; empty permissions; no remote dependency.
Observed: 11 unit, 5 integration, and 16 full-suite tests passed; type-check/build passed; manifest and static boundary match M1.
Evidence: Command output, generated manifest, file digests, static scans recorded above.
Result: pass
Risk/notes: Real unpacked load and DevTools Network remain Q04/Q13 manual evidence.
```

```text
Scenario: Q02 — Domain rules and use-case invariants
Build/version: Current 0.1.0 workspace under the production build above.
Preconditions: Fixed clocks/IDs in unit fixtures; no user data.
Steps: Re-ran unit suite and inspected named cases for boundaries and rejected writes.
Expected: Title, defaults, parent, status, timestamp, and ordering rules are deterministic.
Observed: Exact-240/241, duplicate IDs/order, trims, three statuses, Done/reopen, rename isolation, append, before/after, parent mismatch, unknown status, and missing move target cases pass.
Evidence: tests/unit/domain-rules.test.ts and tests/unit/tracker-service.test.ts; 11/11 pass.
Result: pass
Risk/notes: User-visible inline rendering and focus remain manual scenarios.
```

```text
Scenario: Q03 — IndexedDB persistence, normalization, and rollback
Build/version: Current 0.1.0 workspace under the production build above.
Preconditions: Isolated fake-indexeddb factories and test-specific database names.
Steps: Re-ran integration suite; inspected reconnect, normalization, pre-write failure, and post-first-write abort cases.
Expected: Commits persist; positions remain contiguous; failed multi-record writes commit nothing.
Observed: New connections restored hierarchy/title/status/order; source/destination positions normalized; post-write failure reconnected to the exact pre-move snapshot.
Evidence: tests/integration/indexeddb-tracker-database.test.ts; 5/5 pass.
Result: pass
Risk/notes: Real Chrome IndexedDB remains covered only by blocked manual reopen evidence.
```

```text
Scenario: Q04 — Unpacked install, loading, and empty Home
Build/version: Production package above.
Preconditions: Requires a verified dedicated/disposable Chrome profile.
Steps: Browser capability was checked without opening, listing, or claiming tabs.
Expected: Install unpacked and observe delayed loading then true empty state.
Observed: Only the current user Chrome connection was available; profile isolation could not be verified safely.
Evidence: No Chrome tab or personal browser data was opened or inspected.
Result: blocked
Risk/notes: Blocks AC 1, 4, and 5.
```

```text
Scenario: Q05 — Keyboard-only create hierarchy and empty transitions
Build/version: Production package above.
Preconditions: Requires Q04 dedicated unpacked profile.
Steps: Not executed because the safe Chrome precondition was unavailable.
Expected: Keyboard Goal -> Phase -> Task journey with visible focus.
Observed: No manual browser evidence.
Evidence: None; automated domain evidence is not a UI substitute.
Result: blocked
Risk/notes: Blocks AC 6 and 7 and the UI portion of AC 8.
```

```text
Scenario: Q06 — Rename, validation boundaries, and safe text rendering
Build/version: Production package above.
Preconditions: Requires Q04 dedicated unpacked profile.
Steps: Not executed; unit rules and JSX text rendering were inspected only.
Expected: Inline errors preserve content; Escape/focus work; markup stays literal.
Observed: Automated rules pass and source renders titles as React text, but no user-visible evidence was captured.
Evidence: Unit suite and read-only source inspection only.
Result: blocked
Risk/notes: Blocks final AC 8, 9, and 10 evidence.
```

```text
Scenario: Q07 — Board structure and empty columns
Build/version: Production package above.
Preconditions: Requires Q04 dedicated unpacked profile.
Steps: Not executed; generated bundle/source exposes Todo, In Progress, Done and empty copy.
Expected: Exactly three visible ordered columns with operable empty states.
Observed: Static implementation matches; no unpacked visual/interactive evidence.
Evidence: Unit status assertion and production bundle inspection only.
Result: blocked
Risk/notes: Blocks AC 12 UI evidence.
```

```text
Scenario: Q08 — Pointer named movement, append, reorder, and Done lifecycle
Build/version: Production package above.
Preconditions: Requires seeded dedicated unpacked profile.
Steps: Not executed; automated append/reorder/Done rules pass.
Expected: Pointer controls produce deterministic stored state.
Observed: No pointer interaction against the production UI.
Evidence: Unit/integration output only.
Result: blocked
Risk/notes: Blocks AC 13, 14, and 16 manual evidence.
```

```text
Scenario: Q09 — Keyboard movement, focus, and announcement
Build/version: Production package above.
Preconditions: Requires seeded dedicated unpacked profile and assistive/focus inspection.
Steps: Not executed.
Expected: Keyboard result equals pointer result; moved task retains focus; live region announces context.
Observed: Source contains named buttons, pending focus selector, and polite/assertive regions; runtime behavior was not observed.
Evidence: Read-only source/bundle inspection only.
Result: blocked
Risk/notes: Blocks AC 13 and 15.
```

```text
Scenario: Q10 — Close and reopen persistence
Build/version: Production package above.
Preconditions: Requires a dedicated unpacked profile with seeded data.
Steps: Automated adapter reconnect passed; real New Tab close/reopen not executed.
Expected: Same hierarchy, titles, status, and order after a new tab opens.
Observed: Fake IndexedDB reconnect passes; no real-profile evidence.
Evidence: Integration suite only.
Result: blocked
Risk/notes: Blocks final AC 14, 17, and 20 evidence.
```

```text
Scenario: Q11 — Create, rename, and move save failures with retry
Build/version: Production package above.
Preconditions: Requires a dedicated unpacked profile and documented QA URL seams.
Steps: Verified seams and rollback tests statically/automatically; did not exercise form/move retry in Chrome.
Expected: Visible Save failed, retained draft/context, unchanged data, one successful retry.
Observed: One-shot pre-write retry and post-write rollback automation pass; UI recovery remains unobserved.
Evidence: Integration suite, QA adapter source, and runbook.
Result: blocked
Risk/notes: Blocks final AC 18 evidence.
```

```text
Scenario: Q12 — Initial load/widget failure recovery
Build/version: Production package above.
Preconditions: Requires dedicated unpacked profile and qaFailLoadOnce URL.
Steps: Verified one-shot source/runbook behavior; did not open the URL in Chrome.
Expected: Shell plus Retry loading, then real unchanged dataset.
Observed: Deterministic seam exists; no browser observation.
Evidence: QA adapter and production bundle inspection only.
Result: blocked
Risk/notes: Blocks AC 3.
```

```text
Scenario: Q13 — No-network and permission boundary
Build/version: Production package above.
Preconditions: Requires dedicated unpacked profile and DevTools Network access.
Steps: Parsed manifest and scanned source/bundle; offline Chrome journey was not run.
Expected: Empty permissions and no HTTP(S)/WebSocket requests during the journey.
Observed: Static boundary passes; no preserved DevTools Network log exists.
Evidence: Generated manifest and static scan above.
Result: blocked
Risk/notes: AC 21 passes statically; AC 2 remains blocked.
```

```text
Scenario: Q14 — Installation documentation as a fresh-reader test
Build/version: Production package above.
Preconditions: Requires dedicated Chrome profile to follow installation through completion.
Steps: Read runbook and verified every named path/switch exists; did not install unpacked.
Expected: Fresh reader completes install and reopen without hidden knowledge.
Observed: Documentation is complete statically, but its browser procedure could not be executed safely.
Evidence: docs/M1_RUNBOOK.md and generated output inspection.
Result: blocked
Risk/notes: Blocks final AC 22 evidence.
```

### Acceptance criterion result summary

| AC | Result | Independent QA evidence |
| --- | --- | --- |
| 1 | Blocked | Build/manifest pass; unpacked New Tab not exercised |
| 2 | Blocked | Static no-remote scan passes; no offline DevTools journey |
| 3 | Blocked | Failure seam exists; recoverable browser state not observed |
| 4 | Blocked | Delay seam exists; false-empty transition not observed |
| 5 | Blocked | Empty UI exists statically; no dedicated-profile interaction |
| 6 | Blocked | Empty hierarchy/column implementation exists; no Chrome evidence |
| 7 | Blocked | Named keyboard controls exist; full keyboard journey not executed |
| 8 | Blocked | Unit/integration rename rules pass; UI/reopen rename not executed |
| 9 | Blocked | Boundary validation passes; inline/preserved-value UI not executed |
| 10 | Blocked | React text rendering found; malicious-literal browser test not executed |
| 11 | Pass | Parent mismatch rejects and leaves task collection unchanged |
| 12 | Blocked | Exact status constant passes; visible board not observed |
| 13 | Blocked | Named buttons exist; pointer and keyboard runtime paths not executed |
| 14 | Blocked | Append/reorder/reconnect automation passes; manual production path absent |
| 15 | Blocked | Focus/live-region implementation found; assistive runtime evidence absent |
| 16 | Blocked | Done/reopen automation passes; production UI lifecycle not exercised |
| 17 | Blocked | Adapter reconnect passes; real New Tab close/reopen absent |
| 18 | Blocked | Fault/rollback automation passes; form/move recovery UI absent |
| 19 | Pass | Failure after one task write aborts and reconnect equals pre-move snapshot |
| 20 | Blocked | Version-1 adapter reopen passes; real Chrome store reopen absent |
| 21 | Pass | Generated manifest has empty permissions and host permissions |
| 22 | Blocked | Runbook content is complete; fresh-reader Chrome execution absent |

Summary: 3 Pass, 0 Fail, 19 Blocked.

### Release recommendation at that time

`Blocked` at the time — this recommendation is superseded by the 2026-08-29
acceptance decision below.

All automated, transaction, type, build, manifest, static local-only, and
runbook checks completed without a defect. However, the required unpacked Chrome
acceptance journey could not be run in a verified dedicated/disposable profile.
The blocker covers visible loading/empty/error states, keyboard and pointer
operation, focus/live announcements, real IndexedDB reopen, offline Network
evidence, and fresh-reader installation.

This is an evidence/environment blocker, not a demonstrated product failure.
At that time, M1 was required to remain `in progress` until Q04–Q14 were
executed against this exact build or a newly rebuilt, re-identified production
artifact.

## Historical release decision rule

QA may recommend `Pass` only when:

- All 22 acceptance criteria have linked final evidence.
- No unresolved data-loss, partial-write, unsafe-rendering, blank-page,
  keyboard-blocking, local-only, or permission-expansion defect remains.
- All configured commands pass against the same Dev handoff.
- The real unpacked Chrome journey and reopen scenario pass in a dedicated
  profile.

Otherwise the recommendation is `Fail` for a reproducible defect or `Blocked`
when required evidence/environment is unavailable. Product gaps and code defects
must be labeled separately and linked to the exact acceptance criterion.

## Testability gap recheck

The planning gaps were re-inspected after the stable Dev handoff.

| Gap | Recheck result | Remaining evidence | Status |
| --- | --- | --- | --- |
| G1 | Integration suite now has five passing IndexedDB cases. | Real Chrome reopen remains manual. | Automated gap resolved |
| G2 | Post-first-write move failure abort/reconnect test passes. | None for AC 19; UI move failure remains Q11. | Rollback gap resolved |
| G3 | `qaDelayLoadMs` and `qaFailLoadOnce` exist in source, bundle, and runbook. | Dedicated-profile browser execution. | Seam resolved; manual blocked |
| G4 | Form/rename retries remain local; global retry is limited to move/reorder. | Browser proof that errors clear and no duplicate is created. | Code gap addressed; manual blocked |
| G5 | Boundary unit cases were expanded and all 11 unit tests pass. | UI portions remain manual. | Automated gap resolved |
| G6 | UI behavior remains intentionally manual with no added component dependency. | Q04–Q13 dedicated-profile evidence. | Unresolved evidence blocker |
| G7 | `docs/M1_RUNBOOK.md` names the exact production path and reopen steps. | Follow procedure in disposable Chrome. | Documentation gap resolved; manual blocked |
| G8 | All QA URLs, reset behavior, scope, and safety are documented. | Execute them in disposable Chrome. | Documentation gap resolved; manual blocked |

During the 2026-08-28 execution, only this QA artifact was modified. Source and
other project documentation were inspected read-only.

## Superseding acceptance decision — 2026-08-29

The exact rebuilt production artifact, the deterministic production-bundle
preflight, the automated suites, and the owner-authorized unpacked Chrome run
form the final M1 evidence set.

| AC | Result | Final evidence |
| --- | --- | --- |
| 1 | Pass | Unpacked build replaced New Tab with My Tracker |
| 2 | Pass | Offline journey and reload succeeded with only local extension resources |
| 3 | Pass | One-shot load failure showed Retry and recovered the unchanged dataset |
| 4 | Pass | Delayed-load seam showed loading before the true state |
| 5 | Pass | Actual unpacked empty state exposed keyboard-operable Goal capture |
| 6 | Pass | Actual goal/phase empty states and all three columns were observed |
| 7 | Pass | Enter created Goal -> Phase -> Task in the unpacked extension |
| 8 | Pass | Rename preflight plus reopen persistence passed |
| 9 | Pass | Inline empty/whitespace/241-character validation wrote no record |
| 10 | Pass | Literal markup rendered as text without execution |
| 11 | Pass | Parent mismatch rejected with unchanged task collection |
| 12 | Pass | Actual board exposed exactly Todo, In Progress, and Done |
| 13 | Pass | Named pointer controls passed unpacked; keyboard controls passed connected Chrome |
| 14 | Pass | Append/reorder automation, production UI controls, and reopen evidence passed |
| 15 | Pass | Focus return and live status/position announcements were observed |
| 16 | Pass | Done transition and reopened persisted status passed with unit timestamp rules |
| 17 | Pass | A second real New Tab restored hierarchy and status from IndexedDB |
| 18 | Pass | Create/rename/move failure seams preserved state and retried successfully |
| 19 | Pass | Post-first-write failure aborted and reconnected to the pre-move snapshot |
| 20 | Pass | Initial real store creation and subsequent New Tab reopen succeeded |
| 21 | Pass | Generated manifest retained empty permissions and host permissions |
| 22 | Pass | Owner followed the documented unpacked path and reopen sequence |

Summary: **22 Pass, 0 Fail, 0 Blocked.**

### Final release recommendation

`Pass` — M1 is complete and ready to hand off to M2. No unresolved data-loss,
partial-write, unsafe-rendering, blank-page, keyboard-blocking, local-only, or
permission-expansion defect remains in the accepted M1 scope.
