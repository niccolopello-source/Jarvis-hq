/**
 * Simplified Chinese (zh-CN) narrative catalog: Italian source key -> Chinese, merged from ./zh.
 * Lazy chunk, layered over the English catalog (missing keys render in English). Generated from
 * the 2026-11-09 translation pass; NOT reviewed by native speakers (docs/pivot23/i18n-es-zh/).
 */
import { ZH_AWARDS_HELPERS } from "./zh/awards-helpers.ts";
import { ZH_DATA } from "./zh/data.ts";
import { ZH_DIFFICULTY } from "./zh/difficulty.ts";
import { ZH_DRAFT_CHARACTER } from "./zh/draft-character.ts";
import { ZH_ENGINE } from "./zh/engine.ts";
import { ZH_FEEL } from "./zh/feel.ts";
import { ZH_LEAGUE } from "./zh/league.ts";
import { ZH_LEGACY } from "./zh/legacy.ts";
import { ZH_MANUAL } from "./zh/manual.ts";
import { ZH_MEMORY } from "./zh/memory.ts";
import { ZH_NAMES } from "./zh/names.ts";
import { ZH_PIVOTAPP } from "./zh/PivotApp.ts";
import { ZH_PLAYOFF_DOORS } from "./zh/playoff-doors.ts";
import { ZH_STORY_EXTRA } from "./zh/story-extra.ts";
import { ZH_STORY_FEEL } from "./zh/story-feel.ts";
import { ZH_STORY_LATE } from "./zh/story-late.ts";
import { ZH_SUMMER } from "./zh/summer.ts";
import { ZH_TEAMS } from "./zh/teams.ts";
import { ZH_VOICE } from "./zh/voice.ts";
import { ZH_WORLD } from "./zh/world.ts";

export const NARRATIVE_ZH: Readonly<Record<string, string>> = {
  ...ZH_AWARDS_HELPERS,
  ...ZH_DATA,
  ...ZH_DIFFICULTY,
  ...ZH_DRAFT_CHARACTER,
  ...ZH_ENGINE,
  ...ZH_FEEL,
  ...ZH_LEAGUE,
  ...ZH_LEGACY,
  ...ZH_MANUAL,
  ...ZH_MEMORY,
  ...ZH_NAMES,
  ...ZH_PIVOTAPP,
  ...ZH_PLAYOFF_DOORS,
  ...ZH_STORY_EXTRA,
  ...ZH_STORY_FEEL,
  ...ZH_STORY_LATE,
  ...ZH_SUMMER,
  ...ZH_TEAMS,
  ...ZH_VOICE,
  ...ZH_WORLD,
};
