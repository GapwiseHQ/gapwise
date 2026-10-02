import { createFileRoute } from "@tanstack/react-router";
import { activeSite, activeUniversity } from "@/universities/registry";

export const Route = createFileRoute("/_app/")({
  head: () => {
    const university = activeUniversity();
    const site = activeSite();
    const isGlobal = site?.role === "global";
    const editionName = site?.name ?? university?.name ?? "Campus timetable";
    const title = isGlobal
      ? "Gapwise — University Timetable & Campus Navigation"
      : `Gapwise for ${editionName} — Timetable & Campus Navigation`;
    const description = isGlobal
      ? "Gapwise is a free and open-source timetable, campus navigation, and student planning platform for students across multiple Canadian universities."
      : `Gapwise is a free and open-source timetable, campus navigation, and student planning platform for ${editionName} students.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: RouteBoundary,
});

function RouteBoundary() {
  return null;
}
