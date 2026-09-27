import type {
  CampusSnapshot,
  Day,
  InstitutionAdapter,
  LocationKind,
  Meeting,
} from "../common/model";
import { resolveLocation } from "../common/meetings";

const BANNER_DAY_MAP: Record<string, Day> = {
  M: "MO",
  L: "MO",
  T: "TU",
  MA: "TU",
  W: "WE",
  ME: "WE",
  R: "TH",
  J: "TH",
  TH: "TH",
  JE: "TH",
  F: "FR",
  V: "FR",
  S: "SA",
  U: "SU",
  D: "SU",
};

const WORD_DAY_MAP: Record<string, Day> = {
  MONDAY: "MO",
  MON: "MO",
  LUNDI: "MO",
  LUN: "MO",
  TUESDAY: "TU",
  TUE: "TU",
  MARDI: "TU",
  MAR: "TU",
  WEDNESDAY: "WE",
  WED: "WE",
  MERCREDI: "WE",
  MER: "WE",
  THURSDAY: "TH",
  THU: "TH",
  JEUDI: "TH",
  JEU: "TH",
  FRIDAY: "FR",
  FRI: "FR",
  VENDREDI: "FR",
  VEN: "FR",
  SATURDAY: "SA",
  SAT: "SA",
  SAMEDI: "SA",
  SAM: "SA",
  SUNDAY: "SU",
  SUN: "SU",
  DIMANCHE: "SU",
  DIM: "SU",
};

const IGNORED_WORDS = new Set([
  "FALL",
  "WINTER",
  "AUTOMNE",
  "HIVER",
  "TERM",
  "YEAR",
  "DATE",
  "WEEK",
  "DAYS",
  "TIME",
  "TYPE",
  "COURSE",
  "COURS",
  "SECTION",
  "SEC",
  "LOCATION",
  "SALLE",
  "LOCAL",
  "ROOM",
  "INSTRUCTOR",
  "PROFESSEUR",
  "ENSEIGNANT",
  "LEC",
  "TUT",
  "LAB",
  "PRA",
  "SEM",
  "DGD",
]);

const VALID_BANNER_TOKENS = new Set([
  "MWF",
  "TR",
  "MW",
  "WF",
  "MF",
  "MTRF",
  "MTWR",
  "MTWRF",
  "M",
  "T",
  "W",
  "R",
  "F",
  "S",
  "U",
  "TH",
  "L",
  "MA",
  "ME",
  "J",
  "JE",
  "V",
  "D",
]);

interface ParsedBlock {
  courseCode: string;
  courseName?: string;
  section: string;
  component: string;
  days: Day[];
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
  locationText: string;
  termLabel?: string;
}

function parseDays(raw: string): Day[] {
  const result: Day[] = [];
  const wordRegex =
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche|Lun|Mar|Mer|Jeu|Ven|Sam|Dim)\b/gi;
  let wordMatch: RegExpExecArray | null;
  while ((wordMatch = wordRegex.exec(raw)) !== null) {
    const day = WORD_DAY_MAP[wordMatch[1]!.toUpperCase()];
    if (day && !result.includes(day)) result.push(day);
  }
  if (result.length > 0) return result;

  const tokenRegex = /\b([MTWRFSU]{1,5}|[LMAJEVDS]{1,5})\b/gi;
  let tokenMatch: RegExpExecArray | null;
  while ((tokenMatch = tokenRegex.exec(raw)) !== null) {
    const token = tokenMatch[1]!.toUpperCase();
    if (VALID_BANNER_TOKENS.has(token)) {
      if (token === "TH" || token === "MA" || token === "ME" || token === "JE") {
        const d = BANNER_DAY_MAP[token];
        if (d && !result.includes(d)) result.push(d);
      } else {
        for (const char of token) {
          const d = BANNER_DAY_MAP[char];
          if (d && !result.includes(d)) result.push(d);
        }
      }
    }
  }
  return result;
}

function to24Hour(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = m[3]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

export function parseUOttawaText(
  text: string,
  campus: CampusSnapshot,
  adapter: InstitutionAdapter,
): { meetings: Meeting[]; warnings: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const blocks: ParsedBlock[] = [];
  const warnings: string[] = [];

  let currentCode: string | null = null;
  let currentName: string | null = null;
  let currentSection = "A";
  let currentComponent = "LEC";
  let currentTerm = "Fall 2026";

  const timeRangeRegex =
    /(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*(?:-|–|—|to|à)\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i;
  const courseCodeRegex = /\b([A-Z]{3,4})\s*(\d{4})\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (/(?:Fall|Automne)\s*\d{4}/i.test(line)) {
      currentTerm = line.match(/(?:Fall|Automne)\s*\d{4}/i)![0];
      continue;
    }
    if (/(?:Winter|Hiver)\s*\d{4}/i.test(line)) {
      currentTerm = line.match(/(?:Winter|Hiver)\s*\d{4}/i)![0];
      continue;
    }

    const codeMatch = line.match(courseCodeRegex);
    if (codeMatch && !IGNORED_WORDS.has(codeMatch[1]!.toUpperCase())) {
      const rawCode = `${codeMatch[1]} ${codeMatch[2]}`;
      const parsed = adapter.parseCourseCode(rawCode);
      if (parsed) {
        currentCode = parsed;
        const remainder = line
          .slice(codeMatch.index! + codeMatch[0].length)
          .replace(/^[\s-–—:]+/, "")
          .trim();
        if (remainder && !timeRangeRegex.test(remainder)) {
          currentName = remainder;
        }
      }
    }

    const compMatch = line.match(/\b(LEC|TUT|LAB|PRA|SEM|DGD)\s*([A-Z]\d{0,2}|\d{1,2})?\b/i);
    if (compMatch) {
      currentComponent = compMatch[1]!.toUpperCase();
      if (compMatch[2]) currentSection = compMatch[2];
    }

    const timeMatch = line.match(timeRangeRegex);
    if (timeMatch && currentCode) {
      const start24 = to24Hour(timeMatch[1]!);
      const end24 = to24Hour(timeMatch[2]!);
      if (start24 && end24) {
        const beforeTime = line.slice(0, timeMatch.index!).trim();
        const afterTime = line.slice(timeMatch.index! + timeMatch[0].length).trim();
        let days = parseDays(beforeTime);
        if (days.length === 0) days = parseDays(afterTime);
        if (days.length === 0) days = ["MO", "WE"];

        let locText = afterTime.replace(/^[,\s-]+/, "").trim();
        if (!locText && i + 1 < lines.length) {
          const nextLine = lines[i + 1]!;
          if (resolveLocation(nextLine, "physical", campus).buildingId) {
            locText = nextLine.trim();
          } else if (!nextLine.match(timeRangeRegex) && !nextLine.match(courseCodeRegex)) {
            locText = nextLine.trim();
          }
        }
        if (!locText) locText = "TBA";

        blocks.push({
          courseCode: currentCode,
          courseName: currentName ?? currentCode,
          section: currentSection,
          component: currentComponent,
          days,
          startTime: start24,
          endTime: end24,
          locationText: locText,
          termLabel: currentTerm,
        });
      }
    }
  }

  const meetings: Meeting[] = [];
  for (const b of blocks) {
    let locKind: LocationKind = "physical";
    if (/tba|online|virtuel|remote/i.test(b.locationText)) {
      locKind = /online|virtuel/i.test(b.locationText) ? "online" : "tba";
    }
    const resolved = resolveLocation(b.locationText, locKind, campus);
    let location = resolved;
    if (location.kind === "physical" && location.buildingId && location.room) {
      const roomMatch = location.room.match(/^([A-Z0-9-]+)/i);
      if (roomMatch) {
        location = { ...location, room: roomMatch[1]! };
      }
    }

    const isWinter = b.termLabel?.startsWith("Winter") || b.termLabel?.startsWith("Hiver");
    const startDate = isWinter ? "2027-01-06" : "2026-09-08";
    const endDate = isWinter ? "2027-04-09" : "2026-12-08";

    meetings.push({
      id: `txt-${Math.random().toString(36).slice(2)}`,
      institutionId: adapter.id,
      courseCode: b.courseCode,
      nativeSection: b.section,
      nativeComponentType: b.component,
      courseName: b.courseName || b.courseCode,
      termLabel: b.termLabel ?? "Fall 2026",
      days: b.days,
      startTime: b.startTime,
      endTime: b.endTime,
      startDate,
      endDate,
      location,
      source: { kind: "student-entry", recordedAt: new Date().toISOString() },
    });
  }

  return { meetings, warnings };
}
