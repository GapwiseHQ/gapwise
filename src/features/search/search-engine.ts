import {
  UNIVERSITIES,
  activeCampus as activeHostCampus,
  activeUniversity,
  urlForUniversity,
  type University,
} from "@/universities/registry";
import {
  CAMPUS_SHORT_LABELS,
  campusBuildingConfigurations,
  type GapwiseCampusId,
} from "@/data/campuses";
import { UTM_BUILDINGS, type BuildingConfiguration } from "@/data/utm/building-registry";
import type { Meeting } from "@/lib/timetable-types";

export type SearchCategory = "buildings" | "courses" | "actions" | "universities";

export type SearchResultItem = {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string | undefined;
  badge?: string | undefined;
  iconName?: string | undefined;
  score: number;
  data: {
    buildingCode?: string | null | undefined;
    campusId?: GapwiseCampusId | null | undefined;
    room?: string | null | undefined;
    floor?: string | null | undefined;
    meetingId?: string | undefined;
    universityId?: string | undefined;
    actionId?: string | undefined;
    url?: string | undefined;
  };
};

export type SearchIndexContext = {
  campusId?: GapwiseCampusId | null | undefined;
  meetings?: Meeting[] | undefined;
};

function searchCampus(context: SearchIndexContext): GapwiseCampusId | null {
  if (context.campusId !== undefined) return context.campusId;
  const hostCampus = activeHostCampus();
  if (hostCampus) return hostCampus;
  const university = activeUniversity();
  return university?.campuses.length === 1
    ? ((university.campuses[0] as GapwiseCampusId | undefined) ?? null)
    : null;
}

// University aliases & common search terms
const UNIVERSITY_ALIASES: Record<string, string[]> = {
  uoft: ["University of Toronto", "UofT", "UTM", "UTSG", "UTSC", "Toronto"],
  carleton: ["Carleton", "CU", "Ravens", "Ottawa"],
  tmu: ["TMU", "Toronto Metropolitan", "Ryerson", "RU", "Bold"],
  queens: ["Queen's", "Queens", "QU", "Kingston", "Gaels"],
  laurier: ["Laurier", "WLU", "Wilfrid Laurier", "Golden Hawks", "Waterloo"],
  york: ["York", "YU", "Lions", "Keele", "Toronto"],
  mcmaster: ["McMaster", "Mac", "Marauders", "Hamilton"],
  western: ["Western", "UWO", "Western University", "Mustangs", "London"],
  guelph: ["Guelph", "UofG", "Gryphons"],
  uottawa: ["uOttawa", "University of Ottawa", "Gee-Gees", "Ottawa"],
  brock: ["Brock", "Badgers", "St. Catharines", "Niagara"],
  ubc: ["UBC", "University of British Columbia", "Point Grey", "Vancouver"],
  waterloo: ["Waterloo", "University of Waterloo", "UW", "UWaterloo", "Warriors"],
  mcgill: ["McGill", "McGill University", "Montreal", "Montréal", "Downtown"],
};

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(text: string): string {
  return normalize(text).replace(/\s+/g, "");
}

// Simple Levenshtein distance for fuzzy matching typos
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const charMatch = a[i - 1] === b[j - 1];
      const prevRowVal = row[j - 1] ?? 0;
      const currRowVal = row[j] ?? 0;
      const val = charMatch ? prevRowVal : Math.min(prevRowVal + 1, prev + 1, currRowVal + 1);
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length] ?? 0;
}

function scoreMatch(query: string, candidate: string, isCode = false): number | null {
  const normQuery = normalize(query);
  const compQuery = compact(query);
  const normCandidate = normalize(candidate);
  const compCandidate = compact(candidate);

  if (!normQuery || !normCandidate) return null;

  // Exact matches
  if (compCandidate === compQuery) return isCode ? 0 : 5;
  if (normCandidate === normQuery) return isCode ? 1 : 6;

  // Prefix matches
  if (compCandidate.startsWith(compQuery)) return isCode ? 10 : 20;
  if (normCandidate.startsWith(normQuery)) return isCode ? 12 : 22;

  // Word-boundary matches
  const queryWords = normQuery.split(" ");
  const candidateWords = normCandidate.split(" ");
  if (queryWords.every((qw) => candidateWords.some((cw) => cw.startsWith(qw)))) {
    return 30 + candidateWords.length;
  }

  // Substring match
  if (normCandidate.includes(normQuery)) {
    return 40;
  }

  // Fuzzy match for words of length >= 4 with distance <= 2 against whole or individual candidate words
  if (compQuery.length >= 4 && Math.abs(compCandidate.length - compQuery.length) <= 2) {
    const dist = levenshtein(compQuery, compCandidate);
    if (dist <= 2) return 50 + dist;
  }

  for (const cw of candidateWords) {
    const compW = compact(cw);
    if (compQuery.length >= 4 && Math.abs(compW.length - compQuery.length) <= 2) {
      const dist = levenshtein(compQuery, compW);
      if (dist <= 2) return 50 + dist;
    }
  }

  return null;
}

export function searchGapwise(query: string, context: SearchIndexContext = {}): SearchResultItem[] {
  const q = query.trim();
  if (!q) {
    return getInitialSuggestions(context);
  }

  const results: SearchResultItem[] = [];
  const currentUni = activeUniversity();
  const activeCampus = searchCampus(context);

  // 1. Current campus buildings
  const buildings: readonly BuildingConfiguration[] =
    activeCampus === "utm"
      ? UTM_BUILDINGS
      : activeCampus
        ? campusBuildingConfigurations(activeCampus)
        : [];

  // Check if query looks like a building + room (e.g. "MN 3120", "DH 2020", "SLC 101")
  const roomPattern = /^([A-Z]{2,6})\s*([A-Z0-9-]{1,6})$/i;
  const roomMatch = q.match(roomPattern);
  const queriedBuildingCode = roomMatch && roomMatch[1] ? roomMatch[1].toUpperCase() : null;
  const queriedRoom = roomMatch && roomMatch[2] ? roomMatch[2].toUpperCase() : null;

  for (const b of buildings) {
    let bestScore: number | null = null;

    if (queriedBuildingCode && b.code.toUpperCase() === queriedBuildingCode) {
      bestScore = 0; // Direct building + room hit
    } else {
      // Score against code
      const codeScore = scoreMatch(q, b.code, true);
      if (codeScore !== null) bestScore = codeScore;

      // Score against name
      const nameScore = scoreMatch(q, b.name, false);
      if (nameScore !== null && (bestScore === null || nameScore < bestScore)) {
        bestScore = nameScore;
      }

      // Score against aliases
      const candidateAliases = [...(b.aliases ?? [])];
      if (b.code === "HM") {
        candidateAliases.push("LIBRARY", "UTM LIBRARY");
      }
      for (const alias of candidateAliases) {
        const aliasScore = scoreMatch(q, alias, false);
        if (aliasScore !== null && (bestScore === null || aliasScore < bestScore)) {
          bestScore = aliasScore;
        }
      }
    }

    if (bestScore !== null) {
      const room = queriedRoom ?? null;
      const floor = room?.match(/^[A-Z]?(\d)/)?.[1] ?? null;
      const campusLabel = activeCampus ? (CAMPUS_SHORT_LABELS[activeCampus] ?? "Campus") : "Campus";
      results.push({
        id: `building-${b.code}`,
        category: "buildings",
        title: `${b.code} — ${b.name}`,
        subtitle: room
          ? `Room ${room}${floor ? ` (Floor ${floor})` : ""} · ${campusLabel}`
          : `${campusLabel} building`,
        badge: b.code,
        score: bestScore,
        data: {
          buildingCode: b.code,
          campusId: activeCampus,
          room,
          floor,
        },
      });
    }
  }

  // 2. Timetable courses/classes (if provided)
  if (context.meetings && context.meetings.length > 0) {
    const seenCourses = new Set<string>();
    for (const meeting of context.meetings) {
      if (seenCourses.has(meeting.courseCode)) continue;

      let courseScore = scoreMatch(q, meeting.courseCode, true);
      if (meeting.courseName) {
        const titleScore = scoreMatch(q, meeting.courseName, false);
        if (titleScore !== null && (courseScore === null || titleScore < courseScore)) {
          courseScore = titleScore;
        }
      }

      if (courseScore !== null) {
        seenCourses.add(meeting.courseCode);
        results.push({
          id: `course-${meeting.courseCode}`,
          category: "courses",
          title: meeting.courseCode,
          subtitle: meeting.courseName ?? meeting.sourceLocation ?? "Enrolled course",
          badge: meeting.activityType ?? "Class",
          score: courseScore,
          data: {
            meetingId: meeting.id,
            buildingCode: meeting.buildingCode,
            room: meeting.room,
          },
        });
      }
    }
  }

  // 3. Application Actions
  const actions = [
    {
      id: "action-today",
      title: "Today",
      subtitle: "View current class, leave-by times, and daily schedule",
      keywords: ["today", "now", "next", "class", "leave by", "clock"],
      actionId: "today",
      url: "/today",
    },
    {
      id: "action-timetable",
      title: "Weekly Timetable",
      subtitle: "View complete weekly schedule grid and lectures",
      keywords: ["timetable", "schedule", "week", "classes", "calendar", "grid"],
      actionId: "timetable",
      url: "/timetable",
    },
    {
      id: "action-gaps",
      title: "Gap Plan",
      subtitle: "Plan study time, library visits, and breaks between classes",
      keywords: ["gap", "gaps", "plan", "study", "break", "free time", "library"],
      actionId: "gaps",
      url: "/gaps",
    },
    {
      id: "action-route",
      title: "Campus Map & Day Route",
      subtitle: "Walkway routes, entrance navigation, and building explorer",
      keywords: ["map", "route", "day route", "campus", "walk", "directions", "entrance"],
      actionId: "route",
      url: "/route",
    },
    {
      id: "action-import",
      title: "Import Timetable",
      subtitle: `Upload or paste class schedule (${currentUni?.calendarSource ?? "Calendar"})`,
      keywords: ["import", "upload", "paste", "add schedule", "ics", "acorn", "ramss", "solus"],
      actionId: "import",
    },
    {
      id: "action-settings",
      title: "Settings & Preferences",
      subtitle: "Walking speed, arrival points, theme, and private cloud keys",
      keywords: ["settings", "preferences", "dark mode", "light mode", "speed", "cloud", "account"],
      actionId: "settings",
      url: "/settings",
    },
    {
      id: "action-docs",
      title: "Developer Platform & API",
      subtitle: "Open public documentation and API specs",
      keywords: ["api", "developer", "sdk", "cli", "docs", "specs"],
      actionId: "docs",
      url: "/developers",
    },
    {
      id: "action-privacy",
      title: "Privacy & Zero-PII Policy",
      subtitle: "Inspect local-first cryptographic security and data protections",
      keywords: ["privacy", "security", "encryption", "pii", "trust", "terms"],
      actionId: "privacy",
      url: "/privacy",
    },
  ];

  for (const action of actions) {
    let best = scoreMatch(q, action.title);
    for (const kw of action.keywords) {
      const s = scoreMatch(q, kw);
      if (s !== null && (best === null || s < best)) best = s;
    }
    if (best !== null) {
      results.push({
        id: action.id,
        category: "actions",
        title: action.title,
        subtitle: action.subtitle,
        badge: "Action",
        score: best + 15, // slight bias towards physical entities
        data: {
          actionId: action.actionId,
          url: action.url,
        },
      });
    }
  }

  // 4. Other Universities
  for (const uni of UNIVERSITIES) {
    if (uni.id === currentUni?.id) continue; // Don't show current university in switch list

    let bestScore = scoreMatch(q, uni.name);
    const shortScore = scoreMatch(q, uni.shortName, true);
    if (shortScore !== null && (bestScore === null || shortScore < bestScore)) {
      bestScore = shortScore;
    }

    const aliases = [...(UNIVERSITY_ALIASES[uni.id] ?? []), ...uni.aliases, ...uni.hosts];
    for (const alias of aliases) {
      const as = scoreMatch(q, alias);
      if (as !== null && (bestScore === null || as < bestScore)) {
        bestScore = as;
      }
    }

    if (bestScore !== null) {
      results.push({
        id: `uni-${uni.id}`,
        category: "universities",
        title: `Switch to ${uni.name}`,
        subtitle: `${uni.shortName} · ${uni.campusScope}`,
        badge: uni.shortName,
        score: bestScore + 20,
        data: {
          universityId: uni.id,
          url: urlForUniversity(uni),
        },
      });
    }
  }

  // Sort by score ascending (lowest score is highest match quality)
  results.sort((a, b) => a.score - b.score);
  return results.slice(0, 20);
}

function getInitialSuggestions(context: SearchIndexContext): SearchResultItem[] {
  const currentUni = activeUniversity();
  const activeCampus = searchCampus(context);
  const suggestions: SearchResultItem[] = [];

  // Suggest Day Route
  suggestions.push({
    id: "action-route",
    category: "actions",
    title: "Campus Map & Day Route",
    subtitle: activeCampus
      ? `Explore ${CAMPUS_SHORT_LABELS[activeCampus] ?? "campus"} buildings, walkways, and entrances`
      : "Choose a campus, then explore buildings, walkways, and entrances",
    badge: "Map",
    score: 1,
    data: { actionId: "route", url: "/route" },
  });

  // Suggest Timetable
  suggestions.push({
    id: "action-timetable",
    category: "actions",
    title: "Weekly Timetable",
    subtitle: "View classes, room locations, and weekly schedule",
    badge: "View",
    score: 2,
    data: { actionId: "timetable", url: "/timetable" },
  });

  // Suggest Gap Plan
  suggestions.push({
    id: "action-gaps",
    category: "actions",
    title: "Gap Plan",
    subtitle: "Find ideal study spaces and breaks between lectures",
    badge: "Plan",
    score: 3,
    data: { actionId: "gaps", url: "/gaps" },
  });

  // If meetings exist, suggest first 2 upcoming courses
  if (context.meetings && context.meetings.length > 0) {
    const seen = new Set<string>();
    for (const m of context.meetings) {
      if (seen.size >= 2) break;
      if (!seen.has(m.courseCode)) {
        seen.add(m.courseCode);
        suggestions.push({
          id: `course-${m.courseCode}`,
          category: "courses",
          title: m.courseCode,
          subtitle: m.courseName ?? m.sourceLocation ?? "Enrolled course",
          badge: m.activityType ?? "Class",
          score: 4,
          data: {
            meetingId: m.id,
            buildingCode: m.buildingCode,
          },
        });
      }
    }
  }

  return suggestions;
}
