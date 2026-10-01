import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { UploadPanel } from "@/components/UploadPanel";
import type { MarketingLandingProps } from "./MarketingLanding";
import { GlobalMarketingHome } from "./GlobalMarketingHome";
import {
  activeUniversity,
  activeSite,
  SITES,
  supportedUniversities,
  canonicalUrlForUniversity,
} from "@/universities/registry";
import "./marketing-landing.css";

function ProductMark() {
  return <span className="product-brand-mark" aria-hidden="true" />;
}

function ExternalProductLink({ href, children }: { href: string; children: string }) {
  return (
    <a className="product-story-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

const INSTITUTION_MARKETING_METRICS: Record<
  string,
  { count: number; sampleCodes: [string, string, string, string] }
> = {
  uoft: { count: 30, sampleCodes: ["MN", "IB", "DH", "CCT"] },
  carleton: { count: 48, sampleCodes: ["ML", "TB", "DT", "PA"] },
  tmu: { count: 30, sampleCodes: ["SLC", "ENG", "VIC", "SHE"] },
  queens: { count: 33, sampleCodes: ["DUN", "STF", "WLH", "JEF"] },
  laurier: { count: 25, sampleCodes: ["LH", "SC", "DAWB", "BA"] },
  york: { count: 42, sampleCodes: ["CLH", "LAS", "DB", "ACW"] },
  mcmaster: { count: 38, sampleCodes: ["BSB", "MDCL", "JHE", "PGCLL"] },
  western: { count: 20, sampleCodes: ["UCC", "SSC", "NSC", "MC"] },
  guelph: { count: 15, sampleCodes: ["UC", "LIB", "ROZH", "MCKN"] },
  uottawa: { count: 17, sampleCodes: ["UCU", "TBT", "MRT", "DMS"] },
  brock: { count: 12, sampleCodes: ["ST", "TH", "MC", "GSB"] },
  ubc: { count: 236, sampleCodes: ["ICCS", "BUCH", "PHRM", "LIFE"] },
  waterloo: { count: 68, sampleCodes: ["MC", "DC", "QNC", "AL"] },
  mcgill: { count: 49, sampleCodes: ["LEA", "MAASS", "RPHYS", "ARTS"] },
};
const GLOBAL_MARKETING_METRICS = {
  count: 0,
  sampleCodes: ["CLASS", "LIB", "LAB", "STUDY"] as [string, string, string, string],
};

export function MarketingLandingImpl({
  isOnline,
  onFile,
  onDemo,
  loading,
  error,
  remember,
  onRememberChange,
  rememberAvailable,
}: MarketingLandingProps) {
  const university = activeUniversity();
  const site = activeSite();
  const universities = supportedUniversities();
  const isGlobal = site?.role === "global";
  const isHub = site?.role === "university-hub";
  const hubCampuses = isHub
    ? SITES.filter(
        (candidate) =>
          candidate.role === "campus-edition" && candidate.universityId === site.universityId,
      )
    : [];
  const metrics = isGlobal
    ? GLOBAL_MARKETING_METRICS
    : (INSTITUTION_MARKETING_METRICS[university?.id ?? "uoft"] ??
      INSTITUTION_MARKETING_METRICS["uoft"]!);

  const rootRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>("capabilities");

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;

    const entriesBySection = new Map<Element, IntersectionObserverEntry>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) entriesBySection.set(entry.target, entry);
        const viewportCenter = window.innerHeight * 0.42;
        const visible = [...entriesBySection.values()]
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const aCenter = a.boundingClientRect.top + a.boundingClientRect.height / 2;
            const bCenter = b.boundingClientRect.top + b.boundingClientRect.height / 2;
            return Math.abs(aCenter - viewportCenter) - Math.abs(bCenter - viewportCenter);
          });
        const next = visible[0]?.target.getAttribute("data-section");
        if (next) setActiveSection(next);
      },
      { rootMargin: "-25% 0px -40% 0px", threshold: 0 },
    );

    root.querySelectorAll<HTMLElement>("[data-section]").forEach((section) => {
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  if (isGlobal) {
    return <GlobalMarketingHome />;
  }

  return (
    <div ref={rootRef} className="marketing-home" data-active-section={activeSection}>
      <section className="marketing-hero" aria-labelledby="marketing-title">
        <div className="marketing-hero-copy">
          <p className="marketing-eyebrow">
            {isGlobal
              ? "Free and open-source university software"
              : isHub
                ? `Gapwise for ${university?.name}`
                : `For ${site?.name ?? university?.name ?? "your campus"}`}
          </p>
          <h1 id="marketing-title">
            {isGlobal || isHub ? (
              <>
                Your university day, <span>connected.</span>
              </>
            ) : (
              <>
                Make every <span>gap</span> on campus count.
              </>
            )}
          </h1>
          <p className="marketing-lede">
            {isGlobal
              ? "Gapwise brings timetable planning, campus maps, pedestrian routing, and the time between classes into one multi-university platform."
              : isHub
                ? `Choose your ${university?.shortName} campus for a timetable, campus map, building search, and pedestrian routing experience grounded in that campus.`
                : `One precise workspace for your ${site?.shortName ?? university?.shortName ?? "campus"} timetable, the time between classes, and source-backed campus context where available.`}
          </p>
          <div className="marketing-hero-links">
            <a href={isHub ? "#campuses" : "#capabilities"}>
              {isHub ? "Choose a campus" : "Platform"}
            </a>
            <a href="#universities">Supported Universities</a>
            <a href="#ecosystem">Ecosystem</a>
          </div>
        </div>

        {isGlobal ? (
          <div className="marketing-import ecosystem-hero-panel" aria-label="Explore Gapwise">
            <p className="marketing-eyebrow">One platform · many campuses</p>
            <h2>{universities.length} supported universities</h2>
            <p>
              Find your edition, explore the open data and developer platform, or help map the next
              campus.
            </p>
            <div className="product-story-actions">
              <a className="product-story-link" href="#universities">
                Find your university <span aria-hidden="true">↓</span>
              </a>
              <a className="product-story-link" href="https://github.com/GapwiseHQ">
                View source <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        ) : isHub ? (
          <div
            id="campuses"
            className="marketing-import hub-campus-panel"
            aria-label={`${university?.name} campuses`}
          >
            {hubCampuses.map((campus) => (
              <a
                key={campus.id}
                className="hub-campus-link"
                href={`https://${campus.canonicalHost}`}
              >
                <span>{campus.shortName}</span>
                <strong>{campus.name}</strong>
                <i aria-hidden="true">↗</i>
              </a>
            ))}
            {site.universityId === "ubc" ? (
              <p>Okanagan support is planned and is not yet listed as supported.</p>
            ) : null}
            {site.universityId === "york" ? (
              <p>Glendon and Markham are reserved for future verified coverage.</p>
            ) : null}
          </div>
        ) : (
          <div className="marketing-import" aria-label="Start with your timetable">
            {!isOnline ? (
              <p className="marketing-offline" role="status">
                Offline mode — timetable import and saved schedules still work.
              </p>
            ) : null}
            <UploadPanel
              variant="hero"
              onFile={onFile}
              onDemo={onDemo}
              loading={loading}
              error={error}
              remember={remember}
              onRememberChange={onRememberChange}
              rememberAvailable={rememberAvailable}
            />
          </div>
        )}
      </section>

      <nav className="product-story-nav" aria-label="Gapwise platform navigation">
        <span>Explore</span>
        <div>
          <a
            href="#capabilities"
            data-active={activeSection === "capabilities" ? "true" : undefined}
          >
            <i aria-hidden="true" />
            Platform
          </a>
          <a
            href="#universities"
            data-active={activeSection === "universities" ? "true" : undefined}
          >
            <i aria-hidden="true" />
            Universities
          </a>
          <a href="#ecosystem" data-active={activeSection === "ecosystem" ? "true" : undefined}>
            <i aria-hidden="true" />
            Ecosystem
          </a>
        </div>
      </nav>

      <section
        id="capabilities"
        data-section="capabilities"
        className="product-story-section product-story-core"
        aria-labelledby="capabilities-heading"
      >
        <div>
          <div className="product-story-copy">
            <p className="product-story-label">
              <ProductMark />
              Gapwise
            </p>
            <h2 id="capabilities-heading">Plan the time between classes.</h2>
            <p>
              Your weekly timetable, gap plan, and campus movement share one schedule context, so
              every view stays focused on what comes next.
            </p>
          </div>
          <div className="product-story-actions">
            {isGlobal || isHub ? (
              <>
                <a className="product-story-link" href={isHub ? "#campuses" : "#universities"}>
                  {isHub ? "Choose a campus" : "Find your edition"}{" "}
                  <span aria-hidden="true">↓</span>
                </a>
                <Link className="product-story-link" to="/developers">
                  Developer platform <span aria-hidden="true">↗</span>
                </Link>
              </>
            ) : (
              <>
                <Link className="product-story-link" to="/timetable" onClick={onDemo}>
                  Timetable <span aria-hidden="true">↗</span>
                </Link>
                <Link className="product-story-link" to="/gaps" onClick={onDemo}>
                  Gap planner <span aria-hidden="true">↗</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="product-stage timetable-stage" aria-label="Gapwise timetable preview">
          <div className="stage-toolbar">
            <span>Monday</span>
            <span>Fall</span>
          </div>
          <div className="timeline-row">
            <time>09:00</time>
            <div className="timeline-line" />
            <div className="timeline-event">
              <strong>Class</strong>
              <span>{metrics.sampleCodes[0]}</span>
            </div>
          </div>
          <div className="timeline-row timeline-gap">
            <time>11:00</time>
            <div className="timeline-line" />
            <div className="timeline-event">
              <strong>2h gap</strong>
              <span>Plan · route · focus</span>
            </div>
          </div>
          <div className="timeline-row">
            <time>13:00</time>
            <div className="timeline-line" />
            <div className="timeline-event">
              <strong>Class</strong>
              <span>{metrics.sampleCodes[1]}</span>
            </div>
          </div>
          <div className="stage-route">
            <span className="stage-symbol" aria-hidden="true">
              ⌁
            </span>
            <span>Schedule context flows into Gap Plan and Day Route</span>
          </div>
        </div>
      </section>

      <section
        id="universities"
        data-section="universities"
        className="marketing-universities-section"
        aria-labelledby="universities-title"
      >
        <div className="universities-section-header">
          <p className="marketing-eyebrow">Universities</p>
          <h2 id="universities-title">Gapwise across Canada.</h2>
          <p className="universities-section-lede">
            Gapwise adapts to each university's campus, buildings, timetable terminology, navigation
            data, routing, and schedule context.
          </p>
        </div>

        <ul className="universities-grid" role="list">
          {universities.map((uni) => {
            const href = canonicalUrlForUniversity(uni);
            const isCurrent = !isGlobal && university?.id === uni.id;
            return (
              <li key={uni.id} className="university-grid-item">
                <a
                  href={href}
                  className="university-card"
                  style={{ "--uni-card-accent": uni.accentColor } as React.CSSProperties}
                  aria-label={`${uni.name} — ${uni.campusScope} (${uni.hosts[0]})`}
                >
                  <div className="university-card-content">
                    <div className="university-card-top">
                      <div className="university-card-identity">
                        <span className="university-short-name">{uni.shortName}</span>
                        <h3 className="university-name">{uni.name}</h3>
                      </div>
                      <span className="university-card-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </div>
                    <p className="university-scope">{uni.campusScope}</p>
                    <div className="university-card-meta">
                      <span className="university-host">{uni.hosts[0]}</span>
                      {isCurrent ? (
                        <span className="university-badge-current">This edition</span>
                      ) : null}
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        id="ecosystem"
        data-section="ecosystem"
        className="marketing-ecosystem-section"
        aria-labelledby="ecosystem-title"
      >
        <div className="ecosystem-section-header">
          <p className="marketing-eyebrow">Platform</p>
          <h2 id="ecosystem-title">The Gapwise ecosystem.</h2>
          <p className="ecosystem-section-lede">
            Explore open data, AI tooling, technical contracts, and operational status across all
            supported university campuses.
          </p>
        </div>

        <div className="ecosystem-grid">
          <div
            className="ecosystem-card"
            data-ecosystem="ai"
            style={{ "--eco-accent": "#a78bfa" } as React.CSSProperties}
          >
            <div className="ecosystem-card-header">
              <span className="ecosystem-card-badge">AI</span>
              <h3>Gapwise AI</h3>
            </div>
            <p>
              Permissioned campus intelligence with Model Context Protocol (MCP) tool integration.
            </p>
            <ExternalProductLink href="https://ai.gapwise.ca">Gapwise AI</ExternalProductLink>
          </div>

          <div
            className="ecosystem-card"
            data-ecosystem="docs"
            style={{ "--eco-accent": "#38bdf8" } as React.CSSProperties}
          >
            <div className="ecosystem-card-header">
              <span className="ecosystem-card-badge">Docs</span>
              <h3>Gapwise Docs</h3>
            </div>
            <p>
              Canonical OpenAPI specifications, JavaScript and Python SDK guides, and developer
              references.
            </p>
            <div className="ecosystem-card-actions">
              <ExternalProductLink href="https://docs.gapwise.ca">Open Docs</ExternalProductLink>
              <Link className="product-story-link" to="/developers">
                Developers <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div
            className="ecosystem-card"
            data-ecosystem="data"
            style={{ "--eco-accent": "#ff5a66" } as React.CSSProperties}
          >
            <div className="ecosystem-card-header">
              <span className="ecosystem-card-badge">Data</span>
              <h3>Gapwise Data</h3>
            </div>
            <p>
              Canada's largest free and open multi-university campus navigation dataset with
              provenance.
            </p>
            <ExternalProductLink href="https://data.gapwise.ca">Explore Data</ExternalProductLink>
          </div>

          <div
            className="ecosystem-card"
            data-ecosystem="status"
            style={{ "--eco-accent": "#39cf97" } as React.CSSProperties}
          >
            <div className="ecosystem-card-header">
              <span className="ecosystem-card-badge">Status</span>
              <h3>Gapwise Status</h3>
            </div>
            <p>
              Independent uptime probes and operational incident history for all public services.
            </p>
            <ExternalProductLink href="https://status.gapwise.ca">Open Status</ExternalProductLink>
          </div>
        </div>
      </section>
    </div>
  );
}
