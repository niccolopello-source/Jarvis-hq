import { useMemo, useState, type ReactNode } from "react";
import { CourtMark, TeamMark } from "@/components/pivot/TeamMark";
import { useLang } from "@/lib/pivot/i18n";
import { nationLabel, playoffResultLabel, roleLabel } from "@/lib/pivot/labels";
import { nx } from "@/lib/pivot/narrative";
import { buildLegacyReport, cardFaceOf, type CardFace, type LegacyReport } from "@/lib/pivot/legacy-report";
import { fmtDec, fmtInt, legacyAwardLabel, lt, narrativeOf, pickLabel, recordLabel, recordValue, seasonsLabel, timelineLine } from "@/lib/pivot/legacy-i18n";
import { catalogFrames, loadCareerFrame, saveCareerFrame, themeById, type CardTheme } from "@/lib/pivot/cosmetics";
import { frameFactsOf, isFrameUnlocked, type FrameFacts, type FrameGrade, type FrameId } from "@/lib/pivot/card-frames";
import type { ArchiveCareer } from "@/lib/pivot/types";
import { CareerShareBar, cardLabels } from "./CareerShareBar";
import { CeremonyView } from "./CeremonyView";
import "@/styles/legacy.css";

function themeStyle(theme: CardTheme): Record<string, string> {
  const p = theme.palette;
  return { "--lc-bg1": p.bg1, "--lc-bg2": p.bg2, "--lc-ink": p.ink, "--lc-muted": p.muted, "--lc-accent": p.accent, "--lc-frame": p.frame };
}

const GRADE_KEY: Record<FrameGrade, "gradeCommon" | "gradeRare" | "gradeEpic" | "gradeLegendary" | "gradeMythic"> = {
  common: "gradeCommon",
  rare: "gradeRare",
  epic: "gradeEpic",
  legendary: "gradeLegendary",
  mythic: "gradeMythic",
};

const RULE_KEY: Record<FrameId, "ruleGraphite" | "ruleBronze" | "ruleObsidian" | "ruleHolo" | "rulePrisma"> = {
  standard: "ruleGraphite",
  "bronze-frame": "ruleBronze",
  obsidian: "ruleObsidian",
  "holo-red": "ruleHolo",
  prisma: "rulePrisma",
};

function gradeLabel(theme: CardTheme, lang: Parameters<typeof lt>[1]) {
  return lt(GRADE_KEY[theme.grade], lang);
}

/** The collectible. Presentation only: it reads the face, never the engine. */
export function LegacyCardView({ face, theme, careerId }: { face: CardFace; theme: CardTheme; careerId?: string }) {
  const lang = useLang();
  const l = cardLabels(face, lang);
  const artNumber = face.number;
  return (
    <article
      className="legacy-card"
      style={themeStyle(theme)}
      data-career-card
      data-theme={theme.id}
      data-foil={theme.foil}
      data-grade={theme.grade}
      data-career-id={careerId || undefined}
      role="region"
      aria-label={lt("cardRegion", lang)}
    >
      <div className="lc-inner">
        <div className="lc-top">
          <CourtMark number={23} size={52} brand />
          <div className="lc-serial">
            <strong>{theme.name[lang] ?? theme.name.en}</strong>
          </div>
        </div>
        <div className="lc-art" aria-hidden={artNumber === null}>
          <div className="lc-court"><i className="lc-circle" /><i className="lc-half" /></div>
          {artNumber !== null ? <span className="lc-art-num">{artNumber}</span> : <CourtMark number={23} size={120} brand />}
        </div>
        <p className="lc-meta">{[l.role, l.nation].filter(Boolean).join(" · ")}</p>
        <div className="lc-who">
          <div>
            <h3 className="lc-name">{face.name}</h3>
            <p className="lc-meta">{[face.span, l.ages, l.seasons, l.peak].filter(Boolean).join(" · ")}</p>
          </div>
          {face.number !== null ? <span className="lc-number" aria-label={`${lt("jersey", lang)} ${face.number}`}>{face.number}</span> : null}
        </div>
        <div className="lc-rule" aria-hidden />
        {l.stats.length > 0 ? (
          <dl className="lc-stats">
            {l.stats.map(([v, k]) => (
              <div key={k} className="lc-stat">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {l.honors.length > 0 ? (
          <ul className="lc-honors">
            {l.honors.map((h) => <li key={h}>{h}</li>)}
          </ul>
        ) : null}
        <div className="lc-foot-row">
          <div>
            {face.teams.length > 0 ? (
              <div className="lc-teams" aria-label={lt("teams", lang)}>
                {face.teams.map((t) => (
                  <span key={t.abbr} title={t.name} className="lc-team">
                    <TeamMark team={t} size={30} number={face.number ?? undefined} />
                    <span>{t.abbr}</span>
                  </span>
                ))}
              </div>
            ) : null}
            <p className="lc-verdict">{l.verdict}</p>
          </div>
          <span className={`lc-seal lc-seal-${theme.id}`} data-card-seal>{gradeLabel(theme, lang)}</span>
        </div>
        <p className="lc-foot">{l.footer}</p>
      </div>
    </article>
  );
}

function FrameCollection({
  themeId,
  facts,
  onPick,
}: {
  themeId: string;
  facts: FrameFacts;
  onPick: (id: FrameId) => void;
}) {
  const lang = useLang();
  const themes = catalogFrames();
  return (
    <fieldset className="lc-themes" data-frame-collection>
      <legend>{lt("framesTitle", lang)}</legend>
      <div className="lc-theme-row">
        {themes.map((t) => {
          const id = t.id as FrameId;
          const unlocked = isFrameUnlocked(id, facts);
          return (
            <button
              key={t.id}
              type="button"
              className="lc-theme"
              aria-pressed={themeId === t.id}
              aria-disabled={!unlocked}
              data-theme-option={t.id}
              data-locked={unlocked ? undefined : "1"}
              onClick={() => { if (unlocked) onPick(id); }}
            >
              <span className="lc-swatch" style={themeStyle(t)} data-foil={t.foil} aria-hidden />
              <span className="lc-theme-name">{t.name[lang] ?? t.name.en}</span>
              <span className="lc-theme-tag">{unlocked ? gradeLabel(t, lang) : lt("frameLocked", lang)}</span>
              <span className="lc-theme-rule">{lt(RULE_KEY[id], lang)}</span>
            </button>
          );
        })}
      </div>
      <p className="lc-note">{lt("themeNote", lang)}</p>
    </fieldset>
  );
}


/** Career Card + Legacy Report for one finished career. Loaded lazily from PivotApp. */
export function LegacyExperience({ entry, reveal = false }: { entry: ArchiveCareer; reveal?: boolean }) {
  const lang = useLang();
  const report = useMemo(() => buildLegacyReport(entry), [entry]);
  const face = useMemo(() => cardFaceOf(report), [report]);
  const facts = useMemo(() => frameFactsOf(report, entry.card?.mvps), [report, entry.card]);
  const [themeId, setThemeId] = useState(() => loadCareerFrame(entry.careerId, facts));
  const [ceremony, setCeremony] = useState(reveal);
  const theme = themeById(themeId);
  const uid = `lr-${(entry.careerId || entry.id).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 24)}`;

  function pick(id: FrameId) {
    if (!isFrameUnlocked(id, facts)) return;
    saveCareerFrame(entry.careerId, id);
    setThemeId(id);
  }

  function closeCeremony() {
    setCeremony(false);
  }

  return (
    <div className="legacy-experience">
      {ceremony ? <CeremonyView face={face} onContinue={closeCeremony} /> : null}
      <div className="lc-stage">
        <div className="lc-col-card">
          <LegacyCardView face={face} theme={theme} careerId={entry.careerId} />
          {/* Share sits next to the card, never on the PNG. The exported image still uses the kept theme, not a preview. */}
          <CareerShareBar face={face} theme={theme} />
        </div>
        <div className="lc-col-side">
          {!ceremony ? (
            <button type="button" className="ghost-btn lc-replay" data-ceremony-replay onClick={() => setCeremony(true)}>
              {lt("ceremonyReplay", lang)}
            </button>
          ) : null}
          <div className="lc-unlock" data-frame-unlock>
            <i className="lc-gem" data-foil={theme.foil} aria-hidden="true" />
            <div>
              <p className="lc-unlock-kicker">{lt("unlockKicker", lang)}</p>
              <p className="lc-unlock-body">{lt("unlockBody", lang, { name: theme.name[lang] ?? theme.name.en })}</p>
            </div>
          </div>
          <FrameCollection themeId={themeId} facts={facts} onPick={pick} />
        </div>
      </div>
      <LegacyReportView report={report} uid={uid} />
      {report.simulated ? <p className="lr-muted">{lt("simulated", lang)}</p> : null}
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section className="lr-section" aria-labelledby={id}>
      <h4 id={id} className="lr-h">{title}</h4>
      {children}
    </section>
  );
}

function Facts({ items }: { items: [string, string | null | undefined][] }) {
  const shown = items.filter((x): x is [string, string] => !!x[1]);
  if (!shown.length) return null;
  return (
    <dl className="lr-facts">
      {shown.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Presentation only: keep a series score together while the surrounding result wraps. */
function PlayoffCell({ text }: { text: string }) {
  return <>{text.split(/(\d+-\d+)/g).map((part, i) => /\d+-\d+/.test(part) ? <span className="lr-score" key={i}>{part}</span> : part)}</>;
}

export function LegacyReportView({ report, uid }: { report: LegacyReport; uid: string }) {
  const lang = useLang();
  const [all, setAll] = useState(false);
  const rows = all ? report.rows : report.rows.slice(-10);
  const r = report;
  const t = r.totals;
  const draft = r.draftPick
    ? r.draftTeam
      ? lt("draftValue", lang, { pick: pickLabel(r.draftPick, lang), team: r.draftTeam })
      : lt("draftValueNoTeam", lang, { pick: pickLabel(r.draftPick, lang) })
    : null;
  return (
    <div className="legacy-report" data-legacy-report>
      <h3 className="lr-title">{lt("reportTitle", lang)}</h3>
      <Section title={lt("story", lang)} id={`${uid}-story`}>
        {narrativeOf(r, lang).map((s) => <p key={s} className="lr-story">{s}</p>)}
        {r.bust ? <p className="lr-story" data-bust>{lt("bust", lang)}</p> : null}
        <p className="lr-story lr-close">{nx(r.closing, lang)}</p>
      </Section>
      <Section title={lt("identity", lang)} id={`${uid}-id`}>
        <Facts
          items={[
            [lt("jersey", lang), r.number !== null ? `#${r.number}` : null],
            [lt("role", lang), r.roleCode ? roleLabel(r.roleCode, lang) : roleLabel(r.roleLabel, lang)],
            [lt("nation", lang), r.nationality ? nationLabel(r.nationality, lang) : null],
            [lt("origin", lang), r.originPath ? nx(r.originPath, lang).replace(/^G-League$/, "G League") : null],
            [lt("draft", lang), draft],
          ]}
        />
      </Section>
      <Section title={lt("career", lang)} id={`${uid}-career`}>
        <Facts
          items={[
            [lt("years", lang), r.firstYear && r.lastYear ? `${r.firstYear} → ${r.lastYear} · ${seasonsLabel(r.seasons, lang)}` : null],
            [lt("age", lang), r.ageStart !== null && r.ageEnd !== null ? `${r.ageStart}–${r.ageEnd}` : null],
            [lt("teams", lang), r.stints.length ? r.stints.map((s) => `${s.team} (${s.from.slice(0, 4)}–${Number(s.to.slice(0, 4)) + 1})`).join(" → ") : null],
            [lt("averages", lang), r.averages ? `${fmtDec(r.averages.ppg, lang)} PPG · ${fmtDec(r.averages.rpg, lang)} RPG · ${fmtDec(r.averages.apg, lang)} APG` : null],
            [lt("games", lang), t.games ? fmtInt(t.games, lang) : null],
            [lt("points", lang), t.points !== undefined ? fmtInt(t.points, lang) : null],
            [lt("rebounds", lang), t.rebounds !== undefined ? fmtInt(t.rebounds, lang) : null],
            [lt("assists", lang), t.assists !== undefined ? fmtInt(t.assists, lang) : null],
            [lt("steals", lang), t.steals !== undefined ? fmtInt(t.steals, lang) : null],
            [lt("blocks", lang), t.blocks !== undefined ? fmtInt(t.blocks, lang) : null],
          ]}
        />
      </Section>
      <Section title={`${lt("regular", lang)} · ${lt("playoffs", lang)}`} id={`${uid}-results`}>
        <Facts
          items={[
            [lt("record", lang), r.regular.wins + r.regular.losses > 0 ? `${r.regular.wins}-${r.regular.losses}` : null],
            [lt("playoffYears", lang), r.rows.length ? `${r.regular.playoffYears} / ${r.rows.length}` : null],
            [lt("deepest", lang), r.deepest ? playoffResultLabel(r.deepest, lang) : null],
            [lt("finals", lang), r.finals ? fmtInt(r.finals, lang) : null],
            [lt("titles", lang), fmtInt(r.titles, lang)],
          ]}
        />
      </Section>
      <Section title={lt("awards", lang)} id={`${uid}-awards`}>
        {r.awards.length ? (
          <ul className="lr-chips">
            {r.awards.map(([id, n]) => <li key={id}>{n > 1 ? `${n}× ${legacyAwardLabel(id, lang)}` : legacyAwardLabel(id, lang)}</li>)}
          </ul>
        ) : (
          <p className="lr-muted">{lt("noAwards", lang)}</p>
        )}
      </Section>
      {r.records.length > 0 ? (
        <Section title={lt("records", lang)} id={`${uid}-records`}>
          <p className="lr-muted">{lt("recordsNote", lang)}</p>
          <dl className="lr-facts">
            {r.records.map((x) => (
              <div key={x.key}>
                <dt>{recordLabel(x, lang)}</dt>
                <dd>{recordValue(x, lang)} <span className="lr-muted">· {x.yearLabel} · {x.teamAbbr}</span></dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}
      {r.timeline.length > 0 ? (
        <Section title={lt("timeline", lang)} id={`${uid}-timeline`}>
          <ol className="lr-timeline">
            {r.timeline.map((it, i) => (
              <li key={`${i}-${it.kind}-${it.subject}`}>
                <span className="lr-when">{it.yearLabel}</span>
                <span>{timelineLine(it, lang)}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}
      {r.rows.length > 0 ? (
        <Section title={lt("seasonsTable", lang)} id={`${uid}-seasons`}>
          <p className="lr-scroll-hint" id={`${uid}-scroll-hint`}>{lt("tableScrollHint", lang)}</p>
          <div className="lr-table-wrap" tabIndex={0} role="group" aria-labelledby={`${uid}-seasons`} aria-describedby={`${uid}-scroll-hint`}>
            <table className="lr-table">
              <thead>
                <tr>
                  <th scope="col">{lt("colSeason", lang)}</th>
                  <th scope="col">{lt("colTeam", lang)}</th>
                  <th scope="col">{lt("colGp", lang)}</th>
                  <th scope="col">PPG</th>
                  <th scope="col">RPG</th>
                  <th scope="col">APG</th>
                  <th scope="col">{lt("colWl", lang)}</th>
                  <th scope="col">{lt("colPo", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.season}>
                    <th scope="row">{row.yearLabel}</th>
                    <td title={row.team}>{row.teamAbbr}</td>
                    <td>{Number.isFinite(row.gp) ? row.gp : lt("noData", lang)}</td>
                    <td>{fmtDec(row.ppg, lang)}</td>
                    <td>{fmtDec(row.rpg, lang)}</td>
                    <td>{fmtDec(row.apg, lang)}</td>
                    <td>{Number.isFinite(row.wins) && Number.isFinite(row.losses) ? `${row.wins}-${row.losses}` : lt("noData", lang)}</td>
                    <td><PlayoffCell text={playoffResultLabel(row.playoff, lang) || lt("noData", lang)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!all && r.rows.length > rows.length ? (
            <button type="button" className="ghost-btn mt-2.5" onClick={() => setAll(true)}>
              {lt("showAll", lang, { n: r.rows.length })}
            </button>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
