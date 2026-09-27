import { describe, expect, test } from "bun:test";
import {
  guelphCampus,
  guelphScheduleAdapter,
  parseGuelphTimetable,
  parseGuelphIcs,
  loadGuelphDemoTimetable,
} from "@/universities/guelph/adapter";
import { guelph } from "@/universities/guelph/config";
import { parseGuelphText } from "@/universities/guelph/text-parser";

describe("Guelph Schedule Adapter & Parsers", () => {
  test("parses Guelph WebAdvisor tabular schedule text", () => {
    const text = `
Course    Section  Component  Days    Time                  Location   Instructor
CIS 1300  01       LEC        MWF     09:30 AM - 10:20 AM   ROZH 104   Staff
MATH 1200 01       LEC        MWF     11:30 AM - 12:20 PM   THRN 1200  Smith
PSYC 1000 01       LEC        TR      10:00 AM - 11:20 AM   MCKN 117   Staff
    `.trim();

    const { meetings, warnings } = parseGuelphText(text, guelphCampus, guelph);
    expect(warnings.length).toBe(0);
    expect(meetings.length).toBe(3);

    const cis = meetings.find((m) => m.courseCode === "CIS 1300");
    expect(cis).toBeDefined();
    expect(cis!.days).toEqual(["MO", "WE", "FR"]);
    expect(cis!.startTime).toBe("09:30");
    expect(cis!.endTime).toBe("10:20");
    expect(cis!.location.buildingId).toBe("rozanski-hall");
    expect(cis!.location.room).toBe("104");

    const math = meetings.find((m) => m.courseCode === "MATH 1200");
    expect(math).toBeDefined();
    expect(math!.days).toEqual(["MO", "WE", "FR"]);
    expect(math!.startTime).toBe("11:30");
    expect(math!.endTime).toBe("12:20");
    expect(math!.location.buildingId).toBe("thornbrough-building");
    expect(math!.location.room).toBe("1200");

    const psyc = meetings.find((m) => m.courseCode === "PSYC 1000");
    expect(psyc).toBeDefined();
    expect(psyc!.days).toEqual(["TU", "TH"]);
    expect(psyc!.startTime).toBe("10:00");
    expect(psyc!.endTime).toBe("11:20");
    expect(psyc!.location.buildingId).toBe("mackinnon-building");
    expect(psyc!.location.room).toBe("117");
  });

  test("parses multiline schedule text with building abbreviations", () => {
    const text = `
CIS 1300 Programming
LEC 01
Mon, Wed, Fri 09:30 AM - 10:20 AM
ROZH 104

MATH 1200 Calculus I
LEC 01
Mon, Wed, Fri 11:30 AM - 12:20 PM
THRN 1200
    `.trim();

    const { meetings } = parseGuelphText(text, guelphCampus, guelph);
    expect(meetings.length).toBe(2);

    const cis = meetings.find((m) => m.courseCode === "CIS 1300")!;
    expect(cis.days).toEqual(["MO", "WE", "FR"]);
    expect(cis.location.buildingId).toBe("rozanski-hall");
    expect(cis.location.room).toBe("104");

    const math = meetings.find((m) => m.courseCode === "MATH 1200")!;
    expect(math.days).toEqual(["MO", "WE", "FR"]);
    expect(math.location.buildingId).toBe("thornbrough-building");
    expect(math.location.room).toBe("1200");
  });

  test("parses Guelph CourseLink exported calendar (.ics)", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:cis1300-01",
      "SUMMARY:CIS 1300 01 LEC - Programming",
      "LOCATION:ROZH 104",
      "DTSTART:20260908T093000",
      "DTEND:20260908T102000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261208T235959",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:psyc1000-01",
      "SUMMARY:PSYC 1000 01 LEC - General Psychology",
      "LOCATION:MCKN 117",
      "DTSTART:20260908T100000",
      "DTEND:20260908T112000",
      "RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20261208T235959",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const { meetings, warnings } = parseGuelphIcs(ics);
    expect(warnings).toHaveLength(0);
    expect(meetings).toHaveLength(5); // 3 on MWF, 2 on TR

    const monMeeting = meetings.find((m) => m.courseCode === "CIS 1300" && m.weekday === "Monday")!;
    expect(monMeeting).toBeDefined();
    expect(monMeeting.campus).toBe("GUELPH");
    expect(monMeeting.universityId).toBe("guelph");
    expect(monMeeting.buildingCode).toBe("ROZH");
    expect(monMeeting.room).toBe("104");
  });

  test("dispatches transparently via parseGuelphTimetable and normalizes canonical fields", () => {
    const text = `CIS 1300 01\nMWF 09:30 AM - 10:20 AM\nROZH 104`;
    const result = parseGuelphTimetable(text);
    expect(result.meetings.length).toBe(3);
    expect(result.meetings[0]!.universityId).toBe("guelph");
    expect(result.meetings[0]!.campus).toBe("GUELPH");
  });

  test("loads the Guelph demo timetable with valid academic meetings", () => {
    const demo = loadGuelphDemoTimetable();
    expect(demo.length).toBeGreaterThan(0);
    for (const meeting of demo) {
      expect(meeting.universityId).toBe("guelph");
      expect(meeting.campus).toBe("GUELPH");
      expect(meeting.startTime).toBeLessThan(meeting.endTime);
      expect(meeting.buildingCode).toBeDefined();
    }
  });

  test("adapter interface validates and detects Guelph inputs", () => {
    expect(guelphScheduleAdapter.universityId).toBe("guelph");
    expect(guelphScheduleAdapter.detect("BEGIN:VCALENDAR")).toBe(true);
    expect(guelphScheduleAdapter.detect("CIS 1300 01")).toBe(true);
    expect(guelphScheduleAdapter.validate("   ").valid).toBe(false);
    expect(guelphScheduleAdapter.validate("CIS 1300").valid).toBe(true);
  });
});
