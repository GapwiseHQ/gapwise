import type { CampusSnapshot } from "../../data/campuses/contract.js";
import { UTM_BUILDINGS, type BuildingConfiguration } from "../../data/utm/building-registry.js";
import brockSnapshot from "../../data/campuses/brock/campus.json" with { type: "json" };
import carletonSnapshot from "../../data/campuses/carleton/campus.json" with { type: "json" };
import guelphSnapshot from "../../data/campuses/guelph/campus.json" with { type: "json" };
import laurierSnapshot from "../../data/campuses/laurier/campus.json" with { type: "json" };
import mcmasterSnapshot from "../../data/campuses/mcmaster/campus.json" with { type: "json" };
import queensSnapshot from "../../data/campuses/queens/campus.json" with { type: "json" };
import tmuSnapshot from "../../data/campuses/tmu/campus.json" with { type: "json" };
import uottawaSnapshot from "../../data/campuses/uottawa/campus.json" with { type: "json" };
import westernSnapshot from "../../data/campuses/western/campus.json" with { type: "json" };
import yorkSnapshot from "../../data/campuses/york/campus.json" with { type: "json" };
import utsgSnapshot from "../../data/campuses/utsg/campus.json" with { type: "json" };
import utscSnapshot from "../../data/campuses/utsc/campus.json" with { type: "json" };
import ubcSnapshot from "../../data/campuses/ubc/campus.json" with { type: "json" };
import waterlooSnapshot from "../../data/campuses/waterloo/campus.json" with { type: "json" };

export const CAMPUS_SNAPSHOTS: Record<string, CampusSnapshot> = {
  utsg: utsgSnapshot as unknown as CampusSnapshot,
  utsc: utscSnapshot as unknown as CampusSnapshot,
  brock: brockSnapshot as unknown as CampusSnapshot,
  carleton: carletonSnapshot as unknown as CampusSnapshot,
  guelph: guelphSnapshot as unknown as CampusSnapshot,
  laurier: laurierSnapshot as unknown as CampusSnapshot,
  waterloo: laurierSnapshot as unknown as CampusSnapshot,
  mcmaster: mcmasterSnapshot as unknown as CampusSnapshot,
  queens: queensSnapshot as unknown as CampusSnapshot,
  tmu: tmuSnapshot as unknown as CampusSnapshot,
  uottawa: uottawaSnapshot as unknown as CampusSnapshot,
  western: westernSnapshot as unknown as CampusSnapshot,
  york: yorkSnapshot as unknown as CampusSnapshot,
  keele: yorkSnapshot as unknown as CampusSnapshot,
  "ubc-vancouver": ubcSnapshot as unknown as CampusSnapshot,
  "waterloo-main": waterlooSnapshot as unknown as CampusSnapshot,
};

export function getCampusSnapshot(campusId: string): CampusSnapshot | null {
  return CAMPUS_SNAPSHOTS[campusId.toLowerCase()] ?? null;
}

function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const CAMPUS_BUILDING_CONFIGURATIONS: Record<string, BuildingConfiguration[]> = {
  utm: UTM_BUILDINGS,
  ...Object.fromEntries(
    Object.entries(CAMPUS_SNAPSHOTS).map(([id, snapshot]) => [
      id,
      snapshot.buildings.map((b) => ({
        code: (b.nativeCodes[0] ?? b.id).toUpperCase(),
        name: b.name,
        category: (b.category === "residence" || b.category === "academic"
          ? b.category
          : "facility") as BuildingConfiguration["category"],
        aliases: unique([b.id, ...(b.aliases ?? []), ...b.nativeCodes.slice(1)]),
      })),
    ]),
  ),
};

export function campusBuildingConfigurations(campusId: string): BuildingConfiguration[] {
  return CAMPUS_BUILDING_CONFIGURATIONS[campusId.toLowerCase()] ?? [];
}

export function campusResidenceBuildings(campusId: string): BuildingConfiguration[] {
  return campusBuildingConfigurations(campusId).filter(
    (building) => building.category === "residence",
  );
}

export function getResidenceBuildingForCampus(
  campusId: string,
  code: string | null | undefined,
): BuildingConfiguration | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return (
    campusResidenceBuildings(campusId).find(
      (building) => building.code.toUpperCase() === normalized,
    ) ?? null
  );
}

export function getCampusBuildingIdentity(
  campusId: string,
  value: string | null,
): BuildingConfiguration | null {
  if (!value) return null;
  const normalized = normalizeText(value);
  const configs = campusBuildingConfigurations(campusId);
  return (
    configs.find((building) =>
      [building.code, building.name, ...(building.aliases ?? [])].some(
        (candidate) => normalizeText(candidate) === normalized,
      ),
    ) ?? null
  );
}

export type CampusEntranceInfo = {
  id: string;
  access: "public" | "restricted" | "unknown";
  metadata: {
    source: string;
    sourceUrl: string;
    lastVerified: string;
    verificationStatus: "verified" | "inferred";
  };
};

export function campusBuildingEntrances(
  campusId: string,
  code: string | null,
): CampusEntranceInfo[] {
  if (!code) return [];
  const snapshot = getCampusSnapshot(campusId);
  if (!snapshot) return [];
  const identity = getCampusBuildingIdentity(campusId, code);
  if (!identity) return [];
  const building = snapshot.buildings.find(
    (item) => (item.nativeCodes[0] ?? item.id).toUpperCase() === identity.code,
  );
  if (!building) return [];
  return snapshot.entrances
    .filter((entrance) => entrance.buildingId === building.id)
    .map((entrance) => {
      const provenance = entrance.provenance?.[0];
      const source = snapshot.sources.find((item) => item.id === provenance?.sourceId);
      return {
        id: entrance.id,
        access: entrance.access,
        metadata: {
          source: source?.attribution ?? source?.id ?? "Gapwise Data",
          sourceUrl: source?.url ?? "",
          lastVerified: "",
          verificationStatus:
            provenance?.verification === "inferred" ? ("inferred" as const) : ("verified" as const),
        },
      };
    });
}
