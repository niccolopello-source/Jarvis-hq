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

---

## 2. Current Project

Primary project:

PIVOT 23 — Basketball Career Simulation Game

Status:

Runnable Beta; end-to-end validation and demo packaging in progress

The basketball career simulation game is the first project managed by JARVIS HQ.

The app lives in `/apps/pivot23`. It contains the career simulator, browser UI, browser-based saves, a deterministic engine test, and a Playwright smoke test. It runs without an account, database, or AI provider.

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
- AI Gateway specification.

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
- Project state.

The repository currently contains:

- `/docs` — JARVIS HQ specifications and operating process;
- `/apps/pivot23` — runnable browser game beta;
- `/.github/workflows/pivot23.yml` — build, engine test, and browser smoke checks.

The root package exposes commands for starting and verifying PIVOT 23.

---

## 8. Current Development Status

Current priority:

Validate the PIVOT 23 beta as a browser demo while keeping JARVIS HQ's platform work explicit and separate.

Immediate objectives:

1. Run the career start-to-season flow in a browser and fix any runtime or layout defects.
2. Confirm production build and automated checks in GitHub Actions.
3. Publish a repeatable demo preview and record its URL.
4. Implement JARVIS HQ's runtime and provider adapters as a separate follow-up, using the existing specifications.

---

## 9. Known Limitations

PIVOT 23 is a runnable beta, not yet a published demo. JARVIS HQ remains in its foundation phase.

The following areas may not yet be implemented:

- production AI Gateway;
- provider adapters;
- automated agent orchestration;
- persistent project memory system;
- complete task management system;
- automated testing infrastructure;
- production deployment infrastructure.

These areas must be implemented incrementally according to project requirements.

---

## 10. Current Risks

Potential risks include:

- contradictory documentation;
- unclear responsibility boundaries;
- premature architectural complexity;
- unnecessary dependencies on a specific AI provider;
- insufficient automated validation;
- undocumented project decisions;
- implementation diverging from documented architecture.

JARVIS must continuously monitor these risks.

---

## 11. Next Development Milestone

The next milestone is:

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

---

## 13. Core Principle

This document answers one question:

"What is the actual current state of JARVIS HQ?"

It must remain factual, current and synchronized with the repository.

Architecture defines what the system is designed to be.

Project DNA defines what the system fundamentally represents.

Workflow defines how work is performed.

Project State defines where the project currently stands.
