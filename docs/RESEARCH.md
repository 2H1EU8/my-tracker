# Research notes

Research date: 2026-08-28.

These notes separate source findings from project decisions. Links are primary or official sources unless marked as a reference implementation.

## Reference implementation: evondev/new-tab-todo

Source: [GitHub repository](https://github.com/evondev/new-tab-todo)

Observed:

- It is a Chrome New Tab dashboard using React 18, Vite 5, TypeScript, Tailwind CSS v4, Manifest V3, and `chrome_url_overrides.newtab`.
- Its README describes local `chrome.storage.local` persistence and a `localStorage` fallback for browser-only development.
- Source is organized by feature (`reminders`, `todo`, `habits`, `settings`, and others) plus shared storage/date utilities.
- `create-storage.ts` places persistence behind a small `load/save/subscribe` interface and switches between `chrome.storage.local` and `localStorage`.
- Its reminder hook models recurring due dates and manual completion/undo in React state. The inspected code does not establish a background alarm plus operating-system notification design.

What My Tracker adopts:

- Feature-oriented modules.
- A storage boundary rather than direct persistence calls throughout UI code.
- A fallback-friendly development experience.
- The simple unpacked build/load workflow.

What My Tracker intentionally changes:

- Use an IndexedDB repository for normalized, transactional project data rather than whole arrays stored under independent keys.
- Use a Manifest V3 background service worker with Chrome alarms and notifications for deadline delivery.
- Keep v1 reminders one-time, persistent-after-fire, and simpler than a recurring habit/reminder model.
- Add explicit, versioned import/export contracts and transactional validation.

## Chrome New Tab and Manifest V3

Sources:

- [Override Chrome pages](https://developer.chrome.com/docs/extensions/develop/ui/override-chrome-pages)
- [Manifest file format](https://developer.chrome.com/docs/extensions/reference/manifest)
- [WXT entrypoints](https://wxt.dev/guide/essentials/entrypoints)

Findings:

- Chrome supports replacing New Tab through `chrome_url_overrides` with `newtab`.
- Chrome recommends override pages be quick and small because users expect built-in pages to open instantly.
- WXT recognizes a `newtab` entrypoint and generates the override manifest entry.
- A WXT background entrypoint becomes an MV3 service worker.

Decision impact:

- New Tab load behavior is a product requirement, not only an optimization.
- WXT is a suitable build baseline but domain code stays framework-independent.

## Storage

Sources:

- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [Storage and cookies in extensions](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies)
- [WXT Storage](https://wxt.dev/storage)

Findings:

- `chrome.storage` is asynchronous, extension-specific, available to service workers, and suitable for JSON-serializable values.
- Chrome advises against relying on Web Storage for extension service workers; service workers cannot access `localStorage`.
- IndexedDB is available in extension service workers and extension pages.
- Storage choices have quotas and performance costs; extension data can still be lost on uninstall, making manual backup important.

Decision impact:

- Store structured domain data in IndexedDB behind repositories.
- Do not use `localStorage` as the production source of truth.
- Keep backup/restore within MVP scope.

## Reminder scheduling

Sources:

- [Chrome Alarms API](https://developer.chrome.com/docs/extensions/reference/api/alarms)
- [Notify users](https://developer.chrome.com/docs/extensions/develop/ui/notify-users)
- [Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Migrate timers to alarms](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers)

Findings:

- `chrome.alarms` schedules future background events and requires the `alarms` permission.
- `chrome.notifications` creates system-tray notifications and requires the `notifications` permission.
- MV3 service workers terminate after inactivity; global variables and normal timers are not durable state.
- Chrome explicitly recommends alarms instead of `setTimeout`/`setInterval` for delayed service-worker work.
- Alarms do not wake a sleeping device and may fire after the device wakes.
- Important alarms should be checked/recreated because persistence behavior can vary with browser version and lifecycle.

Decision impact:

- Persist reminder intent first, then derive and reconcile Chrome alarms.
- Never promise exact notification time.
- Fired records remain in the UI as recovery evidence.

## JSON Schema and AI-authored plans

Sources:

- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)
- [JSON Schema specification](https://json-schema.org/specification)
- [Declaring the schema dialect](https://json-schema.org/understanding-json-schema/reference/schema)

Findings:

- JSON Schema defines and validates the structure of JSON documents.
- Draft 2020-12 is the current published version in the official specification index at research time.
- A schema should declare `$schema` so tools know which dialect to use.
- Structural schema validation does not replace semantic checks for unique cross-document keys, references, transactions, or domain rules.

Decision impact:

- Commit schemas beside code and examples.
- Use strict v1 objects to catch AI-generated typos.
- Add semantic validation and a preview before any import write.

## iCalendar interoperability

Source: [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html)

Findings:

- iCalendar defines `VTODO` for action items, with properties including `DUE`, `STATUS`, `PRIORITY`, `SUMMARY`, and relationships.
- VTODO statuses include `NEEDS-ACTION`, `IN-PROCESS`, `COMPLETED`, and `CANCELLED`.
- `VALARM` can be associated with a to-do.
- `VTODO` components cannot be nested, though they can be related.

Decision impact:

- iCalendar is useful as a future adapter for individual tasks/reminders.
- It is not the canonical backup because the product hierarchy and extension-specific metadata would be lossy or inconsistently supported.

## Codex project instructions

Source: [Official OpenAI documentation for AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

Findings:

- Codex reads `AGENTS.md` before work and layers instructions from project root toward the working directory.
- Root instructions should carry repository-wide expectations; specialized overrides can live closer to specialized code when needed.

Decision impact:

- Use root `AGENTS.md` for non-negotiable product and engineering rules.
- Keep role playbooks in `docs/agents/` as referenced working documents, not pretend they are automatically loaded instruction overrides.
