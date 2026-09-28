# JARVIS HQ — PROJECT STATE

## 1. Purpose

This document records the current operational state of JARVIS HQ and its active project.

It is a living document.

It must describe the actual current state of the repository, systems, documentation, implementation and development progress.

It must not replace:

- architecture documentation;
- agent definitions;
- development workflow;
- project decisions;
- technical specifications.

Those documents define how the system should operate.

This document describes where the project currently is.

Current facts that can go stale in a day are also kept in [`memory/FACTS.md`](memory/FACTS.md). If this file and FACTS.md disagree about a date, a URL or a merge, FACTS.md wins until this file is edited again.

---

## 2. Current Project

Primary project:

PIVOT 23 — Basketball Career Simulation Game

Status:

Public production build is live. It is a beta demo, not a launch.

- URL: https://pivot23.vercel.app
- Source: `main` at `421a4a0` (merge of PR #1, 2026-09-28)
- Engine label in that bundle: `2.11.0-beta`

The app lives in `/apps/pivot23`. It contains the career simulator, browser UI, browser-based saves, a deterministic engine test, and a Playwright smoke test. It runs without an account, database, or AI provider.

Known holes, not closed by the deploy: retirement is only `age>=36`, real NBA franchise names are in the client, the black/white screen cause is still unknown, and the career-distribution audit was not run on this commit. See [`memory/TASKS.md`](memory/TASKS.md) and [`pivot23/AUDIT-GROK-001.md`](pivot23/AUDIT-GROK-001.md).

---

## 3. JARVIS HQ Status

Current phase:

Software House Foundation

Completed foundation areas include:

- agent organization;
- agent protocol;
- development workflow;
- project DNA;
- system architecture;
- AI Gateway specification;
- a first shared project memory for PIVOT 23 (`docs/memory/`).

JARVIS HQ's orchestration runtime and AI Gateway remain specifications and foundation work. The PIVOT 23 beta is a standalone game app inside this repository; it does not yet call JARVIS HQ services.

---

## 4. Organizational State

Active agents:

Jarvis
Al
Rebecca
John
James

The permanent identities and responsibilities of these agents are defined in the Agent Registry and related documentation.

Jarvis remains the central operational and technical coordinator.

Codex, Claude and Grok are models used as resources. They are not a second roster. The map is in [`memory/README.md`](memory/README.md).

---

## 5. Architecture State

The current architecture is based on:

- Jarvis orchestration;
- specialized agents;
- AI Gateway;
- external AI model providers;
- repository-based project knowledge;
- controlled development workflow;
- testing and validation;
- documented project decisions.

The architecture is intended to remain modular and provider-agnostic.

---

## 6. AI Model Infrastructure

Planned initial AI providers:

- OpenAI
- xAI
- Anthropic

The AI Gateway specification defines the abstraction layer between JARVIS HQ and external AI providers.

Provider-specific implementation has not yet been considered complete unless explicitly recorded elsewhere in this document.

---

## 7. Repository State

The repository is the project's technical source of truth.

Important project knowledge should be maintained in version-controlled documentation.

Current documentation areas include:

- Agent organization;
- Agent protocol;
- Development workflow;
- Project DNA;
- System architecture;
- AI Gateway specification;
- Project state;
- Shared project memory (`docs/memory/`);
- PIVOT 23 invariants, audit and voice (`docs/pivot23/`).

The repository currently contains:

- `/docs` — JARVIS HQ specifications, operating process, and project memory;
- `/apps/pivot23` — runnable browser game beta;
- `/.github/workflows/pivot23.yml` — build, engine test, and browser smoke checks.

The root `src/` tree duplicates foundation documents. Do not edit it. Edit `/docs`.

The root package exposes commands for starting and verifying PIVOT 23.

---

## 8. Current Development Status

Current priority:

Keep the public demo honest, then close the simulation defects in [`memory/TASKS.md`](memory/TASKS.md). Do not treat the deploy as a launch.

Immediate objectives:

1. Re-measure career distributions on `main`, not on the sandbox tree.
2. Resolve P0-LIFE without making age 36 unreachable.
3. Resolve P0-REPEAT so award streaks are not the normal Esordio career.
4. Decide P-005 (franchise names) before any launch presentation. The owner has not accepted a rename.
5. Implement JARVIS HQ's runtime and provider adapters as a separate follow-up, using the existing specifications.

---

## 9. Known Limitations

PIVOT 23 has a public production URL. It is not a finished launch. JARVIS HQ remains in its foundation phase.

The following areas may not yet be implemented:

- production AI Gateway;
- provider adapters;
- automated agent orchestration;
- a runtime that loads this memory by itself (the memory is files in git, which is enough for agents that can read the repo);
- complete task management beyond `docs/memory/TASKS.md`;
- career-distribution tests in CI.

These areas must be implemented incrementally according to project requirements.

---

## 10. Current Risks

Potential risks include:

- contradictory documentation (the 27 September reports still describe a pre-merge world below their correction banners);
- unclear responsibility boundaries;
- premature architectural complexity;
- unnecessary dependencies on a specific AI provider;
- insufficient automated validation of full careers;
- undocumented project decisions (new ones go to `docs/memory/DECISIONS.md`);
- implementation diverging from documented architecture;
- public use of real NBA franchise names;
- treating a local save hash as proof of a career.

JARVIS must continuously monitor these risks.

---

## 11. Next Development Milestone

The next milestone for the game is a demo whose documents match the URL and whose careers are not all the same length.

The next milestone for the house remains:

JARVIS HQ Minimum Viable Runtime

The milestone should establish the smallest functional implementation capable of:

- loading the project configuration;
- identifying the available agents;
- maintaining agent identities;
- receiving a task;
- selecting the responsible specialist;
- preparing a delegated task context;
- executing the required workflow;
- receiving the result;
- recording the result;
- maintaining project state.

The implementation should remain minimal and modular.

---

## 12. Update Rules

This document must be updated when a significant project-state change occurs.

Examples include:

- completion of a major subsystem;
- addition or removal of an AI provider;
- creation of a major architectural component;
- change of development phase;
- completion of a major milestone;
- discovery of an important limitation;
- resolution of a significant architectural issue.

Project-state information must reflect the actual repository state.

It must not describe planned functionality as completed functionality.

A status change that is only a fact (URL, SHA, test count) is also written to [`memory/FACTS.md`](memory/FACTS.md) in the same change.

---

## 13. Core Principle

This document answers one question:

"What is the actual current state of JARVIS HQ?"

It must remain factual, current and synchronized with the repository.

Architecture defines what the system is designed to be.

Project DNA defines what the system fundamentally represents.

Workflow defines how work is performed.

Project State defines where the project currently stands.
