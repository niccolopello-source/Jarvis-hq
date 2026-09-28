# JARVIS HQ — PROJECT STATE

## 1. Purpose

This document records the current operational state of JARVIS HQ and its active project.

It is a living document.

It must describe the actual current state of the repository, systems, documentation, implementation and development progress.

It must not replace:

- the agent registry;
- the development workflow;
- project decisions;
- technical specifications.

Roles are not restated here. They live in [`AGENT-REGISTRY.md`](AGENT-REGISTRY.md).

Current facts that can go stale in a day are also kept in [`memory/FACTS.md`](memory/FACTS.md). If this file and FACTS.md disagree about a date, a URL or a merge, FACTS.md wins until this file is edited again.

---

## 2. Current Project

Primary project:

PIVOT 23 — Basketball Career Simulation Game

Status:

Public production build is live. It is a beta demo, not a launch.

- URL: https://pivot23.vercel.app
- Source of the game that was verified in production on 2026-09-28: `main` at `421a4a0`, then a document-only commit `228a748` was also deployed to production.
- Engine label in the bundle checked that day: `2.11.0-beta`

The app lives in `/apps/pivot23`. It contains the career simulator, browser UI, browser-based saves, a deterministic engine test, and a Playwright smoke test. It runs without an account, database, or AI provider.

Known holes, not closed by the deploy: retirement is only `age>=36` in the bundle that was inspected, real NBA franchise names were in that client, the black/white screen cause is still unknown, and the career-distribution audit was not run on this commit. See [`memory/TASKS.md`](memory/TASKS.md) and [`pivot23/AUDIT-GROK-001.md`](pivot23/AUDIT-GROK-001.md). The tasks stay open. This status file does not close them.

---

## 3. JARVIS HQ Status

Current phase:

Software House Foundation

Completed foundation areas include:

- a single agent registry;
- a workflow that points at that registry;
- project DNA that points at that registry;
- an AI Gateway specification, not a runtime;
- shared project memory for PIVOT 23 (`docs/memory/`).

JARVIS HQ does not orchestrate agents at runtime. Coordination is the repository, the memory, branches, pull requests and CI.

The normalization of the role documents is on branch `docs/hq-normalize-v1` until that pull request is merged. Until then, `main` still has the older role text in the files that branch changes.

---

## 4. Organizational State

Active agents are the five names in [`AGENT-REGISTRY.md`](AGENT-REGISTRY.md).

This file does not list their jobs.

OpenAI, Claude, Grok and Codex are execution resources. They are not a second roster. Codex is not an agent. See the registry, sections 10 and 11.

---

## 5. Architecture State

What exists is described in [`../architecture.md`](../architecture.md).

What is only specified is the AI Gateway. It has no process.

---

## 6. AI Model Infrastructure

No provider adapter is implemented.

No `.env.example` is required until a process reads a key.

---

## 7. Repository State

The repository is the project's technical source of truth.

`main` is the verified line. Work enters it through a pull request.

`src/` is an old copy of some foundation documents. It is not a role source. It is not deleted by the normalization branch.

The root package exposes commands for starting and verifying PIVOT 23. It is not a house runtime.

---

## 8. Current Development Status

Current priority:

Finish the document normalization, then the open simulation tasks in [`memory/TASKS.md`](memory/TASKS.md). Do not treat the deploy as a launch.

Immediate objectives:

1. Merge the normalization pull request only after review. Do not merge it from the agent that opened it, if the owner asked to review first.
2. Re-measure career distributions on `main`, not on the sandbox tree.
3. Resolve P0-LIFE without making age 36 unreachable. The task is open.
4. Resolve P0-REPEAT so award streaks are not the normal Esordio career. The task is open.
5. Decide P-005 (franchise names) before any launch presentation. The owner has not accepted a rename. It stays proposed.
6. Do not implement the gateway until a task requires two providers.

---

## 9. Known Limitations

PIVOT 23 has a public production URL. It is not a finished launch.

A document-only commit on `main` currently produces a new Vercel production deployment. That happened for `228a748`. The ignored-build setting is not changed in the normalization work. It is a separate task, and it is not a git file.

The following are not implemented:

- production AI Gateway;
- provider adapters;
- automated agent orchestration;
- a runtime that loads this memory by itself;
- career-distribution tests in CI.

---

## 10. Current Risks

- `src/` still contains the old role text until a later pull request removes it, after references are checked.
- The 27 September reports describe a pre-merge world below their correction banners.
- Public use of real NBA franchise names, not yet an accepted decision.
- Treating a local save hash as proof of a career.
- Calling a P0 closed without the proof in the task.

---

## 11. Next Development Milestone

The next milestone for the game is a demo whose documents match the URL and whose careers are not all the same length.

The next milestone for the house is not a runtime. It is a `main` whose governance documents agree with the registry.

A minimum runtime remains future work. It is not started.

---

## 12. Update Rules

This document must be updated when a significant project-state change occurs.

A status change that is only a fact (URL, SHA, test count) is also written to [`memory/FACTS.md`](memory/FACTS.md) in the same change.

It must not describe planned functionality as completed functionality.

It must not describe a proposed decision as an accepted one.

---

## 13. Core Principle

This document answers one question:

"What is the actual current state of JARVIS HQ?"

It must remain factual, current and synchronized with the repository.
