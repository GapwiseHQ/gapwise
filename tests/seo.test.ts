import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { listCampusPlaces } from "../src/features/campus-state/snapshot";
import { PUBLIC_FEATURE_PAGES, editionFeatureMetadata } from "../src/content/public-feature-pages";
import universities from "../universities.json" with { type: "json" };

const SITE_ORIGIN = "https://gapwise.ca";
const FEATURE_PATHS = [
  "/about",
  "/universities",
  "/open-source",
  "/campus-map",
  "/gap-planner",
  "/campus-routing",
] as const;

function sitemapLocations(xml: string) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function pngDimensions(bytes: Buffer) {
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("Gapwise searchability and entity metadata", () => {
  test("shared feature metadata uses only the active institution", () => {
    const pages = [
      PUBLIC_FEATURE_PAGES.about,
      PUBLIC_FEATURE_PAGES.map,
      PUBLIC_FEATURE_PAGES.gaps,
      PUBLIC_FEATURE_PAGES.routing,
    ];
    for (const university of universities.universities) {
      for (const page of pages) {
        const metadata = editionFeatureMetadata(page, university.name);
        expect(`${metadata.seoTitle} ${metadata.description}`).toContain(university.name);
      }
    }
  });

  test("publishes a focused sitemap with substantive public feature and place pages", async () => {
    const sitemap = await readFile("public/sitemap.xml", "utf8");
    const locations = sitemapLocations(sitemap);
    const expected = [
      `${SITE_ORIGIN}/`,
      ...FEATURE_PATHS.map((path) => `${SITE_ORIGIN}${path}`),
      `${SITE_ORIGIN}/developers`,
      `${SITE_ORIGIN}/ai`,
      `${SITE_ORIGIN}/support`,
      `${SITE_ORIGIN}/trust`,
      `${SITE_ORIGIN}/privacy`,
      `${SITE_ORIGIN}/security`,
      `${SITE_ORIGIN}/accessibility`,
    ];

    expect(locations).toEqual(expected);
    for (const privatePath of ["/today", "/timetable", "/gaps", "/route", "/oauth/consent"]) {
      expect(locations).not.toContain(`${SITE_ORIGIN}${privatePath}`);
    }
  });

  test("robots points at the canonical sitemap and keeps internal surfaces out of crawl", async () => {
    const robots = await readFile("public/robots.txt", "utf8");
    const directives = robots.split("\n").filter(Boolean);
    expect(directives).toContain("User-agent: *");
    expect(directives).toContain("Allow: /");
    expect(directives).toContain("Disallow: /_seo/");
    expect(directives).toContain("Disallow: /api/");
    expect(directives).toContain("Disallow: /v1");
    expect(directives).toContain("Disallow: /oauth/");
    expect(directives).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });

  test("build contract makes Gapwise the canonical brand and publishes Website + Organization schema", async () => {
    const [packageJson, builder] = await Promise.all([
      readFile("package.json", "utf8").then((value) => JSON.parse(value)),
      readFile("scripts/build-seo-pages.ts", "utf8"),
    ]);

    expect(packageJson.scripts.build).toContain("bun scripts/check-seo-output.ts");
    expect(builder).toContain('title: "Gapwise — University Timetable & Campus Navigation"');
    expect(builder).toContain('name="application-name" content="Gapwise"');
    expect(builder).toContain('property="og:site_name" content="Gapwise"');
    expect(builder).toContain('name="twitter:card" content="summary_large_image"');
    expect(builder).toContain('property="og:image:width" content="1200"');
    expect(builder).toContain('property="og:image:height" content="630"');
    expect(builder).toContain('"@type": "WebSite"');
    expect(builder).toContain('"@type": "Organization"');
    expect(builder).toContain('name: "Gapwise"');
    expect(builder).not.toContain("alternateName:");
    expect(builder).toContain("https://github.com/GapwiseHQ");
    expect(builder).toContain("data-gapwise-search-fallback");
  });

  test("uses one canonical favicon reference and a true 1200x630 social image", async () => {
    const [index, faviconSvg, social] = await Promise.all([
      readFile("index.html", "utf8"),
      readFile("public/gapwise-favicon-v2.svg", "utf8"),
      readFile("public/og-gapwise.png"),
    ]);
    expect(index).toContain('href="/gapwise-favicon-v2.svg"');
    expect(faviconSvg).toContain("<svg");
    expect(faviconSvg).not.toContain("carleton");
    expect(pngDimensions(social)).toEqual({ width: 1200, height: 630 });
  });

  test("Vercel serves generated public HTML while preserving noindex app-state boundaries", async () => {
    const config = JSON.parse(await readFile("vercel.json", "utf8")) as {
      trailingSlash?: boolean;
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
      rewrites: Array<{ source: string; destination: string }>;
      redirects: Array<{
        source: string;
        destination: string;
        permanent: boolean;
        has?: Array<{ type: string; value: string }>;
      }>;
    };
    const rewrite = new Map(config.rewrites.map((entry) => [entry.source, entry.destination]));

    expect(config.trailingSlash).toBe(false);
    for (const path of FEATURE_PATHS) {
      expect(rewrite.get(path)).toBe(`/_seo/${path.slice(1)}.html`);
    }
    expect(rewrite.has("/utm-timetable")).toBe(false);
    expect(rewrite.has("/acorn-import")).toBe(false);
    expect(rewrite.has("/places")).toBe(false);
    for (const place of listCampusPlaces()) expect(rewrite.has(`/places/${place.id}`)).toBe(false);

    for (const [source, destination] of [
      ["/utm-timetable", "https://utm.gapwise.ca/utm-timetable"],
      ["/acorn-import", "https://utm.gapwise.ca/acorn-import"],
      ["/places/:path*", "https://utm.gapwise.ca/places/:path*"],
    ]) {
      const redirect = config.redirects.find((entry) => entry.source === source);
      expect(redirect?.destination).toBe(destination);
      expect(redirect?.permanent).toBe(true);
      expect(redirect?.has).toContainEqual({ type: "host", value: "gapwise.ca" });
    }

    const noindexSources = config.headers
      .filter((entry) =>
        entry.headers.some(
          (header) => header.key === "X-Robots-Tag" && header.value === "noindex, nofollow",
        ),
      )
      .map((entry) => entry.source);
    for (const path of [
      "/today",
      "/timetable",
      "/gaps",
      "/route",
      "/route/(.*)",
      "/oauth/(.*)",
      "/api/(.*)",
      "/v1",
      "/v1/(.*)",
      "/_seo/(.*)",
    ])
      expect(noindexSources).toContain(path);
  });

  test("Vercel routes every intentional university host to isolated SEO output", async () => {
    const config = JSON.parse(await readFile("vercel.json", "utf8")) as {
      rewrites: Array<{
        source: string;
        destination: string;
        has?: Array<{ type: string; value: string }>;
      }>;
    };

    const root = config.rewrites.find((entry) => entry.destination === "/_sites/:site/index.html");
    const pattern = root?.has?.find((condition) => condition.type === "host")?.value;
    expect(pattern).toBeDefined();
    for (const site of universities.sites.filter((item) => item.role !== "global"))
      expect(site.hosts.every((host) => new RegExp(`^${pattern}$`).test(host))).toBe(true);
    expect(config.rewrites).toContainEqual(
      expect.objectContaining({ source: "/sitemap.xml", destination: "/_sites/:site/sitemap.xml" }),
    );
    expect(config.rewrites).toContainEqual(
      expect.objectContaining({ source: "/robots.txt", destination: "/_sites/:site/robots.txt" }),
    );
  });

  test("Vercel routes the U of T hub independently from the global and campus sites", async () => {
    const config = JSON.parse(await readFile("vercel.json", "utf8")) as {
      rewrites: Array<{
        source: string;
        destination: string;
        has?: Array<{ type: string; value: string }>;
      }>;
    };
    const root = config.rewrites.find((entry) => entry.destination === "/_sites/:site/index.html");
    const pattern = root?.has?.find((condition) => condition.type === "host")?.value;
    expect(new RegExp(`^${pattern}$`).test("uoft.gapwise.ca")).toBe(true);
    expect(new RegExp(`^${pattern}$`).test("utm.gapwise.ca")).toBe(true);
    expect(new RegExp(`^${pattern}$`).test("api.gapwise.ca")).toBe(false);
  });
});
