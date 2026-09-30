import type { InstitutionAdapter } from "../common/model";

export const waterloo: InstitutionAdapter = {
  id: "waterloo",
  name: "University of Waterloo",
  parseCourseCode(value) {
    const normalized = value
      .trim()
      .toUpperCase()
      .replace(/^([A-Z]{2,8})(\d{3}[A-Z]?)$/, "$1 $2")
      .replace(/\s+/g, " ");
    return /^[A-Z]{2,8} \d{3}[A-Z]?$/.test(normalized) ? normalized : null;
  },
  sectionLabel: "Section",
  componentLabel: "Component",
  publicScheduleUrl:
    "https://uwaterloo.ca/the-centre/quest/quest-help/how-do-i-view-my-class-schedule",
  mapUrl: "https://uwaterloo.ca/map/",
};
