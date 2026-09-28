# JARVIS HQ — Agent Operating Manual

## 1. Purpose

This document is how a task is delegated and reviewed.

It is not a second definition of the roles.

Roles are defined only in [AGENT-REGISTRY.md](AGENT-REGISTRY.md).

An older copy of this manual assigned Al to frontend and Rebecca to game design. That assignment is withdrawn. Where this file and the registry ever differ, the registry wins, and this file must be changed.

---

## 2. Who does the current game

For `apps/pivot23`:

- Al defines product and game-design intent, when the behaviour is in question.
- Rebecca defines narrative, dialogue and player-facing experience.
- John implements the system and the React interface.
- James validates with tests and simulations.
- Jarvis coordinates.

This is a reminder of the registry, not a new table. If the reminder and the registry diverge, fix the reminder.

---

## 3. Delegation

Before delegating a task, Jarvis writes:

1. Task ID
2. Project
3. Agent identity
4. Agent role, copied from the registry
5. Objective
6. Context
7. Requirements
8. Constraints
9. Dependencies
10. Expected output
11. Acceptance criteria
12. Relevant files
13. Other agents involved
14. Validation method
15. Integration requirements

A model may be named as the execution resource. The agent in item 3 stays Al, Rebecca, John or James.

Codex is not a valid value for item 3.

---

## 4. Collaboration

A feature that crosses domains:

- Al states the intended behaviour, when design is in question.
- Rebecca states the words and the experience, when the player reads something.
- John implements it in `apps/pivot23`.
- James says whether the acceptance test passes.
- Jarvis does not silently pick a different owner.

No agent overwrites another agent's decision without that conflict being written down.

---

## 5. Conflict

1. Jarvis names the conflict.
2. The registry and [memory/DECISIONS.md](memory/DECISIONS.md) are read.
3. Each affected specialist states the consequence of its proposal.
4. Jarvis coordinates a resolution.
5. If the resolution is a product decision, it is appended to the decision log. A proposal is not promoted to accepted by the resolution itself. The owner accepts.

---

## 6. Output

When the task is technical, the output names:

- objective
- what was true before
- the change
- files
- the test that failed before and passes after, when the task is a defect
- what was not changed

A P0 is not closed because the code looks right. The proof is the one written in [memory/TASKS.md](memory/TASKS.md).

---

## 7. Integration

Work is not integrated because it exists.

It is integrated when it is on a branch, in a pull request, and on `main` only after the pull request is merged.

A document-only pull request must not change `apps/pivot23`.

Jarvis does not merge a pull request on its own when the owner has asked to review it.

---

## 8. Source of truth

`main` of `niccolopello-source/Jarvis-hq` is the verified source of truth.

[AGENT-REGISTRY.md](AGENT-REGISTRY.md) is the role source.

[memory/FACTS.md](memory/FACTS.md) wins over older status sentences.

[agents.md](agents.md) and [agent-protocol.md](agent-protocol.md) are stubs. They used to be copies of this manual, including the withdrawn role text. They are not a protocol of their own.

`src/` is an old copy. It is not a role source.
