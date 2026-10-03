import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const gapwiseDir = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(resolve(gapwiseDir, "universities.json"), "utf8"));

// 1. Collect all fallback bounds
const boundsMap = {};
for (const c of manifest.campuses) {
  let file = resolve(gapwiseDir, `src/data/campuses/${c.id}/catalog.json`);
  if (c.id === "keele") file = resolve(gapwiseDir, "src/data/campuses/york/catalog.json");
  else if (c.id === "ubc-vancouver")
    file = resolve(gapwiseDir, "src/data/campuses/ubc/catalog.json");
  else if (c.id === "waterloo-main")
    file = resolve(gapwiseDir, "src/data/campuses/waterloo/catalog.json");
  else if (c.id === "mcgill-downtown")
    file = resolve(gapwiseDir, "src/data/campuses/mcgill/catalog.json");
  else if (c.id === "waterloo")
    file = resolve(gapwiseDir, "src/data/campuses/laurier/catalog.json");
  try {
    const data = JSON.parse(readFileSync(file, "utf8"));
    if (data.campus?.bounds) {
      boundsMap[c.id] = data.campus.bounds;
    }
  } catch {}
}

// 2. Update src/data/campuses/index.ts
const indexPath = resolve(gapwiseDir, "src/data/campuses/index.ts");
let indexContent = readFileSync(indexPath, "utf8");

// Generate catalogLoaders
const dynamicCampuses = manifest.campuses.filter(
  (c) =>
    ![
      "utm",
      "utsg",
      "utsc",
      "carleton",
      "tmu",
      "queens",
      "waterloo",
      "laurier",
      "keele",
      "york",
      "mcmaster",
      "western",
      "guelph",
      "uottawa",
      "brock",
    ].includes(c.id),
);

const loaderEntries = [
  '    "ubc-vancouver": () => import("./ubc/catalog.json?raw"),',
  '    "waterloo-main": () => import("./waterloo/catalog.json?raw"),',
  '    "mcgill-downtown": () => import("./mcgill/catalog.json?raw"),',
];
for (const c of dynamicCampuses) {
  if (!["ubc-vancouver", "waterloo-main", "mcgill-downtown"].includes(c.id)) {
    loaderEntries.push(`    "${c.id}": () => import("./${c.id}/catalog.json?raw"),`);
  }
}

const catalogLoadersBlock = `  const catalogLoaders: Record<string, () => Promise<{ default: string }>> = {\n${loaderEntries.join("\n")}\n  };`;

indexContent = indexContent.replace(
  /  const catalogLoaders: Record<string, \(\) => Promise<\{ default: string \}>> = \{[\s\S]*?\n  \};/,
  catalogLoadersBlock,
);

// Update CAMPUS_FALLBACK_BOUNDS
const fallbackEntries = Object.entries(boundsMap)
  .map(
    ([id, b]) => `  "${id}": [\n    [${b[0][0]}, ${b[0][1]}],\n    [${b[1][0]}, ${b[1][1]}],\n  ],`,
  )
  .join("\n");

const fallbackBoundsBlock = `const CAMPUS_FALLBACK_BOUNDS: Record<string, [[number, number], [number, number]]> = {\n  utm: [\n    [-79.6765, 43.5415],\n    [-79.6535, 43.5585],\n  ],\n  utsg: [\n    [-79.4215, 43.645],\n    [-79.365, 43.6825],\n  ],\n  utsc: [\n    [-79.205, 43.772],\n    [-79.165, 43.7995],\n  ],\n${fallbackEntries}\n  ...Object.fromEntries(\n    Object.entries(universityCatalogs)\n      .filter(([, catalog]) => catalog.campus?.bounds)\n      .map(([id, catalog]) => [id, catalog.campus!.bounds!]),\n  ),\n};`;

indexContent = indexContent.replace(
  /const CAMPUS_FALLBACK_BOUNDS: Record<string, \[\[number, number\], \[number, number\]\]> = \{[\s\S]*?\n\};\n\nexport const CAMPUS_LABELS/,
  `${fallbackBoundsBlock}\n\nexport const CAMPUS_LABELS`,
);

writeFileSync(indexPath, indexContent, "utf8");
console.log("Updated src/data/campuses/index.ts");

// 3. Update src/features/routing/campus-transition.ts
const transitionPath = resolve(gapwiseDir, "src/features/routing/campus-transition.ts");
let transitionContent = readFileSync(transitionPath, "utf8");

const outdoorEntries = [];
// Static existing ones
outdoorEntries.push(
  '  utsg: () => import("@/data/campuses/utsg/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  utsc: () => import("@/data/campuses/utsc/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  carleton: () => import("@/data/campuses/carleton/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  tmu: () => import("@/data/campuses/tmu/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  queens: () => import("@/data/campuses/queens/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  laurier: () => import("@/data/campuses/laurier/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  waterloo: () => import("@/data/campuses/waterloo/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  york: () => import("@/data/campuses/york/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  keele: () => import("@/data/campuses/york/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  mcmaster: () => import("@/data/campuses/mcmaster/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  western: () => import("@/data/campuses/western/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  guelph: () => import("@/data/campuses/guelph/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  uottawa: () => import("@/data/campuses/uottawa/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  brock: () => import("@/data/campuses/brock/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  "ubc-vancouver": () => import("@/data/campuses/ubc/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  ubc: () => import("@/data/campuses/ubc/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  "waterloo-main": () => import("@/data/campuses/waterloo/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  "mcgill-downtown": () => import("@/data/campuses/mcgill/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);
outdoorEntries.push(
  '  mcgill: () => import("@/data/campuses/mcgill/campus.json").then((m) => m.default as unknown as CampusSnapshot),',
);

// Add all other campuses
for (const c of manifest.campuses) {
  if (
    [
      "utsg",
      "utsc",
      "carleton",
      "tmu",
      "queens",
      "laurier",
      "waterloo",
      "york",
      "keele",
      "mcmaster",
      "western",
      "guelph",
      "uottawa",
      "brock",
      "ubc-vancouver",
      "waterloo-main",
      "mcgill-downtown",
      "utm",
    ].includes(c.id)
  ) {
    continue;
  }
  outdoorEntries.push(
    `  "${c.id}": () => import("@/data/campuses/${c.id}/campus.json").then((m) => m.default as unknown as CampusSnapshot),`,
  );
}

// Add university ID aliases for US / newly added universities
for (const u of manifest.universities) {
  if (
    [
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
    ].includes(u.id)
  ) {
    continue;
  }
  outdoorEntries.push(
    `  "${u.id}": () => import("@/data/campuses/${u.defaultCampus}/campus.json").then((m) => m.default as unknown as CampusSnapshot),`,
  );
}

const outdoorLoadersBlock = `export const OUTDOOR_CAMPUS_LOADERS: Record<string, CampusSnapshotLoader> = {\n${outdoorEntries.join("\n")}\n};`;

transitionContent = transitionContent.replace(
  /export const OUTDOOR_CAMPUS_LOADERS: Record<string, CampusSnapshotLoader> = \{[\s\S]*?\n\};/,
  outdoorLoadersBlock,
);

writeFileSync(transitionPath, transitionContent, "utf8");
console.log("Updated src/features/routing/campus-transition.ts");
