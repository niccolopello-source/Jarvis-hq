# Shared project memory

This folder is the memory JARVIS HQ, Claude, Codex and Grok read before changing PIVOT 23.

A chat is not memory. A statement becomes memory only when it is written here and marked with a status.

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
| Task | TASKS.md | Open work. Do not retune numbers until the named test fails on the current code. |
| Temporary | a chat, a sandbox, an untracked file | Not memory. The sandbox branch `demo/readiness` at `160b109` is a different git history from GitHub `main`. |

## Who does what

The stable roster is in [../AGENT-REGISTRY.md](../AGENT-REGISTRY.md) and [../PROJECT-DNA.md](../PROJECT-DNA.md): Jarvis coordinates; Al, Rebecca, John and James execute.

Models are resources, not a second roster. When a model is used:

- Codex implements.
- Claude reviews product, architecture and acceptance.
- Grok audits, simulates and contests. Grok does not promote a proposal to an accepted decision.

Do not edit `src/` at the repository root. Those files are copies of the foundation documents. Edit `docs/` and `apps/pivot23/`.

`docs/project-state.md` and the two reports in `apps/pivot23/` are corrected by FACTS.md when they disagree. FACTS.md wins on current status.
