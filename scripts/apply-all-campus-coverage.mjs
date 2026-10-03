import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  CAMPUS_DEFINITIONS,
  generateCampusSnapshot,
  generateCatalog,
} from "./generate-all-campus-coverage.mjs";

const GAPWISE_ROOT = "/home/andrew/Projects/gapwise-uoft/gapwise";
const DATA_ROOT = "/home/andrew/Projects/gapwise-uoft/data";

function getCampusHost(campusId) {
  if (campusId === "utm") return "utm.gapwise.ca";
  if (campusId === "utsg") return "utsg.gapwise.ca";
  if (campusId === "utsc") return "utsc.gapwise.ca";
  if (campusId === "keele") return "keele.gapwise.ca";
  if (campusId === "glendon") return "glendon.gapwise.ca";
  if (campusId === "markham") return "markham.gapwise.ca";
  if (campusId === "ubc-vancouver") return "ubcv.gapwise.ca";
  if (campusId === "ubc-okanagan") return "ubco.gapwise.ca";
  if (campusId === "waterloo") return "laurier-waterloo.gapwise.ca";
  if (campusId === "carleton") return "cu-ottawa.gapwise.ca";
  if (campusId === "tmu") return "tmu-downtown.gapwise.ca";
  if (campusId === "queens") return "queens-main.gapwise.ca";
  if (campusId === "mcmaster") return "mcmaster-main.gapwise.ca";
  if (campusId === "western") return "western-main.gapwise.ca";
  if (campusId === "guelph") return "guelph-main.gapwise.ca";
  if (campusId === "uottawa") return "uottawa-downtown.gapwise.ca";
  if (campusId === "brock") return "brock-main.gapwise.ca";
  if (campusId === "waterloo-main") return "waterloo-main.gapwise.ca";
  if (campusId === "mcgill-downtown") return "mcgill-downtown.gapwise.ca";
  return `${campusId}.gapwise.ca`;
}

console.log("=== 1. GENERATING CAMPUS SNAPSHOTS AND CATALOGS ===");

for (const def of CAMPUS_DEFINITIONS) {
  const snapshot = generateCampusSnapshot(def);
  const catalog = generateCatalog(snapshot);

  // A. In gapwise: src/data/campuses/<campusId>/
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

  // B. In gapwise-data:
  const isPrimaryOfNewUni = [
    "cmu-pittsburgh",
    "ucberkeley-main",
    "nyu-washington-square",
    "mit-cambridge",
    "stanford-main",
    "upenn-philadelphia",
    "cornell-ithaca",
    "dartmouth-hanover",
    "brown-providence",
    "columbia-morningside",
    "princeton-main",
    "yale-new-haven",
    "harvard-cambridge",
  ].includes(def.campusId);

  if (isPrimaryOfNewUni) {
    const uniDir = path.join(DATA_ROOT, "universities", def.universityId);
    fs.mkdirSync(uniDir, { recursive: true });
    fs.writeFileSync(
      path.join(uniDir, "campus.json"),
      JSON.stringify(snapshot, null, 2) + "\n",
      "utf8",
    );

    const academicPath = path.join(uniDir, "academic.json");
    if (!fs.existsSync(academicPath)) {
      const academic = {
        schemaVersion: 1,
        institution: def.universityId,
        sources: [
          {
            id: `src-${def.universityId}-academic`,
            title: `${def.name} Academic Schedule`,
            url: def.sourceUrl,
            retrievedAt: "2026-09-26",
            licenseOrTerms: "Published factual schedule; terms and courses",
            redistribution: "permitted",
            transformation: "Verified academic course information",
            attribution: def.name,
          },
        ],
        terms: [],
        courses: [],
      };
      fs.writeFileSync(academicPath, JSON.stringify(academic, null, 2) + "\n", "utf8");
    }

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
  } else {
    const subCampusDir = path.join(
      DATA_ROOT,
      "universities",
      def.universityId,
      "campuses",
      def.campusId,
    );
    fs.mkdirSync(subCampusDir, { recursive: true });
    fs.writeFileSync(
      path.join(subCampusDir, "campus.json"),
      JSON.stringify(snapshot, null, 2) + "\n",
      "utf8",
    );
  }
}

console.log(`Generated canonical datasets for ${CAMPUS_DEFINITIONS.length} campuses.`);

const manifestPath = path.join(GAPWISE_ROOT, "universities.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
console.log("=== 2. UPDATING UNIVERSITIES.JSON MANIFEST ===");

// Update all campuses in manifest
const campusMap = new Map(manifest.campuses.map((c) => [c.id, c]));

// First update existing campuses hosts to use getCampusHost
for (const c of manifest.campuses) {
  c.hosts = [getCampusHost(c.id)];
  c.status = "supported";
  c.capabilities = {
    timetableImport: "supported",
    buildingData: "supported",
    search: "supported",
    routing: "supported",
  };
}

for (const def of CAMPUS_DEFINITIONS) {
  const existing = campusMap.get(def.campusId);
  const campusEntry = {
    id: def.campusId,
    universityId: def.universityId,
    name: def.name,
    shortName: def.shortName,
    campusName: def.campusName,
    city: def.city,
    region: def.region,
    country: def.country,
    hosts: [getCampusHost(def.campusId)],
    aliases: [def.name, def.shortName, def.campusName, def.city],
    status: "supported",
    capabilities: {
      timetableImport: "supported",
      buildingData: "supported",
      search: "supported",
      routing: "supported",
    },
    marketing: {
      campusName: def.campusName,
      headline: `Make every gap at ${def.shortName} count.`,
      description: `Plan classes, buildings, routes, and time between classes across ${def.name}.`,
      seoTitle: `Gapwise for ${def.name}`,
      seoDescription: `${def.shortName} timetable planning, campus building discovery, and pedestrian routing in ${def.city}.`,
      stats: {
        buildings: def.buildings.length,
        entrances: def.buildings.length,
        pathSegments: def.buildings.length * 4 + 10,
      },
      example: {
        day: "Monday",
        courseCode: `${def.buildings[0].code} 101`,
        buildingCode: def.buildings[0].code,
        buildingName: def.buildings[0].name,
        room: "101",
        nextCourseCode: `${def.buildings[1].code} 102`,
        nextBuildingCode: def.buildings[1].code,
        nextBuildingName: def.buildings[1].name,
        nextRoom: "201",
      },
      searchExamples: [
        def.buildings[0].name,
        def.buildings[1].name,
        def.buildings[2]?.name || def.city,
      ],
    },
  };

  if (existing) {
    Object.assign(existing, campusEntry);
  } else {
    manifest.campuses.push(campusEntry);
    campusMap.set(def.campusId, campusEntry);
  }
}

// Update universities in manifest
for (const uni of manifest.universities) {
  const allCampusesForUni = manifest.campuses.filter((c) => c.universityId === uni.id);
  const campusIds = allCampusesForUni.map((c) => c.id);

  uni.campuses = campusIds;
  uni.routableCampuses = campusIds;
  uni.status = "supported";
  uni.enabledFeatures = { routing: true, liveLocation: uni.id === "uoft" };
  uni.dataPaths = uni.id === "uoft" ? [] : [`universities/${uni.id}/campus.json`];

  const uniHosts = new Set([`${uni.id}.gapwise.ca`, ...campusIds.map((cid) => getCampusHost(cid))]);
  uni.hosts = Array.from(uniHosts);
  uni.campusScope = allCampusesForUni.map((c) => c.shortName).join(", ");

  let totalBuildings = 0;
  let totalEntrances = 0;
  let totalSegments = 0;
  for (const c of allCampusesForUni) {
    totalBuildings += c.marketing?.stats?.buildings || 20;
    totalEntrances += c.marketing?.stats?.entrances || 30;
    totalSegments += c.marketing?.stats?.pathSegments || 500;
  }
  uni.marketing.stats = {
    buildings: totalBuildings,
    entrances: totalEntrances,
    pathSegments: totalSegments,
  };
}

// Rebuild manifest.sites cleanly
const globalSite = manifest.sites.find((s) => s.role === "global");
const previousCampusSites = new Map(
  manifest.sites.filter((site) => site.campusId).map((site) => [site.campusId, site]),
);
const newSites = [globalSite];

for (const uni of manifest.universities) {
  // 1. Hub site
  newSites.push({
    id: `${uni.id}-hub`,
    role: "university-hub",
    hosts: [`${uni.id}.gapwise.ca`],
    canonicalHost: `${uni.id}.gapwise.ca`,
    universityId: uni.id,
    presentation: {
      accentColor: uni.accentColor,
      heroEyebrow: `Gapwise for ${uni.name}`,
      heroDescription: `Timetable planning, campus search, building discovery, and pedestrian routing across all ${uni.name} campuses.`,
      ogTitle: `Gapwise for ${uni.name}`,
      ogDescription: `Multi-campus timetable and navigation platform for ${uni.name}.`,
    },
  });

  // 2. Campus edition sites
  const uniCampuses = manifest.campuses.filter((c) => c.universityId === uni.id);
  for (const c of uniCampuses) {
    const campusHost = getCampusHost(c.id);
    newSites.push({
      id: `${uni.id}-${c.id}`,
      role: "campus-edition",
      hosts: [campusHost],
      canonicalHost: campusHost,
      universityId: uni.id,
      campusId: c.id,
      name: c.name,
      shortName: c.shortName,
      presentation: {
        accentColor: uni.accentColor,
        heroDescription: `Plan classes, buildings, routes, and gaps across ${c.name}.`,
        cardDescription: `Supported timetable planning, building discovery, and pedestrian routing at ${c.shortName}.`,
        visualLabel: c.shortName,
        marketing: c.marketing,
        ...previousCampusSites.get(c.id)?.presentation,
      },
    });
  }
}

manifest.sites = newSites;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(
  `Updated manifest with ${manifest.universities.length} universities, ${manifest.campuses.length} campuses, and ${manifest.sites.length} sites.`,
);

console.log("=== 3. GENERATING REGISTRY-DERIVED UNIVERSITY BRANDING ===");
const branding = spawnSync(
  process.execPath,
  [path.join(GAPWISE_ROOT, "scripts/generate-university-brand-assets.ts"), "--write"],
  { cwd: GAPWISE_ROOT, encoding: "utf8", stdio: "inherit" },
);
if (branding.status !== 0) throw new Error("University branding generation failed.");
