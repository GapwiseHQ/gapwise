import { expect, type Page } from "@playwright/test";

export function isMobileProject(projectName: string) {
  return projectName.startsWith("mobile-");
}

export function editionUrl(baseURL: string, host: string, path = "/") {
  const url = new URL(path, baseURL);
  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname.endsWith(".localhost");
  if (isLocal) url.hostname = `${host}.localhost`;
  else url.searchParams.set("university", host);
  return url.toString();
}

export function watchForAppFailures(page: Page, baseURL: string) {
  const failures: string[] = [];
  const appOrigin = new URL(baseURL).origin;
  const appUrl = new URL(baseURL);
  const ignoredLocalInstrumentationPaths = [
    "/_vercel/insights/",
    "/_vercel/speed-insights/",
    "/api/telemetry",
  ];

  const isIgnoredLocalInstrumentationRequest = (url: URL) =>
    isFirstParty(url) &&
    ignoredLocalInstrumentationPaths.some((path) => url.pathname.startsWith(path));

  const isFirstParty = (url: URL) =>
    url.origin === appOrigin ||
    (appUrl.hostname.endsWith(".localhost") &&
      url.hostname.endsWith(".localhost") &&
      url.protocol === appUrl.protocol &&
      url.port === appUrl.port);

  page.on("pageerror", (error) => {
    failures.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (message.text().startsWith("Failed to load resource:")) return;

    const location = message.location().url;
    if (!location || location.startsWith(appOrigin)) {
      failures.push(`console.error: ${message.text()}`);
    }
  });

  page.on("response", (response) => {
    const url = new URL(response.url());
    if (isIgnoredLocalInstrumentationRequest(url)) return;
    if (isFirstParty(url) && response.status() >= 400) {
      failures.push(`HTTP ${response.status()}: ${url.pathname}`);
    }
  });

  page.on("requestfailed", (request) => {
    const url = new URL(request.url());
    if (isIgnoredLocalInstrumentationRequest(url)) return;
    if (!isFirstParty(url)) return;
    failures.push(`request failed: ${url.pathname} (${request.failure()?.errorText ?? "unknown"})`);
  });

  return {
    assertClean() {
      expect(failures, "unexpected first-party browser/runtime failures").toEqual([]);
    },
  };
}

export async function expectLanding(page: Page) {
  await page.goto("/");
  await expect(page.locator(".university-home h1, .global-home h1").first()).toBeVisible();
  await expect(page.locator(".university-home-primary").first()).toBeVisible();
  await expect(page.locator("#ics-file")).toHaveCount(1);
}
