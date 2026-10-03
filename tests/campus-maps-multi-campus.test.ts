import { describe, expect, test } from "bun:test";
import {
  ensureCampusCatalog,
  gapwiseCampusIdForCampus,
  campusBuildingConfigurations,
  campusFootprintCollection,
  getBuildingFootprintForCampus,
  resolveCampusBuildingLocation,
  campusCameraBounds,
  campusCenter,
  CAMPUS_LABELS,
  CAMPUS_SHORT_LABELS,
} from "@/data/campuses";
import {
  getOutdoorCampusTransitionPlanner,
  OUTDOOR_CAMPUS_LOADERS,
} from "@/features/routing/campus-transition";
import { inferImportedCampus } from "@/universities/common/campus-inference";
import { resolveMeetingLocation } from "@/features/routing/location-resolver";
import { inferredCampusForMeetings, type Meeting } from "@/lib/timetable-types";
import {
  CAMPUSES,
  UNIVERSITIES,
  campusById,
  universityByCampus,
  universityById,
} from "@/universities/registry";
import { loadDemoTimetable } from "@/universities/timetable-adapters";
import { UTM_ROUTING_GRAPH } from "@/data/utm/campus";
import { createScheduleTransitionPlanner } from "@/features/routing/transition";
import manifest from "../universities.json" with { type: "json" };

describe("Campus Maps and Timetable Inference for All Supported Campuses", () => {
  const supportedCampuses = manifest.campuses.filter((c) => c.status === "supported");

  test("all 16 supported campuses have accurate bounds, footprints, and configurations", async () => {
    expect(supportedCampuses).toHaveLength(16);

    for (const campus of supportedCampuses) {
      await ensureCampusCatalog(campus.id);

      const resolvedId = gapwiseCampusIdForCampus(campus.id);
      expect(resolvedId).toBe(campus.id);

      const configs = campusBuildingConfigurations(campus.id);
      expect(configs.length).toBeGreaterThan(0);

      const footprints = campusFootprintCollection(campus.id);
      expect(footprints.features.length).toBeGreaterThan(0);

      const bounds = campusCameraBounds(campus.id);
      expect(bounds).toBeDefined();
      const [[west, south], [east, north]] = bounds;
      expect(west).toBeLessThan(east);
      expect(south).toBeLessThan(north);
      // Valid coordinate ranges (not world fallback [-180, -90], [180, 90])
      expect(west).toBeGreaterThan(-180);
      expect(east).toBeLessThan(180);
      expect(south).toBeGreaterThan(-90);
      expect(north).toBeLessThan(90);

      const center = campusCenter(campus.id);
      expect(center[0]).toBeGreaterThan(west);
      expect(center[0]).toBeLessThan(east);
      expect(center[1]).toBeGreaterThan(south);
      expect(center[1]).toBeLessThan(north);

      expect(CAMPUS_LABELS[campus.id]).toBeTruthy();
      expect(CAMPUS_SHORT_LABELS[campus.id]).toBeTruthy();
    }
  });

  test("timetable events resolve to the correct campus and building footprint", async () => {
    // 1. Laurier: LH (Lazaridis Hall) must resolve on waterloo campus (Laurier), NOT University of Waterloo
    await ensureCampusCatalog("waterloo");
    const laurierFootprint = getBuildingFootprintForCampus("waterloo", "LH");
    expect(laurierFootprint).not.toBeNull();
    expect(laurierFootprint?.properties.buildingCode).toBe("LH");

    const laurierMeeting: Meeting = {
      id: "laurier-1",
      universityId: "laurier",
      courseCode: "BU 111",
      buildingCode: "LH",
      room: "1001",
      campus: "WATERLOO",
      weekday: "Monday",
      startTime: 600,
      endTime: 660,
      term: "Fall",
      locationType: "physical",
      locationUnknown: false,
    };
    const laurierLoc = resolveMeetingLocation(laurierMeeting);
    expect(laurierLoc.status).toBe("known");
    expect(laurierLoc.buildingCode).toBe("LH");

    // 2. Waterloo: AL (Arts Lecture Hall) must resolve on waterloo-main campus
    await ensureCampusCatalog("waterloo-main");
    const waterlooFootprint = getBuildingFootprintForCampus("waterloo-main", "AL");
    expect(waterlooFootprint).not.toBeNull();
    expect(waterlooFootprint?.properties.buildingCode).toBe("AL");

    const waterlooMeeting: Meeting = {
      id: "waterloo-1",
      universityId: "waterloo",
      courseCode: "CS 135",
      buildingCode: "AL",
      room: "116",
      campus: "WATERLOO-MAIN",
      weekday: "Monday",
      startTime: 600,
      endTime: 660,
      term: "Fall",
      locationType: "physical",
      locationUnknown: false,
    };
    const waterlooLoc = resolveMeetingLocation(waterlooMeeting);
    expect(waterlooLoc.status).toBe("known");
    expect(waterlooLoc.buildingCode).toBe("AL");

    // 3. York: VH (Vari Hall) must resolve on keele campus
    await ensureCampusCatalog("keele");
    const yorkFootprint = getBuildingFootprintForCampus("keele", "VH");
    expect(yorkFootprint).not.toBeNull();
    expect(yorkFootprint?.properties.buildingCode).toBe("VH");

    // 4. UBC: ACAH (Acadia House) must resolve on ubc-vancouver campus
    await ensureCampusCatalog("ubc-vancouver");
    const ubcFootprint = getBuildingFootprintForCampus("ubc-vancouver", "ACAH");
    expect(ubcFootprint).not.toBeNull();
    expect(ubcFootprint?.properties.buildingCode).toBe("ACAH");

    // 5. McGill: ADAMS (Frank Dawson Adams Building) must resolve on mcgill-downtown campus
    await ensureCampusCatalog("mcgill-downtown");
    const mcgillFootprint = getBuildingFootprintForCampus("mcgill-downtown", "ADAMS");
    expect(mcgillFootprint).not.toBeNull();
    expect(mcgillFootprint?.properties.buildingCode).toBe("ADAMS");

    // 6. U of T: MN (Mississauga), 002 (St. George), A (Scarborough)
    expect(getBuildingFootprintForCampus("utm", "MN")).not.toBeNull();
    expect(getBuildingFootprintForCampus("utsg", "002")).not.toBeNull();
    expect(getBuildingFootprintForCampus("utsc", "A")).not.toBeNull();
  });

  test("multi-campus universities infer the correct campus from meeting evidence", () => {
    // UBC multi-campus inference
    const ubcOkanagan = inferImportedCampus({
      universityId: "ubc",
      courseCode: "COSC 111",
      sourceLocation: "UBCO EME 1101",
      defaultCampusId: "ubc-vancouver",
    });
    expect(ubcOkanagan).toBe("UBC-OKANAGAN");

    const ubcVancouver = inferImportedCampus({
      universityId: "ubc",
      courseCode: "CPSC_V 110",
      sourceLocation: "ICCS 204",
      defaultCampusId: "ubc-vancouver",
    });
    expect(ubcVancouver).toBe("UBC-VANCOUVER");

    // York multi-campus inference
    const yorkGlendon = inferImportedCampus({
      universityId: "york",
      courseCode: "FRAN 1000",
      sourceLocation: "Glendon York Hall 201",
      defaultCampusId: "keele",
    });
    expect(yorkGlendon).toBe("GLENDON");

    const yorkMarkham = inferImportedCampus({
      universityId: "york",
      courseCode: "CS 1001",
      sourceLocation: "Markham MKM 301",
      defaultCampusId: "keele",
    });
    expect(yorkMarkham).toBe("MARKHAM");

    const yorkKeele = inferImportedCampus({
      universityId: "york",
      courseCode: "EECS 1022",
      sourceLocation: "Bergeron 212",
      defaultCampusId: "keele",
    });
    expect(yorkKeele).toBe("KEELE");

    // Inferred campus for multiple meetings
    const singleCampusMeetings = [
      { courseCode: "EECS 1022", campus: "KEELE" as const },
      { courseCode: "MATH 1013", campus: "KEELE" as const },
    ];
    expect(inferredCampusForMeetings(singleCampusMeetings)).toBe("KEELE");

    // Genuine multi-campus schedule remains unresolved (null)
    const mixedMeetings = [
      { courseCode: "CSC108H1", campus: "UTSG" as const },
      { courseCode: "CSC108H5", campus: "UTM" as const },
    ];
    expect(inferredCampusForMeetings(mixedMeetings)).toBeNull();
  });

  test("getOutdoorCampusTransitionPlanner routes for all supported outdoor campuses using campusId and universityId", async () => {
    // Test both campusId and universityId lookups
    const lookupKeys = [
      "utsg",
      "utsc",
      "carleton",
      "tmu",
      "queens",
      "laurier",
      "york",
      "keele", // York's campusId
      "mcmaster",
      "western",
      "guelph",
      "uottawa",
      "brock",
      "ubc-vancouver",
      "ubc",
      "waterloo-main",
      "waterloo",
      "mcgill-downtown",
      "mcgill",
    ];

    for (const key of lookupKeys) {
      const planner = await getOutdoorCampusTransitionPlanner(key);
      expect(planner).not.toBeNull();
    }

    // Verify Laurier routing between Laurier buildings using universityId "laurier"
    const laurierPlanner = await getOutdoorCampusTransitionPlanner("laurier");
    expect(laurierPlanner).not.toBeNull();
    const lRoute = laurierPlanner!(
      {
        id: "l1",
        courseCode: "BU111",
        buildingCode: "LH",
        room: "1001",
        campus: "WATERLOO",
        locationType: "physical",
        locationUnknown: false,
      },
      {
        id: "l2",
        courseCode: "EC120",
        buildingCode: "DAWB",
        room: "100",
        campus: "WATERLOO",
        locationType: "physical",
        locationUnknown: false,
      },
      { mode: "fastest", walkingSpeedMps: 1.4 },
    );
    expect(lRoute.status).toBe("routed");
    expect(lRoute.result?.totalDistanceMeters).toBeGreaterThan(0);

    // Verify York routing between York buildings using campusId "keele"
    const yorkPlanner = await getOutdoorCampusTransitionPlanner("keele");
    expect(yorkPlanner).not.toBeNull();
    const yRoute = yorkPlanner!(
      {
        id: "y1",
        courseCode: "EECS1022",
        buildingCode: "BRG",
        room: "212",
        campus: "KEELE",
        locationType: "physical",
        locationUnknown: false,
      },
      {
        id: "y2",
        courseCode: "MATH1013",
        buildingCode: "CLH",
        room: "L",
        campus: "KEELE",
        locationType: "physical",
        locationUnknown: false,
      },
      { mode: "fastest", walkingSpeedMps: 1.4 },
    );
    expect(yRoute.status).toBe("routed");
    expect(yRoute.result?.totalDistanceMeters).toBeGreaterThan(0);

    // Verify cross-campus route is rejected gracefully
    const crossCampusRoute = yorkPlanner!(
      {
        id: "y1",
        courseCode: "EECS1022",
        buildingCode: "BRG",
        room: "212",
        campus: "KEELE",
        locationType: "physical",
        locationUnknown: false,
      },
      {
        id: "y3",
        courseCode: "FRAN1000",
        buildingCode: "YH",
        room: "201",
        campus: "GLENDON",
        locationType: "physical",
        locationUnknown: false,
      },
      { mode: "fastest", walkingSpeedMps: 1.4 },
    );
    expect(crossCampusRoute.status).toBe("unavailable");
    expect(crossCampusRoute.message).toContain("same campus");
  });

  test("all 16 supported campuses load realistic university-specific demo schedules with campus inference, valid buildings, and routed transitions", async () => {
    for (const campus of supportedCampuses) {
      const university = universityById(campus.universityId);
      expect(university).not.toBeNull();
      if (!university) continue;

      // 1. Test loading via university adapter and campus
      const meetingsViaAdapter = await loadDemoTimetable(university.timetableAdapter, campus.id);
      expect(meetingsViaAdapter.length).toBeGreaterThanOrEqual(6);

      // 2. Test loading dynamically resolved by campus ID alone
      const meetingsViaCampus = await loadDemoTimetable(undefined, campus.id);
      expect(meetingsViaCampus.length).toBeGreaterThanOrEqual(6);

      // 3. Verify campus inference
      const inferredFromAdapter = inferredCampusForMeetings(meetingsViaAdapter);
      const inferredFromCampus = inferredCampusForMeetings(meetingsViaCampus);
      expect(inferredFromAdapter).toBe(campus.id.toUpperCase());
      expect(inferredFromCampus).toBe(campus.id.toUpperCase());

      // 4. Verify all scheduled physical classes have valid physical buildings/rooms and no TBA
      const scheduledClasses = meetingsViaCampus.filter(
        (m) => m.locationType === "physical" && !m.notes,
      );
      expect(scheduledClasses.length).toBeGreaterThan(0);
      for (const meeting of scheduledClasses) {
        expect(meeting.buildingCode).toBeTruthy();
        expect(meeting.room).toBeTruthy();
        expect(meeting.locationUnknown).toBe(false);
      }

      // 5. Verify timetable -> campus inference -> building -> map/routing works
      // Consecutive meetings on the same day in different buildings must produce a valid route
      const routingKey = university.id === "uoft" ? campus.id : university.id;
      const planner =
        campus.id === "utm"
          ? createScheduleTransitionPlanner(UTM_ROUTING_GRAPH, meetingsViaCampus)
          : await getOutdoorCampusTransitionPlanner(routingKey);
      expect(planner).not.toBeNull();

      const days = [...new Set(meetingsViaCampus.map((m) => m.weekday))];
      let routedCount = 0;

      for (const day of days) {
        const dayMeetings = meetingsViaCampus
          .filter((m) => m.weekday === day && m.buildingCode && !m.notes)
          .sort((a, b) => a.startTime - b.startTime);

        for (let i = 0; i < dayMeetings.length - 1; i++) {
          const from = dayMeetings[i]!;
          const to = dayMeetings[i + 1]!;
          if (from.buildingCode !== to.buildingCode) {
            const route = planner!(from, to, {
              mode: "fastest",
              walkingSpeedMps: 1.4,
            });
            if (route.status === "routed") {
              routedCount++;
              expect(route.result?.totalDistanceMeters).toBeGreaterThan(0);
            }
          }
        }
      }

      expect(routedCount).toBeGreaterThanOrEqual(1);
    }
  });
});
