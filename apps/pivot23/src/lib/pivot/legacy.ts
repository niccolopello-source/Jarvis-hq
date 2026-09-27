
import type { PlayerState, SeasonRow } from "./types";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export type HofTier = "hall" | "borderline" | "out";

function avg(rows: SeasonRow[], key: keyof SeasonRow) {
  if (!rows.length) return 0;
  return rows.reduce((a, r) => a + (Number(r[key]) || 0), 0) / rows.length;
}

export function hofScore(s: PlayerState) {
  const rows = s.seasonHistory;
  const seasons = rows.length || 1;
  const peak = s.peakOverall;
  const longevity = Math.min(18, seasons);
  const prod = avg(rows, "ppg") * 1.1 + avg(rows, "rpg") * 0.35 + avg(rows, "apg") * 0.45;
  const playoffRuns = rows.filter((r) => r.playoff && r.playoff !== "Fuori" && !r.playoff.startsWith("Elim")).length;
  const deepRuns = rows.filter((r) => r.playoff === "Campione" || (r.playoff && r.playoff.includes("Finale"))).length;
  return round1(
    clamp(
      peak * 0.26 +
        longevity * 1.15 +
        s.mvpCount * 11 +
        s.titleCount * 8.4 +
        s.fmvpCount * 5.2 +
        s.allNbaCount * 2.6 +
        s.allStarCount * 0.55 +
        s.dpoyCount * 3.8 +
        (s.roy ? 1.8 : 0) +
        prod * 0.42 +
        playoffRuns * 0.55 +
        deepRuns * 1.4,
      0,
      100,
    ),
  );
}

export function hofTier(s: PlayerState): HofTier {
  const sc = hofScore(s);
  const peak = s.peakOverall;
  const seasons = s.seasonHistory.length;
  const inner =
    (s.mvpCount >= 2 && s.titleCount >= 1 && peak >= 88) ||
    (s.titleCount >= 3 && peak >= 88 && (s.mvpCount >= 1 || s.allNbaCount >= 4)) ||
    (sc >= 74 && peak >= 89 && seasons >= 12 && (s.mvpCount >= 1 || s.titleCount >= 2 || s.allNbaCount >= 5));
  if (inner) return "hall";
  const edge =
    (s.mvpCount >= 1 && peak >= 84) ||
    (s.titleCount >= 2 && peak >= 82) ||
    (s.allNbaCount >= 4 && peak >= 84) ||
    (sc >= 60 && peak >= 86 && s.allStarCount >= 8 && seasons >= 12);
  if (edge) return "borderline";
  return "out";
}

export function hofLabel(tier: HofTier) {
  if (tier === "hall") return "Nella Hall";
  if (tier === "borderline") return "Candidato, non eletto";
  return "Fuori dalla Hall";
}

export function bestSeason(s: PlayerState): SeasonRow | null {
  if (!s.seasonHistory.length) return null;
  return [...s.seasonHistory].sort(
    (a, b) => b.ppg * 2 + b.per * 0.8 + (b.awards.length ? 8 : 0) - (a.ppg * 2 + a.per * 0.8 + (a.awards.length ? 8 : 0)),
  )[0]!;
}

export function teamsWorn(s: PlayerState) {
  const seen: string[] = [];
  for (const r of s.seasonHistory) {
    if (!seen.includes(r.team)) seen.push(r.team);
  }
  return seen;
}

export function palmares(s: PlayerState) {
  const rows = s.seasonHistory;
  const n = rows.length || 1;
  const best = bestSeason(s);
  const tier = hofTier(s);
  return {
    seasons: n,
    startAge: s.startAge,
    endAge: s.age,
    teams: teamsWorn(s),
    games: rows.reduce((a, r) => a + r.gp, 0),
    points: s.careerPoints,
    rebounds: s.careerRebounds,
    assists: s.careerAssists,
    avgPpg: round1(avg(rows, "ppg")),
    avgRpg: round1(avg(rows, "rpg")),
    avgApg: round1(avg(rows, "apg")),
    peak: s.peakOverall,
    endOvr: s.overall,
    titles: s.titleCount,
    mvp: s.mvpCount,
    fmvp: s.fmvpCount,
    allStar: s.allStarCount,
    allNba: s.allNbaCount,
    dpoy: s.dpoyCount,
    roy: s.roy,
    best,
    hof: tier,
    hofLabel: hofLabel(tier),
    hofScore: hofScore(s),
    rival: s.rivalName,
    origin: s.originPath,
  };
}

/** Commento solo su fatti presenti nello storico. */
export function careerCommentary(s: PlayerState): string {
  const rows = s.seasonHistory;
  const p = palmares(s);
  const bits: string[] = [];

  if (p.seasons <= 6) {
    bits.push("Una carriera breve. Il mestiere non ha avuto il tempo di diventare abitudine.");
  } else if (p.seasons >= 15) {
    bits.push(`Quindici stagioni, o più: ${p.seasons} anni di referto. La longevità, qui, non è un incidente.`);
  } else if (p.seasons >= 12) {
    bits.push(`${p.seasons} stagioni. Abbastanza per una biografia, non abbastanza per annoiarsi.`);
  }

  const first = rows[0];
  if (first && first.ppg < 9 && p.peak >= 86) {
    bits.push("È partito da pochi minuti. Il picco è arrivato dopo, quando il ruolo ha smesso di essere un favore.");
  } else if (first && first.ppg >= 16 && p.peak < 78) {
    bits.push("La matricola prometteva. Il resto della vita non ha confermato il rumore di ottobre.");
  } else if (first && first.ppg >= 14 && p.peak >= 88) {
    bits.push("Ha cominciato già visibile. Il resto è stato tenere quella luce accesa.");
  }

  if (s.roy) bits.push("Il Rookie of the Year c'è stato. Poi bisognava diventare altro.");
  if (p.dpoy >= 2) bits.push(`${p.dpoy} volte difensore dell'anno. Si nota chi toglie, e lui ha tolto abbastanza da restare nei libri.`);
  else if (p.dpoy === 1) bits.push("Un DPOY. Il rispetto che non finisce in copertina, e per questo dura.");
  if (p.mvp >= 2) bits.push(`${p.mvp} MVP. Non è un premio che si eredita: si ripete, o si smentisce.`);
  else if (p.mvp === 1) bits.push("Un MVP. Una stagione in cui la lega ha detto il suo nome per primo.");

  if (p.titles >= 3) bits.push(`${p.titles} anelli. Una dinastia ha avuto il suo volto, e il volto eri tu.`);
  else if (p.titles === 2) bits.push("Due titoli. Abbastanza per non essere un incidente di calendario.");
  else if (p.titles === 1) bits.push("Un titolo. Basta per cambiare il modo in cui una città ricorda giugno.");
  else if (p.titles === 0 && p.peak >= 88) bits.push("Nessun anello, un picco da fenomeno. Il palmarès resta incompleto, non piccolo.");
  else if (p.titles === 0) bits.push("Nessun titolo. Non tutte le carriere chiudono con i confetti.");

  const inj = rows.filter((r) => r.gp <= (r.conf === "Euro" ? 20 : 55)).length;
  if (inj >= 3) bits.push("Gli infortuni hanno scritto più di una pagina. Il corpo ha chiesto il conto, più di una volta.");
  else if (inj === 1) bits.push("Un anno spezzato. Si vede ancora, nel modo in cui conta i minuti.");

  if (p.teams.length >= 4) bits.push(`Quattro maglie, o più. ${p.teams.length} città. Il mestiere è stato un viaggio, non una casa.`);
  else if (p.teams.length === 1) bits.push(`Una sola maglia: ${p.teams[0]}. Raro, e si vede.`);
  else if (p.teams.length === 2) bits.push(`Due maglie. Un passaggio, non un esilio.`);

  const last = rows[rows.length - 1];
  if (last && last.playoff === "Campione" && s.age >= 33) {
    bits.push("Ha chiuso con un anello da veterano. Il tipo di fine che si racconta senza alzare la voce.");
  } else if (last && last.ppg < 8 && p.peak >= 84) {
    bits.push("Gli ultimi minuti sono stati pochi. Il picco, però, resta negli occhi di chi c'era.");
  }

  if (p.hof === "hall") bits.push("La Hall of Fame lo tiene. I numeri, e il contesto, bastano.");
  else if (p.hof === "borderline") bits.push("La Hall lo discute, non lo chiude. Resta il dibattito, che è già una forma di rispetto.");
  else if (p.peak >= 82) bits.push("Fuori dalla Hall. Un picco alto non è un passaporto, e lo sa.");

  if (s.rivalName && s.rivalry >= 50) {
    bits.push(`${s.rivalName} è restato nel discorso. Non sul referto di ogni sera: nella testa, dove le rivalità durano.`);
  }

  const turning = s.choiceLog.find((c) => /trade|free agency|mercato/i.test(c.title));
  if (turning) bits.push(`Una svolta di mercato: ${turning.pick}. Da lì la vita ha preso un'altra strada.`);

  if (s.originPath === "Europa") bits.push("È arrivato dall'Europa. Si sente ancora, nel modo in cui legge il campo.");
  else if (s.originPath === "G-League") bits.push("Ha bruciato le tappe. Il grezzo, all'inizio, era il punto di forza e il rischio.");

  if (!bits.length) {
    bits.push("Una carriera senza proclami. I giorni, fatti fino in fondo, e basta.");
  }

  return bits.slice(0, 6).join(" ");
}
