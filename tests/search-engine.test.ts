import { describe, expect, it } from "bun:test";
import { searchGapwise } from "../src/features/search/search-engine";
import type { Meeting } from "../src/lib/timetable-types";

describe("Gapwise Search Engine (Phase 3)", () => {
  it("returns initial suggestions when query is empty", () => {
    const results = searchGapwise("", { campusId: "utm" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.data.actionId === "route")).toBe(true);
    expect(results.some((r) => r.data.actionId === "timetable")).toBe(true);
  });

  it("finds UTM building by exact code and ranks it top", () => {
    const results = searchGapwise("MN", { campusId: "utm" });
    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    expect(top.category).toBe("buildings");
    expect(top.data.buildingCode).toBe("MN");
    expect(top.title).toContain("Maanjiwe nendamowinan");
  });

  it("resolves room-like query to building and room data", () => {
    const results = searchGapwise("MN 3120", { campusId: "utm" });
    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    expect(top.data.buildingCode).toBe("MN");
    expect(top.data.room).toBe("3120");
    expect(top.data.floor).toBe("3");
    expect(top.subtitle).toContain("Room 3120");
    expect(top.subtitle).toContain("Floor 3");
  });

  it("matches building by full name and aliases", () => {
    const resultsDavis = searchGapwise("William G Davis", { campusId: "utm" });
    expect(resultsDavis.length).toBeGreaterThan(0);
    expect(resultsDavis[0].data.buildingCode).toBe("DV");

    const resultsLibrary = searchGapwise("Library", { campusId: "utm" });
    expect(resultsLibrary.some((r) => r.data.buildingCode === "HM")).toBe(true);
  });

  it("handles typos and fuzzy matching gracefully", () => {
    // "maanjwe" -> "Maanjiwe"
    const fuzzyMN = searchGapwise("maanjwe", { campusId: "utm" });
    expect(fuzzyMN.length).toBeGreaterThan(0);
    expect(fuzzyMN.some((r) => r.data.buildingCode === "MN")).toBe(true);

    // "kanef" -> "Kaneff"
    const fuzzyKN = searchGapwise("kanef", { campusId: "utm" });
    expect(fuzzyKN.length).toBeGreaterThan(0);
    expect(fuzzyKN.some((r) => r.data.buildingCode === "KN")).toBe(true);
  });

  it("enforces strict university isolation for local building search", () => {
    // When searching on UTM, we should never see TMU's SLC building or Carleton's Dunton Tower in buildings
    const results = searchGapwise("Dunton", { campusId: "utm" });
    const buildingMatches = results.filter((r) => r.category === "buildings");
    expect(buildingMatches.length).toBe(0);
  });

  it("scopes UTSG and UTSC building-code search to the selected campus", () => {
    const utsg = searchGapwise("BA", { campusId: "utsg" });
    expect(utsg[0]).toMatchObject({
      category: "buildings",
      data: { buildingCode: "BA", campusId: "utsg" },
    });
    expect(utsg[0]?.title).toContain("Bahen Centre for Information Technology");

    const utsc = searchGapwise("SW", { campusId: "utsc" });
    expect(utsc[0]).toMatchObject({ category: "buildings", data: { buildingCode: "SW" } });
    expect(utsc[0]?.title).toContain("Science Wing");
    const crossCampus = searchGapwise("Bahen", { campusId: "utsc" }).filter(
      (result) => result.category === "buildings",
    );
    expect(crossCampus.some((result) => result.data.buildingCode === "BA")).toBe(false);
    expect(crossCampus.some((result) => result.title.includes("Bahen"))).toBe(false);
  });

  it("does not silently search UTM when a multi-campus university has no campus evidence", () => {
    const buildings = searchGapwise("MN", { campusId: null }).filter(
      (result) => result.category === "buildings",
    );
    expect(buildings).toEqual([]);
  });

  it("allows switching universities when searching external institutions or aliases", () => {
    // Searching "Carleton" returns Switch to Carleton University
    const carleton = searchGapwise("Carleton", { campusId: "utm" });
    const uniCarleton = carleton.find((r) => r.category === "universities");
    expect(uniCarleton).toBeDefined();
    expect(uniCarleton?.data.universityId).toBe("carleton");

    // Searching alias "Ryerson" returns Switch to TMU
    const ryerson = searchGapwise("Ryerson", { campusId: "utm" });
    const uniTMU = ryerson.find((r) => r.category === "universities");
    expect(uniTMU).toBeDefined();
    expect(uniTMU?.data.universityId).toBe("tmu");

    // Searching alias "Mac" returns Switch to McMaster
    const mac = searchGapwise("McMaster", { campusId: "utm" });
    const uniMac = mac.find((r) => r.category === "universities");
    expect(uniMac).toBeDefined();
    expect(uniMac?.data.universityId).toBe("mcmaster");
  });

  it("matches application actions and features", () => {
    const importResults = searchGapwise("import", { campusId: "utm" });
    expect(importResults.some((r) => r.data.actionId === "import")).toBe(true);

    const mapResults = searchGapwise("map", { campusId: "utm" });
    expect(mapResults.some((r) => r.data.actionId === "route")).toBe(true);

    const settingsResults = searchGapwise("settings", { campusId: "utm" });
    expect(settingsResults.some((r) => r.data.actionId === "settings")).toBe(true);
  });

  it("indexes enrolled timetable courses when meetings are present", () => {
    const dummyMeetings: Meeting[] = [
      {
        id: "m-1",
        courseCode: "CSC148H5",
        courseName: "Introduction to Computer Science",
        activityType: "LEC",
        sectionCode: "0101",
        weekday: "Monday",
        startTime: 600,
        endTime: 660,
        locationUnknown: false,
        buildingCode: "DH",
        room: "2060",
        term: "Winter",
      },
    ];

    const results = searchGapwise("CSC148", { campusId: "utm", meetings: dummyMeetings });
    const course = results.find((r) => r.category === "courses");
    expect(course).toBeDefined();
    expect(course?.title).toBe("CSC148H5");
    expect(course?.subtitle).toBe("Introduction to Computer Science");
  });
});
