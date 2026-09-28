# JARVIS HQ — System Architecture

## 1. Purpose

JARVIS HQ is a multi-model AI software house designed to coordinate specialized agents and external AI models.

The agents and their roles are defined only in [docs/AGENT-REGISTRY.md](docs/AGENT-REGISTRY.md).

This document does not restate them.

Models are execution resources. They are not roles. OpenAI, Claude, Grok and Codex may be used. None of them owns a kind of work.

The architecture must remain modular so that a model can be added, removed or replaced without redesigning the house.

---

## 2. Core Principle

Jarvis is the operational coordinator.

Jarvis must:

1. Understand the current project state.
2. Identify the objective.
3. Determine which agent is responsible, from the registry.
4. Prepare the correct context for that agent.
5. Send the task.
6. Receive and evaluate the result.
7. Cross-check results when necessary.
8. Resolve conflicts between agents.
9. Integrate approved work into the project.
10. Record important decisions and project state.

Choosing a model is step 3's tool, not a second organization chart.

---

## 3. Agent Identity Protocol

When an agent is activated, the identity comes from [docs/AGENT-REGISTRY.md](docs/AGENT-REGISTRY.md).

This file used to repeat the five roles, and it used to assign Grok to coding, Claude to review and OpenAI to orchestration. Those assignments are withdrawn.

---

## 4. Hierarchy

The human project owner is the final authority.

Jarvis is the operational lead.

The other agents are specialized departments, as named in the registry.

Jarvis coordinates them but must not unnecessarily duplicate their responsibilities.

No agent should silently overwrite another agent's decisions.

Conflicts must be surfaced and resolved through Jarvis.

---

## 5. Multi-Model Strategy

The system must not assume that one AI model is optimal for every task.

Each external model is a capability provider, not a role.

The orchestration layer determines:

- task type
- required context
- complexity
- expected output
- which existing agent is responsible
- which model, if any, executes that agent's task
- cost
- latency
- reliability

The selected model receives only the context necessary for its task.

There is no gateway runtime. The specification is [AI-GATEWAY-SPEC.md](AI-GATEWAY-SPEC.md). It stays a specification until a task requires a process that calls more than one provider.

---

## 6. What the repository actually contains

Verified on `main` before this branch, and still the layout this branch is allowed to change only in documents:

```text
docs/AGENT-REGISTRY.md          roles, the only copy
docs/PROJECT-DNA.md             house principles; points at the registry
docs/workflow.md               how work moves; points at the registry
docs/AGENT-OPERATING-MANUAL.md how a task is delegated
docs/agents.md                  stub; the text is the operating manual
docs/agent-protocol.md          stub; it was the same file as the manual
docs/project-state.md           where the house stands
docs/memory/                   facts, decisions, tasks
docs/pivot23/                  invariants, audit, voice
apps/pivot23/                   the game
.github/workflows/pivot23.yml   lint, typecheck, unit test, build, first-season smoke
AI-GATEWAY-SPEC.md              specification only
architecture.md                 this file
agents.md                       pointer; not a second roster
src/                            old copies; not a role source; not deleted on this branch
```

Not in the repository, and not implied by this document:

- `apps/hq`
- a gateway process
- `game-design.md`, `technical-spec.md`, `narrative.md`, `testing.md` as separate canon files
- `/tests` or `/config` at the root
- `.env.example`

Planned, and not built: a gateway runtime, only if a future task must call two providers from code. A Vercel ignored-build step so a document-only commit does not redeploy production. That setting is not in git. The document-only deploy of `228a748` is the evidence that it is still missing.

Sensitive credentials must NEVER be stored in Git.

---

## 7. Security

API keys, passwords, tokens and private credentials must never be committed to the repository.

Secrets must be stored through environment variables or a dedicated secret-management system, when a process needs them.

No process in this repository reads a provider key. `.env.example` is not required until that process exists.

---

## 8. Development Philosophy

The system must be incremental.

No major architectural component should be introduced without:

- a defined purpose
- an interface
- acceptance criteria
- tests where applicable
- documentation
- rollback capability

The architecture should remain simple during the beta phase and become more sophisticated only when justified by real project requirements.

Work lands on a branch and enters `main` through a pull request. A document-only change does not change the game.

---

## 9. Long-Term Goal

JARVIS HQ should evolve into a reusable AI software-house platform capable of managing multiple projects.

The basketball career game is the first project. It lives in `apps/pivot23`.

The architecture should eventually allow other games, applications and products to use the same orchestration infrastructure.

That infrastructure is not a running service today.
