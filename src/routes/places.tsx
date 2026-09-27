import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, MapPinned } from "lucide-react";
import { listCampusPlaces } from "@/features/campus-state/snapshot";
import { activeUniversity } from "@/universities/registry";

export const Route = createFileRoute("/places")({
  head: () => {
    const university = activeUniversity();
    const isUoft = university?.id === "uoft";
    return {
      meta: [
        { title: isUoft ? "UTM Campus Places — Gapwise" : "Campus Places — Gapwise" },
        {
          name: "description",
          content: isUoft
            ? "Source-backed UTM dining, study, service and recreation places."
            : `Explore campus maps and available place coverage for ${university?.name ?? "supported universities"}.`,
        },
      ],
    };
  },
  component: PlacesPage,
});

function PlacesPage() {
  const university = activeUniversity();
  if (university?.id !== "uoft") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold">Campus places</h1>
        <p className="mt-4 text-muted-foreground">
          Place listings are not available for {university?.name ?? "this edition"} yet. Explore the
          campus map for source-backed building information.
        </p>
        <Link to="/campus-map" className="button-primary mt-6 inline-flex px-4 py-2">
          Explore campus map
        </Link>
      </main>
    );
  }
  const places = listCampusPlaces();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="app-nav sticky top-0 z-30 border-b" data-scrolled="true">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-semibold">
            Gapwise <span className="brand-scope-pill">U of T</span>
          </Link>
          <Link to="/today" className="button-secondary px-3 py-2 text-sm font-semibold">
            Today
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow text-accent">Campus intelligence</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Places at UTM
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Source-backed places with explicit freshness. Unknown hours stay unknown—Gapwise never
          turns missing live data into “closed.”
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {places.map((place) => (
            <Link
              key={place.id}
              to="/places/$placeId"
              params={{ placeId: place.id }}
              className="surface group flex min-h-52 flex-col p-5 transition hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold capitalize text-accent">
                  {place.kind}
                </span>
                <MapPinned className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold">{place.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{place.summary}</p>
              <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-accent">
                View practical details{" "}
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
