import campusJson from "@/data/campuses/mcgill/campus.json";
import type { ActivityType, Meeting, ParsedTimetable, Term, Weekday } from "@/lib/timetable-types";
import type { CampusSnapshot, Day, Meeting as McGillMeeting } from "../common/model";
import { parseIcs } from "../carleton/ics-parser";
import { mcgill } from "./config";

export const mcgillCampus = campusJson as unknown as CampusSnapshot;

const weekdays: Record<Day, Weekday> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
};

function minutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour! * 60 + minute!;
}

function activityType(value: string): ActivityType {
  const component = value.toUpperCase();
  return ["LEC", "TUT", "PRA", "LAB", "SEM"].includes(component)
    ? (component as ActivityType)
    : "OTHER";
}

function term(value: string): Term {
  if (value.startsWith("Winter")) return "Winter";
  if (value.startsWith("Summer")) return "Summer";
  return "Fall";
}

export function normalizeMcGillMeeting(source: McGillMeeting): Meeting[] {
  const building = mcgillCampus.buildings.find((item) => item.id === source.location.buildingId);
  return source.days.map((day) => ({
    id: `${source.id}:${day}`,
    universityId: "mcgill",
    courseCode: source.courseCode,
    activityType: activityType(source.nativeComponentType),
    sectionCode: source.nativeSection,
    nativeSection: source.nativeSection,
    nativeComponentType: source.nativeComponentType,
    courseName: source.courseName ?? source.courseCode,
    startTime: minutes(source.startTime),
    endTime: minutes(source.endTime),
    weekday: weekdays[day],
    buildingCode: building?.nativeCodes[0] ?? null,
    room: source.location.room,
    term: term(source.termLabel),
    campus: "MCGILL-DOWNTOWN",
    locationUnknown: source.location.kind !== "physical" || !building,
    locationType: source.location.kind,
    sourceLocation: source.location.nativeText,
    dateRange: { startDate: source.startDate, endDate: source.endDate },
    recurrenceIntervalWeeks: 1,
  }));
}

export function parseMcGillIcs(text: string): ParsedTimetable {
  const parsed = parseIcs(text, mcgillCampus, mcgill);
  return { meetings: parsed.meetings.flatMap(normalizeMcGillMeeting), warnings: parsed.warnings };
}
