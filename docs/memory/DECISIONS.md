# Decisions

Append only. Do not rewrite an old entry. Add a new one that supersedes it.

Status:

- `accepted` — the human owner asked for this.
- `proposed` — an agent recommended it. Not a license to implement it as if the owner had agreed.

Priority when two accepted decisions collide: ask the owner. Do not pick silently.

The house priority used while building the beta, and not withdrawn: coherence, then realism, then stability, then performance, then complexity.

## Accepted

| ID | Date | Decision |
|---|---|---|
| D-001 | 2026-09 | The playable career runs from the NBA draft through the last year. The owner asked to be able to play until age 36. Do not remove that path. |
| D-002 | 2026-09 | The «23» mark is the project mark. It is visible at the start and must not sit on screen through the career. The start gate is shown once. |
| D-003 | 2026-09 | A save or a load must not cover the career with a white or black page. A small indicator is enough. |
| D-004 | 2026-09 | The first screen offers Italian, English and Spanish. |
| D-005 | 2026-09 | DPOY can be won in any season, not only the first. The screen «corsa al DPOY» is not shown. |
| D-006 | 2026-09 | Personal awards are shown in the league and life surfaces, with the numbers that produced them. |
| D-007 | 2026-09 | Each role has a visible identity: one line on what that role does. |
| D-008 | 2026-09 | The body declines before the shot and the basketball IQ. Do not age every trait on the same slope. |
| D-009 | 2026-09 | Work and rest give the body back. Playing hurt gives less of it back. |
| D-010 | 2026-09 | The background is filled. Empty bands behind the career are a defect. |
| D-011 | 2026-09 | The game does not contain a control that dumps its own source for the player to copy. |
| D-012 | 2026-09 | A Finals win has a stronger animation than a regular beat. |
| D-013 | 2026-09 | There is one GitHub repository for this project: `niccolopello-source/Jarvis-hq`. Do not create a second one. |
| D-014 | 2026-10-01 | Supersedes D-004 for the demo. The selector offers Italian and English only. Spanish and French stay planned until their coverage is verified. The Spanish dictionary is not deleted. |
| D-015 | 2026-10-01 | NBA franchise names stay in the demo. A legal review is required before any commercial distribution. Do not rename teams in this phase. This does not accept P-005's rename. |
| D-016 | 2026-10-01 | The demo source is `apps/pivot23` on `main` at `89249efccdb1b86e7b84de801c46f9c6b544b4d0`. The App Builder workspace is a separate tree and must not be copied over this repository. |

## Proposed, not accepted

| ID | Date | Proposal | Why it is not accepted yet |
|---|---|---|---|
| P-001 | 2026-09-28 | Some careers must be able to end before 36, by minutes or by a serious injury. The path to 36 stays. | The owner asked to reach 36. The audit showed that every career is forced to 36. Those are different statements. Implement only the task in TASKS.md, which keeps the age-36 path. |
| P-002 | 2026-09-28 | An award already won weighs less the next year, so one career cannot collect 8–12 MVP or titles as a normal outcome of the easy difficulties. | Measured on the sandbox tree, not yet on `421a4a0`. The direction is a defect. The exact cap is not an owner decision. |
| P-003 | 2026-09-28 | A high potential must be able to miss. | Audit proposal. Do not invent a target rate. |
| P-004 | 2026-09-28 | Franchise title share cannot stay at 15% for Boston across every world if team power never changes. Do not lower Boston by hand. | Audit proposal. |
| P-005 | 2026-09-28 | Real NBA franchise names in a public build are a trademark risk. Replace them before a launch that presents the game as a product, unless the owner gets legal advice to keep them. | The owner has not accepted a rename. The names are in production today. |
| P-006 | 2026-09-28 | No rarity, NFT or sold career card until a server replays the seed and the choice list and signs the result. The phone can rewrite a local save. | Not an owner request. Do not build it. |
| P-007 | 2026-09-28 | Do not sell overall, difficulty or extra choices. A frame around an already verified career can be paid later. The career stays free. | Not an owner request. |

## Superseded documents

None. The 27 September readiness reports are evidence of that day, not decisions. FACTS.md corrects their status claims.
