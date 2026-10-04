import {
  normalizeUniversitySearch,
  universityDirectoryEntries,
  type AvailabilityStatus,
  type Campus,
  type University,
  type UniversityDirectoryEntry,
} from "./registry";

export type SearchMatchType =
  | "exact-short"
  | "exact-id"
  | "exact-name"
  | "exact-host"
  | "exact-alias"
  | "exact-campus"
  | "exact-city"
  | "prefix-short"
  | "prefix-name"
  | "prefix-host"
  | "prefix-alias"
  | "prefix-campus"
  | "prefix-city"
  | "word-prefix"
  | "multi-word"
  | "sub-short"
  | "sub-name"
  | "sub-host"
  | "sub-alias"
  | "sub-campus"
  | "sub-city"
  | "fuzzy";

export interface UniversitySearchResult {
  id: string;
  kind: "university" | "campus";
  name: string;
  shortName: string;
  scope: string;
  location: string;
  status: AvailabilityStatus;
  href: string;
  host: string;
  score: number;
  matchType: SearchMatchType;
  university: University;
  campus: Campus | null;
  parentUniversityName?: string | undefined;
  parentUniversityShortName?: string | undefined;
  campusName?: string | undefined;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const charMatch = a[i - 1] === b[j - 1];
      const prevRowVal = row[j - 1]!;
      const currRowVal = row[j]!;
      const val = charMatch ? prevRowVal : Math.min(prevRowVal + 1, prev + 1, currRowVal + 1);
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length]!;
}

interface IndexedUniversityEntry {
  entry: UniversityDirectoryEntry;
  normShort: string;
  compactShort: string;
  normId: string;
  normName: string;
  nameWords: string[];
  normHost: string;
  hostSlug: string;
  normAliases: string[];
  aliasWords: string[];
  normCampusName: string;
  campusNameWords: string[];
  normCity: string;
  cityWords: string[];
}

let cachedIndex: IndexedUniversityEntry[] | null = null;

function getIndexedEntries(): IndexedUniversityEntry[] {
  if (cachedIndex) return cachedIndex;

  const entries = universityDirectoryEntries();
  cachedIndex = entries.map((entry) => {
    const normShort = normalizeUniversitySearch(entry.shortName);
    const compactShort = normShort.replace(/\s+/g, "");
    const normId = normalizeUniversitySearch(entry.id);
    const normName = normalizeUniversitySearch(entry.name);
    const nameWords = normName.split(" ").filter(Boolean);
    const normHost = normalizeUniversitySearch(entry.host);
    const hostSlug = normHost.replace(/\.gapwise\.ca$/, "").replace(/\s+/g, "");

    const rawAliases = [...entry.university.aliases, ...(entry.campus ? entry.campus.aliases : [])];
    const normAliases = Array.from(new Set(rawAliases.map(normalizeUniversitySearch))).filter(
      Boolean,
    );
    const aliasWords = Array.from(new Set(normAliases.flatMap((a) => a.split(" ")))).filter(
      Boolean,
    );

    const normCampusName = entry.campus ? normalizeUniversitySearch(entry.campus.campusName) : "";
    const campusNameWords = normCampusName.split(" ").filter(Boolean);

    const normCity = entry.campus ? normalizeUniversitySearch(entry.campus.city) : "";
    const cityWords = normCity.split(" ").filter(Boolean);

    return {
      entry,
      normShort,
      compactShort,
      normId,
      normName,
      nameWords,
      normHost,
      hostSlug,
      normAliases,
      aliasWords,
      normCampusName,
      campusNameWords,
      normCity,
      cityWords,
    };
  });

  return cachedIndex;
}

function scoreItem(
  item: IndexedUniversityEntry,
  q: string,
  qCompact: string,
  qWords: string[],
): { score: number; matchType: SearchMatchType } | null {
  const {
    normShort,
    compactShort,
    normId,
    normName,
    nameWords,
    normHost,
    hostSlug,
    normAliases,
    aliasWords,
    normCampusName,
    campusNameWords,
    normCity,
    cityWords,
  } = item;

  // 1. Exact matches (0 - 9)
  if (normShort === q || compactShort === qCompact) return { score: 0, matchType: "exact-short" };
  if (normId === q) return { score: 1, matchType: "exact-id" };
  if (normName === q) return { score: 2, matchType: "exact-name" };
  if (normHost === q || hostSlug === qCompact) return { score: 3, matchType: "exact-host" };
  if (normAliases.some((a) => a === q)) return { score: 4, matchType: "exact-alias" };
  if (normCampusName && normCampusName === q) return { score: 5, matchType: "exact-campus" };
  if (normCity && normCity === q) return { score: 6, matchType: "exact-city" };

  // 2. Prefix matches (10 - 29)
  if (normShort.startsWith(q) || compactShort.startsWith(qCompact)) {
    return { score: 10, matchType: "prefix-short" };
  }
  if (normName.startsWith(q)) return { score: 11, matchType: "prefix-name" };
  if (normHost.startsWith(q) || hostSlug.startsWith(qCompact)) {
    return { score: 12, matchType: "prefix-host" };
  }
  if (nameWords.some((w) => w.startsWith(q))) return { score: 14, matchType: "word-prefix" };
  if (normAliases.some((a) => a.startsWith(q) || a.replace(/\s+/g, "").startsWith(qCompact))) {
    return { score: 16, matchType: "prefix-alias" };
  }
  if (
    normCampusName &&
    (normCampusName.startsWith(q) || campusNameWords.some((w) => w.startsWith(q)))
  ) {
    return { score: 18, matchType: "prefix-campus" };
  }
  if (normCity && (normCity.startsWith(q) || cityWords.some((w) => w.startsWith(q)))) {
    return { score: 20, matchType: "prefix-city" };
  }

  // 3. Multi-word / token boundary matches (30 - 39)
  if (qWords.length > 1) {
    const allTokens = [...nameWords, ...aliasWords, ...campusNameWords, ...cityWords];
    if (qWords.every((qw) => allTokens.some((t) => t.startsWith(qw)))) {
      return { score: 30 + Math.min(qWords.length, 5), matchType: "multi-word" };
    }
  }

  // 4. Substring matches on meaningful institution tokens (40 - 49)
  if (normShort.includes(q)) return { score: 40, matchType: "sub-short" };
  if (normName.includes(q)) return { score: 42, matchType: "sub-name" };
  if (normHost.includes(q)) return { score: 44, matchType: "sub-host" };
  if (normAliases.some((a) => a.includes(q))) return { score: 46, matchType: "sub-alias" };
  if (normCampusName && normCampusName.includes(q)) return { score: 48, matchType: "sub-campus" };
  if (normCity && normCity.includes(q)) return { score: 49, matchType: "sub-city" };

  // 5. Sensible fuzzy match (50 - 79) - strictly bounded to prevent unrelated results
  if (qCompact.length >= 4) {
    const maxDist = qCompact.length >= 6 ? 2 : 1;

    if (Math.abs(compactShort.length - qCompact.length) <= maxDist) {
      const d = levenshtein(qCompact, compactShort);
      if (d <= maxDist) return { score: 50 + d, matchType: "fuzzy" };
    }

    for (const w of nameWords) {
      if (w.length >= 4 && Math.abs(w.length - qCompact.length) <= maxDist) {
        const d = levenshtein(qCompact, w);
        if (d <= maxDist) return { score: 55 + d, matchType: "fuzzy" };
      }
    }

    for (const a of normAliases) {
      const aCompact = a.replace(/\s+/g, "");
      if (aCompact.length >= 4 && Math.abs(aCompact.length - qCompact.length) <= maxDist) {
        const d = levenshtein(qCompact, aCompact);
        if (d <= maxDist) return { score: 60 + d, matchType: "fuzzy" };
      }
    }

    if (normCampusName && Math.abs(normCampusName.length - qCompact.length) <= maxDist) {
      const d = levenshtein(qCompact, normCampusName.replace(/\s+/g, ""));
      if (d <= maxDist) return { score: 65 + d, matchType: "fuzzy" };
    }
  }

  return null;
}

export function searchUniversityDestinations(
  query: string,
  options?: {
    limit?: number;
    currentUniversityId?: string | null | undefined;
    allowCurrentUniversity?: boolean;
  },
): UniversitySearchResult[] {
  const q = normalizeUniversitySearch(query);
  const indexed = getIndexedEntries();

  // If query is empty, return canonical universities list
  if (!q) {
    const defaultUniversities = indexed
      .filter((item) => item.entry.kind === "university")
      .map((item): UniversitySearchResult => ({
        id: item.entry.id,
        kind: item.entry.kind,
        name: item.entry.name,
        shortName: item.entry.shortName,
        scope: item.entry.scope,
        location: item.entry.location,
        status: item.entry.status,
        href: item.entry.href,
        host: item.entry.host,
        score: 0,
        matchType: "exact-name",
        university: item.entry.university,
        campus: item.entry.campus,
      }));

    if (options?.limit && options.limit > 0) {
      return defaultUniversities.slice(0, options.limit);
    }
    return defaultUniversities;
  }

  const qCompact = q.replace(/\s+/g, "");
  const qWords = q.split(" ").filter(Boolean);

  const matched: UniversitySearchResult[] = [];

  for (const item of indexed) {
    if (
      !options?.allowCurrentUniversity &&
      options?.currentUniversityId &&
      item.entry.university.id === options.currentUniversityId
    ) {
      continue;
    }

    const scored = scoreItem(item, q, qCompact, qWords);
    if (!scored) continue;

    matched.push({
      id: item.entry.id,
      kind: item.entry.kind,
      name: item.entry.name,
      shortName: item.entry.shortName,
      scope: item.entry.scope,
      location: item.entry.location,
      status: item.entry.status,
      href: item.entry.href,
      host: item.entry.host,
      score: scored.score,
      matchType: scored.matchType,
      university: item.entry.university,
      campus: item.entry.campus,
      parentUniversityName: item.entry.university.name,
      parentUniversityShortName: item.entry.university.shortName,
      campusName: item.entry.campus?.campusName,
    });
  }

  // Sort by score ascending (lowest score is best match)
  matched.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    // Tiebreaker: prioritize universities over campus editions when scores are identical
    if (a.kind !== b.kind) return a.kind === "university" ? -1 : 1;
    // Tiebreaker: prioritize supported over planned
    if (a.status !== b.status) {
      const order: Record<AvailabilityStatus, number> = {
        supported: 0,
        partial: 1,
        planned: 2,
      };
      return order[a.status] - order[b.status];
    }
    return a.name.localeCompare(b.name);
  });

  // Deduplicate entries that point to the exact same href:
  // e.g. "Harvard University" (harvard.gapwise.ca) vs "Harvard University Cambridge Campus" (harvard.gapwise.ca)
  const seenHrefs = new Map<string, UniversitySearchResult>();
  const deduped: UniversitySearchResult[] = [];

  for (const item of matched) {
    const existing = seenHrefs.get(item.href);
    if (!existing) {
      seenHrefs.set(item.href, item);
      deduped.push(item);
    } else {
      // If current item has a strictly better score, replace the existing one
      if (item.score < existing.score) {
        const idx = deduped.indexOf(existing);
        if (idx !== -1) {
          deduped[idx] = item;
          seenHrefs.set(item.href, item);
        }
      }
    }
  }

  if (options?.limit && options.limit > 0) {
    return deduped.slice(0, options.limit);
  }

  return deduped;
}
