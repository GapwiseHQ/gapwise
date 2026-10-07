import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { ensureCampusCatalog, getCampusBuildingIdentity } from "@/data/campuses";
import { inferredCampusForMeetings } from "@/lib/timetable-types";
import { CURATED_CAMPUS_DEMOS, curatedDemoMeetings } from "@/universities/common/curated-demos";
import { SITES, campusById, universityById } from "@/universities/registry";
import { loadDemoTimetable } from "@/universities/timetable-adapters";

const demoEditions = SITES.filter(
  (site) =>
    (site.role === "campus-edition" || site.role === "single-campus-edition") &&
    universityById(site.universityId ?? "")?.status !== "planned",
);

describe("university demo timetables", () => {
  test("demo loader source stays browser-safe (no server-only imports)", () => {
    for (const file of [
      "src/universities/timetable-adapters.ts",
      "src/universities/common/curated-demos.ts",
    ]) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/from\s+["']node:/);
      expect(source).not.toContain("@/server/");
    }
  });

  test("every curated demo references real buildings for its canonical campus", async () => {
    for (const [campusId, demo] of Object.entries(CURATED_CAMPUS_DEMOS)) {
      const campus = campusById(campusId);
      expect(campus, campusId).not.toBeNull();
      expect(campus?.universityId).toBe(demo.universityId);
      await ensureCampusCatalog(campusId);
      for (const course of demo.courses) {
        if (course.buildingCode === null) {
          expect(course.sourceLocation, `${campusId} ${course.courseCode}`).toBeTruthy();
          continue;
        }
        const identity = getCampusBuildingIdentity(campusId, course.buildingCode);
        expect(identity?.code, `${campusId} ${course.courseCode} ${course.buildingCode}`).toBe(
          course.buildingCode,
        );
      }
      const meetings = curatedDemoMeetings(campusId)!;
      expect(inferredCampusForMeetings(meetings)).toBe(campusId.toUpperCase());
    }
  });

  test("every demo-button edition loads its own university's timetable on the right campus", async () => {
    const seenSchedules = new Map<string, string>();
    for (const site of demoEditions) {
      const university = universityById(site.universityId!)!;
      const campusId = site.campusId!;
      const meetings = await loadDemoTimetable(university.timetableAdapter, campusId);
      expect(meetings.length, site.id).toBeGreaterThanOrEqual(3);
      expect(inferredCampusForMeetings(meetings), site.id).toBe(campusId.toUpperCase());
      for (const meeting of meetings) {
        expect(meeting.universityId ?? "uoft", site.id).toBe(university.id);
        expect(meeting.courseCode, site.id).not.toMatch(/^SAMPLE /);
      }
      await ensureCampusCatalog(campusId);
      for (const meeting of meetings.filter((m) => m.buildingCode && campusId !== "utm")) {
        expect(
          getCampusBuildingIdentity(campusId, meeting.buildingCode),
          `${site.id} ${meeting.courseCode} ${meeting.buildingCode}`,
        ).not.toBeNull();
      }
      const fingerprint = meetings
        .map((m) => m.courseCode)
        .sort()
        .join("|");
      expect(seenSchedules.get(fingerprint), `${site.id} reuses a demo`).toBeUndefined();
      seenSchedules.set(fingerprint, site.id);
    }
  });
});
