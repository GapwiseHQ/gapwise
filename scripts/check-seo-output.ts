import { existsSync } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import manifest from "../universities.json" with { type: "json" };

function expectIncludes(value: string, expected: string, label: string) {
  if (!value.includes(expected)) throw new Error(`${label} is missing ${expected}`);
}
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const globalHtml = await readFile("dist/_seo/index.html", "utf8");
expectIncludes(globalHtml, '<link rel="canonical" href="https://gapwise.ca/"', "global homepage");
expectIncludes(globalHtml, "worldwide", "global homepage");
expectIncludes(globalHtml, 'property="og:title"', "global homepage");
expectIncludes(globalHtml, 'name="twitter:title"', "global homepage");
expectIncludes(globalHtml, "application/ld+json", "global homepage");

const sitemap = await readFile("dist/_seo/sitemap.xml", "utf8");
expectIncludes(sitemap, "https://gapwise.ca/universities", "global sitemap");
const robots = await readFile("dist/_seo/robots.txt", "utf8");
expectIncludes(robots, "https://gapwise.ca/sitemap.xml", "global robots");

let plannedCount = 0;
for (const site of manifest.sites.filter((item) => item.role !== "global")) {
  const key = site.canonicalHost.split(".")[0]!;
  const university = manifest.universities.find((item) => item.id === site.universityId)!;
  const campus = manifest.campuses.find((item) => item.id === site.campusId);
  const status = campus?.status ?? university.status;
  const marketing = site.presentation?.marketing ?? campus?.marketing ?? university.marketing;
  const html = await readFile(`dist/_sites/${key}/index.html`, "utf8");
  const title = escapeHtml(`Gapwise — ${site.name ?? campus?.name ?? university.name}`);
  const description = escapeHtml(marketing.seoDescription);
  const socialImage = `https://${site.canonicalHost}/universities/${university.id}/og-card.png`;
  expectIncludes(html, `<title>${title}</title>`, `${site.id} title`);
  expectIncludes(html, `name="description" content="${description}"`, `${site.id} description`);
  expectIncludes(html, `property="og:title" content="${title}"`, `${site.id} open graph title`);
  expectIncludes(
    html,
    `property="og:description" content="${description}"`,
    `${site.id} open graph description`,
  );
  expectIncludes(html, `property="og:image" content="${socialImage}"`, `${site.id} image`);
  expectIncludes(html, `name="twitter:title" content="${title}"`, `${site.id} X title`);
  expectIncludes(html, `name="twitter:image" content="${socialImage}"`, `${site.id} X image`);
  expectIncludes(
    html,
    'href="/gapwise-favicon-v2.svg"',
    `${site.id} canonical favicon`,
  );
  expectIncludes(html, `href="https://${site.canonicalHost}/"`, `${site.id} canonical`);
  expectIncludes(html, `content="https://${site.canonicalHost}/"`, `${site.id} open graph URL`);
  expectIncludes(html, escapeHtml(marketing.headline), `${site.id} fallback`);
  expectIncludes(html, "application/ld+json", `${site.id} structured data`);
  const siteMap = await readFile(`dist/_sites/${key}/sitemap.xml`, "utf8");
  expectIncludes(siteMap, `https://${site.canonicalHost}/`, `${site.id} sitemap`);
  if (status === "planned") {
    plannedCount++;
    if ((siteMap.match(/<url>/g) ?? []).length !== 1)
      throw new Error(`${site.id} planned sitemap must contain only its useful homepage.`);
    expectIncludes(html, "not yet available", `${site.id} planned disclosure`);
    const hasBranding = existsSync(
      resolve(`public/universities/${university.id}/favicon-32x32.png`),
    );
    if (!hasBranding && html.includes(`/universities/${university.id}/favicon`))
      throw new Error(`${site.id} references nonexistent planned branding assets.`);
  }
  if (html.includes(`/universities/${university.id}/favicon`))
    throw new Error(`${site.id} references deprecated university-specific favicon assets.`);
  if (
    campus?.capabilities.timetableImport === "supported" &&
    campus.capabilities.buildingData === "planned" &&
    /campus-(?:map|routing)/.test(siteMap)
  )
    throw new Error(`${site.id} sitemap advertises unavailable campus maps or routing.`);
  await access(`dist/_sites/${key}/robots.txt`);
}

const intentionalHosts = new Set(
  manifest.sites.flatMap((site) => (site.role === "global" ? [] : site.hosts)),
);
for (const service of ["ai", "api", "docs", "sdk", "status", "data", "developers", "cli"])
  if (intentionalHosts.has(`${service}.gapwise.ca`))
    throw new Error(`${service}.gapwise.ca must not be a university edition.`);

console.log(
  `Validated global SEO and ${intentionalHosts.size} university/campus hosts (${plannedCount} planned editions).`,
);
