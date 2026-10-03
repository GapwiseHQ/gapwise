import type { Day, Meeting } from "./model";

export interface DemoMeetingSpec {
  courseCode: string;
  courseName: string;
  nativeSection?: string;
  nativeComponentType?: string;
  termLabel?: string;
  days: Day[];
  startTime: string; // "09:30"
  endTime: string; // "10:20"
  nativeText: string;
  buildingId: string;
  room: string;
}

export interface UniversityDemoScheduleOptions {
  termLabel?: string;
  startDate?: string;
  endDate?: string;
  recordedAt?: string;
}

/**
 * Shared generator pattern for university demo schedules.
 * Generates realistic university-specific sample meetings with valid physical locations,
 * multiple days, and predictable between-class gaps for campus inference, map display,
 * and walking route transitions.
 */
export function createUniversityDemoSchedule(
  institutionId: string,
  specs: DemoMeetingSpec[],
  options?: UniversityDemoScheduleOptions,
): Meeting[] {
  const termLabel = options?.termLabel ?? "Fall 2026";
  const startDate = options?.startDate ?? "2026-09-08";
  const endDate = options?.endDate ?? "2026-12-08";
  const recordedAt = options?.recordedAt ?? "2026-09-24T12:00:00.000Z";

  return specs.map((spec, index) => {
    const component =
      spec.nativeComponentType ?? (spec.nativeSection?.startsWith("LAB") ? "LAB" : "LEC");
    const codeId = spec.courseCode.toLowerCase().replace(/[^a-z0-9]/g, "");
    return {
      id: `demo-${institutionId}-${codeId}-${component.toLowerCase()}-${index + 1}`,
      institutionId,
      courseCode: spec.courseCode,
      nativeSection:
        spec.nativeSection ?? (component === "LAB" ? "011" : component === "TUT" ? "004" : "001"),
      nativeComponentType: component,
      courseName: spec.courseName,
      termLabel: spec.termLabel ?? termLabel,
      days: spec.days,
      startTime: spec.startTime,
      endTime: spec.endTime,
      startDate,
      endDate,
      location: {
        kind: "physical",
        nativeText: spec.nativeText,
        buildingId: spec.buildingId,
        room: spec.room,
      },
      source: {
        kind: "sample-timetable",
        recordedAt,
      },
    };
  });
}
