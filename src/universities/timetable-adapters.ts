import type { Meeting, ParsedTimetable } from "@/lib/timetable-types";

function calendarAdapter(config: {
  universityId: string;
  universityName: string;
  defaultCampusId: string;
  timeZone: string;
}) {
  return async (text: string) => {
    const { parseStandardCalendar } = await import("./common/calendar-adapter");
    return parseStandardCalendar(text, config);
  };
}

const northAmericanCalendarAdapters = {
  "cmu-calendar": calendarAdapter({
    universityId: "cmu",
    universityName: "Carnegie Mellon University",
    defaultCampusId: "cmu-pittsburgh",
    timeZone: "America/New_York",
  }),
  "ucberkeley-calendar": calendarAdapter({
    universityId: "ucberkeley",
    universityName: "UC Berkeley",
    defaultCampusId: "ucberkeley-main",
    timeZone: "America/Los_Angeles",
  }),
  "nyu-calendar": calendarAdapter({
    universityId: "nyu",
    universityName: "New York University",
    defaultCampusId: "nyu-washington-square",
    timeZone: "America/New_York",
  }),
  "mit-calendar": calendarAdapter({
    universityId: "mit",
    universityName: "MIT",
    defaultCampusId: "mit-cambridge",
    timeZone: "America/New_York",
  }),
  "stanford-calendar": calendarAdapter({
    universityId: "stanford",
    universityName: "Stanford University",
    defaultCampusId: "stanford-main",
    timeZone: "America/Los_Angeles",
  }),
  "upenn-calendar": calendarAdapter({
    universityId: "upenn",
    universityName: "the University of Pennsylvania",
    defaultCampusId: "upenn-philadelphia",
    timeZone: "America/New_York",
  }),
  "cornell-calendar": calendarAdapter({
    universityId: "cornell",
    universityName: "Cornell University",
    defaultCampusId: "cornell-ithaca",
    timeZone: "America/New_York",
  }),
  "dartmouth-calendar": calendarAdapter({
    universityId: "dartmouth",
    universityName: "Dartmouth College",
    defaultCampusId: "dartmouth-hanover",
    timeZone: "America/New_York",
  }),
  "brown-calendar": calendarAdapter({
    universityId: "brown",
    universityName: "Brown University",
    defaultCampusId: "brown-providence",
    timeZone: "America/New_York",
  }),
  "columbia-calendar": calendarAdapter({
    universityId: "columbia",
    universityName: "Columbia University",
    defaultCampusId: "columbia-morningside",
    timeZone: "America/New_York",
  }),
  "princeton-calendar": calendarAdapter({
    universityId: "princeton",
    universityName: "Princeton University",
    defaultCampusId: "princeton-main",
    timeZone: "America/New_York",
  }),
  "yale-calendar": calendarAdapter({
    universityId: "yale",
    universityName: "Yale University",
    defaultCampusId: "yale-new-haven",
    timeZone: "America/New_York",
  }),
  "harvard-calendar": calendarAdapter({
    universityId: "harvard",
    universityName: "Harvard University",
    defaultCampusId: "harvard-cambridge",
    timeZone: "America/New_York",
  }),
} satisfies Record<string, (text: string) => Promise<ParsedTimetable>>;

/** University integration registry. Shared product surfaces consume ParsedTimetable only. */
export const timetableAdapters: Record<string, (text: string) => Promise<ParsedTimetable>> = {
  ...northAmericanCalendarAdapters,
  "acorn-ics": async (text) => {
    const { parseIcs } = await import("@/lib/ics-parser");
    const { enrichCourseTitles } = await import("@/lib/course-title-catalog");
    const parsed = parseIcs(text);
    return { ...parsed, meetings: await enrichCourseTitles(parsed.meetings) };
  },
  "carleton-ics": async (text) => {
    const { parseCarletonTimetable } = await import("./carleton/adapter");
    return parseCarletonTimetable(text);
  },
  "tmu-schedule": async (text) => {
    const { parseTimetable } = await import("./tmu/adapter");
    return parseTimetable(text);
  },
  "queens-schedule": async (text) => {
    const { parseTimetable } = await import("./queens/adapter");
    return parseTimetable(text);
  },
  "laurier-schedule": async (text) => {
    const { parseTimetable } = await import("./laurier/adapter");
    return parseTimetable(text);
  },
  "york-schedule": async (text) => {
    const { parseTimetable } = await import("./york/adapter");
    return parseTimetable(text);
  },
  "mcmaster-schedule": async (text) => {
    const { parseTimetable } = await import("./mcmaster/adapter");
    return parseTimetable(text);
  },
  "western-schedule": async (text) => {
    const { parseTimetable } = await import("./western/adapter");
    return parseTimetable(text);
  },
  "guelph-schedule": async (text) => {
    const { parseTimetable } = await import("./guelph/adapter");
    return parseTimetable(text);
  },
  "uottawa-schedule": async (text) => {
    const { parseTimetable } = await import("./uottawa/adapter");
    return parseTimetable(text);
  },
  "brock-schedule": async (text) => {
    const { parseTimetable } = await import("./brock/adapter");
    return parseTimetable(text);
  },
  "ubc-workday": async (text) => {
    const { parseUbcTimetable } = await import("./ubc/adapter");
    return parseUbcTimetable(text);
  },
  "waterloo-quest": async (text) => {
    const { parseWaterlooTimetable } = await import("./waterloo/adapter");
    return parseWaterlooTimetable(text);
  },
  "mcgill-my-courses-ics": async (text) => {
    const { parseMcGillIcs } = await import("./mcgill/adapter");
    return parseMcGillIcs(text);
  },
  // GAPWISE_ADAPTER_REGISTRY: the CLI inserts new timetable adapters here.
};

const calendarDemoDetails: Record<
  keyof typeof northAmericanCalendarAdapters,
  { universityId: string; campus: string; courses: [string, string] }
> = {
  "cmu-calendar": { universityId: "cmu", campus: "CMU-PITTSBURGH", courses: ["15-122", "21-127"] },
  "ucberkeley-calendar": {
    universityId: "ucberkeley",
    campus: "UCBERKELEY-MAIN",
    courses: ["COMPSCI 61A", "MATH 1A"],
  },
  "nyu-calendar": {
    universityId: "nyu",
    campus: "NYU-WASHINGTON-SQUARE",
    courses: ["CSCI-UA 101", "MATH-UA 121"],
  },
  "mit-calendar": { universityId: "mit", campus: "MIT-CAMBRIDGE", courses: ["6.100A", "18.01"] },
  "stanford-calendar": {
    universityId: "stanford",
    campus: "STANFORD-MAIN",
    courses: ["CS 106A", "MATH 51"],
  },
  "upenn-calendar": {
    universityId: "upenn",
    campus: "UPENN-PHILADELPHIA",
    courses: ["CIS 1200", "MATH 1400"],
  },
  "cornell-calendar": {
    universityId: "cornell",
    campus: "CORNELL-ITHACA",
    courses: ["CS 1110", "MATH 1110"],
  },
  "dartmouth-calendar": {
    universityId: "dartmouth",
    campus: "DARTMOUTH-HANOVER",
    courses: ["COSC 1", "MATH 8"],
  },
  "brown-calendar": {
    universityId: "brown",
    campus: "BROWN-PROVIDENCE",
    courses: ["CSCI 0111", "MATH 0100"],
  },
  "columbia-calendar": {
    universityId: "columbia",
    campus: "COLUMBIA-MORNINGSIDE",
    courses: ["COMS W1004", "MATH UN1101"],
  },
  "princeton-calendar": {
    universityId: "princeton",
    campus: "PRINCETON-MAIN",
    courses: ["COS 126", "MAT 201"],
  },
  "yale-calendar": {
    universityId: "yale",
    campus: "YALE-NEW-HAVEN",
    courses: ["CPSC 201", "MATH 120"],
  },
  "harvard-calendar": {
    universityId: "harvard",
    campus: "HARVARD-CAMBRIDGE",
    courses: ["CS 50", "MATH 21A"],
  },
};

function calendarDemo(adapterId: keyof typeof calendarDemoDetails): Meeting[] {
  const detail = calendarDemoDetails[adapterId];
  return detail.courses.map((courseCode, index) => ({
    id: `${detail.universityId}-demo-${index + 1}`,
    universityId: detail.universityId,
    courseCode,
    activityType: "LEC",
    sectionCode: "001",
    courseName: courseCode,
    startTime: 9 * 60 + index * 150,
    endTime: 10 * 60 + index * 150,
    weekday: "Monday",
    buildingCode: null,
    room: null,
    term: "Fall",
    campus: detail.campus,
    locationUnknown: true,
    locationType: "tba",
    dateRange: { startDate: "2026-09-07", endDate: "2026-12-07" },
    recurrenceIntervalWeeks: 1,
  }));
}

export const demoTimetableLoaders: Record<string, (campusId?: string) => Promise<Meeting[]>> = {
  ...Object.fromEntries(
    Object.keys(calendarDemoDetails).map((adapterId) => [
      adapterId,
      async () => calendarDemo(adapterId as keyof typeof calendarDemoDetails),
    ]),
  ),
  "acorn-ics": async (campusId?: string) => {
    const campus = campusId?.toLowerCase();
    if (campus === "utsg") {
      return (await import("./uoft/demo-utsg")).DEMO_UTSG_MEETINGS;
    }
    if (campus === "utsc") {
      return (await import("./uoft/demo-utsc")).DEMO_UTSC_MEETINGS;
    }
    return (await import("@/lib/demo-timetable")).DEMO_MEETINGS;
  },
  "carleton-ics": async () => {
    const [{ DEMO_CARLETON_MEETINGS }, { normalizeCarletonMeeting }] = await Promise.all([
      import("./carleton/demo-timetable"),
      import("./carleton/adapter"),
    ]);
    return DEMO_CARLETON_MEETINGS.flatMap(normalizeCarletonMeeting);
  },
  "tmu-schedule": async () => {
    const [{ DEMO_TMU_MEETINGS }, { normalizeTmuMeeting }] = await Promise.all([
      import("./tmu/demo-timetable"),
      import("./tmu/adapter"),
    ]);
    return DEMO_TMU_MEETINGS.flatMap(normalizeTmuMeeting);
  },
  "queens-schedule": async () => {
    const [{ DEMO_QUEENS_MEETINGS }, { normalizeQueensMeeting }] = await Promise.all([
      import("./queens/demo-timetable"),
      import("./queens/adapter"),
    ]);
    return DEMO_QUEENS_MEETINGS.flatMap(normalizeQueensMeeting);
  },
  "laurier-schedule": async () => {
    const [{ DEMO_LAURIER_MEETINGS }, { normalizeLaurierMeeting }] = await Promise.all([
      import("./laurier/demo-timetable"),
      import("./laurier/adapter"),
    ]);
    return DEMO_LAURIER_MEETINGS.flatMap(normalizeLaurierMeeting);
  },
  "york-schedule": async () => {
    const [{ DEMO_YORK_MEETINGS }, { normalizeYorkMeeting }] = await Promise.all([
      import("./york/demo-timetable"),
      import("./york/adapter"),
    ]);
    return DEMO_YORK_MEETINGS.flatMap(normalizeYorkMeeting);
  },
  "mcmaster-schedule": async () => {
    const [{ DEMO_MCMASTER_MEETINGS }, { normalizeMcMasterMeeting }] = await Promise.all([
      import("./mcmaster/demo-timetable"),
      import("./mcmaster/adapter"),
    ]);
    return DEMO_MCMASTER_MEETINGS.flatMap(normalizeMcMasterMeeting);
  },
  "western-schedule": async () => {
    const [{ DEMO_WESTERN_MEETINGS }, { normalizeWesternMeeting }] = await Promise.all([
      import("./western/demo-timetable"),
      import("./western/adapter"),
    ]);
    return DEMO_WESTERN_MEETINGS.flatMap(normalizeWesternMeeting);
  },
  "guelph-schedule": async () => {
    const [{ DEMO_GUELPH_MEETINGS }, { normalizeGuelphMeeting }] = await Promise.all([
      import("./guelph/demo-timetable"),
      import("./guelph/adapter"),
    ]);
    return DEMO_GUELPH_MEETINGS.flatMap(normalizeGuelphMeeting);
  },
  "uottawa-schedule": async () => {
    const [{ DEMO_UOTTAWA_MEETINGS }, { normalizeUOttawaMeeting }] = await Promise.all([
      import("./uottawa/demo-timetable"),
      import("./uottawa/adapter"),
    ]);
    return DEMO_UOTTAWA_MEETINGS.flatMap(normalizeUOttawaMeeting);
  },
  "brock-schedule": async () => {
    const [{ DEMO_BROCK_MEETINGS }, { normalizeBrockMeeting }] = await Promise.all([
      import("./brock/demo-timetable"),
      import("./brock/adapter"),
    ]);
    return DEMO_BROCK_MEETINGS.flatMap(normalizeBrockMeeting);
  },
  "ubc-workday": async () => {
    const [{ DEMO_UBC_MEETINGS }, { normalizeUbcMeeting }] = await Promise.all([
      import("./ubc/demo-timetable"),
      import("./ubc/adapter"),
    ]);
    return DEMO_UBC_MEETINGS.flatMap(normalizeUbcMeeting);
  },
  "waterloo-quest": async () => {
    const [{ DEMO_WATERLOO_MEETINGS }, { normalizeWaterlooMeeting }] = await Promise.all([
      import("./waterloo/demo-timetable"),
      import("./waterloo/adapter"),
    ]);
    return DEMO_WATERLOO_MEETINGS.flatMap(normalizeWaterlooMeeting);
  },
  "mcgill-my-courses-ics": async () => {
    const [{ DEMO_MCGILL_MEETINGS }, { normalizeMcGillMeeting }] = await Promise.all([
      import("./mcgill/demo-timetable"),
      import("./mcgill/adapter"),
    ]);
    return DEMO_MCGILL_MEETINGS.flatMap(normalizeMcGillMeeting);
  },
  // GAPWISE_DEMO_LOADER_REGISTRY: the CLI inserts new demo loaders here.
};

export async function loadDemoTimetable(
  adapterId?: string,
  campusId?: string | null,
): Promise<Meeting[]> {
  const loader = adapterId ? demoTimetableLoaders[adapterId] : undefined;
  if (loader) return loader(campusId ?? undefined);
  return (await import("@/lib/demo-timetable")).DEMO_MEETINGS;
}
