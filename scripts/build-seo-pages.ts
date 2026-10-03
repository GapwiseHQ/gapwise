import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { PUBLIC_FEATURE_PAGES, editionFeatureMetadata } from "../src/content/public-feature-pages";

const SITE_ORIGIN = "https://gapwise.ca";
type Status = "supported" | "partial" | "planned";
type Marketing = {
  campusName: string;
  headline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};
type Campus = {
  id: string;
  universityId: string;
  name: string;
  shortName: string;
  city: string;
  region: string;
  status: Status;
  capabilities: Record<string, Status>;
  marketing?: Marketing;
};
type University = {
  id: string;
  name: string;
  shortName: string;
  campusScope: string;
  hosts: string[];
  status: Status;
  dataPaths: string[];
  marketing: Marketing;
};
type Site = {
  id: string;
  role: string;
  canonicalHost: string;
  universityId?: string;
  campusId?: string;
  name?: string;
  shortName?: string;
  presentation?: { marketing?: Marketing };
};
const manifest = JSON.parse(await readFile("universities.json", "utf8")) as {
  sites: Site[];
  universities: University[];
  campuses: Campus[];
};
const supportedUniversities = manifest.universities.filter((item) => item.status !== "planned");
const supportedCampuses = manifest.campuses.filter((item) => item.status === "supported");

type Context = {
  id: string;
  siteKey: string;
  name: string;
  shortName: string;
  origin: string;
  status: Status;
  routable: boolean;
  timetableSupported: boolean;
  buildingSupported: boolean;
  branded: boolean;
  location: string | undefined;
  marketing: Marketing;
};
const contexts: Context[] = manifest.sites
  .filter((site) => site.role !== "global")
  .map((site) => {
    const university = manifest.universities.find((item) => item.id === site.universityId);
    const campus = manifest.campuses.find((item) => item.id === site.campusId);
    if (!university) throw new Error(`Missing university for ${site.id}`);
    return {
      id: university.id,
      siteKey: site.canonicalHost.split(".")[0]!,
      name: site.name ?? campus?.name ?? university.name,
      shortName: site.shortName ?? campus?.shortName ?? university.shortName,
      origin: `https://${site.canonicalHost}`,
      status: campus?.status ?? university.status,
      routable: campus
        ? campus.capabilities["routing"] === "supported"
        : manifest.campuses.some(
            (item) =>
              item.universityId === university.id && item.capabilities["routing"] === "supported",
          ),
      timetableSupported: campus
        ? campus.capabilities["timetableImport"] === "supported"
        : manifest.campuses.some(
            (item) =>
              item.universityId === university.id &&
              item.capabilities["timetableImport"] === "supported",
          ),
      buildingSupported: campus
        ? campus.capabilities["buildingData"] !== "planned"
        : manifest.campuses.some(
            (item) =>
              item.universityId === university.id &&
              item.capabilities["buildingData"] !== "planned",
          ),
      branded: university.dataPaths.length > 0,
      location: campus ? `${campus.city}, ${campus.region}` : undefined,
      marketing: site.presentation?.marketing ?? campus?.marketing ?? university.marketing,
    };
  });

type Section = { title: string; body: string };
type Page = {
  path: string;
  title: string;
  description: string;
  heading: string;
  detail: string;
  sections?: readonly Section[];
  sitemap: boolean;
};
const featurePages: Page[] = Object.values(PUBLIC_FEATURE_PAGES).map((page) => ({
  path: page.path,
  title: page.seoTitle,
  description: page.description,
  heading: page.title,
  detail: page.lead,
  sections: page.sections,
  sitemap: true,
}));
const pages: Page[] = [
  {
    path: "/",
    title: "Gapwise — University Timetable & Campus Navigation",
    description:
      "Explore Gapwise university and campus editions across North America, with honest support status for timetables, campus data, search, and routing.",
    heading: "Make the time between classes count.",
    detail: `Explore ${manifest.universities.length} university editions and ${manifest.campuses.length} campus records, including ${supportedUniversities.length} currently supported universities and ${supportedCampuses.length} supported campuses.`,
    sections: [
      {
        title: "Your timetable, connected to campus context",
        body: "Gapwise combines class times, rooms, campus identity, deterministic travel time, and gap budgets.",
      },
      {
        title: "Private by architecture",
        body: "Supported timetable files are parsed locally in the browser. Private sync is optional and foreground location is not retained as movement history.",
      },
      {
        title: "Clear about coverage",
        body: "Every edition states whether timetable import, building data, search, and routing are supported, partial, or planned.",
      },
    ],
    sitemap: true,
  },
  ...featurePages,
  {
    path: "/places",
    title: "UTM Campus Places — Gapwise",
    description:
      "Explore source-backed UTM dining, study, service, library, and recreation places.",
    heading: "Practical places at UTM, with source-backed details.",
    detail: "Gapwise keeps place identity, source provenance, and freshness explicit.",
    sitemap: true,
  },
  {
    path: "/developers",
    title: "Gapwise API & SDKs — Developers",
    description: `Build with the Gapwise public campus API for ${supportedUniversities.length} supported universities.`,
    heading: "Deterministic campus intelligence for developers.",
    detail:
      "Gapwise publishes a bounded API for supported campus data, with OpenAPI and SDK documentation.",
    sitemap: true,
  },
  {
    path: "/ai",
    title: "Gapwise AI — Connect Gapwise to AI Assistants",
    description:
      "Connect explicitly delegated Gapwise context and deterministic campus intelligence to compatible AI assistants.",
    heading: "Your Gapwise context, with an assistant you choose.",
    detail:
      "Gapwise AI exposes supported public campus intelligence plus narrowly delegated private planning capabilities.",
    sitemap: true,
  },
  {
    path: "/support",
    title: "Support — Gapwise",
    description:
      "Support for Gapwise accounts, timetables, AI connectors, privacy, security, and troubleshooting.",
    heading: "Help with Gapwise.",
    detail:
      "Find first-party guidance for accounts, supported imports, privacy, security, and service status.",
    sitemap: true,
  },
  {
    path: "/trust",
    title: "Trust Center — Gapwise",
    description:
      "Evidence-backed privacy, security, accessibility, data-flow, AI permission, and incident-response information.",
    heading: "Gapwise Trust Center",
    detail:
      "Review implementation-backed privacy and security boundaries, accessibility evidence, and AI permissions.",
    sitemap: true,
  },
  {
    path: "/privacy",
    title: "Privacy — Gapwise",
    description:
      "How Gapwise handles timetable, account, planning, AI, analytics, and foreground location data.",
    heading: "Privacy at Gapwise",
    detail:
      "Supported schedule files are parsed in the browser. Guest mode is first-class and private sync is optional.",
    sitemap: true,
  },
  {
    path: "/security",
    title: "Vulnerability Disclosure — Gapwise",
    description: "How to report a suspected Gapwise security vulnerability privately and safely.",
    heading: "Report a Gapwise security issue privately.",
    detail: "Gapwise publishes a vulnerability disclosure policy and canonical security.txt.",
    sitemap: true,
  },
  {
    path: "/accessibility",
    title: "Accessibility — Gapwise",
    description:
      "Gapwise's accessibility target, current evidence, known limitations, and feedback path.",
    heading: "Accessibility is an ongoing Gapwise practice.",
    detail: "Gapwise uses WCAG 2.2 Level AA as a product and review target.",
    sitemap: true,
  },
  {
    path: "/terms",
    title: "Terms — Gapwise",
    description: "Terms and notices for the independent Gapwise application.",
    heading: "Gapwise terms and notices",
    detail: "Gapwise is an independent student project and does not claim university endorsement.",
    sitemap: false,
  },
];

const commonPaths = new Set([
  "/",
  "/about",
  "/universities",
  "/open-source",
  "/campus-map",
  "/gap-planner",
  "/campus-routing",
  "/developers",
  "/ai",
  "/support",
  "/trust",
  "/privacy",
  "/security",
  "/accessibility",
]);
const plannedPaths = new Set(["/"]);
const timetablePaths = new Set(
  [...commonPaths].filter((path) => path !== "/campus-map" && path !== "/campus-routing"),
);
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const outputPath = (path: string) =>
  path === "/" ? "_seo/index.html" : `_seo/${path.slice(1).replaceAll("/", "--")}.html`;

function schema(page: Page, context?: Context) {
  const origin = context?.origin ?? SITE_ORIGIN;
  const org = `${SITE_ORIGIN}/#organization`;
  const features = !context?.timetableSupported
    ? [
        "Personalized university edition",
        "Published capability status",
        "Campus features marked as planned",
      ]
    : context
      ? [
          "Browser-local timetable import",
          "University-specific timetable identity",
          ...(context.buildingSupported ? ["Source-backed campus search"] : []),
          ...(context.routable ? ["Source-backed campus routing"] : []),
        ]
      : [
          "University editions across Canada and the United States",
          "Published capability status for every campus",
        ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: "Gapwise",
        url: `${SITE_ORIGIN}/`,
        description:
          "Gapwise is a university timetable, campus navigation, and student-planning platform with editions across North America.",
        logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/icon-512.png` },
        sameAs: ["https://github.com/GapwiseHQ"],
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: context ? `Gapwise for ${context.name}` : "Gapwise",
        url: `${origin}/`,
        description: page.description,
        publisher: { "@id": org },
      },
      {
        "@type": ["WebApplication", "SoftwareApplication"],
        "@id": `${origin}/#app`,
        name: context ? `Gapwise for ${context.name}` : "Gapwise",
        url: `${origin}/`,
        description: page.description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        audience: {
          "@type": "Audience",
          audienceType: context
            ? `University students at ${context.name}`
            : "University students across North America",
        },
        featureList: features,
      },
    ],
  };
}

function metadata(page: Page, context?: Context) {
  const origin = context?.origin ?? SITE_ORIGIN;
  const canonical = new URL(page.path, `${origin}/`).href;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const image = context?.branded
    ? `${origin}/universities/${context.id}/og-card.png`
    : `${SITE_ORIGIN}/og-gapwise.png`;
  const jsonLd =
    page.path === "/"
      ? `\n<script type="application/ld+json">${JSON.stringify(schema(page, context)).replaceAll("<", "\\u003c")}</script>`
      : "";
  return `<!-- gapwise-static-seo:start --><title>${title}</title><meta name="description" content="${description}" /><meta name="application-name" content="Gapwise" /><meta name="robots" content="index, follow, max-image-preview:large" /><link rel="canonical" href="${canonical}" /><meta property="og:type" content="website" /><meta property="og:site_name" content="Gapwise" /><meta property="og:title" content="${title}" /><meta property="og:description" content="${description}" /><meta property="og:url" content="${canonical}" /><meta property="og:image" content="${image}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${title}" /><meta name="twitter:description" content="${description}" /><meta name="twitter:image" content="${image}" />${jsonLd}<!-- gapwise-static-seo:end -->`;
}

function fallback(page: Page, context?: Context) {
  const directory = manifest.universities
    .map(
      (item) =>
        `<li><a href="https://${item.hosts[0]}">${escapeHtml(item.name)}</a> — ${escapeHtml(item.campusScope)} (${item.status})</li>`,
    )
    .join("");
  const status = !context?.timetableSupported
    ? "This personalized edition is planned. Timetable import, building data, search, and routing are not yet available."
    : context?.status === "partial"
      ? "Timetable import is available. Building data, campus search, and routing remain clearly labeled by their current coverage."
      : "Available features use supported, source-backed campus data.";
  const sections = (page.sections ?? [])
    .map(
      (item) =>
        `<section><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.body)}</p></section>`,
    )
    .join("");
  return `<main data-gapwise-search-fallback style="max-width:60rem;margin:0 auto;padding:3rem 1.25rem;font-family:system-ui,sans-serif;line-height:1.65"><p><strong>Gapwise</strong> — University &amp; campus editions</p><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p><p>${escapeHtml(page.detail)}</p>${context ? `<p><strong>${context.status.toUpperCase()}</strong>${context.location ? ` · ${escapeHtml(context.location)}` : ""}</p><p>${escapeHtml(status)}</p>` : ""}${page.path === "/" && !context ? `<section><h2>Explore Gapwise universities</h2><ul>${directory}</ul></section>` : ""}${sections}<p>Gapwise is independent and does not claim university endorsement.</p><nav><a href="/">Home</a> · <a href="/universities">Universities</a> · <a href="/about">About</a> · <a href="/support">Support</a></nav></main>`;
}

function render(base: string, page: Page, context?: Context) {
  let html = base
    .replace("</head>", `${metadata(page, context)}</head>`)
    .replace(/<div id="root"><\/div>/, `<div id="root">${fallback(page, context)}</div>`);
  if (context?.branded)
    html = html
      .replace(/href="\/logo-mark\.svg"/g, `href="/universities/${context.id}/logo-mark.svg"`)
      .replace(
        /href="\/favicon-192x192\.png"/g,
        `href="/universities/${context.id}/favicon-192x192.png"`,
      )
      .replace(
        /href="\/favicon-32x32\.png"/g,
        `href="/universities/${context.id}/favicon-32x32.png"`,
      )
      .replace(
        /href="\/favicon-16x16\.png"/g,
        `href="/universities/${context.id}/favicon-16x16.png"`,
      )
      .replace(
        /href="\/apple-touch-icon\.png"/g,
        `href="/universities/${context.id}/apple-touch-icon.png"`,
      )
      .replace(
        /href="\/site\.webmanifest"/g,
        `href="/universities/${context.id}/site.webmanifest"`,
      );
  return html;
}

function editionPage(page: Page, context: Context): Page {
  if (page.path === "/")
    return {
      ...page,
      title: context.marketing.seoTitle,
      description: context.marketing.seoDescription,
      heading: context.marketing.headline,
      detail: context.marketing.description,
    };
  if (["/about", "/campus-map", "/gap-planner", "/campus-routing"].includes(page.path)) {
    const feature = Object.values(PUBLIC_FEATURE_PAGES).find((item) => item.path === page.path)!;
    const edition = editionFeatureMetadata(feature, context.name);
    return {
      ...page,
      title: edition.seoTitle,
      description:
        context.status === "planned"
          ? `${context.name} has a personalized Gapwise edition. ${feature.title} support is planned and not yet available.`
          : edition.description,
    };
  }
  return page;
}
function sitemap(origin = SITE_ORIGIN, paths = commonPaths) {
  const urls = pages
    .filter((page) => page.sitemap && paths.has(page.path))
    .map((page) => `  <url><loc>${new URL(page.path, `${origin}/`).href}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
const robots = (origin: string) =>
  `User-agent: *\nAllow: /\nDisallow: /_seo/\nDisallow: /api/\nDisallow: /v1\nDisallow: /oauth/\n\nSitemap: ${origin}/sitemap.xml\n`;

const base = await readFile(join("dist", "index.html"), "utf8");
for (const page of pages) {
  const destination = join("dist", outputPath(page.path));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, render(base, page));
}
await writeFile(join("dist", "_seo", "sitemap.xml"), sitemap());
await writeFile(
  join("dist", "_seo", "robots.txt"),
  await readFile(join("public", "robots.txt"), "utf8"),
);
for (const context of contexts) {
  const directory = join("dist", "_sites", context.siteKey);
  await mkdir(join(directory, "_seo"), { recursive: true });
  const contextPaths = !context.timetableSupported
    ? plannedPaths
    : context.buildingSupported
      ? commonPaths
      : timetablePaths;
  for (const page of pages.filter((item) => contextPaths.has(item.path))) {
    const html = render(base, editionPage(page, context), context);
    await writeFile(
      page.path === "/"
        ? join(directory, "index.html")
        : join(directory, "_seo", `${page.path.slice(1).replaceAll("/", "--")}.html`),
      html,
    );
  }
  await writeFile(join(directory, "sitemap.xml"), sitemap(context.origin, contextPaths));
  await writeFile(join(directory, "robots.txt"), robots(context.origin));
}
await mkdir(join("dist", "_global"), { recursive: true });
await copyFile(join("dist", "og-gapwise.png"), join("dist", "_global", "og-gapwise.png"));
await copyFile(join("dist", "og-card.png"), join("dist", "_global", "og-card.png"));
for (const name of ["index.html", "sitemap.xml", "robots.txt", "og-gapwise.png", "og-card.png"])
  await rm(join("dist", name), { force: true });
console.log(
  `Generated ${pages.length} global SEO pages and ${contexts.length} hostname-specific editions.`,
);
