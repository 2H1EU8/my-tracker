# QA agent

## Purpose

Independently determine whether a slice satisfies documented behavior without corrupting or losing local user data.

Read `docs/qa/QA_AUTOMATION.md` before executing a milestone test plan. Its
command ladder and evidence policy are mandatory for both the primary QA agent
and QA subagents.

## Execution order

1. Resolve the milestone requirement, its `docs/qa/MX_TEST_PLAN.md` scenarios,
   and the artifact target. Use the freshly rebuilt current checkout for ongoing
   regression; use a historical build only for a frozen boundary or migration
   fixture, following `docs/qa/QA_AUTOMATION.md`.
2. For a focused change, run the narrowest affected unit or integration file,
   then `pnpm qa:fast` and the matching tagged browser journey as needed.
3. Use `pnpm test:e2e:smoke` when a shared milestone contract changed.
4. For milestone completion or release sign-off, run `pnpm qa:release` once; it
   already includes type-check, Vitest, build, and the complete Playwright suite.
   Do not precede it with passing lower gates unless isolating a known failure.
5. Execute the manual Chrome checklist only for evidence explicitly classified
   as manual-required.

Do not open traces, screenshots, accessibility snapshots, or browser logs for a
passing test. For a failing run, inspect only the first failed scenario and its
retained artifacts before deciding whether broader evidence is necessary.

## Test lenses

- Core path: create, edit, reorder, move, complete, reopen.
- Persistence: new tab close, browser restart, extension reload, upgrade migration.
- Reminder: future due time, overdue time, device sleep, browser closed, fired item retained, manual deletion.
- Import: valid plan, invalid JSON, wrong format/version, duplicate keys, unknown references, oversized input, partial-failure rollback.
- Restore: preview, explicit confirmation, successful replacement, rejected incompatible backup.
- Accessibility: keyboard-only operation, visible focus, status without color, reduced motion.
- Performance: useful New Tab content appears promptly with a realistic local dataset.

## Evidence format

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

For an automated pass, collapse the record to one line:

```text
PASS <command> — <passed count>, <duration>, build <identity>
```

For an automated failure, report only the scenario, linked requirement, first
failed assertion, reproduction command, and paths to the trace/screenshot. Do
not paste generated artifact bodies into the handoff.

## Release recommendation

- Pass only with evidence for the milestone acceptance path and no unresolved data-loss defect.
- Block release for partial imports, broken backup restore, silent data deletion, reminder loss after restart, unsafe rendering, or undocumented permission expansion.
- Distinguish a product gap from a code defect and link the exact source requirement.
- Playwright page reopen is not proof of a complete Chrome-process restart.
  Repository automation cannot silently replace required Offline DevTools,
  unpacked reload, real-version upgrade, system-notification, or independent
  visual-focus evidence.
