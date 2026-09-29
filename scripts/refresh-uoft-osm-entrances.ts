import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CampusBuilding, CampusSnapshot, Coordinate } from "../src/data/campuses/contract.js";

const CAMPUS_TILES: Record<string, string[]> = {
  utsg: [
    "-79.408,43.653,-79.395,43.6615",
    "-79.395,43.653,-79.382,43.6615",
    "-79.408,43.6615,-79.395,43.670",
    "-79.395,43.6615,-79.382,43.670",
  ],
  utsc: ["-79.205,43.775,-79.175,43.795"],
};

type OsmEntrance = {
  id: string;
  coordinate: Coordinate;
  tags: Record<string, string>;
};

function attributes(raw: string): Record<string, string> {
  return Object.fromEntries(
    [...raw.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1]!, match[2]!]),
  );
}

function parseEntranceNodes(xml: string): OsmEntrance[] {
  const entrances: OsmEntrance[] = [];
  for (const match of xml.matchAll(/<node\b([^>]*)>([\s\S]*?)<\/node>/g)) {
    const node = attributes(match[1]!);
    const tags = Object.fromEntries(
      [...match[2]!.matchAll(/<tag\b([^>]*)\/>/g)].map((tagMatch) => {
        const tag = attributes(tagMatch[1]!);
        return [tag["k"]!, tag["v"]!];
      }),
    );
    if (!tags["entrance"] || tags["entrance"] === "no") continue;
    const longitude = Number(node["lon"]);
    const latitude = Number(node["lat"]);
    if (!node["id"] || !Number.isFinite(longitude) || !Number.isFinite(latitude)) continue;
    entrances.push({ id: node["id"], coordinate: [longitude, latitude], tags });
  }
  return entrances;
}

function rings(building: CampusBuilding): Coordinate[][] {
  if (!building.geometry) return [];
  if (building.geometry.type === "Polygon") {
    return (building.geometry.coordinates as Coordinate[][]).slice(0, 1);
  }
  return (building.geometry.coordinates as Coordinate[][][]).map((polygon) => polygon[0]!);
}

function segmentDistanceMeters(point: Coordinate, from: Coordinate, to: Coordinate): number {
  const latitudeRadians = (point[1] * Math.PI) / 180;
  const xScale = 111_320 * Math.cos(latitudeRadians);
  const yScale = 110_540;
  const ax = (from[0] - point[0]) * xScale;
  const ay = (from[1] - point[1]) * yScale;
  const bx = (to[0] - point[0]) * xScale;
  const by = (to[1] - point[1]) * yScale;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

function boundaryDistanceMeters(point: Coordinate, building: CampusBuilding): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (const ring of rings(building)) {
    for (let index = 1; index < ring.length; index++) {
      minimum = Math.min(minimum, segmentDistanceMeters(point, ring[index - 1]!, ring[index]!));
    }
  }
  return minimum;
}

function matchBuilding(entrance: OsmEntrance, buildings: CampusBuilding[]): CampusBuilding | null {
  const candidates = buildings
    .map((building) => ({
      building,
      distance: boundaryDistanceMeters(entrance.coordinate, building),
    }))
    .filter((candidate) => candidate.distance <= 3)
    .sort((a, b) => a.distance - b.distance);
  if (candidates.length === 0) return null;
  if (candidates[1] && Math.abs(candidates[1].distance - candidates[0]!.distance) < 0.25)
    return null;
  return candidates[0]!.building;
}

function entranceAccess(tags: Record<string, string>): "restricted" | "unknown" {
  if (
    tags["entrance"] === "emergency" ||
    ["private", "no", "customers", "permit"].includes(tags["access"] ?? "")
  ) {
    return "restricted";
  }
  return "unknown";
}

async function downloadTile(bbox: string): Promise<string> {
  const response = await fetch(`https://api.openstreetmap.org/api/0.6/map?bbox=${bbox}`, {
    headers: { "User-Agent": "Gapwise campus entrance refresh (https://gapwise.ca)" },
  });
  if (!response.ok)
    throw new Error(`OpenStreetMap map API returned ${response.status} for ${bbox}`);
  return response.text();
}

for (const campusId of process.argv.slice(2)) {
  const tiles = CAMPUS_TILES[campusId];
  if (!tiles) throw new Error(`Unknown campus '${campusId}'. Choose utsg or utsc.`);
  const path = resolve(`src/data/campuses/${campusId}/campus.json`);
  const campus = JSON.parse(await readFile(path, "utf8")) as CampusSnapshot;
  const entranceById = new Map<string, OsmEntrance>();
  for (const xml of await Promise.all(tiles.map(downloadTile))) {
    for (const entrance of parseEntranceNodes(xml)) entranceById.set(entrance.id, entrance);
  }

  const originalNodeIds = new Set(campus.pathNodes.map((node) => node.id));
  const connectedNodeIds = new Set(campus.pathEdges.flatMap((edge) => [edge.from, edge.to]));
  const matched = [...entranceById.values()]
    .map((entrance) => ({ entrance, building: matchBuilding(entrance, campus.buildings) }))
    .filter((item): item is { entrance: OsmEntrance; building: CampusBuilding } =>
      Boolean(item.building),
    );

  campus.entrances = matched.map(({ entrance, building }) => {
    const existingNode = campus.pathNodes.find(
      (node) =>
        connectedNodeIds.has(node.id) &&
        segmentDistanceMeters(entrance.coordinate, node.coordinate, node.coordinate) <= 0.5,
    );
    const pathNodeId = existingNode?.id ?? `osm-node-${entrance.id}`;
    if (!originalNodeIds.has(pathNodeId)) {
      campus.pathNodes.push({
        id: pathNodeId,
        coordinate: entrance.coordinate,
        provenance: [
          {
            sourceId: `osm-${campusId}-2026-09`,
            nativeId: `node/${entrance.id}`,
            verification: "source-backed",
          },
        ],
      });
      originalNodeIds.add(pathNodeId);
    }
    return {
      id: `osm-node-${entrance.id}`,
      buildingId: building.id,
      coordinate: entrance.coordinate,
      pathNodeId,
      access: entranceAccess(entrance.tags),
      provenance: [
        {
          sourceId: `osm-${campusId}-2026-09`,
          nativeId: `node/${entrance.id}`,
          verification: "source-backed" as const,
        },
      ],
    };
  });

  await writeFile(path, `${JSON.stringify(campus)}\n`, "utf8");
  const coveredBuildings = new Set(campus.entrances.map((entrance) => entrance.buildingId));
  console.log(
    `${campusId}: ${campus.entrances.length} source-backed entrances across ${coveredBuildings.size}/${campus.buildings.length} buildings (${entranceById.size} OSM entrance nodes inspected).`,
  );
}
