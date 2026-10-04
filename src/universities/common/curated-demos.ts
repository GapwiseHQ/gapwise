import type { ActivityType, Meeting, Weekday } from "@/lib/timetable-types";

/**
 * Browser-safe sample timetables for campus editions without a dedicated adapter demo.
 *
 * Every building code below is the canonical `nativeCodes[0]` of a real building in
 * `src/data/campuses/<campusId>/campus.json` (enforced by tests/curated-demos.test.ts).
 * A `buildingCode: null` entry means the real teaching building is not yet in Gapwise
 * map data; the meeting keeps its source text and is marked location-unknown instead
 * of being pinned to an unrelated building.
 *
 * This module must stay free of server-only imports (node:fs, node:url, ...) because
 * it is loaded by the "Try the demo" button in the browser.
 */

type Day = "MO" | "TU" | "WE" | "TH" | "FR";

type CuratedCourse = {
  courseCode: string;
  courseName: string;
  activityType?: ActivityType;
  section?: string;
  days: Day[];
  start: string;
  end: string;
  buildingCode: string | null;
  room: string;
  /** Required when buildingCode is null: the location text a student would see. */
  sourceLocation?: string;
};

type CuratedCampusDemo = {
  universityId: string;
  courses: CuratedCourse[];
};

const WEEKDAY: Record<Day, Weekday> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
};

export const CURATED_CAMPUS_DEMOS: Record<string, CuratedCampusDemo> = {
  "cmu-pittsburgh": {
    universityId: "cmu",
    courses: [
      {
        courseCode: "15-122",
        courseName: "Principles of Imperative Computation",
        days: ["MO", "WE"],
        start: "10:00",
        end: "11:20",
        buildingCode: "GHC",
        room: "4401",
      },
      {
        courseCode: "21-127",
        courseName: "Concepts of Mathematics",
        days: ["MO", "WE"],
        start: "11:30",
        end: "12:20",
        buildingCode: "WH",
        room: "7500",
      },
      {
        courseCode: "76-101",
        courseName: "Interpretation and Argument",
        activityType: "SEM",
        days: ["TU", "TH"],
        start: "13:00",
        end: "14:20",
        buildingCode: "BH",
        room: "235A",
      },
      {
        courseCode: "15-122",
        courseName: "Principles of Imperative Computation",
        activityType: "LAB",
        section: "A",
        days: ["FR"],
        start: "10:00",
        end: "11:20",
        buildingCode: "GHC",
        room: "5205",
      },
      {
        courseCode: "33-141",
        courseName: "Physics I for Engineering Students",
        days: ["FR"],
        start: "11:30",
        end: "12:20",
        buildingCode: "DH",
        room: "2210",
      },
    ],
  },
  "ucberkeley-main": {
    universityId: "ucberkeley",
    courses: [
      {
        courseCode: "COMPSCI 61A",
        courseName: "Structure and Interpretation of Computer Programs",
        days: ["MO", "WE"],
        start: "13:00",
        end: "14:00",
        buildingCode: "WHEE",
        room: "150",
      },
      {
        courseCode: "CHEM 1A",
        courseName: "General Chemistry",
        days: ["MO", "WE"],
        start: "14:10",
        end: "15:00",
        buildingCode: "PH",
        room: "1",
      },
      {
        courseCode: "COMPSCI 61A",
        courseName: "Structure and Interpretation of Computer Programs",
        activityType: "TUT",
        section: "101",
        days: ["TU", "TH"],
        start: "11:00",
        end: "12:00",
        buildingCode: "SODA",
        room: "310",
      },
    ],
  },
  "nyu-washington-square": {
    universityId: "nyu",
    courses: [
      {
        courseCode: "CSCI-UA 101",
        courseName: "Introduction to Computer Science",
        days: ["MO", "WE"],
        start: "09:30",
        end: "10:45",
        buildingCode: "WWH",
        room: "109",
      },
      {
        courseCode: "MATH-UA 121",
        courseName: "Calculus I",
        days: ["MO", "WE"],
        start: "11:00",
        end: "12:15",
        buildingCode: "SCAS",
        room: "208",
      },
      {
        courseCode: "PHYS-UA 11",
        courseName: "General Physics I",
        days: ["TU", "TH"],
        start: "12:30",
        end: "13:45",
        buildingCode: "ABMHP",
        room: "121",
      },
    ],
  },
  "mit-cambridge": {
    universityId: "mit",
    courses: [
      {
        courseCode: "6.100A",
        courseName: "Introduction to Computer Science Programming in Python",
        days: ["MO", "WE"],
        start: "13:00",
        end: "14:00",
        buildingCode: "26",
        room: "100",
      },
      {
        courseCode: "18.01",
        courseName: "Calculus I",
        days: ["MO", "WE"],
        start: "14:00",
        end: "15:00",
        buildingCode: "2",
        room: "190",
      },
      {
        courseCode: "8.01",
        courseName: "Physics I",
        days: ["TU", "TH"],
        start: "10:00",
        end: "11:30",
        buildingCode: "32",
        room: "082",
      },
    ],
  },
  "stanford-main": {
    universityId: "stanford",
    courses: [
      {
        courseCode: "CS 106A",
        courseName: "Programming Methodology",
        days: ["MO", "WE"],
        start: "11:30",
        end: "12:20",
        buildingCode: "HTC",
        room: "200",
      },
      {
        courseCode: "MATH 51",
        courseName: "Linear Algebra, Multivariable Calculus, and Modern Applications",
        days: ["MO", "WE"],
        start: "13:30",
        end: "14:20",
        buildingCode: "GCS",
        room: "B01",
      },
      {
        courseCode: "CS 106A",
        courseName: "Programming Methodology",
        activityType: "TUT",
        section: "01",
        days: ["TU", "TH"],
        start: "15:00",
        end: "15:50",
        buildingCode: "GCS",
        room: "B03",
      },
    ],
  },
  "upenn-philadelphia": {
    universityId: "upenn",
    courses: [
      {
        courseCode: "CIS 1200",
        courseName: "Programming Languages and Techniques I",
        days: ["MO", "WE"],
        start: "10:15",
        end: "11:45",
        buildingCode: "TB",
        room: "100",
      },
      {
        courseCode: "MATH 1400",
        courseName: "Calculus I",
        days: ["MO", "WE"],
        start: "12:00",
        end: "13:29",
        buildingCode: "DRL",
        room: "A1",
      },
      {
        courseCode: "WRIT 0020",
        courseName: "Critical Writing Seminar",
        activityType: "SEM",
        days: ["TU", "TH"],
        start: "13:45",
        end: "15:14",
        buildingCode: "WH",
        room: "216",
      },
    ],
  },
  "cornell-ithaca": {
    universityId: "cornell",
    courses: [
      {
        courseCode: "CS 1110",
        courseName: "Introduction to Computing: A Design and Development Perspective",
        days: ["TU", "TH"],
        start: "09:05",
        end: "09:55",
        buildingCode: "STAT",
        room: "185",
      },
      {
        courseCode: "MATH 1910",
        courseName: "Calculus for Engineers",
        days: ["TU", "TH"],
        start: "10:10",
        end: "11:00",
        buildingCode: "UH",
        room: "G01",
      },
      {
        courseCode: "ENGL 1105",
        courseName: "FWS: Writing and Literature",
        activityType: "SEM",
        days: ["MO", "WE"],
        start: "12:20",
        end: "13:10",
        buildingCode: "GSH",
        room: "142",
      },
    ],
  },
  "dartmouth-hanover": {
    universityId: "dartmouth",
    courses: [
      {
        courseCode: "COSC 1",
        courseName: "Introduction to Programming and Computation",
        days: ["MO", "WE"],
        start: "10:10",
        end: "11:15",
        buildingCode: "SUDI",
        room: "045",
      },
      {
        courseCode: "MATH 8",
        courseName: "Calculus of Functions of One and Several Variables",
        days: ["MO", "WE"],
        start: "11:30",
        end: "12:35",
        buildingCode: "KH",
        room: "008",
      },
      {
        courseCode: "WRIT 5",
        courseName: "Expository Writing",
        activityType: "SEM",
        days: ["TU", "TH"],
        start: "14:25",
        end: "16:15",
        buildingCode: "DH",
        room: "105",
      },
    ],
  },
  "brown-providence": {
    universityId: "brown",
    courses: [
      {
        courseCode: "CSCI 0111",
        courseName: "Computing Foundations: Data",
        days: ["MO", "WE"],
        start: "10:00",
        end: "10:50",
        buildingCode: "SCT",
        room: "101",
      },
      {
        courseCode: "PHYS 0050",
        courseName: "Foundations of Mechanics",
        days: ["MO", "WE"],
        start: "11:00",
        end: "11:50",
        buildingCode: "BAR",
        room: "166",
      },
      {
        courseCode: "CSCI 0111",
        courseName: "Computing Foundations: Data",
        activityType: "LAB",
        section: "L01",
        days: ["TU", "TH"],
        start: "13:00",
        end: "14:20",
        buildingCode: "BAR",
        room: "190",
      },
    ],
  },
  "columbia-morningside": {
    universityId: "columbia",
    courses: [
      {
        courseCode: "COMS W1004",
        courseName: "Introduction to Computer Science and Programming in Java",
        days: ["MO", "WE"],
        start: "10:10",
        end: "11:25",
        buildingCode: "MUDD",
        room: "833",
      },
      {
        courseCode: "MATH UN1101",
        courseName: "Calculus I",
        days: ["MO", "WE"],
        start: "11:40",
        end: "12:55",
        buildingCode: "MATH",
        room: "203",
      },
      {
        courseCode: "CHEM UN1403",
        courseName: "General Chemistry I (Lecture)",
        days: ["TU", "TH"],
        start: "13:10",
        end: "14:25",
        buildingCode: "HAVE",
        room: "309",
      },
    ],
  },
  "princeton-main": {
    universityId: "princeton",
    courses: [
      {
        courseCode: "COS 126",
        courseName: "Computer Science: An Interdisciplinary Approach",
        days: ["TU", "TH"],
        start: "11:00",
        end: "12:20",
        buildingCode: "MH",
        room: "50",
      },
      {
        courseCode: "MAT 201",
        courseName: "Multivariable Calculus",
        days: ["TU", "TH"],
        start: "13:30",
        end: "14:50",
        buildingCode: "FINE",
        room: "214",
      },
      {
        courseCode: "COS 126",
        courseName: "Computer Science: An Interdisciplinary Approach",
        activityType: "SEM",
        section: "P01",
        days: ["MO", "WE"],
        start: "10:00",
        end: "10:50",
        buildingCode: "FC",
        room: "007",
      },
      {
        courseCode: "CHM 201",
        courseName: "General Chemistry I",
        days: ["MO", "WE"],
        start: "11:00",
        end: "11:50",
        buildingCode: "FCL",
        room: "124",
      },
    ],
  },
  "yale-new-haven": {
    universityId: "yale",
    courses: [
      {
        courseCode: "CPSC 201",
        courseName: "Introduction to Computer Science",
        days: ["MO", "WE"],
        start: "11:35",
        end: "12:50",
        buildingCode: "DL",
        room: "220",
      },
      {
        courseCode: "MATH 120",
        courseName: "Calculus of Functions of Several Variables",
        days: ["MO", "WE"],
        start: "13:00",
        end: "14:15",
        buildingCode: "LCH",
        room: "102",
      },
      {
        courseCode: "ENGL 114",
        courseName: "Writing Seminars",
        activityType: "SEM",
        days: ["TU", "TH"],
        start: "09:00",
        end: "10:15",
        buildingCode: "WLHH",
        room: "203",
      },
    ],
  },
  "harvard-cambridge": {
    universityId: "harvard",
    courses: [
      {
        courseCode: "COMPSCI 50",
        courseName: "Introduction to Computer Science",
        days: ["MO", "WE"],
        start: "10:30",
        end: "11:45",
        buildingCode: "MH",
        room: "Sanders Theatre",
      },
      {
        courseCode: "MATH 21A",
        courseName: "Multivariable Calculus",
        days: ["MO", "WE"],
        start: "12:00",
        end: "13:15",
        buildingCode: "SH",
        room: "113",
      },
      {
        courseCode: "EXPOS 20",
        courseName: "Expository Writing 20",
        activityType: "SEM",
        days: ["TU", "TH"],
        start: "09:00",
        end: "10:15",
        buildingCode: "BH",
        room: "105",
      },
    ],
  },
  "ubc-okanagan": {
    universityId: "ubc",
    courses: [
      {
        courseCode: "COSC 111",
        courseName: "Computer Programming I",
        days: ["MO", "WE"],
        start: "09:30",
        end: "11:00",
        buildingCode: "EME",
        room: "1101",
      },
      {
        courseCode: "MATH 100",
        courseName: "Differential Calculus with Applications to Physical Sciences and Engineering",
        days: ["MO", "WE"],
        start: "11:00",
        end: "12:30",
        buildingCode: "ASC",
        room: "130",
      },
      {
        courseCode: "ENGL 112",
        courseName: "Strategies for University Writing",
        activityType: "SEM",
        days: ["TU", "TH"],
        start: "14:00",
        end: "15:30",
        buildingCode: "CCS",
        room: "1012",
      },
    ],
  },
  glendon: {
    universityId: "york",
    courses: [
      {
        courseCode: "GL/ECON 1000",
        courseName: "Introduction to Microeconomics",
        days: ["MO", "WE"],
        start: "10:00",
        end: "11:30",
        buildingCode: "YH",
        room: "A100",
      },
      {
        courseCode: "GL/FRAN 2240",
        courseName: "Grammaire et rédaction",
        activityType: "SEM",
        days: ["MO", "WE"],
        start: "11:30",
        end: "13:00",
        buildingCode: "FL",
        room: "202",
      },
      {
        courseCode: "GL/POLS 1000",
        courseName: "Introduction to Politics",
        days: ["TU", "TH"],
        start: "13:00",
        end: "14:30",
        buildingCode: "YH",
        room: "B204",
      },
    ],
  },
  markham: {
    universityId: "york",
    // York's Markham Campus teaching building (1 University Blvd) is not yet in the
    // Gapwise Markham map data, so these meetings are honestly location-unknown.
    courses: [
      {
        courseCode: "LE/EECS 1015",
        courseName: "Introduction to Computer Science and Programming",
        days: ["MO", "WE"],
        start: "10:00",
        end: "11:30",
        buildingCode: null,
        room: "1002",
        sourceLocation: "Markham Campus 1002",
      },
      {
        courseCode: "SC/MATH 1013",
        courseName: "Applied Calculus I",
        days: ["MO", "WE"],
        start: "12:00",
        end: "13:30",
        buildingCode: null,
        room: "2003",
        sourceLocation: "Markham Campus 2003",
      },
      {
        courseCode: "AP/WRIT 1003",
        courseName: "Writing: Introduction to Academic Writing",
        activityType: "SEM",
        days: ["TU", "TH"],
        start: "13:00",
        end: "14:30",
        buildingCode: null,
        room: "3004",
        sourceLocation: "Markham Campus 3004",
      },
    ],
  },
};

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour! * 60 + minute!;
}

export function hasCuratedDemo(campusId: string) {
  return campusId.toLowerCase() in CURATED_CAMPUS_DEMOS;
}

/** Expand a curated campus demo into weekly meetings tagged with the canonical campus ID. */
export function curatedDemoMeetings(campusId: string): Meeting[] | null {
  const normalized = campusId.toLowerCase();
  const demo = CURATED_CAMPUS_DEMOS[normalized];
  if (!demo) return null;
  const campus = normalized.toUpperCase();
  return demo.courses.flatMap((course, index) => {
    const activityType = course.activityType ?? "LEC";
    const section = course.section ?? "001";
    const codeId = course.courseCode.toLowerCase().replace(/[^a-z0-9]/g, "");
    const mapped = course.buildingCode !== null;
    return course.days.map((day) => ({
      id: `demo-${normalized}-${codeId}-${activityType.toLowerCase()}-${index + 1}-${day.toLowerCase()}`,
      universityId: demo.universityId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      activityType,
      sectionCode: section,
      nativeSection: section,
      nativeComponentType: activityType,
      startTime: minutes(course.start),
      endTime: minutes(course.end),
      weekday: WEEKDAY[day],
      buildingCode: course.buildingCode,
      room: course.room,
      term: "Fall" as const,
      campus,
      locationType: "physical" as const,
      locationUnknown: !mapped,
      sourceLocation: course.sourceLocation ?? `${course.buildingCode ?? ""} ${course.room}`.trim(),
      ...(mapped ? {} : { notes: "Building not yet in Gapwise map data" }),
      dateRange: { startDate: "2026-09-08", endDate: "2026-12-08" },
      recurrenceIntervalWeeks: 1,
    }));
  });
}
