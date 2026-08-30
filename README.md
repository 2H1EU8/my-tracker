# My Tracker

My Tracker is a local-first Chrome new-tab extension for fast personal capture and visual project planning.

The product combines two workflows:

- Quick notes and persistent deadline reminders.
- Large goals decomposed into phases, tasks, and task checklists.

The MVP is intentionally private and offline: no account, backend, cloud sync, collaboration, analytics, or built-in AI. AI tools participate by generating a schema-valid plan file that the user reviews and imports manually.

## Product shape

```text
Goal
  -> Phase
       -> Task (Kanban card)
            -> Checklist item
```

The default task workflow is `Todo -> In Progress -> Done`. Notes and reminders may optionally link to a goal or task but never require a link.

## Planned technical baseline

- Chrome Extension Manifest V3, loaded unpacked for the MVP.
- WXT, React, and TypeScript.
- A WXT new-tab entrypoint plus a background service worker.
- IndexedDB behind a repository boundary for domain data.
- `chrome.alarms` and `chrome.notifications` for reminders.
- Versioned JSON validated by JSON Schema Draft 2020-12 for backup and AI-plan import.

Milestone 1 is complete. The WXT/React New Tab shell, domain/application layers,
normalized IndexedDB persistence, unpacked Chrome journey, reopen persistence,
and offline boundary all pass. Milestone 2 is ready to start.

## Documentation map

- [Product brief](docs/PRODUCT_BRIEF.md)
- [Product requirements](docs/PRD.md)
- [UX specification](docs/UX_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data contract](docs/DATA_CONTRACT.md)
- [Roadmap](docs/ROADMAP.md)
- [Decision log](docs/DECISIONS.md)
- [Research notes](docs/RESEARCH.md)
- [Agent roles](docs/agents/README.md)
- [AI plan prompt](examples/AI_PLAN_PROMPT.md)

## Machine-readable contracts

- `schemas/my-tracker-ai-plan.schema.json`: human/AI-authored plan import.
- `schemas/my-tracker-backup.schema.json`: lossless application backup.
- `examples/ai-plan.example.json`: valid import example.

The schemas are the source of truth for file shape. The TypeScript domain model must be generated from, or checked against, these contracts once implementation begins.

## Current phase

M1 completed and verified this vertical slice:

```text
Open New Tab -> create Goal -> add Phase -> add Task -> move Task -> reopen -> data remains
```

M2 is next: checklist items and the personal notes inbox. See
`docs/ROADMAP.md` for its scope and acceptance gates.

## Local development

Prerequisites: Node.js and pnpm.

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Load `.output/chrome-mv3` from `chrome://extensions` with Developer mode enabled
and **Load unpacked**. Detailed M1 verification and recovery steps are in
[`docs/M1_RUNBOOK.md`](docs/M1_RUNBOOK.md).
