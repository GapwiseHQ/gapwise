import { activeSite } from "@/universities/registry";
import { GlobalMarketingHome } from "./GlobalMarketingHome";
import type { MarketingLandingProps } from "./MarketingLanding";
import { UniversityMarketingHome } from "./UniversityMarketingHome";

export function MarketingLandingImpl(props: MarketingLandingProps) {
  return activeSite()?.role === "global" ? (
    <GlobalMarketingHome />
  ) : (
    <UniversityMarketingHome {...props} />
  );
}
