import manifest from "../../universities.json" with { type: "json" };

export type AvailabilityStatus = "supported" | "partial" | "planned";
export type CapabilityStatus = AvailabilityStatus;

export type UniversityMarketing = {
  campusName: string;
  headline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  stats?: { buildings: number; entrances: number; pathSegments: number };
  example?: {
    day: string;
    courseCode: string;
    buildingCode: string;
    buildingName: string;
    room: string;
    nextCourseCode: string;
    nextBuildingCode: string;
    nextBuildingName: string;
    nextRoom: string;
  };
  searchExamples: string[];
};

export type University = {
  id: string;
  name: string;
  shortName: string;
  accentColor: string;
  campusScope: string;
  country: "Canada" | "United States";
  hosts: string[];
  campuses: string[];
  defaultCampus: string;
  aliases: string[];
  timetableAdapter: string;
  preferredImportMethod?: "file" | "paste";
  acceptedFileTypes?: string;
  fileTypeLabel?: string;
  calendarSource: string;
  calendarInstructions: string;
  calendarHelpUrl: string;
  enabledFeatures: { routing: boolean; liveLocation: boolean };
  routableCampuses: string[];
  dataPaths: string[];
  marketing: UniversityMarketing;
  status: AvailabilityStatus;
};

export type Campus = {
  id: string;
  universityId: string;
  name: string;
  shortName: string;
  campusName: string;
  city: string;
  region: string;
  country: "Canada" | "United States";
  hosts: string[];
  aliases: string[];
  status: AvailabilityStatus;
  capabilities: {
    timetableImport: CapabilityStatus;
    buildingData: CapabilityStatus;
    search: CapabilityStatus;
    routing: CapabilityStatus;
  };
  marketing?: UniversityMarketing;
};

export type SiteRole = "global" | "university-hub" | "campus-edition" | "single-campus-edition";

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
    marketing?: UniversityMarketing;
  };
};

export type UniversityDirectoryEntry = {
  id: string;
  kind: "university" | "campus";
  university: University;
  campus: Campus | null;
  name: string;
  shortName: string;
  scope: string;
  location: string;
  status: AvailabilityStatus;
  href: string;
  host: string;
  searchText: string;
};

export const UNIVERSITIES: readonly University[] = manifest.universities as University[];
export const CAMPUSES: readonly Campus[] = manifest.campuses as Campus[];
export const SITES: readonly SiteDefinition[] = manifest.sites as SiteDefinition[];

function globalSite(): SiteDefinition {
  const site = SITES.find((candidate) => candidate.role === "global");
  if (!site) throw new Error("University registry is missing the global Gapwise site");
  return site;
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/\.$/, "");
}

export function normalizeUniversitySearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function validateUniversityManifest(
  entries: readonly University[] = UNIVERSITIES,
): string[] {
  const errors: string[] = [];
  const universityIds = new Set<string>();
  const universityHosts = new Set<string>();
  const campusIds = new Set<string>();
  const campusHosts = new Set<string>();
  const siteIds = new Set<string>();
  const siteHosts = new Set<string>();
  const validStatus = new Set<AvailabilityStatus>(["supported", "partial", "planned"]);

  for (const campus of CAMPUSES) {
    if (!/^[a-z][a-z0-9-]*$/.test(campus.id) || campusIds.has(campus.id))
      errors.push(`Invalid or duplicate campus ID: ${campus.id}`);
    campusIds.add(campus.id);
    if (!entries.some((entry) => entry.id === campus.universityId))
      errors.push(`${campus.id}: unknown universityId`);
    if (!campus.name.trim() || !campus.city.trim() || !campus.country.trim())
      errors.push(`${campus.id}: campus identity and location are required`);
    if (!validStatus.has(campus.status)) errors.push(`${campus.id}: invalid campus status`);
    for (const capability of Object.values(campus.capabilities)) {
      if (!validStatus.has(capability)) errors.push(`${campus.id}: invalid capability status`);
    }
    for (const host of campus.hosts) {
      if (host !== normalizeHostname(host) || !/^[a-z0-9.-]+$/.test(host) || campusHosts.has(host))
        errors.push(`Invalid or duplicate campus host: ${host}`);
      campusHosts.add(host);
    }
  }

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
    const campus = site.campusId ? CAMPUSES.find((entry) => entry.id === site.campusId) : undefined;
    if (site.universityId && !university) errors.push(`${site.id}: unknown universityId`);
    if (site.campusId && campus?.universityId !== site.universityId)
      errors.push(`${site.id}: campusId must belong to universityId`);
    if ((site.role === "campus-edition" || site.role === "single-campus-edition") && !campus)
      errors.push(`${site.id}: campus editions require a registered campusId`);
  }

  if (SITES.filter((site) => site.role === "global").length !== 1)
    errors.push("Exactly one global site is required");

  for (const entry of entries) {
    if (!/^[a-z][a-z0-9-]*$/.test(entry.id) || universityIds.has(entry.id))
      errors.push(`Invalid or duplicate university ID: ${entry.id}`);
    universityIds.add(entry.id);
    if (!entry.name.trim() || !entry.shortName.trim()) errors.push(`${entry.id}: name is required`);
    if (!validStatus.has(entry.status)) errors.push(`${entry.id}: invalid university status`);
    if (!entry.campuses.length || !entry.campuses.includes(entry.defaultCampus))
      errors.push(`${entry.id}: default campus must be listed`);
    for (const campusId of entry.campuses) {
      if (!CAMPUSES.some((campus) => campus.id === campusId && campus.universityId === entry.id))
        errors.push(`${entry.id}: unknown campus ${campusId}`);
    }
    if (entry.routableCampuses.some((campus) => !entry.campuses.includes(campus)))
      errors.push(`${entry.id}: routable campus must be listed`);
    if (!entry.accentColor?.trim() || !/^#[0-9a-fA-F]{6}$/.test(entry.accentColor))
      errors.push(`${entry.id}: valid hex accentColor is required`);
    if (!entry.campusScope?.trim()) errors.push(`${entry.id}: campusScope is required`);
    if (!entry.marketing?.headline.trim() || !entry.marketing?.description.trim())
      errors.push(`${entry.id}: university marketing copy is required`);
    if (!entry.marketing?.seoTitle.trim() || !entry.marketing?.seoDescription.trim())
      errors.push(`${entry.id}: university SEO metadata is required`);
    if (entry.marketing?.searchExamples.length !== 3)
      errors.push(`${entry.id}: exactly three university search examples are required`);
    const entryCampuses = CAMPUSES.filter((campus) => campus.universityId === entry.id);
    if (entryCampuses.some((campus) => campus.capabilities.timetableImport !== "planned")) {
      if (!entry.timetableAdapter.trim() || entry.timetableAdapter === "planned")
        errors.push(`${entry.id}: timetable-capable editions require a timetable adapter`);
    }
    if (entryCampuses.some((campus) => campus.capabilities.buildingData !== "planned")) {
      if (!entry.dataPaths.length) errors.push(`${entry.id}: data paths are required`);
      if (
        !entry.marketing.stats ||
        entry.marketing.stats.buildings < 1 ||
        entry.marketing.stats.entrances < 1 ||
        entry.marketing.stats.pathSegments < 1
      )
        errors.push(`${entry.id}: positive current coverage statistics are required`);
    }
    for (const host of entry.hosts) {
      if (
        host !== normalizeHostname(host) ||
        !/^[a-z0-9.-]+$/.test(host) ||
        universityHosts.has(host)
      )
        errors.push(`Invalid or duplicate university host: ${host}`);
      universityHosts.add(host);
      if (!SITES.some((site) => site.hosts.includes(host)))
        errors.push(`${entry.id}: host is missing a site definition: ${host}`);
    }
  }
  return errors;
}

export function universityById(id: string): University | null {
  return UNIVERSITIES.find((entry) => entry.id === id.toLowerCase()) ?? null;
}

export function campusById(id: string | null | undefined): Campus | null {
  if (!id) return null;
  return CAMPUSES.find((entry) => entry.id === id.toLowerCase()) ?? null;
}

export function campusForSite(site: SiteDefinition | null): Campus | null {
  return campusById(site?.campusId);
}

export function campusRecordsForUniversity(university: University): Campus[] {
  return university.campuses
    .map((campusId) => campusById(campusId))
    .filter((campus): campus is Campus => Boolean(campus));
}

export function marketingForSite(
  site: SiteDefinition | null,
  university: University | null,
): UniversityMarketing | null {
  return (
    site?.presentation?.marketing ?? campusForSite(site)?.marketing ?? university?.marketing ?? null
  );
}

export function displayNameForSite(
  site: SiteDefinition | null,
  university: University | null,
): string {
  return site?.name ?? campusForSite(site)?.name ?? university?.name ?? "Gapwise";
}

export function canonicalUrlForSite(site: SiteDefinition | null): string {
  return site ? `https://${site.canonicalHost}/` : "https://gapwise.ca/";
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
  if (host === "localhost" || host === "127.0.0.1" || host === "gapwise.test") return globalSite();
  if (host.endsWith(".vercel.app")) return globalSite();
  const localSuffix = [".gapwise.test", ".localhost"].find((suffix) => host.endsWith(suffix));
  const productionHost = localSuffix ? `${host.slice(0, -localSuffix.length)}.gapwise.ca` : host;
  return SITES.find((site) => site.hosts.includes(productionHost)) ?? null;
}

export function activeSite(): SiteDefinition | null {
  if (typeof window === "undefined") return globalSite();
  const host = normalizeHostname(window.location.hostname);
  if (isPreviewOrLocalHost(host)) {
    const params = new URLSearchParams(window.location.search);
    const requestedSite = params.get("site");
    if (requestedSite)
      return requestedSite === "global"
        ? globalSite()
        : (SITES.find((site) => site.id === requestedSite) ?? null);
    const requestedCampus = params.get("campus");
    if (requestedCampus)
      return SITES.find((site) => site.campusId === requestedCampus.toLowerCase()) ?? null;
    const requestedUniversity = params.get("university");
    if (requestedUniversity)
      return (
        SITES.find(
          (site) =>
            site.universityId === requestedUniversity.toLowerCase() &&
            (site.role === "university-hub" || site.role === "single-campus-edition"),
        ) ?? null
      );
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
  if (override && isPreviewOrLocalHost(host)) return universityById(override);
  const site = siteForHostname(host);
  if (!site?.universityId || site.role === "global") return null;
  return universityById(site.universityId);
}

export function activeUniversity(): University | null {
  const site = activeSite();
  if (!site?.universityId || site.role === "global") return null;
  return universityById(site.universityId);
}

export function campusForHostname(hostname: string, overrideCampus?: string | null): string | null {
  const host = normalizeHostname(hostname);
  if (overrideCampus && isPreviewOrLocalHost(host)) return campusById(overrideCampus)?.id ?? null;
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
  const alias =
    normalized === "laurier"
      ? "waterloo"
      : normalized === "york"
        ? "keele"
        : normalized === "main"
          ? "mcmaster"
          : normalized;
  const campus = campusById(alias);
  return campus ? universityById(campus.universityId) : null;
}

export function allCampuses() {
  return CAMPUSES.map((campus) => {
    const university = universityById(campus.universityId)!;
    return {
      id: campus.id,
      universityId: campus.universityId,
      name: campus.name,
      shortName: campus.shortName,
      routable: campus.capabilities.routing === "supported",
      defaultForUniversity: university.defaultCampus === campus.id,
      status: campus.status,
    };
  });
}

export function supportedCampuses() {
  return allCampuses().filter((campus) => campus.status === "supported");
}

export function resolveUniversityAndCampus(
  queryUniversity?: string | null,
  queryCampus?: string | null,
): { university: University; campusId: string } | null {
  if (queryCampus) {
    const campus = campusById(queryCampus);
    const university = campus
      ? universityById(campus.universityId)
      : universityByCampus(queryCampus);
    if (!university) return null;
    return { university, campusId: campus?.id ?? university.defaultCampus };
  }
  if (queryUniversity) {
    const university = universityById(queryUniversity);
    return university ? { university, campusId: university.defaultCampus } : null;
  }
  return { university: universityById("uoft")!, campusId: "utm" };
}

export function supportedUniversities(): University[] {
  return UNIVERSITIES.filter((entry) => entry.status !== "planned");
}

export function plannedUniversities(): University[] {
  return UNIVERSITIES.filter((entry) => entry.status === "planned");
}

export function canonicalUrlForUniversity(university: University): string {
  const site = SITES.find(
    (candidate) =>
      candidate.universityId === university.id &&
      (candidate.role === "university-hub" || candidate.role === "single-campus-edition"),
  );
  return `https://${site?.canonicalHost ?? university.hosts[0]}`;
}

export function canonicalUrlForCampus(campus: Campus): string {
  return `https://${campus.hosts[0]}`;
}

export function universityDirectoryEntries(): UniversityDirectoryEntry[] {
  return UNIVERSITIES.flatMap((university) => {
    const universityEntry: UniversityDirectoryEntry = {
      id: university.id,
      kind: "university",
      university,
      campus: null,
      name: university.name,
      shortName: university.shortName,
      scope: university.campusScope,
      location: university.country,
      status: university.status,
      href: canonicalUrlForUniversity(university),
      host: canonicalUrlForUniversity(university).replace(/^https:\/\//, ""),
      searchText: "",
    };
    const campuses = campusRecordsForUniversity(university);
    universityEntry.searchText = normalizeUniversitySearch(
      [
        university.id,
        university.name,
        university.shortName,
        university.campusScope,
        university.country,
        ...university.aliases,
        ...university.hosts,
        ...campuses.flatMap((campus) => [
          campus.name,
          campus.shortName,
          campus.campusName,
          campus.city,
          campus.region,
          ...campus.aliases,
        ]),
      ].join(" "),
    );
    if (campuses.length <= 1) return [universityEntry];
    return [
      universityEntry,
      ...campuses.map((campus): UniversityDirectoryEntry => ({
        id: campus.id,
        kind: "campus",
        university,
        campus,
        name: campus.name,
        shortName: campus.shortName,
        scope: campus.campusName,
        location: `${campus.city}, ${campus.region}`,
        status: campus.status,
        href: canonicalUrlForCampus(campus),
        host: campus.hosts[0]!,
        searchText: normalizeUniversitySearch(
          [
            campus.id,
            campus.name,
            campus.shortName,
            campus.campusName,
            campus.city,
            campus.region,
            campus.country,
            campus.hosts[0],
            ...campus.aliases,
            university.name,
            university.shortName,
          ].join(" "),
        ),
      })),
    ];
  });
}

export function urlForUniversity(university: University): string {
  if (typeof window === "undefined") return canonicalUrlForUniversity(university);
  if (isPreviewOrLocalHost(window.location.hostname)) {
    const url = new URL(window.location.href);
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("university", university.id);
    return url.toString();
  }
  return canonicalUrlForUniversity(university);
}
