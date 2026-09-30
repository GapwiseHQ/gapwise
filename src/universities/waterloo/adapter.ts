import campusJson from "@/data/campuses/waterloo/campus.json";
import type { ActivityType, Meeting, ParsedTimetable, Term, Weekday } from "@/lib/timetable-types";
import type { CampusSnapshot, Day, Meeting as WaterlooMeeting } from "../common/model";
import { waterloo } from "./config";
import { parseWaterlooQuestText } from "./text-parser";

export const waterlooCampus = campusJson as unknown as CampusSnapshot;

const weekdays: Record<Day, Weekday> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
};
const minutes = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour! * 60 + minute!;
};
function activityType(value: string): ActivityType {
  const component = value.toUpperCase();
  return ["LEC", "TUT", "PRA", "LAB", "SEM"].includes(component)
    ? (component as ActivityType)
    : "OTHER";
}
function term(value: string): Term {
  if (value.startsWith("Winter")) return "Winter";
  if (value.startsWith("Spring") || value.startsWith("Summer")) return "Summer";
  return "Fall";
}

export function normalizeWaterlooMeeting(source: WaterlooMeeting): Meeting[] {
  const building = waterlooCampus.buildings.find((item) => item.id === source.location.buildingId);
  return source.days.map((day) => ({
    id: `${source.id}:${day}`,
    universityId: "waterloo",
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
    campus: "WATERLOO-MAIN",
    locationUnknown: source.location.kind !== "physical" || !building,
    locationType: source.location.kind,
    sourceLocation: source.location.nativeText,
    dateRange: { startDate: source.startDate, endDate: source.endDate },
    recurrenceIntervalWeeks: 1,
  }));
}

export function parseWaterlooTimetable(text: string): ParsedTimetable {
  const parsed = parseWaterlooQuestText(text, waterlooCampus, waterloo);
  return { meetings: parsed.meetings.flatMap(normalizeWaterlooMeeting), warnings: parsed.warnings };
}

export const waterlooQuestAdapter = {
  universityId: "waterloo",
  label: "Waterloo Quest Class Schedule",
  acceptedInputs: ["text/plain", ".txt", ".tsv"],
  detect(text: string): boolean {
    return (
      /\bClass Nbr\b/i.test(text) && /\bDays\s*&\s*Times\b/i.test(text) && /\bRoom\b/i.test(text)
    );
  },
  validate(text: string): { valid: boolean; error?: string } {
    return text.trim()
      ? { valid: true }
      : { valid: false, error: "Schedule input cannot be empty." };
  },
  parse: parseWaterlooTimetable,
};
