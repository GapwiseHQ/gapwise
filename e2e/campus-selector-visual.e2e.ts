import { expect, test } from "@playwright/test";
import { editionUrl, watchForAppFailures } from "./helpers";

test("campus selector dynamic width across universities on desktop and mobile", async ({
  page,
  baseURL,
}) => {
  test.skip(test.info().project.name !== "chromium");
  if (!baseURL) throw new Error("Base URL required");
  const failures = watchForAppFailures(page, baseURL);

  // Test McMaster (2 campuses) on Desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(editionUrl(baseURL, "mcmaster", "/route"));
  await page.waitForSelector(".campus-explorer-search");

  const mcmasterLayout = await page.evaluate(() => {
    const search = document.querySelector(".campus-explorer-search") as HTMLElement;
    const selector = search.querySelector('[role="group"]') as HTMLElement;
    const input = search.querySelector("input") as HTMLElement;
    const selectorParent = selector.parentElement as HTMLElement;
    const searchRect = search.getBoundingClientRect();
    const selectorRect = selector.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const pills = [...selector.querySelectorAll("button")].map((b) => ({
      text: b.innerText.trim(),
      width: b.getBoundingClientRect().width,
    }));
    return {
      searchWidth: searchRect.width,
      selectorWidth: selectorParent.getBoundingClientRect().width,
      inputWidth: inputRect.width,
      selectorLeft: selectorParent.getBoundingClientRect().left,
      inputLeft: inputRect.left,
      pills,
    };
  });

  console.log("McMaster desktop layout:", JSON.stringify(mcmasterLayout, null, 2));
  // McMaster selector should be shrink-wrapped around its 2 pills, significantly smaller than search input
  expect(mcmasterLayout.selectorWidth).toBeLessThan(mcmasterLayout.searchWidth * 0.75);
  // Left edges must align cleanly
  expect(Math.abs(mcmasterLayout.selectorLeft - mcmasterLayout.inputLeft)).toBeLessThanOrEqual(5);

  // Click Burlington campus to test width stability on switch
  await page.getByRole("button", { name: "Burlington", exact: true }).click();
  const mcmasterSwitched = await page.evaluate(() => {
    const search = document.querySelector(".campus-explorer-search") as HTMLElement;
    const selector = search.querySelector('[role="group"]') as HTMLElement;
    const input = search.querySelector("input") as HTMLElement;
    const selectorParent = selector.parentElement as HTMLElement;
    return {
      selectorWidth: selectorParent.getBoundingClientRect().width,
      inputWidth: input.getBoundingClientRect().width,
      selectorLeft: selectorParent.getBoundingClientRect().left,
      inputLeft: input.getBoundingClientRect().left,
    };
  });
  // Width and left position must not jump when switching active campus
  expect(
    Math.abs(mcmasterSwitched.selectorWidth - mcmasterLayout.selectorWidth),
  ).toBeLessThanOrEqual(2);
  expect(Math.abs(mcmasterSwitched.inputWidth - mcmasterLayout.inputWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(mcmasterSwitched.selectorLeft - mcmasterSwitched.inputLeft)).toBeLessThanOrEqual(
    5,
  );

  await page.screenshot({ path: "test-results/mcmaster-desktop.png" });

  // Test McMaster on Mobile (390px)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(editionUrl(baseURL, "mcmaster", "/route"));
  await page.waitForSelector(".campus-explorer-search");

  const mcmasterMobile = await page.evaluate(() => {
    const search = document.querySelector(".campus-explorer-search") as HTMLElement;
    const selector = search.querySelector('[role="group"]') as HTMLElement;
    const selectorParent = selector.parentElement as HTMLElement;
    const input = search.querySelector("input") as HTMLElement;
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      selectorWidth: selectorParent.getBoundingClientRect().width,
      inputWidth: input.getBoundingClientRect().width,
      selectorLeft: selectorParent.getBoundingClientRect().left,
      inputLeft: input.getBoundingClientRect().left,
    };
  });
  console.log("McMaster mobile layout:", JSON.stringify(mcmasterMobile, null, 2));
  expect(mcmasterMobile.scrollWidth).toBeLessThanOrEqual(mcmasterMobile.viewportWidth);
  expect(mcmasterMobile.selectorWidth).toBeLessThan(mcmasterMobile.inputWidth * 0.75);
  expect(Math.abs(mcmasterMobile.selectorLeft - mcmasterMobile.inputLeft)).toBeLessThanOrEqual(5);

  await page.screenshot({ path: "test-results/mcmaster-mobile.png" });

  // Test Sorbonne (7 campuses) on Desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(editionUrl(baseURL, "sorbonne", "/route"));
  await page.waitForSelector(".campus-explorer-search");

  const sorbonneLayout = await page.evaluate(() => {
    const search = document.querySelector(".campus-explorer-search") as HTMLElement;
    const selector = search.querySelector('[role="group"]') as HTMLElement;
    const selectorParent = selector.parentElement as HTMLElement;
    const input = search.querySelector("input") as HTMLElement;
    return {
      searchWidth: search.getBoundingClientRect().width,
      selectorWidth: selectorParent.getBoundingClientRect().width,
      inputWidth: input.getBoundingClientRect().width,
      selectorLeft: selectorParent.getBoundingClientRect().left,
      inputLeft: input.getBoundingClientRect().left,
    };
  });
  console.log("Sorbonne desktop layout:", JSON.stringify(sorbonneLayout, null, 2));
  // Sorbonne selector should grow to fill the max container width
  expect(Math.abs(sorbonneLayout.selectorWidth - sorbonneLayout.searchWidth)).toBeLessThanOrEqual(
    5,
  );
  expect(Math.abs(sorbonneLayout.selectorLeft - sorbonneLayout.inputLeft)).toBeLessThanOrEqual(5);

  await page.screenshot({ path: "test-results/sorbonne-desktop.png" });

  // Test Sorbonne on Mobile (390px)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(editionUrl(baseURL, "sorbonne", "/route"));
  await page.waitForSelector(".campus-explorer-search");

  const sorbonneMobile = await page.evaluate(() => {
    const search = document.querySelector(".campus-explorer-search") as HTMLElement;
    const selector = search.querySelector('[role="group"]') as HTMLElement;
    const selectorParent = selector.parentElement as HTMLElement;
    const input = search.querySelector("input") as HTMLElement;
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      selectorWidth: selectorParent.getBoundingClientRect().width,
      inputWidth: input.getBoundingClientRect().width,
    };
  });
  console.log("Sorbonne mobile layout:", JSON.stringify(sorbonneMobile, null, 2));
  expect(sorbonneMobile.scrollWidth).toBeLessThanOrEqual(sorbonneMobile.viewportWidth);
  expect(Math.abs(sorbonneMobile.selectorWidth - sorbonneMobile.inputWidth)).toBeLessThanOrEqual(5);

  await page.screenshot({ path: "test-results/sorbonne-mobile.png" });

  // Test UofT (3 campuses: UTM, UTSG, UTSC)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(editionUrl(baseURL, "uoft", "/route?campus=utm"));
  await page.waitForSelector(".campus-explorer-search");

  const uoftLayout = await page.evaluate(() => {
    const search = document.querySelector(".campus-explorer-search") as HTMLElement;
    const selector = search.querySelector('[role="group"]') as HTMLElement;
    const selectorParent = selector.parentElement as HTMLElement;
    const input = search.querySelector("input") as HTMLElement;
    return {
      searchWidth: search.getBoundingClientRect().width,
      selectorWidth: selectorParent.getBoundingClientRect().width,
      inputWidth: input.getBoundingClientRect().width,
      selectorLeft: selectorParent.getBoundingClientRect().left,
      inputLeft: input.getBoundingClientRect().left,
    };
  });
  console.log("UofT desktop layout:", JSON.stringify(uoftLayout, null, 2));
  // UofT (UTM, UTSG, UTSC) has 3 short pills (~185px) -> shrink wrapped
  expect(uoftLayout.selectorWidth).toBeLessThan(uoftLayout.searchWidth * 0.75);
  expect(Math.abs(uoftLayout.selectorLeft - uoftLayout.inputLeft)).toBeLessThanOrEqual(5);

  await page.screenshot({ path: "test-results/uoft-desktop.png" });

  // Test TMU (single campus edition)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(editionUrl(baseURL, "tmu", "/route"));
  await page.waitForSelector(".campus-explorer-search");

  const tmuLayout = await page.evaluate(() => {
    const search = document.querySelector(".campus-explorer-search") as HTMLElement;
    const selector = search.querySelector('[role="group"]') as HTMLElement;
    const input = search.querySelector("input") as HTMLElement;
    return {
      hasSelector: Boolean(selector),
      inputWidth: input.getBoundingClientRect().width,
      searchWidth: search.getBoundingClientRect().width,
    };
  });
  console.log("TMU layout:", JSON.stringify(tmuLayout, null, 2));
  // Single campus university or edition
  expect(tmuLayout.inputWidth).toBeGreaterThan(0);

  await page.screenshot({ path: "test-results/tmu-desktop.png" });
  failures.assertClean();
});
