import assert from "node:assert/strict";
import test from "node:test";
import { EURO_ROUNDS } from "./data.ts";
import { freshPlayer, resolvePlayoffRound } from "./engine.ts";
import { playoffLineScore } from "./league.ts";
import { cloneTeam, EURO_TEAMS, NBA_TEAMS } from "./teams.ts";

test("a playoff line names the opponent and keeps the player's score first", () => {
  assert.equal(
    playoffLineScore({ oneGame: false, playerPoints: 4, opponentPoints: 0, opponent: "Oklahoma City Thunder" }),
    "4-0 (noi–Oklahoma City Thunder, serie)",
  );
  assert.equal(
    playoffLineScore({ oneGame: false, playerPoints: 0, opponentPoints: 4, opponent: "Oklahoma City Thunder" }),
    "0-4 (noi–Oklahoma City Thunder, serie)",
  );
  assert.equal(
    playoffLineScore({ oneGame: true, playerPoints: 80, opponentPoints: 75, opponent: "Real Madrid" }),
    "80-75 (noi–Real Madrid, partita)",
  );
  assert.equal(
    playoffLineScore({ oneGame: true, playerPoints: 74, opponentPoints: 75, opponent: "Real Madrid" }),
    "74-75 (noi–Real Madrid, partita)",
  );
  assert.equal(
    playoffLineScore({ oneGame: true, playerPoints: 70, opponentPoints: 70, opponent: "Real Madrid" }),
    "70-70 (noi–Real Madrid, partita)",
  );
});

test("a resolved series sentence matches the strip and does not flip the score", () => {
  const mine = cloneTeam(NBA_TEAMS.find((team) => team.abbr === "BOS")!);
  const opponent = cloneTeam(NBA_TEAMS.find((team) => team.abbr === "OKC")!);
  const player = freshPlayer("Score", "PG", "Italia", 23, "pro", 42);
  player.team = mine;
  player.league = "NBA";
  player.playoff = { conf: "East", seed: 1, round: 3, pairs: [] };
  const result = resolvePlayoffRound(player, 4, 3, 0, opponent);
  const label = `${result.series.wins}-${result.series.losses} (noi–${opponent.name}, serie)`;
  assert.match(result.flavor, new RegExp(label.replace(/[()]/g, "\\$&")));
  if (result.series.wins !== result.series.losses) {
    assert.equal(result.flavor.includes(`${result.series.losses}-${result.series.wins} (noi–`), false);
  }
});

test("a one-game final sentence matches the game strip", () => {
  const mine = cloneTeam(EURO_TEAMS.find((team) => team.abbr === "MIL") ?? EURO_TEAMS[0]!);
  const opponent = cloneTeam(EURO_TEAMS.find((team) => team.name === "Real Madrid") ?? EURO_TEAMS[1]!);
  const player = freshPlayer("Score", "PG", "Italia", 23, "pro", 43);
  player.team = mine;
  player.league = "EuroLega";
  const round = EURO_ROUNDS.length - 1;
  player.playoff = { conf: "Euro", seed: 1, round, pairs: [] };
  const result = resolvePlayoffRound(player, 4, round, 0, opponent);
  const game = result.series.games[0];
  assert.ok(game);
  assert.match(result.flavor, new RegExp(`${game.us}-${game.them} \\(noi–${opponent.name}, partita\\)`));
  assert.equal(result.series.games.length, 1);
});
