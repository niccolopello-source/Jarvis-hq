
import { memo, useState } from "react";
import { TeamCrest, TeamLabel, TeamMark } from "@/components/pivot/TeamMark";
import { awardNoteLabel, confLabel } from "@/lib/pivot/labels";
import { cpuPer, mvpRaceScore, personalAwardBrief, quintetRaceScore } from "@/lib/pivot/awards-helpers";
import { awardLabel, t, tf, useLang, type Lang as UiLang, type Msg } from "@/lib/pivot/i18n";
import type { DpoyCandidate, LeagueSnapshot, PlayerState, RoyCandidate, SeasonRow, StandingRow, TeamAmbition, TeamIdentity } from "@/lib/pivot/types";

const SYSTEM_KEY = {
  defense: "sysDefense",
  pace: "sysPace",
  threePoint: "sysThreePoint",
  ballMovement: "sysBallMovement",
  isolation: "sysIsolation",
  physical: "sysPhysical",
  halfCourt: "sysHalfCourt",
  development: "sysDevelopment",
  veteran: "sysVeteran",
} as const satisfies Record<TeamIdentity, Msg>;

const IDENTITY_KEY = {
  pace: "idPace",
  halfCourt: "idHalfCourt",
  threePoint: "idThreePoint",
  isolation: "idIsolation",
  ballMovement: "idBallMovement",
  defense: "idDefense",
  physical: "idPhysical",
  development: "idDevelopment",
  veteran: "idVeteran",
} as const satisfies Record<TeamIdentity, Msg>;

const AMBITION_KEY = {
  rebuild: "ambRebuild",
  development: "ambDevelopment",
  competitive: "ambCompetitive",
  contender: "ambContender",
  championship: "ambChampionship",
} as const satisfies Record<TeamAmbition, Msg>;

function systemLine(row: StandingRow, lang: UiLang): string {
  if (!row.identity) return "";
  const key = SYSTEM_KEY[row.identity];
  if (!key) return "";
  const v = row.identity === "defense" ? row.oppPpg.toFixed(1) : row.pace.toFixed(1);
  return tf(key, { v }, lang);
}

export function TeamDossier({
  row,
  mine,
  compact,
}: {
  row: StandingRow;
  mine?: string;
  compact?: boolean;
}) {
  const lang = useLang();
  const pct = row.w + row.l ? row.w / (row.w + row.l) : 0;
  return (
    <div className={`team-dossier ${row.abbr === mine ? "mine" : ""} ${compact ? "compact" : ""}`}>
      <div className="flex items-center gap-3">
        <TeamMark team={row} size={compact ? 44 : 56} />
        <div className="min-w-0">
          <div className="font-display text-[18px] leading-tight">
            <TeamLabel team={row} name={row.name} size={compact ? 20 : 24} />
          </div>
          <div className="text-[12px] text-muted">
            {row.city} · {row.div} · {confLabel(row.conf, lang)}
          </div>
          <div className="text-[13px] text-wood tabular mt-0.5">
            {row.w}-{row.l}
            {row.seed ? ` · ${row.seed}°` : ` · ${t("outOfPlayoffs", lang)}`} · {pct.toFixed(3).replace("0.", ".")}
          </div>
        </div>
      </div>
      {!compact && (
        <>
          <p className="text-[12.5px] text-muted italic mt-2 leading-snug">{row.note}</p>
          <div className="grid grid-cols-4 gap-1.5 text-center mt-3">
            {[
              [row.ppg.toFixed(1), t("statPF", lang)],
              [row.oppPpg.toFixed(1), t("statPS", lang)],
              [`${row.netRtg > 0 ? "+" : ""}${row.netRtg.toFixed(1)}`, "NET"],
              [row.pace.toFixed(1), "PACE"],
            ].map(([v, l]) => (
              <div key={l} className="bg-panel-2 rounded py-1.5">
                <div className="font-display text-[15px] tabular">{v}</div>
                <div className="text-[10px] text-muted">{l}</div>
              </div>
            ))}
          </div>
          <div className="star-line">
            <b>{row.star}</b>
            <span className="tabular">
              {row.starPpg.toFixed(1)} / {row.starRpg.toFixed(1)} / {row.starApg.toFixed(1)}
            </span>
          </div>
          {(row.identity || row.ambition) && (
            <p className="text-[12px] text-muted mt-1.5">
              {row.identity ? tf("systemOf", { v: t(IDENTITY_KEY[row.identity], lang) }, lang) : ""}
              {row.identity && row.ambition ? " · " : ""}
              {row.ambition ? t(AMBITION_KEY[row.ambition], lang) : ""}
            </p>
          )}
          {row.identity ? <p className="text-[12.5px] text-chalk mt-1">{systemLine(row, lang)}</p> : null}
        </>
      )}
    </div>
  );
}

function TeamBanner({ row }: { row: StandingRow }) {
  const lang = useLang();
  return (
    <div className="team-banner">
      <div className="team-banner-stats">
        {[
          [`${row.w}-${row.l}`, t("statWL", lang)],
          [row.ppg.toFixed(1), t("statPF", lang)],
          [row.oppPpg.toFixed(1), t("statPS", lang)],
          [`${row.netRtg > 0 ? "+" : ""}${row.netRtg.toFixed(1)}`, "NET"],
          [row.pace.toFixed(1), t("statPace", lang)],
        ].map(([v, l]) => (
          <div key={l}>
            <b className="tabular">{v}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <div className="star-line">
        <b>{row.star}</b>
        <span className="tabular">
          {row.starPpg.toFixed(1)} / {row.starRpg.toFixed(1)} / {row.starApg.toFixed(1)}
        </span>
      </div>
      {row.identity ? <p>{systemLine(row, lang)}</p> : row.note ? <p>{row.note}</p> : null}
    </div>
  );
}

function Table({
  title,
  rows,
  mine,
  onPick,
  selected,
}: {
  title: string;
  rows: StandingRow[];
  mine: string;
  onPick: (abbr: string) => void;
  selected?: string | null;
}) {
  const lang = useLang();
  return (
    <div className="standings-block">
      <h4 className="stats-heading">{title}</h4>
      <div className="standings-head">
        <span>#</span>
        <span>{t("team", lang)}</span>
        <span>{t("statWL", lang)}</span>
        <span>PPG</span>
      </div>
      {rows.map((r) => {
        const playoff = r.seed != null && r.seed <= 8;
        return (
          <div key={r.abbr} className="standings-slot">
            <button
              type="button"
              className={`standings-row ${r.abbr === mine ? "mine" : ""} ${playoff ? "in" : "out"} ${selected === r.abbr ? "open" : ""}`}
              style={{ ["--club" as string]: r.color }}
              aria-expanded={selected === r.abbr}
              onClick={() => onPick(r.abbr)}
            >
              <span className="seed">{r.seed ?? "—"}</span>
              <span className="club">
                <TeamCrest team={r} size={26} />
                <span>
                  <b>{r.abbr}</b>
                  <em>{r.city}</em>
                </span>
              </span>
              <span className="wl tabular">
                {r.w}-{r.l}
              </span>
              <span className="pct tabular">{r.starPpg.toFixed(1)}</span>
            </button>
            {selected === r.abbr ? <TeamBanner row={r} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export const LeaguePanel = memo(function LeaguePanel({ player }: { player: PlayerState }) {
  const lang = useLang();
  const snap: LeagueSnapshot | undefined =
    player.currentLeague ?? player.seasonHistory[player.seasonHistory.length - 1]?.league;
  const [picked, setPicked] = useState<string | null>(player.team.abbr);
  if (!snap) {
    const seedTitles = (player.championLog ?? []).filter((c) => c.league === "NBA");
    if (!seedTitles.length) {
      return <p className="empty-hint">{t("standingsLater", lang)}</p>;
    }
    return (
      <div className="pt-3 fade-in">
        <p className="empty-hint">{t("standingsLaterAlbo", lang)}</p>
        <h4 className="stats-heading">{t("alboNba", lang)}</h4>
        <ol className="albo-list">
          {seedTitles.map((c) => (
            <li key={c.yearLabel + c.teamAbbr}>
              <span className="albo-year">{c.yearLabel}</span>
              <TeamCrest
                team={{ abbr: c.teamAbbr, color: c.teamColor, secondary: c.teamColor }}
                size={20}
              />
              <span className="albo-team">
                <b>{c.team}</b>
                <em>{c.star}</em>
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }
  const nbaTitles = (player.championLog ?? []).filter((c) => c.league === "NBA");
  const latestTitle = nbaTitles[nbaTitles.length - 1];
  const euroTitles = (player.championLog ?? []).filter((c) => c.league === "EuroLega");
  const mine = player.team.abbr;
  const nba = player.league !== "EuroLega";
  const all = nba ? [...snap.east, ...snap.west] : snap.euro;
  const toggle = (abbr: string) => setPicked((cur) => (cur === abbr ? null : abbr));
  return (
    <div className="pt-3 fade-in">
      <p className="chart-cap">{tf("leagueCap", { y: snap.yearLabel }, lang)}</p>
      {latestTitle && (
        <div className={`albo-featured ${latestTitle.isPlayer ? "yours" : ""}`}>
          <div className="albo-kicker">{t("reigningChamp", lang)}</div>
          <div className="albo-featured-row">
            <TeamCrest
              team={{ abbr: latestTitle.teamAbbr, color: latestTitle.teamColor, secondary: latestTitle.teamColor }}
              size={28}
            />
            <div>
              <div className="albo-year">{latestTitle.yearLabel}</div>
              <b>{latestTitle.team}</b>
              <em>{latestTitle.isPlayer ? t("yourRing", lang) : latestTitle.star}</em>
            </div>
          </div>
        </div>
      )}
      {player.season === 1 && nba && (snap.royRace?.length ?? 0) > 0 ? (
        <RoyBoard race={snap.royRace} />
      ) : null}
      {nba && (snap.dpoyRace?.length ?? 0) > 0 ? <DpoyBoard race={snap.dpoyRace} /> : null}
      <AwardRaces player={player} />
      <PersonalAwards
        title={t("yours", lang)}
        rows={player.seasonHistory.slice(-1)}
      />
      {nba ? (
        <>
          <Table title={t("confEast", lang)} rows={snap.east} mine={mine} onPick={toggle} selected={picked} />
          <Table title={t("confWest", lang)} rows={snap.west} mine={mine} onPick={toggle} selected={picked} />
        </>
      ) : (
        <Table title={t("leagueEuro", lang)} rows={snap.euro} mine={mine} onPick={toggle} selected={picked} />
      )}
      {snap.awards.filter((a) => a.title !== "ROY" || player.season === 1).length > 0 && (
        <>
          <h4 className="stats-heading">{t("leagueAwards", lang)}</h4>
          <ul className="award-board">
            {snap.awards
              .filter((a) => a.title !== "ROY" || player.season === 1)
              .map((a) => {
              const club = all.find((r) => r.abbr === a.teamAbbr);
              return (
                <li key={a.title} className={a.isPlayer ? "yours" : ""}>
                  <span className="award-title">{awardLabel(a.title, lang)}</span>
                  <span className="award-who">
                    {club ? <TeamCrest team={club} size={18} /> : null}
                    {a.name} · {a.teamAbbr}
                  </span>
                  <em>{awardNoteLabel(a.note, lang)}</em>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {snap.leaders.length > 0 && (
        <>
          <h4 className="stats-heading">{t("leaders", lang)}</h4>
          <div className="leader-row">
            {snap.leaders.map((l) => (
              <div key={l.stat} className={`leader-cell ${l.isPlayer ? "yours" : ""}`}>
                <div className="tl">{l.stat}</div>
                <div className="tv">{l.value}</div>
                <div className="tn">
                  {l.name} · {l.team}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {nbaTitles.length > 0 && (
        <>
          <h4 className="stats-heading">{t("alboNba", lang)}</h4>
          <p className="chart-cap">{t("alboCap", lang)}</p>
          <ol className="albo-list">
            {nbaTitles.map((c) => (
              <li key={c.yearLabel + c.teamAbbr} className={c.isPlayer ? "yours" : ""}>
                <span className="albo-year">{c.yearLabel}</span>
                <TeamCrest
                  team={{ abbr: c.teamAbbr, color: c.teamColor, secondary: c.teamColor }}
                  size={20}
                />
                <span className="albo-team">
                  <b>{c.team}</b>
                  <em>{c.isPlayer ? t("yourRing", lang) : c.star}</em>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
      {euroTitles.length > 0 && (
        <>
          <h4 className="stats-heading">{t("alboEuro", lang)}</h4>
          <ol className="albo-list">
            {euroTitles.map((c) => (
              <li key={c.yearLabel + c.teamAbbr} className={c.isPlayer ? "yours" : ""}>
                <span className="albo-year">{c.yearLabel}</span>
                <TeamCrest
                  team={{ abbr: c.teamAbbr, color: c.teamColor, secondary: c.teamColor }}
                  size={20}
                />
                <span className="albo-team">
                  <b>{c.team}</b>
                  <em>{c.isPlayer ? t("yourTitle", lang) : c.star}</em>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
});

export function PersonalAwards({
  rows,
  title,
}: {
  rows: SeasonRow[];
  title?: string;
}) {
  const lang = useLang();
  const heading = title ?? t("lifeAwards", lang);
  const won = rows.flatMap((r) =>
    r.awards.map((a) => ({
      key: `${r.season}-${a}`,
      year: r.yearLabel,
      title: awardLabel(a, lang),
      brief: personalAwardBrief(r, a),
    })),
  );
  if (!won.length) return null;
  return (
    <div className="personal-awards">
      <h4 className="stats-heading">{heading}</h4>
      <ul className="award-board">
        {won.map((a) => (
          <li key={a.key} className="yours">
            <span className="award-title">{a.title}</span>
            <span className="award-who">{a.year}</span>
            <em>{a.brief}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function pinFirst<T extends { name: string }>(list: T[], name: string): T[] {
  const i = list.findIndex((row) => row.name === name);
  if (i <= 0) return list;
  const next = list.slice();
  const [row] = next.splice(i, 1);
  next.unshift(row!);
  return next;
}

export function AwardRaces({ player }: { player: PlayerState }) {
  const lang = useLang();
  const row = player.seasonHistory[player.seasonHistory.length - 1];
  const snap = row?.league;
  if (!row || !snap || player.league !== "NBA") return null;
  const table = [...snap.east, ...snap.west].filter((r) => r.abbr !== player.team.abbr);
  const mvpWinner = snap.awards.find((a) => a.title === "MVP");
  const mvp = snap.mvpBoard?.length
    ? snap.mvpBoard.map((c) => ({
        key: `${c.abbr}-${c.name}`,
        name: c.name,
        abbr: c.abbr,
        color: c.color,
        yours: c.isPlayer,
        score: c.score,
        line: c.line,
      }))
    : pinFirst(
    [
      ...table.map((r) => {
        const per = cpuPer(r.starPpg, r.starRpg, r.starApg, r.power);
        return {
          key: r.abbr,
          name: r.star || r.name,
          abbr: r.abbr,
          color: r.color,
          yours: false,
          score: mvpRaceScore(r.starPpg, r.w, per, false),
          line: `${r.starPpg.toFixed(1)} · ${r.w} · ${per.toFixed(1)}`,
        };
      }),
      {
        key: "you",
        name: player.name,
        abbr: player.team.abbr,
        color: player.team.color,
        yours: true,
        score: mvpRaceScore(row.ppg, row.wins, row.per, true),
        line: `${row.ppg.toFixed(1)} · ${row.wins} · ${row.per.toFixed(1)}`,
      },
    ].sort((a, b) => b.score - a.score),
    mvpWinner?.name || "",
  ).slice(0, 6);
  const quintet = snap.nbaBoard?.length
    ? snap.nbaBoard.map((c) => ({
        key: `q-${c.abbr}-${c.name}`,
        name: c.name,
        abbr: c.abbr,
        color: c.color,
        yours: c.isPlayer,
        score: c.score,
        line: c.line,
      }))
    : [
    ...table.map((r) => {
      const per = cpuPer(r.starPpg, r.starRpg, r.starApg, r.power);
      const pm = r.netRtg * 0.4;
      return {
        key: `q-${r.abbr}`,
        name: r.star || r.name,
        abbr: r.abbr,
        color: r.color,
        yours: false,
        score: quintetRaceScore(r.starPpg, per, pm),
        line: `${r.starPpg.toFixed(1)} · ${per.toFixed(1)} · ${pm > 0 ? "+" : ""}${pm.toFixed(1)}`,
      };
    }),
    {
      key: "q-you",
      name: player.name,
      abbr: player.team.abbr,
      color: player.team.color,
      yours: true,
      score: quintetRaceScore(row.ppg, row.per, row.plusMinus),
      line: `${row.ppg.toFixed(1)} · ${row.per.toFixed(1)} · ${row.plusMinus > 0 ? "+" : ""}${row.plusMinus.toFixed(1)}`,
    },
  ].sort((a, b) => b.score - a.score).slice(0, 8);
  const prev = player.seasonHistory[player.seasonHistory.length - 2];
  const mipWinner = snap.awards.find((a) => a.title === "MIP");
  const mip = prev
    ? pinFirst(
        [
          ...(mipWinner && !mipWinner.isPlayer
            ? [{
                key: "mip-w",
                name: mipWinner.name,
                abbr: mipWinner.teamAbbr,
                color: "#6e6e73",
                yours: false,
                score: 2,
                line: mipWinner.note,
              }]
            : []),
          {
            key: "mip-you",
            name: player.name,
            abbr: player.team.abbr,
            color: player.team.color,
            yours: true,
            score: row.ppg - prev.ppg,
            line: `${prev.ppg.toFixed(1)} → ${row.ppg.toFixed(1)}`,
          },
        ].sort((a, b) => b.score - a.score),
        mipWinner?.name || "",
      )
    : [];
  return (
    <>
      <RaceList title={t("raceMvp", lang)} cap={t("raceMvpCap", lang)} rows={mvp} />
      <RaceList title={t("raceNba", lang)} cap={t("raceNbaCap", lang)} rows={quintet} />
      {mip.length > 0 ? <RaceList title={t("raceMip", lang)} cap={t("raceMipCap", lang)} rows={mip} /> : null}
    </>
  );
}

function RaceList({
  title,
  cap,
  rows,
}: {
  title: string;
  cap: string;
  rows: { key: string; name: string; abbr: string; color: string; line: string; yours: boolean; score: number }[];
}) {
  const lang = useLang();
  if (!rows.length) return null;
  const gap = rows.length > 1 ? Math.abs(rows[0]!.score - rows[1]!.score) : 0;
  const lead = rows[0]!;
  const first = lead.name.split(" ")[0] || lead.name;
  const gapLine =
    rows.length < 2
      ? ""
      : gap < 0.6
        ? t("voteTie", lang)
        : lead.yours
          ? tf("voteYouAhead", { v: gap.toFixed(1) }, lang)
          : tf("voteAhead", { name: first, v: gap.toFixed(1) }, lang);
  return (
    <div className="roy-board">
      <h4 className="stats-heading" style={{ marginTop: 0 }}>{title}</h4>
      <p className="chart-cap">{cap}</p>
      {rows.map((c, i) => (
        <div key={c.key} className={`roy-row ${c.yours ? "yours" : ""}`}>
          <span className="roy-pos">{i + 1}</span>
          <TeamCrest team={{ abbr: c.abbr, color: c.color, secondary: c.color }} size={20} />
          <span className="roy-name">
            <b>{c.name}</b>
            <em>{c.abbr}</em>
          </span>
          <span className="tabular">{c.line}</span>
        </div>
      ))}
      {gapLine ? <p className="chart-cap">{gapLine}</p> : null}
    </div>
  );
}

export function RoyBoard({
  player,
  race,
}: {
  player?: PlayerState;
  race?: RoyCandidate[];
}) {
  const list =
    race && race.length
      ? race
      : player?.season === 1
        ? (player.currentLeague?.royRace?.length ? player.currentLeague.royRace : player.royClass) ?? []
        : [];
  const lang = useLang();
  if (!list.length) return null;
  const ordered = [...list].sort((a, b) => b.score - a.score);
  return (
    <div className="roy-board">
      <h4 className="stats-heading" style={{ marginTop: 0 }}>
        Rookie of the Year
      </h4>
      <p className="chart-cap">{t("royCap", lang)}</p>
      <div className="roy-head">
        <span />
        <span />
        <span>{t("playerCol", lang)}</span>
        <span>{t("royCols", lang)}</span>
      </div>
      {ordered.map((c, i) => (
        <div key={c.name} className={`roy-row ${c.isPlayer ? "yours" : ""}`}>
          <span className="roy-pos">{i + 1}</span>
          <TeamCrest
            team={{ abbr: c.teamAbbr, color: c.teamColor, secondary: c.teamColor }}
            size={20}
          />
          <span className="roy-name">
            <b>{c.name}</b>
            <em>{c.teamAbbr}</em>
          </span>
          <span className="tabular">
            {c.ppg.toFixed(1)}/{c.rpg.toFixed(1)}/{c.apg.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DpoyBoard({ race }: { race?: DpoyCandidate[] }) {
  const lang = useLang();
  if (!race?.length) return null;
  return (
    <div className="roy-board">
      <h4 className="stats-heading" style={{ marginTop: 0 }}>
        Defensive Player of the Year
      </h4>
      <p className="chart-cap">{t("dpoyCap", lang)}</p>
      <div className="roy-head">
        <span />
        <span />
        <span>{t("playerCol", lang)}</span>
        <span>STL · BLK</span>
      </div>
      {race.map((c, i) => (
        <div key={c.name} className={`roy-row ${c.isPlayer ? "yours" : ""}`}>
          <span className="roy-pos">{i + 1}</span>
          <TeamCrest
            team={{ abbr: c.teamAbbr, color: c.teamColor, secondary: c.teamColor }}
            size={20}
          />
          <span className="roy-name">
            <b>{c.name}</b>
            <em>{c.teamAbbr}</em>
          </span>
          <span className="tabular">
            {c.spg.toFixed(1)} · {c.bpg.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}
