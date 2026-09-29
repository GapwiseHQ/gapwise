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
    courseCode: "CSCA08H3",
    courseName: "Introduction to Computer Science I",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Monday",
    start: h(9),
    end: h(11),
    building: "SW",
    room: "319",
    term: "Fall",
  },
  {
    courseCode: "MATA31H3",
    courseName: "Calculus I for Mathematical Sciences",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Monday",
    start: h(11),
    end: h(12),
    building: "HW",
    room: "216",
    term: "Fall",
  },
  {
    courseCode: "ECMA04H3",
    courseName: "Introduction to Microeconomics",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Tuesday",
    start: h(10),
    end: h(12),
    building: "HL",
    room: "170",
    term: "Fall",
  },
  {
    courseCode: "CSCA08H3",
    courseName: "Introduction to Computer Science I",
    activityType: "PRA",
    sectionCode: "0101",
    weekday: "Wednesday",
    start: h(13),
    end: h(15),
    building: "IC",
    room: "120",
    term: "Fall",
  },
  {
    courseCode: "MATA31H3",
    courseName: "Calculus I for Mathematical Sciences",
    activityType: "TUT",
    sectionCode: "0101",
    weekday: "Thursday",
    start: h(10),
    end: h(11),
    building: "AC",
    room: "223",
    term: "Fall",
  },
  {
    courseCode: "PSYA01H3",
    courseName: "Introduction to Biological Psychology",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Thursday",
    start: h(14),
    end: h(16),
    building: "SW",
    room: "319",
    term: "Fall",
  },
  // Winter Term
  {
    courseCode: "CSCA48H3",
    courseName: "Introduction to Computer Science II",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Monday",
    start: h(9),
    end: h(11),
    building: "SW",
    room: "319",
    term: "Winter",
  },
  {
    courseCode: "MATA37H3",
    courseName: "Calculus II for Mathematical Sciences",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Monday",
    start: h(11),
    end: h(12),
    building: "HW",
    room: "216",
    term: "Winter",
  },
  {
    courseCode: "ECMA06H3",
    courseName: "Introduction to Macroeconomics",
    activityType: "LEC",
    sectionCode: "0101",
    weekday: "Tuesday",
    start: h(10),
    end: h(12),
    building: "HL",
    room: "170",
    term: "Winter",
  },
  {
    courseCode: "CSCA48H3",
    courseName: "Introduction to Computer Science II",
    activityType: "PRA",
    sectionCode: "0101",
    weekday: "Wednesday",
    start: h(13),
    end: h(15),
    building: "IC",
    room: "120",
    term: "Winter",
  },
];

export const DEMO_UTSC_MEETINGS: Meeting[] = ROWS.map((r) => ({
  id: `utsc-${r.term}-${r.courseCode}-${r.activityType}-${r.sectionCode}-${r.weekday}-${r.start}`,
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
  campus: "UTSC" as const,
}));
