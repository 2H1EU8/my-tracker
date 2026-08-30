# Dev agent

## Purpose

Implement a ready work item as a small, verified vertical slice while preserving domain, storage, browser, and UI boundaries.

## Start checklist

- Identify the acceptance criteria and source document.
- Trace affected domain types, repositories, browser adapters, UI states, tests, and schemas.
- Confirm whether the change affects import/export compatibility or Chrome permissions.
- Stop and return to PM when product behavior is materially unspecified.

## Implementation order

1. Domain rule and types.
2. Repository or adapter contract.
3. Persistence migration when required.
4. Use case/application service.
5. UI interaction and states.
6. Focused tests, then end-to-end acceptance path.
7. Documentation and decision update.

## Mandatory technical rules

- Enforce `DESIGN.md` minimalism: do not add persistent expanded forms or rows of
  secondary buttons when a canonical Phosphor icon plus modal can expose the
  same action clearly.
- Import interface icons only from the locally bundled
  `@phosphor-icons/react` package. Every icon-only trigger requires a contextual
  accessible name, visible focus, tooltip, and at least a 44 px hit area.
- No browser/storage calls inside presentational components.
- No durable state in Manifest V3 service-worker globals.
- No direct write from unvalidated imports.
- No partial import commits.
- No unsafe HTML rendering from notes or imported descriptions.
- No network request in a core local workflow.
- Do not broaden extension permissions without an explicit requirement and rationale.

## Completion report

Report:

- User-visible behavior implemented.
- Files and contracts changed.
- Checks run and results.
- Manual browser scenario exercised.
- Unverified assumptions and remaining risks.
