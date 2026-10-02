import { expect, test } from "@playwright/test";

test.describe("public header and university hero", () => {
  const viewports = [
    { width: 320, height: 568, name: "narrow-320" },
    { width: 375, height: 667, name: "iphone-se-375" },
    { width: 390, height: 844, name: "iphone-12-14-390" },
    { width: 393, height: 852, name: "iphone-15-393" },
    { width: 414, height: 896, name: "iphone-xr-414" },
    { width: 430, height: 932, name: "iphone-15-pro-max-430" },
    { width: 768, height: 1024, name: "tablet-768" },
    { width: 1280, height: 800, name: "desktop-1280" },
  ];

  for (const vp of viewports) {
    test(`header and university hero fit on ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const header = page.locator(".desktop-app-header");
      const hero = page.locator(".university-home-hero");

      await expect(header).toBeVisible();
      await expect(hero).toBeVisible();

      const headerBox = await header.boundingBox();
      const heroBox = await hero.boundingBox();

      expect(headerBox).not.toBeNull();
      expect(heroBox).not.toBeNull();
      expect(heroBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 0.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        vp.width,
      );
      await expect(page.locator(".brand-lockup")).toContainText("Gapwise");

      // Check after scrolling
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(100);

      const headerBoxScrolled = await header.boundingBox();
      expect(headerBoxScrolled).not.toBeNull();
      expect(headerBoxScrolled!.y).toBe(0);
    });
  }
});
