import type { CampusSnapshot, Day, LocationKind, Meeting } from "../common/model";
import type { InstitutionAdapter } from "../common/model";
import { resolveLocation } from "../common/meetings";

const DAY_BY_LABEL: Record<string, Day> = {
  MON: "MO",
  MONDAY: "MO",
  TUE: "TU",
  TUESDAY: "TU",
  WED: "WE",
  WEDNESDAY: "WE",
  THU: "TH",
  THURSDAY: "TH",
  FRI: "FR",
  FRIDAY: "FR",
  SAT: "SA",
  SATURDAY: "SA",
  SUN: "SU",
  SUNDAY: "SU",
};

const COMPONENT_BY_LABEL: Record<string, string> = {
  LECTURE: "LEC",
  DISCUSSION: "TUT",
  TUTORIAL: "TUT",
  LABORATORY: "LAB",
  LAB: "LAB",
  PRACTICUM: "PRA",
  SEMINAR: "SEM",
};

function time24(value: string): string | null {
  const match = value
    .trim()
    .replaceAll(".", "")
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  if (match[3]!.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (match[3]!.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

function workdayLocation(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^([A-Z0-9]{2,5})-Floor\s+[^-]+-Room\s+(.+)$/i);
  return match ? `${match[1]!.toUpperCase()} ${match[2]!.trim()}` : trimmed;
}

function termLabel(startDate: string): string {
  const month = Number(startDate.slice(5, 7));
  const year = startDate.slice(0, 4);
  if (month >= 9) return `Fall ${year}`;
  if (month >= 5) return `Summer ${year}`;
  return `Winter ${year}`;
}

/**
 * Parse rows copied from Workday's View My Courses > My Enrolled Courses table.
 * UBC's published guide documents the table columns and Meeting Patterns cell layout.
 */
export function parseUbcWorkdayText(
  text: string,
  campus: CampusSnapshot,
  adapter: InstitutionAdapter,
): { meetings: Meeting[]; warnings: string[] } {
  const warnings: string[] = [];
  const meetings: Meeting[] = [];
  const lines = text.replace(/\r/g, "").split("\n");

  for (const [rowIndex, line] of lines.entries()) {
    if (!line.trim() || /^Course Listing\b/i.test(line.trim())) continue;
    const cells = line.split("\t").map((cell) => cell.trim());
    if (cells.length < 7) continue;

    const sectionCell = cells[3] || cells[0] || "";
    const sectionMatch = sectionCell.match(
      /\b([A-Z]{2,6})_V\s+(\d{3}[A-Z]?)-([A-Z0-9]+)\s+-\s+(.+)$/i,
    );
    if (!sectionMatch) continue;
    const courseCode = adapter.parseCourseCode(`${sectionMatch[1]} ${sectionMatch[2]}`);
    if (!courseCode) continue;

    const nativeSection = sectionMatch[3]!.toUpperCase();
    const courseName = sectionMatch[4]!.trim();
    const componentLabel = cells[4]?.toUpperCase() || "OTHER";
    const nativeComponentType = COMPONENT_BY_LABEL[componentLabel] ?? componentLabel;
    const deliveryMode = cells[5] ?? "";
    const patterns = cells[6] ?? "";
    const patternRegex =
      /(\d{4}-\d{2}-\d{2})\s+-\s+(\d{4}-\d{2}-\d{2})\s*\|\s*([A-Za-z ]+)\s*\|\s*(\d{1,2}:\d{2}\s*[ap]\.?(?:m)\.?)\s+-\s+(\d{1,2}:\d{2}\s*[ap]\.?(?:m)\.?)\s*(?:\|\s*([^;]+))?(?:;|$)/gi;
    let pattern: RegExpExecArray | null;
    let parsedPatterns = 0;

    while ((pattern = patternRegex.exec(patterns)) !== null) {
      const startTime = time24(pattern[4]!);
      const endTime = time24(pattern[5]!);
      const days = pattern[3]!
        .split(/\s+/)
        .map((day) => DAY_BY_LABEL[day.toUpperCase()])
        .filter((day): day is Day => Boolean(day));
      if (!startTime || !endTime || !days.length || endTime <= startTime) {
        warnings.push(`Skipped an invalid meeting pattern for ${courseCode}.`);
        continue;
      }

      const rawLocation = pattern[6]?.trim() ?? "";
      let kind: LocationKind = "physical";
      if (!rawLocation || /online|remote|virtual|to be announced|tba/i.test(rawLocation)) {
        kind = /online|remote|virtual/i.test(rawLocation) ? "online" : "tba";
      } else if (!/in person/i.test(deliveryMode)) {
        kind = "online";
      }
      const location = resolveLocation(workdayLocation(rawLocation), kind, campus);
      if (kind === "physical" && !location.buildingId) {
        warnings.push(`Could not match ${rawLocation} to a UBC Vancouver building.`);
      }

      meetings.push({
        id: `ubc-workday-${rowIndex + 1}-${parsedPatterns + 1}`,
        institutionId: "ubc",
        courseCode,
        nativeSection,
        nativeComponentType,
        courseName,
        termLabel: termLabel(pattern[1]!),
        days,
        startTime,
        endTime,
        startDate: pattern[1]!,
        endDate: pattern[2]!,
        location,
        source: { kind: "student-entry", recordedAt: new Date().toISOString() },
      });
      parsedPatterns += 1;
    }

    if (!parsedPatterns) warnings.push(`No meeting pattern was found for ${courseCode}.`);
  }

  if (!meetings.length) {
    throw new Error(
      "No UBC Workday meetings were found. Copy rows from View My Courses → My Enrolled Courses, including the Meeting Patterns column.",
    );
  }
  return { meetings, warnings };
}
