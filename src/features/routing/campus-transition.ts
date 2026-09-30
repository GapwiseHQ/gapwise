import type { CampusSnapshot } from "@/data/campuses/contract";
import { carletonCampus } from "@/universities/carleton/adapter";
import { universityByCampus, universityById } from "@/universities/registry";
import { routeBetweenBuildings } from "./campus-outdoor-graph";
import type { TransitionPlanner } from "./transition";
import type { RoutePreferences, TransitionRoute } from "./types";
import type { Meeting } from "@/lib/timetable-types";

function unavailable(message: string): TransitionRoute {
  return {
    status: "unavailable",
    message,
    accuracy: "Location unavailable",
    result: null,
    displayCoordinates: [],
    warnings: [],
    approximateDistanceMeters: null,
    approximateSeconds: null,
  };
}

export function createOutdoorCampusTransitionPlanner(campus: CampusSnapshot): TransitionPlanner {
  const byCode = new Map<string, string>();
  for (const building of campus.buildings) {
    byCode.set(building.id.toUpperCase(), building.id);
    byCode.set(building.name.toUpperCase(), building.id);
    for (const code of building.nativeCodes) {
      byCode.set(code.toUpperCase(), building.id);
    }
  }

  const uni = universityById(campus.institution);
  const validCampuses = new Set<string>([
    campus.campus.id.toUpperCase(),
    campus.institution.toUpperCase(),
    ...(uni?.campuses.map((c) => c.toUpperCase()) ?? []),
    ...(uni ? [uni.id.toUpperCase(), uni.shortName.toUpperCase()] : []),
  ]);

  return function planOutdoorTransition(
    from: Meeting,
    to: Meeting,
    preferences: RoutePreferences,
  ): TransitionRoute {
    if (from.campus && to.campus && from.campus.toUpperCase() !== to.campus.toUpperCase()) {
      return unavailable("A mapped route requires both classes on the same campus.");
    }
    if (from.campus && !validCampuses.has(from.campus.toUpperCase())) {
      return unavailable("A mapped route requires both classes on the same campus.");
    }
    if (from.locationType !== "physical" || to.locationType !== "physical") {
      return unavailable("A physical route requires two known campus locations.");
    }
    const resolveId = (m: Meeting): string | null =>
      (m.buildingCode && byCode.get(m.buildingCode.toUpperCase())) ||
      (m.room && byCode.get(m.room.toUpperCase())) ||
      (m.sourceLocation && byCode.get(m.sourceLocation.toUpperCase())) ||
      null;
    const fromId = resolveId(from);
    const toId = resolveId(to);
    if (!fromId || !toId) {
      return unavailable("A mapped building is needed at each end of this route.");
    }
    if (preferences.mode === "step-free") {
      return unavailable("Step-free access has not been verified for this pedestrian network.");
    }
    const route = routeBetweenBuildings(fromId, toId, campus, preferences.walkingSpeedMps);
    if (route.status !== "ready") return unavailable(route.reason);
    const estimatedSeconds = route.distanceMeters / Math.max(0.5, preferences.walkingSpeedMps);
    const warnings = ["Outdoor path is mapped; entrance and indoor access may be unverified."];
    return {
      status: "routed",
      message: `${Math.max(1, Math.ceil(estimatedSeconds / 60))} min mapped outdoor walk`,
      accuracy: "Mapped campus path, indoor estimate",
      result: {
        nodes: [],
        edges: [],
        totalDistanceMeters: route.distanceMeters,
        indoorDistanceMeters: 0,
        outdoorDistanceMeters: route.distanceMeters,
        estimatedSeconds,
        floorChanges: 0,
        warnings,
        coordinates: route.coordinates,
      },
      displayCoordinates: route.coordinates,
      warnings,
      approximateDistanceMeters: null,
      approximateSeconds: null,
    };
  };
}

export const planOutdoorCampusTransition = createOutdoorCampusTransitionPlanner(carletonCampus);

export type CampusSnapshotLoader = () => Promise<CampusSnapshot>;

export const OUTDOOR_CAMPUS_LOADERS: Record<string, CampusSnapshotLoader> = {
  utsg: () =>
    import("@/data/campuses/utsg/campus.json").then((m) => m.default as unknown as CampusSnapshot),
  utsc: () =>
    import("@/data/campuses/utsc/campus.json").then((m) => m.default as unknown as CampusSnapshot),
  carleton: () =>
    import("@/data/campuses/carleton/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  tmu: () =>
    import("@/data/campuses/tmu/campus.json").then((m) => m.default as unknown as CampusSnapshot),
  queens: () =>
    import("@/data/campuses/queens/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  laurier: () =>
    import("@/data/campuses/laurier/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  york: () =>
    import("@/data/campuses/york/campus.json").then((m) => m.default as unknown as CampusSnapshot),
  mcmaster: () =>
    import("@/data/campuses/mcmaster/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  western: () =>
    import("@/data/campuses/western/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  guelph: () =>
    import("@/data/campuses/guelph/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  uottawa: () =>
    import("@/data/campuses/uottawa/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  brock: () =>
    import("@/data/campuses/brock/campus.json").then((m) => m.default as unknown as CampusSnapshot),
  "ubc-vancouver": () =>
    import("@/data/campuses/ubc/campus.json").then((m) => m.default as unknown as CampusSnapshot),
  "waterloo-main": () =>
    import("@/data/campuses/waterloo/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
};

const plannerCache = new Map<string, TransitionPlanner>();

export async function getOutdoorCampusTransitionPlanner(
  universityOrCampusId: string,
): Promise<TransitionPlanner | null> {
  const normalized = universityOrCampusId.toLowerCase();
  const university = universityById(normalized) ?? universityByCampus(normalized);
  const lookupKey = OUTDOOR_CAMPUS_LOADERS[normalized]
    ? normalized
    : (university?.defaultCampus ?? normalized);

  if (plannerCache.has(lookupKey)) {
    return plannerCache.get(lookupKey)!;
  }

  const loader = OUTDOOR_CAMPUS_LOADERS[lookupKey];
  if (!loader) return null;

  const campusSnapshot = await loader();
  const planner = createOutdoorCampusTransitionPlanner(campusSnapshot);
  plannerCache.set(lookupKey, planner);
  return planner;
}
