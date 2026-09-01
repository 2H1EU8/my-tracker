# QA automation and token budget

## Outcome

A QA agent can verify an M1, M2, or later milestone with deterministic commands,
an isolated production-extension browser, compact output, and an explicit
handoff for the small set of evidence that still requires real Chrome or human
visual judgment.

This document governs the repository runner. A milestone test plan remains the
source of truth for acceptance criteria and release status.

## One-time setup

```sh
pnpm install
pnpm exec playwright install chromium
```

Playwright uses its bundled Chromium because unpacked extensions require a
persistent Chromium context. The runner creates a new disposable profile for
every test and never connects to the owner's normal Chrome profile.

## Command ladder

Run the first command that can answer the current question. Move down only after
the earlier layer passes or the failure requires a broader reproduction.

| Gate | Command | When to use |
| --- | --- | --- |
| Focused deterministic | `pnpm test:unit -- <file>` or `pnpm test:integration -- <file>` | During implementation and defect isolation |
| Fast code gate | `pnpm qa:fast` | Default Dev-to-QA handoff |
| M1 browser journey | `pnpm test:e2e:m1` | M1 hierarchy, movement, New Tab reopen |
| M2 browser journey | `pnpm test:e2e:m2` | Notes, checklist independence, New Tab reopen |
| Shared smoke | `pnpm test:e2e:smoke` | UI shell, storage boundary, or shared component changes |
| Full release | `pnpm qa:release` | Milestone completion and release recommendation only |

For M3 and later, tag browser test titles with both `@smoke` when release
critical and `@mX` for the owning milestone. Until a convenience script exists,
run the current production build and the tag explicitly:

```sh
pnpm build
pnpm exec playwright test --grep @m3
```

Do not rerun a passing lower layer merely to generate more prose. Do not run the
full release gate after every local edit.

## Runner behavior

- `playwright.config.ts` uses one worker and fails fast locally to keep results
  deterministic and failure output small.
- Each browser test launches `.output/chrome-mv3` in a clean persistent context,
  opens `chrome://newtab/`, and verifies that the extension owns the page.
- Test data is synthetic and disappears with the disposable profile.
- Passing tests discard traces and emit the compact dot reporter.
- Failing tests retain a trace, full-page screenshot, accessibility snapshot,
  console/page errors, and external-request list under `test-results/` and
  `playwright-report/`. Both directories are ignored by Git.
- Browser requests must stay on `chrome-extension://`, `chrome://`, `data:`, or
  `blob:` unless the owning work item explicitly changes the local-only product
  boundary.

## Browser-tool routing

| Need | First choice | Escalate when |
| --- | --- | --- |
| Repeatable acceptance journey | Repository Playwright Test | The runner exposes a reproducible product failure |
| Inspect one failing locator/state | Playwright trace, then Playwright MCP | The trace cannot explain the live state |
| Protected Chrome UI or OS-level behavior | Disposable real Chrome plus Computer Use/user handoff | Installation, extension reload, DevTools Offline, browser-process restart, or system notification must be observed |
| Visual taste and focus-ring review | Human/Computer Use screenshot review | The criterion depends on appearance rather than DOM semantics |

Computer Use is not a regression runner. Playwright MCP is not a substitute for
committed tests. Both tools consume agent context through repeated interactive
observations, so use them on one named scenario at a time.

## Manual-required evidence

Keep these scenarios manual unless the milestone plan explicitly adopts a safe,
reproducible automation mechanism:

- Loading or reloading the unpacked artifact in the owner's chosen disposable
  Chrome installation.
- Closing every window and restarting the complete Chrome process.
- DevTools Network Offline throttling and preserved network-log inspection.
- Upgrading the same installed extension/profile from an identified older
  production artifact to the current artifact.
- Real `chrome.alarms`/system-notification behavior, sleeping-device behavior,
  and OS notification permission failure.
- Independent visual focus-ring, 200% zoom, reduced-motion, and subjective calm
  UI review when DOM assertions cannot prove the criterion.

A Playwright page close/reopen proves extension-page and IndexedDB persistence
inside one browser process. It does not prove a full browser restart.

## Adding an Mx journey

1. Link the test to acceptance scenarios in `docs/qa/MX_TEST_PLAN.md`.
2. Put deterministic domain and transaction rules in Vitest first.
3. Add only the smallest user-visible production journey under `tests/e2e/`.
4. Use role, label, visible text, and native state locators. Add `data-testid`
   only when the element has no stable user-facing semantic target.
5. Give the test an `@mX` tag; add `@smoke` only for a release-critical journey.
6. Start from an empty disposable profile and seed through public application UI
   or a documented test fixture. Never read or seed the owner's browser data.
7. Assert user-visible outcomes and durable state after opening a new New Tab.
8. Record any remaining browser-process, migration-artifact, Offline, or visual
   requirement as manual-required instead of weakening it.

## QA agent prompt contract

Use this compact instruction when delegating milestone verification:

```text
Act as the QA agent defined in docs/agents/QA_AGENT.md. Verify milestone Mx from
docs/qa/MX_TEST_PLAN.md using docs/qa/QA_AUTOMATION.md. Start with the narrowest
deterministic gate, then the @mX Playwright journey. Stop on the first failure,
inspect only that failure's artifacts, and do not modify product code. Report a
one-line pass or a compact defect with scenario, requirement, reproduction
command, observed/expected result, and artifact paths. Do not use Computer Use
unless the plan marks the remaining evidence manual-required.
```

If the QA agent is also authorized to fix defects, complete verification first,
record the failure, then hand the defect to a Dev agent. Keep QA's independent
release recommendation separate from the implementation turn.
