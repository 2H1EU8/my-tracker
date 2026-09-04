# M3 QA test plan

## Status

`Q01–Q05 passed.` Automated regression passed on 2026-09-04 (`pnpm qa:release`). Q06 and Q07 (real OS notifications and device sleep/wake delivery) are blocked pending manual owner execution.

## QA artifact targets

- Primary ongoing regression target: the freshly rebuilt current checkout at `HEAD`, loaded from `.output/chrome-mv3`.
- No historical boundary tests are required strictly for M3 besides upgrade paths (which are covered in M5's backup migration and Q22 of M2).

## Automated Gates

- **Unit/Integration Tests**: Alarm scheduling and notification adapters.
- **Missing/Orphan Alarm Reconciliation Tests**: Ensure `chrome.alarms` are correctly created/removed when the background script wakes up and compares IndexedDB state.

## Test Scenarios

### Q01: Alarm creation
- **Preconditions**: A task exists.
- **Steps**: Set a future `dueAt` and toggle `notifyAtDue` to true.
- **Expected**: A `chrome.alarms` entry is created with the deterministic task-deadline ID.
- **Evidence**: Automated passing unit/integration test for `ReminderRepository` and `AlarmAdapter`.

### Q02: Reminder fires and updates state
- **Preconditions**: A future reminder is scheduled.
- **Steps**: Alarm triggers (simulate `onAlarm`).
- **Expected**: `chrome.notifications.create` is called. The persisted reminder transitions from `scheduled` to `fired`, recording `firedAt`.
- **Evidence**: Automated passing unit/integration test.

### Q03: Fired reminder UI persistence
- **Preconditions**: A reminder is in the `fired` state.
- **Steps**: Open the New Tab.
- **Expected**: The reminder is visible with a distinct fired/overdue visual presentation. It remains until manual deletion.
- **Evidence**: Automated Playwright UI tests or manual visual confirmation.

### Q04: Alarm cleanup on deletion
- **Preconditions**: A scheduled reminder exists.
- **Steps**: Delete the reminder.
- **Expected**: The corresponding `chrome.alarms` entry is removed.
- **Evidence**: Automated passing test.

### Q05: Startup Reconciliation (Browser closed)
- **Preconditions**: A reminder was scheduled to fire while the browser was completely closed.
- **Steps**: Trigger `onStartup`.
- **Expected**: The background script identifies the overdue reminder, fires the notification, and updates the state. Missing alarms for future reminders are re-created.
- **Evidence**: Automated unit tests for reconciliation logic.

### Q06: Real notification delivery (Manual Required)
- **Preconditions**: Running the unpacked extension in a real Chrome profile.
- **Steps**: Create a reminder for 1 minute in the future. Wait 1 minute.
- **Expected**: The operating system displays the Chrome system notification.
- **Evidence**: Manual verification required. 

### Q07: Sleep/wake delivery (Manual Required)
- **Preconditions**: Running the unpacked extension in a real Chrome profile.
- **Steps**: Create a reminder for 2 minutes in the future. Put the device to sleep for 3 minutes, then wake it up.
- **Expected**: The notification is delivered upon waking up (or standard Chrome behavior for missed alarms), and the state transitions to `fired`.
- **Evidence**: Manual verification required.
