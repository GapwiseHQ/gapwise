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

  const interactive = `light-dark(color-mix(in oklab, ${accent} 64%, black), color-mix(in oklab, ${accent} 72%, white))`;
  const interactiveForeground = "light-dark(white, #0d1117)";
  const properties = {
    "--accent": interactive,
    "--accent-foreground": interactiveForeground,
    "--primary": interactive,
    "--primary-foreground": interactiveForeground,
    "--ring": interactive,
    "--hero-accent": interactive,
    "--sidebar-primary": interactive,
    "--sidebar-primary-foreground": interactiveForeground,
    "--sidebar-ring": interactive,
    "--landing-chrome-accent": interactive,
  };

  for (const [property, value] of Object.entries(properties)) {
    root.style.setProperty(property, value);
  }
  root.dataset["gapwiseAccent"] = accent;
}
