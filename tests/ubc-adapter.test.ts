import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  loadUbcDemoTimetable,
  parseUbcTimetable,
  ubcCampus,
  ubcWorkdayAdapter,
} from "@/universities/ubc/adapter";
import { ubc } from "@/universities/ubc/config";
import { parseUbcWorkdayText } from "@/universities/ubc/text-parser";

const fixture = readFileSync(
  new URL("./fixtures/ubc-workday-sanitized.tsv", import.meta.url),
  "utf8",
);

describe("UBC Workday timetable adapter", () => {
  test("parses the documented View My Courses table shape", () => {
    const parsed = parseUbcWorkdayText(fixture, ubcCampus, ubc);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.meetings).toHaveLength(3);
    expect(parsed.meetings[0]).toMatchObject({
      courseCode: "CPSC 110",
      nativeSection: "101",
      nativeComponentType: "LEC",
      days: ["MO", "WE"],
      startTime: "09:00",
      endTime: "10:00",
      startDate: "2026-09-08",
      endDate: "2026-12-07",
      location: {
        buildingId:
          "institute-for-computing-information-and-cognitive-systems-computer-science-building",
        room: "X836",
      },
    });
  });

  test("normalizes every Workday weekday into the shared timetable model", () => {
    const parsed = parseUbcTimetable(fixture);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.meetings).toHaveLength(6);
    for (const meeting of parsed.meetings) {
      expect(meeting.universityId).toBe("ubc");
      expect(meeting.campus).toBe("UBC-VANCOUVER");
      expect(meeting.locationUnknown).toBe(false);
      expect(meeting.buildingCode).toBeTruthy();
      expect(meeting.dateRange).toEqual({
        startDate: "2026-09-08",
        endDate: "2026-12-07",
      });
    }
  });

  test("does not invent a building when Workday provides an unknown location", () => {
    const text = fixture.replace("ICCS-Floor 2-Room X836", "ZZZZ-Floor 2-Room 200");
    const parsed = parseUbcTimetable(text);
    const cpsc = parsed.meetings.filter((meeting) => meeting.courseCode === "CPSC 110");
    expect(cpsc).toHaveLength(2);
    expect(cpsc.every((meeting) => meeting.buildingCode === null)).toBe(true);
    expect(cpsc.every((meeting) => meeting.locationUnknown)).toBe(true);
    expect(parsed.warnings).toContain(
      "Could not match ZZZZ-Floor 2-Room 200 to a UBC Vancouver building.",
    );
  });

  test("rejects unrelated or incomplete pasted text", () => {
    expect(() => parseUbcTimetable("CPSC 110, Monday at 9")).toThrow(
      /No UBC Workday meetings were found/,
    );
  });

  test("loads a UBC-specific demo whose locations resolve", () => {
    const demo = loadUbcDemoTimetable();
    expect(demo).toHaveLength(6);
    expect(new Set(demo.map((meeting) => meeting.buildingCode))).toEqual(
      new Set(["ICCS", "BUCH", "PHRM"]),
    );
    expect(demo.every((meeting) => meeting.universityId === "ubc")).toBe(true);
    expect(demo.every((meeting) => !meeting.locationUnknown)).toBe(true);
  });

  test("adapter detection is specific to UBC Vancouver Workday rows", () => {
    expect(ubcWorkdayAdapter.detect(fixture)).toBe(true);
    expect(ubcWorkdayAdapter.detect("BEGIN:VCALENDAR")).toBe(false);
    expect(ubcWorkdayAdapter.validate("   ").valid).toBe(false);
    expect(ubcWorkdayAdapter.acceptedInputs).toEqual(["text/plain", ".txt", ".tsv"]);
  });
});
