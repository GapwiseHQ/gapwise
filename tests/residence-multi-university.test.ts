import { beforeAll, describe, expect, it } from "bun:test";
import manifest from "../universities.json" with { type: "json" };
import {
  campusResidenceBuildings,
  campusBuildingConfigurations,
  ensureCampusCatalog,
  getResidenceBuildingForCampus,
  type GapwiseCampusId,
} from "../src/data/campuses/index.js";
import {
  selectedResidence,
  createResidenceMeeting,
  isResidenceMeeting,
} from "../src/features/routing/residence.js";
import {
  selectedCampusDayAnchor,
  campusDayAnchorPresentation,
} from "../src/features/routing/campus-day.js";
import { listPublicBuildings } from "../src/server/public-campus/service.js";
import residenceMatrix from "../src/data/campuses/generated/residence-coverage-matrix.json" with { type: "json" };
import type { UserPreferences } from "../src/features/sync/preferences.js";
import { supportedCampuses, supportedUniversities } from "../src/universities/registry.js";

const DEFAULT_PREFS: UserPreferences = {
  theme: "system",
  density: "normal",
  scheduleLayout: "auto",
  visibleTerms: ["F", "S"],
  hiddenCourseCodes: [],
  selectedSectionIds: {},
  colorOverrides: {},
  customEvents: [],
  walkingSpeed: "normal",
  walkingSpeedMps: 1.2,
  routeMode: "balanced",
  elevationAvoidance: "moderate",
  indoorRouting: true,
  preferredEntranceType: "accessible",
  mainCampus: "utm",
  campusAccessPointId: null,
  commuteMode: null,
  dayOrigin: "residence",
  residenceBuildingCode: "OPH",
  targetGapMinutes: 30,
  preferredStudyEnvironment: "quiet",
  primaryStudySpaceId: null,
  secondaryStudySpaceId: null,
};

describe("First-class multi-university residence platform", () => {
  beforeAll(async () => {
    await Promise.all(supportedCampuses().map((campus) => ensureCampusCatalog(campus.id)));
  });

  it("provides verified residence coverage across every supported campus model", () => {
    expect(residenceMatrix.summary.coveragePercentage).toBe(100);
    expect(residenceMatrix.summary.campusesWithResidenceCoverage).toBe(supportedCampuses().length);
    expect(residenceMatrix.summary.universitiesWithResidenceCoverage).toBe(
      supportedUniversities().length,
    );
    expect(residenceMatrix.summary.totalResidences).toBeGreaterThanOrEqual(199);

    for (const campus of supportedCampuses()) {
      const campusId = campus.id as GapwiseCampusId;
      const residences = campusResidenceBuildings(campusId);
      expect(residences.length).toBeGreaterThan(0);

      for (const res of residences) {
        expect(res.category).toBe("residence");
        expect(res.code).toBeTruthy();
        expect(res.name).toBeTruthy();
        // Fail-closed privacy guard: no room-level or student-name data
        expect(res.name).not.toMatch(/room\s*\d+/i);
        expect(res.name).not.toMatch(/unit\s*\d+/i);
        expect(res.name).not.toMatch(/suite\s*\d+/i);
      }
    }
  });

  it("resolves residence building lookups for any supported campus", () => {
    // UTM
    expect(getResidenceBuildingForCampus("utm", "OPH")?.name).toBe("Oscar Peterson Hall");
    expect(getResidenceBuildingForCampus("utm", "EH")?.name).toBe("Erindale Hall");

    // UTSG
    expect(getResidenceBuildingForCampus("utsg", "013")?.name).toBe("Whitney Hall");
    expect(getResidenceBuildingForCampus("utsg", "158")?.name).toBe(
      "Chestnut Residence and Conference Centre",
    );

    // UTSC
    expect(getResidenceBuildingForCampus("utsc", "JF")?.name).toBe("Joan Foley Hall");

    // Carleton
    expect(getResidenceBuildingForCampus("carleton", "GH")?.name).toBe("Glengarry House");
    expect(getResidenceBuildingForCampus("carleton", "LE")?.name).toBe("Leeds House");

    // TMU
    expect(getResidenceBuildingForCampus("tmu", "PIT")?.name).toBe("Pitman Hall");
    expect(getResidenceBuildingForCampus("tmu", "ILC")?.name).toBe(
      "International Living/Learning Centre",
    );

    // Queen's
    expect(getResidenceBuildingForCampus("queens", "CHO")?.name).toBe("Chown Hall");
    expect(getResidenceBuildingForCampus("queens", "MOR")?.name).toBe("Morris Hall");

    // Laurier
    expect(getResidenceBuildingForCampus("waterloo", "KSR")?.name).toBe("King Street Residence");
    expect(getResidenceBuildingForCampus("waterloo", "BR")?.name).toBe("Bricker Residence");

    // York
    expect(getResidenceBuildingForCampus("keele", "VC")?.name).toBe("Vanier College");
    expect(getResidenceBuildingForCampus("keele", "POND")?.name).toBe("The Pond Road Residence");

    // McMaster
    expect(getResidenceBuildingForCampus("mcmaster", "PGCLL")?.name).toBe(
      "Peter George Centre for Living and Learning",
    );
    expect(getResidenceBuildingForCampus("mcmaster", "BATES")?.name).toBe("Bates Residence");

    // Western
    expect(getResidenceBuildingForCampus("western", "LH")?.name).toBe("London Hall");
    expect(getResidenceBuildingForCampus("western", "SMH")?.name).toBe("Saugeen-Maitland Hall");

    // Guelph
    expect(getResidenceBuildingForCampus("guelph", "JH")?.name).toBe("Johnston Hall");
    expect(getResidenceBuildingForCampus("guelph", "SR")?.name).toBe("South Residence");

    // uOttawa
    expect(getResidenceBuildingForCampus("uottawa", "90U")?.name).toBe("90 University");
    expect(getResidenceBuildingForCampus("uottawa", "HS")?.name).toBe("Hyman Soloway Residence");

    // Brock
    expect(getResidenceBuildingForCampus("brock", "DEC")?.name).toBe("DeCew Residence");
    expect(getResidenceBuildingForCampus("brock", "LOW")?.name).toBe("Lowenberger Residence");
  });

  it("resolves selectedResidence across all campuses dynamically", () => {
    // Carleton residence
    const carletonPrefs: UserPreferences = {
      ...DEFAULT_PREFS,
      mainCampus: "carleton",
      residenceBuildingCode: "GH",
    };
    const carletonRes = selectedResidence(carletonPrefs);
    expect(carletonRes).not.toBeNull();
    expect(carletonRes?.name).toBe("Glengarry House");

    // Western residence
    const westernPrefs: UserPreferences = {
      ...DEFAULT_PREFS,
      mainCampus: "western",
      residenceBuildingCode: "LH",
    };
    const westernRes = selectedResidence(westernPrefs);
    expect(westernRes).not.toBeNull();
    expect(westernRes?.name).toBe("London Hall");

    // uOttawa residence
    const uottawaPrefs: UserPreferences = {
      ...DEFAULT_PREFS,
      mainCampus: "uottawa",
      residenceBuildingCode: "90U",
    };
    const uottawaRes = selectedResidence(uottawaPrefs);
    expect(uottawaRes).not.toBeNull();
    expect(uottawaRes?.name).toBe("90 University");
  });

  it("creates campus day anchors for residences across non-UTM campuses", () => {
    const mcmasterPrefs: UserPreferences = {
      ...DEFAULT_PREFS,
      mainCampus: "mcmaster",
      residenceBuildingCode: "PGCLL",
    };
    const anchor = selectedCampusDayAnchor(mcmasterPrefs);
    expect(anchor).not.toBeNull();
    expect(anchor?.kind).toBe("residence");
    expect(anchor?.label).toBe("Peter George Centre for Living and Learning");
    expect(anchor?.coordinates).toBeArray();
    expect(anchor?.coordinates[0]).toBeNumber();
    expect(anchor?.coordinates[1]).toBeNumber();

    const meeting = createResidenceMeeting({
      buildingCode: "PGCLL",
      term: "F",
      weekday: "Monday",
      time: 540,
      position: "start",
      campus: "mcmaster",
    });
    expect(isResidenceMeeting(meeting)).toBe(true);
    expect(meeting.campus).toBe("MCMASTER");

    const pres = campusDayAnchorPresentation(meeting);
    expect(pres).not.toBeNull();
    expect(pres?.kind).toBe("residence");
    expect(pres?.label).toBe("Peter George Centre for Living and Learning");
    expect(pres?.title).toBe("Start at home");
  });

  it("supports public API listing filtered by category=residence across all universities", () => {
    const universities = [
      { u: "uoft", c: "utm" },
      { u: "carleton", c: "carleton" },
      { u: "tmu", c: "tmu" },
      { u: "queens", c: "queens" },
      { u: "laurier", c: "waterloo" },
      { u: "york", c: "keele" },
      { u: "mcmaster", c: "mcmaster" },
      { u: "western", c: "western" },
      { u: "guelph", c: "guelph" },
      { u: "uottawa", c: "uottawa" },
      { u: "brock", c: "brock" },
    ];

    for (const { u, c } of universities) {
      const residences = listPublicBuildings({ university: u, campus: c, category: "residence" });
      expect(residences.length).toBeGreaterThan(0);
      for (const r of residences) {
        expect(r.category).toBe("residence");
        expect(r.university).toBe(u);
        expect(r.name).toBeTruthy();
        expect(r.code).toBeTruthy();
      }
    }
  });
});
