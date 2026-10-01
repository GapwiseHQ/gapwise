import { expect, test } from "@playwright/test";
import { watchForAppFailures } from "./helpers";

test("global homepage presents the multi-university Gapwise ecosystem", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto("/?site=gapwise-global");
  await expect(
    page.getByRole("heading", { name: "Your university day, connected." }),
  ).toBeVisible();
  await expect(page.getByText("14 supported universities")).toBeVisible();
  await expect(page.getByRole("link", { name: /Find your university/ })).toBeVisible();
  await expect(page.getByText("For University of Toronto", { exact: true })).toHaveCount(0);
  await expect(page.getByText("This edition", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Search campus and classes/ })).toHaveCount(0);
  failures.assertClean();
});

test("University of Toronto hub links to three distinct campus editions", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto("/?site=uoft-hub");
  await expect(page.getByText("Gapwise for University of Toronto", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Search campus and classes/ })).toHaveCount(0);
  for (const [name, host] of [
    ["University of Toronto Mississauga", "https://utm.gapwise.ca"],
    ["University of Toronto St. George", "https://utsg.gapwise.ca"],
    ["University of Toronto Scarborough", "https://utsc.gapwise.ca"],
  ] as const) {
    await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveAttribute("href", host);
  }
  failures.assertClean();
});

test("U of T campus editions retain campus-scoped import experiences", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  for (const [campus, name] of [
    ["utm", "University of Toronto Mississauga"],
    ["utsg", "University of Toronto St. George"],
    ["utsc", "University of Toronto Scarborough"],
  ] as const) {
    await page.goto(`/?campus=${campus}`);
    await expect(page.getByText(`For ${name}`, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Import ACORN" })).toBeVisible();
  }
  failures.assertClean();
});
