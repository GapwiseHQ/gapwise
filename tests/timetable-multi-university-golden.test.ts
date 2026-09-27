import { describe, expect, test } from "bun:test";
import { timetableAdapters, demoTimetableLoaders } from "@/universities/timetable-adapters";
import { supportedUniversities } from "@/universities/registry";
import { getCampusBuildingIdentity } from "@/data/campuses";

// Golden fixture inputs for each supported institution
const GOLDEN_FIXTURES: Record<
  string,
  { name: string; sample: string; expectedCourse: string; expectedBuilding: string }
> = {
  "acorn-ics": {
    name: "University of Toronto (ACORN ICS)",
    sample: [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:uoft-csc108-lec",
      "SUMMARY:CSC108H5 F LEC0101",
      "LOCATION:DH 2060",
      "DTSTART:20260908T090000",
      "DTEND:20260908T100000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261208T235959",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n"),
    expectedCourse: "CSC108H5",
    expectedBuilding: "DH",
  },
  "carleton-ics": {
    name: "Carleton University (Carleton Central)",
    sample: `
CRN    Course     Sec  Title                               CrHr  Days  Time                 Location             Instructor
31234  COMP 1405  A    Introduction to Computer Science I  0.50  TR    10:05 am - 11:25 am  Tory Building 208    Smith
    `.trim(),
    expectedCourse: "COMP 1405",
    expectedBuilding: "TB",
  },
  "tmu-schedule": {
    name: "Toronto Metropolitan University (RAMSS)",
    sample: `
Course        Sec   Title                   Days  Time                  Location  Instructor
CPS 109       011   Computer Science I      MWF   10:00 AM - 11:00 AM   ENG 103   Staff
    `.trim(),
    expectedCourse: "CPS 109",
    expectedBuilding: "ENG",
  },
  "queens-schedule": {
    name: "Queen's University (SOLUS)",
    sample: `
Course      Sec  Title                           Days  Time                  Location  Instructor
CISC 121    001  Introduction to Computing       MWF   09:30 AM - 10:30 AM   DUP 215   Staff
    `.trim(),
    expectedCourse: "CISC 121",
    expectedBuilding: "DUP",
  },
  "laurier-schedule": {
    name: "Wilfrid Laurier University (LORIS)",
    sample: `
Course  Sec  Title                         Days  Time                  Location  Instructor
CP 104  A    Introduction to Programming   MWF   08:30 AM - 09:20 AM   LH 1009   Brown
    `.trim(),
    expectedCourse: "CP 104",
    expectedBuilding: "LH",
  },
  "york-schedule": {
    name: "York University (REM / VSB)",
    sample: `
Course      Sec  Component  Days  Time                  Location  Instructor
EECS 1022   A    LEC        MWF   10:30 AM - 11:30 AM   BRG 212   Staff
    `.trim(),
    expectedCourse: "EECS 1022",
    expectedBuilding: "BRG",
  },
  "mcmaster-schedule": {
    name: "McMaster University (Mosaic)",
    sample: `
Course        Sec   Component  Days    Time                  Location   Instructor
COMPSCI 1MD3  C01   LEC        MWTh    09:30 AM - 10:20 AM   BSB 147    Staff
    `.trim(),
    expectedCourse: "COMPSCI 1MD3",
    expectedBuilding: "BSB",
  },
  "western-schedule": {
    name: "Western University (Student Center)",
    sample: `
Course        Section  Component  Days    Time                  Location   Instructor
COMPSCI 1026A 001      LEC        MWF     09:30 AM - 10:30 AM   MC 110     Staff
    `.trim(),
    expectedCourse: "COMPSCI 1026A",
    expectedBuilding: "MC",
  },
  "guelph-schedule": {
    name: "University of Guelph (WebAdvisor)",
    sample: `
Course    Section  Component  Days    Time                  Location   Instructor
CIS 1300  01       LEC        MWF     09:30 AM - 10:20 AM   ROZH 104   Staff
    `.trim(),
    expectedCourse: "CIS 1300",
    expectedBuilding: "ROZH",
  },
  "uottawa-schedule": {
    name: "University of Ottawa (uoZone)",
    sample: `
Course    Section  Component  Days    Time                  Location   Instructor
CSI 2110  A        LEC        MW      10:00 AM - 11:30 AM   STE 0131   Staff
    `.trim(),
    expectedCourse: "CSI 2110",
    expectedBuilding: "STE",
  },
  "brock-schedule": {
    name: "Brock University (Student Self-Serve)",
    sample: `
Course     Section  Component  Days    Time                  Location   Instructor
COSC 1P02  01       LEC        MW      09:30 AM - 11:00 AM   ST 107     Staff
    `.trim(),
    expectedCourse: "COSC 1P02",
    expectedBuilding: "ST",
  },
};

const EXPECTED_DAYS = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

describe("Timetable Multi-University Golden Validation Suite (AND-211)", () => {
  test("all 11 production universities are registered and have corresponding adapters", () => {
    const universities = supportedUniversities();
    expect(universities.length).toBe(11);

    const adapterKeys = Object.keys(timetableAdapters);
    expect(adapterKeys.length).toBeGreaterThanOrEqual(11);

    for (const key of Object.keys(GOLDEN_FIXTURES)) {
      expect(timetableAdapters[key]).toBeDefined();
      expect(demoTimetableLoaders[key]).toBeDefined();
    }
  });

  for (const [adapterId, fixture] of Object.entries(GOLDEN_FIXTURES)) {
    describe(`Golden fixture: ${fixture.name} (${adapterId})`, () => {
      test("parses deterministically across multiple invocations", async () => {
        const parse = timetableAdapters[adapterId]!;
        const run1 = await parse(fixture.sample);
        const run2 = await parse(fixture.sample);

        expect(run1.meetings.length).toBeGreaterThan(0);
        expect(run1.meetings.length).toBe(run2.meetings.length);

        for (let i = 0; i < run1.meetings.length; i++) {
          const m1 = run1.meetings[i]!;
          const m2 = run2.meetings[i]!;
          expect(m1.courseCode).toBe(m2.courseCode);
          expect(m1.startTime).toBe(m2.startTime);
          expect(m1.endTime).toBe(m2.endTime);
          expect(m1.weekday).toBe(m2.weekday);
          expect(m1.buildingCode).toBe(m2.buildingCode);
          expect(m1.room).toBe(m2.room);
          expect(m1.universityId).toBe(m2.universityId);
        }
      });

      test("enforces strict time invariants (0 <= startTime < endTime <= 1440)", async () => {
        const parse = timetableAdapters[adapterId]!;
        const { meetings } = await parse(fixture.sample);

        for (const m of meetings) {
          expect(m.startTime).toBeGreaterThanOrEqual(0);
          expect(m.endTime).toBeLessThanOrEqual(1440);
          expect(m.startTime).toBeLessThan(m.endTime);
          // Standard university classes are at least 30 minutes and no longer than 4 hours
          const duration = m.endTime - m.startTime;
          expect(duration).toBeGreaterThanOrEqual(30);
          expect(duration).toBeLessThanOrEqual(240);
        }
      });

      test("normalizes valid weekday and recurrence", async () => {
        const parse = timetableAdapters[adapterId]!;
        const { meetings } = await parse(fixture.sample);

        for (const m of meetings) {
          expect(EXPECTED_DAYS.has(m.weekday)).toBe(true);
          expect(m.recurrenceIntervalWeeks).toBe(1);
        }
      });

      test("resolves building and room against canonical campus snapshot with zero cross-university leaks", async () => {
        const parse = timetableAdapters[adapterId]!;
        const { meetings } = await parse(fixture.sample);

        const meeting = meetings[0]!;
        expect(meeting.courseCode).toBe(fixture.expectedCourse);
        expect(meeting.buildingCode).toBe(fixture.expectedBuilding);

        // Verify zero cross-university identity leak:
        // Meeting's universityId must match adapter's university domain
        const targetUni = adapterId.replace("-schedule", "").replace("-ics", "");
        if (targetUni === "acorn") {
          expect(meeting.universityId === "uoft" || !meeting.universityId).toBe(true);
        } else {
          expect(meeting.universityId).toBe(targetUni);
        }

        // Campus building verification
        const campusId = meeting.campus?.toLowerCase();
        expect(campusId).toBeDefined();

        if (meeting.buildingCode) {
          const building = getCampusBuildingIdentity(campusId!, meeting.buildingCode);
          expect(building).toBeDefined();
        }
      });

      test("handles empty and malformed inputs gracefully without crashing", async () => {
        const parse = timetableAdapters[adapterId]!;

        if (adapterId === "acorn-ics") {
          await expect(parse("   \n\t  ")).rejects.toThrow();
          await expect(
            parse("Random unstructured text that contains no timetable data 12345"),
          ).rejects.toThrow();
        } else {
          // 1. Whitespace only
          const emptyResult = await parse("   \n\t  ");
          expect(emptyResult.meetings).toHaveLength(0);

          // 2. Junk text
          const junkResult = await parse(
            "Random unstructured text that contains no timetable data 12345",
          );
          expect(junkResult.meetings).toHaveLength(0);
        }
      });

      test("demo timetable loads canonical, valid academic meetings", async () => {
        const loader = demoTimetableLoaders[adapterId]!;
        const demoMeetings = await loader();

        expect(demoMeetings.length).toBeGreaterThan(0);

        for (const m of demoMeetings) {
          expect(m.courseCode).toBeTruthy();
          expect(m.startTime).toBeLessThan(m.endTime);
          expect(EXPECTED_DAYS.has(m.weekday)).toBe(true);
          expect(m.buildingCode).toBeDefined();
          if (adapterId !== "acorn-ics") {
            const targetUni = adapterId.replace("-schedule", "").replace("-ics", "");
            expect(m.universityId).toBe(targetUni);
          }
        }
      });
    });
  }
});
