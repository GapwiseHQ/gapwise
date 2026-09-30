import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "../universities.json" with { type: "json" };
import {
  campusResidenceBuildings,
  campusBuildingConfigurations,
  CAMPUS_LABELS,
  ensureCampusCatalog,
  type GapwiseCampusId,
} from "../src/data/campuses/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = resolve(
  __dirname,
  "../src/data/campuses/generated/residence-coverage-matrix.json",
);

export interface ResidenceCoverageRecord {
  code: string;
  name: string;
  aliases: string[];
}

export interface CampusResidenceCoverage {
  universityId: string;
  universityName: string;
  campusId: string;
  campusName: string;
  totalBuildings: number;
  residenceCount: number;
  residences: ResidenceCoverageRecord[];
}

export interface ResidenceCoverageMatrix {
  schemaVersion: "1.0";
  generatedAt: string;
  summary: {
    totalUniversities: number;
    totalCampuses: number;
    totalBuildings: number;
    totalResidences: number;
    universitiesWithResidenceCoverage: number;
    campusesWithResidenceCoverage: number;
    coveragePercentage: number;
  };
  campuses: Record<string, CampusResidenceCoverage>;
}

export async function generateResidenceCoverageMatrix(): Promise<ResidenceCoverageMatrix> {
  await Promise.all(
    manifest.universities.flatMap((university) =>
      university.campuses.map((campusId) => ensureCampusCatalog(campusId)),
    ),
  );
  const campusCoverages: Record<string, CampusResidenceCoverage> = {};
  let totalBuildings = 0;
  let totalResidences = 0;
  let campusesWithResidence = 0;
  const universitiesCovered = new Set<string>();

  for (const university of manifest.universities) {
    let universityHasResidence = false;

    for (const campusId of university.campuses) {
      const gapwiseCampusId = campusId as GapwiseCampusId;
      const allBuildings = campusBuildingConfigurations(gapwiseCampusId);
      const residences = campusResidenceBuildings(gapwiseCampusId);

      totalBuildings += allBuildings.length;
      totalResidences += residences.length;

      if (residences.length > 0) {
        campusesWithResidence++;
        universityHasResidence = true;
      }

      campusCoverages[campusId] = {
        universityId: university.id,
        universityName: university.name,
        campusId,
        campusName: CAMPUS_LABELS[campusId] ?? university.name,
        totalBuildings: allBuildings.length,
        residenceCount: residences.length,
        residences: residences.map((r) => ({
          code: r.code,
          name: r.name,
          aliases: r.aliases ?? [],
        })),
      };
    }

    if (universityHasResidence) {
      universitiesCovered.add(university.id);
    }
  }

  const totalCampuses = Object.keys(campusCoverages).length;
  const coveragePercentage =
    totalCampuses > 0 ? Math.round((campusesWithResidence / totalCampuses) * 100) : 0;

  return {
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    summary: {
      totalUniversities: manifest.universities.length,
      totalCampuses,
      totalBuildings,
      totalResidences,
      universitiesWithResidenceCoverage: universitiesCovered.size,
      campusesWithResidenceCoverage: campusesWithResidence,
      coveragePercentage,
    },
    campuses: campusCoverages,
  };
}

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");

const matrix = await generateResidenceCoverageMatrix();

console.log("\n=======================================================");
console.log("GAPWISE UNIVERSITY RESIDENCE COVERAGE MATRIX AUDIT");
console.log("=======================================================");
console.log(
  `Universities: ${matrix.summary.universitiesWithResidenceCoverage}/${matrix.summary.totalUniversities}`,
);
console.log(
  `Campuses:     ${matrix.summary.campusesWithResidenceCoverage}/${matrix.summary.totalCampuses}`,
);
console.log(`Total Residences: ${matrix.summary.totalResidences}`);
console.log(`Coverage:     ${matrix.summary.coveragePercentage}%\n`);

let failed = false;
for (const [campusId, cov] of Object.entries(matrix.campuses)) {
  const status = cov.residenceCount > 0 ? "PASS" : "FAIL";
  if (cov.residenceCount === 0) failed = true;
  console.log(
    `[${status}] ${cov.universityName} (${campusId}): ${cov.residenceCount} residences (${cov.totalBuildings} total buildings)`,
  );
}

if (failed) {
  console.error("\n❌ Defect detected: One or more supported campuses have 0 verified residences.");
  process.exit(1);
}

if (checkOnly) {
  if (!existsSync(OUTPUT_FILE)) {
    console.error(`\n❌ Error: Generated matrix file not found at ${OUTPUT_FILE}`);
    process.exit(1);
  }
  const existing = JSON.parse(readFileSync(OUTPUT_FILE, "utf8")) as ResidenceCoverageMatrix;
  if (
    existing.summary.totalCampuses !== matrix.summary.totalCampuses ||
    existing.summary.campusesWithResidenceCoverage !==
      matrix.summary.campusesWithResidenceCoverage ||
    existing.summary.totalResidences !== matrix.summary.totalResidences
  ) {
    console.error(
      "\n❌ Error: Generated residence coverage matrix is out of sync with runtime data.",
    );
    process.exit(1);
  }
  console.log("\n✅ Residence coverage matrix is in sync.");
} else {
  writeFileSync(OUTPUT_FILE, JSON.stringify(matrix, null, 2) + "\n", "utf8");
  console.log(`\n✅ Generated residence coverage matrix saved to ${OUTPUT_FILE}`);
}
