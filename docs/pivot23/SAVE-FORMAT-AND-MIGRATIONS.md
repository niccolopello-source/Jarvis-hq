# PIVOT 23 — Save format and migrations

Status: describes `main` after PR #26/#27 (D-02, D-04, D-05, D-06, D-20) plus branch `grokbot/demo-hardening` (crash set-aside, archive backup). Verified by `src/lib/pivot/save.test.ts`, `src/lib/pivot/persistence.test.ts` (9 tests), `e2e/save-safety.spec.ts` and `e2e/init-failure.spec.ts`.

## Browser keys

| Key | Storage | Content |
|---|---|---|
| `pivot-v2-save` | localStorage, mirrored to sessionStorage | Live career (`LIVE_SAVE_VERSION = 2`). Envelope with checksum/fingerprint (`SAVE_VERSION = 11` is the PlayerState schema inside it). |
| `pivot-v2-save-backup` | localStorage (or session when local is off) | New. Verbatim copy of a live save that could not be opened (corrupt, newer version, incompatible) or that was migrated, plus reason and time. Never overwritten by a second failure of the same payload. |
| `pivot-v2-save-crashed` | same store as the save it copies | 2026-10-03 (`grokbot/demo-hardening`). Verbatim copy of a live save the player set aside from the error screen ("metti da parte la carriera"), with `reason: "crashed"` and time. Separate from the backup key so it never overwrites an older backup. Written and verified **before** the live save is removed (`setAsideLive`). |
| `pivot-v2-archive` | localStorage, fallback sessionStorage | Finished careers, at most `ARCHIVE_LIMIT = 8`. |
| `pivot-v2-archive-backup` | each store that held the archive | 2026-10-03. `{ v: 1, at, raws: string[] }`, newest 3 distinct raw archive strings that this build could not fully read (unparseable JSON, or entries `normalizeArchiveEntry` drops, e.g. a newer `version`). Taken by `saveArchive()` before it writes over them. Before this, those careers were overwritten with no copy. |
| `pivot-v2-hint`, `pivot-v2-swipe` | both | UI hints; dropped first when quota is full. |
| `pivot-lang` | localStorage | `it` or `en` (anything else falls back to `it`). |

## Write rules

- A write counts only if reading the key back returns the same string (`writeStore`). The in-memory cache no longer short-circuits this.
- `saveLive()` returns `true` only when **localStorage** holds the payload. A session-only copy keeps the tab alive but the UI warns (`saveMiss`, `storageOff`).
- Quota full never deletes the last good `pivot-v2-save`; hints go first.
- `clearLive()` returns whether every copy is gone. The UI deletes a live career only after the career is archived in persistent storage, or after the player confirms in the "Nuova vita" dialog (`new-life.ts: mayDeleteLive`).

## Load rules (`loadLive` + `lastLoadReport`)

| State | Meaning | What happens |
|---|---|---|
| `none` | no save | normal home |
| `ok` | current version, valid | resume |
| `migrated` | older version, migrated by `LIVE_MIGRATIONS` | original copied to backup first, then resume |
| `corrupt` | unreadable JSON / bad checksum / incomplete state | not opened, **not deleted**, backup written, home shows a notice |
| `future` | version newer than this build | not opened, not deleted (a rollback must not destroy newer data) |
| `incompatible` | older version with no migration | not opened, not deleted |

`restoreLiveBackup()` puts the original back exactly as it was (manual recovery path; not exposed in UI yet).

## Migrations

History check: every commit on `main` from `b04fff9` to `778a561` wrote live-save version 2. There is therefore no older live format to migrate today, and `LIVE_MIGRATIONS` is an empty table with the contract: `migrations[n]` turns a version-`n` raw save into version `n+1`; the loader copies the original to the backup key before applying them. Adding version 3 means: bump `LIVE_SAVE_VERSION`, add `LIVE_MIGRATIONS[2]`, add a fixture test in `save.test.ts`.

## Two tabs

`watchLiveConflicts()` listens to `storage` events. If another tab writes a different career, the current tab shows the `otherTab` notice («the latest save wins: if you continue here, this tab overwrites the other one»). It does not block the write: last writer wins, but no longer silently. On load, when localStorage and this tab's sessionStorage hold different careers, the session copy wins (the tab you were playing in).

## Archive eviction (D-20)

The archive keeps the 8 most recent careers. When a 9th is written the oldest is evicted and `lastArchiveEvicted()` lets the result screen say so (`archiveEvicted`), and `archiveFullSoon` warns, while the career is still running, when the archive is already full and names the career that will leave. Alternatives not implemented (decision needed): export to file, pin favourite careers, larger limit with compaction (each career with league snapshots is ~40–120 KB).

## Known limits

- Everything is per browser/device. Clearing site data deletes careers. Safari private mode and some in-app browsers give no persistent storage: the game says so (`storageOff`) but cannot fix it.
- The checksum detects accidental damage, not deliberate edits (see P-006).

## What the checksum does and does not protect (verified 2026-10-03)

`c = sha256(JSON.stringify(body)).slice(0, 16)` (64 bits of a pure-JS SHA-256 in `card.ts`), computed over the whole live-save body (`v`, `screen`, `tab`, `player`, `pending`, `log`, `logSeq`) and checked in `isLiveSave()` after the shape checks.

Protects against, and is tested for:
- truncated writes and partial JSON (120 cut points of a long save in `persistence.test.ts`; all `corrupt`, kept, never thrown);
- bit rot / accidental edits of any field covered by the body (a changed value without a recomputed `c` is `corrupt`);
- a save glued together from two versions of the body.

Does **not** protect against:
- deliberate edits: the algorithm is public and keyless, anyone can recompute `c` (not anti-cheat, not a signature; P-006);
- a save that is internally consistent but that the current screens cannot draw. Shown on 2026-10-03: a correctly re-signed save with `awards` as a string crashes the career view. Before this cycle the only button was "Ricarica", which reopened the same save: a loop. The error screen now offers "metti da parte la carriera" (see `pivot-v2-save-crashed`), tested in `e2e/init-failure.spec.ts`;
- the archive (`pivot-v2-archive`): no checksum; entries are shape-checked by `normalizeArchiveEntry`, and the optional Career Card has its own fingerprint (also not a signature);
- backup, hint, swipe and language keys;
- JSON key order changes: the hash is over `JSON.stringify` of the parsed object, so it is stable for saves written by this code, but a re-serialised save with reordered keys reads as `corrupt` (kept and backed up, not lost).
