import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "../universities.json" with { type: "json" };
import {
  supportedUniversities,
  allCampuses,
  resolveUniversityAndCampus,
} from "../src/universities/registry.js";
import {
  getCampusSnapshot,
  campusBuildingConfigurations,
  getCampusBuildingIdentity,
} from "../src/server/public-campus/campus-snapshots.js";
import {
  listPublicBuildings,
  getPublicBuilding,
  routeBetweenPublicBuildings,
} from "../src/server/public-campus/service.js";
import {
  getRoutingGraph,
  distanceMeters,
  routeBetweenBuildings,
  RoutingGraph,
} from "../src/features/routing/campus-outdoor-graph.js";
import { serverRoutingGraph, publicCampusBuildings } from "../src/server/public-campus/data.js";
import {
  campusFootprintCollection,
  getBuildingFootprintForCampus,
  buildingCodeAtCampusCoordinate,
} from "../src/data/campuses/index.js";

export type CampusAuditResult = {
  universityId: string;
  universityName: string;
  campusId: string;
  campusName: string;
  isRoutable: boolean;
  buildingCount: number;
  buildingsWithKnownEntrances: number;
  buildingsWithoutKnownEntrances: number;
  entranceCount: number;
  routableBuildings: number;
  graphIsolatedBuildings: string[];
  unanchoredBuildings: string[];
  duplicateEntrances: Array<{
    id1: string;
    id2: string;
    distanceMeters: number;
    buildingId: string;
  }>;
  detachedEntrances: Array<{
    entranceId: string;
    buildingId: string;
    distanceToFootprintMeters: number;
  }>;
  routePairsAttempted: number;
  routePairsSuccessful: number;
  routeFailures: Array<{ from: string; to: string; reason: string }>;
  extremeDetours: Array<{
    from: string;
    to: string;
    routedDistanceMeters: number;
    straightLineDistanceMeters: number;
    detourRatio: number;
  }>;
  identityLeakageFindings: string[];
  metadataValidationErrors: string[];
  capabilityLimitations: string[];
  findingsRequiringManualVerification: string[];
};

export type FullAuditReport = {
  schemaVersion: "1.0";
  generatedAt: string;
  summary: {
    totalUniversities: number;
    totalCampuses: number;
    routableCampuses: number;
    totalBuildings: number;
    totalEntrances: number;
    totalRoutePairsTested: number;
    totalRoutePairsPassed: number;
    totalRouteFailures: number;
    criticalDefectsFound: number;
  };
  campuses: Record<string, CampusAuditResult>;
};

// Helper: point to polygon distance approximation
function pointToFootprintDistanceMeters(
  point: [number, number],
  geometry: { type: string; coordinates: any },
): number {
  if (!geometry) return 0;
  const rawCoords: [number, number][] =
    geometry.type === "Polygon" ? geometry.coordinates[0] : (geometry.coordinates?.[0]?.[0] ?? []);
  if (!rawCoords || rawCoords.length === 0) return 0;

  let minD = Infinity;
  for (const vertex of rawCoords) {
    const d = distanceMeters(point, vertex);
    if (d < minD) minD = d;
  }
  return minD;
}

export function runComprehensiveCampusAudit(): FullAuditReport {
  const report: FullAuditReport = {
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    summary: {
      totalUniversities: manifest.universities.length,
      totalCampuses: allCampuses().length,
      routableCampuses: 0,
      totalBuildings: 0,
      totalEntrances: 0,
      totalRoutePairsTested: 0,
      totalRoutePairsPassed: 0,
      totalRouteFailures: 0,
      criticalDefectsFound: 0,
    },
    campuses: {},
  };

  for (const uni of supportedUniversities()) {
    for (const campusId of uni.campuses) {
      const isRoutable = uni.routableCampuses.includes(campusId);
      if (isRoutable) report.summary.routableCampuses++;

      const audit: CampusAuditResult = {
        universityId: uni.id,
        universityName: uni.name,
        campusId,
        campusName:
          campusId === "utm"
            ? "University of Toronto Mississauga"
            : campusId === "utsg"
              ? "University of Toronto St. George"
              : campusId === "utsc"
                ? "University of Toronto Scarborough"
                : uni.name,
        isRoutable,
        buildingCount: 0,
        buildingsWithKnownEntrances: 0,
        buildingsWithoutKnownEntrances: 0,
        entranceCount: 0,
        routableBuildings: 0,
        graphIsolatedBuildings: [],
        unanchoredBuildings: [],
        duplicateEntrances: [],
        detachedEntrances: [],
        routePairsAttempted: 0,
        routePairsSuccessful: 0,
        routeFailures: [],
        extremeDetours: [],
        identityLeakageFindings: [],
        metadataValidationErrors: [],
        capabilityLimitations: [],
        findingsRequiringManualVerification: [],
      };

      // 1. Enumerate buildings and entrances
      if (campusId === "utm") {
        const buildings = publicCampusBuildings();
        audit.buildingCount = buildings.length;
        report.summary.totalBuildings += buildings.length;

        const allUtmEntrances = buildings.flatMap((b) => b.entrances);
        audit.entranceCount = allUtmEntrances.length;
        report.summary.totalEntrances += allUtmEntrances.length;

        const utmGraph = serverRoutingGraph();
        const connectedNodes = new Set<string>();
        for (const edge of utmGraph.edges) {
          connectedNodes.add(edge.from);
          connectedNodes.add(edge.to);
        }

        for (const b of buildings) {
          if (b.entrances.length > 0) {
            audit.buildingsWithKnownEntrances++;
          } else {
            audit.buildingsWithoutKnownEntrances++;
          }

          const usable = b.entrances.filter((e) => Boolean(e.routingNodeId));
          const hasConnectedEntrance = usable.some((e) => connectedNodes.has(e.routingNodeId));
          if (hasConnectedEntrance) {
            audit.routableBuildings++;
          } else {
            audit.graphIsolatedBuildings.push(b.code);
          }

          // Check entrance geometry proximity to footprint
          const footprint = getBuildingFootprintForCampus("utm", b.code);
          if (footprint) {
            for (const ent of b.entrances) {
              const d = pointToFootprintDistanceMeters(ent.coordinates, footprint.geometry);
              if (d > 75) {
                audit.detachedEntrances.push({
                  entranceId: ent.id,
                  buildingId: b.code,
                  distanceToFootprintMeters: Math.round(d),
                });
              }
            }
          }
        }

        // Check duplicate entrances in UTM
        for (let i = 0; i < allUtmEntrances.length; i++) {
          for (let j = i + 1; j < allUtmEntrances.length; j++) {
            const e1 = allUtmEntrances[i];
            const e2 = allUtmEntrances[j];
            if (e1 && e2) {
              const d = distanceMeters(e1.coordinates, e2.coordinates);
              if (d < 1.0) {
                audit.duplicateEntrances.push({
                  id1: e1.id,
                  id2: e2.id,
                  distanceMeters: Math.round(d * 10) / 10,
                  buildingId: "utm",
                });
              }
            }
          }
        }

        // Test representative routing pairs for UTM
        const routableList = buildings.filter((b) =>
          b.entrances.some((e) => connectedNodes.has(e.routingNodeId)),
        );
        const sampleStep = Math.max(1, Math.floor(routableList.length / 8));
        for (let i = 0; i < routableList.length; i += sampleStep) {
          for (let j = i + sampleStep; j < routableList.length; j += sampleStep) {
            const b1 = routableList[i];
            const b2 = routableList[j];
            if (!b1 || !b2) continue;
            audit.routePairsAttempted++;
            report.summary.totalRoutePairsTested++;

            const route = routeBetweenPublicBuildings({
              from: b1.code,
              to: b2.code,
              university: "uoft",
              campus: "utm",
            });

            if (
              route &&
              "status" in route &&
              (route.status === "routed" || route.status === "approximate")
            ) {
              audit.routePairsSuccessful++;
              report.summary.totalRoutePairsPassed++;

              if (b1.navigationPoint && b2.navigationPoint && route.totalDistanceMeters) {
                const straight = distanceMeters(b1.navigationPoint, b2.navigationPoint);
                const ratio = route.totalDistanceMeters / Math.max(straight, 10);
                if (ratio > 3.0 && route.totalDistanceMeters > 200) {
                  audit.extremeDetours.push({
                    from: b1.code,
                    to: b2.code,
                    routedDistanceMeters: Math.round(route.totalDistanceMeters),
                    straightLineDistanceMeters: Math.round(straight),
                    detourRatio: Math.round(ratio * 10) / 10,
                  });
                }
              }
            } else {
              report.summary.totalRouteFailures++;
              audit.routeFailures.push({
                from: b1.code,
                to: b2.code,
                reason: ("message" in route ? route.message : "unavailable") as string,
              });
            }
          }
        }
      } else if (!isRoutable) {
        // Identity-only campuses (utsg, utsc)
        const configs = campusBuildingConfigurations(campusId);
        audit.buildingCount = configs.length;
        report.summary.totalBuildings += configs.length;
        audit.capabilityLimitations.push(
          `${uni.shortName} ${campusId} is configured as identity-only; building search and footprint catalog are enabled, but pedestrian graph routing is explicitly unroutable.`,
        );
      } else {
        // External routable campus snapshots
        const snap = getCampusSnapshot(campusId);
        if (!snap) {
          audit.metadataValidationErrors.push(`Missing campus snapshot for ${campusId}`);
          report.campuses[campusId] = audit;
          continue;
        }

        audit.buildingCount = snap.buildings.length;
        report.summary.totalBuildings += snap.buildings.length;
        audit.entranceCount = snap.entrances.length;
        report.summary.totalEntrances += snap.entrances.length;

        const graph = getRoutingGraph(snap);

        // Building entrances and anchors
        for (const b of snap.buildings) {
          const bEntrances = snap.entrances.filter((e) => e.buildingId === b.id);
          if (bEntrances.length > 0) {
            audit.buildingsWithKnownEntrances++;
          } else {
            audit.buildingsWithoutKnownEntrances++;
          }

          const anchor = graph.getAnchor(b.id);
          if (!anchor) {
            audit.unanchoredBuildings.push(b.id);
            audit.graphIsolatedBuildings.push(b.id);
          } else {
            const edges = graph.adjacent.get(anchor.accessNodeId);
            if (!edges || edges.length === 0) {
              audit.graphIsolatedBuildings.push(b.id);
            } else {
              audit.routableBuildings++;
            }
          }

          // Check entrance distance from building geometry
          if (b.geometry) {
            for (const ent of bEntrances) {
              const d = pointToFootprintDistanceMeters(ent.coordinate, b.geometry);
              if (d > 75) {
                audit.detachedEntrances.push({
                  entranceId: ent.id,
                  buildingId: b.id,
                  distanceToFootprintMeters: Math.round(d),
                });
              }
            }
          }
        }

        // Duplicate entrances
        for (let i = 0; i < snap.entrances.length; i++) {
          for (let j = i + 1; j < snap.entrances.length; j++) {
            const e1 = snap.entrances[i];
            const e2 = snap.entrances[j];
            if (e1 && e2 && e1.buildingId === e2.buildingId) {
              const d = distanceMeters(e1.coordinate, e2.coordinate);
              if (d < 1.0) {
                audit.duplicateEntrances.push({
                  id1: e1.id,
                  id2: e2.id,
                  distanceMeters: Math.round(d * 10) / 10,
                  buildingId: e1.buildingId,
                });
              }
            }
          }
        }

        // Test representative routing pairs
        const routableList = snap.buildings.filter((b) => {
          const a = graph.getAnchor(b.id);
          return a && (graph.adjacent.get(a.accessNodeId)?.length ?? 0) > 0;
        });

        const sampleStep = Math.max(1, Math.floor(routableList.length / 8));
        for (let i = 0; i < routableList.length; i += sampleStep) {
          for (let j = i + sampleStep; j < routableList.length; j += sampleStep) {
            const b1 = routableList[i];
            const b2 = routableList[j];
            if (!b1 || !b2) continue;
            const code1 = b1.nativeCodes[0] ?? b1.id;
            const code2 = b2.nativeCodes[0] ?? b2.id;

            audit.routePairsAttempted++;
            report.summary.totalRoutePairsTested++;

            const route = routeBetweenPublicBuildings({
              from: code1,
              to: code2,
              university: uni.id,
              campus: campusId,
            });

            if (route && "status" in route && route.status === "routed") {
              audit.routePairsSuccessful++;
              report.summary.totalRoutePairsPassed++;

              // Check detour ratio
              const a1 = graph.getAnchor(b1.id);
              const a2 = graph.getAnchor(b2.id);
              if (a1 && a2 && route.totalDistanceMeters) {
                const straight = distanceMeters(a1.coordinate, a2.coordinate);
                const ratio = route.totalDistanceMeters / Math.max(straight, 10);
                if (ratio > 3.0 && route.totalDistanceMeters > 200) {
                  audit.extremeDetours.push({
                    from: code1,
                    to: code2,
                    routedDistanceMeters: Math.round(route.totalDistanceMeters),
                    straightLineDistanceMeters: Math.round(straight),
                    detourRatio: Math.round(ratio * 10) / 10,
                  });
                }
              }
            } else {
              report.summary.totalRouteFailures++;
              audit.routeFailures.push({
                from: code1,
                to: code2,
                reason: ("reason" in route
                  ? (route as any).reason
                  : "message" in route
                    ? (route as any).message
                    : "unavailable") as string,
              });
            }
          }
        }
      }

      // Check for identity leakage
      const publicList = listPublicBuildings({ university: uni.id, campus: campusId });
      for (const b of publicList) {
        if (b.university !== uni.id || b.campus !== campusId) {
          audit.identityLeakageFindings.push(
            `Building ${b.code} reported university=${b.university}, campus=${b.campus} when queried for ${uni.id}/${campusId}`,
          );
        }
      }

      // Record critical defects count
      if (audit.graphIsolatedBuildings.length > 0 || audit.routeFailures.length > 0) {
        report.summary.criticalDefectsFound +=
          audit.graphIsolatedBuildings.length + audit.routeFailures.length;
      }

      report.campuses[campusId] = audit;
    }
  }

  return report;
}

// Standalone execution
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("audit-multi-university-routing.ts") ||
    process.argv[1] === fileURLToPath(import.meta.url));
if (isMain) {
  console.log("Starting comprehensive multi-university routing and entrance audit...");
  const report = runComprehensiveCampusAudit();
  const outputPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../src/data/campuses/generated/routing-entrance-audit.json",
  );
  writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Audit complete. Written to ${outputPath}`);
  console.log("Summary:", JSON.stringify(report.summary, null, 2));

  for (const [campusId, res] of Object.entries(report.campuses)) {
    if (res.isRoutable) {
      console.log(`\n--- [${res.universityName} (${campusId})] ---`);
      console.log(
        `  Buildings: ${res.buildingCount} (Routable: ${res.routableBuildings}, Isolated/Unanchored: ${res.graphIsolatedBuildings.length})`,
      );
      console.log(
        `  Entrances: ${res.entranceCount} (Detached: ${res.detachedEntrances.length}, Duplicates: ${res.duplicateEntrances.length})`,
      );
      console.log(
        `  Route pairs: ${res.routePairsSuccessful}/${res.routePairsAttempted} successful`,
      );
      if (res.graphIsolatedBuildings.length > 0) {
        console.log(`  Isolated buildings: ${res.graphIsolatedBuildings.join(", ")}`);
      }
      if (res.routeFailures.length > 0) {
        console.log(
          `  Route failures (${res.routeFailures.length}):`,
          res.routeFailures.slice(0, 3),
        );
      }
      if (res.extremeDetours.length > 0) {
        console.log(
          `  Extreme detours (${res.extremeDetours.length}):`,
          res.extremeDetours.slice(0, 3),
        );
      }
    }
  }
}
