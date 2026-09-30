import type { InstitutionAdapter } from "../common/model";

export const ubc: InstitutionAdapter = {
  id: "ubc",
  name: "University of British Columbia",
  parseCourseCode(value) {
    const normalized = value
      .trim()
      .toUpperCase()
      .replace(/^([A-Z]{2,6})_V\s*/, "$1 ")
      .replace(/^([A-Z]{2,6})(\d{3}[A-Z]?)$/, "$1 $2")
      .replace(/\s+/g, " ");
    return /^[A-Z]{2,6} \d{3}[A-Z]?$/.test(normalized) ? normalized : null;
  },
  sectionLabel: "Section",
  componentLabel: "Instructional format",
  publicScheduleUrl:
    "https://workday.students.ubc.ca/course-registration/viewing-the-course-schedule/",
  mapUrl: "https://planning.ubc.ca/about-us/campus-maps",
};
