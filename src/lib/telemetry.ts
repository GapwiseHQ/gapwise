/**
 * Privacy-First Anonymous Aggregate Telemetry
 *
 * Core Guarantees:
 * 1. Zero PII: No IP logging, no cookies, no user tracking IDs, no user-agent collection.
 * 2. Zero Schedule Data: Never transmits timetables, course codes, calendar contents, or notes.
 * 3. Zero Location Data: Never transmits GPS or user position coordinates.
 * 4. Respects DNT and GPC: Silently drops all telemetry if privacy signals are enabled.
 * 5. Minimal Aggregate Counters: Used solely for institutional reporting and capacity planning.
 */

type TelemetryPayload = {
  type: "page_view" | "timetable_import" | "route_calculated" | "feature_view" | "campus_selected";
  university?: string | undefined;
  campus?: string | undefined;
  feature?: string | undefined;
  path?: string | undefined;
  method?: ("file" | "demo") | undefined;
  accessible?: boolean | undefined;
  isReturning?: boolean | undefined;
};

function isTelemetryDisabled(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return true;
  if (
    typeof process !== "undefined" &&
    (process.env?.["NODE_ENV"] === "test" || process.env?.["BUN_TEST"] === "1")
  ) {
    return true;
  }
  if (
    typeof window.location !== "undefined" &&
    (window.location.hostname === "gapwise.test" || window.location.hostname.endsWith(".test"))
  ) {
    return true;
  }
  if (
    navigator.doNotTrack === "1" ||
    (window as unknown as { doNotTrack?: string }).doNotTrack === "1"
  ) {
    return true;
  }
  if ((navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true) {
    return true;
  }
  return false;
}

function checkIsReturning(): boolean {
  try {
    const key = "gapwise:telemetry:v1";
    if (localStorage.getItem(key)) {
      return true;
    }
    localStorage.setItem(key, "1");
    return false;
  } catch {
    return false;
  }
}

function sendTelemetry(payload: TelemetryPayload): void {
  if (isTelemetryDisabled()) return;

  try {
    const body = JSON.stringify({
      ...payload,
      isReturning: payload.isReturning ?? checkIsReturning(),
    });

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/telemetry", blob);
      if (sent) return;
    }

    if (typeof fetch === "function") {
      fetch("/api/telemetry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Silently ignore telemetry transmission failures
      });
    }
  } catch {
    // Zero-impact error boundary
  }
}

export function trackPageView(path: string, university?: string): void {
  sendTelemetry({ type: "page_view", path, university });
}

export function trackTimetableImport(method: "file" | "demo", university?: string): void {
  sendTelemetry({ type: "timetable_import", method, university });
}

export function trackRouteCalculation(
  university?: string,
  campus?: string,
  accessible?: boolean,
): void {
  sendTelemetry({ type: "route_calculated", university, campus, accessible });
}

export function trackFeatureView(feature: string, university?: string): void {
  sendTelemetry({ type: "feature_view", feature, university });
}

export function trackCampusSelection(university?: string, campus?: string): void {
  sendTelemetry({ type: "campus_selected", university, campus });
}
