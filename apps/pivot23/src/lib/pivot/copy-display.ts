/**
 * Presentation-only club and contract lines for the career HUD.
 * Does not change saved contract or team ids.
 */
import { t, tf, type Lang } from "./i18n";
import { isUnsigned } from "./teams";
import type { Contract, Team } from "./types";

export type ClubPlayer = { team: Team; league?: string };
export type ContractPlayer = { team: Team; contract: Contract };

/** Club line under the name. Unsigned players are waiting for the draft, with no league tag. */
export function clubLine(player: ClubPlayer, lang: Lang): string {
  if (isUnsigned(player.team)) return t("awaitingDraft", lang);
  const league = player.league === "EuroLega" ? t("leagueEuro", lang) : "NBA";
  return `${player.team.name} · ${league}`;
}

/**
 * Contract line. Hidden until a real deal exists (the dummy 3×$4.2M on an unsigned
 * player is not shown). An expired deal reads as free agency, not "0 years × $…".
 * Returns an empty string when the row should be omitted.
 */
export function contractLine(player: ContractPlayer, lang: Lang): string {
  if (isUnsigned(player.team) || !player.contract.teamName) return "";
  if (player.contract.yearsRemaining <= 0) return t("freeAgent", lang);
  const years =
    player.contract.yearsRemaining === 1
      ? t("contractYear", lang)
      : tf("contractYears", { n: player.contract.yearsRemaining }, lang);
  return `${years} × $${player.contract.annualM}M`;
}
