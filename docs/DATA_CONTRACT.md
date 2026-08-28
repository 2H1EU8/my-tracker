# Data contract

## Decision

My Tracker uses two related JSON formats:

1. `my-tracker/ai-plan`: nested and convenient for human or AI authors.
2. `my-tracker/backup`: normalized and lossless for export/restore and future migrations.

There is no adopted universal task format that preserves the product's full `Goal -> Phase -> Task -> Checklist item` hierarchy. JSON Schema Draft 2020-12 provides validation and tooling while a later adapter can map a compatible subset to iCalendar `VTODO`.

## Common conventions

- JSON is UTF-8.
- Field names use `camelCase`.
- Schema versions use semantic version strings.
- Times are RFC 3339 strings with an explicit UTC offset; backup times should be normalized to `Z`.
- User-entered deadline records also carry an IANA `timeZone`.
- IDs are opaque strings. Current code may use UUIDs, but consumers must not parse identity semantics from them.
- Unknown top-level or entity fields are rejected in v1 to catch AI hallucinations and typos.
- Array order is meaningful for the AI plan.
- Backup order is deterministic but identity does not depend on array position.
- Text is plain text. Markdown rendering, if added later, must remain sanitized and opt-in.

## AI plan format

Schema: `schemas/my-tracker-ai-plan.schema.json`

### Purpose

- Let an external AI generate one or more project plans.
- Let a human edit and review the file.
- Create local goals without requiring local database IDs.

### Envelope

```json
{
  "$schema": "https://my-tracker.local/schemas/my-tracker-ai-plan.schema.json",
  "format": "my-tracker/ai-plan",
  "schemaVersion": "1.0.0",
  "generatedAt": "2026-08-28T08:00:00Z",
  "title": "Optional document label",
  "goals": []
}
```

### Hierarchy

- `goals[]` contains `phases[]`.
- `phases[]` contains `tasks[]`.
- `tasks[]` contains `checklist[]`.
- A task status is `todo`, `in_progress`, or `done`.
- `externalKey` is required for goals, phases, and tasks and must be unique within the full document.
- Checklist keys are optional because they are not link targets in v1.
- Dates are optional.

### Import behavior

- V1 is create-only.
- The importer generates local IDs and stores the document `externalKey` as source metadata when useful.
- Titles are not identity and must never drive merging.
- If any item fails shape or semantic validation, nothing is imported.
- Import limits must be configured and reported before release; the schema only defines structural limits.

### AI authoring guidance

Use `examples/AI_PLAN_PROMPT.md`. An AI response must contain only one JSON object when it is intended for direct file import. The owner must still preview the result.

## Backup format

Schema: `schemas/my-tracker-backup.schema.json`

### Purpose

- Lossless manual backup.
- Restore into a clean or replacement local store.
- Provide a stable migration boundary for later application versions.

### Envelope

```json
{
  "$schema": "https://my-tracker.local/schemas/my-tracker-backup.schema.json",
  "format": "my-tracker/backup",
  "schemaVersion": "1.0.0",
  "appVersion": "0.1.0",
  "exportedAt": "2026-08-28T08:00:00Z",
  "data": {
    "goals": [],
    "phases": [],
    "tasks": [],
    "checklistItems": [],
    "notes": [],
    "reminders": [],
    "settings": {}
  }
}
```

### Restore semantics

- Compatible major version only.
- Validate shape, references, unique IDs, parent consistency, and positions before write.
- Duplicate IDs or dangling references reject the entire restore.
- Preserve IDs and timestamps.
- Replace all app-owned domain stores in one transaction after confirmation.
- Recreate derived Chrome alarms after the data transaction commits.

## Entity model

### Goal

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes in backup | Stable opaque ID. |
| `title` | yes | Non-empty display title. |
| `description` | no | Plain-text outcome/context. |
| `status` | yes | `active`, `completed`, or `archived`. |
| `color` | no | Muted note color token. |
| `position` | yes | Order among goals. |
| `createdAt`, `updatedAt` | yes | UTC instants. |

### Phase

| Field | Required | Meaning |
| --- | --- | --- |
| `id`, `goalId` | yes | Identity and parent. |
| `title` | yes | Stage title. |
| `description` | no | Stage outcome/definition. |
| `position` | yes | Order within the goal. |
| `createdAt`, `updatedAt` | yes | UTC instants. |

### Task

| Field | Required | Meaning |
| --- | --- | --- |
| `id`, `goalId`, `phaseId` | yes | Identity and denormalized parents for integrity/querying. |
| `title` | yes | Card title. |
| `description` | no | Plain-text detail. |
| `status` | yes | `todo`, `in_progress`, or `done`. |
| `priority` | yes | `low`, `medium`, or `high`. |
| `position` | yes | Order within phase and status. |
| `dueAt`, `timeZone` | together or absent | Deadline instant and original zone. |
| `notifyAtDue` | yes | Whether a deadline derives a notification alarm. |
| `completedAt` | no | Set when status becomes Done; cleared if reopened. |
| `createdAt`, `updatedAt` | yes | UTC instants. |

### Checklist item

| Field | Required | Meaning |
| --- | --- | --- |
| `id`, `taskId` | yes | Identity and parent. |
| `title` | yes | Small step text. |
| `isCompleted` | yes | Independent checkbox state. |
| `position` | yes | Order within task. |
| `createdAt`, `updatedAt` | yes | UTC instants. |

### Note

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Stable ID. |
| `body` | yes | Plain text. |
| `position` | yes | Inbox order. |
| `linkedGoalId`, `linkedTaskId` | optional, mutually exclusive in v1 | Optional context link. |
| `createdAt`, `updatedAt` | yes | UTC instants. |

### Reminder

| Field | Required | Meaning |
| --- | --- | --- |
| `id`, `title` | yes | Identity and notification title. |
| `details` | no | Plain-text context. |
| `dueAt`, `timeZone` | yes | Due instant and original zone. |
| `state` | yes | `scheduled` or `fired`. |
| `firedAt` | required only when fired | When delivery processing occurred. |
| `linkedGoalId`, `linkedTaskId` | optional, mutually exclusive in v1 | Optional context link. |
| `createdAt`, `updatedAt` | yes | UTC instants. |

## Semantic invariants

- Entity IDs are unique across their own entity type.
- Parent references exist.
- `task.goalId` equals the goal owning `task.phaseId`.
- Sibling positions are non-negative and unique after normalization.
- `completedAt` is present exactly when task status is `done` in backup data.
- `firedAt` is present exactly when reminder state is `fired`.
- Link targets exist and belong to the same restored dataset.
- A task with `dueAt` has `timeZone`; neither appears alone.
- Imported external keys are unique across all goals/phases/tasks in the AI-plan document.

## iCalendar compatibility adapter — future

RFC 5545 defines `VTODO`, `DUE`, `STATUS`, `PRIORITY`, `CATEGORIES`, relationships, and optional `VALARM`. A later adapter can map individual tasks or reminders:

| My Tracker | iCalendar |
| --- | --- |
| Task/reminder ID | `UID` |
| Title | `SUMMARY` |
| Description/details | `DESCRIPTION` |
| Due instant | `DUE` |
| Todo / In Progress / Done | `NEEDS-ACTION` / `IN-PROCESS` / `COMPLETED` |
| Priority | `PRIORITY` |
| Parent relation | `RELATED-TO` where supported |

This is a lossy adapter. `VTODO` components cannot nest, and external clients vary in support. It must not replace the JSON backup format.

## Versioning policy

- Patch: clarification or stricter tooling that accepts the same valid documents.
- Minor: optional backward-compatible fields; old readers may ignore only when their schema policy allows it.
- Major: changed meaning, required fields, removed values, or structural change.
- The importer must never silently coerce an unsupported major version.
- Every committed schema change updates examples, validators/tests, this document, and `DECISIONS.md`.
