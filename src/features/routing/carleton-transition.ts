import { carletonCampus } from "@/universities/carleton/adapter";
import {
  createOutdoorCampusTransitionPlanner,
  getOutdoorCampusTransitionPlanner,
} from "./campus-transition";
import type { TransitionPlanner } from "./transition";

export {
  createOutdoorCampusTransitionPlanner,
  getOutdoorCampusTransitionPlanner,
} from "./campus-transition";

export const planOutdoorCampusTransition = createOutdoorCampusTransitionPlanner(carletonCampus);

/** One planner contract powers Today, gaps, timetable and map route segments. */
export function createCarletonTransitionPlanner(): TransitionPlanner {
  return planOutdoorCampusTransition;
}
