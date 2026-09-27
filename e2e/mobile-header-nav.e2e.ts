import { expect, test } from "@playwright/test";

test.describe("mobile header and secondary navigation", () => {
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
    test(`header and secondary nav never overlap on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const header = page.locator(".desktop-app-header");
      const nav = page.locator(".product-story-nav");

      await expect(header).toBeVisible();
      await expect(nav).toBeVisible();

      const headerBox = await header.boundingBox();
      const navBox = await nav.boundingBox();

      expect(headerBox).not.toBeNull();
      expect(navBox).not.toBeNull();

      console.log(`[${vp.name}] header:`, headerBox, "nav:", navBox);

      // Primary header and secondary navigation must NEVER overlap.
      // The secondary nav top must be at or below the primary header bottom.
      expect(navBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 0.5);

      // Secondary navigation links should not wrap
      const linksContainer = page.locator(".product-story-nav > div");
      const isSingleLine = await linksContainer.evaluate((el) => {
        const links = Array.from(el.querySelectorAll("a"));
        if (links.length < 2) return true;
        const firstTop = links[0].getBoundingClientRect().top;
        return links.every((link) => Math.abs(link.getBoundingClientRect().top - firstTop) < 4);
      });
      expect(isSingleLine).toBe(true);

      // Check after scrolling
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(100);

      const headerBoxScrolled = await header.boundingBox();
      const navBoxScrolled = await nav.boundingBox();

      expect(headerBoxScrolled).not.toBeNull();
      expect(navBoxScrolled).not.toBeNull();

      console.log(`[${vp.name} scrolled] header:`, headerBoxScrolled, "nav:", navBoxScrolled);

      expect(navBoxScrolled!.y).toBeGreaterThanOrEqual(headerBoxScrolled!.y + headerBoxScrolled!.height - 0.5);
    });
  }
});
