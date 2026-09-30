import type { CampusSnapshot, Day, LocationKind, Meeting } from "../common/model";
import type { InstitutionAdapter } from "../common/model";
import { resolveLocation } from "../common/meetings";

const DAYS: Record<string, Day> = {
  M: "MO",
  MO: "MO",
  T: "TU",
  TU: "TU",
  W: "WE",
  WE: "WE",
  R: "TH",
  TH: "TH",
  F: "FR",
  FR: "FR",
  SA: "SA",
  SU: "SU",
};

function parseDays(value: string): Day[] {
  const compact = value.replace(/[,.\s]/g, "").toUpperCase();
  const tokens = compact.match(/MO|TU|WE|TH|FR|SA|SU|M|T|W|R|F/g) ?? [];
  return [...new Set(tokens.map((token) => DAYS[token]).filter((day): day is Day => Boolean(day)))];
}

function time24(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  if (match[3]!.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (match[3]!.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

function isoDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[1]!.padStart(2, "0")}-${match[2]!.padStart(2, "0")}`;
}

/** Parse rows copied from Quest's documented Class Schedule → List View table. */
export function parseWaterlooQuestText(
  text: string,
  campus: CampusSnapshot,
  adapter: InstitutionAdapter,
): { meetings: Meeting[]; warnings: string[] } {
  const warnings: string[] = [];
  const meetings: Meeting[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let course: { code: string; name: string } | null = null;
  let term = "";

  for (const [lineIndex, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (!line) continue;
    const termMatch = line.match(/\b(Fall|Winter|Spring)\s+(20\d{2})\b/i);
    if (termMatch)
      term = `${termMatch[1]![0]!.toUpperCase()}${termMatch[1]!.slice(1).toLowerCase()} ${termMatch[2]}`;

    const heading = line.match(/^([A-Z]{2,8})\s+(\d{3}[A-Z]?)\s*[-–]\s*(.+)$/i);
    if (heading) {
      const code = adapter.parseCourseCode(`${heading[1]} ${heading[2]}`);
      course = code ? { code, name: heading[3]!.trim() } : null;
      continue;
    }
    if (/^Class Nbr\b/i.test(line)) continue;

    const cells = rawLine.split("\t").map((cell) => cell.trim());
    if (!course || cells.length < 7 || !/^\d+$/.test(cells[0] ?? "")) continue;
    const schedule = cells[3] ?? "";
    const timeMatch = schedule.match(
      /^(.+?)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM))$/i,
    );
    const dates = (cells[6] ?? "").match(
      /^(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{1,2}\/\d{4})$/,
    );
    if (!timeMatch || !dates) {
      warnings.push(`Skipped an invalid Quest schedule row for ${course.code}.`);
      continue;
    }
    const days = parseDays(timeMatch[1]!);
    const startTime = time24(timeMatch[2]!);
    const endTime = time24(timeMatch[3]!);
    const startDate = isoDate(dates[1]!);
    const endDate = isoDate(dates[2]!);
    if (!days.length || !startTime || !endTime || !startDate || !endDate || endTime <= startTime) {
      warnings.push(`Skipped an invalid Quest schedule row for ${course.code}.`);
      continue;
    }

    const rawLocation = cells[4] ?? "";
    const kind: LocationKind = /online|remote|virtual/i.test(rawLocation)
      ? "online"
      : !rawLocation || /^(TBA|To Be Announced)$/i.test(rawLocation)
        ? "tba"
        : "physical";
    const location = resolveLocation(rawLocation, kind, campus);
    if (kind === "physical" && !location.buildingId) {
      warnings.push(`Could not match ${rawLocation} to a Waterloo building.`);
    }
    meetings.push({
      id: `waterloo-quest-${lineIndex + 1}`,
      institutionId: "waterloo",
      courseCode: course.code,
      nativeSection: cells[1]!.toUpperCase(),
      nativeComponentType: cells[2]!.toUpperCase(),
      courseName: course.name,
      termLabel:
        term ||
        (/-(0[1-4])-/.test(startDate)
          ? `Winter ${startDate.slice(0, 4)}`
          : `Fall ${startDate.slice(0, 4)}`),
      days,
      startTime,
      endTime,
      startDate,
      endDate,
      location,
      source: { kind: "student-entry", recordedAt: new Date().toISOString() },
    });
  }

  if (!meetings.length) {
    throw new Error(
      "No Waterloo Quest meetings were found. Open Class Schedule → List View and copy the course headings and class rows.",
    );
  }
  return { meetings, warnings };
}
