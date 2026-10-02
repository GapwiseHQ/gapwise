import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPinned,
  Navigation,
  Search,
  Upload,
} from "lucide-react";
import type { CSSProperties } from "react";
import { UploadPanel } from "@/components/UploadPanel";
import {
  SITES,
  activeSite,
  activeUniversity,
  displayNameForSite,
  marketingForSite,
} from "@/universities/registry";
import type { MarketingLandingProps } from "./MarketingLanding";
import "./university-marketing-home.css";

type UniversityMarketingHomeProps = MarketingLandingProps;

function CoverageStats({
  buildings,
  entrances,
  pathSegments,
}: {
  buildings: number;
  entrances: number;
  pathSegments: number;
}) {
  return (
    <dl className="university-home-stats" aria-label="Gapwise campus data coverage">
      <div>
        <dt>Mapped buildings</dt>
        <dd>{buildings.toLocaleString("en-CA")}</dd>
      </div>
      <div>
        <dt>Mapped entrances</dt>
        <dd>{entrances.toLocaleString("en-CA")}</dd>
      </div>
      <div>
        <dt>Routing segments</dt>
        <dd>{pathSegments.toLocaleString("en-CA")}</dd>
      </div>
    </dl>
  );
}

function ProductPreview({
  marketing,
  shortName,
}: {
  marketing: NonNullable<ReturnType<typeof marketingForSite>>;
  shortName: string;
}) {
  const example = marketing.example;
  return (
    <div className="university-product-window" aria-label={`Example Gapwise day at ${shortName}`}>
      <div className="university-product-bar">
        <span className="university-product-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          {example.day} · {shortName} example
        </span>
        <span className="university-product-status">Schedule ready</span>
      </div>
      <div className="university-product-body">
        <div className="university-product-schedule">
          <div className="university-product-heading">
            <span>Your day</span>
            <strong>Classes and the gap between them</strong>
          </div>
          <article>
            <time>09:00</time>
            <div>
              <strong>{example.courseCode}</strong>
              <span>
                {example.buildingName} · {example.buildingCode} {example.room}
              </span>
            </div>
          </article>
          <div className="university-product-gap">
            <Clock3 aria-hidden="true" />
            <span>Gapwise checks the open time after walking</span>
          </div>
          <article>
            <time>12:00</time>
            <div>
              <strong>{example.nextCourseCode}</strong>
              <span>
                {example.nextBuildingName} · {example.nextBuildingCode} {example.nextRoom}
              </span>
            </div>
          </article>
        </div>
        <aside className="university-product-route">
          <div className="university-route-heading">
            <span>Campus route</span>
            <Navigation aria-hidden="true" />
          </div>
          <div className="university-route-map" aria-hidden="true">
            <span className="university-route-building is-origin">{example.buildingCode}</span>
            <span className="university-route-path" />
            <span className="university-route-building is-destination">
              {example.nextBuildingCode}
            </span>
            <i className="university-route-dot is-origin" />
            <i className="university-route-dot is-destination" />
          </div>
          <p>
            <strong>
              {example.buildingCode} → {example.nextBuildingCode}
            </strong>
            <span>Campus pedestrian routing</span>
          </p>
        </aside>
      </div>
    </div>
  );
}

function CampusChooser() {
  const campuses = SITES.filter(
    (site) => site.role === "campus-edition" && site.universityId === "uoft",
  );
  return (
    <div className="university-campus-chooser" aria-label="Choose a University of Toronto campus">
      <div className="university-campus-chooser-header">
        <span>Choose your campus</span>
        <strong>Three distinct Gapwise editions</strong>
      </div>
      {campuses.map((campus, index) => (
        <a
          key={campus.id}
          href={`https://${campus.canonicalHost}`}
          aria-label={campus.name}
          style={{ "--campus-card-accent": campus.presentation?.accentColor } as CSSProperties}
        >
          <span className="university-campus-index">0{index + 1}</span>
          <span>
            <strong>{campus.shortName}</strong>
            <small>{campus.presentation?.visualLabel} campus</small>
          </span>
          <ArrowRight aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

export function UniversityMarketingHome(props: UniversityMarketingHomeProps) {
  const university = activeUniversity();
  const site = activeSite();
  const marketing = marketingForSite(site, university);
  if (!university || !site || !marketing) return null;

  const displayName = displayNameForSite(site, university);
  const shortName = site.shortName ?? university.shortName;
  const accent = site.presentation?.accentColor ?? university.accentColor;
  const isHub = site.role === "university-hub";
  const heroEyebrow = site.presentation?.heroEyebrow ?? `Gapwise for ${displayName}`;
  const heroDescription = site.presentation?.heroDescription ?? marketing.description;

  return (
    <div
      className="university-home"
      data-university={university.id}
      data-campus={site.campusId ?? "all"}
      style={{ "--university-home-accent": accent } as CSSProperties}
    >
      <section className="university-home-hero" aria-labelledby="university-home-title">
        <div className="university-home-grid" aria-hidden="true" />
        <div className="university-home-intro">
          <p className="university-home-kicker">
            <span aria-hidden="true" />
            {heroEyebrow}
          </p>
          <h1 id="university-home-title">{marketing.headline}</h1>
          <p className="university-home-lede">{heroDescription}</p>
          <div className="university-home-actions">
            {isHub ? (
              <a className="university-home-primary" href="#campus-editions">
                Choose your campus <ArrowRight aria-hidden="true" />
              </a>
            ) : (
              <button
                className="university-home-primary"
                type="button"
                onClick={props.onDemo}
                disabled={props.loading}
              >
                {props.loading ? "Opening demo…" : `Try the ${shortName} demo`}{" "}
                <ArrowRight aria-hidden="true" />
              </button>
            )}
            <a
              className="university-home-secondary"
              href={isHub ? "#campus-editions" : "#import-schedule"}
            >
              {isHub ? "Compare editions" : "Import your schedule"}
            </a>
          </div>
          <nav
            className="university-home-feature-links"
            aria-label={`${displayName} Gapwise features`}
          >
            <Link to="/timetable">
              <CalendarDays aria-hidden="true" />
              Timetable
            </Link>
            <Link to="/gaps">
              <Clock3 aria-hidden="true" />
              Gap plan
            </Link>
            <Link to="/route">
              <MapPinned aria-hidden="true" />
              Map & routing
            </Link>
          </nav>
        </div>
        <div className="university-home-visual">
          {isHub ? (
            <CampusChooser />
          ) : (
            <ProductPreview marketing={marketing} shortName={shortName} />
          )}
        </div>
        <CoverageStats {...marketing.stats} />
      </section>

      {isHub ? (
        <section
          id="campus-editions"
          className="university-home-section university-home-campus-section"
          aria-labelledby="campus-editions-title"
        >
          <p className="university-home-section-label">Campus editions</p>
          <h2 id="campus-editions-title">Built around the campus you actually attend.</h2>
          <p>
            UTM, UTSG, and UTSC use distinct campus identities, examples, maps, building registries,
            and routing data.
          </p>
          <CampusChooser />
        </section>
      ) : (
        <>
          <section
            className="university-home-section university-home-discover"
            aria-labelledby="university-discover-title"
          >
            <div>
              <p className="university-home-section-label">Campus-aware by default</p>
              <h2 id="university-discover-title">Search the places your schedule already knows.</h2>
              <p>
                Gapwise resolves class locations against the {marketing.campusName} building
                registry, then keeps that context available for timetable, gap, and route views.
              </p>
            </div>
            <div
              className="university-search-preview"
              aria-label={`Example ${shortName} building searches`}
            >
              <div>
                <Search aria-hidden="true" />
                <span>Search {shortName} buildings</span>
                <kbd>⌘K</kbd>
              </div>
              <ul>
                {marketing.searchExamples.map((example) => (
                  <li key={example}>
                    <MapPinned aria-hidden="true" />
                    <span>{example}</span>
                    <ArrowRight aria-hidden="true" />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section
            className="university-home-quick-links"
            aria-label={`${shortName} product links`}
          >
            <Link to="/timetable">
              <span>
                <CalendarDays aria-hidden="true" />
              </span>
              <strong>Timetable</strong>
              <small>See classes and rooms together.</small>
            </Link>
            <Link to="/gaps">
              <span>
                <Clock3 aria-hidden="true" />
              </span>
              <strong>Gap plan</strong>
              <small>Understand usable time between classes.</small>
            </Link>
            <Link to="/route">
              <span>
                <Navigation aria-hidden="true" />
              </span>
              <strong>Campus routing</strong>
              <small>Find buildings and plan the next walk.</small>
            </Link>
          </section>

          <section
            id="import-schedule"
            className="university-home-section university-home-import"
            aria-labelledby="university-import-title"
          >
            <div>
              <p className="university-home-section-label">Start with your real schedule</p>
              <h2 id="university-import-title">Bring in {university.calendarSource}.</h2>
              <p>
                {university.calendarInstructions} The original file is parsed in your browser and is
                never uploaded.
              </p>
              <a href={university.calendarHelpUrl}>
                View {shortName} import guidance <ArrowRight aria-hidden="true" />
              </a>
            </div>
            <div className="university-home-import-panel">
              {!props.isOnline ? (
                <p className="university-home-offline" role="status">
                  Offline mode — saved schedules and local import remain available.
                </p>
              ) : null}
              <UploadPanel
                variant="hero"
                onFile={props.onFile}
                onDemo={props.onDemo}
                loading={props.loading}
                error={props.error}
                remember={props.remember}
                onRememberChange={props.onRememberChange}
                rememberAvailable={props.rememberAvailable}
              />
            </div>
          </section>
        </>
      )}

      <footer className="university-home-footer">
        <span>Gapwise · {displayName}</span>
        <span>Independent student software · Not an official university service</span>
      </footer>
    </div>
  );
}
