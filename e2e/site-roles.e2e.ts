import { expect, test } from "@playwright/test";
import { watchForAppFailures } from "./helpers";

test("global homepage presents the multi-university Gapwise ecosystem", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto("/?site=global");
  await expect(
    page.getByRole("heading", { name: "Make every gap on campus count." }),
  ).toBeVisible();
  await expect(page.locator(".global-home-facts")).toContainText("14supported universities");
  await expect(page.getByRole("link", { name: /Choose your university/ })).toBeVisible();
  await expect(page.getByText("For University of Toronto", { exact: true })).toHaveCount(0);
  await expect(page.getByText("This edition", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Search campus and classes/ })).toHaveCount(0);
  failures.assertClean();
});

test("global university chooser finds registry aliases and direct campus editions", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto("/?site=global#universities");
  const search = page.getByPlaceholder("Find your university or campus");
  for (const [term, linkName, href] of [
    ["uoft", /^U of T University of Toronto/, "https://uoft.gapwise.ca"],
    ["toronto", /^U of T University of Toronto/, "https://uoft.gapwise.ca"],
    ["utm", /UTM · Campus edition University of Toronto Mississauga/, "https://utm.gapwise.ca"],
    ["utsg", /UTSG · Campus edition University of Toronto St. George/, "https://utsg.gapwise.ca"],
    ["utsc", /UTSC · Campus edition University of Toronto Scarborough/, "https://utsc.gapwise.ca"],
    ["mcgill", /McGill University/, "https://mcgill.gapwise.ca"],
    ["waterloo", /University of Waterloo/, "https://waterloo.gapwise.ca"],
    ["york", /York University/, "https://york.gapwise.ca"],
    ["laurier", /Wilfrid Laurier University/, "https://laurier.gapwise.ca"],
    ["metropolitan", /Toronto Metropolitan University/, "https://tmu.gapwise.ca"],
    ["tmu", /Toronto Metropolitan University/, "https://tmu.gapwise.ca"],
  ] as const) {
    await search.fill(term);
    await expect(page.getByRole("link", { name: linkName }).first()).toHaveAttribute("href", href);
  }

  await search.fill("ubc");
  await expect(page.getByRole("link", { name: /University of British Columbia/ })).toContainText(
    "Vancouver / Point Grey campus",
  );
  await expect(page.getByText(/Okanagan/)).toHaveCount(0);

  await search.fill("not a supported campus");
  await expect(page.getByText(/No supported university or campus matches/)).toBeVisible();
  failures.assertClean();
});

for (const viewport of [
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 1080 },
]) {
  test(`global first viewport is deliberately composed at ${viewport.width}x${viewport.height}`, async ({
    page,
    baseURL,
  }) => {
    test.skip(test.info().project.name !== "chromium");
    if (!baseURL) throw new Error("Playwright baseURL is required");
    await page.setViewportSize(viewport);
    const failures = watchForAppFailures(page, baseURL);

    await page.goto("/?site=global");
    await expect(page.locator(".global-home-window")).toBeVisible();
    const layout = await page.evaluate(() => {
      const windowRect = document
        .querySelector<HTMLElement>(".global-home-window")
        ?.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        previewTop: windowRect?.top,
      };
    });
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.previewTop).toBeLessThan(viewport.height);
    failures.assertClean();
  });
}

test("University of Toronto hub links to three distinct campus editions", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto("/?site=uoft-hub");
  await expect(
    page.getByText("Gapwise for the University of Toronto", { exact: true }),
  ).toBeVisible();
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

for (const width of [320, 360, 375, 390, 393, 430]) {
  test(`mobile public header and global hero fit at ${width}px`, async ({ page, baseURL }) => {
    test.skip(test.info().project.name !== "chromium");
    if (!baseURL) throw new Error("Playwright baseURL is required");
    await page.setViewportSize({ width, height: 844 });
    const failures = watchForAppFailures(page, baseURL);

    await page.goto("/?site=global");
    await expect(
      page.getByRole("heading", { name: "Make every gap on campus count." }),
    ).toBeVisible();
    const layout = await page.evaluate(() => {
      const brand = document.querySelector<HTMLElement>(".brand-lockup");
      const heading = document.querySelector<HTMLElement>("#global-home-title");
      const brandRect = brand?.getBoundingClientRect();
      const headingRect = heading?.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        brandText: brand?.innerText.trim(),
        brandLeft: brandRect?.left,
        brandRight: brandRect?.right,
        headingHeight: headingRect?.height,
      };
    });
    expect(layout.brandText).toBe("Gapwise");
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.brandLeft).toBeGreaterThanOrEqual(0);
    expect(layout.brandRight).toBeLessThanOrEqual(width);
    expect(layout.headingHeight).toBeLessThan(260);
    await page.screenshot({
      path: test.info().outputPath(`global-${width}.png`),
      fullPage: false,
    });
    failures.assertClean();
  });
}

test("narrow UTM header preserves the full brand and contains its controls", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  await page.setViewportSize({ width: 320, height: 844 });
  const failures = watchForAppFailures(page, baseURL);

  await page.goto("/?campus=utm");
  await expect(
    page.getByText("For University of Toronto Mississauga", { exact: true }),
  ).toBeVisible();
  const header = await page.evaluate(() => {
    const brand = document.querySelector<HTMLElement>(".brand-lockup");
    const brandRect = brand?.getBoundingClientRect();
    const controls = [...document.querySelectorAll<HTMLElement>(".desktop-app-header button")]
      .filter((control) => control.getClientRects().length > 0)
      .map((control) => {
        const rect = control.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
      });
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      brandText: brand?.innerText.trim(),
      brandLeft: brandRect?.left,
      brandRight: brandRect?.right,
      controls,
    };
  });
  expect(header.brandText).toBe("Gapwise");
  expect(header.documentWidth).toBeLessThanOrEqual(header.viewportWidth);
  expect(header.brandLeft).toBeGreaterThanOrEqual(0);
  expect(header.brandRight).toBeLessThanOrEqual(320);
  for (const control of header.controls) {
    expect(control.left).toBeGreaterThanOrEqual(0);
    expect(control.right).toBeLessThanOrEqual(320);
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: test.info().outputPath("utm-320.png"), fullPage: false });
  failures.assertClean();
});
