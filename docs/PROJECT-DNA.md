# JARVIS HQ — PROJECT DNA

## 1. Mission

Jarvis HQ is a virtual AI software house and multi-model orchestration platform.

Its purpose is to coordinate AI models, specialist agents, project knowledge, memory, development workflows, testing and software delivery.

The architecture must remain modular and model-agnostic.

The first major project managed by Jarvis HQ is the basketball career simulation game.

Jarvis HQ must however be designed as a reusable software-house infrastructure that can manage future projects independently.

---

## 2. Human Authority

The human project owner is the final decision-maker.

Jarvis and all AI agents are collaborators and technical systems.

AI agents must not perform irreversible or sensitive actions without the required human approval.

---

## 3. Organizational Hierarchy

### Human Project Owner

Final authority over:

- strategic direction;
- product decisions;
- major changes;
- publication;
- monetization;
- sensitive operations.

### Jarvis

Lead Technical Engineer / Lead Programmer / Software House Orchestrator.

Jarvis is the operational and technical coordinator of the entire AI software house.

### Specialist Agents

- Al
- Rebecca
- John
- James

What each one is responsible for is defined only in [AGENT-REGISTRY.md](AGENT-REGISTRY.md). This document does not restate it.

---

# 4. Jarvis — Lead Technical Engineer

The responsibilities of Jarvis are defined in [AGENT-REGISTRY.md](AGENT-REGISTRY.md).

This document does not keep a second list.

---

# 5. Specialist Agents

The roles of Al, Rebecca, John and James are defined only in [AGENT-REGISTRY.md](AGENT-REGISTRY.md).

This document does not restate them.

An older copy of this document assigned Al to frontend and Rebecca to game design. That assignment is withdrawn.

John implements `apps/pivot23`, including its React interface, because the registry says so and because no frontend specialist is active.

---

# 6. Agent Identity Rule

This is a mandatory architectural rule.

Whenever Jarvis activates, assigns, delegates or prepares a task for Al, Rebecca, John or James, the task context must explicitly preserve the identity and role of the agent.

Jarvis must never rely exclusively on conversational memory to know who an agent is.

The persistent source is [AGENT-REGISTRY.md](AGENT-REGISTRY.md), including its machine-readable block.

Every generated task prompt must be constructed using that registry.

---

# 7. Multi-Model Architecture

Jarvis HQ must support multiple AI providers.

Initial providers:

- OpenAI
- xAI / Grok
- Anthropic / Claude
- Codex, when used, as an execution resource

Additional providers may be added later.

AI models are execution resources.

They are not the organizational authority.

They are not roles. They are not listed in the agent registry as agents.

Jarvis remains the orchestration layer.

---

# 8. AI Gateway

External AI providers should eventually be accessed through a common AI Gateway.

The gateway is specified in [../AI-GATEWAY-SPEC.md](../AI-GATEWAY-SPEC.md).

It is not implemented. No runtime calls a provider. Do not treat the specification as a running system.

Conceptual architecture, for when a task actually requires it:

Human
  ↓
Jarvis
  ↓
AI Gateway
  ↓
Provider Adapter
  ├── OpenAI
  ├── xAI
  ├── Anthropic
  └── Future providers

Provider-specific implementation must remain isolated from the rest of Jarvis HQ.

---

# 9. Project Memory

Shared project memory for the current game lives in [memory/README.md](memory/README.md).

Memory distinguishes between:

### Project Facts

Stable verified information. File: [memory/FACTS.md](memory/FACTS.md).

### Decisions

Accepted decisions, append-only. File: [memory/DECISIONS.md](memory/DECISIONS.md). A proposal is not a decision.

### Tasks

Open work. File: [memory/TASKS.md](memory/TASKS.md).

### Agent Knowledge

Roles. File: [AGENT-REGISTRY.md](AGENT-REGISTRY.md). Not a second copy of the roles inside this document.

### Temporary Context

A chat, a sandbox, an untracked file. Not memory.

Temporary context must not silently overwrite stable project facts.

---

# 10. Security

Secrets must never be committed to GitHub.

API keys, passwords, tokens and credentials must remain outside source code.

Secrets should eventually be provided through:

- environment variables;
- deployment secrets;
- secure secret-management systems.

No process in this repository reads a provider key today. An `.env.example` file is not required until such a process exists.

---

# 11. Development Philosophy

Jarvis HQ must be developed incrementally.

Every major subsystem should have:

1. a clear purpose;
2. a defined interface;
3. tests;
4. documentation;
5. error handling;
6. appropriate logging;
7. a recovery or rollback strategy where necessary.

The architecture should evolve according to real requirements.

---

# 12. Current Project

Current primary project:

Basketball Career Simulation Game, PIVOT 23, in `apps/pivot23`.

The game is the first project managed by Jarvis HQ.

Jarvis HQ itself must remain independent from the basketball game's implementation so that the same infrastructure can manage future projects.

The house does not yet have a runtime. Coordination is the repository, the memory, the tasks, branches, pull requests and CI.

---

# 13. Core Principle

Jarvis coordinates.

Specialists execute.

AI models provide intelligence and capabilities.

GitHub stores and versions the project.

The human project owner retains final authority.

No single AI model should become a permanent architectural dependency.
