import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

export type BrandUniversity = {
  id: string;
  name: string;
  shortName: string;
  accentColor: string;
};

export const UNIVERSITY_BRAND_ASSET_NAMES = [
  "logo-mark.svg",
  "og-card.png",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "favicon-192x192.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "site.webmanifest",
] as const;

const ICON_SIZES = {
  "favicon-16x16.png": 16,
  "favicon-32x32.png": 32,
  "favicon-192x192.png": 192,
  "apple-touch-icon.png": 180,
  "icon-192.png": 192,
  "icon-512.png": 512,
} as const;

const UPPER_LEFT =
  "M627 638 540 534c-21-19-47-32-75-49-47-29-68-77-68-132h31c2 32 13 63 34 87 6 6 12 12 20 18-3-14-3-27-1-39 2-13 6-24 12-33l25 13c-7 15-10 30-8 42 1 17 7 29 15 37 7 8 13 12 19 15l83 37Z";
const LOWER_LEFT =
  "M627 692 522 558c-18-19-40-33-59-39-15-1-31-1-48-1 0 30 11 56 36 76 17 12 35 16 74 16v120c0 8 3 14 8 20l72 100c5 7 12 10 22 10Z";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderUniversityLogo(university: BrandUniversity): string {
  const shortName = escapeXml(university.shortName);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="350 315 554 554" role="img" aria-labelledby="title desc">
  <title id="title">Gapwise deer mark for ${shortName}</title>
  <desc id="desc">A symmetrical front-facing deer head with antlers in the ${shortName} edition colour.</desc>
  <defs>
    <path id="upper-left" d="${UPPER_LEFT}"/>
    <path id="lower-left" d="${LOWER_LEFT}"/>
  </defs>
  <g fill="${university.accentColor}">
    <use href="#upper-left"/>
    <use href="#upper-left" transform="translate(1254 0) scale(-1 1)"/>
    <use href="#lower-left"/>
    <use href="#lower-left" transform="translate(1254 0) scale(-1 1)"/>
  </g>
</svg>
`;
}

export function renderUniversityCard(university: BrandUniversity): string {
  const nameSize = Math.max(22, Math.min(34, Math.floor(920 / university.name.length)));
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0B1118"/>
  <rect width="1200" height="8" fill="${university.accentColor}"/>
  <g transform="translate(90, 188) scale(${220 / 554}) translate(-350, -315)" fill="${university.accentColor}">
    <path d="${UPPER_LEFT}"/><path d="${UPPER_LEFT}" transform="translate(1254 0) scale(-1 1)"/>
    <path d="${LOWER_LEFT}"/><path d="${LOWER_LEFT}" transform="translate(1254 0) scale(-1 1)"/>
  </g>
  <text x="365" y="264" fill="#F7FAFC" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="92" font-weight="700" letter-spacing="-1">Gapwise</text>
  <text x="370" y="338" fill="#B7C3D0" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="34">Make the time between classes count.</text>
  <text x="372" y="404" fill="${university.accentColor}" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="${nameSize}" font-weight="600">${escapeXml(university.name)}</text>
</svg>
`;
}

function renderWebmanifest(university: BrandUniversity): string {
  return `${JSON.stringify(
    {
      name: `Gapwise — ${university.name}`,
      short_name: `Gapwise · ${university.shortName}`,
      icons: [
        {
          src: `/universities/${university.id}/icon-192.png`,
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: `/universities/${university.id}/icon-512.png`,
          sizes: "512x512",
          type: "image/png",
        },
      ],
      theme_color: university.accentColor,
      background_color: "#0d1117",
      display: "standalone",
      start_url: "/",
    },
    null,
    2,
  )}\n`;
}

export async function renderUniversityBrandAssets(
  university: BrandUniversity,
): Promise<Map<string, Buffer>> {
  const logo = renderUniversityLogo(university);
  const assets = new Map<string, Buffer>([
    ["logo-mark.svg", Buffer.from(logo)],
    ["site.webmanifest", Buffer.from(renderWebmanifest(university))],
    [
      "og-card.png",
      await sharp(Buffer.from(renderUniversityCard(university)))
        .png()
        .toBuffer(),
    ],
  ]);

  for (const [name, size] of Object.entries(ICON_SIZES)) {
    assets.set(
      name,
      await sharp(Buffer.from(logo)).resize(size, size).png({ compressionLevel: 9 }).toBuffer(),
    );
  }
  return assets;
}

export async function verifyUniversityBrandAssets(
  universities: readonly BrandUniversity[],
  root = resolve("public/universities"),
): Promise<string[]> {
  const errors: string[] = [];
  const expectedDirectories = universities.map((university) => university.id).sort();
  const actualDirectories = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(actualDirectories) !== JSON.stringify(expectedDirectories)) {
    errors.push(
      `university branding directories differ from registry (expected ${expectedDirectories.join(", ")}; found ${actualDirectories.join(", ")})`,
    );
  }

  for (const university of universities) {
    const directory = resolve(root, university.id);
    try {
      const actualNames = (await readdir(directory)).sort();
      const expectedNames = [...UNIVERSITY_BRAND_ASSET_NAMES].sort();
      if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
        errors.push(`${university.id}: branding asset set does not match the registry contract`);
      }
    } catch {
      errors.push(`${university.id}: missing branding directory`);
      continue;
    }

    const expectedAssets = await renderUniversityBrandAssets(university);
    for (const [name, expected] of expectedAssets) {
      try {
        const actual = await readFile(resolve(directory, name));
        if (!actual.equals(expected)) errors.push(`${university.id}/${name}: stale or incorrect`);
      } catch {
        errors.push(`${university.id}/${name}: missing`);
      }
    }
  }
  return errors;
}
