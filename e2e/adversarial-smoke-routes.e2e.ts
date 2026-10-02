import { expect, test } from "@playwright/test";
import { watchForAppFailures } from "./helpers";

const targets = [
  { id: "uoft", query: "", name: "University of Toronto", sampleCourse: "DEM101H5" },
  {
    id: "guelph",
    query: "?university=guelph",
    name: "University of Guelph",
    sampleCourse: "CIS 1300",
  },
  {
    id: "mcmaster",
    query: "?university=mcmaster",
    name: "McMaster University",
    sampleCourse: "COMPSCI 1MD3",
  },
  { id: "york", query: "?university=york", name: "York University", sampleCourse: "EECS 1022" },
  {
    id: "brock",
    query: "?university=brock",
    name: "Brock University",
    sampleCourse: "COSC 1P02",
  },
] as const;

for (const target of targets) {
  test(`adversarial route smoke test for ${target.name}`, async ({ page, baseURL }) => {
    test.skip(test.info().project.name !== "chromium");
    if (!baseURL) throw new Error("Playwright baseURL is required");
    const failures = watchForAppFailures(page, baseURL);

    await page.goto(`/${target.query}`);

    // Click demo button to load campus schedule
    const demoButton = page.getByRole("button", { name: /Try the .* demo/ });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Verify timetable loaded
    await expect(page).toHaveURL(/\/timetable/);
    await expect(page.getByText(target.sampleCourse).first()).toBeVisible();

    // Switch to Day Route
    const views = page.getByRole("group", { name: "View mode" });
    await views.getByRole("button", { name: "Day route" }).click();
    await expect(page).toHaveURL(/\/route/);

    // Verify Map and route container render
    await expect(
      page.locator(".campus-map-container, [data-testid='campus-map'], canvas").first(),
    ).toBeVisible();

    failures.assertClean();
  });
}
