import { expect, test } from "@playwright/test";
import { campusEditionUrl, watchForAppFailures } from "./helpers";

test("McGill calendar import preserves downtown campus search and routing", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto(campusEditionUrl(baseURL, "mcgill-downtown", "mcgill-downtown"));
  await expect(page.locator(".university-home-kicker")).toContainText(
    "Gapwise for McGill University",
  );
  await expect(page.locator(".brand-scope-pill").first()).toHaveText("McGill");

  await page
    .locator('input[name="ics-file"]')
    .setInputFiles("tests/fixtures/mcgill-mycourses-sanitized.ics");
  await expect(page).toHaveURL(/\/timetable$/);
  await page
    .getByRole("group", { name: "View mode" })
    .getByRole("button", { name: "Weekly timetable" })
    .click();
  await expect(page.getByText("COMP 202").first()).toBeVisible();
  await expect(page.getByText("CHEM 110").first()).toBeVisible();

  await page
    .getByRole("group", { name: "View mode" })
    .getByRole("button", { name: "Day route" })
    .click();
  await page
    .getByRole("group", { name: "Route weekday" })
    .getByRole("button", { name: "Monday" })
    .click();
  const search = page.getByRole("searchbox", { name: "Search McGill buildings" });
  await expect(search).toBeVisible();
  await search.fill("LEA");
  await expect(page.getByTestId("building-search-result").first()).toContainText("Leacock");

  await page.goto(campusEditionUrl(baseURL, "mcgill-downtown", "mcgill-downtown", "/route"));
  await expect(page.locator(".brand-scope-pill").first()).toHaveText("McGill");
  await expect(page.getByRole("searchbox", { name: "Search McGill buildings" })).toBeVisible();
  failures.assertClean();
});

test("McGill demo remains usable on the mobile campus map", async ({ page, baseURL }) => {
  test.skip(test.info().project.name !== "mobile-chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto(campusEditionUrl(baseURL, "mcgill-downtown", "mcgill-downtown"));
  await page.getByRole("button", { name: /Try the .* demo/ }).click();
  await expect(page).toHaveURL(/\/timetable/);
  await page.getByRole("group", { name: "Weekday" }).getByRole("button", { name: /Mon/ }).click();
  await expect(page.getByText("COMP 202").first()).toBeVisible();

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Map" }).click();
  await expect(page.getByRole("searchbox", { name: "Search McGill buildings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Options" })).toBeVisible();
  failures.assertClean();
});
