# PIVOT 23: Spanish / Simplified Chinese glossary

Status: **machine-assisted first pass (2026-11-09), NOT reviewed by native speakers.** Use this as
the reference for the native review; change the glossary first, then the dictionaries.

Rules used:

- **No licensed names are invented.** League and award names are descriptive. Spanish keeps the
  official English award names, as the Italian and English builds do. Chinese shows descriptive
  terms used by Chinese basketball media (display only: `awardDisplay()`). The engine still stores
  the English/Italian canonical names, so saves are unchanged.
- **Player, team and city names stay in Latin script** in Chinese (e.g. "Marco Ferrara", "Phoenix
  Suns"). There is no transliteration table and none is invented.
- Spanish is **neutral** (Spain and Latin America): "tú", "cancha/pista", "pívot", "base",
  "agente libre". It avoids regional slang.
- Chinese is **Simplified (zh-CN)**: full-width punctuation (，。：；), no spaces between ideographs
  (`zhTidy()`), Arabic numerals for stats ("18投3中" in narrative, "第3顺位" for picks).

## Awards

| Canonical (stored) | Spanish (es) | Chinese (zh-CN) |
|---|---|---|
| MVP | MVP | 常规赛MVP |
| Finals MVP | Finals MVP | 总决赛MVP |
| Rookie of the Year | Rookie of the Year | 年度最佳新秀 |
| Defensive Player of the Year | Defensive Player of the Year | 年度最佳防守球员 |
| Sixth Man of the Year | Sixth Man of the Year | 年度最佳第六人 |
| Most Improved Player | Most Improved Player | 年度进步最快球员 |
| All-NBA First/Second/Third Team | All-NBA First/Second/Third Team ("primer, segundo y tercer quinteto All-NBA" in prose) | NBA最佳阵容一阵 / 二阵 / 三阵 |
| All-Star | All-Star | 全明星 |
| NBA Champion | Campeón de la NBA | NBA总冠军 |
| EuroLeague Champion | Campeón de la EuroLeague | 欧洲篮球联赛冠军 |

## Roles

| Role | it | es | zh |
|---|---|---|---|
| PG | Playmaker | Base | 控球后卫 |
| SG | Guardia tiratrice | Escolta | 得分后卫 |
| SF | Ala piccola | Alero | 小前锋 |
| PF | Ala grande | Ala-pívot | 大前锋 |
| C | Centro | Pívot | 中锋 |

## Leagues, rounds, paths

| Term | es | zh |
|---|---|---|
| NBA | NBA | NBA |
| EuroLeague (Eurolega) | EuroLeague | 欧洲篮球联赛 (not 欧冠, which is a different competition) |
| G League | G League | G联赛 |
| NCAA / campus | NCAA / universidad, campus | NCAA / 大学 |
| East / West | Este / Oeste | 东部 / 西部 |
| First round | Primera ronda | 首轮 |
| Conference semifinals / finals | Semifinales / Finales de conferencia | 分区半决赛 / 分区决赛 |
| NBA Finals | Finales de la NBA | NBA总决赛 |
| Draft | Draft | 选秀 |
| Pick n. N | Elección n.º N | 第N顺位 |
| Free agent | Agente libre | 自由球员 |
| Back-to-back | back-to-back | 背靠背 |
| Overall (OVR) | Overall / OVR | 总评 (OVR) |

## Difficulty

| id | es | zh |
|---|---|---|
| esordio | Debut · Fácil | 新秀 · 简单 |
| pro | Pro · Normal | 职业 · 普通 |
| allstar | All-Star · Difícil | 全明星 · 困难 |
| leggenda | Leyenda · Extremo | 传奇 · 极难 |

## Recurring narrative words

| Italian | es | zh |
|---|---|---|
| il mestiere | el oficio | 本事 / 职业 / 手艺 (by context) |
| lo staff | el cuerpo técnico | 教练组 |
| il gesto | el gesto | 动作 |
| il palazzetto | el pabellón | 球馆 |
| il parquet | el parqué / la pista | 地板 / 球场 |
| la lunetta | la línea de tiros libres | 罚球线 |
| tempo morto | tiempo muerto | 暂停 |
| il ferro | el aro | 篮筐 |
| la Career Card | la Career Card | Career Card (brand, untranslated) |

## Known points for the native review

- Chinese award terms are common media usage, not official licensed names: confirm wording.
- "本赛季 / 联盟 / 生涯" tab labels (Year / League / Life): confirm they read naturally.
- Spanish register (tú) and Spain-vs-Latin-America vocabulary ("pista" vs "cancha").
- Stats: PPG/RPG/APG kept as abbreviations in both; table headers es PUNTOS/REBOTES/ASISTENCIAS,
  PF/PC (points for/against), V-D; zh 得分/篮板/助攻, 得分/失分, 胜-负, 节奏.
- Narrative slot values that are inserted as Italian words by the engine (e.g. `{NEED}`, `{Q}` in
  world news) are translated by the catalog at render time when a match exists; otherwise the
  whole line falls back to English.
