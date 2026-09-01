# M5 — Backup and restore

**Title:** M5 Backup and restore
**User outcome:** Export the complete local state to a JSON file, and restore it later to replace the current state (e.g., in a clean profile).
**Why now:** Essential for user data safety, allowing users to back up their data before doing risky operations or migrating to a new machine. It builds on the validation patterns established in M4.
**In scope:**
- Export action: Gathers all records (goals, phases, tasks, checklist items, notes, reminders, settings) from IndexedDB, formats them according to `my-tracker-backup.schema.json`, and triggers a file download. Order must be deterministic (e.g., sorted by ID or position).
- Restore action: File input that parses the JSON, validates it against `my-tracker-backup.schema.json` (Draft 2020-12), and performs semantic checks.
- Restore preview and confirmation: Warn the user that this will completely *replace* all existing local data.
- Atomic restore: Replaces all IndexedDB stores in a single transaction.
- Post-restore alarm reconciliation: After successful restore, recalculate and set all `chrome.alarms` based on the newly imported reminders/deadlines.

**Out of scope:**
- Cloud or peer sync.
- Merging backups with existing data (this is a full overwrite replace).
- Scheduling automatic backups.

**Preconditions:**
- Schema available at `schemas/my-tracker-backup.schema.json`.
- M4 JSON validation infrastructure (`ajv`) is in place.

**Acceptance criteria:**
1. User can click "Export" and receive a valid JSON backup file containing all their data.
2. The export file strictly validates against `my-tracker-backup.schema.json`.
3. User can select a backup file for "Restore".
4. Invalid schemas or corrupted files are rejected before touching the database.
5. User is shown a preview (e.g., "This backup contains 5 goals, 12 tasks...") and a warning that current data will be erased.
6. Upon confirmation, the entire database is cleared and replaced atomically with the backup data.
7. Alarms are reconciled after restore so that imported reminders fire correctly.

**Failure and recovery cases:**
- Incompatible version or corrupted backup: Handled by schema validation, preserves existing data.
- IndexedDB transaction failure during restore: Write aborts, leaving previous data intact.

**Data/schema impact:**
- New use cases: `ExportBackup`, `RestoreBackup`.
- `TrackerRepositories` might need a `clearAll` or a unified `replaceState` mechanism that operates inside one transaction.

**UX/accessibility impact:**
- Export button and Restore file input (accessible).
- Destructive action confirmation (Restore) must be very clear.

**Verification evidence:**
- Dev tests: Round-trip equivalence test (export -> restore -> export produces identical data).
- QA tests: Clean-profile manual restore passes.
