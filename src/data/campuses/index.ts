import type { BuildingConfiguration } from "../utm/building-registry.js";
import { getCampusBuilding, type BuildingEntrance } from "../utm/routing-buildings.js";
import { UTM_BUILDINGS } from "../utm/building-registry.js";
import {
  CAMPUS_BUILDING_FOOTPRINTS as UTM_FOOTPRINTS,
  buildingCodeAtCoordinate as utmBuildingCodeAtCoordinate,
  getCampusBuildingFootprint as getUtmBuildingFootprint,
  representativePointForFootprint as representativeUtmPoint,
  type FootprintCoordinate,
} from "../utm/building-footprints.js";
import type { Campus } from "../../lib/timetable-types.js";
import manifest from "../../../universities.json" with { type: "json" };
import utsgBuildingsRaw from "./utsg/buildings.json?raw";
import utsgFootprintsRaw from "./utsg/buildings.geojson?raw";
import utscBuildingsRaw from "./utsc/buildings.json?raw";
import utscFootprintsRaw from "./utsc/buildings.geojson?raw";
import carletonCatalogRaw from "./carleton/catalog.json?raw";
import tmuCatalogRaw from "./tmu/catalog.json?raw";
import queensCatalogRaw from "./queens/catalog.json?raw";
import laurierCatalogRaw from "./laurier/catalog.json?raw";
import yorkCatalogRaw from "./york/catalog.json?raw";
import mcmasterCatalogRaw from "./mcmaster/catalog.json?raw";
import westernCatalogRaw from "./western/catalog.json?raw";
import guelphCatalogRaw from "./guelph/catalog.json?raw";
import uottawaCatalogRaw from "./uottawa/catalog.json?raw";
import brockCatalogRaw from "./brock/catalog.json?raw";

const universityCatalogRaw: Record<string, string> = {
  carleton: carletonCatalogRaw,
  tmu: tmuCatalogRaw,
  queens: queensCatalogRaw,
  waterloo: laurierCatalogRaw,
  laurier: laurierCatalogRaw,
  keele: yorkCatalogRaw,
  york: yorkCatalogRaw,
  main: mcmasterCatalogRaw,
  mcmaster: mcmasterCatalogRaw,
  western: westernCatalogRaw,
  guelph: guelphCatalogRaw,
  uottawa: uottawaCatalogRaw,
  brock: brockCatalogRaw,
  // GAPWISE_CAMPUS_CATALOG_REGISTRY: the CLI inserts new catalog imports here.
};

export type GapwiseCampusId = string;

type ExternalBuildingRecord = {
  id: string;
  campus: string;
  code: string;
  name: string;
  category: "academic" | "residence" | "facility";
  aliases?: string[];
  timetableCodes?: string[];
  facilityCodes?: string[];
  status?: string;
};

type ExternalRegistry = {
  campus: string;
  generatedAt: string;
  buildings: ExternalBuildingRecord[];
};

export type CampusFootprintGeometry =
  | { type: "Polygon"; coordinates: FootprintCoordinate[][] }
  | { type: "MultiPolygon"; coordinates: FootprintCoordinate[][][] };

export type CampusFootprintFeature = {
  type: "Feature";
  id?: string;
  properties: {
    campus?: GapwiseCampusId;
    buildingId?: string;
    buildingCode: string;
    name: string;
    timetableCodes?: string[];
    facilityCodes?: string[];
    verificationStatus?: string;
    [key: string]: unknown;
  };
  geometry: CampusFootprintGeometry;
};

export type CampusFootprintCollection = {
  type: "FeatureCollection";
  features: CampusFootprintFeature[];
  [key: string]: unknown;
};

const utsgRegistry = JSON.parse(utsgBuildingsRaw) as ExternalRegistry;
const utscRegistry = JSON.parse(utscBuildingsRaw) as ExternalRegistry;
const utsgFootprints = JSON.parse(utsgFootprintsRaw) as CampusFootprintCollection;
const utscFootprints = JSON.parse(utscFootprintsRaw) as CampusFootprintCollection;

type UniversityCatalog = {
  campus?: { bounds?: [[number, number], [number, number]] | null };
  sources: Array<{ id: string; title: string; url: string; retrievedAt: string }>;
  buildings: Array<{
    id: string;
    name: string;
    nativeCodes: string[];
    aliases: string[];
    category?: "academic" | "residence" | "facility";
    geometry: CampusFootprintGeometry | null;
  }>;
  entrances: Array<{
    id: string;
    buildingId: string;
    coordinate: [number, number];
    pathNodeId: string;
    access: BuildingEntrance["access"];
    provenance: Array<{
      sourceId: string;
      verification: "source-backed" | "field-reviewed" | "inferred";
    }>;
  }>;
};
const universityCatalogs: Record<string, UniversityCatalog> = Object.fromEntries(
  Object.entries(universityCatalogRaw).map(([id, raw]) => [
    id,
    JSON.parse(raw) as UniversityCatalog,
  ]),
);

const EXTERNAL_REGISTRIES: Record<string, ExternalRegistry> = {
  utsg: utsgRegistry,
  utsc: utscRegistry,
  ...Object.fromEntries(
    Object.entries(universityCatalogs).map(([campus, catalog]) => [
      campus,
      {
        campus,
        generatedAt: "",
        buildings: catalog.buildings.map((building) => ({
          id: building.id,
          campus,
          code: building.nativeCodes[0] ?? building.id,
          name: building.name,
          category: (building.category ?? "facility") as "academic" | "residence" | "facility",
          aliases: [building.id, ...building.aliases, ...building.nativeCodes.slice(1)],
        })),
      },
    ]),
  ),
};

const EXTERNAL_FOOTPRINTS: Record<string, CampusFootprintCollection> = {
  utsg: utsgFootprints,
  utsc: utscFootprints,
  ...Object.fromEntries(
    Object.entries(universityCatalogs).map(([campus, catalog]) => [
      campus,
      {
        type: "FeatureCollection" as const,
        features: catalog.buildings.flatMap((building) =>
          building.geometry
            ? [
                {
                  type: "Feature" as const,
                  id: building.id,
                  properties: {
                    campus,
                    buildingId: building.id,
                    buildingCode: building.nativeCodes[0] ?? building.id,
                    name: building.name,
                  },
                  geometry: building.geometry,
                },
              ]
            : [],
        ),
      },
    ]),
  ),
};

const CAMPUS_FALLBACK_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  utm: [
    [-79.6765, 43.5415],
    [-79.6535, 43.5585],
  ],
  utsg: [
    [-79.4215, 43.645],
    [-79.365, 43.6825],
  ],
  utsc: [
    [-79.205, 43.772],
    [-79.165, 43.7995],
  ],
  carleton: [
    [-75.705, 45.38],
    [-75.688, 45.394],
  ],
  tmu: [
    [-79.385, 43.654],
    [-79.373, 43.662],
  ],
  queens: [
    [-76.502, 44.221],
    [-76.49, 44.232],
  ],
  waterloo: [
    [-80.536, 43.47],
    [-80.523, 43.479],
  ],
  keele: [
    [-79.515, 43.766],
    [-79.493, 43.782],
  ],
  glendon: [
    [-79.385, 43.723],
    [-79.372, 43.732],
  ],
  markham: [
    [-79.331, 43.847],
    [-79.318, 43.856],
  ],
  mcmaster: [
    [-79.932, 43.256],
    [-79.91, 43.268],
  ],
  western: [
    [-81.285, 43],
    [-81.265, 43.018],
  ],
  guelph: [
    [-80.235, 43.524],
    [-80.215, 43.538],
  ],
  uottawa: [
    [-75.69, 45.416],
    [-75.674, 45.426],
  ],
  brock: [
    [-79.256, 43.112],
    [-79.24, 43.125],
  ],
  "ubc-vancouver": [
    [-123.2622191, 49.2417041],
    [-123.2264828, 49.2730726],
  ],
  "ubc-okanagan": [
    [-119.402, 49.935],
    [-119.388, 49.944],
  ],
  "waterloo-main": [
    [-80.558, 43.462],
    [-80.522, 43.493],
  ],
  "mcgill-downtown": [
    [-73.584, 45.499],
    [-73.57, 45.514],
  ],
  "cmu-pittsburgh": [
    [-79.949, 40.439],
    [-79.938, 40.448],
  ],
  "ucberkeley-main": [
    [-122.265, 37.867],
    [-122.252, 37.876],
  ],
  "nyu-washington-square": [
    [-74.003, 40.725],
    [-73.99, 40.734],
  ],
  "mit-cambridge": [
    [-71.1, 42.355],
    [-71.087, 42.364],
  ],
  "stanford-main": [
    [-122.176, 37.423],
    [-122.163, 37.432],
  ],
  "upenn-philadelphia": [
    [-75.2, 39.948],
    [-75.187, 39.957],
  ],
  "cornell-ithaca": [
    [-76.489, 42.444],
    [-76.476, 42.453],
  ],
  "dartmouth-hanover": [
    [-72.295, 43.7],
    [-72.282, 43.709],
  ],
  "brown-providence": [
    [-71.409, 41.822],
    [-71.396, 41.831],
  ],
  "columbia-morningside": [
    [-73.969, 40.803],
    [-73.956, 40.812],
  ],
  "princeton-main": [
    [-74.663, 40.344],
    [-74.65, 40.353],
  ],
  "yale-new-haven": [
    [-72.933, 41.307],
    [-72.92, 41.316],
  ],
  "harvard-cambridge": [
    [-71.123, 42.371],
    [-71.11, 42.38],
  ],
  "carleton-dominion-chalmers": [
    [-75.702, 45.4135],
    [-75.694, 45.4195],
  ],
  "tmu-brampton": [
    [-79.728, 43.713],
    [-79.717, 43.722],
  ],
  "queens-west": [
    [-76.524, 44.221],
    [-76.509, 44.23],
  ],
  "laurier-brantford": [
    [-80.27, 43.135],
    [-80.259, 43.144],
  ],
  "laurier-milton": [
    [-79.872, 43.483],
    [-79.859, 43.493],
  ],
  "mcmaster-burlington": [
    [-79.775, 43.36],
    [-79.763, 43.369],
  ],
  "western-huron": [
    [-81.286, 43.003],
    [-81.274, 43.012],
  ],
  "western-kings": [
    [-81.264, 43.008],
    [-81.252, 43.017],
  ],
  "guelph-ridgetown": [
    [-81.886, 42.441],
    [-81.873, 42.45],
  ],
  "guelph-humber": [
    [-79.612, 43.724],
    [-79.6, 43.733],
  ],
  "uottawa-alta-vista": [
    [-75.658, 45.398],
    [-75.645, 45.407],
  ],
  "brock-miw": [
    [-79.249, 43.154],
    [-79.238, 43.163],
  ],
  "waterloo-cambridge": [
    [-80.323, 43.355],
    [-80.312, 43.363],
  ],
  "waterloo-kitchener": [
    [-80.505, 43.449],
    [-80.494, 43.458],
  ],
  "waterloo-stratford": [
    [-80.982, 43.366],
    [-80.971, 43.375],
  ],
  "mcgill-macdonald": [
    [-73.949, 45.402],
    [-73.936, 45.411],
  ],
  "cmu-silicon-valley": [
    [-122.068, 37.406],
    [-122.056, 37.415],
  ],
  "ucberkeley-richmond": [
    [-122.339, 37.911],
    [-122.326, 37.92],
  ],
  "nyu-brooklyn": [
    [-73.992, 40.69],
    [-73.981, 40.699],
  ],
  "mit-lincoln-lab": [
    [-71.275, 42.454],
    [-71.263, 42.463],
  ],
  "stanford-redwood-city": [
    [-122.222, 37.484],
    [-122.209, 37.493],
  ],
  "upenn-pennovation": [
    [-75.208, 39.936],
    [-75.195, 39.945],
  ],
  "upenn-new-bolton": [
    [-75.789, 39.847],
    [-75.776, 39.856],
  ],
  "cornell-tech": [
    [-73.962, 40.751],
    [-73.949, 40.76],
  ],
  "cornell-weill": [
    [-73.96, 40.761],
    [-73.948, 40.769],
  ],
  "dartmouth-lebanon": [
    [-72.28, 43.67],
    [-72.262, 43.68],
  ],
  "brown-jewelry-district": [
    [-71.416, 41.815],
    [-71.403, 41.824],
  ],
  "columbia-manhattanville": [
    [-73.965, 40.813],
    [-73.952, 40.822],
  ],
  "columbia-cuimc": [
    [-73.948, 40.838],
    [-73.935, 40.847],
  ],
  "princeton-forrestal": [
    [-74.611, 40.347],
    [-74.598, 40.356],
  ],
  "princeton-meadows": [
    [-74.653, 40.335],
    [-74.64, 40.344],
  ],
  "yale-medical": [
    [-72.941, 41.299],
    [-72.928, 41.308],
  ],
  "yale-west": [
    [-72.996, 41.254],
    [-72.983, 41.263],
  ],
  "harvard-allston": [
    [-71.134, 42.36],
    [-71.121, 42.369],
  ],
  "harvard-longwood": [
    [-71.11, 42.332],
    [-71.097, 42.341],
  ],
  sorbonne: [
    [2.353, 48.8445],
    [2.3615, 48.8495],
  ],
  "sorbonne-pierre-et-marie-curie": [
    [2.353, 48.8445],
    [2.3615, 48.8495],
  ],
  "sorbonne-sorbonne": [
    [2.341, 48.8465],
    [2.3465, 48.8505],
  ],
  "sorbonne-pitie-salpetriere": [
    [2.359, 48.834],
    [2.3695, 48.842],
  ],
  "sorbonne-saint-antoine": [
    [2.382, 48.847],
    [2.389, 48.852],
  ],
  "sorbonne-cordeliers": [
    [2.3395, 48.8495],
    [2.344, 48.8525],
  ],
  "sorbonne-clignancourt": [
    [2.343, 48.896],
    [2.35, 48.9005],
  ],
  "sorbonne-malesherbes": [
    [2.306, 48.8815],
    [2.3115, 48.8855],
  ],
  ...Object.fromEntries(
    Object.entries(universityCatalogs)
      .filter(([, catalog]) => catalog.campus?.bounds)
      .map(([id, catalog]) => [id, catalog.campus!.bounds!]),
  ),
};

export const CAMPUS_LABELS: Record<string, string> = {
  ...Object.fromEntries(manifest.campuses.map((campus) => [campus.id, campus.name])),
};

export const CAMPUS_SHORT_LABELS: Record<string, string> = {
  ...Object.fromEntries(manifest.campuses.map((campus) => [campus.id, campus.shortName])),
};

const SUPPORTED_CAMPUS_IDS = new Set<string>(
  manifest.campuses
    .filter((candidate) => candidate.status === "supported")
    .map((candidate) => candidate.id),
);

export function gapwiseCampusIdForCampus(campus: Campus | undefined): GapwiseCampusId | null {
  const id = campus?.toLowerCase();
  return id && (id in CONFIGURATIONS || SUPPORTED_CAMPUS_IDS.has(id))
    ? (id as GapwiseCampusId)
    : null;
}

function normalizeText(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[,._]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))];
}

// U of T Student Life's current St. George residence map groups these canonical
// buildings as student residences. Some are mixed-use college buildings, so residence
// membership is intentionally kept separate from the single building category field.
// Source: https://studentlife.utoronto.ca/wp-content/uploads/Housing-Map.pdf
const UTSG_RESIDENCE_CODES = new Set([
  "013", // Whitney Hall
  "029", // Sir Daniel Wilson Residence
  "064", // Graduate House
  "101", // Morrison Hall
  "131", // New College III / 45 Willcocks
  "133", // Innis College Student Residence
  "158", // Chestnut Residence
  "505", // Burwash Residence (Lower Houses)
  "505A", // Burwash Residence (Upper Houses)
  "506", // Annesley Hall
  "508", // Margaret Addison Hall
  "518", // Rowell Jackman Hall
  "575", // Knox College
  "608", // St. Hilda's College
  "790", // University Family Housing, 30 Charles
  "791", // University Family Housing, 35 Charles
  "BR", // Brennan Hall, St. Michael's College
  "TC", // Trinity College
  "WE", // Wetmore Hall
  "WI", // Wilson Hall
  "WO", // Woodsworth College Residence
]);

function externalConfigurations(campusId: string): BuildingConfiguration[] {
  return (EXTERNAL_REGISTRIES[campusId]?.buildings ?? [])
    .filter((building) => building.status !== "inactive")
    .map((building) => ({
      code: building.code.toUpperCase(),
      name: building.name,
      category:
        campusId === "utsg" && UTSG_RESIDENCE_CODES.has(building.code)
          ? ("residence" as const)
          : building.category,
      aliases: unique([
        ...(building.aliases ?? []),
        ...(building.timetableCodes ?? []),
        ...(building.facilityCodes ?? []),
      ]),
    }));
}

const CONFIGURATIONS: Record<string, BuildingConfiguration[]> = {
  utm: UTM_BUILDINGS,
  utsg: externalConfigurations("utsg"),
  utsc: externalConfigurations("utsc"),
  ...Object.fromEntries(
    Object.keys(universityCatalogs).map((id) => [id, externalConfigurations(id)]),
  ),
};

function registerUniversityCatalog(campusId: string, catalog: UniversityCatalog) {
  universityCatalogs[campusId] = catalog;
  EXTERNAL_REGISTRIES[campusId] = {
    campus: campusId,
    generatedAt: "",
    buildings: catalog.buildings.map((building) => ({
      id: building.id,
      campus: campusId,
      code: building.nativeCodes[0] ?? building.id,
      name: building.name,
      category: building.category ?? "facility",
      aliases: [building.id, ...building.aliases, ...building.nativeCodes.slice(1)],
    })),
  };
  EXTERNAL_FOOTPRINTS[campusId] = {
    type: "FeatureCollection",
    features: catalog.buildings.flatMap((building) =>
      building.geometry
        ? [
            {
              type: "Feature" as const,
              id: building.id,
              properties: {
                campus: campusId,
                buildingId: building.id,
                buildingCode: building.nativeCodes[0] ?? building.id,
                name: building.name,
              },
              geometry: building.geometry,
            },
          ]
        : [],
    ),
  };
  if (catalog.campus?.bounds) CAMPUS_FALLBACK_BOUNDS[campusId] = catalog.campus.bounds;
  CONFIGURATIONS[campusId] = externalConfigurations(campusId);
}

const campusCatalogLoads = new Map<string, Promise<void>>();

/** Load large, edition-specific map/search data before rendering that campus. */
export function ensureCampusCatalog(campusId: string | null | undefined): Promise<void> {
  if (!campusId) return Promise.resolve();
  const normalized = campusId.toLowerCase();
  const campusRecord = manifest.campuses.find((entry) => entry.id === normalized);
  const universityRecord = manifest.universities.find((entry) => entry.id === normalized);
  const canonicalId = campusRecord?.id ?? universityRecord?.defaultCampus ?? normalized;
  if (universityCatalogs[canonicalId] || canonicalId === "utm") return Promise.resolve();
  const existing = campusCatalogLoads.get(canonicalId);
  if (existing) return existing;
  const catalogLoaders: Record<string, () => Promise<{ default: string }>> = {
    "ubc-vancouver": () => import("./ubc/catalog.json?raw"),
    "waterloo-main": () => import("./waterloo/catalog.json?raw"),
    "mcgill-downtown": () => import("./mcgill/catalog.json?raw"),
    glendon: () => import("./glendon/catalog.json?raw"),
    markham: () => import("./markham/catalog.json?raw"),
    "ubc-okanagan": () => import("./ubc-okanagan/catalog.json?raw"),
    "cmu-pittsburgh": () => import("./cmu-pittsburgh/catalog.json?raw"),
    "ucberkeley-main": () => import("./ucberkeley-main/catalog.json?raw"),
    "nyu-washington-square": () => import("./nyu-washington-square/catalog.json?raw"),
    "mit-cambridge": () => import("./mit-cambridge/catalog.json?raw"),
    "stanford-main": () => import("./stanford-main/catalog.json?raw"),
    "upenn-philadelphia": () => import("./upenn-philadelphia/catalog.json?raw"),
    "cornell-ithaca": () => import("./cornell-ithaca/catalog.json?raw"),
    "dartmouth-hanover": () => import("./dartmouth-hanover/catalog.json?raw"),
    "brown-providence": () => import("./brown-providence/catalog.json?raw"),
    "columbia-morningside": () => import("./columbia-morningside/catalog.json?raw"),
    "princeton-main": () => import("./princeton-main/catalog.json?raw"),
    "yale-new-haven": () => import("./yale-new-haven/catalog.json?raw"),
    "harvard-cambridge": () => import("./harvard-cambridge/catalog.json?raw"),
    "carleton-dominion-chalmers": () => import("./carleton-dominion-chalmers/catalog.json?raw"),
    "tmu-brampton": () => import("./tmu-brampton/catalog.json?raw"),
    "queens-west": () => import("./queens-west/catalog.json?raw"),
    "laurier-brantford": () => import("./laurier-brantford/catalog.json?raw"),
    "laurier-milton": () => import("./laurier-milton/catalog.json?raw"),
    "mcmaster-burlington": () => import("./mcmaster-burlington/catalog.json?raw"),
    "western-huron": () => import("./western-huron/catalog.json?raw"),
    "western-kings": () => import("./western-kings/catalog.json?raw"),
    "guelph-ridgetown": () => import("./guelph-ridgetown/catalog.json?raw"),
    "guelph-humber": () => import("./guelph-humber/catalog.json?raw"),
    "uottawa-alta-vista": () => import("./uottawa-alta-vista/catalog.json?raw"),
    "brock-miw": () => import("./brock-miw/catalog.json?raw"),
    "waterloo-cambridge": () => import("./waterloo-cambridge/catalog.json?raw"),
    "waterloo-kitchener": () => import("./waterloo-kitchener/catalog.json?raw"),
    "waterloo-stratford": () => import("./waterloo-stratford/catalog.json?raw"),
    "mcgill-macdonald": () => import("./mcgill-macdonald/catalog.json?raw"),
    "cmu-silicon-valley": () => import("./cmu-silicon-valley/catalog.json?raw"),
    "ucberkeley-richmond": () => import("./ucberkeley-richmond/catalog.json?raw"),
    "nyu-brooklyn": () => import("./nyu-brooklyn/catalog.json?raw"),
    "mit-lincoln-lab": () => import("./mit-lincoln-lab/catalog.json?raw"),
    "stanford-redwood-city": () => import("./stanford-redwood-city/catalog.json?raw"),
    "upenn-pennovation": () => import("./upenn-pennovation/catalog.json?raw"),
    "upenn-new-bolton": () => import("./upenn-new-bolton/catalog.json?raw"),
    "cornell-tech": () => import("./cornell-tech/catalog.json?raw"),
    "cornell-weill": () => import("./cornell-weill/catalog.json?raw"),
    "dartmouth-lebanon": () => import("./dartmouth-lebanon/catalog.json?raw"),
    "brown-jewelry-district": () => import("./brown-jewelry-district/catalog.json?raw"),
    "columbia-manhattanville": () => import("./columbia-manhattanville/catalog.json?raw"),
    "columbia-cuimc": () => import("./columbia-cuimc/catalog.json?raw"),
    "princeton-forrestal": () => import("./princeton-forrestal/catalog.json?raw"),
    "princeton-meadows": () => import("./princeton-meadows/catalog.json?raw"),
    "yale-medical": () => import("./yale-medical/catalog.json?raw"),
    "yale-west": () => import("./yale-west/catalog.json?raw"),
    "harvard-allston": () => import("./harvard-allston/catalog.json?raw"),
    "harvard-longwood": () => import("./harvard-longwood/catalog.json?raw"),
    sorbonne: () => import("./sorbonne/catalog.json?raw"),
    "sorbonne-pierre-et-marie-curie": () => import("./sorbonne-pierre-et-marie-curie/catalog.json?raw"),
    "sorbonne-sorbonne": () => import("./sorbonne-sorbonne/catalog.json?raw"),
    "sorbonne-pitie-salpetriere": () => import("./sorbonne-pitie-salpetriere/catalog.json?raw"),
    "sorbonne-saint-antoine": () => import("./sorbonne-saint-antoine/catalog.json?raw"),
    "sorbonne-cordeliers": () => import("./sorbonne-cordeliers/catalog.json?raw"),
    "sorbonne-clignancourt": () => import("./sorbonne-clignancourt/catalog.json?raw"),
    "sorbonne-malesherbes": () => import("./sorbonne-malesherbes/catalog.json?raw"),
  };
  const loader = catalogLoaders[canonicalId];
  const load = loader
    ? loader().then((module) => {
        registerUniversityCatalog(canonicalId, JSON.parse(module.default) as UniversityCatalog);
      })
    : Promise.resolve();
  campusCatalogLoads.set(canonicalId, load);
  return load;
}

export function campusResidenceBuildings(campusId: GapwiseCampusId): BuildingConfiguration[] {
  return (CONFIGURATIONS[campusId] ?? []).filter((building) => building.category === "residence");
}

export function getResidenceBuildingForCampus(
  campusId: GapwiseCampusId,
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

export function campusBuildingConfigurations(campusId: GapwiseCampusId) {
  return CONFIGURATIONS[campusId] ?? [];
}

/** Attribution attached to the campus overlay, separate from the basemap attribution. */
export function campusMapAttribution(campusId: GapwiseCampusId): string | undefined {
  const sources = universityCatalogs[campusId]?.sources ?? [];
  return sources.some((source) => source.url?.startsWith("https://www.openstreetmap.org"))
    ? '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors · ODbL</a>'
    : undefined;
}

/** Canonical mapped doors for the selected campus, preserving unknown access facts. */
export function campusBuildingEntrances(
  campusId: GapwiseCampusId,
  code: string | null,
): BuildingEntrance[] {
  if (!code) return [];
  if (campusId === "utm") return getCampusBuilding(code)?.entrances ?? [];
  const catalog = universityCatalogs[campusId];
  if (!catalog) return [];
  const identity = getCampusBuildingIdentity(campusId, code);
  if (!identity) return [];
  const building = catalog.buildings.find((item) => item.nativeCodes[0] === identity.code);
  if (!building) return [];
  return catalog.entrances
    .filter((entrance) => entrance.buildingId === building.id)
    .map((entrance) => {
      const provenance = entrance.provenance[0];
      const source = catalog.sources.find((item) => item.id === provenance?.sourceId);
      return {
        id: entrance.id,
        label: `${building.name} mapped entrance`,
        kind: "entrance",
        coordinates: entrance.coordinate,
        routingNodeId: entrance.pathNodeId,
        accessibility: "unknown",
        access: entrance.access,
        direction: "unknown",
        preferredForRouting: false,
        verificationMethod: provenance?.verification ?? "unknown",
        sourceIdentifier: source?.id ?? "unknown",
        metadata: {
          source: source?.title ?? "Gapwise Data",
          sourceUrl: source?.url ?? "",
          lastVerified: source?.retrievedAt ?? "",
          verificationStatus: provenance?.verification === "inferred" ? "inferred" : "verified",
        },
      };
    });
}

export function getCampusBuildingIdentity(campusId: GapwiseCampusId, value: string | null) {
  if (!value) return null;
  const normalized = normalizeText(value);
  return (
    CONFIGURATIONS[campusId]?.find((building) =>
      [building.code, building.name, ...(building.aliases ?? [])].some(
        (candidate) => normalizeText(candidate) === normalized,
      ),
    ) ?? null
  );
}

export function resolveCampusBuildingLocation(
  campusId: GapwiseCampusId,
  raw: string | null | undefined,
): { building: BuildingConfiguration; room: string | null } | null {
  const normalized = normalizeText(raw ?? "");
  if (!normalized) return null;
  const candidates = (CONFIGURATIONS[campusId] ?? [])
    .flatMap((building) =>
      [building.code, ...(building.aliases ?? []), building.name].map((key) => ({
        building,
        key: normalizeText(key),
      })),
    )
    .filter((candidate) => candidate.key)
    .sort((a, b) => b.key.length - a.key.length);

  for (const candidate of candidates) {
    if (normalized === candidate.key) return { building: candidate.building, room: null };
    if (normalized.startsWith(`${candidate.key} `) || normalized.startsWith(`${candidate.key}-`)) {
      return {
        building: candidate.building,
        room: normalized.slice(candidate.key.length).replace(/^[\s-]+/, "") || null,
      };
    }
  }
  return null;
}

function externalFootprints(campusId: Exclude<GapwiseCampusId, "utm">) {
  return EXTERNAL_FOOTPRINTS[campusId]?.features ?? [];
}

export function campusFootprintCollection(campusId: GapwiseCampusId): CampusFootprintCollection {
  if (campusId === "utm") {
    return UTM_FOOTPRINTS as unknown as CampusFootprintCollection;
  }
  return EXTERNAL_FOOTPRINTS[campusId] ?? { type: "FeatureCollection", features: [] };
}

export function getBuildingFootprintForCampus(
  campusId: GapwiseCampusId,
  code: string | null,
): CampusFootprintFeature | null {
  if (!code) return null;
  if (campusId === "utm") {
    return getUtmBuildingFootprint(code) as unknown as CampusFootprintFeature | null;
  }
  const identity = getCampusBuildingIdentity(campusId, code);
  if (!identity) return null;
  return (
    externalFootprints(campusId).find(
      (feature) => feature.properties.buildingCode.toUpperCase() === identity.code.toUpperCase(),
    ) ?? null
  );
}

function geometryPolygons(geometry: CampusFootprintGeometry): FootprintCoordinate[][][] {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

export function campusFootprintGeometryPoints(geometry: CampusFootprintGeometry) {
  return geometryPolygons(geometry).flat(2) as FootprintCoordinate[];
}

function pointOnSegment(
  point: FootprintCoordinate,
  start: FootprintCoordinate,
  end: FootprintCoordinate,
) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const squaredLength = dx * dx + dy * dy;
  if (squaredLength <= 1e-24) {
    const pointDx = point[0] - start[0];
    const pointDy = point[1] - start[1];
    return pointDx * pointDx + pointDy * pointDy <= 1e-24;
  }
  const cross = (point[1] - start[1]) * dx - (point[0] - start[0]) * dy;
  if (Math.abs(cross) > 1e-11) return false;
  const dot = (point[0] - start[0]) * dx + (point[1] - start[1]) * dy;
  if (dot < 0) return false;
  return dot <= squaredLength;
}

function pointInRing(point: FootprintCoordinate, ring: FootprintCoordinate[]) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const currentPoint = ring[index]!;
    const previousPoint = ring[previous]!;
    if (pointOnSegment(point, previousPoint, currentPoint)) return true;
    const [x, y] = point;
    const [xi, yi] = currentPoint;
    const [xj, yj] = previousPoint;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInGeometry(point: FootprintCoordinate, geometry: CampusFootprintGeometry) {
  return geometryPolygons(geometry).some((polygon) => {
    const outer = polygon[0];
    if (!outer || !pointInRing(point, outer)) return false;
    return !polygon.slice(1).some((hole) => pointInRing(point, hole));
  });
}

export function buildingCodeAtCampusCoordinate(
  campusId: GapwiseCampusId,
  point: FootprintCoordinate,
) {
  if (campusId === "utm") return utmBuildingCodeAtCoordinate(point);
  const matches = externalFootprints(campusId).filter((feature) =>
    pointInGeometry(point, feature.geometry),
  );
  return matches.length === 1 ? matches[0]!.properties.buildingCode : null;
}

function featureBounds(feature: CampusFootprintFeature) {
  const points = campusFootprintGeometryPoints(feature.geometry);
  if (!points.length) return null;
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  for (const [longitude, latitude] of points) {
    west = Math.min(west, longitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    north = Math.max(north, latitude);
  }
  return [
    [west, south],
    [east, north],
  ] as [[number, number], [number, number]];
}

export function representativePointForCampusFootprint(
  campusId: GapwiseCampusId,
  feature: CampusFootprintFeature,
): FootprintCoordinate | null {
  if (campusId === "utm") {
    return representativeUtmPoint(feature as never);
  }
  const bounds = featureBounds(feature);
  if (!bounds) return null;
  const [[west, south], [east, north]] = bounds;
  const center: FootprintCoordinate = [(west + east) / 2, (south + north) / 2];
  if (pointInGeometry(center, feature.geometry)) return center;
  for (let row = 1; row < 30; row += 1) {
    for (let column = 1; column < 30; column += 1) {
      const point: FootprintCoordinate = [
        west + ((east - west) * column) / 30,
        south + ((north - south) * row) / 30,
      ];
      if (pointInGeometry(point, feature.geometry)) return point;
    }
  }
  return campusFootprintGeometryPoints(feature.geometry)[0] ?? null;
}

export function campusCameraBounds(
  campusId: GapwiseCampusId,
): [[number, number], [number, number]] {
  const features = campusFootprintCollection(campusId).features;
  const points = features.flatMap((feature) => campusFootprintGeometryPoints(feature.geometry));
  if (!points.length)
    return (
      CAMPUS_FALLBACK_BOUNDS[campusId] ?? [
        [-180, -90],
        [180, 90],
      ]
    );
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  for (const [longitude, latitude] of points) {
    west = Math.min(west, longitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    north = Math.max(north, latitude);
  }
  const longitudePadding = Math.max((east - west) * 0.08, 0.001);
  const latitudePadding = Math.max((north - south) * 0.08, 0.001);
  return [
    [west - longitudePadding, south - latitudePadding],
    [east + longitudePadding, north + latitudePadding],
  ];
}

export function campusCenter(campusId: GapwiseCampusId): [number, number] {
  const [[west, south], [east, north]] = campusCameraBounds(campusId);
  return [(west + east) / 2, (south + north) / 2];
}
