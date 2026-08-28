# M1 implementation and verification runbook

## Scope

This runbook covers the M1 durable goal journey defined in
[`docs/work-items/M1_DURABLE_GOAL_SLICE.md`](work-items/M1_DURABLE_GOAL_SLICE.md):

```text
Open New Tab -> create Goal -> add Phase -> add Task -> move Task -> reopen
```

M1 stores goals, phases, and tasks in normalized IndexedDB stores. The React
presentation invokes `TrackerService`; it does not access IndexedDB directly.
The runtime has no account, telemetry, host permission, or network dependency.

## Build and automated checks

From the repository root:

```sh
pnpm install
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm build
```

The production directory to load unpacked is:

```text
.output/chrome-mv3
```

The generated manifest must contain:

- `manifest_version: 3`
- `chrome_url_overrides.newtab: "newtab.html"`
- Empty `permissions` and `host_permissions` arrays

## Load unpacked in Chrome

1. Open `chrome://extensions` in a disposable Chrome profile.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the repository's `.output/chrome-mv3` directory.
5. Open a New Tab and confirm My Tracker replaces Chrome's default page.

## Acceptance journey

1. With an empty database, create a goal using Enter.
2. Open the goal and create a phase using Enter.
3. Select the phase and create at least three tasks.
4. Use a named button to move a task from Todo to In Progress.
5. Use `Move before` or `Move after` on two tasks in one column.
6. Repeat the create, rename, move, and reorder actions with keyboard navigation.
7. Confirm focus returns to the moved task and the live region reports status and
   ordinal position.
8. Close the tab, open a new one, and verify hierarchy, titles, status, and order.
9. In DevTools Network, confirm the journey creates no network requests.

## Save-failure and retry check

M1 includes a narrowly scoped QA fault switch. Find the unpacked extension ID
on `chrome://extensions`, then open:

```text
chrome-extension://EXTENSION_ID/newtab.html?qaFailNextWrite=1
```

The first write in that page fails before the transaction begins. Confirm that:

1. The attempted title stays in the field.
2. `Changes are not saved` and a Retry action are visible.
3. No partial entity appears after reload.
4. Retrying succeeds because the switch fails only the first write.

Integration tests separately inject a failure after an IndexedDB write request
and prove that aborting the transaction preserves the previously committed data.

The switch is page-local and does not modify the database. It is exhausted after
one failed write in the current page, so an in-page Retry can succeed. Reloading
the same URL creates a new page and arms the one-shot failure again. It cannot
affect another Chrome profile, extension installation, or unrelated origin.

## Loading and load-failure checks

Use the same unpacked extension ID with these page-local query switches:

```text
chrome-extension://EXTENSION_ID/newtab.html?qaDelayLoadMs=1500
chrome-extension://EXTENSION_ID/newtab.html?qaFailLoadOnce=1
```

- `qaDelayLoadMs` delays only the first repository read in that page and is
  clamped to 0–5000 ms. Use it to verify `Loading local data` appears without a
  false empty-state flash.
- `qaFailLoadOnce` rejects only the first repository read. The shell must remain
  visible with `Retry loading`; the retry reads the real unchanged database.

Both switches reset on page reload and do not clear or rewrite existing data.
They may be combined with `&` when a delayed failure is useful.

## Known verification boundary

Automated tests use isolated `fake-indexeddb`. A real unpacked Chrome profile,
keyboard/focus inspection, 200% zoom, reduced motion, and DevTools Network
inspection remain manual QA evidence before M1 can pass its exit gate.
