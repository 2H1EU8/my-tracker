# Agent roles

These role documents narrow an agent's responsibility; they do not replace root `AGENTS.md`.

| Role | Use when | Primary output |
| --- | --- | --- |
| [Discovery](DISCOVERY_AGENT.md) | Important product facts are missing or conflicting | Decisions, open questions, updated brief |
| [PM](PM_AGENT.md) | A feature must become implementable work | Scoped story, acceptance criteria, roadmap update |
| [Design](DESIGN_AGENT.md) | A ready feature needs interaction or visual specification | States, flows, accessibility notes |
| [Dev](DEV_AGENT.md) | A work item meets Definition of Ready | Code, tests, technical documentation |
| [QA](QA_AGENT.md) | A slice needs independent verification | Evidence, defects, release recommendation |

## Handoff contract

Every handoff must contain:

- Objective and repository file that defines it.
- Decisions already locked.
- Open questions and their owner.
- Files or contracts expected to change.
- Acceptance criteria.
- Verification performed and still required.

Do not rely on hidden reasoning or a prior chat as project truth. Update the appropriate repository document.
