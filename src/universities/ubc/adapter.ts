import campusJson from "@/data/campuses/ubc/campus.json";
import type { ActivityType, Meeting, ParsedTimetable, Term, Weekday } from "@/lib/timetable-types";
import type { CampusSnapshot, Day, Meeting as UbcMeeting } from "../common/model";
import { inferImportedCampus } from "../common/campus-inference";
import { ubc } from "./config";
import { parseUbcWorkdayText } from "./text-parser";

export const ubcCampus = campusJson as unknown as CampusSnapshot;

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

export function normalizeUbcMeeting(source: UbcMeeting): Meeting[] {
  const building = ubcCampus.buildings.find((item) => item.id === source.location.buildingId);
  const campus = inferImportedCampus({
    universityId: "ubc",
    courseCode: source.courseCode,
    sourceLocation: source.location.nativeText,
    description: source.source.kind === "ubc-workday-okanagan" ? "UBCO Okanagan" : "UBCV Vancouver",
    defaultCampusId: "ubc-vancouver",
  });
  return source.days.map((day) => ({
    id: `${source.id}:${day}`,
    universityId: "ubc",
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
    campus,
    locationUnknown:
      source.location.kind !== "physical" || (campus === "UBC-VANCOUVER" && !building),
    locationType: source.location.kind,
    sourceLocation: source.location.nativeText,
    dateRange: { startDate: source.startDate, endDate: source.endDate },
    recurrenceIntervalWeeks: 1,
  }));
}

export function parseUbcTimetable(text: string): ParsedTimetable {
  const parsed = parseUbcWorkdayText(text, ubcCampus, ubc);
  return { meetings: parsed.meetings.flatMap(normalizeUbcMeeting), warnings: parsed.warnings };
}

import { DEMO_UBC_MEETINGS } from "./demo-timetable";

export function loadUbcDemoTimetable(): Meeting[] {
  return DEMO_UBC_MEETINGS.flatMap(normalizeUbcMeeting);
}

export const ubcWorkdayAdapter = {
  universityId: "ubc",
  label: "UBC Workday View My Courses",
  acceptedInputs: ["text/plain", ".txt", ".tsv"],
  detect(text: string): boolean {
    return (
      /\b[A-Z]{2,6}_[VO]\s+\d{3}[A-Z]?-[A-Z0-9]+\b/.test(text) && /Meeting Patterns/i.test(text)
    );
  },
  validate(text: string): { valid: boolean; error?: string } {
    if (!text.trim()) return { valid: false, error: "Schedule input cannot be empty." };
    return { valid: true };
  },
  parse: parseUbcTimetable,
};
