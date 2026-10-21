import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { resolveAuthRedirect } from "../src/lib/auth-redirect.ts";
import manifest from "../universities.json" with { type: "json" };

describe("university authentication return destinations", () => {
  for (const host of new Set(["utm.gapwise.ca", ...manifest.sites.flatMap((site) => site.hosts)])) {
    test(`${host} retains its origin and requested route`, () => {
      const href = `https://${host}/today?view=week#schedule`;
      assert.equal(resolveAuthRedirect(href), href);
      assert.equal(resolveAuthRedirect(`https://${host}`), `https://${host}/`);
      assert.equal(resolveAuthRedirect(href, "/timetable"), `https://${host}/timetable`);
      if (host !== "gapwise.ca") {
        assert.throws(() => resolveAuthRedirect(href, "https://gapwise.ca/"));
      }
    });
  }

  test("rejects external and deceptive return destinations", () => {
    for (const target of [
      "//evil.test/",
      "https://utm.gapwise.ca.evil.test/",
      "javascript:alert(1)",
      "https://evil.test@utm.gapwise.ca/",
      "https://gapwise.ca/",
    ]) {
      assert.throws(() => resolveAuthRedirect("https://utm.gapwise.ca/today", target));
    }
  });

  test("removes old OAuth responses on retry", () => {
    assert.equal(
      resolveAuthRedirect(
        "https://utm.gapwise.ca/today?code=old&view=week&error=denied#access_token=old",
      ),
      "https://utm.gapwise.ca/today?view=week",
    );
  });
});
