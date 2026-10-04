import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  ChevronRight,
  Code2,
  GitBranch,
  MapPin,
  Navigation,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import {
  CAMPUSES,
  supportedUniversities,
  universityDirectoryEntries,
} from "@/universities/registry";
import { searchUniversityDestinations, type UniversitySearchResult } from "@/universities/search";
import "./global-marketing-home.css";

const FEATURED_UNIVERSITY_IDS = ["uoft", "waterloo", "mcgill", "ubc", "mcmaster", "queens"];

const SUPPORTED_UNIVERSITIES = supportedUniversities();
const IMPLEMENTED_CAMPUS_COUNT = CAMPUSES.filter((campus) => campus.status === "supported").length;

const ALL_DESTINATIONS = universityDirectoryEntries();
const UNIVERSITY_DESTINATIONS = ALL_DESTINATIONS.filter((entry) => entry.kind === "university");

const exampleWeek = [
  { day: "MON", course: "CSC108H5", room: "MN 1210", time: "09:00", offset: "12%" },
  { day: "TUE", course: "MAT102H5", room: "DH 2020", time: "12:00", offset: "47%" },
  { day: "WED", course: "CSC108H5", room: "MN 1210", time: "09:00", offset: "12%" },
  { day: "THU", course: "MAT102H5", room: "DH 2020", time: "12:00", offset: "47%" },
  { day: "FRI", course: "", room: "", time: "", offset: "0" },
] as const;

const ecosystemProducts = [
  {
    id: "ai",
    title: "Gapwise AI",
    label: "AI",
    copy: "Permissioned campus intelligence and Model Context Protocol tools for assistants.",
    href: "https://ai.gapwise.ca",
    cta: "Open Gapwise AI",
    accent: "#a78bfa",
    icon: Sparkles,
    internal: false,
  },
  {
    id: "docs",
    title: "Gapwise Docs",
    label: "Docs",
    copy: "Guides, API references, SDK documentation, and integration details.",
    href: "https://docs.gapwise.ca",
    cta: "Open docs",
    accent: "#38bdf8",
    icon: BookOpen,
    internal: false,
  },
  {
    id: "data",
    title: "Gapwise Data",
    label: "Data",
    copy: "Open campus datasets, schemas, and source-backed navigation data.",
    href: "https://data.gapwise.ca",
    cta: "Explore data",
    accent: "#ff5a66",
    icon: Braces,
    internal: false,
  },
  {
    id: "status",
    title: "Gapwise Status",
    label: "Status",
    copy: "Public service health, uptime probes, and operational incident history.",
    href: "https://status.gapwise.ca",
    cta: "Open status",
    accent: "#39cf97",
    icon: Activity,
    internal: false,
  },
  {
    id: "developers",
    title: "Gapwise Developers",
    label: "Developers",
    copy: "Public API, SDKs, CLI tooling, and contracts for building on Gapwise.",
    href: "/developers",
    cta: "Developer platform",
    accent: "#4ea7fe",
    icon: Code2,
    internal: true,
  },
] as const;

function BrandMark({ className = "" }: { className?: string }) {
  return <img src="/logo-mark.svg" alt="" aria-hidden="true" className={className} />;
}

function ProductPreview() {
  return (
    <div className="global-home-window" aria-label="Example Gapwise student day">
      <div className="global-home-window-bar">
        <div className="global-home-window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span>Tuesday · UTM example</span>
        <span className="global-home-window-campus">Mississauga</span>
      </div>

      <div className="global-home-window-grid">
        <aside className="global-home-window-sidebar" aria-hidden="true">
          <div className="global-home-window-search">
            <Search />
            <span>Search UTM</span>
          </div>
          <p>Your day</p>
          <div className="global-home-window-nav-item is-active">Schedule</div>
          <div className="global-home-window-nav-item">Between classes</div>
          <div className="global-home-window-nav-item">Saved places</div>
        </aside>

        <div className="global-home-window-day">
          <div className="global-home-window-day-header">
            <div>
              <span>Today</span>
              <strong>Your afternoon</strong>
            </div>
            <small>2 classes · 1 useful gap</small>
          </div>

          <div className="global-home-timeline">
            <article>
              <i aria-hidden="true" />
              <div>
                <strong>CSC108H5 · Lecture</strong>
                <span>Maanjiwe nendamowinan · MN 1270</span>
              </div>
              <time>11:00–12:00</time>
            </article>

            <article className="is-gap">
              <i aria-hidden="true" />
              <div>
                <strong>2 hour gap</strong>
                <span>1h 38m available after walking</span>
              </div>
              <ArrowRight aria-hidden="true" />
            </article>

            <article>
              <i aria-hidden="true" />
              <div>
                <strong>MAT102H5 · Lecture</strong>
                <span>Deerfield Hall · DH 2020</span>
              </div>
              <time>14:00–15:00</time>
            </article>
          </div>
        </div>

        <aside className="global-home-window-route">
          <div className="global-home-route-title">
            <span>MN → DH</span>
            <Navigation aria-hidden="true" />
          </div>
          <div className="global-home-map" aria-hidden="true">
            <span className="global-home-map-building global-home-map-building-a" />
            <span className="global-home-map-building global-home-map-building-b" />
            <span className="global-home-map-path" />
            <span className="global-home-map-start" />
            <MapPin className="global-home-map-pin" />
          </div>
          <div className="global-home-route-metric">
            <div>
              <strong>7 min</strong>
              <span>Walk to next class</span>
            </div>
            <em>On time</em>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function GlobalMarketingHome() {
  const [query, setQuery] = useState("");

  const visibleDestinations = useMemo(() => {
    if (query.trim()) {
      return searchUniversityDestinations(query);
    }
    const featured = FEATURED_UNIVERSITY_IDS.map((id) =>
      UNIVERSITY_DESTINATIONS.find((destination) => destination.id === id),
    ).filter((destination): destination is (typeof UNIVERSITY_DESTINATIONS)[number] =>
      Boolean(destination),
    );
    return featured.length ? featured : UNIVERSITY_DESTINATIONS.slice(0, 6);
  }, [query]);

  return (
    <div className="global-home">
      <section className="global-home-hero" aria-labelledby="global-home-title">
        <div className="global-home-grid-lines" aria-hidden="true" />
        <div className="global-home-hero-inner">
          <p className="global-home-kicker">
            <span aria-hidden="true" />
            Free, open source, built for students
          </p>
          <h1 id="global-home-title">
            Make every gap on campus <span>count.</span>
          </h1>
          <p className="global-home-hero-copy">
            Gapwise connects your timetable, the time between classes, and campus movement in one
            thoughtful place.
          </p>
          <div className="global-home-hero-actions">
            <a className="global-home-primary" href="#universities">
              Choose your university <ArrowRight aria-hidden="true" />
            </a>
            <a className="global-home-secondary" href="#platform">
              Explore the platform
            </a>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="global-home-facts" aria-label="Gapwise platform facts">
        <div>
          <strong>{SUPPORTED_UNIVERSITIES.length}</strong>
          <span>universities with timetable import</span>
        </div>
        <div>
          <strong>{IMPLEMENTED_CAMPUS_COUNT}</strong>
          <span>implemented campuses</span>
        </div>
        <div>
          <strong>Free</strong>
          <span>and open source</span>
        </div>
        <div>
          <strong>Built</strong>
          <span>for students</span>
        </div>
      </section>

      <section id="platform" className="global-home-platform">
        <div className="global-home-feature-row">
          <div className="global-home-feature-copy">
            <p className="global-home-eyebrow">01 · Timetable</p>
            <h2>Your schedule, without the setup.</h2>
            <p>
              Bring in your class schedule and see the shape of your day immediately: classes,
              rooms, travel, and the open time between them.
            </p>
          </div>
          <div className="global-home-week" aria-label="Example weekly timetable">
            <div className="global-home-week-header">
              <strong>Week view</strong>
              <span>Example · UTM</span>
            </div>
            <div className="global-home-week-days">
              {exampleWeek.map((item, index) => (
                <div key={item.day} className={index === 1 ? "is-current" : undefined}>
                  <span>{item.day}</span>
                  {item.course ? (
                    <article
                      className="event"
                      style={{ "--event-offset": item.offset } as CSSProperties}
                    >
                      <strong>{item.course}</strong>
                      <small>{item.room}</small>
                      <time>{item.time}</time>
                    </article>
                  ) : (
                    <em>Open day</em>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="global-home-feature-row is-reversed">
          <div
            className="global-home-feature-visual global-home-route-visual"
            aria-label="Example Gapwise plan from class through a two hour gap to the next class"
          >
            <div className="global-home-gap-flow">
              <div>
                <span>Class</span>
                <strong>CSC108H5</strong>
                <small>MN 1270 · ends 11:00</small>
              </div>
              <ArrowRight aria-hidden="true" />
              <div className="is-gap">
                <span>Gap</span>
                <strong>2 hours</strong>
                <small>1h 38m usable</small>
              </div>
              <ArrowRight aria-hidden="true" />
              <div>
                <span>Destination</span>
                <strong>UTM Library</strong>
                <small>Quiet study · HM</small>
              </div>
              <ArrowRight aria-hidden="true" />
              <div>
                <span>Next class</span>
                <strong>MAT102H5</strong>
                <small>DH 2020 · starts 13:00</small>
              </div>
            </div>
            <div className="global-home-route-summary">
              <p>Leave by</p>
              <strong>12:48</strong>
              <span>7 min walk + 5 min buffer</span>
              <em>On time</em>
            </div>
          </div>
          <div className="global-home-feature-copy">
            <p className="global-home-eyebrow">02 · Between classes</p>
            <h2>The gap is part of the plan.</h2>
            <p>
              Gapwise combines schedule context and campus routing so the time between classes is
              useful instead of uncertain.
            </p>
            <a className="global-home-text-link" href="#universities">
              See campus coverage <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="global-home-feature-row">
          <div className="global-home-feature-copy">
            <p className="global-home-eyebrow">03 · Search & context</p>
            <h2>Campus answers, in context.</h2>
            <p>
              Search buildings, rooms, services, and places through the lens of your schedule, with
              source-backed campus context where available.
            </p>
          </div>
          <div className="global-home-search-demo">
            <div className="global-home-search-field">
              <Search aria-hidden="true" />
              <span>quiet study near my next class</span>
              <kbd>⌘K</kbd>
            </div>
            <p className="global-home-search-context">
              UTM · next class in Deerfield Hall at 13:00
            </p>
            {[
              [
                "Hazel McCallion Academic Learning Centre",
                "Library · HM · route available",
                "Study",
              ],
              ["Deerfield Hall", "Building · next class in DH 2020", "Next class"],
              ["Davis Food Court", "Dining · William G. Davis Building", "Food"],
            ].map(([name, detail, tag], index) => (
              <div
                key={name}
                className={
                  index === 0
                    ? "global-home-search-result is-featured"
                    : "global-home-search-result"
                }
              >
                <div>
                  <strong>{name}</strong>
                  <span>{detail}</span>
                </div>
                <em>{tag}</em>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="universities"
        className="global-home-universities"
        aria-labelledby="global-universities-title"
      >
        <div className="global-home-university-heading">
          <div>
            <p className="global-home-eyebrow">Campus coverage</p>
            <h2 id="global-universities-title">Built for your campus.</h2>
            <p className="global-home-count">
              {SUPPORTED_UNIVERSITIES.length} timetable-ready universities · campus coverage across
              Canada, the U.S., and Europe.
            </p>
          </div>
          <a href="/universities" className="global-home-view-all">
            View all universities
            <ArrowRight aria-hidden="true" />
          </a>
        </div>

        <label className="global-home-university-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search all Gapwise universities and campuses</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find your university or campus"
          />
          <span>
            {visibleDestinations.length} result{visibleDestinations.length === 1 ? "" : "s"}
          </span>
        </label>

        <div className="global-home-university-grid" aria-live="polite">
          {visibleDestinations.map((destination) => (
            <a
              key={`${destination.kind}-${destination.id}`}
              href={destination.href}
              className="global-home-university-card"
              style={{ "--university-accent": destination.university.accentColor } as CSSProperties}
              aria-label={`${destination.shortName}${destination.kind === "campus" ? " · Campus edition" : ""} ${destination.name}`}
            >
              <div>
                <div className="global-home-university-top">
                  <span className="global-home-university-short">{destination.shortName}</span>
                  <span
                    className={`global-home-kind-badge ${
                      destination.kind === "campus" ? "is-campus" : "is-institution"
                    }`}
                  >
                    {destination.kind === "campus" ? (
                      <>
                        <MapPin aria-hidden="true" />
                        Campus
                      </>
                    ) : (
                      "Institution"
                    )}
                  </span>
                  <em className="global-home-status-badge" data-status={destination.status}>
                    {destination.status === "supported"
                      ? "Supported"
                      : destination.status === "partial"
                        ? "Partial"
                        : "Planned"}
                  </em>
                </div>
                <strong>{destination.name}</strong>
                <small>
                  {destination.kind === "campus"
                    ? `${destination.university.name} · ${destination.location}`
                    : `${destination.location} · ${destination.scope}`}
                </small>
              </div>
              <ChevronRight aria-hidden="true" />
              <span className="global-home-university-host">{destination.host}</span>
            </a>
          ))}
          {visibleDestinations.length === 0 ? (
            <div className="global-home-university-empty">
              No university or campus matches “{query}”.
            </div>
          ) : null}
        </div>
      </section>

      <section
        id="ecosystem"
        className="global-home-ecosystem"
        aria-labelledby="global-ecosystem-title"
      >
        <div className="global-home-section-heading">
          <p className="global-home-eyebrow">One open platform</p>
          <h2 id="global-ecosystem-title">Beyond the timetable.</h2>
          <p>
            Gapwise extends into open data, AI tooling, documentation, developer interfaces, and
            public service status.
          </p>
        </div>

        <div className="global-home-ecosystem-grid">
          {ecosystemProducts.map((product, index) => {
            const Icon = product.icon;
            const style = { "--ecosystem-accent": product.accent } as CSSProperties;
            const className = "global-home-ecosystem-card" + (index === 0 ? " is-featured" : "");
            const content = (
              <>
                <div className="global-home-ecosystem-icon" style={style}>
                  <Icon aria-hidden="true" />
                </div>
                <div>
                  <span className="global-home-ecosystem-label" style={style}>
                    {product.label}
                  </span>
                  <h3>{product.title}</h3>
                  <p>{product.copy}</p>
                </div>
                <span className="global-home-ecosystem-link" style={style}>
                  {product.cta} <ArrowRight aria-hidden="true" />
                </span>
              </>
            );

            return product.internal ? (
              <Link key={product.id} to="/developers" className={className} style={style}>
                {content}
              </Link>
            ) : (
              <a key={product.id} href={product.href} className={className} style={style}>
                {content}
              </a>
            );
          })}
        </div>
      </section>

      <section className="global-home-open">
        <div>
          <p className="global-home-eyebrow">Open by design</p>
          <h2>Built in public. Free to build on.</h2>
          <p>
            Inspect the code, contribute campus data, use the public developer tools, or build
            something new on top of Gapwise.
          </p>
          <a
            className="global-home-primary is-light"
            href="https://github.com/GapwiseHQ/gapwise"
            target="_blank"
            rel="noreferrer"
          >
            <GitBranch aria-hidden="true" /> View on GitHub
          </a>
        </div>
        <div className="global-home-code" aria-label="Gapwise SDK example">
          <div>
            <BrandMark className="global-home-code-logo" />
            <span>gapwise / quickstart</span>
          </div>
          <code>
            <span>$</span> npm install @gapwise/sdk
          </code>
          <code>
            <b>import</b> {"{ Gapwise }"} <b>from</b> <em>"@gapwise/sdk"</em>
          </code>
          <code>
            <b>const</b> campuses = <b>await</b> gapwise.campuses.list()
          </code>
          <p>
            <Check aria-hidden="true" /> {IMPLEMENTED_CAMPUS_COUNT} campuses in current coverage
          </p>
        </div>
      </section>
    </div>
  );
}
