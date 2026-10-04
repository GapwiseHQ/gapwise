import type { SiteDefinition, University } from "./registry";

export function accentForSite(
  site: SiteDefinition | null,
  university: University | null,
): string | null {
  return site?.presentation?.accentColor ?? university?.accentColor ?? null;
}

export function applyUniversityTheme(
  root: HTMLElement,
  site: SiteDefinition | null,
  university: University | null,
) {
  const accent = accentForSite(site, university);
  if (!accent || site?.role === "global") return;

  const primary = `color-mix(in oklab, ${accent} 76%, black)`;
  const properties = {
    "--accent": accent,
    "--primary": primary,
    "--ring": accent,
    "--hero-accent": accent,
    "--sidebar-primary": primary,
    "--sidebar-ring": accent,
    "--landing-chrome-accent": accent,
  };

  for (const [property, value] of Object.entries(properties)) {
    root.style.setProperty(property, value);
  }
  root.dataset["gapwiseAccent"] = accent;
}
