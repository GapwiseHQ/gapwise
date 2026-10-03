import { describe, expect, test } from "bun:test";
import { inferredCampusForMeetings } from "@/lib/timetable-types";
import { timetableAdapters } from "@/universities/timetable-adapters";
import { parseUbcTimetable } from "@/universities/ubc/adapter";
import { parseYorkTimetable } from "@/universities/york/adapter";
import { supportedUniversities } from "@/universities/registry";

const CALENDAR_CASES = [
  ["cmu-calendar", "15-122", "CMU-PITTSBURGH"],
  ["ucberkeley-calendar", "COMPSCI 61A", "UCBERKELEY-MAIN"],
  ["nyu-calendar", "CSCI-UA 101", "NYU-WASHINGTON-SQUARE"],
  ["mit-calendar", "6.100A", "MIT-CAMBRIDGE"],
  ["stanford-calendar", "CS 106A", "STANFORD-MAIN"],
  ["upenn-calendar", "CIS 1200", "UPENN-PHILADELPHIA"],
  ["cornell-calendar", "CS 1110", "CORNELL-ITHACA"],
  ["dartmouth-calendar", "COSC 1", "DARTMOUTH-HANOVER"],
  ["brown-calendar", "CSCI 0111", "BROWN-PROVIDENCE"],
  ["columbia-calendar", "COMS W1004", "COLUMBIA-MORNINGSIDE"],
  ["princeton-calendar", "COS 126", "PRINCETON-MAIN"],
  ["yale-calendar", "CPSC 201", "YALE-NEW-HAVEN"],
  ["harvard-calendar", "CS 50", "HARVARD-CAMBRIDGE"],
] as const;

function calendar(courseCode: string) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gapwise test fixture//EN",
    "BEGIN:VEVENT",
    `UID:${courseCode.replace(/\W/g, "-")}@example.edu`,
    `SUMMARY:${courseCode} LEC Section 001 - Foundations`,
    "DESCRIPTION:Weekly lecture",
    "LOCATION:Main Hall 201",
    "DTSTART:20260908T093000",
    "DTEND:20260908T104500",
    "RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20261208T235959",
    "EXDATE:20261013T093000",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

describe("North American calendar import", () => {
  test.each(CALENDAR_CASES)(
    "%s parses its known iCalendar shape",
    async (adapterId, code, campus) => {
      const parsed = await timetableAdapters[adapterId]!(calendar(code));
      expect(parsed.meetings).toHaveLength(2);
      expect(new Set(parsed.meetings.map((meeting) => meeting.weekday))).toEqual(
        new Set(["Tuesday", "Thursday"]),
      );
      expect(parsed.meetings[0]).toMatchObject({
        courseCode: code,
        campus,
        startTime: 570,
        endTime: 645,
        sourceLocation: "Main Hall 201",
        locationType: "physical",
        dateRange: { startDate: "2026-09-08", endDate: "2026-12-08" },
        excludedDates: ["2026-10-13"],
        recurrenceIntervalWeeks: 1,
      });
    },
  );

  test("every university in the directory now has a registered production adapter", () => {
    const universities = supportedUniversities();
    expect(universities).toHaveLength(27);
    for (const university of universities) {
      expect(university.timetableAdapter).not.toBe("planned");
      expect(timetableAdapters[university.timetableAdapter]).toBeDefined();
    }
  });

  test("accepts legacy vCalendar containers used by older university exports", async () => {
    const parsed = await timetableAdapters["mit-calendar"]!(
      calendar("6.100A").replace("VERSION:2.0", "VERSION:1.0"),
    );
    expect(parsed.meetings.map((meeting) => meeting.courseCode)).toEqual(["6.100A", "6.100A"]);
  });

  test("converts UTC calendar events into the university's local time zone", async () => {
    const utcCalendar = calendar("CS 106A")
      .replace("DTSTART:20260908T093000", "DTSTART:20260908T163000Z")
      .replace("DTEND:20260908T104500", "DTEND:20260908T174500Z");
    const parsed = await timetableAdapters["stanford-calendar"]!(utcCalendar);
    expect(parsed.meetings[0]).toMatchObject({ startTime: 570, endTime: 645 });
  });

  test("rejects unrelated calendars instead of importing personal events", async () => {
    const personal = calendar("Dinner");
    await expect(timetableAdapters["harvard-calendar"]!(personal)).rejects.toThrow(
      "No Harvard University course meetings were found",
    );
  });

  test("finds course codes after administrative text and supports Columbia catalog prefixes", async () => {
    const prefixed = calendar("MATH UN1101").replace(
      "SUMMARY:MATH UN1101 LEC Section 001 - Foundations",
      "SUMMARY:Section 001 - MATH UN1101 LEC - Foundations",
    );
    const parsed = await timetableAdapters["columbia-calendar"]!(prefixed);
    expect(parsed.meetings.map((meeting) => meeting.courseCode)).toEqual([
      "MATH UN1101",
      "MATH UN1101",
    ]);
  });
});

describe("multi-campus import inference", () => {
  test("uses the UBC Workday campus designator for Okanagan rows", () => {
    const text = [
      "Course Listing\tCredits\tGrading Basis\tSection\tInstructional Format\tDelivery Mode\tMeeting Patterns\tRegistration Status\tInstructor\tStart Date\tEnd Date",
      "COSC_O 111 - Computer Programming I\t3\tGraded\tCOSC_O 111-001 - Computer Programming I\tLecture\tIn Person Learning\t2026-09-08 - 2026-12-07 | Mon Wed | 9:00 a.m. - 10:00 a.m. | ART-Floor 2-Room 203\tRegistered\tStaff\t2026-09-08\t2026-12-07",
    ].join("\n");
    const parsed = parseUbcTimetable(text);
    expect(parsed.meetings.every((meeting) => meeting.campus === "UBC-OKANAGAN")).toBe(true);
    expect(inferredCampusForMeetings(parsed.meetings)).toBe("UBC-OKANAGAN");
    expect(parsed.meetings[0]).toMatchObject({
      sourceLocation: "ART 203",
      locationType: "physical",
      locationUnknown: false,
    });
  });

  test.each([
    ["Glendon Campus York Hall A201", "GLENDON"],
    ["Markham Campus Room 301", "MARKHAM"],
  ] as const)("infers York %s locations", (location, campus) => {
    const parsed = parseYorkTimetable(
      `Course Section Component Days Time Location Instructor\nEECS 1022 A LEC MW 10:30 AM - 11:30 AM ${location} Staff`,
    );
    expect(parsed.meetings.length).toBeGreaterThan(0);
    expect(parsed.meetings.every((meeting) => meeting.campus === campus)).toBe(true);
    expect(parsed.meetings[0]?.locationType).toBe("physical");
  });
});
