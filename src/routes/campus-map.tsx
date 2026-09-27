import { createFileRoute } from "@tanstack/react-router";
import { PublicFeaturePage } from "@/components/PublicFeaturePage";
import { PUBLIC_FEATURE_PAGES, editionFeatureMetadata } from "@/content/public-feature-pages";
import { activeUniversity } from "@/universities/registry";

const page = PUBLIC_FEATURE_PAGES.map;

export const Route = createFileRoute("/campus-map")({
  head: () => {
    const { seoTitle, description } = editionFeatureMetadata(
      page,
      activeUniversity()?.name ?? "University of Toronto",
    );
    return { meta: [{ title: seoTitle }, { name: "description", content: description }] };
  },
  component: () => <PublicFeaturePage page={page} />,
});
