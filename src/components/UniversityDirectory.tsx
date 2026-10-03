import { ArrowRight, MapPinned, Search } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import {
  normalizeUniversitySearch,
  universityDirectoryEntries,
  type AvailabilityStatus,
} from "@/universities/registry";
import "./university-directory.css";

const ENTRIES = universityDirectoryEntries();
const UNIVERSITIES = ENTRIES.filter((entry) => entry.kind === "university");
const UNIVERSITY_COUNT = UNIVERSITIES.length;

function directUniversityMatch(entry: (typeof ENTRIES)[number], query: string) {
  return normalizeUniversitySearch(
    [
      entry.id,
      entry.name,
      entry.shortName,
      entry.scope,
      entry.location,
      entry.host,
      ...entry.university.aliases,
    ].join(" "),
  ).includes(query);
}

function statusLabel(status: AvailabilityStatus) {
  return status === "supported" ? "Supported" : status === "partial" ? "Partial" : "Planned";
}

export function UniversityDirectory() {
  const [query, setQuery] = useState("");
  const normalized = normalizeUniversitySearch(query);
  const results = useMemo(() => {
    if (!normalized) return UNIVERSITIES;
    return UNIVERSITIES.flatMap((universityEntry) => {
      if (directUniversityMatch(universityEntry, normalized)) return [universityEntry];
      return ENTRIES.filter(
        (entry) =>
          entry.kind === "campus" &&
          entry.university.id === universityEntry.id &&
          entry.searchText.includes(normalized),
      );
    });
  }, [normalized]);
  const countries = ["Canada", "United States"] as const;

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
            <span>Timetable import at every university</span>
            <span>Maps clearly marked by coverage</span>
          </div>
        </section>

        <label className="university-directory-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search universities and campuses</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search university, campus, or city"
          />
          <em>
            {results.length} result{results.length === 1 ? "" : "s"}
          </em>
        </label>

        <div aria-live="polite" aria-label="Gapwise university directory">
          {countries.map((country) => {
            const entries = results.filter((entry) => entry.university.country === country);
            if (!entries.length) return null;
            return (
              <section className="university-directory-group" key={country}>
                <h2>
                  {country} <span>{entries.length}</span>
                </h2>
                <div className="university-directory-grid">
                  {entries.map((entry) => (
                    <a
                      key={`${entry.kind}-${entry.id}`}
                      href={entry.href}
                      style={
                        { "--directory-accent": entry.university.accentColor } as CSSProperties
                      }
                    >
                      <div className="university-directory-card-top">
                        <span>{entry.kind === "campus" ? "Campus match" : entry.shortName}</span>
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
                </div>
              </section>
            );
          })}
          {results.length === 0 ? (
            <div className="university-directory-empty">
              No university or campus matches “{query}”. Try an abbreviation or city.
            </div>
          ) : null}
        </div>

        <section className="university-directory-note">
          <h2>Timetables work independently from campus maps.</h2>
          <p>
            Every university listed here can import its supported schedule or calendar format.
            Building data, campus search, and routing stay clearly labeled until each campus has
            source-backed coverage.
          </p>
        </section>
      </main>
    </div>
  );
}
