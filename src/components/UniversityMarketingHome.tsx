import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Database,
  ExternalLink,
  MapPinned,
  Navigation,
  Search,
} from "lucide-react";
import type { CSSProperties } from "react";
import { UploadPanel } from "@/components/UploadPanel";
import {
  activeSite,
  activeUniversity,
  campusForSite,
  campusRecordsForUniversity,
  displayNameForSite,
  marketingForSite,
  type CapabilityStatus,
  type Campus,
  type University,
  type UniversityMarketing,
} from "@/universities/registry";
import { type CampusVisual, visualForSite } from "@/universities/campus-visuals";
import type { MarketingLandingProps } from "./MarketingLanding";
import "./university-marketing-home.css";

type UniversityMarketingHomeProps = MarketingLandingProps;

const CAPABILITY_LABELS = {
  timetableImport: "Timetable import",
  buildingData: "Building data",
  search: "Campus search",
  routing: "Pedestrian routing",
} as const;

function CampusPhotography({ visual, label }: { visual: CampusVisual; label: string }) {
  return (
    <figure className="university-campus-photo">
      <img
        src={visual.src}
        alt={visual.alt}
        width="1600"
        height="1000"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        style={{ objectPosition: visual.position }}
      />
      <figcaption>
        <span>{label}</span>
        <a href={visual.sourceUrl} target="_blank" rel="noreferrer">
          Photo: {visual.credit} · {visual.license}
          <ExternalLink aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}

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
    <dl className="university-home-stats" aria-label="Current Gapwise campus data coverage">
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
  example,
  shortName,
}: {
  example: UniversityMarketing["example"];
  shortName: string;
}) {
  if (!example) return null;
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

function PlannedPreview({ campus, university }: { campus: Campus | null; university: University }) {
  const location = campus ? `${campus.city}, ${campus.region}` : university.country;
  return (
    <div
      className="university-planned-window"
      aria-label={`${university.shortName} Gapwise edition status`}
    >
      <div className="university-planned-window-top">
        <span>Gapwise edition</span>
        <strong>Planned</strong>
      </div>
      <div className="university-planned-location">
        <MapPinned aria-hidden="true" />
        <div>
          <span>Campus context</span>
          <strong>{campus?.campusName ?? university.campusScope}</strong>
          <small>{location}</small>
        </div>
      </div>
      <div className="university-planned-lines" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <p>
        Campus capabilities activate only after the underlying timetable and map data are verified.
      </p>
    </div>
  );
}

function TimetablePreview({ university }: { university: University }) {
  return (
    <div
      className="university-planned-window"
      aria-label={`${university.shortName} import support`}
    >
      <div className="university-planned-window-top">
        <span>Gapwise timetable</span>
        <strong>Import ready</strong>
      </div>
      <div className="university-planned-location">
        <CalendarDays aria-hidden="true" />
        <div>
          <span>Supported source</span>
          <strong>{university.calendarSource}</strong>
          <small>{university.fileTypeLabel ?? ".ics calendar"}</small>
        </div>
      </div>
      <div className="university-planned-lines" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <p>
        Your schedule is parsed privately in this browser. Campus maps and routing stay separate.
      </p>
    </div>
  );
}

function statusLabel(status: CapabilityStatus) {
  return status === "supported" ? "Available" : status === "partial" ? "Partial" : "Planned";
}

function aggregateCapabilities(campuses: Campus[]) {
  return Object.fromEntries(
    Object.keys(CAPABILITY_LABELS).map((key) => {
      const values = campuses.map(
        (campus) => campus.capabilities[key as keyof Campus["capabilities"]],
      );
      const status: CapabilityStatus = values.every((value) => value === "supported")
        ? "supported"
        : values.every((value) => value === "planned")
          ? "planned"
          : "partial";
      return [key, status];
    }),
  ) as Campus["capabilities"];
}

function CapabilityGrid({ campuses, campus }: { campuses: Campus[]; campus: Campus | null }) {
  const capabilities = campus?.capabilities ?? aggregateCapabilities(campuses);
  return (
    <section className="university-capabilities" aria-labelledby="university-capabilities-title">
      <div>
        <p className="university-home-section-label">Capability status</p>
        <h2 id="university-capabilities-title">Clear about what works today.</h2>
        <p>
          “Planned” means the public edition exists, but Gapwise does not yet claim verified product
          support for that capability.
        </p>
      </div>
      <dl>
        {Object.entries(CAPABILITY_LABELS).map(([key, label]) => {
          const status = capabilities[key as keyof Campus["capabilities"]];
          return (
            <div key={key} data-status={status}>
              <dt>
                {key === "timetableImport" ? (
                  <CalendarDays aria-hidden="true" />
                ) : key === "buildingData" ? (
                  <Database aria-hidden="true" />
                ) : key === "search" ? (
                  <Search aria-hidden="true" />
                ) : (
                  <Navigation aria-hidden="true" />
                )}
                {label}
              </dt>
              <dd>
                <span>{status === "supported" ? <Check aria-hidden="true" /> : null}</span>
                {statusLabel(status)}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function CampusChooser({ university }: { university: University }) {
  const campuses = campusRecordsForUniversity(university);
  return (
    <div className="university-campus-chooser" aria-label={`Choose a ${university.name} campus`}>
      <div className="university-campus-chooser-header">
        <span>Choose your campus</span>
        <strong>{campuses.length} distinct Gapwise editions</strong>
      </div>
      {campuses.map((campus, index) => (
        <a
          key={campus.id}
          href={`https://${campus.hosts[0]}`}
          aria-label={campus.name}
          style={{ "--campus-card-accent": university.accentColor } as CSSProperties}
        >
          <span className="university-campus-index">{String(index + 1).padStart(2, "0")}</span>
          <span>
            <strong>{campus.shortName}</strong>
            <small>
              {campus.campusName} · {campus.city}
            </small>
          </span>
          <em data-status={campus.status}>{statusLabel(campus.status)}</em>
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

  const campus = campusForSite(site);
  const campuses = campusRecordsForUniversity(university);
  const displayName = displayNameForSite(site, university);
  const shortName = site.shortName ?? campus?.shortName ?? university.shortName;
  const accent = site.presentation?.accentColor ?? university.accentColor;
  const isHub = site.role === "university-hub";
  const isPlanned = !isHub && (campus?.status === "planned" || university.status === "planned");
  const timetableOnly =
    !isHub &&
    campus?.capabilities.timetableImport === "supported" &&
    campus.capabilities.buildingData === "planned";
  const hasBuildingData = campus?.capabilities.buildingData !== "planned";
  const heroEyebrow = site.presentation?.heroEyebrow ?? `Gapwise for ${displayName}`;
  const heroDescription = site.presentation?.heroDescription ?? marketing.description;
  const visual = visualForSite(site, campus, university);

  return (
    <div
      className="university-home"
      data-university={university.id}
      data-campus={site.campusId ?? "all"}
      data-status={campus?.status ?? university.status}
      style={{ "--university-home-accent": accent } as CSSProperties}
    >
      <section className="university-home-hero" aria-labelledby="university-home-title">
        <div className="university-home-grid" aria-hidden="true" />
        <div className="university-home-intro">
          <p className="university-home-kicker">
            <span aria-hidden="true" />
            <span>{heroEyebrow}</span>
            <em>
              {isPlanned
                ? "Planned edition"
                : university.status === "partial"
                  ? "Partial coverage"
                  : "Supported"}
            </em>
          </p>
          <h1 id="university-home-title">{marketing.headline}</h1>
          <p className="university-home-lede">{heroDescription}</p>
          <div className="university-home-actions">
            {isHub ? (
              <a className="university-home-primary" href="#campus-editions">
                Choose your campus <ArrowRight aria-hidden="true" />
              </a>
            ) : isPlanned ? (
              <a className="university-home-primary" href="#capabilities">
                View edition status <ArrowRight aria-hidden="true" />
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
              href={
                isHub
                  ? "#campus-editions"
                  : isPlanned
                    ? "https://gapwise.ca/universities"
                    : "#import-schedule"
              }
            >
              {isHub
                ? "Compare editions"
                : isPlanned
                  ? "Explore all universities"
                  : "Import your schedule"}
            </a>
          </div>
          {!isPlanned && !isHub ? (
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
              {hasBuildingData ? (
                <Link to="/route">
                  <MapPinned aria-hidden="true" />
                  Map & routing
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
        <div className="university-home-visual">
          <CampusPhotography visual={visual} label={campus?.campusName ?? university.campusScope} />
          <div className="university-home-visual-panel">
            {isHub ? (
              <CampusChooser university={university} />
            ) : isPlanned ? (
              <PlannedPreview campus={campus} university={university} />
            ) : timetableOnly ? (
              <TimetablePreview university={university} />
            ) : marketing.example ? (
              <ProductPreview example={marketing.example} shortName={shortName} />
            ) : null}
          </div>
        </div>
        {marketing.stats && !isPlanned ? <CoverageStats {...marketing.stats} /> : null}
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
            Each campus has its own identity and capability state. Supported data stays separate
            from planned coverage.
          </p>
          <CampusChooser university={university} />
        </section>
      ) : isPlanned ? (
        <section className="university-home-section university-home-planned-copy">
          <p className="university-home-section-label">A real edition, carefully staged</p>
          <h2>Personalized now. Product support only when verified.</h2>
          <p>
            This edition is discoverable by institution, abbreviation, campus, city, aliases, and
            hostname. It does not expose demo schedules, building results, or route estimates that
            Gapwise cannot substantiate.
          </p>
          <div
            className="university-planned-searches"
            aria-label={`${shortName} directory search examples`}
          >
            {marketing.searchExamples.map((example) => (
              <span key={example}>
                <Search aria-hidden="true" />
                {example}
              </span>
            ))}
          </div>
        </section>
      ) : (
        <>
          {hasBuildingData ? (
            <section
              className="university-home-section university-home-discover"
              aria-labelledby="university-discover-title"
            >
              <div>
                <p className="university-home-section-label">Campus-aware by default</p>
                <h2 id="university-discover-title">
                  Search the places your schedule already knows.
                </h2>
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
          ) : (
            <section className="university-home-section university-home-planned-copy">
              <p className="university-home-section-label">Timetable support is live</p>
              <h2>Plan the week without unsupported map claims.</h2>
              <p>
                Gapwise imports class times and source locations now. Building search and routing
                remain visibly planned until source-backed campus data is ready.
              </p>
            </section>
          )}
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
            {hasBuildingData ? (
              <Link to="/route">
                <span>
                  <Navigation aria-hidden="true" />
                </span>
                <strong>Campus routing</strong>
                <small>Find buildings and plan the next walk.</small>
              </Link>
            ) : null}
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
                university={university}
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

      <div id="capabilities">
        <CapabilityGrid campuses={campuses} campus={campus} />
      </div>
      <footer className="university-home-footer">
        <span>Gapwise · {displayName}</span>
        <span>Independent student software · Not an official university service</span>
      </footer>
    </div>
  );
}
