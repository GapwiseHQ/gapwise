import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import manifest from "../universities.json" with { type: "json" };
import {
  renderUniversityBrandAssets,
  verifyUniversityBrandAssets,
} from "./university-brand-assets";

const mode = process.argv.includes("--check") ? "check" : "write";

if (mode === "check") {
  const errors = await verifyUniversityBrandAssets(manifest.universities);
  if (errors.length > 0) {
    for (const error of errors) console.error(`[FAIL] ${error}`);
    console.error("Run `bun run brand:generate` to regenerate registry-derived assets.");
    process.exit(1);
  }
  console.log(
    `Verified registry-derived branding for all ${manifest.universities.length} universities.`,
  );
} else {
  for (const university of manifest.universities) {
    const directory = resolve("public/universities", university.id);
    await mkdir(directory, { recursive: true });
    const assets = await renderUniversityBrandAssets(university);
    for (const [name, contents] of assets) await writeFile(resolve(directory, name), contents);
    console.log(`Generated ${assets.size} branding assets for ${university.name}.`);
  }
}
