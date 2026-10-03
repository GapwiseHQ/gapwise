import { ArrowRight, MapPinned, Search } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import {
  normalizeUniversitySearch,
  universityDirectoryEntries,
  type AvailabilityStatus,
} from "@/universities/registry";
import "./university-directory.css";

const ENTRIES = universityDirectoryEntries();
const UNIVERSITY_COUNT = ENTRIES.filter((entry) => entry.kind === "university").length;
const CAMPUS_COUNT = ENTRIES.filter((entry) => entry.kind === "campus").length;

function statusLabel(status: AvailabilityStatus) {
  return status === "supported" ? "Supported" : status === "partial" ? "Partial" : "Planned";
}

export function UniversityDirectory() {
  const [query, setQuery] = useState("");
  const normalized = normalizeUniversitySearch(query);
  const results = useMemo(
    () => (normalized ? ENTRIES.filter((entry) => entry.searchText.includes(normalized)) : ENTRIES),
    [normalized],
  );

  return (
    <div className="university-directory-page">
      <header className="university-directory-header">
        <a href="/" className="brand-lockup" aria-label="Gapwise home">
          <span className="brand-mark-shell">
            <img src="/logo-mark.svg" alt="" aria-hidden="true" />
          </span>
          <span>Gapwise</span>
        </a>
        <nav aria-label="Public product pages">
          <a href="/about">About</a>
          <a href="/developers">Developers</a>
          <a href="https://docs.gapwise.ca">Docs</a>
        </nav>
        <a className="button-primary" href="/">
          Open Gapwise <ArrowRight aria-hidden="true" />
        </a>
      </header>

      <main>
        <section
          className="university-directory-intro"
          aria-labelledby="university-directory-title"
        >
          <p>Campus editions across North America</p>
          <h1 id="university-directory-title">Explore Gapwise universities.</h1>
          <div>
            <span>{UNIVERSITY_COUNT} universities</span>
            <span>{CAMPUS_COUNT} distinct child campuses</span>
            <span>Supported, partial, and planned</span>
          </div>
        </section>

        <label className="university-directory-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search universities and campuses</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by university, abbreviation, campus, city, alias, or hostname"
          />
          <em>
            {results.length} result{results.length === 1 ? "" : "s"}
          </em>
        </label>

        <section
          className="university-directory-grid"
          aria-live="polite"
          aria-label="Gapwise university directory"
        >
          {results.map((entry) => (
            <a
              key={`${entry.kind}-${entry.id}`}
              href={entry.href}
              style={{ "--directory-accent": entry.university.accentColor } as CSSProperties}
            >
              <div className="university-directory-card-top">
                <span>{entry.kind === "campus" ? "Campus edition" : entry.university.country}</span>
                <em data-status={entry.status}>{statusLabel(entry.status)}</em>
              </div>
              <strong>{entry.name}</strong>
              <p>
                <MapPinned aria-hidden="true" />
                {entry.location} · {entry.scope}
              </p>
              <small>{entry.host}</small>
              <ArrowRight className="university-directory-arrow" aria-hidden="true" />
            </a>
          ))}
          {results.length === 0 ? (
            <div className="university-directory-empty">
              No university or campus matches “{query}”. Try an abbreviation, city, or hostname.
            </div>
          ) : null}
        </section>

        <section className="university-directory-note">
          <h2>Planned means the edition is real, not that unsupported data exists.</h2>
          <p>
            Every planned edition has institution-specific context and accurate canonical metadata.
            Timetable import, building data, campus search, and routing stay visibly planned until
            each capability is backed by verified implementation and data.
          </p>
        </section>
      </main>
    </div>
  );
}
