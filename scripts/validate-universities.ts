import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import manifest from "../universities.json" with { type: "json" };
import { validateUniversityManifest } from "../src/universities/registry.js";
import { getCampusSnapshot } from "../src/server/public-campus/campus-snapshots.js";
import { routeBetweenBuildings } from "../src/features/routing/campus-outdoor-graph.js";
import { timetableAdapters, demoTimetableLoaders } from "../src/universities/timetable-adapters.js";
import { verifyUniversityBrandAssets } from "./university-brand-assets.js";

const errors: string[] = [];
const warnings: string[] = [];

console.log("Validating multi-university platform contract...");

// 1. Validate manifest schema
const manifestErrors = validateUniversityManifest();
if (manifestErrors.length > 0) {
  errors.push(...manifestErrors);
}

// 2. Validate each university entry
for (const uni of manifest.universities) {
  console.log(`Checking ${uni.name} (${uni.id})...`);

  if (uni.status === "planned") {
    console.log("  Planned edition: validating public registry metadata only.");
    continue;
  }

  // Branding assets are required only for editions with source-backed campus data.
  if (uni.dataPaths.length > 0) {
    const isUofT = uni.id === "uoft";
    const logoPath = isUofT
      ? resolve("public/logo-mark.svg")
      : resolve(`public/universities/${uni.id}/logo-mark.svg`);
    if (!existsSync(logoPath)) errors.push(`${uni.id}: Missing logo mark at ${logoPath}`);

    const manifestPath = isUofT
      ? resolve("public/site.webmanifest")
      : resolve(`public/universities/${uni.id}/site.webmanifest`);
    if (!existsSync(manifestPath)) {
      errors.push(`${uni.id}: Missing webmanifest at ${manifestPath}`);
    } else {
      try {
        const manifestJson = JSON.parse(readFileSync(manifestPath, "utf8"));
        if (!manifestJson.name || !manifestJson.short_name) {
          errors.push(`${uni.id}: webmanifest missing name or short_name`);
        }
      } catch {
        errors.push(`${uni.id}: webmanifest is not valid JSON`);
      }
    }
  }

  // Timetable integration
  const adapter = timetableAdapters[uni.timetableAdapter];
  if (!adapter) {
    errors.push(
      `${uni.id}: timetableAdapter '${uni.timetableAdapter}' is not in timetableAdapters registry`,
    );
  }

  const demoLoader = demoTimetableLoaders[uni.timetableAdapter];
  if (!demoLoader) {
    errors.push(`${uni.id}: demoTimetableLoaders missing loader for '${uni.timetableAdapter}'`);
  } else {
    try {
      const meetings = await demoLoader(uni.defaultCampus);
      if (!Array.isArray(meetings) || meetings.length === 0) {
        errors.push(`${uni.id}: Demo timetable returned empty meetings`);
      }
    } catch (err) {
      errors.push(`${uni.id}: Demo timetable failed to load: ${(err as Error).message}`);
    }
  }

  // Routable campuses & Outdoor Graphs
  for (const campusId of uni.routableCampuses) {
    if (campusId === "utm") {
      // UTM uses specialized legacy data layer; audited separately
      continue;
    }

    const snapshot = getCampusSnapshot(campusId);
    if (!snapshot) {
      errors.push(`${uni.id}/${campusId}: No CampusSnapshot found in CAMPUS_SNAPSHOTS`);
      continue;
    }

    if (!snapshot.campus?.bounds || snapshot.campus.bounds.length !== 2) {
      errors.push(`${uni.id}/${campusId}: Campus snapshot missing bounding box`);
    }

    if (!snapshot.buildings || snapshot.buildings.length < 5) {
      errors.push(
        `${uni.id}/${campusId}: Campus snapshot has insufficient buildings (${snapshot.buildings?.length ?? 0})`,
      );
    }

    if (!snapshot.pathNodes || snapshot.pathNodes.length < 5) {
      errors.push(
        `${uni.id}/${campusId}: Campus routing graph has insufficient pathNodes (${snapshot.pathNodes?.length ?? 0})`,
      );
    }

    if (!snapshot.pathEdges || snapshot.pathEdges.length < 5) {
      errors.push(
        `${uni.id}/${campusId}: Campus routing graph has insufficient pathEdges (${snapshot.pathEdges?.length ?? 0})`,
      );
    }

    const usableEntrances = snapshot.entrances.filter(
      (entrance) => entrance.access !== "restricted",
    );
    if (usableEntrances.length === 0) {
      errors.push(`${uni.id}/${campusId}: Campus routing has no usable entrances`);
    }

    if (demoLoader) {
      const meetings = await demoLoader(campusId);
      const demoCodes = [
        ...new Set(
          meetings
            .filter((meeting) => meeting.locationType === "physical")
            .map((meeting) => meeting.buildingCode?.trim().toUpperCase())
            .filter((code): code is string => Boolean(code)),
        ),
      ];
      const demoBuildings = demoCodes.map((code) =>
        snapshot.buildings.find(
          (building) =>
            building.id.toUpperCase() === code ||
            building.nativeCodes.some((nativeCode) => nativeCode.toUpperCase() === code),
        ),
      );
      const missingDemoCodes = demoCodes.filter((_, index) => !demoBuildings[index]);
      if (missingDemoCodes.length > 0) {
        errors.push(
          `${uni.id}/${campusId}: Demo references unmapped buildings: ${missingDemoCodes.join(", ")}`,
        );
      }
      const mappedDemoBuildings = demoBuildings.filter(
        (building): building is NonNullable<typeof building> => Boolean(building),
      );
      if (mappedDemoBuildings.length < 2) {
        errors.push(`${uni.id}/${campusId}: Demo must contain at least two mapped buildings`);
      } else {
        const origin = mappedDemoBuildings[0]!;
        for (const destination of mappedDemoBuildings.slice(1)) {
          const route = routeBetweenBuildings(origin.id, destination.id, snapshot);
          if (route.status !== "ready") {
            errors.push(
              `${uni.id}/${campusId}: Demo building ${destination.nativeCodes[0] ?? destination.id} is not routable from ${origin.nativeCodes[0] ?? origin.id}`,
            );
          }
        }
      }
    }

    // Verify test route between two buildings
    if (snapshot.buildings && snapshot.buildings.length >= 2) {
      const fromB = snapshot.buildings[0]!;
      const toB = snapshot.buildings[1]!;
      const route = routeBetweenBuildings(fromB.id, toB.id, snapshot);
      if (route.status !== "ready") {
        warnings.push(
          `${uni.id}/${campusId}: Test route between ${fromB.id} and ${toB.id} returned status '${route.status}': ${route.status === "unavailable" ? route.reason : ""}`,
        );
      }
    }
  }
}

errors.push(...(await verifyUniversityBrandAssets(manifest.universities)));

console.log("\n--- Validation Results ---");
if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  for (const w of warnings) console.warn(`  [WARN] ${w}`);
}

if (errors.length > 0) {
  console.error(`\nErrors (${errors.length}):`);
  for (const e of errors) console.error(`  [FAIL] ${e}`);
  process.exit(1);
}

console.log(`\nAll ${manifest.universities.length} universities passed contract validation!`);
