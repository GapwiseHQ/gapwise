import { UTM_BUILDINGS, type BuildingConfiguration } from "../utm/building-registry.js";
import residenceMatrix from "./generated/residence-coverage-matrix.json" with { type: "json" };

const CAMPUS_ALIASES: Record<string, string> = {
  york: "keele",
  laurier: "waterloo",
  main: "mcmaster",
};

export function canonicalCampusId(campusId: string): string {
  const normalized = campusId.trim().toLowerCase();
  return CAMPUS_ALIASES[normalized] ?? normalized;
}

export function campusResidenceBuildings(campusId: string): BuildingConfiguration[] {
  const canonicalId = canonicalCampusId(campusId);
  if (canonicalId === "utm") {
    return UTM_BUILDINGS.filter((building) => building.category === "residence");
  }
  const campus = residenceMatrix.campuses[canonicalId as keyof typeof residenceMatrix.campuses];
  if (!campus) return [];
  return campus.residences.map((r) => ({
    code: r.code,
    name: r.name,
    category: "residence" as const,
    aliases: r.aliases ?? [],
  }));
}

export function getResidenceBuildingForCampus(
  campusId: string,
  code: string | null | undefined,
): BuildingConfiguration | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return (
    campusResidenceBuildings(campusId).find(
      (building) =>
        building.code.toUpperCase() === normalized ||
        (building.aliases ?? []).some((a) => a.toUpperCase() === normalized),
    ) ?? null
  );
}
