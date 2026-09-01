# M3 — Reminder delivery

**Title:** M3 Reminder Delivery
**User outcome:** Create a date/time reminder or task deadline and receive a system notification even when New Tab is not open.
**Why now:** M1 and M2 established the core goal/task flow and quick capture. M3 brings the notification mechanism for time-based tracking to fulfill the "reminders" functionality of the product.
**In scope:**
- Add `entrypoints/background.ts` for Manifest V3 background service worker.
- Add browser adapters for `chrome.alarms` and `chrome.notifications` (`src/infrastructure/browser/`).
- Reminder entity state transitions (`scheduled` to `fired`) and alarm reconciliation.
- Create, edit, and delete functionality for standalone Reminders and Task Deadlines.
- Set `dueAt` and `notifyAtDue` on a Task.
- Listen for `chrome.alarms.onAlarm`, trigger `chrome.notifications.create`, and update the database state to `fired`.
- Reconcile alarms on startup (`chrome.runtime.onStartup`, `chrome.runtime.onInstalled`).
- Display scheduled, fired, and overdue reminders in the UI.

**Out of scope:**
- Recurring reminders and snooze (Post-MVP).
- iCalendar `VTODO` support.
- Push notifications or network requests.

**Preconditions:**
- M1 and M2 database and repository structures are in place.

**Acceptance criteria:**
1. A future reminder creates or updates a corresponding browser alarm.
2. When the alarm triggers, a system notification is shown, and the persisted reminder changes from `scheduled` to `fired` (recording `firedAt`).
3. A fired or overdue reminder stays visible in the UI until manual deletion.
4. Deleting a reminder clears its derived alarm.
5. On extension startup, install, update, or browser startup, persisted scheduled reminders/deadlines and Chrome alarms are reconciled. Missing alarms are recreated.
6. If an alarm fired while the browser was closed, the reconciliation logic processes overdue records.
7. Product copy discloses delivery limitations ("remind around this time" rather than exact real-time).

**Failure and recovery cases:**
- Sleep/wake, browser restart: Handled by reconciliation.
- Notification permission/API use fails: The reminder remains visible with a recoverable error state.

**Data/schema impact:**
- `Task` entity: Add `dueAt`, `timeZone` (RFC 3339/IANA strings), and `notifyAtDue` (boolean).
- `Reminder` entity: Add `dueAt`, `timeZone`, `state` (`scheduled` | `fired`), and `firedAt`.
- Use a namespaced deterministic key for alarms (e.g., `my-tracker:reminder:<id>`, `my-tracker:task-deadline:<id>`).

**UX/accessibility impact:**
- Form fields to set `dueAt` (datetime-local) must be keyboard operable.
- Fired and overdue states need distinct visual presentation (e.g., color or icon).

**Verification evidence:**
- Dev tests: Missing/orphan alarm reconciliation tests pass.
- QA tests: Real notification test passes in a dedicated Chrome profile.

**Dependencies/open questions:**
- None blocking implementation.
