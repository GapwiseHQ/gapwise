import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { loadDemoTimetable } from "@/universities/timetable-adapters";
import {
  parseWaterlooTimetable,
  waterlooCampus,
  waterlooQuestAdapter,
} from "@/universities/waterloo/adapter";
import { waterloo } from "@/universities/waterloo/config";
import { parseWaterlooQuestText } from "@/universities/waterloo/text-parser";

const fixture = readFileSync(
  new URL("./fixtures/waterloo-quest-sanitized.tsv", import.meta.url),
  "utf8",
);

describe("Waterloo Quest timetable adapter", () => {
  test("parses the documented Class Schedule List View shape", () => {
    const parsed = parseWaterlooQuestText(fixture, waterlooCampus, waterloo);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.meetings).toHaveLength(3);
    expect(parsed.meetings[0]).toMatchObject({
      courseCode: "MATH 135",
      days: ["MO", "WE", "FR"],
      startTime: "09:30",
      location: { buildingId: "mathematics-computer-building", room: "2066" },
    });
  });

  test("normalizes Quest meetings without colliding with Laurier's Waterloo campus", () => {
    const parsed = parseWaterlooTimetable(fixture);
    expect(parsed.meetings).toHaveLength(8);
    expect(parsed.meetings.every((meeting) => meeting.universityId === "waterloo")).toBe(true);
    expect(parsed.meetings.every((meeting) => meeting.campus === "WATERLOO-MAIN")).toBe(true);
    expect(parsed.meetings.every((meeting) => !meeting.locationUnknown)).toBe(true);
  });

  test("does not invent a building for an unknown Quest room", () => {
    const parsed = parseWaterlooTimetable(fixture.replace("MC 2066", "ZZZ 2066"));
    const math = parsed.meetings.filter((meeting) => meeting.courseCode === "MATH 135");
    expect(math.every((meeting) => meeting.buildingCode === null && meeting.locationUnknown)).toBe(
      true,
    );
    expect(parsed.warnings).toContain("Could not match ZZZ 2066 to a Waterloo building.");
  });

  test("loads a university-specific routable demo", async () => {
    const demo = await loadDemoTimetable("waterloo-quest");
    expect(new Set(demo.map((meeting) => meeting.buildingCode))).toEqual(
      new Set(["MC", "DC", "AL"]),
    );
    expect(
      demo.every((meeting) => meeting.universityId === "waterloo" && !meeting.locationUnknown),
    ).toBe(true);
  });

  test("detects Quest rows and rejects unrelated text", () => {
    expect(waterlooQuestAdapter.detect(fixture)).toBe(true);
    expect(waterlooQuestAdapter.detect("BEGIN:VCALENDAR")).toBe(false);
    expect(waterlooQuestAdapter.validate(" ").valid).toBe(false);
    expect(() => parseWaterlooTimetable("MATH 135 on Monday")).toThrow(
      /No Waterloo Quest meetings/,
    );
  });
});
