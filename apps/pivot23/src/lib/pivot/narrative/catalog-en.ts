/** English narrative catalog: Italian source key -> English, merged from ./en (one file per source module). */
import { EN_CAREERCHART } from "./en/CareerChart.ts";
import { EN_DIALOG } from "./en/Dialog.ts";
import { EN_LEAGUEPANEL } from "./en/LeaguePanel.ts";
import { EN_PIVOTAPP } from "./en/PivotApp.ts";
import { EN_SWIPEPAGER } from "./en/SwipePager.ts";
import { EN_TEAMMARK } from "./en/TeamMark.ts";
import { EN_AWARDS_HELPERS } from "./en/awards-helpers.ts";
import { EN_DATA } from "./en/data.ts";
import { EN_DIFFICULTY } from "./en/difficulty.ts";
import { EN_DRAFT_CHARACTER } from "./en/draft-character.ts";
import { EN_ENGINE } from "./en/engine.ts";
import { EN_FEEL } from "./en/feel.ts";
import { EN_LEAGUE } from "./en/league.ts";
import { EN_LEGACY } from "./en/legacy.ts";
import { EN_MANUAL } from "./en/manual.ts";
import { EN_NAMES } from "./en/names.ts";
import { EN_PLAYOFF_DOORS } from "./en/playoff-doors.ts";
import { EN_PRESENTATION } from "./en/presentation.ts";
import { EN_SAVE } from "./en/save.ts";
import { EN_STORY_EXTRA } from "./en/story-extra.ts";
import { EN_STORY_FEEL } from "./en/story-feel.ts";
import { EN_STORY_LATE } from "./en/story-late.ts";
import { EN_SUMMER } from "./en/summer.ts";
import { EN_TEAMS } from "./en/teams.ts";
import { EN_VOICE } from "./en/voice.ts";
import { EN_WORLD } from "./en/world.ts";

export const NARRATIVE_EN: Readonly<Record<string, string>> = {
  ...EN_CAREERCHART,
  ...EN_DIALOG,
  ...EN_LEAGUEPANEL,
  ...EN_PIVOTAPP,
  ...EN_SWIPEPAGER,
  ...EN_TEAMMARK,
  ...EN_AWARDS_HELPERS,
  ...EN_DATA,
  ...EN_DIFFICULTY,
  ...EN_DRAFT_CHARACTER,
  ...EN_ENGINE,
  ...EN_FEEL,
  ...EN_LEAGUE,
  ...EN_LEGACY,
  ...EN_MANUAL,
  ...EN_NAMES,
  ...EN_PLAYOFF_DOORS,
  ...EN_PRESENTATION,
  ...EN_SAVE,
  ...EN_STORY_EXTRA,
  ...EN_STORY_FEEL,
  ...EN_STORY_LATE,
  ...EN_SUMMER,
  ...EN_TEAMS,
  ...EN_VOICE,
  ...EN_WORLD,
};
