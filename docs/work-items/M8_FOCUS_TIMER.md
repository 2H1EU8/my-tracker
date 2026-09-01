# M8 — Focus Timer

**Title:** M8 Focus Timer
**User outcome:** Create a focus session attached to a specific task, track time visually, receive a notification when the time is up, and maintain a history of time spent per task.
**Why now:** Supports deeper work and productivity directly on tasks, extending the time-based functionality introduced in M3 (Reminders).

**In scope:**
- Ability to start a focus session from a Task detail view.
- Configurable duration: fixed presets (15 min rest, 30, 45, 60 mins), unlimited (stop manually), or custom user input.
- A persistent mini-timer in the global header or as a floating widget, so the active timer is always visible across the app.
- Background tracking using `chrome.alarms` so the timer continues even if the New Tab is closed, triggering a native system notification when the session completes.
- Persistent session logging: saving a history of completed sessions (duration, start/end times) attached to the task, and calculating total time spent per task.

**Out of scope:**
- App blocking or website blocking capabilities.
- Advanced Pomodoro sequences (e.g. automatically chaining 4 work sessions and 1 long rest).
- Syncing timer state across multiple devices in real-time.

**Preconditions:**
- Task hierarchy and detail view (M1, M2).
- Alarm and notification infrastructure (M3).

**Acceptance criteria:**
1. User can click "Start Focus" on a Task and choose a duration (15, 30, 45, 60, unlimited, or custom).
2. Starting a session transitions the UI to show the active countdown in a global sticky element.
3. A `chrome.alarm` is scheduled for the end of the session (if not unlimited).
4. Navigating around the app keeps the sticky timer visible.
5. When the time is up, a system notification fires and the session is marked as completed in the database.
6. The Task detail view displays the total time spent and a log of completed sessions.
7. User can manually stop a session early, which logs the elapsed time.

**Failure and recovery cases:**
- Browser closed during session: Alarm still fires. On next open, reconciliation ensures the session is marked complete.
- Overlapping sessions: Only one active session is allowed at a time. Starting a new one requires stopping the current one.

**Data/schema impact:**
- New entity: `FocusSession` (id, taskId, startedAt, durationMinutes, endedAt, state).
- Database repository to store and query sessions by task.
- Ensure the backup/restore schema (M5) is updated to include `FocusSession` records.

**UX/accessibility impact:**
- The persistent mini-timer must be keyboard accessible (to stop/pause).
- The timer should use `aria-live` or similar updates sparingly to avoid overwhelming screen readers every second.

**Verification evidence:**
- Dev tests: Timer state reconciliation, database logging.
- QA tests: Closing the browser during a 1-minute timer and verifying the notification and logged time.
