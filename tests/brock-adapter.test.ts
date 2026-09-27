import { describe, expect, test } from "bun:test";
import {
  brockCampus,
  brockScheduleAdapter,
  parseBrockTimetable,
  parseBrockIcs,
  loadBrockDemoTimetable,
} from "@/universities/brock/adapter";
import { brock } from "@/universities/brock/config";
import { parseBrockText } from "@/universities/brock/text-parser";

describe("Brock Schedule Adapter & Parsers", () => {
  test("parses Brock Student Self-Serve tabular schedule text", () => {
    const text = `
Course     Section  Component  Days    Time                  Location   Instructor
COSC 1P02  01       LEC        MW      09:30 AM - 11:00 AM   ST 107     Staff
MATH 1P66  01       LEC        MWF     12:00 PM - 01:00 PM   TH 247     Smith
ACTG 1P91  01       LEC        TR      02:00 PM - 03:30 PM   WH 204     Staff
    `.trim();

    const { meetings, warnings } = parseBrockText(text, brockCampus, brock);
    expect(warnings.length).toBe(0);
    expect(meetings.length).toBe(3);

    const cosc = meetings.find((m) => m.courseCode === "COSC 1P02");
    expect(cosc).toBeDefined();
    expect(cosc!.days).toEqual(["MO", "WE"]);
    expect(cosc!.startTime).toBe("09:30");
    expect(cosc!.endTime).toBe("11:00");
    expect(cosc!.location.buildingId).toBe("arthur-schmon-tower");
    expect(cosc!.location.room).toBe("107");

    const math = meetings.find((m) => m.courseCode === "MATH 1P66");
    expect(math).toBeDefined();
    expect(math!.days).toEqual(["MO", "WE", "FR"]);
    expect(math!.startTime).toBe("12:00");
    expect(math!.endTime).toBe("13:00");
    expect(math!.location.buildingId).toBe("thistle-complex");
    expect(math!.location.room).toBe("247");

    const actg = meetings.find((m) => m.courseCode === "ACTG 1P91");
    expect(actg).toBeDefined();
    expect(actg!.days).toEqual(["TU", "TH"]);
    expect(actg!.startTime).toBe("14:00");
    expect(actg!.endTime).toBe("15:30");
    expect(actg!.location.buildingId).toBe("welch-hall");
    expect(actg!.location.room).toBe("204");
  });

  test("parses multiline schedule text with building abbreviations", () => {
    const text = `
COSC 1P02 Introduction to Computer Science
LEC 01
Mon, Wed 09:30 AM - 11:00 AM
ST 107

MATH 1P66 Mathematical Reasoning
LEC 01
Mon, Wed, Fri 12:00 PM - 01:00 PM
TH 247
    `.trim();

    const { meetings } = parseBrockText(text, brockCampus, brock);
    expect(meetings.length).toBe(2);

    const cosc = meetings.find((m) => m.courseCode === "COSC 1P02")!;
    expect(cosc.days).toEqual(["MO", "WE"]);
    expect(cosc.location.buildingId).toBe("arthur-schmon-tower");
    expect(cosc.location.room).toBe("107");

    const math = meetings.find((m) => m.courseCode === "MATH 1P66")!;
    expect(math.days).toEqual(["MO", "WE", "FR"]);
    expect(math.location.buildingId).toBe("thistle-complex");
    expect(math.location.room).toBe("247");
  });

  test("parses Brock Brightspace exported calendar (.ics)", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:cosc1p02-01",
      "SUMMARY:COSC 1P02 01 LEC - Intro to CS",
      "LOCATION:ST 107",
      "DTSTART:20260908T093000",
      "DTEND:20260908T110000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261208T235959",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:math1p66-01",
      "SUMMARY:MATH 1P66 01 LEC - Mathematical Reasoning",
      "LOCATION:TH 247",
      "DTSTART:20260908T120000",
      "DTEND:20260908T130000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261208T235959",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const { meetings, warnings } = parseBrockIcs(ics);
    expect(warnings).toHaveLength(0);
    expect(meetings).toHaveLength(5); // 2 on MW, 3 on MWF

    const monMeeting = meetings.find(
      (m) => m.courseCode === "COSC 1P02" && m.weekday === "Monday",
    )!;
    expect(monMeeting).toBeDefined();
    expect(monMeeting.campus).toBe("BROCK");
    expect(monMeeting.universityId).toBe("brock");
    expect(monMeeting.buildingCode).toBe("ST");
    expect(monMeeting.room).toBe("107");
  });

  test("dispatches transparently via parseBrockTimetable and normalizes canonical fields", () => {
    const text = `COSC 1P02 01\nMW 09:30 AM - 11:00 AM\nST 107`;
    const result = parseBrockTimetable(text);
    expect(result.meetings.length).toBe(2);
    expect(result.meetings[0]!.universityId).toBe("brock");
    expect(result.meetings[0]!.campus).toBe("BROCK");
  });

  test("loads the Brock demo timetable with valid academic meetings", () => {
    const demo = loadBrockDemoTimetable();
    expect(demo.length).toBeGreaterThan(0);
    for (const meeting of demo) {
      expect(meeting.universityId).toBe("brock");
      expect(meeting.campus).toBe("BROCK");
      expect(meeting.startTime).toBeLessThan(meeting.endTime);
      expect(meeting.buildingCode).toBeDefined();
    }
  });

  test("adapter interface validates and detects Brock inputs", () => {
    expect(brockScheduleAdapter.universityId).toBe("brock");
    expect(brockScheduleAdapter.detect("BEGIN:VCALENDAR")).toBe(true);
    expect(brockScheduleAdapter.detect("COSC 1P02 01")).toBe(true);
    expect(brockScheduleAdapter.validate("   ").valid).toBe(false);
    expect(brockScheduleAdapter.validate("COSC 1P02").valid).toBe(true);
  });
});
