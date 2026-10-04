import type { Campus, SiteDefinition, University } from "./registry";

export type CampusVisual = {
  src: string;
  alt: string;
  credit: string;
  license: string;
  sourceUrl: string;
  position?: string;
};

const universityVisuals: Record<string, CampusVisual> = {
  uoft: {
    src: "/campuses/photos/uoft.webp",
    alt: "University of Toronto's St. George campus viewed from above",
    credit: "KTMAR",
    license: "CC BY 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Facing_North.jpg",
  },
  carleton: {
    src: "/campuses/photos/carleton.webp",
    alt: "Carleton University campus beside the Rideau River in Ottawa",
    credit: "Harleyd613",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:CarletonUniversity2022.jpg",
  },
  tmu: {
    src: "/campuses/photos/tmu.webp",
    alt: "Toronto Metropolitan University's Student Learning Centre illuminated at night",
    credit: "Canmenwalker",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Toronto_Met_Student_Learning_Centre_at_night_2022.jpg",
    position: "center 58%",
  },
  queens: {
    src: "/campuses/photos/queens.webp",
    alt: "Douglas Library on Queen's University campus in Kingston",
    credit: "GreenCommons",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Queen%27sDouglas.JPG",
  },
  laurier: {
    src: "/campuses/photos/laurier.webp",
    alt: "Lazaridis Hall on Wilfrid Laurier University's Waterloo campus",
    credit: "LeonV",
    license: "CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Schlegel_Centre_(Laurier%27s_school_of_business_and_economics).JPG",
  },
  york: {
    src: "/campuses/photos/york.webp",
    alt: "Computer Science and Engineering Building on York University's Keele campus",
    credit: "Raysonho",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:YorkUComputerScienceAndEngineeringBuilding.jpg",
  },
  mcmaster: {
    src: "/campuses/photos/mcmaster.webp",
    alt: "McMaster University campus in Hamilton",
    credit: "Jokehoe",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:McMaster_University_campus.jpg",
  },
  western: {
    src: "/campuses/photos/western.webp",
    alt: "University College at Western University in London, Ontario",
    credit: "R.schneider101",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:University_College,_Western_University.jpg",
  },
  guelph: {
    src: "/campuses/photos/guelph.webp",
    alt: "Johnston Green on the University of Guelph campus",
    credit: "JFVoll",
    license: "CC BY-SA 3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Johnston_Green,_University_of_Guelph_-_Guelph,_ON_(2026)-001.jpg",
  },
  uottawa: {
    src: "/campuses/photos/uottawa.webp",
    alt: "Tabaret Hall at the University of Ottawa",
    credit: "RobCA",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:UOttawa-Tabaret_Hall-2008-05-05.jpg",
  },
  brock: {
    src: "/campuses/photos/brock.webp",
    alt: "Brock University campus in St. Catharines",
    credit: "Matt Clare",
    license: "CC BY-SA 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Brock_University_(7990168355).jpg",
  },
  ubc: {
    src: "/campuses/photos/ubc.webp",
    alt: "Irving K. Barber Learning Centre at UBC Vancouver",
    credit: "CjayD",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Irving_K._Barber_Library.jpg",
  },
  waterloo: {
    src: "/campuses/photos/waterloo.webp",
    alt: "University of Waterloo main campus",
    credit: "JFVoll",
    license: "CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:University_of_Waterloo_(Waterloo_Campus)_-_Waterloo,_Ontario.jpg",
  },
  mcgill: {
    src: "/campuses/photos/mcgill.webp",
    alt: "Arts Building on McGill University's downtown campus",
    credit: "D. Benjamin Miller",
    license: "CC0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Arts_Building,_McGill_University,_Aug_31_2022.jpg",
  },
  cmu: {
    src: "/campuses/photos/cmu.webp",
    alt: "Carnegie Mellon University campus in Pittsburgh",
    credit: "Wikimedia Commons contributor",
    license: "CC BY-SA 2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:CMU_campus_Cathedral_Learning_background.jpg",
  },
  ucberkeley: {
    src: "/campuses/photos/ucberkeley.webp",
    alt: "Memorial Glade on the UC Berkeley campus",
    credit: "Gku",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Berkeley_glade_afternoon.jpg",
  },
  nyu: {
    src: "/campuses/photos/nyu.webp",
    alt: "New York University buildings at Washington Square",
    credit: "Jonathan71",
    license: "CC BY-SA 2.5",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:NYU07.JPG",
  },
  mit: {
    src: "/campuses/photos/mit.webp",
    alt: "The MIT Great Dome illuminated at night in Cambridge",
    credit: "Fcb981; edit by Thermos",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:MIT_Dome_night1_Edit.jpg",
  },
  stanford: {
    src: "/campuses/photos/stanford.webp",
    alt: "Stanford University's Main Quad viewed from the Oval",
    credit: "King of Hearts",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Stanford_Oval_May_2011_panorama.jpg",
  },
  upenn: {
    src: "/campuses/photos/upenn.webp",
    alt: "College Hall at the University of Pennsylvania",
    credit: "Michel Alexandre Salim",
    license: "CC BY-SA 2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:College_Hall,_University_of_Pennsylvania.jpg",
  },
  cornell: {
    src: "/campuses/photos/cornell.webp",
    alt: "Ho Plaza and Sage Hall on Cornell University's Ithaca campus",
    credit: "sach1tb",
    license: "CC BY-SA 2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Cornell_University,_Ho_Plaza_and_Sage_Hall.jpg",
  },
  dartmouth: {
    src: "/campuses/photos/dartmouth.webp",
    alt: "Dartmouth Hall on the Hanover campus",
    credit: "Kane5187",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Dartmouth_College_campus_2007-06-23_Dartmouth_Hall_02.JPG",
  },
  brown: {
    src: "/campuses/photos/brown.webp",
    alt: "Manning Chapel on Brown University's College Hill campus",
    credit: "Dale182",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Manning_Chapel.jpg",
  },
  columbia: {
    src: "/campuses/photos/columbia.webp",
    alt: "Low Memorial Library on Columbia University's Morningside campus",
    credit: "Ajay Suresh",
    license: "CC BY 2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Columbia_University_-_Low_Memorial_Library_(48170370506).jpg",
  },
  princeton: {
    src: "/campuses/photos/princeton.webp",
    alt: "Cleveland Tower on Princeton University's main campus",
    credit: "Magneticcarpet",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:ClevelandTowerWatercolor20060829.jpg",
  },
  yale: {
    src: "/campuses/photos/yale.webp",
    alt: "Sterling Law Building on Yale University's New Haven campus",
    credit: "Pradipta Mitra",
    license: "CC BY-SA 3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Yale_Law_School_in_the_Sterling_Law_Building.jpg",
  },
  harvard: {
    src: "/campuses/photos/harvard.webp",
    alt: "Sanders Theatre on Harvard University's Cambridge campus",
    credit: "chensiyuan",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sanders_theater_2009y.JPG",
  },
};

const campusVisuals: Record<string, CampusVisual> = {
  utm: {
    src: "/campuses/photos/utm.webp",
    alt: "Maanjiwe nendamowinan on the University of Toronto Mississauga campus",
    credit: "The Neon Narwhal",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Maanjiwe_nendamowinan_North_Field.jpg",
  },
  utsg: { ...universityVisuals["uoft"]!, src: "/campuses/photos/utsg.webp" },
  utsc: {
    src: "/campuses/photos/utsc.webp",
    alt: "Aerial view of the University of Toronto Scarborough campus",
    credit: "Canmenwalker",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:University_of_Toronto_Scarborough_aerial_view_2024.jpg",
  },
  "ubc-vancouver": { ...universityVisuals["ubc"]!, src: "/campuses/photos/ubcv.webp" },
  "ubc-okanagan": {
    src: "/campuses/photos/ubco.webp",
    alt: "Arts and Sciences Building at UBC Okanagan in Kelowna",
    credit: "Kasian Architecture",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:UBCO_Arts_%26_Sciences_Building.jpg",
  },
  keele: { ...universityVisuals["york"]!, src: "/campuses/photos/keele.webp" },
  glendon: {
    src: "/campuses/photos/glendon.webp",
    alt: "Glendon Hall on York University's Glendon campus",
    credit: "Vlad Litvinov",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Glendon_Campus_(6582731213).jpg",
  },
  markham: {
    src: "/campuses/photos/markham.webp",
    alt: "York University's Markham Campus building",
    credit: "Dillan Payne",
    license: "CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:York_University_Markham_Campus,_October_25_2025.jpg",
  },
};

export function visualForCampus(campus: Campus | null, university: University): CampusVisual {
  const visual = (campus && campusVisuals[campus.id]) || universityVisuals[university.id];
  if (!visual) throw new Error(`Missing campus photography for ${campus?.id ?? university.id}`);
  return visual;
}

export function visualForSite(
  site: SiteDefinition,
  campus: Campus | null,
  university: University,
): CampusVisual {
  if (site.role === "university-hub") {
    const visual = universityVisuals[university.id];
    if (!visual) throw new Error(`Missing university photography for ${university.id}`);
    return visual;
  }
  return visualForCampus(campus, university);
}

export function validateCampusVisuals(
  universities: readonly University[],
  sites: readonly SiteDefinition[],
): string[] {
  const errors = universities
    .filter((university) => !universityVisuals[university.id])
    .map((university) => `${university.id}: missing university photography`);
  const campusEditionCounts = new Map<string, number>();
  for (const site of sites) {
    if (site.role === "campus-edition" && site.universityId) {
      campusEditionCounts.set(
        site.universityId,
        (campusEditionCounts.get(site.universityId) ?? 0) + 1,
      );
    }
  }

  for (const site of sites) {
    if (!site.universityId || site.role === "global") continue;
    const university = universities.find((entry) => entry.id === site.universityId);
    if (!university || !universityVisuals[university.id]) {
      errors.push(`${site.id}: no photography can be resolved`);
      continue;
    }
    if (
      site.role === "campus-edition" &&
      site.campusId &&
      (campusEditionCounts.get(site.universityId) ?? 0) > 1 &&
      !campusVisuals[site.campusId]
    ) {
      errors.push(`${site.id}: missing campus-specific photography for ${site.campusId}`);
    }
  }
  return errors;
}
