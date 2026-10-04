import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { campusEditionUrl, watchForAppFailures } from "./helpers";

const workdayFixture = readFileSync(
  new URL("../tests/fixtures/ubc-workday-sanitized.tsv", import.meta.url),
  "utf8",
);

test("UBC Workday paste import preserves the Vancouver campus through timetable and routing", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto(campusEditionUrl(baseURL, "ubcv", "ubc-vancouver"));
  await expect(page.locator(".university-home-kicker")).toContainText("Gapwise for UBC Vancouver");
  await expect(page.locator(".brand-scope-pill").first()).toHaveText("UBC");

  await page.getByRole("button", { name: "Paste Workday View My Courses rows" }).click();
  await page
    .getByRole("textbox", { name: "Paste schedule text from Workday View My Courses" })
    .fill(workdayFixture);
  await page.getByRole("button", { name: "Import pasted schedule" }).click();

  await expect(page).toHaveURL(/\/today$/);
  const dismissInstructions = page.getByRole("button", { name: "Dismiss instructions" });
  if (await dismissInstructions.isVisible()) await dismissInstructions.click();
  await page
    .getByRole("group", { name: "View mode" })
    .getByRole("button", { name: "Weekly timetable" })
    .click();
  await expect(page).toHaveURL(/\/timetable/);
  await expect(page.getByText("CPSC 110").first()).toBeVisible();
  await expect(page.getByText("ENGL 110").first()).toBeVisible();
  await expect(page.getByText(/6 meetings in Fall/)).toBeVisible();
  await expect(page.locator(".brand-scope-pill").first()).toHaveText("UBC");

  await page
    .getByRole("group", { name: "View mode" })
    .getByRole("button", { name: "Day route" })
    .click();
  await page
    .getByRole("group", { name: "Route weekday" })
    .getByRole("button", { name: "Monday" })
    .click();
  await expect(page.getByRole("searchbox", { name: "Search UBCV buildings" })).toBeVisible();
  await expect(page.locator(".map-time-marker")).toHaveCount(2);

  const search = page.getByRole("searchbox", { name: "Search UBCV buildings" });
  await search.fill("ICCS");
  await expect(page.getByTestId("building-search-result").first()).toContainText(
    "Computer Science",
  );

  await page.reload();
  await expect(page.locator(".brand-scope-pill").first()).toHaveText("UBC");
  await expect(page.getByRole("searchbox", { name: "Search UBCV buildings" })).toBeVisible();

  await page.goto(campusEditionUrl(baseURL, "ubcv", "ubc-vancouver", "/route"));
  await expect(page.locator(".brand-scope-pill").first()).toHaveText("UBC");
  await expect(page.getByRole("searchbox", { name: "Search UBCV buildings" })).toBeVisible();
  failures.assertClean();
});

test("UBC has its own demo timetable and usable mobile campus map", async ({ page, baseURL }) => {
  test.skip(test.info().project.name !== "mobile-chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto(campusEditionUrl(baseURL, "ubcv", "ubc-vancouver"));
  await expect(page.locator(".university-home-kicker")).toContainText("Gapwise for UBC Vancouver");
  await page.getByRole("button", { name: /Try the .* demo/ }).click();
  await expect(page).toHaveURL(/\/timetable/);
  await page.getByRole("group", { name: "Weekday" }).getByRole("button", { name: /Mon/ }).click();
  await expect(page.getByText("CPSC 110").first()).toBeVisible();
  await expect(page.getByText("ENGL 110").first()).toBeVisible();

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Map" }).click();
  await expect(page.getByRole("searchbox", { name: "Search UBCV buildings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Options" })).toBeVisible();
  failures.assertClean();
});
