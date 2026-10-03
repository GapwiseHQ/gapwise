import { useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { UTM_ROUTING_GRAPH } from "@/data/utm/campus";
import {
  createScheduleTransitionPlanner,
  type TransitionPlanner,
} from "@/features/routing/transition";
import { activeCampus, activeUniversity, universityByCampus } from "@/universities/registry";
import { chooseDefaultTerm } from "@/lib/calendar-awareness";
import { findGaps } from "@/lib/gaps";
import { availableScheduleTerms, composeTermSchedule } from "@/lib/personal-scheduler";
import { inferredCampusForMeetings, type Meeting, type Term } from "@/lib/timetable-types";

const EMPTY_MEETINGS: Meeting[] = [];

/** Owns the selected-term facts shared by responsive timetable, Today, and gap views. */
export function useSelectedScheduleContext(meetings: Meeting[] | null) {
  const inferredCampus = inferredCampusForMeetings(meetings ?? EMPTY_MEETINGS)?.toLowerCase();
  const currentCampus = (inferredCampus ?? activeCampus() ?? "").toLowerCase();
  const university =
    activeUniversity() ?? (currentCampus ? (universityByCampus(currentCampus) ?? null) : null);
  const universityId = university?.id;

  const isOutdoorCampus = Boolean(
    (universityId && universityId !== "uoft" && university?.enabledFeatures.routing) ||
    (universityId === "uoft" && (currentCampus === "utsg" || currentCampus === "utsc")),
  );
  const routingCampusKey =
    universityId === "uoft" ? currentCampus : (universityId ?? currentCampus);

  const [outdoorPlanner, setOutdoorPlanner] = useState<TransitionPlanner | null>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [term, setTerm] = useState<Term>("Fall");
  const terms = useMemo(() => availableScheduleTerms(meetings ?? EMPTY_MEETINGS), [meetings]);
  const todayRoute = pathname.replace(/\/+$/, "") === "/today";

  useEffect(() => {
    if (terms.length > 0 && !terms.includes(term)) setTerm(terms[0]!);
  }, [terms, term]);

  useEffect(() => {
    if (meetings?.length) setTerm(chooseDefaultTerm(meetings, new Date()));
  }, [meetings]);

  useEffect(() => {
    if (todayRoute && meetings?.length) setTerm(chooseDefaultTerm(meetings, new Date()));
  }, [meetings, todayRoute]);

  useEffect(() => {
    if (!isOutdoorCampus || !routingCampusKey) {
      setOutdoorPlanner(null);
      return;
    }
    let current = true;
    void import("@/features/routing/campus-transition").then(
      ({ getOutdoorCampusTransitionPlanner }) => {
        getOutdoorCampusTransitionPlanner(routingCampusKey).then((planner) => {
          if (current) setOutdoorPlanner(() => planner);
        });
      },
    );
    return () => {
      current = false;
    };
  }, [isOutdoorCampus, routingCampusKey]);

  const schedule = useMemo(
    () => composeTermSchedule(meetings ?? EMPTY_MEETINGS, [], term),
    [meetings, term],
  );
  const gaps = useMemo(() => findGaps(schedule, term), [schedule, term]);
  const planTransition = useMemo(() => {
    const unavailable = (message: string) => () => ({
      status: "unavailable" as const,
      message,
      accuracy: "Location unavailable" as const,
      result: null,
      displayCoordinates: [],
      warnings: [],
      approximateDistanceMeters: null,
      approximateSeconds: null,
    });
    if (!currentCampus) {
      return unavailable("Choose a campus before planning this route.");
    }
    if (isOutdoorCampus) {
      return outdoorPlanner ?? unavailable("Campus routes are loading.");
    }
    if (universityId === "uoft" && currentCampus !== "utm") {
      return unavailable("Choose a single U of T campus before planning this route.");
    }
    return createScheduleTransitionPlanner(UTM_ROUTING_GRAPH, meetings ?? EMPTY_MEETINGS);
  }, [currentCampus, meetings, isOutdoorCampus, outdoorPlanner, universityId]);

  return { term, setTerm, terms, schedule, gaps, planTransition };
}
