import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { watchForAppFailures } from "./helpers";

const fixture = (name: string) => resolve(process.cwd(), "tests", "fixtures", name);

async function importFixture(page: Page, name: string) {
  await page.goto("/");
  await page.locator("#ics-file").setInputFiles(fixture(name));
  await expect(page).toHaveURL(/\/timetable/);
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "Your timetable" })).toBeVisible();
  }
}

async function openDayRoute(page: Page, mobile: boolean) {
  if (mobile) {
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Map" }).click();
  } else {
    await page
      .getByRole("group", { name: "View mode" })
      .getByRole("button", { name: "Day route" })
      .click();
  }
}

for (const [name, campus, firstCode] of [
  ["acorn-utm-sanitized.ics", "UTM", "MN"],
  ["acorn-utsg-sanitized.ics", "UTSG", "BA"],
  ["acorn-utsc-sanitized.ics", "UTSC", "HL"],
] as const) {
  test(`ACORN building evidence activates the ${campus} product`, async ({ page, baseURL }) => {
    test.skip(test.info().project.name !== "chromium");
    if (!baseURL) throw new Error("Playwright baseURL is required");
    const failures = watchForAppFailures(page, baseURL);

    await importFixture(page, name);
    await openDayRoute(page, false);

    const search = page.getByRole("searchbox", { name: `Search ${campus} buildings` });
    await expect(search).toBeVisible();
    await expect(page.locator(".map-time-marker")).toHaveCount(2);
    await expect(page.getByText("Day order", { exact: true })).toBeVisible();

    await search.fill(firstCode);
    await search.press("Enter");
    expect(new URL(page.url()).searchParams.get("campus")).toBe(campus.toLowerCase());
    expect(new URL(page.url()).searchParams.get("building")).toBe(firstCode);

    const otherCampus = campus === "UTM" ? "UTSG" : "UTM";
    await page.getByRole("button", { name: otherCampus, exact: true }).click();
    await expect(
      page.getByRole("searchbox", { name: `Search ${otherCampus} buildings` }),
    ).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("searchbox", { name: `Search ${campus} buildings` })).toBeVisible();
    await page.goForward();
    await expect(
      page.getByRole("searchbox", { name: `Search ${otherCampus} buildings` }),
    ).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("searchbox", { name: `Search ${campus} buildings` })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("searchbox", { name: `Search ${campus} buildings` })).toBeVisible();

    failures.assertClean();
  });
}

test("mixed and ambiguous ACORN locations preserve the explicit campus edition", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  for (const name of ["acorn-mixed-campus-sanitized.ics", "acorn-ambiguous-campus-sanitized.ics"]) {
    await importFixture(page, name);
    await openDayRoute(page, false);
    await expect(page.getByRole("searchbox", { name: "Search UTM buildings" })).toBeVisible();
    expect(new URL(page.url()).hostname).toBe(new URL(baseURL).hostname);
    expect(new URL(page.url()).searchParams.get("campus")).toBeNull();
  }

  failures.assertClean();
});

test("UTSC inference opens the correct map on mobile", async ({ page, baseURL }) => {
  test.skip(test.info().project.name !== "mobile-chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await importFixture(page, "acorn-utsc-sanitized.ics");
  await openDayRoute(page, true);
  await expect(page.getByRole("searchbox", { name: "Search UTSC buildings" })).toBeVisible();
  await expect(page.locator(".map-time-marker")).toHaveCount(2);
  failures.assertClean();
});
