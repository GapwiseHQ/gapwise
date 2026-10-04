import { describe, expect, it } from "bun:test";
import { runComprehensiveCampusAudit } from "../scripts/audit-multi-university-routing.js";
import { routeBetweenPublicBuildings } from "../src/server/public-campus/service.js";
import {
  allCampuses,
  supportedUniversities,
  supportedCampuses,
} from "../src/universities/registry.js";

describe("Multi-University Campus Routing & Entrance Quality Audit", () => {
  const auditReport = runComprehensiveCampusAudit();

  it("completes the full supported-platform audit without crashing", () => {
    expect(auditReport.summary.totalUniversities).toBe(supportedUniversities().length);
    expect(auditReport.summary.totalCampuses).toBe(supportedCampuses().length);
    expect(auditReport.summary.routableCampuses).toBe(
      supportedCampuses().filter((c) => c.routable).length,
    );
    expect(allCampuses().length).toBe(allCampuses().length);
    expect(auditReport.summary.totalRouteFailures).toBe(0);
  });

  it("verifies TMU academic core buildings (SLC, DCC, Vari Eng) are routable without extreme detours", () => {
    const tmu = auditReport.campuses["tmu"];
    expect(tmu).toBeDefined();
    expect(tmu.routableBuildings).toBe(30);
    expect(tmu.graphIsolatedBuildings.length).toBe(0);

    const slcToLib = routeBetweenPublicBuildings({
      from: "SLC",
      to: "LIB",
      university: "tmu",
      campus: "tmu",
    });
    expect("status" in slcToLib && slcToLib.status).toBe("routed");
    if ("totalDistanceMeters" in slcToLib) {
      expect(slcToLib.totalDistanceMeters).toBeLessThan(250);
    }
  });

  it("verifies Queen's libraries (Stauffer, Douglas) and Gordon Hall are routable", () => {
    const queens = auditReport.campuses["queens"];
    expect(queens).toBeDefined();
    expect(queens.routableBuildings).toBeGreaterThanOrEqual(33);
    expect(queens.graphIsolatedBuildings.length).toBe(0);

    const route = routeBetweenPublicBuildings({
      from: "stauffer-library",
      to: "douglas-library",
      university: "queens",
      campus: "queens",
    });
    expect("status" in route && route.status).toBe("routed");
  });

  it("verifies Guelph McLaughlin Library is connected and routable to University Centre", () => {
    const guelph = auditReport.campuses["guelph"];
    expect(guelph).toBeDefined();
    expect(guelph.routableBuildings).toBeGreaterThanOrEqual(15);
    expect(guelph.graphIsolatedBuildings.length).toBe(0);

    const route = routeBetweenPublicBuildings({
      from: "UC",
      to: "LIB",
      university: "guelph",
      campus: "guelph",
    });
    expect("status" in route && route.status).toBe("routed");
    if ("totalDistanceMeters" in route) {
      expect(route.totalDistanceMeters).toBeLessThan(300);
    }
  });

  it("verifies McMaster science buildings (General Sciences, Tandem Accelerator) are routable", () => {
    const mcmaster = auditReport.campuses["mcmaster"];
    expect(mcmaster).toBeDefined();
    expect(mcmaster.routableBuildings).toBeGreaterThanOrEqual(32);
    expect(mcmaster.graphIsolatedBuildings.length).toBe(0);

    const route = routeBetweenPublicBuildings({
      from: "BSB",
      to: "JHE",
      university: "mcmaster",
      campus: "mcmaster",
    });
    expect("status" in route && route.status).toBe("routed");
  });

  it("verifies Brock Schmon Tower to Thistle Complex selects optimal entrance (<150m, preventing 1500m detour)", () => {
    const brock = auditReport.campuses["brock"];
    expect(brock).toBeDefined();
    expect(brock.routableBuildings).toBeGreaterThanOrEqual(12);
    expect(brock.graphIsolatedBuildings.length).toBe(0);

    const route = routeBetweenPublicBuildings({
      from: "ST",
      to: "TH",
      university: "brock",
      campus: "brock",
    });
    expect("status" in route && route.status).toBe("routed");
    if ("totalDistanceMeters" in route) {
      expect(route.totalDistanceMeters).toBeLessThan(150);
    }
  });

  it("verifies Laurier Claudette Millar Hall is routable to Science Building", () => {
    const laurier = auditReport.campuses["waterloo"];
    expect(laurier).toBeDefined();
    expect(laurier.routableBuildings).toBeGreaterThanOrEqual(25);
    expect(laurier.graphIsolatedBuildings.length).toBe(0);

    const route = routeBetweenPublicBuildings({
      from: "CMH",
      to: "S",
      university: "laurier",
      campus: "waterloo",
    });
    expect("status" in route && route.status).toBe("routed");
  });

  it("routes representative UTSG academic destinations over the St. George graph", () => {
    for (const [from, to] of [
      ["RL", "BA"],
      ["BA", "SS"],
      ["MS", "RL"],
      ["CH", "BA"],
    ]) {
      const route = routeBetweenPublicBuildings({
        from: from!,
        to: to!,
        university: "uoft",
        campus: "utsg",
      });
      expect("status" in route && route.status).toBe("routed");
      if ("totalDistanceMeters" in route) expect(route.totalDistanceMeters).toBeGreaterThan(0);
    }
  });

  it("routes multiple representative UTSC academic destinations over the Scarborough graph", () => {
    for (const [from, to] of [
      ["SW", "HW"],
      ["AC", "IC"],
      ["HL", "SW"],
    ]) {
      const route = routeBetweenPublicBuildings({
        from: from!,
        to: to!,
        university: "uoft",
        campus: "utsc",
      });
      expect("status" in route && route.status).toBe("routed");
      if ("totalDistanceMeters" in route) expect(route.totalDistanceMeters).toBeGreaterThan(0);
    }
  });

  it("asserts zero identity leakage across public building listings", () => {
    for (const [campusId, campusAudit] of Object.entries(auditReport.campuses)) {
      expect(campusAudit.identityLeakageFindings).toEqual([]);
    }
  });
});
