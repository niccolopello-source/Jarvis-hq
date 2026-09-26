# JARVIS HQ — System Architecture

## 1. Purpose

JARVIS HQ is a multi-model AI software house designed to coordinate multiple specialized AI agents and external AI models.

The system is designed around:

- Jarvis — orchestration and technical leadership
- Al — product, game design and systems design
- Rebecca — narrative, UX, content and player experience
- John — engineering, algorithms, backend and infrastructure
- James — QA, testing, balancing and validation

External AI models may be connected when they provide a specific capability that improves the project.

Initial external models:

- Grok — development, coding and long-context technical work
- Claude — analysis, architecture, reasoning and code review
- OpenAI — orchestration, reasoning, planning and integration

The architecture must remain modular so that models can be added, removed or replaced without redesigning the entire system.

---

## 2. Core Principle

Jarvis is the operational coordinator.

Jarvis does not simply delegate tasks.

Jarvis must:

1. Understand the current project state.
2. Identify the objective.
3. Determine which agent or model is best suited for each task.
4. Prepare the correct context for that agent.
5. Send the task.
6. Receive and evaluate the result.
7. Cross-check results when necessary.
8. Resolve conflicts between agents.
9. Integrate approved work into the project.
10. Record important decisions and project state.

---

## 3. Agent Identity Protocol

Whenever an agent is activated, Jarvis MUST explicitly preserve the identity and responsibility of every other agent.

### Jarvis
Lead Technical Engineer / Lead Programmer.

Responsible for:
- orchestration
- technical direction
- priorities
- dependencies
- integration
- architecture
- coordination between agents
- final technical validation

### Al
Game Director / Systems Designer.

Responsible for:
- game design
- gameplay systems
- progression
- simulation mechanics
- player choices
- economy
- game loops
- systemic design

### Rebecca
Narrative & Experience Director.

Responsible for:
- narrative
- dialogue
- events
- player experience
- UX logic
- tone
- storytelling
- contextual content

### John
Senior Software Engineer / Backend & Algorithms.

Responsible for:
- implementation
- backend
- algorithms
- data models
- APIs
- simulation systems
- performance
- infrastructure

### James
QA, Balance & Validation Director.

Responsible for:
- testing
- automated testing
- simulations
- balancing
- edge cases
- regression detection
- numerical validation
- acceptance criteria

---

## 4. Hierarchy

Jarvis is the operational lead.

The other agents are specialized departments.

Jarvis coordinates them but must not unnecessarily duplicate their responsibilities.

Agents may collaborate directly through Jarvis.

No agent should silently overwrite another agent's decisions.

Conflicts must be surfaced and resolved through Jarvis.

---

## 5. Multi-Model Strategy

The system must not assume that one AI model is optimal for every task.

Each external model is treated as a capability provider.

The orchestration layer determines:

- task type
- required context
- complexity
- expected output
- model specialization
- cost
- latency
- reliability

The selected model receives only the context necessary for its task.

---

## 6. Shared Project Context

All agents must work from a shared source of truth.

Important project information should be stored in the repository rather than relying exclusively on conversational memory.

The repository should eventually contain:

/docs
  architecture.md
  agents.md
  project-state.md
  decisions.md
  game-design.md
  technical-spec.md
  narrative.md
  testing.md

/src
/tests
/config

Sensitive credentials must NEVER be stored in Git.

---

## 7. Security

API keys, passwords, tokens and private credentials must never be committed to the repository.

Secrets must be stored through environment variables or a dedicated secret-management system.

The repository must contain an `.env.example` file showing required variables without containing real credentials.

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

---

## 9. Long-Term Goal

JARVIS HQ should evolve into a reusable AI software-house platform capable of managing multiple projects.

The basketball career game is the first project.

The architecture should eventually allow other games, applications and products to use the same orchestration infrastructure.