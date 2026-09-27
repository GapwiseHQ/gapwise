import { describe, expect, test } from "bun:test";
import {
  mcmasterCampus,
  mcmasterScheduleAdapter,
  parseMcMasterTimetable,
  parseMcMasterIcs,
  loadMcMasterDemoTimetable,
} from "@/universities/mcmaster/adapter";
import { mcmaster } from "@/universities/mcmaster/config";
import { parseMcMasterText } from "@/universities/mcmaster/text-parser";

describe("McMaster Schedule Adapter & Parsers", () => {
  test("parses McMaster Mosaic tabular schedule text", () => {
    const text = `
Course        Sec   Component  Days    Time                  Location   Instructor
COMPSCI 1MD3  C01   LEC        MWTh    09:30 AM - 10:20 AM   BSB 147    Staff
MATH 1ZA3     C01   LEC        MWTh    11:30 AM - 12:20 PM   JHE 264    Smith
ENGINEER 1P13 L01   LAB        Tu      02:30 PM - 05:20 PM   ETB 110    Staff
    `.trim();

    const { meetings, warnings } = parseMcMasterText(text, mcmasterCampus, mcmaster);
    expect(warnings.length).toBe(0);
    expect(meetings.length).toBe(3);

    const csLec = meetings.find(
      (m) => m.courseCode === "COMPSCI 1MD3" && m.nativeSection === "C01",
    );
    expect(csLec).toBeDefined();
    expect(csLec!.days).toEqual(["MO", "WE", "TH"]);
    expect(csLec!.startTime).toBe("09:30");
    expect(csLec!.endTime).toBe("10:20");
    expect(csLec!.location.buildingId).toBe("burke-science-building");
    expect(csLec!.location.room).toBe("147");

    const mathLec = meetings.find((m) => m.courseCode === "MATH 1ZA3");
    expect(mathLec).toBeDefined();
    expect(mathLec!.days).toEqual(["MO", "WE", "TH"]);
    expect(mathLec!.startTime).toBe("11:30");
    expect(mathLec!.endTime).toBe("12:20");
    expect(mathLec!.location.buildingId).toBe("john-hodgins-engineering");
    expect(mathLec!.location.room).toBe("264");
  });

  test("parses multiline schedule text with building abbreviations", () => {
    const text = `
COMPSCI 1MD3 Introduction to Programming
Sec C01 LEC
Mon, Wed, Thu 09:30 AM - 10:20 AM
BSB 147

MATH 1ZA3 Engineering Mathematics I
Sec C01 LEC
Mon, Wed, Thu 11:30 AM - 12:20 PM
JHE 264
    `.trim();

    const { meetings } = parseMcMasterText(text, mcmasterCampus, mcmaster);
    expect(meetings.length).toBe(2);

    const cs = meetings.find((m) => m.courseCode === "COMPSCI 1MD3")!;
    expect(cs.days).toEqual(["MO", "WE", "TH"]);
    expect(cs.location.buildingId).toBe("burke-science-building");
    expect(cs.location.room).toBe("147");

    const math = meetings.find((m) => m.courseCode === "MATH 1ZA3")!;
    expect(math.days).toEqual(["MO", "WE", "TH"]);
    expect(math.location.buildingId).toBe("john-hodgins-engineering");
    expect(math.location.room).toBe("264");
  });

  test("parses McMaster Outlook / Mosaic exported calendar (.ics)", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:cs-1md3-c01",
      "SUMMARY:COMPSCI 1MD3 C01 LEC - Intro to Programming",
      "LOCATION:BSB 147",
      "DTSTART:20260908T093000",
      "DTEND:20260908T102000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,TH;UNTIL=20261208T235959",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:math-1za3-c01",
      "SUMMARY:MATH 1ZA3 C01 LEC - Engineering Math",
      "LOCATION:JHE 264",
      "DTSTART:20260908T113000",
      "DTEND:20260908T122000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,TH;UNTIL=20261208T235959",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const { meetings, warnings } = parseMcMasterIcs(ics);
    expect(warnings).toHaveLength(0);
    expect(meetings).toHaveLength(6); // 3 on MWTh for CS, 3 on MWTh for Math

    const monMeeting = meetings.find(
      (m) => m.courseCode === "COMPSCI 1MD3" && m.weekday === "Monday",
    )!;
    expect(monMeeting).toBeDefined();
    expect(monMeeting.campus).toBe("MCMASTER");
    expect(monMeeting.universityId).toBe("mcmaster");
    expect(monMeeting.buildingCode).toBe("BSB");
    expect(monMeeting.room).toBe("147");
  });

  test("dispatches transparently via parseMcMasterTimetable and normalizes canonical fields", () => {
    const text = `COMPSCI 1MD3 C01\nMWTh 09:30 AM - 10:20 AM\nBSB 147`;
    const result = parseMcMasterTimetable(text);
    expect(result.meetings.length).toBe(3);
    expect(result.meetings[0]!.universityId).toBe("mcmaster");
    expect(result.meetings[0]!.campus).toBe("MCMASTER");
  });

  test("loads the McMaster demo timetable with valid academic meetings", () => {
    const demo = loadMcMasterDemoTimetable();
    expect(demo.length).toBeGreaterThan(0);
    for (const meeting of demo) {
      expect(meeting.universityId).toBe("mcmaster");
      expect(meeting.campus).toBe("MCMASTER");
      expect(meeting.startTime).toBeLessThan(meeting.endTime);
      expect(meeting.buildingCode).toBeDefined();
    }
  });

  test("adapter interface validates and detects McMaster inputs", () => {
    expect(mcmasterScheduleAdapter.universityId).toBe("mcmaster");
    expect(mcmasterScheduleAdapter.detect("BEGIN:VCALENDAR")).toBe(true);
    expect(mcmasterScheduleAdapter.detect("COMPSCI 1MD3 C01 Intro to Programming")).toBe(true);
    expect(mcmasterScheduleAdapter.validate("   ").valid).toBe(false);
    expect(mcmasterScheduleAdapter.validate("COMPSCI 1MD3").valid).toBe(true);
  });
});
