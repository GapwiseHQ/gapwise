import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { routeBetweenBuildings } from "@/features/routing/campus-outdoor-graph";
import { parseMcGillIcs, mcgillCampus } from "@/universities/mcgill/adapter";
import { mcgill } from "@/universities/mcgill/config";

const fixture = readFileSync(
  new URL("./fixtures/mcgill-mycourses-sanitized.ics", import.meta.url),
  "utf8",
);

describe("McGill myCourses calendar adapter", () => {
  test("parses standard calendar events without portal credentials", () => {
    const parsed = parseMcGillIcs(fixture);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.meetings).toHaveLength(4);
    expect(parsed.meetings[0]).toMatchObject({
      universityId: "mcgill",
      courseCode: "COMP 202",
      nativeSection: "001",
      nativeComponentType: "LEC",
      buildingCode: "LEA",
      room: "132",
      campus: "MCGILL-DOWNTOWN",
      weekday: "Monday",
      startTime: 605,
      endTime: 685,
    });
    expect(
      parsed.meetings.find(
        (meeting) => meeting.courseCode === "CHEM 110" && meeting.weekday === "Tuesday",
      ),
    ).toMatchObject({
      courseCode: "CHEM 110",
      buildingCode: "MAASS",
      room: "112",
      weekday: "Tuesday",
    });
  });

  test("uses McGill's published course-code shape", () => {
    expect(mcgill.parseCourseCode("comp202")).toBe("COMP 202");
    expect(mcgill.parseCourseCode("COMP 202")).toBe("COMP 202");
    expect(mcgill.parseCourseCode("COMP 20")).toBeNull();
  });

  test("routes representative imported downtown locations", () => {
    expect(
      routeBetweenBuildings("leacock-building", "otto-maass-chemistry-building", mcgillCampus)
        .status,
    ).toBe("ready");
  });
});
