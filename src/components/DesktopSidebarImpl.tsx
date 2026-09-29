import {
  CalendarClock,
  CalendarRange,
  Home,
  LayoutGrid,
  MapPinned,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { activeUniversity } from "@/universities/registry";
import type { Theme } from "@/hooks/use-preferences";
import type { AppDestination } from "@/features/navigation/use-app-navigation";

const destinations = [
  {
    to: "/today",
    destination: "today",
    label: "Today",
    accessibleLabel: "Today",
    icon: CalendarClock,
  },
  {
    to: "/timetable",
    destination: "timetable",
    label: "Timetable",
    accessibleLabel: "Weekly timetable",
    icon: LayoutGrid,
  },
  {
    to: "/gaps",
    destination: "gaps",
    label: "Gap Plan",
    accessibleLabel: "Gap plan",
    icon: CalendarRange,
  },
  {
    to: "/route",
    destination: "route",
    label: "Map",
    accessibleLabel: "Day route",
    icon: MapPinned,
  },
] as const;

/** Desktop-only primary navigation. Mobile retains the integrated bottom navigation. */
export function DesktopSidebar({
  destination,
  arrivalLabel,
  theme,
  onOpenSearch,
  onOpenArrival,
  onOpenAccount,
  onToggleTheme,
}: {
  destination: AppDestination;
  arrivalLabel: string;
  theme: Theme;
  onOpenSearch?: () => void;
  onOpenArrival: () => void;
  onOpenAccount: () => void;
  onToggleTheme: () => void;
}) {
  const darkTheme = theme === "dark";

  return (
    <aside className="desktop-sidebar" aria-label="Desktop navigation">
      <Link to="/" className="desktop-brand" aria-label="Gapwise home">
        <span className="brand-mark-shell">
          <img src="/logo-mark.svg" alt="" aria-hidden="true" />
        </span>
        <span className="inline-flex items-center gap-2">
          <span>Gapwise</span>
          <span className="brand-scope-pill">{activeUniversity()?.shortName ?? "U of T"}</span>
        </span>
      </Link>

      <button
        type="button"
        className="button-secondary desktop-search-trigger mb-3 flex h-9 w-full items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 text-xs text-muted-foreground transition hover:border-border hover:bg-muted/60 hover:text-foreground"
        aria-label="Search campus, buildings, or actions (⌘K)"
        onClick={onOpenSearch}
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Search…</span>
        </span>
        <kbd className="rounded border border-border/80 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <nav role="group" aria-label="View mode">
        {destinations.map((item) => {
          const Icon = item.icon;
          const active = destination === item.destination;
          return (
            <Link
              key={item.destination}
              to={item.to}
              role="button"
              aria-label={item.accessibleLabel}
              aria-pressed={active}
              aria-current={active ? "page" : undefined}
              className="desktop-nav-link"
              style={
                active
                  ? { color: "light-dark(var(--color-primary), var(--color-accent))" }
                  : undefined
              }
            >
              <Icon aria-hidden="true" />
              <span className="desktop-nav-copy">
                <span>{item.label}</span>
                {active && item.destination === "gaps" ? (
                  <small>Tune gap recommendations</small>
                ) : null}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="desktop-sidebar-foot">
        <button
          type="button"
          className="desktop-sidebar-utility"
          aria-label="Campus arrival settings"
          onClick={onOpenArrival}
        >
          <Home aria-hidden="true" />
          <span>{arrivalLabel}</span>
        </button>
        <div className="desktop-account-row">
          <button
            type="button"
            className="desktop-sidebar-utility desktop-account-settings"
            aria-label="Settings (Account settings)"
            onClick={onOpenAccount}
          >
            <Settings aria-hidden="true" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="desktop-theme-toggle"
            onClick={onToggleTheme}
            aria-pressed={darkTheme}
            aria-label={darkTheme ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkTheme ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
