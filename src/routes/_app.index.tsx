import { createFileRoute } from "@tanstack/react-router";
import {
  activeSite,
  activeUniversity,
  canonicalUrlForSite,
  campusForSite,
  marketingForSite,
} from "@/universities/registry";

export const Route = createFileRoute("/_app/")({
  head: () => {
    const university = activeUniversity();
    const site = activeSite();
    const isGlobal = !site || site.role === "global";
    const marketing = marketingForSite(site, university);
    const campus = campusForSite(site);
    const title = isGlobal
      ? "Gapwise — University Timetable & Campus Navigation"
      : (marketing?.seoTitle ?? "Gapwise — University Timetable & Campus Navigation");
    const description = isGlobal
      ? "Gapwise is a free and open-source timetable, campus navigation, and student planning platform."
      : (marketing?.seoDescription ??
        "Gapwise connects university timetables, campus search, and pedestrian routing.");
    const canonical = canonicalUrlForSite(site);
    const usesGlobalArtwork =
      campus?.status === "planned" ||
      university?.status === "planned" ||
      university?.dataPaths.length === 0;
    const hasDedicatedCampusCard =
      site?.campusId && ["utm", "utsg", "utsc"].includes(site.campusId);
    const image =
      isGlobal || usesGlobalArtwork
        ? `${canonical}og-gapwise.png`
        : site?.role === "campus-edition" && hasDedicatedCampusCard
          ? `${canonical}campuses/${site.campusId}/og-card.png`
          : `${canonical}universities/${university?.id}/og-card.png`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: RouteBoundary,
});

function RouteBoundary() {
  return null;
}
