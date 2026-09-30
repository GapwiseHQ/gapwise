import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { watchForAppFailures } from "./helpers";

const questFixture = readFileSync(
  new URL("../tests/fixtures/waterloo-quest-sanitized.tsv", import.meta.url),
  "utf8",
);

test("Waterloo Quest import preserves the canonical campus through timetable and routing", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto("/?university=waterloo&campus=waterloo-main");
  await expect(page.getByText("For University of Waterloo", { exact: true })).toBeVisible();
  await expect(page.locator(".brand-scope-pill").first()).toHaveText("Waterloo");

  await page.getByRole("button", { name: "Paste Quest Class Schedule rows" }).click();
  await page
    .getByRole("textbox", { name: "Paste schedule text from Quest Class Schedule" })
    .fill(questFixture);
  await page.getByRole("button", { name: "Import pasted schedule" }).click();

  await expect(page).toHaveURL(/\/today$/);
  await page
    .getByRole("group", { name: "View mode" })
    .getByRole("button", { name: "Weekly timetable" })
    .click();
  await expect(page.getByText("MATH 135").first()).toBeVisible();
  await expect(page.getByText("CS 135").first()).toBeVisible();
  await expect(page.locator(".brand-scope-pill").first()).toHaveText("Waterloo");

  await page
    .getByRole("group", { name: "View mode" })
    .getByRole("button", { name: "Day route" })
    .click();
  await page
    .getByRole("group", { name: "Route weekday" })
    .getByRole("button", { name: "Monday" })
    .click();
  await expect(page.getByRole("searchbox", { name: "Search Waterloo buildings" })).toBeVisible();
  await expect(page.locator(".map-time-marker")).toHaveCount(2);

  const search = page.getByRole("searchbox", { name: "Search Waterloo buildings" });
  await search.fill("MC");
  await expect(page.getByTestId("building-search-result").first()).toContainText(
    "Mathematics & Computer",
  );

  await page.reload();
  await expect(page.locator(".brand-scope-pill").first()).toHaveText("Waterloo");
  await expect(page.getByRole("searchbox", { name: "Search Waterloo buildings" })).toBeVisible();

  await page.goto("/route?university=waterloo&campus=waterloo-main");
  await expect(page.locator(".brand-scope-pill").first()).toHaveText("Waterloo");
  await expect(page.getByRole("searchbox", { name: "Search Waterloo buildings" })).toBeVisible();
  failures.assertClean();
});

test("Waterloo has its own demo timetable and usable mobile campus map", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "mobile-chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto("/?university=waterloo&campus=waterloo-main");
  await expect(page.getByText("For University of Waterloo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try a demo" }).click();
  await expect(page).toHaveURL(/\/timetable/);
  await page.getByRole("group", { name: "Weekday" }).getByRole("button", { name: /Mon/ }).click();
  await expect(page.getByText("MATH 135").first()).toBeVisible();
  await expect(page.getByText("CS 135").first()).toBeVisible();

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Map" }).click();
  await expect(page.getByRole("searchbox", { name: "Search Waterloo buildings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Options" })).toBeVisible();
  failures.assertClean();
});
