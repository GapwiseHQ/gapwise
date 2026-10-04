import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import manifest from "../universities.json";
import { timetableAdapters, demoTimetableLoaders } from "@/universities/timetable-adapters";
import {
  siteForHostname,
  supportedUniversities,
  universityById,
  universityForHostname,
} from "@/universities/registry";
import { verifyUniversityBrandAssets } from "../scripts/university-brand-assets";

const EXPECTED_UNIVERSITY_IDS = [
  "uoft",
  "carleton",
  "tmu",
  "queens",
  "laurier",
  "york",
  "mcmaster",
  "western",
  "guelph",
  "uottawa",
  "brock",
  "ubc",
  "waterloo",
  "mcgill",
] as const;

describe("Gapwise Ecosystem Consistency", () => {
  test("all university and campus hosts are live and supported", () => {
    for (const host of [
      "ubco.gapwise.ca",
      "glendon.gapwise.ca",
      "markham.gapwise.ca",
      "harvard.gapwise.ca",
      "yale.gapwise.ca",
      "princeton.gapwise.ca",
      "columbia.gapwise.ca",
      "brown.gapwise.ca",
      "dartmouth.gapwise.ca",
      "cornell.gapwise.ca",
      "upenn.gapwise.ca",
      "stanford.gapwise.ca",
      "mit.gapwise.ca",
      "cmu.gapwise.ca",
      "nyu.gapwise.ca",
      "ucberkeley.gapwise.ca",
    ]) {
      expect(siteForHostname(host)?.role).not.toBe("reserved");
      expect(universityForHostname(host)).not.toBeNull();
      expect(universityForHostname(host)?.status).toBe("supported");
    }
  });
  test("canonical registry distinguishes current and planned universities", () => {
    expect(manifest.universities).toHaveLength(manifest.universities.length);
    expect(manifest.universities.length).toBeGreaterThanOrEqual(28);
    const ids = supportedUniversities().map((u) => u.id);
    for (const expectedId of EXPECTED_UNIVERSITY_IDS) {
      expect(ids).toContain(expectedId);
    }
  });

  test("every university resolves via hostname and ID", () => {
    for (const uni of manifest.universities.filter((item) => item.status !== "planned")) {
      expect(universityById(uni.id)).not.toBeNull();
      for (const host of uni.hosts) {
        expect(siteForHostname(host)?.role).not.toBe("reserved");
        expect(siteForHostname(host)?.universityId).toBe(uni.id);
        expect(universityForHostname(host)?.id).toBe(uni.id);
        expect(universityForHostname(host.toUpperCase())?.id).toBe(uni.id);
      }
    }
  });

  test("every university has campus catalog and campus data", () => {
    for (const uni of manifest.universities.filter((item) => item.status !== "planned")) {
      if (uni.id === "uoft" || uni.dataPaths.length === 0) continue;
      const campusFile = resolve(`src/data/campuses/${uni.id}/campus.json`);
      const catalogFile = resolve(`src/data/campuses/${uni.id}/catalog.json`);
      expect(existsSync(campusFile)).toBe(true);
      expect(existsSync(catalogFile)).toBe(true);

      const catalog = JSON.parse(readFileSync(catalogFile, "utf8"));
      expect(catalog.buildings.length).toBeGreaterThanOrEqual(10);
      expect(catalog.entrances.length).toBeGreaterThanOrEqual(10);
    }
  });

  test("every university has an adapter and demo loader registered", () => {
    for (const uni of manifest.universities.filter((item) => item.status !== "planned")) {
      const adapterKey = uni.timetableAdapter;
      expect(adapterKey).toBeDefined();
      expect(typeof timetableAdapters[adapterKey]).toBe("function");
      expect(typeof demoTimetableLoaders[adapterKey]).toBe("function");
    }
  });

  test("every university has complete web assets (logo, manifest, og-card, icons)", () => {
    for (const uni of manifest.universities.filter((item) => item.status !== "planned")) {
      if (uni.dataPaths.length === 0) continue;
      const dir = resolve(`public/universities/${uni.id}`);
      expect(existsSync(resolve(dir, "logo-mark.svg"))).toBe(true);
      expect(existsSync(resolve(dir, "site.webmanifest"))).toBe(true);
      expect(existsSync(resolve(dir, "og-card.png"))).toBe(true);
      expect(existsSync(resolve(dir, "icon-192.png"))).toBe(true);
      expect(existsSync(resolve(dir, "icon-512.png"))).toBe(true);
      expect(existsSync(resolve(dir, "favicon-16x16.png"))).toBe(true);
      expect(existsSync(resolve(dir, "favicon-32x32.png"))).toBe(true);
      expect(existsSync(resolve(dir, "apple-touch-icon.png"))).toBe(true);
    }
  });

  test("every university branding directory exactly matches its registry entry", async () => {
    expect(await verifyUniversityBrandAssets(manifest.universities)).toEqual([]);
  }, 15_000);

  test("vercel.json resolves every intentional university hostname generically", () => {
    const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
    const rewrites = vercelConfig.rewrites as Array<{
      source: string;
      has?: Array<{ type: string; value: string }>;
      destination: string;
    }>;

    const hostPattern = rewrites
      .find((entry) => entry.destination === "/_sites/:site/index.html")
      ?.has?.find((condition) => condition.type === "host")?.value;
    expect(hostPattern).toBeDefined();
    for (const site of manifest.sites.filter((item) => item.role !== "global"))
      expect(site.hosts.every((host) => new RegExp(`^${hostPattern}$`).test(host))).toBe(true);
  });

  test("marketing landing derives discovery and editions from every supported university", () => {
    const landing = readFileSync("src/components/MarketingLandingImpl.tsx", "utf8");
    const globalHome = readFileSync("src/components/GlobalMarketingHome.tsx", "utf8");
    const universityHome = readFileSync("src/components/UniversityMarketingHome.tsx", "utf8");

    expect(supportedUniversities().map((university) => university.id)).toEqual(
      manifest.universities.map((university) => university.id),
    );
    expect(landing).toContain("<GlobalMarketingHome");
    expect(landing).toContain("<UniversityMarketingHome");
    expect(globalHome).toContain("supportedUniversities()");
    expect(globalHome).toContain("UNIVERSITY_DESTINATIONS");
    expect(universityHome).toContain("marketingForSite(site, university)");
  });

  test("data repository includes all supported universities in campus-contribution-data.js", () => {
    if (!existsSync("../data/src/campus-contribution-data.js")) {
      return;
    }
    const dataContributionCode = readFileSync("../data/src/campus-contribution-data.js", "utf8");
    for (const expectedId of EXPECTED_UNIVERSITY_IDS) {
      expect(dataContributionCode).toContain(`id: "${expectedId}"`);
    }
  });

  test("docs repository guides and platform docs list all supported universities", () => {
    if (!existsSync("../docs/src/content/docs/guides/add-university.md")) {
      return;
    }
    const guideCode = readFileSync("../docs/src/content/docs/guides/add-university.md", "utf8");
    const ecosystemDoc = readFileSync("../docs/src/content/docs/platform/ecosystem.md", "utf8");
    for (const expectedId of EXPECTED_UNIVERSITY_IDS) {
      expect(guideCode).toContain(
        expectedId === "uoft" ? "gapwise.ca" : `${expectedId}.gapwise.ca`,
      );
      expect(ecosystemDoc).toContain(
        expectedId === "uoft" ? "gapwise.ca" : `${expectedId}.gapwise.ca`,
      );
    }
  });

  test("status repository automatic checks cover all supported universities", () => {
    if (!existsSync("../status/scripts/update-status.mjs")) {
      return;
    }
    const statusScript = readFileSync("../status/scripts/update-status.mjs", "utf8");
    for (const expectedId of EXPECTED_UNIVERSITY_IDS) {
      const url =
        expectedId === "uoft" ? "https://gapwise.ca/" : `https://${expectedId}.gapwise.ca/`;
      expect(statusScript).toContain(url);
    }
  });
});
