import { describe, expect, test } from "bun:test";
import {
  uottawaCampus,
  uottawaScheduleAdapter,
  parseUOttawaTimetable,
  parseUOttawaIcs,
  loadUOttawaDemoTimetable,
} from "@/universities/uottawa/adapter";
import { uottawa } from "@/universities/uottawa/config";
import { parseUOttawaText } from "@/universities/uottawa/text-parser";

describe("uOttawa Schedule Adapter & Parsers", () => {
  test("parses uOttawa uoZone tabular schedule text in English and French", () => {
    const text = `
Course    Section  Component  Days    Time                  Location   Instructor
CSI 2110  A        LEC        MW      10:00 AM - 11:30 AM   STE 0131   Staff
MAT 1320  A        LEC        MWF     08:30 AM - 09:30 AM   DMS 1160   Smith
ADM 1100  A        LEC        TR      01:00 PM - 02:30 PM   FSS 1007   Staff
    `.trim();

    const { meetings, warnings } = parseUOttawaText(text, uottawaCampus, uottawa);
    expect(warnings.length).toBe(0);
    expect(meetings.length).toBe(3);

    const csi = meetings.find((m) => m.courseCode === "CSI 2110");
    expect(csi).toBeDefined();
    expect(csi!.days).toEqual(["MO", "WE"]);
    expect(csi!.startTime).toBe("10:00");
    expect(csi!.endTime).toBe("11:30");
    expect(csi!.location.buildingId).toBe("site-building");
    expect(csi!.location.room).toBe("0131");

    const mat = meetings.find((m) => m.courseCode === "MAT 1320");
    expect(mat).toBeDefined();
    expect(mat!.days).toEqual(["MO", "WE", "FR"]);
    expect(mat!.startTime).toBe("08:30");
    expect(mat!.endTime).toBe("09:30");
    expect(mat!.location.buildingId).toBe("desmarais-building");
    expect(mat!.location.room).toBe("1160");

    const adm = meetings.find((m) => m.courseCode === "ADM 1100");
    expect(adm).toBeDefined();
    expect(adm!.days).toEqual(["TU", "TH"]);
    expect(adm!.startTime).toBe("13:00");
    expect(adm!.endTime).toBe("14:30");
    expect(adm!.location.buildingId).toBe("faculty-social-sciences");
    expect(adm!.location.room).toBe("1007");
  });

  test("parses multiline schedule text with building abbreviations", () => {
    const text = `
CSI 2110 Data Structures and Algorithms
LEC A
Mon, Wed 10:00 AM - 11:30 AM
STE 0131

MAT 1320 Calculus I
LEC A
Lundi, Mercredi, Vendredi 08:30 - 09:30
DMS 1160
    `.trim();

    const { meetings } = parseUOttawaText(text, uottawaCampus, uottawa);
    expect(meetings.length).toBe(2);

    const csi = meetings.find((m) => m.courseCode === "CSI 2110")!;
    expect(csi.days).toEqual(["MO", "WE"]);
    expect(csi.location.buildingId).toBe("site-building");
    expect(csi.location.room).toBe("0131");

    const mat = meetings.find((m) => m.courseCode === "MAT 1320")!;
    expect(mat.days).toEqual(["MO", "WE", "FR"]);
    expect(mat.location.buildingId).toBe("desmarais-building");
    expect(mat.location.room).toBe("1160");
  });

  test("parses uOttawa Brightspace exported calendar (.ics)", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:csi2110-a",
      "SUMMARY:CSI 2110 A LEC - Data Structures",
      "LOCATION:STE 0131",
      "DTSTART:20260908T100000",
      "DTEND:20260908T113000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261208T235959",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:adm1100-a",
      "SUMMARY:ADM 1100 A LEC - Business Management",
      "LOCATION:FSS 1007",
      "DTSTART:20260908T130000",
      "DTEND:20260908T143000",
      "RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20261208T235959",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const { meetings, warnings } = parseUOttawaIcs(ics);
    expect(warnings).toHaveLength(0);
    expect(meetings).toHaveLength(4); // 2 on MW, 2 on TR

    const monMeeting = meetings.find((m) => m.courseCode === "CSI 2110" && m.weekday === "Monday")!;
    expect(monMeeting).toBeDefined();
    expect(monMeeting.campus).toBe("UOTTAWA");
    expect(monMeeting.universityId).toBe("uottawa");
    expect(monMeeting.buildingCode).toBe("STE");
    expect(monMeeting.room).toBe("0131");
  });

  test("dispatches transparently via parseUOttawaTimetable and normalizes canonical fields", () => {
    const text = `CSI 2110 A\nMW 10:00 AM - 11:30 AM\nSTE 0131`;
    const result = parseUOttawaTimetable(text);
    expect(result.meetings.length).toBe(2);
    expect(result.meetings[0]!.universityId).toBe("uottawa");
    expect(result.meetings[0]!.campus).toBe("UOTTAWA");
  });

  test("loads the uOttawa demo timetable with valid academic meetings", () => {
    const demo = loadUOttawaDemoTimetable();
    expect(demo.length).toBeGreaterThan(0);
    for (const meeting of demo) {
      expect(meeting.universityId).toBe("uottawa");
      expect(meeting.campus).toBe("UOTTAWA");
      expect(meeting.startTime).toBeLessThan(meeting.endTime);
      expect(meeting.buildingCode).toBeDefined();
    }
  });

  test("adapter interface validates and detects uOttawa inputs", () => {
    expect(uottawaScheduleAdapter.universityId).toBe("uottawa");
    expect(uottawaScheduleAdapter.detect("BEGIN:VCALENDAR")).toBe(true);
    expect(uottawaScheduleAdapter.detect("CSI 2110 A")).toBe(true);
    expect(uottawaScheduleAdapter.validate("   ").valid).toBe(false);
    expect(uottawaScheduleAdapter.validate("CSI 2110").valid).toBe(true);
  });
});
