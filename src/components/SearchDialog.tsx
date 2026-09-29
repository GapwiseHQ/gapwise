import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  Compass,
  GraduationCap,
  ExternalLink,
  Sliders,
  FileUp,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  searchGapwise,
  type SearchResultItem,
  type SearchCategory,
} from "@/features/search/search-engine";
import { type GapwiseCampusId } from "@/data/campuses";
import type { Meeting } from "@/lib/timetable-types";

type SearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campusId?: GapwiseCampusId | null | undefined;
  meetings?: Meeting[] | undefined;
  onSelectBuilding?: ((code: string | null) => void) | undefined;
  onOpenImport?: (() => void) | undefined;
  onOpenArrival?: (() => void) | undefined;
};

const CATEGORY_TITLES: Record<SearchCategory, string> = {
  buildings: "Campus Buildings",
  courses: "Your Classes",
  actions: "Quick Actions & Navigation",
  universities: "Switch University",
};

export function SearchDialog({
  open,
  onOpenChange,
  campusId,
  meetings,
  onSelectBuilding,
  onOpenImport,
  onOpenArrival,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Reset query when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const searchResults = useMemo(() => {
    return searchGapwise(query, { campusId, meetings });
  }, [query, campusId, meetings]);

  const groupedResults = useMemo(() => {
    const groups: Partial<Record<SearchCategory, SearchResultItem[]>> = {};
    for (const item of searchResults) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category]!.push(item);
    }
    return groups;
  }, [searchResults]);

  const handleSelect = (item: SearchResultItem) => {
    onOpenChange(false);

    if (item.category === "buildings" && item.data.buildingCode) {
      if (onSelectBuilding) {
        onSelectBuilding(item.data.buildingCode);
      }
      void navigate({
        to: "/route",
        search: { building: item.data.buildingCode },
      });
      return;
    }

    if (item.category === "courses") {
      void navigate({ to: "/timetable" });
      return;
    }

    if (item.category === "actions") {
      if (item.data.actionId === "import") {
        if (onOpenImport) onOpenImport();
        return;
      }
      if (item.data.actionId === "campus" || item.data.actionId === "arrival") {
        if (onOpenArrival) onOpenArrival();
        return;
      }
      if (item.data.url) {
        if (item.data.url.startsWith("http")) {
          window.open(item.data.url, "_blank", "noopener,noreferrer");
        } else {
          void navigate({ to: item.data.url });
        }
      }
      return;
    }

    if (item.category === "universities" && item.data.url) {
      window.location.href = item.data.url;
    }
  };

  const getIcon = (item: SearchResultItem) => {
    switch (item.category) {
      case "buildings":
        return <Building2 className="mr-2 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />;
      case "courses":
        return <GraduationCap className="mr-2 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />;
      case "universities":
        return (
          <ExternalLink
            className="mr-2 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        );
      case "actions":
        if (item.data.actionId === "import") {
          return <FileUp className="mr-2 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />;
        }
        if (item.data.actionId === "route") {
          return <Compass className="mr-2 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />;
        }
        if (item.data.actionId === "today") {
          return <Clock className="mr-2 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />;
        }
        if (item.data.actionId === "timetable") {
          return <Calendar className="mr-2 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />;
        }
        if (item.data.actionId === "settings") {
          return (
            <Sliders className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          );
        }
        return <Sparkles className="mr-2 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search campus buildings, classes, actions, or universities… (⌘K)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[60vh] overflow-y-auto p-2">
        <CommandEmpty>
          <div className="py-6 text-center text-sm text-muted-foreground">
            No matching campus buildings, classes, or actions found.
          </div>
        </CommandEmpty>

        {(["buildings", "courses", "actions", "universities"] as SearchCategory[]).map(
          (category) => {
            const items = groupedResults[category];
            if (!items || items.length === 0) return null;

            return (
              <CommandGroup key={category} heading={CATEGORY_TITLES[category]}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle ?? ""} ${item.badge ?? ""}`}
                    onSelect={() => handleSelect(item)}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent/10 focus:bg-accent/15"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {getIcon(item)}
                      <div className="flex flex-col overflow-hidden text-left">
                        <span className="truncate font-medium text-foreground">{item.title}</span>
                        {item.subtitle ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {item.badge ? (
                      <span className="ml-2 shrink-0 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          },
        )}
      </CommandList>
    </CommandDialog>
  );
}
