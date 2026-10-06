import * as React from "react";
import { Check, ChevronsUpDown, ArrowRight, Search } from "lucide-react";
import { type GapwiseCampusId, CAMPUS_SHORT_LABELS, CAMPUS_LABELS } from "@/data/campuses";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface CampusSelectorProps {
  campusIds: GapwiseCampusId[];
  activeCampusId?: GapwiseCampusId | null;
  onSelectCampus: (campusId: GapwiseCampusId) => void;
  variant?: "adaptive-bar" | "cards-grid";
  className?: string;
  ariaLabel?: string;
}

export function CampusSelector({
  campusIds,
  activeCampusId,
  onSelectCampus,
  variant = "adaptive-bar",
  className = "",
  ariaLabel = "Campus map",
}: CampusSelectorProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [filterQuery, setFilterQuery] = React.useState("");
  const activePillRef = React.useRef<HTMLButtonElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  // Automatically scroll the active pill into view within the horizontal track
  React.useEffect(() => {
    if (activePillRef.current && trackRef.current) {
      activePillRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeCampusId]);

  // Compute filtered campuses unconditionally at the top
  const filteredCampuses = React.useMemo(() => {
    if (!campusIds || campusIds.length === 0) return [];
    if (!filterQuery.trim()) return campusIds;
    const q = filterQuery.toLowerCase();
    return campusIds.filter((id) => {
      const short = (CAMPUS_SHORT_LABELS[id] ?? id).toLowerCase();
      const full = (CAMPUS_LABELS[id] ?? id).toLowerCase();
      return short.includes(q) || full.includes(q) || id.toLowerCase().includes(q);
    });
  }, [campusIds, filterQuery]);

  if (!campusIds || campusIds.length === 0) {
    return null;
  }

  // Cards grid variant: used in fallback screens or full selection states
  if (variant === "cards-grid") {
    return (
      <div
        className={`flex flex-wrap items-center justify-center gap-2 max-w-xl ${className}`}
        role="group"
        aria-label={ariaLabel}
      >
        {campusIds.map((campus) => {
          const isSelected = activeCampusId === campus;
          const shortLabel = CAMPUS_SHORT_LABELS[campus] ?? campus;
          const fullLabel = CAMPUS_LABELS[campus] ?? campus;

          return (
            <button
              key={campus}
              type="button"
              onClick={() => onSelectCampus(campus)}
              aria-pressed={isSelected}
              title={fullLabel !== shortLabel ? fullLabel : undefined}
              className={`button-secondary min-h-11 px-3.5 py-2 font-mono text-xs font-bold tracking-[0.06em] transition-colors ${
                isSelected ? "bg-accent text-accent-foreground border-accent shadow-xs" : ""
              }`}
            >
              {shortLabel}
            </button>
          );
        })}
      </div>
    );
  }

  const hasManyCampuses = campusIds.length > 3;

  return (
    <div
      className={`relative flex items-center gap-1 rounded-xl border border-border bg-popover/96 p-1 shadow-lg backdrop-blur ${className}`}
    >
      <div
        ref={trackRef}
        role="group"
        aria-label={ariaLabel}
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth px-0.5 py-0.5"
      >
        {campusIds.map((campus) => {
          const isActive = activeCampusId === campus;
          const shortLabel = CAMPUS_SHORT_LABELS[campus] ?? campus;

          return (
            <button
              key={campus}
              ref={isActive ? activePillRef : null}
              type="button"
              onClick={() => onSelectCampus(campus)}
              aria-pressed={isActive}
              className={`min-h-8 shrink-0 rounded-lg px-2.5 py-1.5 font-mono text-[0.7rem] sm:text-xs font-bold tracking-[0.05em] whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {shortLabel}
            </button>
          );
        })}
      </div>

      {hasManyCampuses ? (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`All campuses (${campusIds.length})`}
              title="All campuses"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={6}
            className="w-72 max-w-[calc(100vw-2rem)] p-2 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between px-1.5 pt-0.5 pb-1">
              <span className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Select Campus
              </span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {campusIds.length} campuses
              </span>
            </div>

            {campusIds.length >= 5 ? (
              <div className="relative mb-2">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Filter campuses…"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-background/80 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                />
              </div>
            ) : null}

            <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
              {filteredCampuses.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  No matching campus found.
                </p>
              ) : (
                filteredCampuses.map((campus) => {
                  const isSelected = activeCampusId === campus;
                  const shortLabel = CAMPUS_SHORT_LABELS[campus] ?? campus;
                  const fullLabel = CAMPUS_LABELS[campus] ?? campus;

                  return (
                    <button
                      key={campus}
                      type="button"
                      onClick={() => {
                        onSelectCampus(campus);
                        setPopoverOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors ${
                        isSelected
                          ? "bg-accent/15 text-accent-foreground font-semibold"
                          : "text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 flex-col pr-2">
                        <span className="truncate text-xs font-medium">{shortLabel}</span>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {fullLabel}
                        </span>
                      </div>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
