import { expect, test } from "@playwright/test";
import manifest from "../universities.json" with { type: "json" };
import { editionUrl, watchForAppFailures } from "./helpers";

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
  await expect(page.locator(".global-home-facts")).toContainText(
    "27universities with timetable import",
  );
  await expect(page.getByRole("link", { name: /Choose your university/ })).toBeVisible();
  await expect(page.getByText("For University of Toronto", { exact: true })).toHaveCount(0);
  await expect(page.getByText("This edition", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Search campus and classes/ })).toHaveCount(0);
  failures.assertClean();
});

test("timetable-only hosts publish import support without map claims", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  await page.goto(editionUrl(baseURL, "harvard"));
  await expect(
    page.getByRole("heading", { name: "See the time between Harvard classes more clearly." }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Gapwise for Harvard University");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://harvard.gapwise.ca/",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index, follow, max-image-preview:large",
  );
  await expect(page.getByText(/Timetable support is live/)).toBeVisible();
  await expect(page.getByText(/Plan the week without unsupported map claims/)).toBeVisible();
  await expect(page.locator(".university-capabilities dd")).toHaveCount(4);
  await expect(page.locator(".university-capabilities dd")).toHaveText([
    "Available",
    "Planned",
    "Planned",
    "Planned",
  ]);
  await expect(page.locator("#ics-file")).toHaveCount(1);
  await expect(page.getByText(/Mapped buildings|Routing segments/)).toHaveCount(0);
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
    "Vancouver and Okanagan",
  );
  await expect(page.getByRole("link", { name: /UBC Vancouver/ }).first()).toHaveAttribute(
    "href",
    "https://ubcv.gapwise.ca",
  );
  await expect(page.getByRole("link", { name: /UBC Okanagan/ }).first()).toHaveAttribute(
    "href",
    "https://ubco.gapwise.ca",
  );

  await search.fill("not a supported campus");
  await expect(page.getByText(/No university or campus matches/)).toBeVisible();
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
  await expect(page.locator(".university-home-kicker")).toContainText(
    "Gapwise for the University of Toronto",
  );
  await expect(page.getByRole("button", { name: /Search campus and classes/ })).toHaveCount(0);
  for (const [name, host] of [
    ["University of Toronto Mississauga", "https://utm.gapwise.ca"],
    ["University of Toronto St. George", "https://utsg.gapwise.ca"],
    ["University of Toronto Scarborough", "https://utsc.gapwise.ca"],
  ] as const) {
    await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toHaveAttribute(
      "href",
      host,
    );
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
    await expect(page.locator(".university-home-kicker")).toContainText(`Gapwise for ${name}`);
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
    page.getByText("Gapwise for University of Toronto Mississauga", { exact: true }),
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

const supportedEditions = [
  ["uoft", "Three campuses. One clearer university day."],
  ["carleton", "Navigate Carleton. Plan your schedule. Get to class."],
  ["tmu", "Move through downtown campus with your day in view."],
  ["queens", "Plan Queen's days from first lecture to last walk."],
  ["laurier", "Make the walk between Laurier classes part of the plan."],
  ["york", "Three campuses. One clearer York day."],
  ["mcmaster", "Your McMaster schedule, mapped to campus."],
  ["western", "Plan the space between classes at Western."],
  ["guelph", "Build a calmer day across the Guelph campus."],
  ["uottawa", "See your uOttawa day before you cross campus."],
  ["brock", "Turn your Brock schedule into a campus plan."],
  ["ubc", "Two campuses. One clearer UBC day."],
  ["waterloo", "Keep your Waterloo schedule and campus route together."],
  ["mcgill", "Connect your McGill timetable to downtown campus."],
] as const;

test("every supported university edition renders isolated registry-driven identity and metadata", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  test.setTimeout(90_000);
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);

  for (const [id, headline] of supportedEditions) {
    const expectedTitle = manifest.universities.find((university) => university.id === id)
      ?.marketing.seoTitle;
    expect(expectedTitle).toBeTruthy();
    await page.goto(`/?university=${id}`);
    await expect(page.getByRole("heading", { name: headline })).toBeVisible();
    await expect(page).toHaveTitle(expectedTitle!);
    await expect(page.locator(".university-home-stats")).toBeVisible();
    for (const [otherId, otherHeadline] of supportedEditions) {
      if (otherId !== id)
        await expect(page.getByRole("heading", { name: otherHeadline })).toHaveCount(0);
    }
  }
  failures.assertClean();
});

test("directory searches Canada and the U.S. without horizontal overflow", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = watchForAppFailures(page, baseURL);
  await page.goto("/universities?site=global");
  await expect(page.getByRole("heading", { name: "Explore Gapwise universities." })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://gapwise.ca/universities",
  );
  const search = page.getByPlaceholder("Search university, campus, or city");
  await search.fill("Pittsburgh");
  await expect(page.getByRole("link", { name: /Carnegie Mellon University/ })).toBeVisible();
  await search.fill("ubco.gapwise.ca");
  await expect(page.getByRole("link", { name: /UBC Okanagan/ })).toBeVisible();
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  failures.assertClean();
});

test("every registry edition resolves with isolated identity, canonical metadata, and capability state", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  test.setTimeout(180_000);
  if (!baseURL) throw new Error("Playwright baseURL is required");
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = watchForAppFailures(page, baseURL);

  for (const site of manifest.sites.filter((candidate) => candidate.role !== "global")) {
    const university = manifest.universities.find(
      (candidate) => candidate.id === site.universityId,
    );
    const campus = manifest.campuses.find((candidate) => candidate.id === site.campusId);
    expect(university, `${site.id} must resolve its university`).toBeDefined();
    const marketing = site.presentation?.marketing ?? campus?.marketing ?? university?.marketing;
    const status = campus?.status ?? university?.status;
    expect(marketing, `${site.id} must resolve marketing content`).toBeDefined();

    await page.goto(`/?site=${site.id}`);
    await expect(page.getByRole("heading", { name: marketing!.headline })).toBeVisible();
    await expect(page).toHaveTitle(marketing!.seoTitle);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://${site.canonicalHost}/`,
    );
    await expect(page.locator(".university-home")).toHaveAttribute("data-status", status!);
    await expect(page.locator(".university-capabilities dd")).toHaveCount(4);
    if (status === "planned") {
      await expect(page.locator(".university-capabilities dd")).toHaveText([
        "Planned",
        "Planned",
        "Planned",
        "Planned",
      ]);
      await expect(page.locator("#ics-file")).toHaveCount(0);
    }
    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(layout.documentWidth, `${site.canonicalHost} must not overflow`).toBeLessThanOrEqual(
      layout.viewportWidth,
    );
  }
  failures.assertClean();
});

test("campus aliases render distinct U of T editions without identity leaks", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const failures = watchForAppFailures(page, baseURL);
  const campuses = [
    ["utm", "Make every gap at UTM count.", "University of Toronto Mississauga"],
    ["utsg", "Plan the distance between downtown classes.", "University of Toronto St. George"],
    ["utsc", "See your next move across UTSC.", "University of Toronto Scarborough"],
  ] as const;

  for (const [campus, headline, identity] of campuses) {
    await page.goto(`/?campus=${campus}`);
    await expect(page.getByRole("heading", { name: headline })).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(`Gapwise for ${identity}`));
    for (const [otherCampus, otherHeadline] of campuses) {
      if (otherCampus !== campus)
        await expect(page.getByRole("heading", { name: otherHeadline })).toHaveCount(0);
    }
  }
  failures.assertClean();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`university hero is usable without horizontal overflow at ${viewport.width}px`, async ({
    page,
    baseURL,
  }) => {
    test.skip(test.info().project.name !== "chromium");
    if (!baseURL) throw new Error("Playwright baseURL is required");
    await page.setViewportSize(viewport);
    const failures = watchForAppFailures(page, baseURL);
    await page.goto("/?university=carleton");
    await expect(page.getByRole("button", { name: "Try the Carleton demo" })).toBeVisible();
    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      ctaBottom: document
        .querySelector<HTMLElement>(".university-home-primary")
        ?.getBoundingClientRect().bottom,
    }));
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    if (viewport.width >= 1000) expect(layout.ctaBottom).toBeLessThan(viewport.height);
    failures.assertClean();
  });
}
