import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("Gapwise marketing system", () => {
  test("tells the real five-product story without retired landing effects", async () => {
    const landing = await readFile("src/components/MarketingLandingImpl.tsx", "utf8");
    const global = await readFile("src/components/GlobalMarketingHome.tsx", "utf8");
    const university = await readFile("src/components/UniversityMarketingHome.tsx", "utf8");
    const app = await readFile("src/routes/_app.tsx", "utf8");

    for (const product of [
      "Gapwise",
      "Gapwise AI",
      "Gapwise Docs",
      "Gapwise Data",
      "Gapwise Status",
    ]) {
      expect(global).toContain(product);
    }

    expect(landing).toContain("<UniversityMarketingHome");
    expect(university).toContain('to="/timetable"');
    expect(university).toContain('to="/gaps"');
    expect(university).toContain('to="/route"');
    expect(global).not.toContain("https://ai.gapwise.ca/api/mcp");
    expect(global).not.toContain('to="/ops"');
    expect(global).toContain("https://docs.gapwise.ca");
    expect(global).toContain("https://data.gapwise.ca");
    expect(global).toContain("https://status.gapwise.ca");
    expect(app).toContain("<MarketingLanding");
    expect(app).not.toContain("landing-bento rise-in");
    expect(app).not.toContain("Private by design");
    expect(app).not.toContain("Independent student project");
    expect(app).not.toContain("--parallax-");
  });

  test("keeps motion native, restrained, and reducible", async () => {
    const css = await readFile("src/components/marketing-landing.css", "utf8");
    const brand = await readFile("src/brand-blue.css", "utf8");

    expect(css).toContain("animation-timeline: view()");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).not.toMatch(/radial-gradient|filter:\s*blur|box-shadow:\s*0 0/i);
    expect(brand).not.toMatch(/radial-gradient|linear-gradient/i);
    expect(brand).not.toContain("#5965cc");
    expect(brand).not.toContain("#6975df");
    expect(brand).toContain("main.landing-stage .hero-word::after");
    expect(brand).toContain("display: none !important");
  });

  test("pins the mobile public chrome instead of handing off between sticky rows", async () => {
    const stability = await readFile("src/landing-mobile-stability.css", "utf8");
    const html = await readFile("index.html", "utf8");

    expect(html).toContain("viewport-fit=cover");
    expect(stability).toContain("--gapwise-safe-top: env(safe-area-inset-top, 0px)");
    expect(stability).toMatch(/\.desktop-app-header\s*\{[\s\S]*position:\s*fixed\s*!important/);
    expect(stability).toMatch(/\.product-story-nav\s*\{[\s\S]*position:\s*fixed\s*!important/);
    expect(stability).toContain("padding-top: var(--gapwise-public-chrome-height) !important;");
    expect(stability).toContain("transform: translate3d(0, 0, 0)");
  });

  test("keeps the mark transparent and the product switcher complete on mobile", async () => {
    const cohesion = await readFile("src/cohesion.css", "utf8");

    expect(cohesion).toMatch(
      /\.brand-mark-shell\s*\{[\s\S]*background:\s*transparent\s*!important/,
    );
    expect(cohesion).toContain("border-top: 1px solid var(--color-border) !important");
    expect(cohesion).toContain("border-bottom: 1px solid var(--color-border) !important");
  });

  test("restores distinct tutorial, practical, and reserved export semantics", async () => {
    const cohesion = await readFile("src/cohesion.css", "utf8");
    const exportTheme = await readFile("src/lib/timetable-linear-export.ts", "utf8");

    expect(cohesion).toContain("--tut: oklch(0.54 0.14 225)");
    expect(cohesion).toContain("--pra: oklch(0.53 0.14 302)");
    expect(exportTheme).toContain('tut: "#72bdcf"');
    expect(exportTheme).toContain('pra: "#b18bd0"');
    expect(exportTheme).toContain('reserved: "#dfad52"');
  });

  test("shows representative universities while making every edition searchable", async () => {
    const landing = await readFile("src/components/GlobalMarketingHome.tsx", "utf8");
    const manifest = JSON.parse(await readFile("universities.json", "utf8"));

    expect(landing).toContain('id="universities"');
    expect(landing).toContain("Built for your campus.");
    expect(landing).toContain("supportedUniversities()");
    expect(landing).toContain("universityDirectoryEntries()");
    expect(landing).toContain("FEATURED_UNIVERSITY_IDS");
    expect(manifest.universities).toHaveLength(manifest.universities.length);
    expect(manifest.universities.length).toBeGreaterThanOrEqual(28);

    for (const entry of manifest.universities) {
      expect(entry.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(["supported", "partial", "planned"]).toContain(entry.status);
      expect(entry.marketing.headline.length).toBeGreaterThan(20);
      expect(entry.marketing.seoTitle).toMatch(/^Gapwise (for|pour)/);
      if (entry.status === "planned") {
        expect(entry.marketing.stats).toBeUndefined();
        expect(entry.marketing.searchExamples.length).toBeGreaterThan(0);
      }
    }
  });

  test("simplifies explore nav to Platform, Universities, Ecosystem and removes card color strips (AND-257)", async () => {
    const landing = await readFile("src/components/GlobalMarketingHome.tsx", "utf8");
    const css = await readFile("src/components/global-marketing-home.css", "utf8");

    expect(landing).toContain('id="platform"');
    expect(landing).toContain('id="universities"');
    expect(landing).toContain('id="ecosystem"');

    // No colored indicator bars in university or ecosystem cards
    expect(landing).not.toContain("university-card-indicator");
    expect(landing).not.toContain("ecosystem-card-indicator");
    expect(css).not.toContain(".university-card-indicator");
    expect(css).not.toContain(".ecosystem-card-indicator");

    // Ecosystem cards still retain all four destinations
    expect(landing).toContain('id: "ai"');
    expect(landing).toContain('id: "docs"');
    expect(landing).toContain('id: "data"');
    expect(landing).toContain('id: "status"');
    expect(landing).toContain("https://ai.gapwise.ca");
    expect(landing).toContain("https://docs.gapwise.ca");
    expect(landing).toContain("https://data.gapwise.ca");
    expect(landing).toContain("https://status.gapwise.ca");
  });
});
