import { describe, expect, test } from "bun:test";
import {
  westernCampus,
  westernScheduleAdapter,
  parseWesternTimetable,
  parseWesternIcs,
  loadWesternDemoTimetable,
} from "@/universities/western/adapter";
import { western } from "@/universities/western/config";
import { parseWesternText } from "@/universities/western/text-parser";

describe("Western Schedule Adapter & Parsers", () => {
  test("parses Western Student Center tabular schedule text", () => {
    const text = `
Course        Section  Component  Days    Time                  Location   Instructor
COMPSCI 1026A 001      LEC        MWF     09:30 AM - 10:30 AM   MC 110     Staff
MATH 1600A    001      LEC        MWF     11:30 AM - 12:30 PM   NSC 145    Smith
    `.trim();

    const { meetings, warnings } = parseWesternText(text, westernCampus, western);
    expect(warnings.length).toBe(0);
    expect(meetings.length).toBe(2);

    const cs = meetings.find((m) => m.courseCode === "COMPSCI 1026A");
    expect(cs).toBeDefined();
    expect(cs!.days).toEqual(["MO", "WE", "FR"]);
    expect(cs!.startTime).toBe("09:30");
    expect(cs!.endTime).toBe("10:30");
    expect(cs!.location.buildingId).toBe("middlesex-college");
    expect(cs!.location.room).toBe("110");

    const math = meetings.find((m) => m.courseCode === "MATH 1600A");
    expect(math).toBeDefined();
    expect(math!.days).toEqual(["MO", "WE", "FR"]);
    expect(math!.startTime).toBe("11:30");
    expect(math!.endTime).toBe("12:30");
    expect(math!.location.buildingId).toBe("natural-sciences-centre");
    expect(math!.location.room).toBe("145");
  });

  test("parses multiline schedule text with building abbreviations", () => {
    const text = `
COMPSCI 1026A Computer Science Fundamentals I
LEC 001
Mon, Wed, Fri 09:30 AM - 10:30 AM
MC 110

MATH 1600A Linear Algebra I
LEC 001
Mon, Wed, Fri 11:30 AM - 12:30 PM
NSC 145
    `.trim();

    const { meetings } = parseWesternText(text, westernCampus, western);
    expect(meetings.length).toBe(2);

    const cs = meetings.find((m) => m.courseCode === "COMPSCI 1026A")!;
    expect(cs.days).toEqual(["MO", "WE", "FR"]);
    expect(cs.location.buildingId).toBe("middlesex-college");
    expect(cs.location.room).toBe("110");

    const math = meetings.find((m) => m.courseCode === "MATH 1600A")!;
    expect(math.days).toEqual(["MO", "WE", "FR"]);
    expect(math.location.buildingId).toBe("natural-sciences-centre");
    expect(math.location.room).toBe("145");
  });

  test("parses Western exported calendar (.ics)", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:cs1026a-001",
      "SUMMARY:COMPSCI 1026A 001 LEC - CS Fundamentals",
      "LOCATION:MC 110",
      "DTSTART:20260908T093000",
      "DTEND:20260908T103000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261208T235959",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:math1600a-001",
      "SUMMARY:MATH 1600A 001 LEC - Linear Algebra",
      "LOCATION:NSC 145",
      "DTSTART:20260908T113000",
      "DTEND:20260908T123000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261208T235959",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const { meetings, warnings } = parseWesternIcs(ics);
    expect(warnings).toHaveLength(0);
    expect(meetings).toHaveLength(6); // 3 on MWF each

    const monMeeting = meetings.find(
      (m) => m.courseCode === "COMPSCI 1026A" && m.weekday === "Monday",
    )!;
    expect(monMeeting).toBeDefined();
    expect(monMeeting.campus).toBe("WESTERN");
    expect(monMeeting.universityId).toBe("western");
    expect(monMeeting.buildingCode).toBe("MC");
    expect(monMeeting.room).toBe("110");
  });

  test("dispatches transparently via parseWesternTimetable and normalizes canonical fields", () => {
    const text = `COMPSCI 1026A 001\nMWF 09:30 AM - 10:30 AM\nMC 110`;
    const result = parseWesternTimetable(text);
    expect(result.meetings.length).toBe(3);
    expect(result.meetings[0]!.universityId).toBe("western");
    expect(result.meetings[0]!.campus).toBe("WESTERN");
  });

  test("loads the Western demo timetable with valid academic meetings", () => {
    const demo = loadWesternDemoTimetable();
    expect(demo.length).toBeGreaterThan(0);
    for (const meeting of demo) {
      expect(meeting.universityId).toBe("western");
      expect(meeting.campus).toBe("WESTERN");
      expect(meeting.startTime).toBeLessThan(meeting.endTime);
      expect(meeting.buildingCode).toBeDefined();
    }
  });

  test("adapter interface validates and detects Western inputs", () => {
    expect(westernScheduleAdapter.universityId).toBe("western");
    expect(westernScheduleAdapter.detect("BEGIN:VCALENDAR")).toBe(true);
    expect(westernScheduleAdapter.detect("COMPSCI 1026A 001")).toBe(true);
    expect(westernScheduleAdapter.validate("   ").valid).toBe(false);
    expect(westernScheduleAdapter.validate("COMPSCI 1026A").valid).toBe(true);
  });
});
