/**
 * Spanish narrative catalog: Italian source key -> Spanish, merged from ./es.
 * Lazy chunk, layered over the identity entries of the English catalog (catalog-identity.ts). Generated from
 * the 2026-11-09 translation pass; NOT reviewed by native speakers (docs/pivot23/i18n-es-zh/).
 */
import { ES_AWARDS_HELPERS } from "./es/awards-helpers.ts";
import { ES_DATA } from "./es/data.ts";
import { ES_DIFFICULTY } from "./es/difficulty.ts";
import { ES_DRAFT_CHARACTER } from "./es/draft-character.ts";
import { ES_ENGINE } from "./es/engine.ts";
import { ES_FEEL } from "./es/feel.ts";
import { ES_LEAGUE } from "./es/league.ts";
import { ES_LEGACY } from "./es/legacy.ts";
import { ES_MANUAL } from "./es/manual.ts";
import { ES_MEMORY } from "./es/memory.ts";
import { ES_NAMES } from "./es/names.ts";
import { ES_PIVOTAPP } from "./es/PivotApp.ts";
import { ES_PLAYOFF_DOORS } from "./es/playoff-doors.ts";
import { ES_STORY_EXTRA } from "./es/story-extra.ts";
import { ES_STORY_FEEL } from "./es/story-feel.ts";
import { ES_STORY_LATE } from "./es/story-late.ts";
import { ES_SUMMER } from "./es/summer.ts";
import { ES_TEAMS } from "./es/teams.ts";
import { ES_VOICE } from "./es/voice.ts";
import { ES_WORLD } from "./es/world.ts";

export const NARRATIVE_ES: Readonly<Record<string, string>> = {
  ...ES_AWARDS_HELPERS,
  ...ES_DATA,
  ...ES_DIFFICULTY,
  ...ES_DRAFT_CHARACTER,
  ...ES_ENGINE,
  ...ES_FEEL,
  ...ES_LEAGUE,
  ...ES_LEGACY,
  ...ES_MANUAL,
  ...ES_MEMORY,
  ...ES_NAMES,
  ...ES_PIVOTAPP,
  ...ES_PLAYOFF_DOORS,
  ...ES_STORY_EXTRA,
  ...ES_STORY_FEEL,
  ...ES_STORY_LATE,
  ...ES_SUMMER,
  ...ES_TEAMS,
  ...ES_VOICE,
  ...ES_WORLD,
};
