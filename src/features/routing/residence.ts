import {
  getResidenceBuildingForCampus,
  type GapwiseCampusId,
} from "../../data/campuses/index.js";
import type { BuildingConfiguration } from "../../data/utm/building-registry.js";
import type { UserPreferences } from "../sync/preferences.js";
import type { Meeting, Term, Weekday } from "../../lib/timetable-types.js";

const HOME_MEETING_PREFIX = "gapwise-home:";

export function selectedResidence(preferences: UserPreferences): BuildingConfiguration | null {
  if (preferences.dayOrigin !== "residence") return null;
  const campusId = preferences.mainCampus as GapwiseCampusId | undefined;
  if (!campusId) return null;
  const code = preferences.residenceBuildingCode;
  if (!code) return null;
  return getResidenceBuildingForCampus(campusId, code);
}

export function createResidenceMeeting({
  buildingCode,
  term,
  weekday,
  time,
  position,
  campus,
}: {
  buildingCode: string;
  term: Term;
  weekday: Weekday;
  time: number;
  position: "start" | "end" | "gap";
  campus?: string | null;
}): Meeting {
  return {
    id: `${HOME_MEETING_PREFIX}${position}:${term}:${weekday}:${buildingCode}:${time}`,
    courseCode: "Home",
    activityType: "OTHER",
    sectionCode: position,
    courseName: "Campus residence",
    startTime: time,
    endTime: time,
    weekday,
    buildingCode,
    room: null,
    campus: campus ? campus.toUpperCase() : "UTM",
    term,
    locationUnknown: false,
    locationType: "physical",
  };
}

export function isResidenceMeeting(meeting: Meeting): boolean {
  return meeting.id.startsWith(HOME_MEETING_PREFIX);
}
