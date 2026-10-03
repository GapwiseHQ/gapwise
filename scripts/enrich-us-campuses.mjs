import fs from "node:fs";
import path from "node:path";
import {
  CAMPUS_DEFINITIONS,
  generateCampusSnapshot,
  generateCatalog,
} from "./generate-all-campus-coverage.mjs";

const GAPWISE_ROOT = "/home/andrew/Projects/gapwise-uoft/gapwise";
const DATA_ROOT = "/home/andrew/Projects/gapwise-uoft/data";

const EXTRA_BUILDINGS = {
  "cmu-pittsburgh": [
    {
      id: "cmu-purnell-arts",
      name: "Purnell Center for the Arts",
      code: "PCA",
      center: [-79.943, 40.4428],
    },
    { id: "cmu-baker-hall", name: "Baker Hall", code: "BH", center: [-79.946, 40.4418] },
    { id: "cmu-porter-hall", name: "Porter Hall", code: "PH", center: [-79.9465, 40.4415] },
    {
      id: "cmu-mellon-institute",
      name: "Mellon Institute",
      code: "MI",
      center: [-79.947, 40.4445],
    },
  ],
  "ucberkeley-main": [
    {
      id: "ucb-moffitt-library",
      name: "Moffitt Library",
      code: "MOFF",
      center: [-122.26, 37.8728],
    },
    { id: "ucb-stanley-hall", name: "Stanley Hall", code: "STAN", center: [-122.2565, 37.874] },
    { id: "ucb-tan-hall", name: "Tan Hall", code: "TAN", center: [-122.256, 37.8735] },
    {
      id: "ucb-physics-building",
      name: "Physics Building",
      code: "PHYS",
      center: [-122.2578, 37.8722],
    },
  ],
  "nyu-washington-square": [
    { id: "nyu-vanderbilt-hall", name: "Vanderbilt Hall", code: "VH", center: [-73.9995, 40.7305] },
    { id: "nyu-shimkin-hall", name: "Shimkin Hall", code: "SHIM", center: [-73.9962, 40.7288] },
    { id: "nyu-cantor-film", name: "Cantor Film Center", code: "CFC", center: [-73.993, 40.731] },
    { id: "nyu-puck-building", name: "Puck Building", code: "PUCK", center: [-73.9955, 40.7255] },
  ],
  "mit-cambridge": [
    {
      id: "mit-walker-memorial",
      name: "Walker Memorial",
      code: "BLD50",
      center: [-71.089, 42.359],
    },
    {
      id: "mit-hayden-library",
      name: "Hayden Memorial Library",
      code: "BLD14",
      center: [-71.09, 42.3595],
    },
    {
      id: "mit-koch-institute",
      name: "Koch Institute for Integrative Cancer Research",
      code: "BLD76",
      center: [-71.091, 42.3625],
    },
    {
      id: "mit-sloan-building",
      name: "Sloan School of Management Building",
      code: "BLDE62",
      center: [-71.088, 42.361],
    },
    {
      id: "mit-morgenthaler-hall",
      name: "Morgenthaler Athletic Center",
      code: "BLDW35",
      center: [-71.097, 42.3575],
    },
  ],
  "stanford-main": [
    {
      id: "stanford-memorial-aud",
      name: "Memorial Auditorium",
      code: "MEMAUD",
      center: [-122.166, 37.4295],
    },
    {
      id: "stanford-green-earth",
      name: "Green Earth Sciences Building",
      code: "GESB",
      center: [-122.1735, 37.4265],
    },
    {
      id: "stanford-alway-building",
      name: "Alway Building",
      code: "ALWAY",
      center: [-122.175, 37.4315],
    },
    {
      id: "stanford-clark-center",
      name: "Clark Center",
      code: "CLARK",
      center: [-122.1765, 37.4305],
    },
    {
      id: "stanford-arrillaga-center",
      name: "Arrillaga Outdoor Center",
      code: "AOERC",
      center: [-122.177, 37.427],
    },
  ],
  "upenn-philadelphia": [
    { id: "upenn-williams-hall", name: "Williams Hall", code: "WH", center: [-75.1965, 39.9515] },
    {
      id: "upenn-moore-building",
      name: "Moore School Building",
      code: "MB",
      center: [-75.1905, 39.9525],
    },
    {
      id: "upenn-skirkanich-hall",
      name: "Skirkanich Hall",
      code: "SKIR",
      center: [-75.191, 39.952],
    },
    {
      id: "upenn-huntsman-hall",
      name: "Jon M. Huntsman Hall",
      code: "JMHH",
      center: [-75.1985, 39.953],
    },
    { id: "upenn-hayden-hall", name: "Hayden Hall", code: "HAY", center: [-75.19, 39.9518] },
  ],
  "cornell-ithaca": [
    { id: "cornell-olin-hall", name: "Olin Hall", code: "OH", center: [-76.4845, 42.4455] },
    { id: "cornell-clark-hall", name: "Clark Hall", code: "CH", center: [-76.482, 42.449] },
    { id: "cornell-uris-hall", name: "Uris Hall", code: "UH", center: [-76.4815, 42.4468] },
    {
      id: "cornell-goldwin-smith",
      name: "Goldwin Smith Hall",
      code: "GSH",
      center: [-76.4835, 42.4485],
    },
    { id: "cornell-sibley-hall", name: "Sibley Hall", code: "SIBH", center: [-76.484, 42.4505] },
  ],
  "dartmouth-hanover": [
    {
      id: "dartmouth-fairchild-center",
      name: "Fairchild Physical Sciences Center",
      code: "FPC",
      center: [-72.288, 43.7055],
    },
    { id: "dartmouth-moore-hall", name: "Moore Hall", code: "MH", center: [-72.2875, 43.706] },
    { id: "dartmouth-carson-hall", name: "Carson Hall", code: "CH", center: [-72.289, 43.7062] },
    { id: "dartmouth-wilder-hall", name: "Wilder Hall", code: "WH", center: [-72.287, 43.705] },
    {
      id: "dartmouth-burke-hall",
      name: "Burke Chemical Laboratory",
      code: "BH",
      center: [-72.2865, 43.7055],
    },
  ],
  "brown-providence": [
    {
      id: "brown-cit",
      name: "Center for Information Technology",
      code: "CIT",
      center: [-71.4005, 41.8255],
    },
    {
      id: "brown-salomon-center",
      name: "Salomon Center for Teaching",
      code: "SCT",
      center: [-71.404, 41.8265],
    },
    {
      id: "brown-sayles-hall",
      name: "Sayles Memorial Hall",
      code: "SMH",
      center: [-71.4028, 41.8268],
    },
    { id: "brown-manning-hall", name: "Manning Hall", code: "MH", center: [-71.4035, 41.8267] },
    { id: "brown-wilson-hall", name: "Wilson Hall", code: "WH", center: [-71.4022, 41.826] },
  ],
  "columbia-morningside": [
    {
      id: "columbia-schermerhorn",
      name: "Schermerhorn Hall",
      code: "SCH",
      center: [-73.9605, 40.8085],
    },
    { id: "columbia-uris-hall", name: "Uris Hall", code: "URIS", center: [-73.961, 40.808] },
    {
      id: "columbia-avery-hall",
      name: "Avery Architectural Center",
      code: "AVERY",
      center: [-73.9618, 40.8075],
    },
    {
      id: "columbia-fairchild-center",
      name: "Fairchild Life Sciences Center",
      code: "FAIR",
      center: [-73.96, 40.809],
    },
    {
      id: "columbia-philosophy-hall",
      name: "Philosophy Hall",
      code: "PHIL",
      center: [-73.9612, 40.8065],
    },
  ],
  "princeton-main": [
    { id: "princeton-fine-hall", name: "Fine Hall", code: "FH", center: [-74.6535, 40.3475] },
    { id: "princeton-jadwin-hall", name: "Jadwin Hall", code: "JH", center: [-74.6525, 40.347] },
    { id: "princeton-mccosh-hall", name: "McCosh Hall", code: "MH", center: [-74.6565, 40.3478] },
    { id: "princeton-bowen-hall", name: "Bowen Hall", code: "BH", center: [-74.6515, 40.349] },
    {
      id: "princeton-engineering-quad",
      name: "Engineering Quadrangle",
      code: "EQ",
      center: [-74.652, 40.35],
    },
  ],
  "yale-new-haven": [
    { id: "yale-dunham-lab", name: "Dunham Laboratory", code: "DL", center: [-72.9255, 41.3125] },
    { id: "yale-bass-library", name: "Bass Library", code: "BASS", center: [-72.928, 41.3098] },
    { id: "yale-phelps-hall", name: "Phelps Hall", code: "PH", center: [-72.929, 41.3088] },
    { id: "yale-lombard-hall", name: "Lombard Hall", code: "LH", center: [-72.9245, 41.314] },
    {
      id: "yale-davies-auditorium",
      name: "Davies Auditorium",
      code: "DA",
      center: [-72.925, 41.312],
    },
  ],
  "harvard-cambridge": [
    { id: "harvard-emerson-hall", name: "Emerson Hall", code: "EME", center: [-71.1155, 42.3738] },
    {
      id: "harvard-boylston-hall",
      name: "Boylston Hall",
      code: "BOY",
      center: [-71.1175, 42.3735],
    },
    {
      id: "harvard-peabody-museum",
      name: "Peabody Museum",
      code: "PEA",
      center: [-71.115, 42.378],
    },
    { id: "harvard-barker-center", name: "Barker Center", code: "BKC", center: [-71.1145, 42.373] },
    {
      id: "harvard-university-hall",
      name: "University Hall",
      code: "UH",
      center: [-71.1165, 42.3748],
    },
  ],
};

for (const def of CAMPUS_DEFINITIONS) {
  const extra = EXTRA_BUILDINGS[def.campusId];
  if (extra) {
    def.buildings = [...def.buildings, ...extra];
  }

  const snapshot = generateCampusSnapshot(def);
  const catalog = generateCatalog(snapshot);

  // 1. In gapwise
  const gapwiseCampusDir = path.join(GAPWISE_ROOT, "src/data/campuses", def.campusId);
  fs.mkdirSync(gapwiseCampusDir, { recursive: true });
  fs.writeFileSync(
    path.join(gapwiseCampusDir, "campus.json"),
    JSON.stringify(snapshot, null, 2) + "\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(gapwiseCampusDir, "catalog.json"),
    JSON.stringify(catalog, null, 2) + "\n",
    "utf8",
  );

  // Also if primary of new uni, write to university root directory
  if (EXTRA_BUILDINGS[def.campusId]) {
    const gapwiseUniDir = path.join(GAPWISE_ROOT, "src/data/campuses", def.universityId);
    fs.mkdirSync(gapwiseUniDir, { recursive: true });
    fs.writeFileSync(
      path.join(gapwiseUniDir, "campus.json"),
      JSON.stringify(snapshot, null, 2) + "\n",
      "utf8",
    );
    fs.writeFileSync(
      path.join(gapwiseUniDir, "catalog.json"),
      JSON.stringify(catalog, null, 2) + "\n",
      "utf8",
    );

    const dataUniDir = path.join(DATA_ROOT, "universities", def.universityId);
    fs.mkdirSync(dataUniDir, { recursive: true });
    fs.writeFileSync(
      path.join(dataUniDir, "campus.json"),
      JSON.stringify(snapshot, null, 2) + "\n",
      "utf8",
    );
  }
}

console.log("Enriched all 13 US primary campuses with >= 10 buildings and entrances.");
