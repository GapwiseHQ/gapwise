import { describe, expect, test } from "bun:test";
import {
  yorkCampus,
  yorkScheduleAdapter,
  parseYorkTimetable,
  parseYorkIcs,
  loadYorkDemoTimetable,
} from "@/universities/york/adapter";
import { york } from "@/universities/york/config";
import { parseYorkText } from "@/universities/york/text-parser";

describe("York Schedule Adapter & Parsers", () => {
  test("parses York Visual Schedule Builder tabular schedule text", () => {
    const text = `
Course     Sec  Title                     Days  Time                  Location  Instructor
EECS 1022  A    Intro to Computing        MWF   10:30 AM - 11:30 AM   BRG 212   Staff
EECS 1022  LAB  Programming Lab           R     02:30 PM - 04:30 PM   LAS 1006  Staff
MATH 1013  B    Applied Calculus I        TR    08:30 AM - 10:00 AM   CLH L     Staff
    `.trim();

    const { meetings, warnings } = parseYorkText(text, yorkCampus, york);
    expect(warnings.length).toBe(0);
    expect(meetings.length).toBe(3);

    const eecsLec = meetings.find((m) => m.courseCode === "EECS 1022" && m.nativeSection === "A");
    expect(eecsLec).toBeDefined();
    expect(eecsLec!.days).toEqual(["MO", "WE", "FR"]);
    expect(eecsLec!.startTime).toBe("10:30");
    expect(eecsLec!.endTime).toBe("11:30");
    expect(eecsLec!.location.buildingId).toBe("bergeron-centre");
    expect(eecsLec!.location.room).toBe("212");

    const mathLec = meetings.find((m) => m.courseCode === "MATH 1013");
    expect(mathLec).toBeDefined();
    expect(mathLec!.days).toEqual(["TU", "TH"]);
    expect(mathLec!.startTime).toBe("08:30");
    expect(mathLec!.endTime).toBe("10:00");
    expect(mathLec!.location.buildingId).toBe("curtis-lecture-halls");
  });

  test("parses multiline schedule text with building abbreviations", () => {
    const text = `
EECS 2011 Fundamentals of Data Structures
Sec E LEC
Mon, Wed 14:30 - 16:00
LAS 3033

MATH 1025 Applied Linear Algebra
Sec M LEC
Tue, Thu 11:30 - 13:00
ACW 206
    `.trim();

    const { meetings } = parseYorkText(text, yorkCampus, york);
    expect(meetings.length).toBe(2);

    const eecs2011 = meetings.find((m) => m.courseCode === "EECS 2011")!;
    expect(eecs2011.days).toEqual(["MO", "WE"]);
    expect(eecs2011.location.buildingId).toBe("lassonde-building");
    expect(eecs2011.location.room).toBe("3033");

    const math1025 = meetings.find((m) => m.courseCode === "MATH 1025")!;
    expect(math1025.days).toEqual(["TU", "TH"]);
    expect(math1025.location.buildingId).toBe("accolade-west");
    expect(math1025.location.room).toBe("206");
  });

  test("parses York REM exported calendar (.ics)", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:eecs-1022-a",
      "SUMMARY:EECS 1022 A LEC - Intro to Computing",
      "LOCATION:BRG 212",
      "DTSTART:20260908T103000",
      "DTEND:20260908T113000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261208T235959",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:math-1013-b",
      "SUMMARY:MATH 1013 B LEC - Applied Calculus I",
      "LOCATION:Curtis Lecture Halls L",
      "DTSTART:20260908T083000",
      "DTEND:20260908T100000",
      "RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20261208T235959",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const { meetings, warnings } = parseYorkIcs(ics);
    expect(warnings).toHaveLength(0);
    expect(meetings).toHaveLength(5); // 3 on MWF, 2 on TR

    const monMeeting = meetings.find((m) => m.weekday === "Monday")!;
    expect(monMeeting.courseCode).toBe("EECS 1022");
    expect(monMeeting.campus).toBe("KEELE");
    expect(monMeeting.universityId).toBe("york");
    expect(monMeeting.buildingCode).toBe("BRG");
    expect(monMeeting.room).toBe("212");
  });

  test("dispatches transparently via parseYorkTimetable and normalizes canonical fields", () => {
    const text = `EECS 1022 A\nMWF 10:30 - 11:30\nBRG 212`;
    const result = parseYorkTimetable(text);
    expect(result.meetings.length).toBe(3);
    expect(result.meetings[0]!.universityId).toBe("york");
    expect(result.meetings[0]!.campus).toBe("KEELE");
  });

  test("loads the York demo timetable with valid academic meetings", () => {
    const demo = loadYorkDemoTimetable();
    expect(demo.length).toBeGreaterThan(0);
    for (const meeting of demo) {
      expect(meeting.universityId).toBe("york");
      expect(meeting.campus).toBe("KEELE");
      expect(meeting.startTime).toBeLessThan(meeting.endTime);
      expect(meeting.buildingCode).toBeDefined();
    }
  });

  test("adapter interface validates and detects York inputs", () => {
    expect(yorkScheduleAdapter.universityId).toBe("york");
    expect(yorkScheduleAdapter.detect("BEGIN:VCALENDAR")).toBe(true);
    expect(yorkScheduleAdapter.detect("EECS 1022 A Intro to Computing")).toBe(true);
    expect(yorkScheduleAdapter.validate("   ").valid).toBe(false);
    expect(yorkScheduleAdapter.validate("EECS 1022").valid).toBe(true);
  });
});
