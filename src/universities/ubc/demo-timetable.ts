import { createUniversityDemoSchedule } from "../common/demo-generator";
import type { Meeting } from "../common/model";

export const DEMO_UBC_MEETINGS: Meeting[] = createUniversityDemoSchedule("ubc", [
  {
    courseCode: "CPSC 110",
    courseName: "Computation, Programs, and Programming",
    nativeSection: "101",
    nativeComponentType: "LEC",
    days: ["MO", "WE"],
    startTime: "09:00",
    endTime: "10:00",
    nativeText: "ICCS X836",
    buildingId:
      "institute-for-computing-information-and-cognitive-systems-computer-science-building",
    room: "X836",
  },
  {
    courseCode: "ENGL 110",
    courseName: "Approaches to Literature and Culture",
    nativeSection: "002",
    nativeComponentType: "LEC",
    days: ["MO", "WE"],
    startTime: "12:00",
    endTime: "13:00",
    nativeText: "BUCH A101",
    buildingId: "buchanan-building",
    room: "A101",
  },
  {
    courseCode: "PHRM 100",
    courseName: "Foundations of Pharmacy",
    nativeSection: "001",
    nativeComponentType: "LEC",
    days: ["TU", "TH"],
    startTime: "10:00",
    endTime: "11:30",
    nativeText: "PHRM 1101",
    buildingId: "pharmaceutical-sciences-building",
    room: "1101",
  },
]);
