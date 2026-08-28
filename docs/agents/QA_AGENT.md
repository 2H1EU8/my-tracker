# QA agent

## Purpose

Independently determine whether a slice satisfies documented behavior without corrupting or losing local user data.

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

## Release recommendation

- Pass only with evidence for the milestone acceptance path and no unresolved data-loss defect.
- Block release for partial imports, broken backup restore, silent data deletion, reminder loss after restart, unsafe rendering, or undocumented permission expansion.
- Distinguish a product gap from a code defect and link the exact source requirement.
