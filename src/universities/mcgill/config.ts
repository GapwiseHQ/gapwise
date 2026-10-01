import type { InstitutionAdapter } from "../common/model";

export const mcgill: InstitutionAdapter = {
  id: "mcgill",
  name: "McGill University",
  parseCourseCode(value) {
    const normalized = value
      .trim()
      .toUpperCase()
      .replace(/^([A-Z]{4})(\d{3}[A-Z]?)$/, "$1 $2")
      .replace(/\s+/g, " ");
    return /^[A-Z]{4} \d{3}[A-Z]?$/.test(normalized) ? normalized : null;
  },
  sectionLabel: "Section",
  componentLabel: "Activity",
  publicScheduleUrl:
    "https://teachingkb.mcgill.ca/tlk/organize-your-course-schedule-and-create-task-list",
  mapUrl: "https://maps.mcgill.ca/",
};
