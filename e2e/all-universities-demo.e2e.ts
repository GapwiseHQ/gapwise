import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import manifest from "../universities.json" with { type: "json" };
import { editionUrl, watchForAppFailures } from "./helpers";

/**
 * Every hostname edition that shows a "Try the <University> demo" CTA must load that
 * university's own sample timetable, infer the right campus, and resolve real buildings.
 * University hubs (uoft, york, ubc) show a campus chooser instead and are checked to link
 * to their campus editions.
 */

type Site = (typeof manifest.sites)[number];

const demoEditions = manifest.sites.filter(
  (site) => site.role === "campus-edition" || site.role === "single-campus-edition",
) as Array<Site & { universityId: string; campusId: string }>;
const hubs = manifest.sites.filter((site) => site.role === "university-hub");

function hostSlug(site: Site) {
  return site.canonicalHost.split(".")[0]!;
}

/** Real building names known for a campus, read from the canonical campus datasets. */
function buildingNames(campusId: string, universityId: string): Set<string> | null {
  const folder =
    campusId === "waterloo"
      ? "laurier"
      : existsSync(`src/data/campuses/${campusId}`)
        ? campusId
        : universityId;
  const names = new Set<string>();
  for (const file of ["campus.json", "catalog.json", "buildings.json"]) {
    const path = `src/data/campuses/${folder}/${file}`;
    if (!existsSync(path)) continue;
    const data = JSON.parse(readFileSync(path, "utf8")) as { buildings?: Array<{ name: string }> };
    for (const building of data.buildings ?? []) names.add(building.name);
  }
  return names.size ? names : null;
}

for (const site of demoEditions) {
  test(`${site.canonicalHost} demo loads a ${site.universityId}/${site.campusId} timetable`, async ({
    page,
    baseURL,
  }) => {
    test.skip(test.info().project.name !== "chromium");
    if (!baseURL) throw new Error("Playwright baseURL is required");
    const failures = watchForAppFailures(page, baseURL);
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(editionUrl(baseURL, hostSlug(site)));
    const demo = page.getByRole("button", { name: /Try the .* demo/ });
    await expect(demo).toBeVisible();
    await demo.click();

    // 1. Navigation lands in the timetable experience.
    await expect(page).toHaveURL(/\/timetable/);

    // 2. A non-empty timetable renders.
    // The timetable renders separate desktop/mobile views; only inspect the active one.
    const cards = page.getByRole("button", { name: /^View details for/ }).filter({ visible: true });
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);

    // 3 + 4. Active university and inferred campus match the edition.
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-gapwise-university", site.universityId);
    await expect(root).toHaveAttribute("data-gapwise-campus", site.campusId);

    // 6. Referenced buildings resolve to real campus buildings.
    const names = buildingNames(site.campusId, site.universityId);
    if (names) {
      let resolved = 0;
      const total = Math.min(await cards.count(), 4);
      for (let index = 0; index < total; index++) {
        await cards.nth(index).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        const location = (await dialog.locator("dd span.text-base").first().innerText()).trim();
        if (names.has(location)) resolved++;
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
      }
      // Markham's real teaching building is not yet mapped; its demo is explicitly
      // location-unknown rather than pinned to an unrelated building.
      if (site.campusId !== "markham") expect(resolved).toBeGreaterThan(0);
    }

    // 5. No runtime/browser errors.
    expect(pageErrors).toEqual([]);
    failures.assertClean();
  });
}

for (const hub of hubs) {
  test(`${hub.canonicalHost} hub links to its campus editions`, async ({ page, baseURL }) => {
    test.skip(test.info().project.name !== "chromium");
    if (!baseURL) throw new Error("Playwright baseURL is required");
    const failures = watchForAppFailures(page, baseURL);
    await page.goto(editionUrl(baseURL, hostSlug(hub)));
    await expect(page.getByRole("link", { name: /Choose your campus/ }).first()).toBeVisible();
    const editions = manifest.sites.filter(
      (site) => site.role === "campus-edition" && site.universityId === hub.universityId,
    );
    for (const edition of editions) {
      await expect(page.locator(`a[href="https://${edition.canonicalHost}"]`).first()).toHaveCount(
        1,
      );
    }
    failures.assertClean();
  });
}
