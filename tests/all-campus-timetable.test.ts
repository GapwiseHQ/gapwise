import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { getLocationPresentation } from "@/features/routing/location-presentation";
import { resolveMeetingLocation } from "@/features/routing/location-resolver";
import { deserializeSchedule, serializeSchedule } from "@/features/sync/schedule-serialization";
import { parseIcs } from "@/lib/ics-parser";
import { createTimetableExportPlan, renderTimetableExportSvg } from "@/lib/timetable-export";
import { renderTimetablePrintSvg } from "@/lib/timetable-print-export";
import { inferredCampusForMeetings, locationLabel } from "@/lib/timetable-types";

function fixture(name: string) {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

const crossCampusCalendar = () => fixture("acorn-mixed-campus-sanitized.ics");

describe("all-campus timetable compatibility", () => {
  test.each([
    ["acorn-utm-sanitized.ics", "UTM"],
    ["acorn-utsg-sanitized.ics", "UTSG"],
    ["acorn-utsc-sanitized.ics", "UTSC"],
  ] as const)("infers %s exclusively from resolved building locations", (name, campus) => {
    const parsed = parseIcs(fixture(name));
    expect(new Set(parsed.meetings.map((meeting) => meeting.campus))).toEqual(new Set([campus]));
    expect(inferredCampusForMeetings(parsed.meetings)).toBe(campus);
  });

  test("does not use the U of T course-code suffix as campus evidence", () => {
    const utm = parseIcs(fixture("acorn-utm-sanitized.ics")).meetings[0]!;
    const utsg = parseIcs(fixture("acorn-utsg-sanitized.ics")).meetings[0]!;
    const utsc = parseIcs(fixture("acorn-utsc-sanitized.ics")).meetings[0]!;

    expect(utm).toMatchObject({ courseCode: "CSC108H1", campus: "UTM" });
    expect(utsg).toMatchObject({ courseCode: "CSC110Y5", campus: "UTSG" });
    expect(utsc).toMatchObject({ courseCode: "CSCA08H1", campus: "UTSC" });
  });

  test("imports a mixed-campus ACORN calendar without treating non-UTM rooms as TBA", () => {
    const parsed = parseIcs(crossCampusCalendar());
    const utsg = parsed.meetings.find((meeting) => meeting.sourceLocation === "BA 1170")!;
    const utm = parsed.meetings.find((meeting) => meeting.sourceLocation === "MN 1270")!;

    expect(utsg).toMatchObject({
      campus: "UTSG",
      sourceLocation: "BA 1170",
      locationType: "physical",
      locationUnknown: false,
      buildingCode: "BA",
      room: "1170",
    });
    expect(utm).toMatchObject({
      campus: "UTM",
      sourceLocation: "MN 1270",
      locationType: "physical",
      locationUnknown: false,
      buildingCode: "MN",
      room: "1270",
    });

    expect(locationLabel(utsg)).toBe("BA 1170");
    expect(locationLabel(utm)).toBe("MN 1270");
    expect(inferredCampusForMeetings(parsed.meetings)).toBeNull();
    expect(parsed.warnings.join(" ")).not.toContain("not in the recognized UTM building registry");
  });

  test("maps source-backed rooms to their own campus without reinterpreting them as UTM", () => {
    const parsed = parseIcs(crossCampusCalendar());
    const utsg = parsed.meetings.find((meeting) => meeting.sourceLocation === "BA 1170")!;
    const utm = parsed.meetings.find((meeting) => meeting.sourceLocation === "MN 1270")!;

    expect(getLocationPresentation({ meeting: utsg })).toMatchObject({
      status: "known",
      label: "BA 1170",
      detail: "Class location.",
    });
    expect(resolveMeetingLocation(utsg)).toMatchObject({
      status: "known",
      buildingCode: "BA",
      buildingName: "Bahen Centre for Information Technology",
      room: "1170",
      routingDataStatus: "inferred",
    });
    expect(resolveMeetingLocation(utm).status).toBe("known");
  });

  test("preserves ambiguous and unrecognized physical locations without choosing UTM", () => {
    const parsed = parseIcs(fixture("acorn-ambiguous-campus-sanitized.ics"));

    expect(parsed.meetings.every((meeting) => meeting.campus === "UNKNOWN")).toBe(true);
    expect(parsed.meetings.every((meeting) => meeting.buildingCode === null)).toBe(true);
    expect(inferredCampusForMeetings(parsed.meetings)).toBeNull();
    expect(parsed.warnings.join(" ")).toContain("multiple U of T campuses");
    expect(parsed.warnings.join(" ")).toContain("could not be matched");
  });

  test("does not use a majority vote or legacy course suffix to force mixed schedules", () => {
    const parsed = parseIcs(crossCampusCalendar());
    const utm = parsed.meetings.find((meeting) => meeting.campus === "UTM")!;
    expect(
      inferredCampusForMeetings([...parsed.meetings, { ...utm, id: "second-utm" }]),
    ).toBeNull();
    expect(inferredCampusForMeetings([{ ...utm, campus: undefined }])).toBeNull();
  });

  test("does not assign an unknown-campus location to UTM", () => {
    expect(
      resolveMeetingLocation({
        courseCode: "SPECIAL",
        campus: "UNKNOWN",
        sourceLocation: "MN 1270",
        buildingCode: "MN",
        room: "1270",
        locationUnknown: false,
        locationType: "physical",
      }),
    ).toMatchObject({
      status: "unknown",
      buildingCode: null,
      buildingName: null,
      routingDataStatus: "unverified",
    });
  });

  test("preserves campus identity and source locations through encrypted-sync serialization", () => {
    const meetings = parseIcs(crossCampusCalendar()).meetings;
    const restored = deserializeSchedule(serializeSchedule(meetings));
    const utsg = restored.find((meeting) => meeting.sourceLocation === "BA 1170")!;

    expect(utsg).toMatchObject({ campus: "UTSG", sourceLocation: "BA 1170" });
    expect(locationLabel(utsg)).toBe("BA 1170");
  });

  test("keeps every mixed-campus location in normal and print timetable exports", () => {
    const meetings = parseIcs(crossCampusCalendar()).meetings;
    const plan = createTimetableExportPlan(meetings, "Fall");
    const exportSvg = renderTimetableExportSvg(meetings, plan);
    const printSvg = renderTimetablePrintSvg(meetings, plan);

    for (const location of ["BA 1170", "MN 1270"]) {
      expect(exportSvg).toContain(`>${location}</text>`);
      expect(printSvg).toContain(`>${location}</text>`);
    }
  });
});
