import { jsonResponse, logEvent, requestIdFrom, safeError } from "./_lib/observability.js";

const VALID_EVENT_TYPES = new Set([
  "page_view",
  "timetable_import",
  "route_calculated",
  "feature_view",
  "campus_selected",
]);

const VALID_FEATURES = new Set([
  "home",
  "today",
  "timetable",
  "gaps",
  "route",
  "map",
  "places",
  "settings",
  "about",
  "developers",
  "privacy",
  "security",
  "support",
  "trust",
  "accessibility",
]);

const VALID_UNIVERSITIES = new Set([
  "uoft",
  "carleton",
  "tmu",
  "queens",
  "laurier",
  "york",
  "mcmaster",
  "western",
  "guelph",
  "uottawa",
  "brock",
]);

const SAFE_PATH_PATTERN = /^[a-zA-Z0-9/_.-]{1,64}$/;
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,32}$/;

interface TelemetryInput {
  type: string;
  university?: string;
  campus?: string;
  feature?: string;
  path?: string;
  method?: string;
  accessible?: boolean;
  isReturning?: boolean;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const requestId = requestIdFrom(request);

    if (request.method !== "POST") {
      return jsonResponse(requestId, { error: "method_not_allowed" }, 405);
    }

    // Respect Do Not Track and Global Privacy Control signals unconditionally
    const dnt = request.headers.get("dnt")?.trim();
    const gpc = request.headers.get("sec-gpc")?.trim();
    if (dnt === "1" || gpc === "1") {
      return jsonResponse(requestId, { ok: true, ignored: "privacy_signal" }, 200);
    }

    try {
      const text = await request.text();
      if (text.length > 2048) {
        return jsonResponse(requestId, { error: "payload_too_large" }, 413);
      }

      const body = JSON.parse(text) as TelemetryInput;
      if (!body || typeof body !== "object" || typeof body.type !== "string") {
        return jsonResponse(requestId, { error: "invalid_payload" }, 400);
      }

      const eventType = body.type.trim().toLowerCase();
      if (!VALID_EVENT_TYPES.has(eventType)) {
        return jsonResponse(requestId, { error: "unsupported_event_type" }, 400);
      }

      // Sanitize fields against strict whitelists and safe patterns
      const university =
        typeof body.university === "string" && VALID_UNIVERSITIES.has(body.university.toLowerCase())
          ? body.university.toLowerCase()
          : undefined;

      const campus =
        typeof body.campus === "string" && SAFE_ID_PATTERN.test(body.campus)
          ? body.campus.slice(0, 32)
          : undefined;

      const feature =
        typeof body.feature === "string" && VALID_FEATURES.has(body.feature.toLowerCase())
          ? body.feature.toLowerCase()
          : undefined;

      const path =
        typeof body.path === "string" && SAFE_PATH_PATTERN.test(body.path)
          ? body.path.slice(0, 64)
          : undefined;

      const method = body.method === "file" || body.method === "demo" ? body.method : undefined;

      const accessible = typeof body.accessible === "boolean" ? body.accessible : undefined;
      const isReturning = typeof body.isReturning === "boolean" ? body.isReturning : undefined;

      // Log strictly anonymous structured metric without IP, User-Agent, or PII
      logEvent("info", "telemetry_metric", {
        metricType: eventType,
        ...(university ? { university } : {}),
        ...(campus ? { campus } : {}),
        ...(feature ? { feature } : {}),
        ...(path ? { path } : {}),
        ...(method ? { method } : {}),
        ...(accessible !== undefined ? { accessible } : {}),
        ...(isReturning !== undefined ? { isReturning } : {}),
      });

      return jsonResponse(requestId, { ok: true }, 200);
    } catch (error) {
      logEvent("warn", "telemetry_parse_error", {
        requestId,
        error: safeError(error),
      });
      return jsonResponse(requestId, { error: "invalid_json" }, 400);
    }
  },
};
