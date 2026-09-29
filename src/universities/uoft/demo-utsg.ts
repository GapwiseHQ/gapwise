import type { Meeting, Weekday, ActivityType, Term } from "@/lib/timetable-types";

interface Row {
  courseCode: string;
  courseName: string;
  activityType: ActivityType;
  sectionCode: string;
  weekday: Weekday;
  start: number;
  end: number;
  building: string;
  room: string;
  term: Term;
}

const h = (hour: number, minute = 0) => hour * 60 + minute;

const ROWS: Row[] = [
  // Fall Term
  {
    courseCode: "CSC108H1",
    courseName: "Introduction to Computer Programming",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Monday",
    start: h(10),
    end: h(11),
    building: "BA",
    room: "1160",
    term: "Fall",
  },
  {
    courseCode: "MAT137Y1",
    courseName: "Calculus with Proofs",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Monday",
    start: h(11),
    end: h(12),
    building: "SS",
    room: "2102",
    term: "Fall",
  },
  {
    courseCode: "ECO101H1",
    courseName: "Principles of Microeconomics",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Tuesday",
    start: h(9),
    end: h(11),
    building: "MS",
    room: "2158",
    term: "Fall",
  },
  {
    courseCode: "CSC108H1",
    courseName: "Introduction to Computer Programming",
    activityType: "PRA",
    sectionCode: "0101",
    weekday: "Wednesday",
    start: h(14),
    end: h(16),
    building: "BA",
    room: "2270",
    term: "Fall",
  },
  {
    courseCode: "MAT137Y1",
    courseName: "Calculus with Proofs",
    activityType: "TUT",
    sectionCode: "0101",
    weekday: "Thursday",
    start: h(13),
    end: h(14),
    building: "SS",
    room: "1073",
    term: "Fall",
  },
  {
    courseCode: "SOC100H1",
    courseName: "Introduction to Sociology",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Thursday",
    start: h(15),
    end: h(17),
    building: "CH",
    room: "101",
    term: "Fall",
  },
  // Winter Term
  {
    courseCode: "CSC148H1",
    courseName: "Introduction to Computer Science",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Monday",
    start: h(10),
    end: h(11),
    building: "BA",
    room: "1160",
    term: "Winter",
  },
  {
    courseCode: "MAT137Y1",
    courseName: "Calculus with Proofs",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Monday",
    start: h(11),
    end: h(12),
    building: "SS",
    room: "2102",
    term: "Winter",
  },
  {
    courseCode: "ECO102H1",
    courseName: "Principles of Macroeconomics",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Tuesday",
    start: h(10),
    end: h(12),
    building: "MS",
    room: "2158",
    term: "Winter",
  },
  {
    courseCode: "CSC148H1",
    courseName: "Introduction to Computer Science",
    activityType: "PRA",
    sectionCode: "0101",
    weekday: "Wednesday",
    start: h(13),
    end: h(15),
    building: "BA",
    room: "2270",
    term: "Winter",
  },
  {
    courseCode: "MAT137Y1",
    courseName: "Calculus with Proofs",
    activityType: "TUT",
    sectionCode: "0101",
    weekday: "Thursday",
    start: h(13),
    end: h(14),
    building: "SS",
    room: "1073",
    term: "Winter",
  },
];

export const DEMO_UTSG_MEETINGS: Meeting[] = ROWS.map((r) => ({
  id: `utsg-${r.term}-${r.courseCode}-${r.activityType}-${r.sectionCode}-${r.weekday}-${r.start}`,
  courseCode: r.courseCode,
  activityType: r.activityType,
  sectionCode: r.sectionCode,
  courseName: r.courseName,
  startTime: r.start,
  endTime: r.end,
  weekday: r.weekday,
  buildingCode: r.building,
  room: r.room,
  term: r.term,
  locationUnknown: false,
  locationType: "physical" as const,
  campus: "UTSG" as const,
}));
