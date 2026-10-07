import type { User } from "@supabase/supabase-js";
import { Building2, BusFront, CarFront, Home, MapPin } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { CAMPUS_SHORT_LABELS, type GapwiseCampusId } from "@/data/campuses";
import {
  campusResidenceBuildings,
  getResidenceBuildingForCampus,
} from "@/data/campuses/residence-registry";
import {
  campusAccessPointsFor,
  getCampusAccessPoint,
  type CampusAccessKind,
} from "@/data/utm/campus-access-points";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CampusSelector } from "@/components/CampusSelector";
import { sanitizeUserPreferences, type UserPreferences } from "./preferences";
import { activeUniversity, selectableCampusesForUniversity } from "@/universities/registry";

type ArrivalOption = {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  dayOrigin: UserPreferences["dayOrigin"];
  commuteMode: CampusAccessKind | null;
};

const ARRIVAL_OPTIONS: ArrivalOption[] = [
  {
    label: "Live on campus",
    description: "Route from residence.",
    icon: Building2,
    dayOrigin: "residence",
    commuteMode: null,
  },
  {
    label: "Public transit",
    description: "Start at a transit stop.",
    icon: BusFront,
    dayOrigin: "commute",
    commuteMode: "transit",
  },
  {
    label: "Drive / park",
    description: "Start at your parking lot.",
    icon: CarFront,
    dayOrigin: "commute",
    commuteMode: "parking",
  },
  {
    label: "Drop-off / pick-up",
    description: "Use a verified handoff point.",
    icon: MapPin,
    dayOrigin: "commute",
    commuteMode: "pickup",
  },
];

export function ResidenceSettings({
  user,
  preferences,
  onPreferencesChange,
  openRequest = 0,
}: {
  user: User | null;
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
  /** Monotonic app-shell action token used by surfaces outside this trigger. */
  openRequest?: number;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const residences = preferences.mainCampus ? campusResidenceBuildings(preferences.mainCampus) : [];
  const selectedResidence = preferences.mainCampus
    ? getResidenceBuildingForCampus(preferences.mainCampus, preferences.residenceBuildingCode)
    : null;
  const selectedAccessPoint =
    preferences.mainCampus === "utm" ? getCampusAccessPoint(preferences.campusAccessPointId) : null;
  const activeOption = ARRIVAL_OPTIONS.find(
    (option) =>
      option.dayOrigin === preferences.dayOrigin &&
      (option.dayOrigin === "residence" || option.commuteMode === preferences.commuteMode),
  );

  function update(patch: Partial<UserPreferences>) {
    onPreferencesChange(sanitizeUserPreferences({ ...preferences, ...patch }));
    setMessage(
      user ? "Updated. Encrypted sync will include this setting." : "Updated for this visit.",
    );
  }

  function selectMainCampus(mainCampus: GapwiseCampusId) {
    const nextResidences = campusResidenceBuildings(mainCampus);
    update({
      mainCampus,
      residenceBuildingCode:
        preferences.dayOrigin === "residence" ? (nextResidences[0]?.code ?? null) : null,
      campusAccessPointId: null,
    });
  }

  function selectOption(option: ArrivalOption) {
    if (option.dayOrigin === "residence") {
      update({
        dayOrigin: "residence",
        residenceBuildingCode:
          (preferences.mainCampus &&
            getResidenceBuildingForCampus(preferences.mainCampus, preferences.residenceBuildingCode)
              ?.code) ??
          residences[0]?.code ??
          null,
        commuteMode: null,
        campusAccessPointId: null,
      });
      return;
    }
    update({
      dayOrigin: "commute",
      residenceBuildingCode: null,
      commuteMode: option.commuteMode,
      campusAccessPointId: null,
    });
  }

  const university = activeUniversity();
  const campusIds = (university ? selectableCampusesForUniversity(university) : []) as GapwiseCampusId[];
  const isSingleCampus = campusIds.length <= 1;

  const points =
    preferences.mainCampus === "utm" && preferences.commuteMode
      ? campusAccessPointsFor(preferences.commuteMode)
      : [];
  const triggerLabel =
    selectedResidence?.code || selectedAccessPoint?.label
      ? `${preferences.mainCampus ? (CAMPUS_SHORT_LABELS[preferences.mainCampus] ?? "Campus") : "Campus"} · ${selectedResidence?.code ?? selectedAccessPoint?.label}`
      : isSingleCampus
        ? (selectedResidence?.code ?? "Arrival")
        : preferences.mainCampus
          ? (CAMPUS_SHORT_LABELS[preferences.mainCampus] ?? "Campus")
          : "Choose campus";

  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="button-secondary inline-flex min-h-9 items-center gap-2 px-3 text-sm font-medium"
          aria-label="Campus arrival settings"
        >
          <Home className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className="hidden max-w-28 truncate sm:inline">{triggerLabel}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="residence-settings-dialog glass-panel mx-4 w-[calc(100%-2rem)] max-w-xl rounded-xl border-border/80 shadow-none">
        <DialogHeader className="pr-8">
          <DialogTitle>Where does your campus day start?</DialogTitle>
          <DialogDescription>
            Gapwise only stores where your campus walk begins — not your home address.
          </DialogDescription>
        </DialogHeader>

        {!isSingleCampus ? (
          <fieldset>
            <legend className="text-sm font-medium">Main campus</legend>
            <CampusSelector
              campusIds={campusIds}
              activeCampusId={preferences.mainCampus as GapwiseCampusId}
              onSelectCampus={(campus) => selectMainCampus(campus)}
              variant="adaptive-bar"
              className="mt-2"
              ariaLabel="Main campus"
            />
          </fieldset>
        ) : null}

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Campus day origin">
          {ARRIVAL_OPTIONS.map((option) => {
            const Icon = option.icon;
            const checked = option === activeOption;
            return (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => selectOption(option)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  checked
                    ? "border-accent/60 bg-accent/10"
                    : "border-border bg-card/80 hover:bg-muted/60"
                }`}
              >
                <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                <span className="mt-2 block text-sm font-semibold">{option.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {preferences.dayOrigin === "residence" ? (
          <label className="text-sm font-medium" htmlFor="residence-building">
            Residence building
            <select
              id="residence-building"
              value={preferences.residenceBuildingCode ?? residences[0]?.code ?? ""}
              onChange={(event) =>
                update({
                  dayOrigin: "residence",
                  residenceBuildingCode: event.target.value || null,
                })
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
            >
              {residences.map((building) => (
                <option key={building.code} value={building.code}>
                  {building.name} ({building.code})
                </option>
              ))}
            </select>
            <span className="mt-2 block text-xs font-normal leading-relaxed text-muted-foreground">
              {preferences.mainCampus
                ? `Residence approaches for ${CAMPUS_SHORT_LABELS[preferences.mainCampus] ?? "campus"} come from verified campus data. Unverified doors are clearly marked in route details.`
                : "Choose a campus before selecting a residence."}
            </span>
          </label>
        ) : preferences.mainCampus &&
          preferences.mainCampus !== "utm" &&
          preferences.commuteMode ? (
          <p className="rounded-lg border border-border bg-muted/45 p-3 text-sm text-muted-foreground">
            Verified{" "}
            {preferences.mainCampus ? CAMPUS_SHORT_LABELS[preferences.mainCampus] : "campus"}{" "}
            arrival points aren&apos;t mapped yet. Your main campus is still saved.
          </p>
        ) : preferences.commuteMode === "pickup" && points.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/45 p-3 text-sm text-muted-foreground">
            Verified pickup/drop-off handoff points aren&apos;t mapped yet.
          </p>
        ) : preferences.commuteMode ? (
          <label className="text-sm font-medium" htmlFor="campus-access-point">
            Campus arrival point
            <select
              id="campus-access-point"
              value={preferences.campusAccessPointId ?? ""}
              onChange={(event) => update({ campusAccessPointId: event.target.value || null })}
              className="mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
            >
              <option value="">Choose a verified point</option>
              {points.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.label}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-xs font-normal leading-relaxed text-muted-foreground">
              This is the on-campus point where walking directions begin and end.
            </span>
          </label>
        ) : (
          <p className="rounded-lg border border-border bg-muted/45 p-3 text-sm text-muted-foreground">
            Choose how you arrive to add the start and end of your campus day.
          </p>
        )}

        <p className="border-t border-border pt-4 text-xs text-muted-foreground">
          {user
            ? "This private setting is included in encrypted private-data sync."
            : "Guest settings stay in this page session. Sign in to sync private settings across devices."}
        </p>
        {message ? (
          <p className="text-xs text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
