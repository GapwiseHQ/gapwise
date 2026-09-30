import { expect, test } from "@playwright/test";
import { watchForAppFailures } from "./helpers";

test("Universal Search Dialog (Phase 3) keyboard, actions, buildings, and switching", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto("/?campus=utm");

  // Verify desktop search trigger button exists
  const searchTrigger = page.locator("button[aria-label*='Search']").first();
  await expect(searchTrigger).toBeVisible();

  // Test opening search dialog via keyboard shortcut Control+k
  await page.keyboard.press("Control+k");
  const searchInput = page.getByPlaceholder(
    "Search campus buildings, classes, actions, or universities… (⌘K)",
  );
  await expect(searchInput).toBeVisible();

  // Search for a building "MN"
  await searchInput.fill("MN");
  const mnResult = page.getByText("MN — Maanjiwe nendamowinan").first();
  await expect(mnResult).toBeVisible();

  // Press Enter to select MN and navigate to /route
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/route/);

  // Re-open search on /route using Control+k
  await page.keyboard.press("Control+k");
  await expect(searchInput).toBeVisible();

  // Search for an action "timetable"
  await searchInput.fill("timetable");
  const timetableAction = page.getByText("Weekly Timetable").first();
  await expect(timetableAction).toBeVisible();

  // Search for an external university "Carleton"
  await searchInput.fill("Carleton");
  const carletonSwitch = page.getByText("Switch to Carleton University").first();
  await expect(carletonSwitch).toBeVisible();

  // Press Escape to close search dialog
  await page.keyboard.press("Escape");
  await expect(searchInput).not.toBeVisible();

  failures.assertClean();
});
