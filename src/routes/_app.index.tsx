import { createFileRoute } from "@tanstack/react-router";
import {
  activeSite,
  activeUniversity,
  canonicalUrlForSite,
  marketingForSite,
} from "@/universities/registry";

export const Route = createFileRoute("/_app/")({
  head: () => {
    const university = activeUniversity();
    const site = activeSite();
    const isGlobal = !site || site.role === "global" || site.role === "reserved";
    const marketing = marketingForSite(site, university);
    const title = isGlobal
      ? "Gapwise — University Timetable & Campus Navigation"
      : (marketing?.seoTitle ?? "Gapwise — University Timetable & Campus Navigation");
    const description = isGlobal
      ? "Gapwise is a free and open-source timetable, campus navigation, and student planning platform for students across multiple Canadian universities."
      : (marketing?.seoDescription ??
        "Gapwise connects university timetables, campus search, and pedestrian routing.");
    const canonical = canonicalUrlForSite(site);
    const image = isGlobal
      ? `${canonical}og-gapwise.png`
      : site?.role === "campus-edition"
        ? `${canonical}campuses/${site.campusId}/og-card.png`
        : `${canonical}universities/${university?.id}/og-card.png`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        ...(site?.role === "reserved" ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: RouteBoundary,
});

function RouteBoundary() {
  return null;
}
