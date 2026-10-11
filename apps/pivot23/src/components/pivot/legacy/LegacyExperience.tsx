import { useMemo, useState, type ReactNode } from "react";
import { CourtMark, TeamMark } from "@/components/pivot/TeamMark";
import { useLang } from "@/lib/pivot/i18n";
import { nationLabel, playoffResultLabel, roleLabel } from "@/lib/pivot/labels";
import { nx } from "@/lib/pivot/narrative";
import { buildLegacyReport, cardFaceOf, type CardFace, type LegacyReport } from "@/lib/pivot/legacy-report";
import { fmtDec, fmtInt, lt, narrativeOf, pickLabel, recordLabel, recordValue, seasonsLabel, timelineLine } from "@/lib/pivot/legacy-i18n";
import { COSMETIC_FLAGS, loadCardTheme, saveCardTheme, themeById, visibleThemes, type CardTheme } from "@/lib/pivot/cosmetics";
import type { ArchiveCareer } from "@/lib/pivot/types";
import type { Lang } from "@/lib/pivot/i18n";
import { exportCardPng, pngFileName, type ExportOutcome, type PngLabels } from "./exportPng";
import "@/styles/legacy.css";

function themeStyle(theme: CardTheme): Record<string, string> {
  const p = theme.palette;
  return { "--lc-bg1": p.bg1, "--lc-bg2": p.bg2, "--lc-ink": p.ink, "--lc-muted": p.muted, "--lc-accent": p.accent, "--lc-frame": p.frame };
}

function cardLabels(face: CardFace, lang: Lang): PngLabels {
  const role = face.roleCode ? roleLabel(face.roleCode, lang) : roleLabel(face.roleLabel, lang);
  const stats: [string, string][] = face.averages
    ? [[fmtDec(face.averages.ppg, lang), "PPG"], [fmtDec(face.averages.rpg, lang), "RPG"], [fmtDec(face.averages.apg, lang), "APG"]]
    : [];
  if (face.titles > 0) stats.push([fmtInt(face.titles, lang), lt("titles", lang)]);
  return {
    role,
    nation: face.nationality ? nationLabel(face.nationality, lang) : null,
    ages: face.ages ? `${lt("age", lang)} ${face.ages}` : "",
    seasons: face.seasons ? seasonsLabel(face.seasons, lang) : "",
    stats,
    honors: face.honors.map(([id, n]) => (n > 1 ? `${n}× ${id}` : id)),
    verdict: nx(face.verdict, lang),
    footer: lt("footer", lang),
    peak: `${lt("peak", lang)} ${face.peak}`,
  };
}

/** The collectible. Presentation only: it reads the face, never the engine. */
export function LegacyCardView({ face, theme, careerId }: { face: CardFace; theme: CardTheme; careerId?: string }) {
  const lang = useLang();
  const l = cardLabels(face, lang);
  return (
    <article
      className="legacy-card"
      style={themeStyle(theme)}
      data-career-card
      data-theme={theme.id}
      data-career-id={careerId || undefined}
      role="region"
      aria-label={lt("cardRegion", lang)}
    >
      <div className="lc-top">
        <CourtMark number={23} size={52} brand />
        {face.number !== null ? <span className="lc-number" aria-label={`${lt("jersey", lang)} ${face.number}`}>{face.number}</span> : null}
      </div>
      <p className="lc-meta">{[l.role, l.nation].filter(Boolean).join(" · ")}</p>
      <h3 className="lc-name">{face.name}</h3>
      <p className="lc-meta">{[face.span, l.ages, l.seasons, l.peak].filter(Boolean).join(" · ")}</p>
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
      <p className="lc-foot">{l.footer}</p>
    </article>
  );
}

function ThemePicker({ themeId, previewId, onPick }: { themeId: string; previewId: string | null; onPick: (id: string) => void }) {
  const lang = useLang();
  const themes = visibleThemes({ ...COSMETIC_FLAGS, previewCatalog: COSMETIC_FLAGS.previewCatalog || previewFlagFromUrl() });
  const active = previewId ?? themeId;
  return (
    <fieldset className="lc-themes">
      <legend>{lt("theme", lang)}</legend>
      <div className="lc-theme-row">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            className="lc-theme"
            aria-pressed={active === t.id}
            data-theme-option={t.id}
            onClick={() => onPick(t.id)}
          >
            <span className="lc-swatch" style={themeStyle(t)} aria-hidden />
            <span className="lc-theme-name">{t.name[lang === "en" ? "en" : "it"]}</span>
            <span className="lc-theme-tag">{t.availability === "free" ? lt("themeFree", lang) : lt("themePrototype", lang)}</span>
          </button>
        ))}
      </div>
      <p className="lc-note">{lt("themeNote", lang)}</p>
    </fieldset>
  );
}

/** Dev-only switch to see prototype themes. Production builds ignore it. */
function previewFlagFromUrl(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return new URLSearchParams(window.location.search).get("cosmetics-preview") === "1";
  } catch {
    return false;
  }
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
            [lt("origin", lang), r.originPath ? nx(r.originPath, lang) : null],
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
            {r.awards.map(([id, n]) => <li key={id}>{n > 1 ? `${n}× ${id}` : id}</li>)}
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
          <div className="lr-table-wrap" tabIndex={0} role="group" aria-labelledby={`${uid}-seasons`}>
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
                    <td>{playoffResultLabel(row.playoff, lang) || lt("noData", lang)}</td>
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

/** Career Card + Legacy Report for one finished career. Loaded lazily from PivotApp. */
export function LegacyExperience({ entry }: { entry: ArchiveCareer }) {
  const lang = useLang();
  const report = useMemo(() => buildLegacyReport(entry), [entry]);
  const face = useMemo(() => cardFaceOf(report), [report]);
  const [themeId, setThemeId] = useState(() => loadCardTheme());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [status, setStatus] = useState<ExportOutcome | "busy" | null>(null);
  const theme = themeById(previewId ?? themeId);
  const uid = `lr-${(entry.careerId || entry.id).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 24)}`;

  function pick(id: string) {
    if (saveCardTheme(id) || themeById(id).availability === "free") {
      setThemeId(id);
      setPreviewId(null);
    } else {
      setPreviewId(id);
    }
  }

  async function onExport() {
    setStatus("busy");
    // The PNG always uses a theme the player can keep: a prototype preview is not exported.
    setStatus(await exportCardPng(face, themeById(themeId), cardLabels(face, lang), pngFileName(face.name)));
  }

  return (
    <div className="legacy-experience">
      <LegacyCardView face={face} theme={theme} careerId={entry.careerId} />
      <div className="lc-actions">
        <button type="button" className="primary-btn" onClick={onExport} disabled={status === "busy"} data-export-png>
          {lt("exportPng", lang)}
        </button>
        <p className="lc-status" role="status" aria-live="polite">
          {status === "busy" ? lt("exporting", lang) : status === "done" ? lt("exportDone", lang) : status === "failed" ? lt("exportFail", lang) : status === "unsupported" ? lt("exportUnsupported", lang) : ""}
        </p>
      </div>
      <ThemePicker themeId={themeId} previewId={previewId} onPick={pick} />
      <LegacyReportView report={report} uid={uid} />
      {report.simulated ? <p className="lr-muted">{lt("simulated", lang)}</p> : null}
    </div>
  );
}
