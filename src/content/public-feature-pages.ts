import universities from "../../universities.json" with { type: "json" };

const supportedUniversityCount = universities.universities.length;
const supportedCampusCount = universities.universities.reduce(
  (count, university) => count + university.campuses.length,
  0,
);

export type PublicFeatureSection = {
  title: string;
  body: string;
  bullets?: readonly string[];
};

export type PublicFeaturePage = {
  path: string;
  eyebrow: string;
  title: string;
  seoTitle: string;
  description: string;
  lead: string;
  sections: readonly PublicFeatureSection[];
};

export const PUBLIC_FEATURE_PAGES = {
  about: {
    path: "/about",
    eyebrow: "About Gapwise",
    title: "A campus planner built around the time between classes.",
    seoTitle: "About Gapwise — Multi-University Student Planning",
    description:
      "See how Gapwise connects university timetables, gap planning, and source-backed campus context in one focused student-built product across Canada.",
    lead: "Gapwise is built for the part of university life a timetable leaves blank: what to do next, how much time you actually have, and where you need to go.",
    sections: [
      {
        title: "One day, one system",
        body: "Your timetable, gaps, buildings, routes, and academic work stay connected instead of living in separate tools.",
        bullets: [
          "Timetable import across supported universities",
          "Gap budgets between classes",
          "Source-backed campus building maps",
          "Academic work planning",
        ],
      },
      {
        title: "Built around useful time",
        body: "Gapwise turns the space between commitments into something you can act on, with travel time and the next class already part of the calculation.",
      },
      {
        title: "Made for multiple universities",
        body: "Timetable identity and source-backed building maps are supported for all thirteen universities. Pedestrian routing, verified entrances, and campus places vary by campus and are shown only where supported.",
      },
    ],
  },
  universities: {
    path: "/universities",
    eyebrow: "University editions",
    title: "One Gapwise, built around each supported campus.",
    seoTitle: "Supported Canadian Universities — Gapwise",
    description: `Explore all ${supportedUniversityCount} Canadian university editions and ${supportedCampusCount} campus models supported by Gapwise for timetable planning, campus search, and navigation.`,
    lead: "Each edition combines a university-specific timetable workflow with its own source-backed campus model while sharing one privacy-first Gapwise application.",
    sections: [
      {
        title: `${supportedUniversityCount} university editions`,
        body: `Gapwise currently supports ${universities.universities.map((university) => university.name).join(", ")}.`,
      },
      {
        title: `${supportedCampusCount} campus models`,
        body: "U of T has distinct Mississauga, St. George, and Scarborough models. Every other supported edition selects its own campus data, search index, timetable adapter, and pedestrian graph.",
      },
      {
        title: "Honest campus evidence",
        body: "Building, entrance, route, and accessibility records retain source provenance and uncertainty. Unknown facts remain unknown instead of being presented as verified.",
      },
    ],
  },
  openSource: {
    path: "/open-source",
    eyebrow: "Free and open source",
    title: "Open campus software, with clear ownership of facts.",
    seoTitle: "Open Source University Planning — Gapwise",
    description:
      "Learn how Gapwise publishes its university timetable, campus navigation, data, API, SDK, mobile, AI, documentation, and status projects as open source.",
    lead: "Gapwise is free to use and developed in public. Its repositories separate product behavior, canonical campus evidence, developer contracts, mobile clients, AI permissions, and operational status.",
    sections: [
      {
        title: "Code developed in public",
        body: "The GapwiseHQ organization publishes the web application, canonical campus data, developer documentation, CLI, native client foundations, AI integration, and status service.",
      },
      {
        title: "Data with provenance",
        body: "Campus facts retain source identity, licensing, inference state, and uncertainty so downstream tools can distinguish evidence from a routing connector or approximation.",
      },
      {
        title: "Privacy-first architecture",
        body: "Timetable imports are parsed locally in the browser, guest mode remains first-class, and private sync is optional and browser-encrypted before storage.",
      },
    ],
  },
  timetable: {
    path: "/utm-timetable",
    eyebrow: "UTM timetable",
    title: "Turn an ACORN export into a timetable that understands your day.",
    seoTitle: "UTM Timetable Planner — Gapwise",
    description:
      "Import a University of Toronto ACORN .ics calendar into Gapwise and get a UTM timetable connected to gaps, buildings, and campus routes.",
    lead: "Gapwise turns the calendar file ACORN already gives you into a weekly timetable that can power Today, Gap Plan, and campus navigation.",
    sections: [
      {
        title: "More than class blocks",
        body: "Course components, rooms, building codes, terms, weekends, and recurring dates stay connected so the same schedule can drive the rest of Gapwise.",
      },
      {
        title: "Update from ACORN",
        body: "When your schedule changes, import a fresh ACORN export and Gapwise rebuilds the weekly view around the new timetable.",
      },
      {
        title: "Academic work alongside class",
        body: "Plan coursework and study blocks without turning the timetable into a general-purpose calendar. The focus stays on the academic day.",
      },
    ],
  },
  map: {
    path: "/campus-map",
    eyebrow: "Campus map",
    title: "Explore campus with a map built around your day.",
    seoTitle: "University Campus Map — Gapwise",
    description:
      "Explore source-backed campus building maps across supported Canadian universities, with pedestrian routes and schedule context where supported.",
    lead: "The Gapwise campus explorer connects campus buildings and schedule context. Entrance, place, and pedestrian-route coverage varies by campus.",
    sections: [
      {
        title: "Explore without setup",
        body: "Open the campus explorer, choose your campus, and search source-backed buildings even before you import a timetable.",
      },
      {
        title: "Buildings and routes connected",
        body: "Canonical building identities across all supported campuses feed the same model used by Today and Gap Plan. Pedestrian routing is available on supported campuses.",
      },
      {
        title: "Made for the next move",
        body: "Map context is designed to answer practical questions: where the next class is, what route connects two buildings, and how the move fits into the day.",
      },
    ],
  },
  gaps: {
    path: "/gap-planner",
    eyebrow: "Gap planner",
    title: "A two-hour gap is not always two hours of usable time.",
    seoTitle: "University Gap Planner — Gapwise",
    description:
      "See usable time between university classes after supported travel, transition buffers, setup, pack-up, meals, and campus context with Gapwise.",
    lead: "Gap Plan turns the empty space between classes into a practical time budget, with the next commitment already accounted for.",
    sections: [
      {
        title: "Raw gap versus usable time",
        body: "Route time, transition buffers, setup and pack-up preferences, and meal targets can all change how much of a gap is actually free.",
      },
      {
        title: "Recommendations that fit",
        body: "Gapwise turns the available window into focused options such as a meal, study block, reset, or longer work session.",
      },
      {
        title: "Inspect the exact interval",
        body: "Click a highlighted gap in the timetable and Gap Plan opens directly on that window, keeping the weekly view and detailed plan connected.",
      },
    ],
  },
  routing: {
    path: "/campus-routing",
    eyebrow: "Campus routing",
    title: "Know the move before the next class.",
    seoTitle: "University Campus Routing — Gapwise",
    description:
      "Plan routes between supported campus buildings with travel time, distance, accessibility options, and timetable context in Gapwise.",
    lead: "Gapwise connects campus movement to the schedule so a route is not just a line on a map: it is part of the time budget before the next commitment.",
    sections: [
      {
        title: "Route time in context",
        body: "Travel time feeds directly into gap budgets and leave-by guidance, so movement across campus is reflected in the planner.",
      },
      {
        title: "Accessibility options",
        body: "Use supported step-free route options when planning movement between mapped campus locations.",
      },
      {
        title: "One campus model",
        body: "The same campus building and route data powers the map, timetable context, Today view, and Gap Plan where routing is supported.",
      },
    ],
  },
  acorn: {
    path: "/acorn-import",
    eyebrow: "ACORN import",
    title: "Get your U of T timetable into Gapwise in a few clicks.",
    seoTitle: "Import an ACORN Timetable into Gapwise",
    description:
      "Export your University of Toronto ACORN timetable as an .ics calendar and turn it into a Gapwise weekly schedule.",
    lead: "Export the calendar file from ACORN, choose it in Gapwise, and your weekly timetable is ready for gaps, routes, and day planning.",
    sections: [
      {
        title: "1. Export from ACORN",
        body: "Use ACORN's calendar export to download the .ics file for your current schedule.",
      },
      {
        title: "2. Import into Gapwise",
        body: "Choose the file and Gapwise builds your weekly timetable with terms, meetings, rooms, and course components.",
      },
      {
        title: "3. Keep it current",
        body: "If your ACORN schedule changes, import a fresh export and Gapwise updates the timetable around it.",
      },
    ],
  },
} as const satisfies Record<string, PublicFeaturePage>;

/** Keep client-side head tags and generated edition pages in sync. */
export function editionFeatureMetadata(page: PublicFeaturePage, universityName: string) {
  switch (page.path) {
    case "/about":
      return {
        seoTitle: `About Gapwise — ${universityName}`,
        description: `See how Gapwise connects ${universityName} timetables, gap planning, and source-backed campus context in one focused student-built product.`,
      };
    case "/campus-map":
      return {
        seoTitle: `${universityName} Campus Map — Gapwise`,
        description: `Explore source-backed campus building maps for ${universityName} — with schedule context and pedestrian routing where supported.`,
      };
    case "/gap-planner":
      return {
        seoTitle: `${universityName} Gap Planner — Gapwise`,
        description: `See usable time between ${universityName} classes after supported travel, transition buffers, setup, pack-up, meals, and campus context with Gapwise.`,
      };
    case "/campus-routing":
      return {
        seoTitle: `${universityName} Campus Routing — Gapwise`,
        description: `Plan routes between supported ${universityName} campus buildings with travel time, distance, and timetable context in Gapwise.`,
      };
    default:
      return { seoTitle: page.seoTitle, description: page.description };
  }
}
