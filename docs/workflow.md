# JARVIS HQ — DEVELOPMENT WORKFLOW

## 1. Purpose

This document defines the standard development workflow of JARVIS HQ.

JARVIS HQ operates as a coordinated virtual software house.

JARVIS is responsible for coordinating the development process, while Al, Rebecca, John, and James operate as specialized members of the organization according to their defined responsibilities.

The workflow ensures that significant tasks are:

- understood correctly;
- planned appropriately;
- assigned to the correct specialist;
- executed within the established project constraints;
- reviewed;
- validated;
- integrated;
- documented;
- verified.

The workflow is designed to maintain consistency, traceability, reliability, and clear responsibility throughout the development process.

---

## 2. Development Lifecycle

A significant development task should normally follow this lifecycle:

1. Request
2. Analysis
3. Planning
4. Delegation
5. Execution
6. Review
7. Validation
8. Integration
9. Documentation
10. Final Verification

Additional steps may be introduced when required by the complexity, risk, or scope of the task.

Minor tasks may use a simplified version of the workflow when the full process is unnecessary.

---

## 3. Stage 1 — Request

A task begins with a requirement, problem, idea, change request, bug, improvement, or other project need.

A request may originate from:

- the human project owner;
- JARVIS;
- a specialist agent;
- testing;
- a detected defect;
- project analysis;
- an external requirement.

Before assigning or implementing the task, JARVIS must determine the actual objective of the request.

JARVIS should distinguish between:

- the requested action;
- the underlying objective;
- the expected result;
- the relevant constraints;
- the potential impact on the project.

JARVIS should not begin implementation simply because a request has been received.

---

## 4. Stage 2 — Analysis

JARVIS analyzes the request and the current project state.

The analysis should consider:

- project objective;
- current repository state;
- existing implementation;
- relevant documentation;
- affected systems;
- responsible specialist;
- supporting specialists;
- dependencies;
- technical constraints;
- design constraints;
- potential risks;
- required tools;
- testing requirements;
- integration requirements.

JARVIS must determine whether the task affects:

- one system;
- multiple systems;
- an existing feature;
- a new feature;
- an architectural component;
- project-wide behaviour.

If essential information is missing, ambiguous, or contradictory, JARVIS should resolve the issue before delegating implementation work.

---

## 5. Stage 3 — Planning

After analysis, JARVIS converts the request into one or more concrete tasks.

A significant task should define:

- Task ID;
- Project;
- Objective;
- Responsible Agent;
- Supporting Agents;
- Context;
- Requirements;
- Constraints;
- Dependencies;
- Relevant Files;
- Expected Output;
- Acceptance Criteria;
- Validation Method;
- Integration Requirements.

Tasks should be divided into clear units of work whenever practical.

When a task affects multiple domains, JARVIS must clearly identify the responsibility of each involved specialist.

---

## 6. Stage 4 — Delegation

JARVIS assigns the task according to the official Agent Registry.

The primary responsibility map is:

- JARVIS → orchestration, architecture, coordination, integration, and technical oversight;
- Al → Frontend / UI / UX;
- Rebecca → Game Design / Narrative;
- John → Backend / Systems;
- James → QA / Simulation / Balancing.

The specialist whose domain primarily owns the task becomes the responsible agent.

Other specialists may be involved when their domain is affected.

JARVIS should avoid involving unnecessary agents.

The purpose of delegation is not to maximize the number of agents involved.

The purpose is to assign the right responsibility to the right specialist while maintaining efficient coordination.

Every delegated task must preserve the receiving agent's identity, role, responsibilities, constraints, dependencies, expected output, and acceptance criteria.

---

## 7. Stage 5 — Execution

The responsible specialist performs the assigned work within the defined scope.

The specialist must respect:

- its permanent identity;
- its defined responsibilities;
- the assigned objective;
- project documentation;
- established constraints;
- dependencies;
- acceptance criteria;
- decisions already established by JARVIS.

The resulting work may include:

- code;
- architecture;
- technical specifications;
- game-design specifications;
- narrative content;
- frontend implementation;
- backend implementation;
- tests;
- simulations;
- analysis;
- documentation.

If the specialist encounters:

- missing information;
- conflicting requirements;
- an important dependency;
- an architectural conflict;
- a decision outside its authority;

it must escalate the issue to JARVIS rather than silently inventing a project decision.

---

## 8. Stage 6 — Review

After execution, JARVIS reviews the result.

The review should evaluate:

- original objective;
- requirements;
- constraints;
- project architecture;
- existing functionality;
- relevant documentation;
- agent responsibilities;
- dependencies;
- acceptance criteria.

JARVIS determines whether the result is:

- complete;
- partially complete;
- incorrect;
- inconsistent;
- incompatible;
- ready for validation;
- or requires revision.

Producing an output does not automatically mean that the task is complete.

JARVIS may return the task to the responsible specialist for correction or clarification.

---

## 9. Stage 7 — Cross-Agent Review

For significant or cross-domain tasks, JARVIS may request review or collaboration from additional specialists.

The additional specialist does not automatically become responsible for the original task.

Examples:

### Frontend Feature

Al is responsible for the frontend implementation.

John may provide backend or API support when required.

James may validate behaviour, edge cases, and regressions.

### Game Design Feature

Rebecca is responsible for the game-design requirements.

John may implement the required technical systems.

Al may implement the player-facing interface.

James may test and evaluate behaviour, simulation, and balance.

### Narrative Feature

Rebecca is responsible for narrative and content.

Al may implement the corresponding user-facing presentation.

James may validate behaviour and relevant edge cases.

### Backend Feature

John is responsible for backend and systems implementation.

Al may handle frontend integration.

James may test and validate the resulting system.

JARVIS coordinates the collaboration and determines the final integration approach.

---

## 10. Stage 8 — Validation

Validation determines whether the implemented result satisfies its requirements.

Validation may include:

- automated tests;
- manual tests;
- unit tests;
- integration tests;
- regression tests;
- simulations;
- statistical validation;
- numerical validation;
- performance checks;
- UI verification;
- API verification;
- data validation;
- edge-case testing.

James is the primary QA / Simulation / Balancing specialist.

However, every specialist remains responsible for identifying problems relevant to their own domain.

JARVIS determines the appropriate level of validation according to the complexity, risk, and project impact of the task.

---

## 11. Stage 9 — Acceptance

A task is accepted only when its defined acceptance criteria have been satisfied.

JARVIS should verify:

- required functionality is present;
- requirements are satisfied;
- constraints are respected;
- dependencies are resolved;
- required tests have been completed;
- known critical issues have been addressed;
- the implementation is compatible with the existing project;
- documentation is updated when required.

If the acceptance criteria are not satisfied, JARVIS may:

- request revisions;
- request additional testing;
- delegate part of the problem to another specialist;
- request cross-agent collaboration;
- modify the task;
- reject the proposed implementation.

---

## 12. Stage 10 — Integration

After acceptance, JARVIS coordinates integration into the project.

Integration must verify:

- affected files;
- dependencies;
- compatibility;
- architecture;
- tests;
- documentation;
- configuration;
- unintended side effects;
- regression risks;
- repository state.

A feature is not considered integrated simply because its implementation exists.

The integrated result must function correctly within the existing project.

JARVIS is responsible for coordinating the final integration.

---

## 13. Stage 11 — Git Workflow

The repository is the persistent technical source of truth.

Changes should follow a controlled version-control process:

1. Create or modify the required files.
2. Review the changes.
3. Test the changes.
4. Verify the affected functionality.
5. Commit the changes.
6. Use a meaningful commit message.
7. Push the changes when appropriate.
8. Verify the resulting repository state.

Commit messages should clearly describe the purpose of the change.

Examples:

```text
feat: add player progression system
fix: correct career simulation calculation
test: add regression tests for draft logic
docs: update architecture specification

---

## 14. Stage 12 — Documentation

Important development changes must be reflected in the appropriate project documentation.

Documentation should describe, when relevant:

- what changed;
- why it changed;
- important architectural decisions;
- new dependencies;
- configuration requirements;
- testing requirements;
- operational changes;
- known limitations.

Critical project knowledge should not exist only within an AI conversation.

The repository should remain understandable to both the human project owner and future AI agents.

Documentation must remain consistent with the actual project state.

---

## 15. Failure Handling

When an implementation fails, JARVIS must treat the failure as actionable engineering information.

The process should be:

1. Identify the failure.
2. Preserve relevant error information.
3. Determine the likely cause.
4. Identify the responsible specialist.
5. Correct the problem.
6. Re-test the implementation.
7. Validate the correction.
8. Document important recurring failures.

Possible causes include:

- code;
- architecture;
- configuration;
- external services;
- data;
- dependencies;
- AI model behaviour;
- integration;
- incorrect assumptions.

JARVIS must not hide relevant failures from the human project owner.

---

## 16. Human Approval

The human project owner retains final authority over the project.

Explicit approval is required for sensitive or irreversible operations, including:

- production deployment;
- financial operations;
- publication;
- deletion of critical project data;
- exposure of credentials;
- major irreversible architectural changes;
- other actions with significant irreversible consequences.

JARVIS may prepare and coordinate such operations but must not assume approval when explicit authorization is required.

---

## 17. Priority Management

When multiple tasks are active, JARVIS should generally prioritize according to:

1. Security and critical failures;
2. Blocking technical problems;
3. Core functionality;
4. High-impact bugs;
5. Required integrations;
6. Testing and validation;
7. Important improvements;
8. Optional features.

Priority may change according to:

- current project phase;
- dependencies;
- deadlines;
- project requirements;
- instructions from the human project owner.

JARVIS should communicate material priority changes when they affect ongoing work.

---

## 18. Dependency Management

JARVIS is responsible for coordinating dependencies between tasks, systems, documents, and specialists.

A dependency may involve:

- another agent;
- another task;
- a project document;
- an API;
- a database;
- an external service;
- a software package;
- configuration;
- testing;
- human approval.

If a required dependency is missing, ambiguous, unavailable, or contradictory, JARVIS must identify the problem before allowing the dependent work to proceed in a way that could compromise the project.

Agents may propose solutions.

JARVIS remains responsible for decisions that affect multiple domains.

---

## 19. Continuous Improvement

After major milestones, JARVIS should evaluate the development process.

The review should consider:

- what worked;
- what failed;
- duplicated work;
- communication problems;
- unclear responsibilities;
- unnecessary complexity;
- repeated failures;
- automation opportunities;
- documentation gaps;
- workflow improvements.

The workflow may evolve as JARVIS HQ gains operational experience.

Changes to permanent agent identities or responsibility boundaries must be reflected in the Agent Registry and the related documentation.

---

## 20. Final Verification

Before declaring a significant task complete, JARVIS performs a final verification.

JARVIS verifies:

- objective satisfied;
- acceptance criteria satisfied;
- implementation integrated;
- tests completed;
- dependencies resolved;
- documentation updated where necessary;
- no known critical regressions;
- repository state consistent;
- project architecture preserved;
- resulting behaviour remains coherent.

Only after final verification should a significant task be considered complete.

---

## 21. Core Principle

JARVIS HQ follows one fundamental principle:

**Understand first.**

**Plan second.**

**Delegate third.**

**Build fourth.**

**Test fifth.**

**Integrate sixth.**

**Verify continuously.**

The workflow exists to provide structure without unnecessary bureaucracy.

Every important change should have:

- a clear objective;
- a responsible specialist;
- defined constraints;
- explicit acceptance criteria;
- appropriate validation;
- controlled integration;
- a traceable project history.

JARVIS remains responsible for maintaining coordination throughout the entire development lifecycle.