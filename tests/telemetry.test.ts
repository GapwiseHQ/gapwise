import { describe, expect, test } from "bun:test";
import telemetryHandler from "../api/telemetry";
import {
  trackCampusSelection,
  trackFeatureView,
  trackPageView,
  trackRouteCalculation,
  trackTimetableImport,
} from "../src/lib/telemetry";

describe("Privacy-First Anonymous Telemetry Endpoint", () => {
  test("rejects non-POST methods with 405", async () => {
    const request = new Request("https://gapwise.ca/api/telemetry", { method: "GET" });
    const response = await telemetryHandler.fetch(request);
    expect(response.status).toBe(405);
    const body = await response.json();
    expect(body.error).toBe("method_not_allowed");
  });

  test("unconditionally honors Do Not Track (DNT) header", async () => {
    const request = new Request("https://gapwise.ca/api/telemetry", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        dnt: "1",
      },
      body: JSON.stringify({ type: "page_view", path: "/" }),
    });
    const response = await telemetryHandler.fetch(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.ignored).toBe("privacy_signal");
  });

  test("unconditionally honors Global Privacy Control (GPC) header", async () => {
    const request = new Request("https://gapwise.ca/api/telemetry", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "sec-gpc": "1",
      },
      body: JSON.stringify({ type: "page_view", path: "/timetable" }),
    });
    const response = await telemetryHandler.fetch(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.ignored).toBe("privacy_signal");
  });

  test("rejects payloads exceeding 2048 bytes with 413", async () => {
    const bigString = "a".repeat(2100);
    const request = new Request("https://gapwise.ca/api/telemetry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "page_view", overflow: bigString }),
    });
    const response = await telemetryHandler.fetch(request);
    expect(response.status).toBe(413);
    const body = await response.json();
    expect(body.error).toBe("payload_too_large");
  });

  test("rejects invalid or unsupported event types with 400", async () => {
    const request = new Request("https://gapwise.ca/api/telemetry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "arbitrary_custom_tracking" }),
    });
    const response = await telemetryHandler.fetch(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("unsupported_event_type");
  });

  test("accepts valid anonymous aggregate events and returns 200", async () => {
    const events = [
      { type: "page_view", path: "/", university: "uoft", isReturning: false },
      { type: "timetable_import", method: "file", university: "carleton" },
      { type: "timetable_import", method: "demo", university: "tmu" },
      { type: "route_calculated", university: "uoft", campus: "utm", accessible: true },
      { type: "feature_view", feature: "gaps", university: "york" },
      { type: "campus_selected", university: "uoft", campus: "utsg" },
    ];

    for (const evt of events) {
      const request = new Request("https://gapwise.ca/api/telemetry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(evt),
      });
      const response = await telemetryHandler.fetch(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
    }
  });

  test("client-side telemetry methods execute without throwing in headless/SSR environments", () => {
    expect(() => trackPageView("/about", "uoft")).not.toThrow();
    expect(() => trackTimetableImport("file", "carleton")).not.toThrow();
    expect(() => trackRouteCalculation("uoft", "utm", true)).not.toThrow();
    expect(() => trackFeatureView("today", "uoft")).not.toThrow();
    expect(() => trackCampusSelection("uoft", "utm")).not.toThrow();
  });
});
