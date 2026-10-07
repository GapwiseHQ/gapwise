import type { CampusSnapshot } from "@/data/campuses/contract";
import { carletonCampus } from "@/universities/carleton/adapter";
import { campusById, universityByCampus, universityById } from "@/universities/registry";
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
  waterloo: () =>
    import("@/data/campuses/waterloo/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  york: () =>
    import("@/data/campuses/york/campus.json").then((m) => m.default as unknown as CampusSnapshot),
  keele: () =>
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
  ubc: () =>
    import("@/data/campuses/ubc/campus.json").then((m) => m.default as unknown as CampusSnapshot),
  "waterloo-main": () =>
    import("@/data/campuses/waterloo/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "mcgill-downtown": () =>
    import("@/data/campuses/mcgill/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  mcgill: () =>
    import("@/data/campuses/mcgill/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  glendon: () =>
    import("@/data/campuses/glendon/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  markham: () =>
    import("@/data/campuses/markham/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "ubc-okanagan": () =>
    import("@/data/campuses/ubc-okanagan/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "cmu-pittsburgh": () =>
    import("@/data/campuses/cmu-pittsburgh/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "ucberkeley-main": () =>
    import("@/data/campuses/ucberkeley-main/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "nyu-washington-square": () =>
    import("@/data/campuses/nyu-washington-square/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "mit-cambridge": () =>
    import("@/data/campuses/mit-cambridge/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "stanford-main": () =>
    import("@/data/campuses/stanford-main/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "upenn-philadelphia": () =>
    import("@/data/campuses/upenn-philadelphia/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "cornell-ithaca": () =>
    import("@/data/campuses/cornell-ithaca/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "dartmouth-hanover": () =>
    import("@/data/campuses/dartmouth-hanover/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "brown-providence": () =>
    import("@/data/campuses/brown-providence/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "columbia-morningside": () =>
    import("@/data/campuses/columbia-morningside/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "princeton-main": () =>
    import("@/data/campuses/princeton-main/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "yale-new-haven": () =>
    import("@/data/campuses/yale-new-haven/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "harvard-cambridge": () =>
    import("@/data/campuses/harvard-cambridge/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "carleton-dominion-chalmers": () =>
    import("@/data/campuses/carleton-dominion-chalmers/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "tmu-brampton": () =>
    import("@/data/campuses/tmu-brampton/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "queens-west": () =>
    import("@/data/campuses/queens-west/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "laurier-brantford": () =>
    import("@/data/campuses/laurier-brantford/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "laurier-milton": () =>
    import("@/data/campuses/laurier-milton/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "mcmaster-burlington": () =>
    import("@/data/campuses/mcmaster-burlington/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "western-huron": () =>
    import("@/data/campuses/western-huron/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "western-kings": () =>
    import("@/data/campuses/western-kings/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "guelph-ridgetown": () =>
    import("@/data/campuses/guelph-ridgetown/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "guelph-humber": () =>
    import("@/data/campuses/guelph-humber/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "uottawa-alta-vista": () =>
    import("@/data/campuses/uottawa-alta-vista/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "brock-miw": () =>
    import("@/data/campuses/brock-miw/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "waterloo-cambridge": () =>
    import("@/data/campuses/waterloo-cambridge/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "waterloo-kitchener": () =>
    import("@/data/campuses/waterloo-kitchener/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "waterloo-stratford": () =>
    import("@/data/campuses/waterloo-stratford/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "mcgill-macdonald": () =>
    import("@/data/campuses/mcgill-macdonald/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "cmu-silicon-valley": () =>
    import("@/data/campuses/cmu-silicon-valley/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "ucberkeley-richmond": () =>
    import("@/data/campuses/ucberkeley-richmond/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "nyu-brooklyn": () =>
    import("@/data/campuses/nyu-brooklyn/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "mit-lincoln-lab": () =>
    import("@/data/campuses/mit-lincoln-lab/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "stanford-redwood-city": () =>
    import("@/data/campuses/stanford-redwood-city/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "upenn-pennovation": () =>
    import("@/data/campuses/upenn-pennovation/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "upenn-new-bolton": () =>
    import("@/data/campuses/upenn-new-bolton/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "cornell-tech": () =>
    import("@/data/campuses/cornell-tech/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "cornell-weill": () =>
    import("@/data/campuses/cornell-weill/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "dartmouth-lebanon": () =>
    import("@/data/campuses/dartmouth-lebanon/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "brown-jewelry-district": () =>
    import("@/data/campuses/brown-jewelry-district/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "columbia-manhattanville": () =>
    import("@/data/campuses/columbia-manhattanville/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "columbia-cuimc": () =>
    import("@/data/campuses/columbia-cuimc/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "princeton-forrestal": () =>
    import("@/data/campuses/princeton-forrestal/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "princeton-meadows": () =>
    import("@/data/campuses/princeton-meadows/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "yale-medical": () =>
    import("@/data/campuses/yale-medical/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "yale-west": () =>
    import("@/data/campuses/yale-west/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "harvard-allston": () =>
    import("@/data/campuses/harvard-allston/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "harvard-longwood": () =>
    import("@/data/campuses/harvard-longwood/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  cmu: () =>
    import("@/data/campuses/cmu-pittsburgh/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  ucberkeley: () =>
    import("@/data/campuses/ucberkeley-main/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  nyu: () =>
    import("@/data/campuses/nyu-washington-square/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  mit: () =>
    import("@/data/campuses/mit-cambridge/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  stanford: () =>
    import("@/data/campuses/stanford-main/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  upenn: () =>
    import("@/data/campuses/upenn-philadelphia/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  cornell: () =>
    import("@/data/campuses/cornell-ithaca/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  dartmouth: () =>
    import("@/data/campuses/dartmouth-hanover/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  brown: () =>
    import("@/data/campuses/brown-providence/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  columbia: () =>
    import("@/data/campuses/columbia-morningside/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  princeton: () =>
    import("@/data/campuses/princeton-main/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  yale: () =>
    import("@/data/campuses/yale-new-haven/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  harvard: () =>
    import("@/data/campuses/harvard-cambridge/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "sorbonne-pierre-et-marie-curie": () =>
    import("@/data/campuses/sorbonne-pierre-et-marie-curie/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  sorbonne: () =>
    import("@/data/campuses/sorbonne-pierre-et-marie-curie/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  oxford: () =>
    import("@/data/campuses/oxford/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  cambridge: () =>
    import("@/data/campuses/cambridge/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "imperial-south-kensington": () =>
    import("@/data/campuses/imperial-south-kensington/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "imperial-white-city": () =>
    import("@/data/campuses/imperial-white-city/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  imperial: () =>
    import("@/data/campuses/imperial-south-kensington/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "ethz-zentrum": () =>
    import("@/data/campuses/ethz-zentrum/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "ethz-hoenggerberg": () =>
    import("@/data/campuses/ethz-hoenggerberg/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  ethz: () =>
    import("@/data/campuses/ethz-zentrum/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  caltech: () =>
    import("@/data/campuses/caltech/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "jhu-homewood": () =>
    import("@/data/campuses/jhu-homewood/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "jhu-east-baltimore": () =>
    import("@/data/campuses/jhu-east-baltimore/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  jhu: () =>
    import("@/data/campuses/jhu-homewood/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  epfl: () =>
    import("@/data/campuses/epfl/campus.json").then((m) => m.default as unknown as CampusSnapshot),
  "ucl-bloomsbury": () =>
    import("@/data/campuses/ucl-bloomsbury/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "ucl-east": () =>
    import("@/data/campuses/ucl-east/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  ucl: () =>
    import("@/data/campuses/ucl-bloomsbury/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "utokyo-hongo": () =>
    import("@/data/campuses/utokyo-hongo/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "utokyo-komaba": () =>
    import("@/data/campuses/utokyo-komaba/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  "utokyo-kashiwa": () =>
    import("@/data/campuses/utokyo-kashiwa/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  utokyo: () =>
    import("@/data/campuses/utokyo-hongo/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
  tsinghua: () =>
    import("@/data/campuses/tsinghua/campus.json").then(
      (m) => m.default as unknown as CampusSnapshot,
    ),
};

const plannerCache = new Map<string, TransitionPlanner>();

export function outdoorCampusLoaderKey(
  universityOrCampusId: string,
  campusId?: string | null,
): string {
  const normalized = universityOrCampusId.toLowerCase();
  const university = universityById(normalized) ?? universityByCampus(normalized);
  const campus = campusId?.toLowerCase();
  // Campus-scoped lookup: only honour a campus that belongs to the resolved university.
  // A university's default campus routes through the university key (e.g. Laurier's
  // "waterloo" campus -> "laurier"), which avoids the Waterloo/Laurier ID collision.
  if (campus && university && university.campuses.includes(campus)) {
    if (campus === university.defaultCampus && OUTDOOR_CAMPUS_LOADERS[university.id])
      return university.id;
    if (OUTDOOR_CAMPUS_LOADERS[campus]) return campus;
  }
  return OUTDOOR_CAMPUS_LOADERS[normalized]
    ? normalized
    : university?.defaultCampus && OUTDOOR_CAMPUS_LOADERS[university.defaultCampus]
      ? university.defaultCampus
      : university?.id && OUTDOOR_CAMPUS_LOADERS[university.id]
        ? university.id
        : normalized;
}

export async function getOutdoorCampusTransitionPlanner(
  universityOrCampusId: string,
  campusId?: string | null,
): Promise<TransitionPlanner | null> {
  const lookupKey = outdoorCampusLoaderKey(universityOrCampusId, campusId);

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
