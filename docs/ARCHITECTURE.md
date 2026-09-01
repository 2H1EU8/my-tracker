# Architecture

## Status

Target architecture for implementation. It is not runtime evidence.

## Architectural goals

- Instant local New Tab experience.
- Durable hierarchical data with safe migrations.
- Reliable best-effort reminders under Manifest V3 lifecycle constraints.
- AI-friendly import without runtime AI or untrusted execution.
- A storage and domain design that can add sync adapters later without rewriting UI behavior.

## System context

```text
                    manually chosen JSON
External AI tool ------------------------------+
                                                v
Chrome New Tab UI -> application use cases -> import validator
        |                    |                    |
        |                    v                    v
        |              domain model ------> transaction boundary
        |                    |                    |
        v                    v                    v
  React presentation   repository ports -> IndexedDB adapter
                                                |
                                                v
Background service worker <- alarm reconciler <- persisted deadlines
        |
        +-> chrome.alarms
        +-> chrome.notifications

Backup exporter/restore validator <---------- repository ports
```

## Technical baseline

| Concern | Choice | Why |
| --- | --- | --- |
| Extension build | WXT, Manifest V3 | First-class new-tab and background entrypoints with generated manifest. |
| UI | React + TypeScript | Matches the owner's experience and supports typed feature modules. |
| Styling | Plain CSS custom properties for M1 | Keeps the functional shell small and implements the approved semantic tokens without another dependency. Revisit Tailwind only if later visual-system work demonstrates enough value. |
| Domain storage | Native IndexedDB behind repository interfaces for M1 | Handles normalized related entities, transactions, indexes, and larger plans better than one JSON storage key while validating the platform API before considering a wrapper. |
| Browser regression | Playwright Test with bundled Chromium | Loads the production unpacked output in a disposable persistent profile, supports repeatable New Tab journeys, and retains diagnostics only on failure. |
| Settings | IndexedDB through the same repository boundary | Keep one domain source of truth and avoid an unnecessary permission. |
| Reminder scheduling | `chrome.alarms` | Durable event mechanism compatible with an ephemeral MV3 service worker. |
| System notifications | `chrome.notifications` | Extension-native system tray notification. |
| File contracts | JSON Schema Draft 2020-12 | Machine validation, editor/tool support, and reliable AI generation. |
| Runtime validation | Validator selected during implementation | Must support the committed schema dialect and produce useful instance paths. |
| Drag and drop | Library selected after keyboard-accessibility spike | Must support sortable lists, columns, and non-pointer alternatives without custom fragile sensors. |

Do not pin package versions in architecture prose. The implementation milestone must select and lock current compatible versions in the package manifest.

## Planned source layout

```text
entrypoints/
  newtab/                 # WXT HTML/React entrypoint
  background.ts           # alarm and notification listeners
src/
  domain/                 # entities, invariants, pure policies
  application/            # use cases and transaction orchestration
  infrastructure/
    db/                   # IndexedDB schema, repositories, migrations
    browser/              # alarms, notifications, downloads
    import-export/        # schema validation, mapping, deterministic export
  features/
    capture/
    inbox/
    goals/
    board/
    settings/
  components/             # reusable presentational components
  design-system/          # tokens and primitives
schemas/                   # public interchange contracts
examples/                  # valid files and AI prompt
tests/
  unit/
  integration/
  e2e/
```

## Layering rules

### Domain

Owns entity invariants, status transitions, ordering semantics, and relationship rules. It imports no React, WXT, Chrome, IndexedDB, or schema-validator modules.

### Application

Owns use cases such as `CreateGoal`, `MoveTask`, `ImportAiPlan`, `RestoreBackup`, and `ReconcileReminders`. It coordinates repository ports and transactions.

### Infrastructure

Implements repository ports and side effects. Chrome alarm identifiers and database table names do not leak into domain entities.

### Presentation

Renders application state and invokes use cases. Components do not query or mutate persistence directly.

## Persistence model

Use normalized stores for:

- goals
- phases
- tasks
- checklist items
- notes
- reminders
- settings
- migrations/import receipts when needed

Indexes should support parent lookup, status/order queries, due-time reconciliation, updated-time display, and optional links.

### Ordering

Each ordered entity has an integer `position`. Reordering may renumber siblings inside one transaction. Fractional ordering is unnecessary until profiling proves renumbering is a problem.

### Timestamps

Persist instants as RFC 3339 UTC strings. Persist an IANA time-zone ID for user-entered deadlines so the original wall-clock intent can be displayed and future recurrence support is not blocked.

### Migration

- Database version and interchange schema version are separate.
- Every database upgrade has a forward migration and tests using old fixtures.
- Never change a committed import/export meaning in place; add a compatible reader or a new major schema version.

## Reminder design

Persisted data is authoritative. Chrome alarms are derived and may be missing or delayed.

### State

```text
scheduled --due processed--> fired --manual delete--> removed
    |                            |
    +--edit dueAt----------------+
```

Editing a fired reminder to a future due time returns it to `scheduled` only through an explicit user action.

### Alarm identity

Use a namespaced deterministic key, for example:

```text
my-tracker:reminder:<reminder-id>
my-tracker:task-deadline:<task-id>
```

The key is infrastructure metadata, not a public entity ID format.

### Reconciliation triggers

Run reconciliation on:

- Extension install/update.
- Browser profile startup.
- Background service-worker start when inexpensive.
- Reminder/task deadline create, edit, complete, or delete.
- Backup restore.

Reconciliation compares all persisted scheduled deadlines with namespaced Chrome alarms, creates missing alarms, replaces changed alarms, clears orphans, and immediately processes overdue records according to one documented policy.

### Delivery limitation

Chrome alarms do not wake a sleeping device and may be delayed. Product copy must say “remind around this time” rather than promise real-time delivery. The visible persisted reminder remains the recovery surface.

## Import pipeline

```text
File bytes
  -> size/type guard
  -> UTF-8 JSON parse
  -> format and schema-version check
  -> full JSON Schema validation
  -> semantic validation
       unique external keys
       valid references
       valid normalized deadlines
       configured entity limits
  -> immutable preview model
  -> explicit confirmation
  -> map to domain commands and local IDs
  -> single transaction
  -> post-commit alarm reconciliation
  -> result summary
```

Schema validation proves shape; semantic validation proves cross-record and domain invariants.

No imported string is interpolated into HTML, code, a shell command, a URL navigation, or an agent prompt without an explicit later feature and security review.

## Export and restore

### AI plan

- Nested for authoring clarity.
- IDs are not trusted or required.
- Array order is meaningful.
- `externalKey` is a document-scoped correlation key, not a local ID.
- Initial implementation supports create-only import.

### Backup

- Normalized and lossless.
- Stable local IDs and timestamps are required.
- Deterministically sorted by position then ID.
- Restore replaces app-owned data after preview and confirmation.
- Restore and derived alarm reconciliation are separate phases; a reconciliation error does not corrupt restored domain data.

## Future sync seam

The MVP does not implement sync. To avoid blocking it:

- Use stable opaque IDs rather than array indexes as identity.
- Keep `createdAt`, `updatedAt`, and explicit deletion/archive semantics.
- Centralize all mutations in application use cases.
- Keep storage operations transactional.
- Preserve optional source namespace/external key metadata for imported plans.
- Do not claim that timestamps alone solve distributed conflicts. A future sync design must choose conflict semantics, tombstones, and an operation/version model explicitly.

## Permissions

Expected MVP manifest permissions:

- `alarms`
- `notifications`

The New Tab override is declared through the manifest/WXT entrypoint. IndexedDB requires no extension permission. The `storage` permission, host permissions, browsing history, tabs, identity, scripting, and network access are not required for the documented MVP.

Any added permission requires a product requirement, security rationale, user-facing consequence, and test.

## Security and privacy

- Content is local and plain text by default.
- No remote fonts or runtime CDN assets in core UI.
- Apply a restrictive extension Content Security Policy.
- Validate imported files before writes.
- Cap input size and entity counts before release.
- Avoid storing device fingerprint-like metadata in exports.
- Backup files are unencrypted portable data; the UI must say so.
- Uninstalling the extension may delete extension-owned data, so backup is the recovery mechanism.

## Verification strategy

### Unit

- Domain transitions, ordering, checklist behavior, time conversion, mapping, semantic validation, deterministic export.

### Integration

- IndexedDB repositories and transactions.
- Database migrations from fixtures.
- Import rollback on any invalid record.
- Backup round trip: export -> clean store restore -> equivalent domain state.
- Alarm reconciliation with a fake Chrome adapter.

### End to end

- Load unpacked extension and execute milestone journeys.
- Reopen New Tab and restart Chrome profile.
- Drag and keyboard move paths.
- Real notification in a dedicated test profile.
- Valid/invalid plan import and backup restore.

### Performance

- Production build with seeded realistic and stress datasets.
- Measure initial useful render, interaction latency, database query duration, and large-board behavior.
