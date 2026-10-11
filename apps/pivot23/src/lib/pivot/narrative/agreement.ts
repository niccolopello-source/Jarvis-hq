/**
 * English agreement for team names. Italian treats "Boston Celtics" as a singular club
 * ("Boston Celtics ti vuole"); English names an NBA team in the plural ("Boston Celtics want you").
 * The engine stores Italian, so the fix is applied when the English text is rendered.
 * Only clause-initial subjects change: "Staying with Boston Celtics is one door" stays as is.
 */
import { NBA_TEAMS } from "../teams";

const IRREGULAR: Record<string, string> = {
  is: "are",
  was: "were",
  has: "have",
  does: "do",
  goes: "go",
  "isn't": "aren't",
  "wasn't": "weren't",
  "hasn't": "haven't",
  "doesn't": "don't",
};

/** Third-person verbs seen after a team name in rendered careers (measured, see copy review). */
const REGULAR = new Set(
  "wants hands puts asks offers moves keeps knows signs closes takes gives walks ends deserves calls stares bets accepts picks stops says sends needs believes decides likes looks chooses pays trusts plays wins loses trades waits holds opens leaves lets makes sees tells thinks pushes reaches watches misses".split(" "),
);

function plural(verb: string): string | null {
  const lower = verb.toLowerCase().replace("’", "'");
  if (IRREGULAR[lower]) return verb.includes("’") ? IRREGULAR[lower]!.replace("'", "’") : IRREGULAR[lower]!;
  if (!REGULAR.has(lower)) return null;
  if (/(sh|ch|ss|x)es$/.test(lower)) return verb.slice(0, -2);
  return verb.slice(0, -1);
}

const NAMES = NBA_TEAMS.map((t) => t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .sort((a, b) => b.length - a.length)
  .join("|");
const SUBJECT = new RegExp(
  `(^|[.!?:;—]\\s+|,\\s+|\\b(?:and|but|because|when|while|if|that|as|until|so)\\s+)((?:[Tt]he\\s+)?(?:${NAMES}))\\s+([a-z]+(?:['’]t)?)\\b`,
  "g",
);

export function agreeTeamsEn(text: string): string {
  if (!text) return text;
  return text.replace(SUBJECT, (m, lead: string, team: string, verb: string) => {
    const p = plural(verb);
    return p ? `${lead}${team} ${p}` : m;
  });
}
