import type { Campus } from "@/lib/timetable-types";

type CampusInferenceInput = {
  universityId: string;
  courseCode: string;
  sourceLocation?: string;
  summary?: string;
  description?: string;
  defaultCampusId: string;
};

type CampusRule = {
  campusId: string;
  fields: Array<"courseCode" | "sourceLocation" | "summary" | "description">;
  pattern: RegExp;
};

const RULES: Record<string, readonly CampusRule[]> = {
  ubc: [
    {
      campusId: "ubc-okanagan",
      fields: ["courseCode", "sourceLocation", "summary", "description"],
      pattern: /(?:\b[A-Z]{2,6}_O\b|\bUBCO\b|\bOkanagan\b|\bKelowna\b)/i,
    },
    {
      campusId: "ubc-vancouver",
      fields: ["courseCode", "sourceLocation", "summary", "description"],
      pattern: /(?:\b[A-Z]{2,6}_V\b|\bUBCV\b|\bPoint Grey\b|\bVancouver\b)/i,
    },
  ],
  york: [
    {
      campusId: "markham",
      fields: ["sourceLocation", "summary", "description"],
      pattern: /\b(?:Markham|MK campus|MKM)\b/i,
    },
    {
      campusId: "glendon",
      fields: ["sourceLocation", "summary", "description"],
      pattern: /\b(?:Glendon|GLDN|York Hall)\b/i,
    },
    {
      campusId: "keele",
      fields: ["sourceLocation", "summary", "description"],
      pattern: /\b(?:Keele|Bergeron|Lassonde|Vari Hall|Curtis Lecture)\b/i,
    },
  ],
};

function canonicalCampus(id: string): Campus {
  return id.toUpperCase() as Campus;
}

/**
 * Infer only from explicit export evidence. Single-campus editions can safely use their
 * registered campus; multi-campus schools stay UNKNOWN when rules conflict or have no match.
 */
export function inferImportedCampus(input: CampusInferenceInput): Campus {
  const rules = RULES[input.universityId] ?? [];
  if (!rules.length) return canonicalCampus(input.defaultCampusId);
  const matches = new Set(
    rules
      .filter((rule) => rule.fields.some((field) => rule.pattern.test(input[field] ?? "")))
      .map((rule) => rule.campusId),
  );
  return matches.size === 1 ? canonicalCampus([...matches][0]!) : "UNKNOWN";
}
