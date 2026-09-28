# JARVIS HQ — DEVELOPMENT WORKFLOW

## 1. Purpose

This document defines the standard development workflow of JARVIS HQ.

JARVIS HQ operates as a coordinated virtual software house.

JARVIS coordinates. The specialists are the five names in [AGENT-REGISTRY.md](AGENT-REGISTRY.md).

This workflow does not define their roles. If a sentence here disagrees with the registry, the registry wins and this sentence is wrong.

The workflow ensures that significant tasks are understood, planned, assigned, executed, reviewed, validated, integrated and documented.

---

## 2. Development Lifecycle

1. Request
2. Analysis
3. Planning
4. Delegation
5. Execution
6. Review
7. Cross-agent review, when the task crosses domains
8. Validation
9. Acceptance
10. Integration, through a pull request into `main`
11. Documentation
12. Final verification

Minor tasks may skip stages that do not apply. A defect does not skip the test named in its task.

---

## 3. Request

A task begins with a requirement, a defect, or a decision already accepted.

A proposal in [memory/DECISIONS.md](memory/DECISIONS.md) is not a request to implement.

Jarvis distinguishes the requested action, the objective, the expected result and the constraint. Jarvis does not start implementation only because a sentence arrived in a chat.

---

## 4. Analysis

Jarvis reads, in order:

1. [memory/FACTS.md](memory/FACTS.md)
2. [memory/DECISIONS.md](memory/DECISIONS.md)
3. [memory/TASKS.md](memory/TASKS.md)
4. [AGENT-REGISTRY.md](AGENT-REGISTRY.md)
5. The code the task names

If those disagree, Jarvis stops and names the disagreement. Jarvis does not pick the convenient document.

---

## 5. Planning

A significant task defines the fields in [AGENT-OPERATING-MANUAL.md](AGENT-OPERATING-MANUAL.md), section 3.

The agent in that list is Al, Rebecca, John or James. Not a model.

---

## 6. Delegation

Jarvis assigns the task from the registry.

This workflow does not keep a second map.

For the current game, implementation of `apps/pivot23`, including the React interface, is John's. Al is consulted for product intent. Rebecca is consulted for narrative and player-facing experience. James validates.

An older copy of this section assigned Al to frontend and Rebecca to game design. That assignment is withdrawn.

Codex, Claude, Grok and OpenAI are not delegation targets. One of them may execute the specialist's task. The specialist remains the owner.

---

## 7. Execution

The specialist works inside the task.

The work is committed on a branch taken from `main`. It is not committed directly to `main`.

If the specialist meets a missing decision, a conflict with an accepted decision, or a change that would promote a proposal to accepted, it stops and escalates. It does not invent the decision.

---

## 8. Review

Jarvis reviews the result against the objective, the accepted decisions, the registry and the acceptance criteria.

Producing an output does not close the task.

---

## 9. Cross-agent review

When a task crosses domains:

- Al owns the product and game-design statement.
- Rebecca owns the narrative and the player-facing experience.
- John owns the implementation, including the interface in `apps/pivot23`.
- James owns the validation.

The extra specialist does not become the owner of the task.

An older copy of this section said Al implements the interface. That sentence is withdrawn.

---

## 10. Validation

Validation is the method written on the task.

For an open P0, the method is the one in [memory/TASKS.md](memory/TASKS.md). A reading of the code is not that method.

James is the validation specialist. Every specialist still reports defects in their own domain.

---

## 11. Acceptance

A task is accepted only when its acceptance criteria are satisfied.

A P0 becomes closed only when:

- the previous behaviour was reproduced, or an equivalent proof is in the pull request;
- the test fails on the code from before the change, or the regression is shown;
- the test passes after the change;
- CI passes;
- the behaviour is on the branch of the pull request.

This workflow does not close P0-LIFE, P0-REPEAT, P1-BUST, P1-WORLD or P1-ROLE.

---

## 12. Integration

Integration is a pull request into `main`.

A document-only pull request has no diff under `apps/pivot23`.

A game pull request waits for `.github/workflows/pivot23.yml`.

Jarvis does not merge the pull request when the owner has reserved the merge.

A feature is not integrated because its branch exists.

---

## 13. Git

1. Branch from `main`.
2. Change only the files the task names.
3. Review the diff.
4. Open a pull request.
5. Wait for the required check.
6. Merge only when the owner has not asked to hold the merge.

Commit messages name the purpose.

`src/` is not edited in order to «keep the copies in sync». It is an old copy. It is removed only in a later pull request, after references are checked.

---

## 14. Documentation

A fact that changes (URL, SHA, merge) is written to [memory/FACTS.md](memory/FACTS.md) and to [project-state.md](project-state.md) in the same change.

A decision is appended to [memory/DECISIONS.md](memory/DECISIONS.md). The old entry stays.

A role change is made in the registry, then the other documents are reduced to pointers. The role is not copied out again.

Critical knowledge does not live only in a conversation.

---

## 15. Failure handling

1. Keep the error.
2. Name the likely cause.
3. Name the specialist.
4. Correct on the branch.
5. Re-run the test that failed.
6. Do not hide the failure from the owner.

---

## 16. Human approval

The owner retains final authority.

Explicit approval is required for production deployment settings, publication, deletion of project data, credentials, and a change that cannot be reverted.

Changing Vercel's ignored build step is one of those settings. It is not part of a document pull request.

---

## 17. Priority

1. Security and critical failures.
2. Blocking defects.
3. Core behaviour.
4. Accepted decisions that the code does not yet do.
5. Tests.
6. Optional work.

A proposed item does not outrank an accepted decision.

---

## 18. Dependencies

Jarvis names a missing dependency before the dependent work starts.

The registry depends on nothing else for roles.

DNA, this workflow, the architecture and the operating manual depend on the registry.

Tasks depend on accepted decisions. They do not depend on proposals.

---

## 19. After a milestone

Jarvis records what was duplicated, what conflicted, and what was left open.

A change to a role is a registry change, not a sentence in a chat.

---

## 20. Final verification

Before a significant task is called complete:

- the objective is met;
- the acceptance criteria are met;
- the pull request is the integration, not a direct commit to `main`;
- tests required by the task have run;
- documents that would contradict the change have been updated;
- no P0 was closed without its proof.

---

## 21. Core principle

Understand first.

Plan second.

Delegate third, from the registry.

Build on a branch.

Test.

Integrate through a pull request.

Do not promote a proposal by implementing it.
