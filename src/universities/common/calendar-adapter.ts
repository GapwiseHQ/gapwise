import ICAL from "ical.js";
import { MAX_TIMETABLE_EVENTS, MAX_TIMETABLE_FILE_BYTES } from "@/features/timetable/import-limits";
import {
  WEEKDAYS,
  type ActivityType,
  type Meeting,
  type MeetingLocationType,
  type ParsedTimetable,
  type Term,
  type Weekday,
} from "@/lib/timetable-types";
import { inferImportedCampus } from "./campus-inference";

const DAY_CODES: Record<string, Weekday> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
};

const WEEKDAY_INDEX: readonly Weekday[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_COURSE_PATTERNS = [
  /\b[A-Z]{2,8}-(?:UA|GA)\s*\d{1,4}[A-Z]?\b/i,
  /\b\d{1,2}-\d{3}[A-Z]?\b/i,
  /\b\d{1,2}\.\d{2,4}[A-Z]?\b/i,
  /\b[A-Z]{2,8}\s+[A-Z]{1,4}\d{3,4}[A-Z]?\b/i,
  /\b[A-Z]{2,8}\s*-?\s*\d{1,4}[A-Z]?\b/i,
];

export class CalendarTimetableParseError extends Error {
  override name = "TimetableParseError";
}

export type CalendarAdapterConfig = {
  universityId: string;
  universityName: string;
  defaultCampusId: string;
  timeZone: string;
  coursePatterns?: readonly RegExp[];
};

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\\n/gi, " ")
    .replace(/\\([,;\\])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function courseDetails(summary: string, description: string, patterns: readonly RegExp[]) {
  const combined = `${summary} ${description}`.trim();
  const ignoredSubjects = /^(?:CLASS|COURSE|ROOM|SECTION|SPRING|SUMMER|FALL|WINTER)\b/i;
  const matchedText = patterns
    .flatMap((pattern) => [
      ...combined.matchAll(new RegExp(pattern.source, `${pattern.flags.replace("g", "")}g`)),
    ])
    .map((candidate) => candidate[0])
    .find((candidate) => !ignoredSubjects.test(candidate));
  if (!matchedText) return null;
  const courseCode = matchedText
    .toUpperCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/([A-Z])\s+(\d)/, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  const componentMatch = combined.match(
    /\b(LEC(?:TURE)?|TUT(?:ORIAL)?|PRA(?:CTICAL)?|LAB(?:ORATORY)?|SEM(?:INAR)?|REC(?:ITATION)?|DIS(?:CUSSION)?)\b/i,
  );
  const component = componentMatch?.[1]?.toUpperCase() ?? "CLASS";
  const activityType: ActivityType = component.startsWith("LEC")
    ? "LEC"
    : component.startsWith("TUT") || component.startsWith("DIS") || component.startsWith("REC")
      ? "TUT"
      : component.startsWith("PRA")
        ? "PRA"
        : component.startsWith("LAB")
          ? "LAB"
          : component.startsWith("SEM")
            ? "SEM"
            : "OTHER";
  const sectionMatch = combined.match(
    /\b(?:SEC(?:TION)?|CLASS)\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{0,9})\b/i,
  );
  const courseName = summary
    .replace(matchedText, "")
    .replace(componentMatch?.[0] ?? /$^/, "")
    .replace(/^\s*[-–—:|]+|[-–—:|]+\s*$/g, "")
    .trim();
  return {
    courseCode,
    activityType,
    nativeComponentType: component,
    sectionCode: sectionMatch?.[1]?.toUpperCase() ?? "",
    courseName: courseName || courseCode,
  };
}

function localParts(time: ICAL.Time, timeZone: string) {
  if (!time.zone?.tzid || time.zone.tzid === "floating") return time;
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(time.toJSDate())
        .map((part) => [part.type, part.value]),
    );
    return {
      year: Number(parts["year"]),
      month: Number(parts["month"]),
      day: Number(parts["day"]),
      hour: Number(parts["hour"]),
      minute: Number(parts["minute"]),
    };
  } catch {
    return time;
  }
}

function isoDate(value: { year: number; month: number; day: number }): string {
  return `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

function weekdayFor(value: { year: number; month: number; day: number }): Weekday {
  return WEEKDAY_INDEX[new Date(Date.UTC(value.year, value.month - 1, value.day)).getUTCDay()]!;
}

function recurrenceDays(vevent: ICAL.Component, fallback: Weekday): Weekday[] {
  const days = new Set<Weekday>();
  for (const property of vevent.getAllProperties("rrule")) {
    const rule = property.getFirstValue() as { parts?: Record<string, unknown> } | null;
    const byday = rule?.parts?.["BYDAY"];
    if (!Array.isArray(byday)) continue;
    for (const value of byday) {
      const day =
        DAY_CODES[
          String(value)
            .replace(/[^A-Z]/gi, "")
            .toUpperCase()
            .slice(-2)
        ];
      if (day) days.add(day);
    }
  }
  if (!days.size) days.add(fallback);
  return WEEKDAYS.filter((day) => days.has(day));
}

function recurrenceEnd(vevent: ICAL.Component, event: ICAL.Event, fallback: string): string | null {
  const rules = vevent
    .getAllProperties("rrule")
    .map((property) => property.getFirstValue())
    .filter((value): value is ICAL.Recur => value instanceof ICAL.Recur);
  if (!rules.length) return fallback;
  const supplied = rules.flatMap((rule) => (rule.until ? [isoDate(rule.until)] : []));
  if (supplied.length) return supplied.sort().at(-1)!;
  if (rules.some((rule) => rule.count)) {
    const iterator = event.iterator();
    let next = iterator.next();
    let last = next;
    let count = 0;
    while (next && count < 2_000) {
      last = next;
      next = iterator.next();
      count += 1;
    }
    return last ? isoDate(last) : fallback;
  }
  return null;
}

function excludedDates(vevent: ICAL.Component): string[] {
  return [
    ...new Set(
      vevent
        .getAllProperties("exdate")
        .flatMap((property) => property.getValues())
        .filter((value): value is ICAL.Time => value instanceof ICAL.Time)
        .map(isoDate),
    ),
  ].sort();
}

function termFor(month: number): Term {
  return month <= 4 ? "Winter" : month <= 8 ? "Summer" : "Fall";
}

function locationKind(location: string): MeetingLocationType {
  if (!location || /\b(?:TBA|TBD|to be announced|not assigned)\b/i.test(location)) return "tba";
  if (/\b(?:online|remote|virtual|zoom|asynchronous|web conference)\b/i.test(location))
    return "online";
  return "physical";
}

function parseCalendar(text: string, config: CalendarAdapterConfig): ParsedTimetable {
  if (new TextEncoder().encode(text).byteLength > MAX_TIMETABLE_FILE_BYTES)
    throw new CalendarTimetableParseError("That calendar is too large. Choose a file under 2 MB.");
  if (!/BEGIN:VCALENDAR/i.test(text))
    throw new CalendarTimetableParseError(
      `That file is not an iCalendar export. Download an .ics or .vcs calendar from ${config.universityName}.`,
    );

  let calendar: ICAL.Component;
  try {
    calendar = new ICAL.Component(ICAL.parse(text));
  } catch {
    throw new CalendarTimetableParseError(
      "The calendar is malformed or incomplete. Download a fresh export and try again.",
    );
  }
  const events = calendar.getAllSubcomponents("vevent");
  if (!events.length) throw new CalendarTimetableParseError("This calendar contains no events.");
  if (events.length > MAX_TIMETABLE_EVENTS)
    throw new CalendarTimetableParseError(
      "That calendar contains too many events to import safely.",
    );

  const meetings: Meeting[] = [];
  const warnings = new Set<string>();
  const seen = new Set<string>();
  const patterns = config.coursePatterns ?? DEFAULT_COURSE_PATTERNS;

  events.forEach((vevent, index) => {
    if (String(vevent.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED") return;
    if (vevent.hasProperty("recurrence-id")) {
      warnings.add("Changed individual calendar occurrences were skipped.");
      return;
    }
    const summary = cleanText(vevent.getFirstPropertyValue("summary"));
    const description = cleanText(vevent.getFirstPropertyValue("description"));
    const details = courseDetails(summary, description, patterns);
    if (!details) return;

    try {
      const event = new ICAL.Event(vevent);
      if (!event.startDate || !event.endDate || event.startDate.isDate || event.endDate.isDate) {
        warnings.add(`Skipped “${summary}” because it has no class start and end time.`);
        return;
      }
      const start = localParts(event.startDate, config.timeZone);
      const end = localParts(event.endDate, config.timeZone);
      const startTime = start.hour * 60 + start.minute;
      const endTime = end.hour * 60 + end.minute;
      if (
        startTime < 0 ||
        endTime > 1_440 ||
        startTime >= endTime ||
        isoDate(start) !== isoDate(end)
      ) {
        warnings.add(`Skipped “${summary}” because its time cannot fit a weekly timetable block.`);
        return;
      }
      const sourceLocation = cleanText(event.location);
      const type = locationKind(sourceLocation);
      const campus = inferImportedCampus({
        universityId: config.universityId,
        courseCode: details.courseCode,
        sourceLocation,
        summary,
        description,
        defaultCampusId: config.defaultCampusId,
      });
      const startDate = isoDate(start);
      const days = recurrenceDays(vevent, weekdayFor(start));
      const uid =
        cleanText(vevent.getFirstPropertyValue("uid")) || `${config.universityId}-${index}`;
      for (const weekday of days) {
        const dedupeKey = `${details.courseCode}|${details.sectionCode}|${weekday}|${startTime}|${endTime}|${sourceLocation}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        meetings.push({
          id: `${uid}:${weekday}`,
          universityId: config.universityId,
          courseCode: details.courseCode,
          activityType: details.activityType,
          sectionCode: details.sectionCode,
          nativeSection: details.sectionCode,
          nativeComponentType: details.nativeComponentType,
          courseName: details.courseName,
          startTime,
          endTime,
          weekday,
          buildingCode: null,
          room: null,
          term: termFor(start.month),
          campus,
          locationUnknown: type !== "physical",
          locationType: type,
          sourceLocation: sourceLocation || undefined,
          dateRange: { startDate, endDate: recurrenceEnd(vevent, event, startDate) },
          excludedDates: excludedDates(vevent),
          ...(vevent.hasProperty("rrule")
            ? {
                recurrenceIntervalWeeks:
                  (vevent.getFirstPropertyValue("rrule") as ICAL.Recur | null)?.interval ?? 1,
              }
            : {}),
        });
      }
    } catch {
      warnings.add(`Skipped “${summary}” because its calendar data could not be read.`);
    }
  });

  if (!meetings.length) {
    throw new CalendarTimetableParseError(
      `No ${config.universityName} course meetings were found. Export a calendar that includes course codes, meeting times, and locations.`,
    );
  }
  return { meetings, warnings: [...warnings] };
}

export function createCalendarTimetableAdapter(config: CalendarAdapterConfig) {
  return async (text: string) => parseCalendar(text, config);
}

// Keeps the public parser testable without coupling it to the registry of lazy adapters.
export const parseStandardCalendar = parseCalendar;
