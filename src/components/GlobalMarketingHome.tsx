import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  ChevronRight,
  Code2,
  Github,
  MapPin,
  Navigation,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import {
  canonicalUrlForUniversity,
  supportedUniversities,
} from "@/universities/registry";
import "./global-marketing-home.css";

const FEATURED_UNIVERSITY_IDS = ["uoft", "waterloo", "mcgill", "ubc", "mcmaster", "queens"];

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
        <span>Example student day</span>
        <span className="global-home-window-campus">Campus</span>
      </div>

      <div className="global-home-window-grid">
        <aside className="global-home-window-sidebar" aria-hidden="true">
          <div className="global-home-window-search">
            <Search />
            <span>Search campus</span>
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
            <small>3 classes · 2 gaps</small>
          </div>

          <div className="global-home-timeline">
            <article>
              <i aria-hidden="true" />
              <div>
                <strong>Lecture</strong>
                <span>Campus building · Room 204</span>
              </div>
              <time>11:00–12:00</time>
            </article>

            <article className="is-gap">
              <i aria-hidden="true" />
              <div>
                <strong>2 hour gap</strong>
                <span>Plan · route · focus</span>
              </div>
              <ArrowRight aria-hidden="true" />
            </article>

            <article>
              <i aria-hidden="true" />
              <div>
                <strong>Next class</strong>
                <span>Science building · Lab 3</span>
              </div>
              <time>14:00–15:00</time>
            </article>
          </div>
        </div>

        <aside className="global-home-window-route">
          <div className="global-home-route-title">
            <span>Route to next class</span>
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
              <span>550 m walking</span>
            </div>
            <em>On time</em>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function GlobalMarketingHome() {
  const universities = supportedUniversities();
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const implementedCampusCount = universities.reduce(
    (total, university) => total + university.campuses.length,
    0,
  );

  const matchingUniversities = useMemo(() => {
    if (!normalizedQuery) return universities;
    return universities.filter((university) => {
      const haystack = [
        university.name,
        university.shortName,
        university.campusScope,
        ...university.hosts,
        ...university.campuses,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, universities]);

  const visibleUniversities = useMemo(() => {
    if (normalizedQuery) return matchingUniversities;
    if (showAll) return universities;
    const featured = FEATURED_UNIVERSITY_IDS.map((id) =>
      universities.find((university) => university.id === id),
    ).filter((university): university is (typeof universities)[number] => Boolean(university));
    return featured.length ? featured : universities.slice(0, 6);
  }, [matchingUniversities, normalizedQuery, showAll, universities]);

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
          <strong>{universities.length}</strong>
          <span>supported universities</span>
        </div>
        <div>
          <strong>{implementedCampusCount}</strong>
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
              <span>Example schedule</span>
            </div>
            <div className="global-home-week-days">
              {["MON", "TUE", "WED", "THU", "FRI"].map((day, index) => (
                <div key={day} className={index === 3 ? "is-current" : undefined}>
                  <span>{day}</span>
                  {index < 4 ? <i className={"event event-" + index} /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="global-home-feature-row is-reversed">
          <div className="global-home-feature-visual global-home-route-visual" aria-hidden="true">
            <div className="global-home-route-canvas">
              <span className="route-building route-building-a" />
              <span className="route-building route-building-b" />
              <span className="route-curve" />
              <span className="route-dot" />
              <MapPin className="route-pin" />
            </div>
            <div className="global-home-route-summary">
              <p>Route</p>
              <strong>7 min</strong>
              <span>next class</span>
              <em>Arrive early</em>
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
            {[
              ["Campus library", "6 min · open now", "Quiet"],
              ["Study commons", "8 min · near next class", "Nearby"],
              ["Student centre", "4 min · open now", "Closest"],
            ].map(([name, detail, tag], index) => (
              <div key={name} className={index === 0 ? "global-home-search-result is-featured" : "global-home-search-result"}>
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

      <section id="universities" className="global-home-universities" aria-labelledby="global-universities-title">
        <div className="global-home-university-heading">
          <div>
            <p className="global-home-eyebrow">Campus coverage</p>
            <h2 id="global-universities-title">Built for your campus.</h2>
            <p className="global-home-count">
              {universities.length} universities · {implementedCampusCount} implemented campuses
            </p>
          </div>
          <button
            type="button"
            className="global-home-view-all"
            onClick={() => {
              setShowAll((current) => !current);
              if (normalizedQuery) setQuery("");
            }}
          >
            {showAll ? "Show featured universities" : "View all universities"}
            <ArrowRight aria-hidden="true" />
          </button>
        </div>

        <label className="global-home-university-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search all supported universities and campuses</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find your university or campus"
          />
          <span>
            {visibleUniversities.length} / {universities.length}
          </span>
        </label>

        <div className="global-home-university-grid" aria-live="polite">
          {visibleUniversities.map((university) => (
            <a
              key={university.id}
              href={canonicalUrlForUniversity(university)}
              className="global-home-university-card"
              style={{ "--university-accent": university.accentColor } as CSSProperties}
            >
              <div>
                <span className="global-home-university-short">{university.shortName}</span>
                <strong>{university.name}</strong>
                <small>{university.campusScope}</small>
              </div>
              <ChevronRight aria-hidden="true" />
              <span className="global-home-university-host">{university.hosts[0]}</span>
            </a>
          ))}
          {visibleUniversities.length === 0 ? (
            <div className="global-home-university-empty">
              No supported university or campus matches “{query}”.
            </div>
          ) : null}
        </div>
      </section>

      <section id="ecosystem" className="global-home-ecosystem" aria-labelledby="global-ecosystem-title">
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
            const className =
              "global-home-ecosystem-card" + (index === 0 ? " is-featured" : "");
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
            <Github aria-hidden="true" /> View on GitHub
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
            <Check aria-hidden="true" /> {implementedCampusCount} campuses in current coverage
          </p>
        </div>
      </section>
    </div>
  );
}
