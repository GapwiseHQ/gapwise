import manifest from "../../universities.json" with { type: "json" };

export type University = (typeof manifest.universities)[number];

export type SiteRole =
  "global" | "university-hub" | "campus-edition" | "single-campus-edition" | "reserved";

export type SiteDefinition = {
  id: string;
  role: SiteRole;
  hosts: string[];
  canonicalHost: string;
  universityId?: string;
  campusId?: string;
  name?: string;
  shortName?: string;
  presentation?: {
    accentColor?: string;
    heroEyebrow?: string;
    heroDescription?: string;
    cardDescription?: string;
    timetableLabel?: string;
    visualLabel?: string;
    ogTitle?: string;
    ogDescription?: string;
    links?: Array<{ label: string; href: string }>;
  };
};

export const UNIVERSITIES: readonly University[] = manifest.universities;
export const SITES: readonly SiteDefinition[] = manifest.sites as readonly SiteDefinition[];

function globalSite(): SiteDefinition {
  const site = SITES.find((candidate) => candidate.role === "global");
  if (!site) throw new Error("University registry is missing the global Gapwise site");
  return site;
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/\.$/, "");
}

export function validateUniversityManifest(
  entries: readonly University[] = manifest.universities,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const hosts = new Set<string>();
  const campusIds = new Set<string>();
  const siteIds = new Set<string>();
  const siteHosts = new Set<string>();
  for (const site of SITES) {
    if (!/^[a-z][a-z0-9-]*$/.test(site.id) || siteIds.has(site.id))
      errors.push(`Invalid or duplicate site ID: ${site.id}`);
    siteIds.add(site.id);
    if (!site.hosts.includes(site.canonicalHost))
      errors.push(`${site.id}: canonicalHost must be listed in hosts`);
    for (const host of site.hosts) {
      if (host !== normalizeHostname(host) || !/^[a-z0-9.-]+$/.test(host) || siteHosts.has(host))
        errors.push(`Invalid or duplicate site host: ${host}`);
      siteHosts.add(host);
    }
    const university = site.universityId
      ? entries.find((entry) => entry.id === site.universityId)
      : undefined;
    if (site.universityId && !university) errors.push(`${site.id}: unknown universityId`);
    if (site.campusId && !university?.campuses.includes(site.campusId))
      errors.push(`${site.id}: campusId must belong to universityId`);
    if (site.role === "campus-edition" && !site.campusId)
      errors.push(`${site.id}: campus editions require campusId`);
  }
  if (SITES.filter((site) => site.role === "global").length !== 1)
    errors.push("Exactly one global site is required");
  for (const entry of entries) {
    if (!/^[a-z][a-z0-9-]*$/.test(entry.id) || ids.has(entry.id))
      errors.push(`Invalid or duplicate university ID: ${entry.id}`);
    ids.add(entry.id);
    if (!entry.name.trim() || !entry.shortName.trim()) errors.push(`${entry.id}: name is required`);
    if (!entry.campuses.length || !entry.campuses.includes(entry.defaultCampus))
      errors.push(`${entry.id}: default campus must be listed`);
    if (entry.routableCampuses.some((campus) => !entry.campuses.includes(campus)))
      errors.push(`${entry.id}: routable campus must be listed`);
    if (!entry.timetableAdapter.trim()) errors.push(`${entry.id}: timetable adapter is required`);
    if (!entry.accentColor?.trim() || !/^#[0-9a-fA-F]{6}$/.test(entry.accentColor))
      errors.push(`${entry.id}: valid hex accentColor is required`);
    if (!entry.campusScope?.trim()) errors.push(`${entry.id}: campusScope is required`);
    if (entry.status !== "planned" && !entry.dataPaths.length)
      errors.push(`${entry.id}: data paths are required`);
    for (const campus of entry.campuses) {
      if (campusIds.has(campus)) errors.push(`Duplicate campus ID: ${campus}`);
      campusIds.add(campus);
    }
    for (const host of entry.hosts) {
      if (host !== host.toLowerCase() || !/^[a-z0-9.-]+$/.test(host) || hosts.has(host))
        errors.push(`Invalid or duplicate host: ${host}`);
      hosts.add(host);
    }
  }
  return errors;
}

export function universityById(id: string): University | null {
  return manifest.universities.find((entry) => entry.id === id) ?? null;
}

export function isPreviewOrLocalHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "gapwise.test" ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".gapwise.test") ||
    host.endsWith(".localhost")
  );
}

export function siteForHostname(hostname: string): SiteDefinition | null {
  const host = normalizeHostname(hostname);
  const localSuffix = [".gapwise.test", ".localhost"].find((suffix) => host.endsWith(suffix));
  const productionHost = localSuffix ? `${host.slice(0, -localSuffix.length)}.gapwise.ca` : host;
  const explicit = SITES.find((site) => site.hosts.includes(productionHost));
  if (explicit) return explicit;
  const university = manifest.universities.find((entry) => entry.hosts.includes(productionHost));
  if (!university) return globalSite();
  return singleCampusSiteForUniversity(university, productionHost);
}

function singleCampusSiteForUniversity(
  university: University,
  host: string = university.hosts[0]!,
): SiteDefinition {
  return {
    id: `${university.id}-edition`,
    role: "single-campus-edition",
    hosts: [host],
    canonicalHost: university.hosts[0]!,
    universityId: university.id,
    campusId: university.defaultCampus,
    name: university.name,
    shortName: university.shortName,
  };
}

export function activeSite(): SiteDefinition | null {
  if (typeof window === "undefined") return globalSite();
  const host = normalizeHostname(window.location.hostname);
  if (isPreviewOrLocalHost(host)) {
    const params = new URLSearchParams(window.location.search);
    const requestedSite = params.get("site");
    if (requestedSite) return SITES.find((site) => site.id === requestedSite) ?? globalSite();
    const requestedCampus = params.get("campus");
    if (requestedCampus) {
      const campusSite = SITES.find((site) => site.campusId === requestedCampus);
      if (campusSite) return campusSite;
      const campusUniversity = universityByCampus(requestedCampus);
      if (campusUniversity)
        return singleCampusSiteForUniversity(campusUniversity, campusUniversity.hosts[0]);
    }
    const requestedUniversity = params.get("university");
    if (requestedUniversity) {
      const explicit =
        SITES.find(
          (site) =>
            site.universityId === requestedUniversity &&
            (site.role === "university-hub" || site.role === "single-campus-edition"),
        ) ?? null;
      if (explicit) return explicit;
      const university = universityById(requestedUniversity);
      return university ? singleCampusSiteForUniversity(university) : null;
    }
    // Named local subdomains exercise the same registry path as production.
    // Generic localhost and Vercel preview hosts intentionally represent Gapwise globally.
    return host.endsWith(".gapwise.test") || host.endsWith(".localhost")
      ? siteForHostname(host)
      : globalSite();
  }
  return siteForHostname(host);
}

export function universityForHostname(
  hostname: string,
  override?: string | null,
): University | null {
  const host = normalizeHostname(hostname);
  const local =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "gapwise.test" ||
    host.endsWith(".localhost");
  const preview = host.endsWith(".vercel.app");
  if (override && (local || preview)) return universityById(override);
  const site = siteForHostname(host);
  if (!site || site.role === "global" || site.role === "reserved") return null;
  return site.universityId ? universityById(site.universityId) : null;
}

export function activeUniversity(): University | null {
  const site = activeSite();
  if (!site?.universityId || site.role === "global" || site.role === "reserved") return null;
  return universityById(site.universityId);
}

export function campusForHostname(hostname: string, overrideCampus?: string | null): string | null {
  const host = normalizeHostname(hostname);
  const local =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "gapwise.test" ||
    host.endsWith(".localhost");
  const preview = host.endsWith(".vercel.app");
  if (overrideCampus && (local || preview)) return overrideCampus.toLowerCase();
  const site = siteForHostname(host);
  return site?.role === "campus-edition" || site?.role === "single-campus-edition"
    ? (site.campusId ?? null)
    : null;
}

export function activeCampus(): string | null {
  const site = activeSite();
  return site?.role === "campus-edition" || site?.role === "single-campus-edition"
    ? (site.campusId ?? null)
    : null;
}

export function campusesForUniversity(university: University): string[] {
  return university.campuses;
}

export function universityByCampus(campusId: string): University | null {
  const normalized = campusId.toLowerCase();
  return (
    manifest.universities.find(
      (entry) =>
        entry.campuses.some((c) => c.toLowerCase() === normalized) ||
        (entry.id === "laurier" && normalized === "laurier") ||
        (entry.id === "york" && normalized === "york") ||
        (entry.id === "mcmaster" && normalized === "main"),
    ) ?? null
  );
}

export function allCampuses() {
  return manifest.universities.flatMap((uni) =>
    uni.campuses.map((campusId) => ({
      id: campusId,
      universityId: uni.id,
      name:
        campusId === "utm"
          ? "University of Toronto Mississauga"
          : campusId === "utsg"
            ? "University of Toronto St. George"
            : campusId === "utsc"
              ? "University of Toronto Scarborough"
              : uni.name,
      shortName:
        campusId === "utm"
          ? "UTM"
          : campusId === "utsg"
            ? "UTSG"
            : campusId === "utsc"
              ? "UTSC"
              : uni.shortName,
      routable: uni.routableCampuses.includes(campusId),
      defaultForUniversity: uni.defaultCampus === campusId,
      status: uni.status,
    })),
  );
}

export function resolveUniversityAndCampus(
  queryUniversity?: string | null,
  queryCampus?: string | null,
): { university: University; campusId: string } | null {
  if (queryCampus) {
    const uni = universityByCampus(queryCampus);
    if (!uni) return null;
    const normalized = queryCampus.toLowerCase();
    const actualCampus =
      uni.campuses.find((c) => c.toLowerCase() === normalized) ??
      (normalized === "laurier"
        ? "waterloo"
        : normalized === "york"
          ? "keele"
          : normalized === "main"
            ? "mcmaster"
            : uni.defaultCampus);
    return { university: uni, campusId: actualCampus };
  }
  if (queryUniversity) {
    const uni = universityById(queryUniversity.toLowerCase());
    if (!uni) return null;
    return { university: uni, campusId: uni.defaultCampus };
  }
  const defaultUni = universityById("uoft")!;
  return { university: defaultUni, campusId: "utm" };
}

export function supportedUniversities(): University[] {
  return manifest.universities.filter((entry) => entry.status === "supported");
}

export function canonicalUrlForUniversity(uni: University): string {
  return `https://${uni.hosts[0]}`;
}

export function urlForUniversity(uni: University): string {
  if (typeof window === "undefined") return `https://${uni.hosts[0]}`;
  const host = window.location.hostname.toLowerCase();
  const isPreview = isPreviewOrLocalHost(host);
  if (isPreview) {
    const url = new URL(window.location.href);
    url.searchParams.set("university", uni.id);
    return url.toString();
  }
  return `https://${uni.hosts[0]}`;
}
