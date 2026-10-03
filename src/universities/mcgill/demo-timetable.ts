import { createUniversityDemoSchedule } from "../common/demo-generator";
import type { Meeting } from "../common/model";

export const DEMO_MCGILL_MEETINGS: Meeting[] = createUniversityDemoSchedule("mcgill", [
  {
    courseCode: "COMP 202",
    courseName: "Foundations of Programming",
    nativeSection: "001",
    nativeComponentType: "LEC",
    days: ["MO", "WE"],
    startTime: "10:05",
    endTime: "11:25",
    nativeText: "LEA 132",
    buildingId: "leacock-building",
    room: "132",
  },
  {
    courseCode: "CHEM 110",
    courseName: "General Chemistry 1",
    nativeSection: "001",
    nativeComponentType: "LEC",
    days: ["TU", "TH"],
    startTime: "11:35",
    endTime: "12:55",
    nativeText: "MAASS 112",
    buildingId: "otto-maass-chemistry-building",
    room: "112",
  },
  {
    courseCode: "PHYS 101",
    courseName: "Introductory Physics",
    nativeSection: "001",
    nativeComponentType: "LEC",
    days: ["MO", "WE"],
    startTime: "13:05",
    endTime: "14:25",
    nativeText: "RPHYS 114",
    buildingId: "rutherford-physics-building",
    room: "114",
  },
]);
