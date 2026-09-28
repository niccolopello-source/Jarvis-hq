# Shared project memory

This folder is the memory JARVIS HQ reads before changing PIVOT 23.

A chat is not memory. A statement becomes memory only when it is written here and marked with a status.

Roles are not in this folder. They are only in [../AGENT-REGISTRY.md](../AGENT-REGISTRY.md).

## Read order

1. [FACTS.md](FACTS.md) — what is true now.
2. [DECISIONS.md](DECISIONS.md) — what the owner accepted, and what an audit only proposed.
3. [TASKS.md](TASKS.md) — open work, with the test that must fail on today's code.
4. [../pivot23/INVARIANTS.md](../pivot23/INVARIANTS.md) — rules the simulation must keep.
5. [../pivot23/AUDIT-GROK-001.md](../pivot23/AUDIT-GROK-001.md) — measured distributions, and which tree they were measured on.
6. [../pivot23/VOICE.md](../pivot23/VOICE.md) — how the Italian copy speaks.

## What each kind of record is

| Kind | File | Rule |
|---|---|---|
| Fact | FACTS.md | Describes the repository and the live site. Replace it when the fact changes. Do not leave the old sentence beside the new one. |
| Decision | DECISIONS.md | Append only. `accepted` means the human owner asked for it. `proposed` means an agent recommended it and the owner has not accepted it. |
| Task | TASKS.md | Open work. Do not retune numbers until the named test fails on the current code. Do not close a P0 without the proof named in the task. |
| Temporary | a chat, a sandbox, an untracked file | Not memory. The sandbox branch `demo/readiness` at `160b109` is a different git history from GitHub `main`. |

## Models

OpenAI, Claude, Grok and Codex are execution resources.

They are not roles. They are not a second roster.

Codex may carry out an implementation task. The responsible agent remains the specialist named in the task, from the registry. For implementation of `apps/pivot23`, including the React interface, that specialist is John.

Using Codex does not add an agent.

## Where not to read roles

Do not edit `src/` at the repository root. Those files are old copies. They are not deleted on the normalization branch, and they are not a role source.

`docs/project-state.md` and the two reports in `apps/pivot23/` are corrected by FACTS.md when they disagree about a URL, a SHA or a merge. FACTS.md wins on current status.
