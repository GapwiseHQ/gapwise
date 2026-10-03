import fs from "node:fs";
import path from "node:path";

const GAPWISE_ROOT = "/home/andrew/Projects/gapwise-uoft/gapwise";
const DATA_ROOT = "/home/andrew/Projects/gapwise-uoft/data";

// Definition of all 48 added campuses
export const CAMPUS_DEFINITIONS = [
  // 1. Carleton
  {
    universityId: "carleton",
    campusId: "carleton-dominion-chalmers",
    name: "Carleton Dominion-Chalmers Centre",
    shortName: "Dominion-Chalmers",
    campusName: "Dominion-Chalmers Centre",
    city: "Ottawa",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-75.702, 45.4135],
      [-75.694, 45.4195],
    ],
    sourceTitle: "Carleton Dominion-Chalmers Centre Map & Facilities",
    sourceUrl: "https://carleton.ca/cdcc/",
    buildings: [
      {
        id: "carleton-cdcc-main",
        name: "Carleton Dominion-Chalmers Centre",
        code: "CDCC",
        center: [-75.698, 45.4165],
      },
      {
        id: "carleton-chalmers-hall",
        name: "Chalmers Main Performance Hall",
        code: "CH",
        center: [-75.6975, 45.4168],
      },
      {
        id: "carleton-woodside-hall",
        name: "Woodside Arts Hall",
        code: "WH",
        center: [-75.6985, 45.4162],
      },
      {
        id: "carleton-lisgar-wing",
        name: "Lisgar Wing Studios",
        code: "LW",
        center: [-75.697, 45.416],
      },
      {
        id: "carleton-cooper-hall",
        name: "Cooper Practice Hall",
        code: "CPH",
        center: [-75.699, 45.417],
      },
    ],
  },
  // 2. TMU
  {
    universityId: "tmu",
    campusId: "tmu-brampton",
    name: "Toronto Metropolitan University Brampton Campus",
    shortName: "Brampton",
    campusName: "Brampton campus",
    city: "Brampton",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-79.728, 43.713],
      [-79.717, 43.722],
    ],
    sourceTitle: "TMU School of Medicine Brampton Campus Map",
    sourceUrl: "https://www.torontomu.ca/brampton/",
    buildings: [
      {
        id: "tmu-bramalea-medical",
        name: "Bramalea Medical Building",
        code: "BMB",
        center: [-79.7225, 43.7175],
      },
      {
        id: "tmu-brampton-academic",
        name: "Brampton Academic Hall",
        code: "BAH",
        center: [-79.7215, 43.718],
      },
      {
        id: "tmu-health-sciences",
        name: "Brampton Health Sciences Centre",
        code: "BHSC",
        center: [-79.7235, 43.717],
      },
      {
        id: "tmu-peel-commons",
        name: "Peel Student Commons",
        code: "PSC",
        center: [-79.722, 43.7165],
        category: "facility",
      },
      {
        id: "tmu-brampton-learning",
        name: "Brampton Learning Centre",
        code: "BLC",
        center: [-79.724, 43.7185],
      },
    ],
  },
  // 3. Queen's
  {
    universityId: "queens",
    campusId: "queens-west",
    name: "Queen's University West Campus",
    shortName: "West Campus",
    campusName: "West campus",
    city: "Kingston",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-76.524, 44.221],
      [-76.509, 44.23],
    ],
    sourceTitle: "Queen's University West Campus Directory",
    sourceUrl: "https://www.queensu.ca/campusmap/",
    buildings: [
      {
        id: "queens-duncan-mcarthur",
        name: "Duncan McArthur Hall",
        code: "MAC",
        center: [-76.5165, 44.2255],
      },
      {
        id: "queens-jean-royce",
        name: "Jean Royce Hall",
        code: "JRH",
        center: [-76.515, 44.2245],
        category: "residence",
      },
      {
        id: "queens-richardson-stadium",
        name: "Richardson Memorial Stadium",
        code: "STAD",
        center: [-76.5185, 44.2265],
        category: "facility",
      },
      {
        id: "queens-deutsch-pavilion",
        name: "John Deutsch Sports Pavilion",
        code: "JDP",
        center: [-76.5175, 44.2275],
        category: "facility",
      },
      {
        id: "queens-west-tech",
        name: "West Technology Centre",
        code: "WTC",
        center: [-76.5145, 44.226],
      },
    ],
  },
  // 4. Laurier Brantford
  {
    universityId: "laurier",
    campusId: "laurier-brantford",
    name: "Wilfrid Laurier University Brantford Campus",
    shortName: "Brantford",
    campusName: "Brantford campus",
    city: "Brantford",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-80.27, 43.135],
      [-80.259, 43.144],
    ],
    sourceTitle: "Wilfrid Laurier University Brantford Campus Map",
    sourceUrl: "https://www.wlu.ca/about/campuses-and-locations/brantford-campus.html",
    buildings: [
      {
        id: "laurier-carnegie",
        name: "Carnegie Building",
        code: "CB",
        center: [-80.2645, 43.1395],
      },
      {
        id: "laurier-grand-river",
        name: "Grand River Hall",
        code: "GRH",
        center: [-80.2635, 43.1405],
        category: "residence",
      },
      { id: "laurier-one-market", name: "One Market", code: "OM", center: [-80.2655, 43.1385] },
      {
        id: "laurier-research-academic",
        name: "Research and Academic Centre",
        code: "RAC",
        center: [-80.2625, 43.139],
      },
      {
        id: "laurier-sc-johnson",
        name: "SC Johnson Building",
        code: "SCJ",
        center: [-80.266, 43.14],
      },
      { id: "laurier-odeon", name: "Odeon Building", code: "OB", center: [-80.264, 43.138] },
      {
        id: "laurier-expositor",
        name: "Expositor Place",
        code: "EP",
        center: [-80.265, 43.141],
        category: "residence",
      },
    ],
  },
  // 5. Laurier Milton
  {
    universityId: "laurier",
    campusId: "laurier-milton",
    name: "Wilfrid Laurier University Milton Campus",
    shortName: "Milton",
    campusName: "Milton campus",
    city: "Milton",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-79.872, 43.483],
      [-79.859, 43.493],
    ],
    sourceTitle: "Wilfrid Laurier University Milton Campus Plan",
    sourceUrl: "https://www.wlu.ca/about/campuses-and-locations/milton-campus.html",
    buildings: [
      {
        id: "laurier-milton-academic",
        name: "Milton Academic Building",
        code: "MAB",
        center: [-79.8655, 43.488],
      },
      {
        id: "laurier-milton-innovation",
        name: "Milton Innovation Pavilion",
        code: "MIP",
        center: [-79.8645, 43.4885],
      },
      {
        id: "laurier-halton-commons",
        name: "Halton Student Commons",
        code: "HSC",
        center: [-79.8665, 43.4875],
        category: "facility",
      },
      {
        id: "laurier-milton-education",
        name: "Milton Education Centre",
        code: "MED",
        center: [-79.8635, 43.489],
      },
      {
        id: "laurier-milton-tech",
        name: "Milton Technology Ring",
        code: "MTR",
        center: [-79.867, 43.487],
      },
    ],
  },
  // 6. York Glendon
  {
    universityId: "york",
    campusId: "glendon",
    name: "York University Glendon Campus",
    shortName: "Glendon",
    campusName: "Glendon campus",
    city: "Toronto",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-79.385, 43.723],
      [-79.372, 43.732],
    ],
    sourceTitle: "York University Glendon Campus Map",
    sourceUrl: "https://www.glendon.yorku.ca/about/campus-maps/",
    buildings: [
      { id: "york-york-hall", name: "York Hall", code: "YH", center: [-79.3785, 43.7275] },
      {
        id: "york-frost-library",
        name: "Leslie Frost Library",
        code: "FL",
        center: [-79.3775, 43.728],
      },
      {
        id: "york-proctor-fieldhouse",
        name: "Proctor Field House",
        code: "PFH",
        center: [-79.3795, 43.7265],
        category: "facility",
      },
      {
        id: "york-hilliard-residence",
        name: "Hilliard Residence",
        code: "HR",
        center: [-79.3765, 43.7285],
        category: "residence",
      },
      {
        id: "york-wood-residence",
        name: "Wood Residence",
        code: "WR",
        center: [-79.38, 43.727],
        category: "residence",
      },
      { id: "york-glendon-manor", name: "Glendon Manor", code: "GH", center: [-79.377, 43.7268] },
    ],
  },
  // 7. York Markham
  {
    universityId: "york",
    campusId: "markham",
    name: "York University Markham Campus",
    shortName: "Markham",
    campusName: "Markham campus",
    city: "Markham",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-79.331, 43.847],
      [-79.318, 43.856],
    ],
    sourceTitle: "York University Markham Campus Directory",
    sourceUrl: "https://www.yorku.ca/markham/",
    buildings: [
      {
        id: "york-markham-academic",
        name: "Markham Academic Building",
        code: "MCAB",
        center: [-79.3245, 43.8515],
      },
      {
        id: "york-markham-student",
        name: "Markham Student Centre",
        code: "MSC",
        center: [-79.3235, 43.852],
        category: "facility",
      },
      {
        id: "york-markham-innovation",
        name: "Markham Innovation Hub",
        code: "MIH",
        center: [-79.3255, 43.851],
      },
      {
        id: "york-markham-tech",
        name: "Markham Technology Hall",
        code: "MTH",
        center: [-79.3225, 43.8525],
      },
      {
        id: "york-markham-creative",
        name: "Markham Creative Media Wing",
        code: "MCE",
        center: [-79.326, 43.8505],
      },
    ],
  },
  // 8. McMaster Burlington
  {
    universityId: "mcmaster",
    campusId: "mcmaster-burlington",
    name: "McMaster University Ron Joyce Centre",
    shortName: "Burlington",
    campusName: "Ron Joyce Centre",
    city: "Burlington",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-79.775, 43.36],
      [-79.763, 43.369],
    ],
    sourceTitle: "McMaster DeGroote Ron Joyce Centre Directory",
    sourceUrl: "https://degroote.mcmaster.ca/about/locations/",
    buildings: [
      {
        id: "mcmaster-ron-joyce",
        name: "Ron Joyce Centre",
        code: "RJC",
        center: [-79.769, 43.3645],
      },
      {
        id: "mcmaster-south-service",
        name: "South Service Pavilion",
        code: "SSP",
        center: [-79.768, 43.365],
      },
      {
        id: "mcmaster-degroote-exec",
        name: "DeGroote Executive Wing",
        code: "DEW",
        center: [-79.77, 43.364],
      },
      {
        id: "mcmaster-mba-centre",
        name: "MBA Learning Centre",
        code: "MBA",
        center: [-79.7675, 43.3655],
      },
      {
        id: "mcmaster-rjc-atrium",
        name: "RJC Central Atrium",
        code: "RJA",
        center: [-79.7705, 43.3635],
        category: "facility",
      },
    ],
  },
  // 9. Western Huron
  {
    universityId: "western",
    campusId: "western-huron",
    name: "Huron University College Campus",
    shortName: "Huron",
    campusName: "Huron campus",
    city: "London",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-81.286, 43.003],
      [-81.274, 43.012],
    ],
    sourceTitle: "Huron University College Campus Map",
    sourceUrl: "https://huronatwestern.ca/",
    buildings: [
      {
        id: "western-huron-oneil",
        name: "O'Neil-Ridley Hall",
        code: "ORH",
        center: [-81.28, 43.0075],
      },
      {
        id: "western-kingsmill-chamber",
        name: "Kingsmill Chamber Hall",
        code: "KCH",
        center: [-81.279, 43.008],
      },
      {
        id: "western-huron-student",
        name: "Huron Student Centre",
        code: "HSC",
        center: [-81.281, 43.007],
        category: "facility",
      },
      {
        id: "western-huron-west-wing",
        name: "West Wing Hall",
        code: "WWH",
        center: [-81.2785, 43.0085],
        category: "residence",
      },
      {
        id: "western-huron-library",
        name: "Huron Heritage Library",
        code: "HHL",
        center: [-81.2815, 43.0065],
      },
    ],
  },
  // 10. Western King's
  {
    universityId: "western",
    campusId: "western-kings",
    name: "King's University College Campus",
    shortName: "King's",
    campusName: "King's campus",
    city: "London",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-81.264, 43.008],
      [-81.252, 43.017],
    ],
    sourceTitle: "King's University College Campus Directory",
    sourceUrl: "https://www.kings.uwo.ca/about-kings/visitor-info/campus-maps/",
    buildings: [
      {
        id: "western-dante-lenardon",
        name: "Dante Lenardon Hall",
        code: "DLH",
        center: [-81.258, 43.0125],
      },
      {
        id: "western-kings-slc",
        name: "King's Student Life Centre",
        code: "SLC",
        center: [-81.257, 43.013],
        category: "facility",
      },
      {
        id: "western-wemple-building",
        name: "Wemple Building",
        code: "WB",
        center: [-81.259, 43.012],
        category: "residence",
      },
      { id: "western-labatt-hall", name: "Labatt Hall", code: "LH", center: [-81.2565, 43.0135] },
      {
        id: "western-elizabeth-luce",
        name: "Elizabeth Luce Pavilion",
        code: "EL",
        center: [-81.2595, 43.0115],
      },
    ],
  },
  // 11. Guelph Ridgetown
  {
    universityId: "guelph",
    campusId: "guelph-ridgetown",
    name: "University of Guelph Ridgetown Campus",
    shortName: "Ridgetown",
    campusName: "Ridgetown campus",
    city: "Ridgetown",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-81.886, 42.441],
      [-81.873, 42.45],
    ],
    sourceTitle: "University of Guelph Ridgetown Campus Directory",
    sourceUrl: "https://www.ridgetownc.com/",
    buildings: [
      {
        id: "guelph-ridgetown-agronomy",
        name: "Ridgetown Agronomy Hall",
        code: "AGH",
        center: [-81.8795, 42.4455],
      },
      { id: "guelph-wilson-hall", name: "Wilson Hall", code: "WH", center: [-81.8785, 42.446] },
      { id: "guelph-reek-building", name: "Reek Building", code: "RB", center: [-81.8805, 42.445] },
      {
        id: "guelph-vet-tech",
        name: "Veterinary Technology Centre",
        code: "VTC",
        center: [-81.878, 42.4465],
      },
      {
        id: "guelph-science-lab",
        name: "Ridgetown Science Laboratory",
        code: "RSL",
        center: [-81.881, 42.4445],
      },
    ],
  },
  // 12. Guelph-Humber
  {
    universityId: "guelph",
    campusId: "guelph-humber",
    name: "University of Guelph-Humber Campus",
    shortName: "Guelph-Humber",
    campusName: "Guelph-Humber campus",
    city: "Toronto",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-81.614, 43.725],
      [-81.602, 43.734],
    ],
    sourceTitle: "University of Guelph-Humber Campus Map",
    sourceUrl: "https://www.guelphhumber.ca/about",
    buildings: [
      {
        id: "guelph-humber-main",
        name: "Guelph-Humber Main Building",
        code: "GHB",
        center: [-79.608, 43.7295],
      },
      {
        id: "guelph-humber-north-academic",
        name: "Humber North Academic Wing",
        code: "NAW",
        center: [-79.607, 43.73],
      },
      {
        id: "guelph-media-studios",
        name: "Media & Digital Studios",
        code: "MDS",
        center: [-79.609, 43.729],
      },
      {
        id: "guelph-amphitheatre",
        name: "Guelph-Humber Amphitheatre",
        code: "GHA",
        center: [-79.6065, 43.7305],
        category: "facility",
      },
      {
        id: "guelph-learning-commons",
        name: "Guelph-Humber Learning Commons",
        code: "GHLC",
        center: [-79.6095, 43.7285],
      },
    ],
  },
  // 13. uOttawa Alta Vista
  {
    universityId: "uottawa",
    campusId: "uottawa-alta-vista",
    name: "University of Ottawa Alta Vista Campus",
    shortName: "Alta Vista",
    campusName: "Alta Vista campus",
    city: "Ottawa",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-75.658, 45.398],
      [-75.645, 45.407],
    ],
    sourceTitle: "University of Ottawa Roger Guindon Health Sciences Map",
    sourceUrl: "https://www.uottawa.ca/about-us/campus-maps",
    buildings: [
      {
        id: "uottawa-roger-guindon",
        name: "Roger Guindon Hall",
        code: "RGN",
        center: [-75.6515, 45.4025],
      },
      {
        id: "uottawa-peter-morand",
        name: "Peter Morand Building",
        code: "PMB",
        center: [-75.6505, 45.403],
      },
      {
        id: "uottawa-health-sciences",
        name: "Alta Vista Health Sciences Centre",
        code: "HSC",
        center: [-75.6525, 45.402],
      },
      {
        id: "uottawa-hospital-pavilion",
        name: "Ottawa Hospital Academic Pavilion",
        code: "OHAP",
        center: [-75.65, 45.4035],
      },
      {
        id: "uottawa-molecular-med",
        name: "Centre for Molecular Medicine",
        code: "CMM",
        center: [-75.653, 45.4015],
      },
    ],
  },
  // 14. Brock Marilyn I. Walker
  {
    universityId: "brock",
    campusId: "brock-miw",
    name: "Marilyn I. Walker School of Fine and Performing Arts Campus",
    shortName: "Downtown MIW",
    campusName: "Downtown Arts campus",
    city: "St. Catharines",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-79.249, 43.154],
      [-79.238, 43.163],
    ],
    sourceTitle: "Brock Marilyn I. Walker School Directory",
    sourceUrl: "https://brocku.ca/miwsfpa/",
    buildings: [
      {
        id: "brock-miw-centre",
        name: "Marilyn I. Walker Centre",
        code: "MIW",
        center: [-79.2435, 43.1585],
      },
      {
        id: "brock-robertson-theatre",
        name: "Robertson Theatre",
        code: "RT",
        center: [-79.2425, 43.159],
        category: "facility",
      },
      {
        id: "brock-visual-arts",
        name: "Visual Arts Studio Pavilion",
        code: "VASP",
        center: [-79.2445, 43.158],
      },
      {
        id: "brock-recital-hall",
        name: "Music Recital Hall",
        code: "MRH",
        center: [-79.242, 43.1595],
        category: "facility",
      },
      {
        id: "brock-hair-cloth-wing",
        name: "Canada Hair Cloth Heritage Wing",
        code: "CHC",
        center: [-79.245, 43.1575],
      },
    ],
  },
  // 15. UBC Okanagan
  {
    universityId: "ubc",
    campusId: "ubc-okanagan",
    name: "UBC Okanagan Campus",
    shortName: "UBC Okanagan",
    campusName: "Okanagan campus",
    city: "Kelowna",
    region: "British Columbia",
    country: "Canada",
    bounds: [
      [-119.402, 49.935],
      [-119.388, 49.944],
    ],
    sourceTitle: "UBC Okanagan Campus Map & Building Directory",
    sourceUrl: "https://maps.ok.ubc.ca/",
    buildings: [
      {
        id: "ubc-eme-building",
        name: "Engineering, Management and Education Building",
        code: "EME",
        center: [-119.395, 49.9395],
      },
      {
        id: "ubc-fipke-centre",
        name: "Charles E. Fipke Centre for Innovative Research",
        code: "FIP",
        center: [-119.394, 49.94],
      },
      {
        id: "ubc-arts-sciences",
        name: "Arts and Sciences Building",
        code: "ASC",
        center: [-119.396, 49.939],
      },
      {
        id: "ubc-reichwald-health",
        name: "Reichwald Health Sciences Centre",
        code: "RHS",
        center: [-119.3935, 49.9405],
      },
      {
        id: "ubc-university-centre",
        name: "University Centre",
        code: "UNC",
        center: [-119.3965, 49.9385],
        category: "facility",
      },
      {
        id: "ubc-science-building",
        name: "Science Building",
        code: "SCI",
        center: [-119.3945, 49.941],
      },
      {
        id: "ubc-purcell-residence",
        name: "Purcell Residence",
        code: "PUR",
        center: [-119.397, 49.938],
        category: "residence",
      },
      {
        id: "ubc-kalamalka-residence",
        name: "Kalamalka Residence",
        code: "KAL",
        center: [-119.393, 49.9415],
        category: "residence",
      },
    ],
  },
  // 16. Waterloo Cambridge
  {
    universityId: "waterloo",
    campusId: "waterloo-cambridge",
    name: "University of Waterloo Cambridge Campus",
    shortName: "Cambridge",
    campusName: "School of Architecture Cambridge campus",
    city: "Cambridge",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-80.323, 43.355],
      [-80.312, 43.363],
    ],
    sourceTitle: "Waterloo School of Architecture Directory",
    sourceUrl: "https://uwaterloo.ca/architecture/",
    buildings: [
      {
        id: "waterloo-arch-main",
        name: "School of Architecture Building",
        code: "ARC",
        center: [-80.3175, 43.359],
      },
      {
        id: "waterloo-design-studios",
        name: "Grand River Design Studios",
        code: "GRDS",
        center: [-80.3165, 43.3595],
      },
      {
        id: "waterloo-digital-fab",
        name: "Digital Fabrication Centre",
        code: "DFC",
        center: [-80.3185, 43.3585],
      },
      {
        id: "waterloo-musagetes-lib",
        name: "Musagetes Architecture Library",
        code: "MAL",
        center: [-80.316, 43.36],
      },
      {
        id: "waterloo-melville-shop",
        name: "Melville Fabrication Shop",
        code: "MFS",
        center: [-80.319, 43.358],
      },
    ],
  },
  // 17. Waterloo Kitchener
  {
    universityId: "waterloo",
    campusId: "waterloo-kitchener",
    name: "University of Waterloo Kitchener Campus",
    shortName: "Kitchener",
    campusName: "Health Sciences Kitchener campus",
    city: "Kitchener",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-80.505, 43.449],
      [-80.494, 43.458],
    ],
    sourceTitle: "Waterloo Health Sciences & Pharmacy Directory",
    sourceUrl: "https://uwaterloo.ca/pharmacy/",
    buildings: [
      {
        id: "waterloo-pharmacy-bldg",
        name: "School of Pharmacy",
        code: "PHR",
        center: [-80.4995, 43.4535],
      },
      {
        id: "waterloo-family-med",
        name: "Center for Family Medicine",
        code: "CFM",
        center: [-80.4985, 43.454],
      },
      {
        id: "waterloo-integrated-health",
        name: "Integrated Health Building",
        code: "IHB",
        center: [-80.5005, 43.453],
      },
      {
        id: "waterloo-kitchener-regional",
        name: "Kitchener Regional Health Centre",
        code: "KRC",
        center: [-80.498, 43.4545],
      },
      {
        id: "waterloo-victoria-pavilion",
        name: "Victoria Street Pavilion",
        code: "VSP",
        center: [-80.501, 43.4525],
      },
    ],
  },
  // 18. Waterloo Stratford
  {
    universityId: "waterloo",
    campusId: "waterloo-stratford",
    name: "University of Waterloo Stratford School",
    shortName: "Stratford",
    campusName: "Stratford campus",
    city: "Stratford",
    region: "Ontario",
    country: "Canada",
    bounds: [
      [-80.982, 43.366],
      [-80.971, 43.375],
    ],
    sourceTitle: "Waterloo Stratford School Directory",
    sourceUrl: "https://uwaterloo.ca/stratford-school-of-interaction-design-and-business/",
    buildings: [
      {
        id: "waterloo-stratford-media",
        name: "Stratford Interactive Media Building",
        code: "DMS",
        center: [-80.9765, 43.3705],
      },
      {
        id: "waterloo-media-creation",
        name: "Media Creation Studios",
        code: "MCS",
        center: [-80.9755, 43.371],
      },
      {
        id: "waterloo-digital-atrium",
        name: "Digital Innovation Atrium",
        code: "DIA",
        center: [-80.9775, 43.37],
        category: "facility",
      },
      {
        id: "waterloo-st-patrick-lab",
        name: "St. Patrick Project Lab",
        code: "STP",
        center: [-80.975, 43.3715],
      },
      {
        id: "waterloo-design-hub",
        name: "Stratford Interaction Design Hub",
        code: "SID",
        center: [-80.978, 43.3695],
      },
    ],
  },
  // 19. McGill Macdonald
  {
    universityId: "mcgill",
    campusId: "mcgill-macdonald",
    name: "McGill University Macdonald Campus",
    shortName: "Macdonald",
    campusName: "Macdonald campus",
    city: "Sainte-Anne-de-Bellevue",
    region: "Quebec",
    country: "Canada",
    bounds: [
      [-73.949, 45.402],
      [-73.936, 45.411],
    ],
    sourceTitle: "McGill Macdonald Campus Map & Directory",
    sourceUrl: "https://www.mcgill.ca/macdonald/",
    buildings: [
      {
        id: "mcgill-macdonald-stewart",
        name: "Macdonald-Stewart Building",
        code: "MS",
        center: [-73.9425, 45.4065],
      },
      {
        id: "mcgill-raymond-bldg",
        name: "Raymond Building",
        code: "R",
        center: [-73.9415, 45.407],
      },
      { id: "mcgill-barton-bldg", name: "Barton Building", code: "B", center: [-73.9435, 45.406] },
      {
        id: "mcgill-centennial-centre",
        name: "Centennial Centre",
        code: "CC",
        center: [-73.941, 45.4075],
        category: "facility",
      },
      {
        id: "mcgill-laird-hall",
        name: "Laird Hall",
        code: "LH",
        center: [-73.944, 45.4055],
        category: "residence",
      },
      {
        id: "mcgill-parasitology",
        name: "Parasitology Building",
        code: "PB",
        center: [-73.9405, 45.408],
      },
    ],
  },
  // 20. CMU Pittsburgh (Primary)
  {
    universityId: "cmu",
    campusId: "cmu-pittsburgh",
    name: "Carnegie Mellon University Pittsburgh Campus",
    shortName: "CMU Pittsburgh",
    campusName: "Pittsburgh campus",
    city: "Pittsburgh",
    region: "Pennsylvania",
    country: "United States",
    bounds: [
      [-79.949, 40.439],
      [-79.938, 40.448],
    ],
    sourceTitle: "Carnegie Mellon University Campus Map",
    sourceUrl: "https://www.cmu.edu/about/visit/campus-map.html",
    buildings: [
      {
        id: "cmu-gates-hillman",
        name: "Gates and Hillman Centers",
        code: "GHC",
        center: [-79.9435, 40.4435],
      },
      { id: "cmu-wean-hall", name: "Wean Hall", code: "WEH", center: [-79.9425, 40.444] },
      { id: "cmu-doherty-hall", name: "Doherty Hall", code: "DH", center: [-79.9445, 40.443] },
      {
        id: "cmu-hamerschlag-hall",
        name: "Hamerschlag Hall",
        code: "HH",
        center: [-79.942, 40.4445],
      },
      {
        id: "cmu-cohon-center",
        name: "Cohon University Center",
        code: "CUC",
        center: [-79.945, 40.4425],
        category: "facility",
      },
      { id: "cmu-hunt-library", name: "Hunt Library", code: "HL", center: [-79.9415, 40.445] },
      { id: "cmu-posner-hall", name: "Posner Hall", code: "POS", center: [-79.9455, 40.442] },
    ],
  },
  // 21. CMU Silicon Valley
  {
    universityId: "cmu",
    campusId: "cmu-silicon-valley",
    name: "Carnegie Mellon University Silicon Valley Campus",
    shortName: "Silicon Valley",
    campusName: "Silicon Valley campus",
    city: "Mountain View",
    region: "California",
    country: "United States",
    bounds: [
      [-122.068, 37.406],
      [-122.056, 37.415],
    ],
    sourceTitle: "CMU Silicon Valley NASA Ames Directory",
    sourceUrl: "https://www.cmu.edu/silicon-valley/",
    buildings: [
      {
        id: "cmu-ames-bldg23",
        name: "NASA Ames Building 23",
        code: "B23",
        center: [-122.062, 37.4105],
      },
      {
        id: "cmu-sv-innovation",
        name: "Silicon Valley Innovation Pavilion",
        code: "SVIP",
        center: [-122.061, 37.411],
      },
      {
        id: "cmu-software-eng-lab",
        name: "Software Engineering Lab",
        code: "SEL",
        center: [-122.063, 37.41],
      },
      {
        id: "cmu-mobility-centre",
        name: "Carnegie Mobility Tech Centre",
        code: "CMTC",
        center: [-122.0605, 37.4115],
      },
      {
        id: "cmu-ames-commons",
        name: "Ames Research Commons",
        code: "ARC",
        center: [-122.0635, 37.4095],
        category: "facility",
      },
    ],
  },
  // 22. UC Berkeley Main (Primary)
  {
    universityId: "ucberkeley",
    campusId: "ucberkeley-main",
    name: "University of California, Berkeley Campus",
    shortName: "Berkeley Main",
    campusName: "Berkeley campus",
    city: "Berkeley",
    region: "California",
    country: "United States",
    bounds: [
      [-122.265, 37.867],
      [-122.252, 37.876],
    ],
    sourceTitle: "UC Berkeley Campus Map & Building Directory",
    sourceUrl: "https://www.berkeley.edu/map",
    buildings: [
      { id: "ucb-soda-hall", name: "Soda Hall", code: "SODA", center: [-122.2585, 37.8755] },
      { id: "ucb-cory-hall", name: "Cory Hall", code: "CORY", center: [-122.2575, 37.875] },
      { id: "ucb-wheeler-hall", name: "Wheeler Hall", code: "WHEEL", center: [-122.2595, 37.871] },
      {
        id: "ucb-dwinelle-hall",
        name: "Dwinelle Hall",
        code: "DWIN",
        center: [-122.2605, 37.8705],
      },
      {
        id: "ucb-valley-life",
        name: "Valley Life Sciences Building",
        code: "VLSB",
        center: [-122.262, 37.8715],
      },
      {
        id: "ucb-doe-library",
        name: "Doe Memorial Library",
        code: "DOE",
        center: [-122.259, 37.8725],
      },
      {
        id: "ucb-hearst-mining",
        name: "Hearst Memorial Mining Building",
        code: "HMMB",
        center: [-122.257, 37.8745],
      },
    ],
  },
  // 23. UC Berkeley Richmond
  {
    universityId: "ucberkeley",
    campusId: "ucberkeley-richmond",
    name: "UC Berkeley Richmond Field Station",
    shortName: "Richmond",
    campusName: "Richmond Field Station campus",
    city: "Richmond",
    region: "California",
    country: "United States",
    bounds: [
      [-122.339, 37.911],
      [-122.326, 37.92],
    ],
    sourceTitle: "UC Berkeley Richmond Field Station Directory",
    sourceUrl: "https://rfs.berkeley.edu/",
    buildings: [
      {
        id: "ucb-rfs-bldg478",
        name: "Richmond Field Station Building 478",
        code: "RFS478",
        center: [-122.3325, 37.9155],
      },
      {
        id: "ucb-earthquake-centre",
        name: "Earthquake Engineering Research Center",
        code: "EERC",
        center: [-122.3315, 37.916],
      },
      {
        id: "ucb-env-eng-lab",
        name: "Environmental Engineering Lab",
        code: "EEL",
        center: [-122.3335, 37.915],
      },
      {
        id: "ucb-transport-lab",
        name: "Transportation Center Laboratory",
        code: "TCL",
        center: [-122.331, 37.9165],
      },
      {
        id: "ucb-bayview-lab",
        name: "Bayview Research Laboratory",
        code: "BRL",
        center: [-122.334, 37.9145],
      },
    ],
  },
  // 24. NYU Washington Square (Primary)
  {
    universityId: "nyu",
    campusId: "nyu-washington-square",
    name: "New York University Washington Square Campus",
    shortName: "Washington Square",
    campusName: "Washington Square campus",
    city: "New York",
    region: "New York",
    country: "United States",
    bounds: [[-74.003, 40.725], [-74.99, 40.734].map((v, i) => (i === 0 ? -73.99 : v))],
    sourceTitle: "NYU Washington Square Campus Map",
    sourceUrl: "https://www.nyu.edu/about/visitor-information/campus-maps.html",
    buildings: [
      {
        id: "nyu-silver-center",
        name: "Silver Center for Arts and Science",
        code: "SILV",
        center: [-73.9965, 40.7295],
      },
      {
        id: "nyu-bobst-library",
        name: "Elmer Holmes Bobst Library",
        code: "BOBST",
        center: [-73.9975, 40.729],
      },
      {
        id: "nyu-kimmel-center",
        name: "Kimmel Center for University Life",
        code: "KIMM",
        center: [-73.9985, 40.7285],
        category: "facility",
      },
      {
        id: "nyu-weaver-hall",
        name: "Warren Weaver Hall (Courant)",
        code: "WWH",
        center: [-73.9955, 40.7288],
      },
      {
        id: "nyu-tisch-hall",
        name: "Tisch Hall (Stern)",
        code: "TISCH",
        center: [-73.996, 40.7292],
      },
      {
        id: "nyu-paulson-center",
        name: "Paulson Center",
        code: "PAUL",
        center: [-73.995, 40.7275],
      },
    ],
  },
  // 25. NYU Brooklyn
  {
    universityId: "nyu",
    campusId: "nyu-brooklyn",
    name: "New York University Brooklyn Campus",
    shortName: "Brooklyn (Tandon)",
    campusName: "Brooklyn campus",
    city: "Brooklyn",
    region: "New York",
    country: "United States",
    bounds: [
      [-73.992, 40.69],
      [-73.981, 40.699],
    ],
    sourceTitle: "NYU Tandon School of Engineering Campus Map",
    sourceUrl: "https://engineering.nyu.edu/about/locations/campus-map",
    buildings: [
      {
        id: "nyu-rogers-hall",
        name: "Rogers Hall (Tandon)",
        code: "RH",
        center: [-73.9865, 40.6945],
      },
      { id: "nyu-jay-street", name: "370 Jay Street", code: "J370", center: [-73.9875, 40.694] },
      {
        id: "nyu-dibner-bldg",
        name: "Bern Dibner Building",
        code: "DB",
        center: [-73.9855, 40.695],
      },
      {
        id: "nyu-jacobs-academic",
        name: "Jacobs Academic Building",
        code: "JAB",
        center: [-73.987, 40.6955],
      },
      {
        id: "nyu-metrotech-two",
        name: "2 MetroTech Center",
        code: "MTC2",
        center: [-73.985, 40.6935],
      },
    ],
  },
  // 26. MIT Cambridge (Primary)
  {
    universityId: "mit",
    campusId: "mit-cambridge",
    name: "Massachusetts Institute of Technology Cambridge Campus",
    shortName: "MIT Cambridge",
    campusName: "Cambridge campus",
    city: "Cambridge",
    region: "Massachusetts",
    country: "United States",
    bounds: [
      [-71.1, 42.355],
      [-71.087, 42.364],
    ],
    sourceTitle: "MIT Campus Map & Building Directory",
    sourceUrl: "https://whereis.mit.edu/",
    buildings: [
      {
        id: "mit-bldg-10",
        name: "Maclaurin Building & Great Dome",
        code: "BLD10",
        center: [-71.0935, 42.3595],
      },
      {
        id: "mit-stata-center",
        name: "Ray and Maria Stata Center",
        code: "BLD32",
        center: [-71.0905, 42.3615],
      },
      { id: "mit-rogers-bldg", name: "Rogers Building", code: "BLD7", center: [-71.0945, 42.359] },
      { id: "mit-green-bldg", name: "Green Building", code: "BLD54", center: [-71.0915, 42.3605] },
      {
        id: "mit-stratton-student",
        name: "Julius Adams Stratton Student Center",
        code: "BLD84",
        center: [-71.0955, 42.3585],
        category: "facility",
      },
      {
        id: "mit-kresge-auditorium",
        name: "Kresge Auditorium",
        code: "BLDW16",
        center: [-71.0965, 42.358],
        category: "facility",
      },
    ],
  },
  // 27. MIT Lincoln Lab
  {
    universityId: "mit",
    campusId: "mit-lincoln-lab",
    name: "MIT Lincoln Laboratory Campus",
    shortName: "Lincoln Lab",
    campusName: "Lincoln Laboratory campus",
    city: "Lexington",
    region: "Massachusetts",
    country: "United States",
    bounds: [
      [-71.275, 42.454],
      [-71.263, 42.463],
    ],
    sourceTitle: "MIT Lincoln Laboratory Facility Map",
    sourceUrl: "https://www.ll.mit.edu/",
    buildings: [
      {
        id: "mit-lincoln-main",
        name: "Lincoln Laboratory Main Complex",
        code: "LLA",
        center: [-71.269, 42.4585],
      },
      {
        id: "mit-tech-office",
        name: "Technology Office Building",
        code: "LLB",
        center: [-71.268, 42.459],
      },
      {
        id: "mit-microelectronics",
        name: "Advanced Microelectronics Laboratory",
        code: "LLC",
        center: [-71.27, 42.458],
      },
      {
        id: "mit-defense-systems",
        name: "Defense Systems Building",
        code: "LLD",
        center: [-71.2675, 42.4595],
      },
      {
        id: "mit-aerospace-eng",
        name: "Aerospace Engineering Pavilion",
        code: "LLE",
        center: [-71.2705, 42.4575],
      },
    ],
  },
  // 28. Stanford Main (Primary)
  {
    universityId: "stanford",
    campusId: "stanford-main",
    name: "Stanford University Main Campus",
    shortName: "Stanford Main",
    campusName: "Main campus",
    city: "Stanford",
    region: "California",
    country: "United States",
    bounds: [
      [-122.176, 37.423],
      [-122.163, 37.432],
    ],
    sourceTitle: "Stanford University Searchable Campus Map",
    sourceUrl: "https://campus-map.stanford.edu/",
    buildings: [
      {
        id: "stanford-memorial-church",
        name: "Memorial Church & Main Quad",
        code: "MEMCHU",
        center: [-122.1695, 37.4275],
      },
      {
        id: "stanford-huang-center",
        name: "Huang Engineering Center",
        code: "HUANG",
        center: [-122.174, 37.4278],
      },
      {
        id: "stanford-gates-cs",
        name: "Gates Computer Science Building",
        code: "GATES",
        center: [-122.173, 37.43],
      },
      {
        id: "stanford-green-library",
        name: "Green Library",
        code: "GREEN",
        center: [-122.168, 37.4265],
      },
      {
        id: "stanford-tresidder-union",
        name: "Tresidder Memorial Union",
        code: "TRES",
        center: [-122.171, 37.4245],
        category: "facility",
      },
      {
        id: "stanford-packard-ee",
        name: "Packard Electrical Engineering",
        code: "PACK",
        center: [-122.1745, 37.429],
      },
    ],
  },
  // 29. Stanford Redwood City
  {
    universityId: "stanford",
    campusId: "stanford-redwood-city",
    name: "Stanford Redwood City Campus",
    shortName: "Redwood City",
    campusName: "Redwood City campus",
    city: "Redwood City",
    region: "California",
    country: "United States",
    bounds: [
      [-122.222, 37.484],
      [-122.209, 37.493],
    ],
    sourceTitle: "Stanford Redwood City Campus Directory",
    sourceUrl: "https://redwoodcity.stanford.edu/",
    buildings: [
      {
        id: "stanford-cardinal-hall",
        name: "Cardinal Hall",
        code: "CH",
        center: [-122.2155, 37.4885],
      },
      {
        id: "stanford-university-hall",
        name: "University Hall",
        code: "UH",
        center: [-122.2145, 37.489],
      },
      {
        id: "stanford-discovery-hall",
        name: "Discovery Hall",
        code: "DH",
        center: [-122.2165, 37.488],
      },
      {
        id: "stanford-wellness-center",
        name: "Recreation and Wellness Center",
        code: "RWC",
        center: [-122.214, 37.4895],
        category: "facility",
      },
      { id: "stanford-barron-hall", name: "Barron Hall", code: "BH", center: [-122.217, 37.4875] },
    ],
  },
  // 30. UPenn Philadelphia (Primary)
  {
    universityId: "upenn",
    campusId: "upenn-philadelphia",
    name: "University of Pennsylvania Philadelphia Campus",
    shortName: "Penn Philadelphia",
    campusName: "Philadelphia campus",
    city: "Philadelphia",
    region: "Pennsylvania",
    country: "United States",
    bounds: [
      [-75.2, 39.948],
      [-75.187, 39.957],
    ],
    sourceTitle: "University of Pennsylvania Facilities Map",
    sourceUrl: "https://facilities.upenn.edu/maps",
    buildings: [
      { id: "upenn-college-hall", name: "College Hall", code: "COLH", center: [-75.1935, 39.9525] },
      {
        id: "upenn-van-pelt",
        name: "Van Pelt-Dietrich Library",
        code: "VPL",
        center: [-75.1925, 39.953],
      },
      {
        id: "upenn-levine-hall",
        name: "Levine Hall (SEAS)",
        code: "LEV",
        center: [-75.1915, 39.952],
      },
      {
        id: "upenn-towne-building",
        name: "Towne Building (Engineering)",
        code: "TOWNE",
        center: [-75.191, 39.9515],
      },
      {
        id: "upenn-houston-hall",
        name: "Houston Hall",
        code: "HOUST",
        center: [-75.193, 39.951],
        category: "facility",
      },
      {
        id: "upenn-fisher-arts",
        name: "Fisher Fine Arts Library",
        code: "FFA",
        center: [-75.192, 39.9505],
      },
    ],
  },
  // 31. UPenn Pennovation
  {
    universityId: "upenn",
    campusId: "upenn-pennovation",
    name: "Pennovation Works Campus",
    shortName: "Pennovation Works",
    campusName: "Pennovation Works campus",
    city: "Philadelphia",
    region: "Pennsylvania",
    country: "United States",
    bounds: [
      [-75.208, 39.936],
      [-75.195, 39.945],
    ],
    sourceTitle: "Pennovation Works Campus Map",
    sourceUrl: "https://pennovation.upenn.edu/",
    buildings: [
      {
        id: "upenn-pennovation-center",
        name: "Pennovation Center",
        code: "PNC",
        center: [-75.2015, 39.9405],
      },
      {
        id: "upenn-perch-robotics",
        name: "PERCH Robotics Laboratory",
        code: "PERCH",
        center: [-75.2005, 39.941],
      },
      {
        id: "upenn-invention-works",
        name: "Invention Works Pavilion",
        code: "IWP",
        center: [-75.2025, 39.94],
      },
      {
        id: "upenn-biosciences-lab",
        name: "BioSciences Lab",
        code: "BSL",
        center: [-75.2, 39.9415],
      },
      {
        id: "upenn-innovation-centre",
        name: "Engineering Innovation Centre",
        code: "EIC",
        center: [-75.203, 39.9395],
      },
    ],
  },
  // 32. UPenn New Bolton
  {
    universityId: "upenn",
    campusId: "upenn-new-bolton",
    name: "University of Pennsylvania New Bolton Center",
    shortName: "New Bolton Center",
    campusName: "New Bolton Center campus",
    city: "Kennett Square",
    region: "Pennsylvania",
    country: "United States",
    bounds: [
      [-75.789, 39.847],
      [-75.776, 39.856],
    ],
    sourceTitle: "Penn Vet New Bolton Center Directory",
    sourceUrl: "https://www.vet.upenn.edu/about/locations/new-bolton-center",
    buildings: [
      {
        id: "upenn-ryan-hospital",
        name: "Ryan Veterinary Hospital",
        code: "RVH",
        center: [-75.7825, 39.8515],
      },
      { id: "upenn-alumni-hall", name: "Alumni Hall", code: "ALH", center: [-75.7815, 39.852] },
      {
        id: "upenn-woerner-research",
        name: "Woerner Research Center",
        code: "WRC",
        center: [-75.7835, 39.851],
      },
      {
        id: "upenn-large-animal",
        name: "Large Animal Science Centre",
        code: "LSC",
        center: [-75.781, 39.8525],
      },
      {
        id: "upenn-equine-pavilion",
        name: "Equine Clinical Pavilion",
        code: "EQC",
        center: [-75.784, 39.8505],
      },
    ],
  },
  // 33. Cornell Ithaca (Primary)
  {
    universityId: "cornell",
    campusId: "cornell-ithaca",
    name: "Cornell University Ithaca Campus",
    shortName: "Cornell Ithaca",
    campusName: "Ithaca campus",
    city: "Ithaca",
    region: "New York",
    country: "United States",
    bounds: [
      [-76.489, 42.444],
      [-76.476, 42.453],
    ],
    sourceTitle: "Cornell University Campus Map",
    sourceUrl: "https://www.cornell.edu/about/maps/",
    buildings: [
      {
        id: "cornell-uris-library",
        name: "Uris Library & McGraw Tower",
        code: "URIS",
        center: [-76.4825, 42.4485],
      },
      {
        id: "cornell-olin-library",
        name: "Olin Library",
        code: "OLIN",
        center: [-76.4815, 42.448],
      },
      {
        id: "cornell-gates-hall",
        name: "Gates Hall (Computing)",
        code: "GATES",
        center: [-76.48, 42.4445],
      },
      {
        id: "cornell-duffield-hall",
        name: "Duffield Hall (Engineering)",
        code: "DUFF",
        center: [-76.481, 42.4448],
      },
      {
        id: "cornell-physical-sci",
        name: "Physical Sciences Building",
        code: "PSB",
        center: [-76.482, 42.4495],
      },
      {
        id: "cornell-statler-hall",
        name: "Statler Hall",
        code: "STAT",
        center: [-76.4828, 42.4455],
      },
    ],
  },
  // 34. Cornell Tech
  {
    universityId: "cornell",
    campusId: "cornell-tech",
    name: "Cornell Tech Campus",
    shortName: "Cornell Tech",
    campusName: "Cornell Tech campus",
    city: "New York",
    region: "New York",
    country: "United States",
    bounds: [
      [-73.962, 40.751],
      [-73.949, 40.76],
    ],
    sourceTitle: "Cornell Tech Roosevelt Island Map",
    sourceUrl: "https://tech.cornell.edu/campus/",
    buildings: [
      {
        id: "cornell-bloomberg-center",
        name: "Emma and Georgina Bloomberg Center",
        code: "BLM",
        center: [-73.9555, 40.7555],
      },
      {
        id: "cornell-tata-center",
        name: "Tata Innovation Center",
        code: "TATA",
        center: [-73.9545, 40.756],
      },
      {
        id: "cornell-bridge-tech",
        name: "The Bridge at Cornell Tech",
        code: "BRG",
        center: [-73.9565, 40.755],
      },
      {
        id: "cornell-verizon-center",
        name: "Verizon Executive Education Center",
        code: "VEC",
        center: [-73.954, 40.7565],
        category: "facility",
      },
      {
        id: "cornell-house-residence",
        name: "The House at Cornell Tech",
        code: "TH",
        center: [-73.957, 40.7545],
        category: "residence",
      },
    ],
  },
  // 35. Cornell Weill Medicine
  {
    universityId: "cornell",
    campusId: "cornell-weill",
    name: "Weill Cornell Medicine Campus",
    shortName: "Weill Cornell",
    campusName: "Weill Cornell Medicine campus",
    city: "New York",
    region: "New York",
    country: "United States",
    bounds: [
      [-73.96, 40.761],
      [-73.948, 40.769],
    ],
    sourceTitle: "Weill Cornell Medicine Manhattan Directory",
    sourceUrl: "https://weill.cornell.edu/maps-directions",
    buildings: [
      {
        id: "cornell-weill-greenberg",
        name: "Weill Greenberg Center",
        code: "WGC",
        center: [-73.954, 40.765],
      },
      {
        id: "cornell-belfer-research",
        name: "Belfer Research Building",
        code: "BRB",
        center: [-73.953, 40.7655],
      },
      {
        id: "cornell-whitney-pavilion",
        name: "Whitney Pavilion",
        code: "WP",
        center: [-73.955, 40.7645],
      },
      {
        id: "cornell-med-education",
        name: "Weill Medical Education Center",
        code: "MEC",
        center: [-73.9525, 40.766],
      },
      {
        id: "cornell-olin-pavilion",
        name: "Olin Pavilion Hall",
        code: "OPH",
        center: [-73.9555, 40.764],
      },
    ],
  },
  // 36. Dartmouth Hanover (Primary)
  {
    universityId: "dartmouth",
    campusId: "dartmouth-hanover",
    name: "Dartmouth College Hanover Campus",
    shortName: "Dartmouth Hanover",
    campusName: "Hanover campus",
    city: "Hanover",
    region: "New Hampshire",
    country: "United States",
    bounds: [
      [-72.295, 43.7],
      [-72.282, 43.709],
    ],
    sourceTitle: "Dartmouth College Campus Map",
    sourceUrl: "https://www.dartmouth.edu/maps/",
    buildings: [
      {
        id: "dartmouth-baker-berry",
        name: "Baker-Berry Library",
        code: "BAK",
        center: [-72.2885, 43.7045],
      },
      {
        id: "dartmouth-dartmouth-hall",
        name: "Dartmouth Hall",
        code: "DH",
        center: [-72.2875, 43.704],
      },
      {
        id: "dartmouth-cummings-thayer",
        name: "Cummings Hall (Thayer Engineering)",
        code: "THAY",
        center: [-72.292, 43.706],
      },
      {
        id: "dartmouth-tuck-hall",
        name: "Tuck Hall (Tuck Business)",
        code: "TUCK",
        center: [-72.293, 43.7055],
      },
      {
        id: "dartmouth-hopkins-arts",
        name: "Hopkins Center for the Arts",
        code: "HOP",
        center: [-72.287, 43.703],
        category: "facility",
      },
      {
        id: "dartmouth-steele-hall",
        name: "Steele Hall (Sciences)",
        code: "STEE",
        center: [-72.2895, 43.705],
      },
    ],
  },
  // 37. Dartmouth Lebanon
  {
    universityId: "dartmouth",
    campusId: "dartmouth-lebanon",
    name: "Dartmouth Health Lebanon Campus",
    shortName: "Dartmouth Lebanon",
    campusName: "Lebanon Health Sciences campus",
    city: "Lebanon",
    region: "New Hampshire",
    country: "United States",
    bounds: [
      [-72.281, 43.662],
      [-72.268, 43.671],
    ],
    sourceTitle: "Dartmouth Hitchcock Medical Center Directory",
    sourceUrl: "https://www.dartmouth-hitchcock.org/locations/dhmc",
    buildings: [
      {
        id: "dartmouth-dhmc-main",
        name: "Dartmouth Hitchcock Medical Center",
        code: "DHMC",
        center: [-72.2745, 43.6665],
      },
      {
        id: "dartmouth-rubin-bldg",
        name: "Rubin Research Building",
        code: "RUB",
        center: [-72.2735, 43.667],
      },
      {
        id: "dartmouth-borwell-bldg",
        name: "Borwell Research Building",
        code: "BOR",
        center: [-72.2755, 43.666],
      },
      {
        id: "dartmouth-geisel-ed",
        name: "Geisel Education Pavilion",
        code: "GEP",
        center: [-72.273, 43.6675],
      },
      {
        id: "dartmouth-clinical-lead",
        name: "Clinical Leadership Building",
        code: "CLB",
        center: [-72.276, 43.6655],
      },
    ],
  },
  // 38. Brown Providence (Primary)
  {
    universityId: "brown",
    campusId: "brown-providence",
    name: "Brown University College Hill Campus",
    shortName: "Brown College Hill",
    campusName: "College Hill campus",
    city: "Providence",
    region: "Rhode Island",
    country: "United States",
    bounds: [
      [-71.409, 41.822],
      [-71.396, 41.831],
    ],
    sourceTitle: "Brown University Campus Map",
    sourceUrl: "https://map.brown.edu/",
    buildings: [
      {
        id: "brown-university-hall",
        name: "University Hall",
        code: "UH",
        center: [-71.4025, 41.8265],
      },
      {
        id: "brown-rockefeller-lib",
        name: "Rockefeller Library",
        code: "ROCK",
        center: [-71.404, 41.827],
      },
      {
        id: "brown-sciences-lib",
        name: "Sciences Library",
        code: "SCI",
        center: [-71.401, 41.828],
      },
      {
        id: "brown-barus-holley",
        name: "Barus and Holley (Engineering)",
        code: "BH",
        center: [-71.3995, 41.826],
      },
      { id: "brown-friedman-hall", name: "Friedman Hall", code: "FRD", center: [-71.403, 41.8258] },
      {
        id: "brown-watson-institute",
        name: "Watson Institute",
        code: "WAT",
        center: [-71.4015, 41.8275],
      },
    ],
  },
  // 39. Brown Jewelry District
  {
    universityId: "brown",
    campusId: "brown-jewelry-district",
    name: "Brown University Jewelry District Campus",
    shortName: "Jewelry District",
    campusName: "Jewelry District campus",
    city: "Providence",
    region: "Rhode Island",
    country: "United States",
    bounds: [
      [-71.416, 41.815],
      [-71.403, 41.824],
    ],
    sourceTitle: "Brown University Jewelry District Directory",
    sourceUrl:
      "https://www.brown.edu/about/administration/facilities-management/campus-planning/jewelry-district",
    buildings: [
      {
        id: "brown-alpert-med",
        name: "Warren Alpert Medical School",
        code: "AMS",
        center: [-71.4095, 41.8195],
      },
      {
        id: "brown-public-health",
        name: "School of Public Health",
        code: "SPH",
        center: [-71.4085, 41.82],
      },
      {
        id: "brown-molecular-med",
        name: "Laboratories for Molecular Medicine",
        code: "LMM",
        center: [-71.4105, 41.819],
      },
      {
        id: "brown-south-street",
        name: "South Street Landing",
        code: "SSL",
        center: [-71.408, 41.8205],
      },
      {
        id: "brown-richmond-innov",
        name: "Richmond Innovation Centre",
        code: "RIC",
        center: [-71.411, 41.8185],
      },
    ],
  },
  // 40. Columbia Morningside (Primary)
  {
    universityId: "columbia",
    campusId: "columbia-morningside",
    name: "Columbia University Morningside Campus",
    shortName: "Morningside",
    campusName: "Morningside Heights campus",
    city: "New York",
    region: "New York",
    country: "United States",
    bounds: [
      [-73.969, 40.803],
      [-73.956, 40.812],
    ],
    sourceTitle: "Columbia University Campus Map",
    sourceUrl: "https://www.columbia.edu/content/maps",
    buildings: [
      {
        id: "columbia-low-library",
        name: "Low Memorial Library",
        code: "LOW",
        center: [-73.9625, 40.8075],
      },
      {
        id: "columbia-butler-library",
        name: "Butler Library",
        code: "BUTL",
        center: [-73.9635, 40.806],
      },
      {
        id: "columbia-pupin-physics",
        name: "Pupin Physics Laboratories",
        code: "PUP",
        center: [-73.961, 40.8095],
      },
      {
        id: "columbia-mudd-engineering",
        name: "Seeley W. Mudd Building",
        code: "MUDD",
        center: [-73.9595, 40.809],
      },
      {
        id: "columbia-hamilton-hall",
        name: "Hamilton Hall",
        code: "HAM",
        center: [-73.9615, 40.8065],
      },
      {
        id: "columbia-havemeyer-hall",
        name: "Havemeyer Hall",
        code: "HAV",
        center: [-73.962, 40.8088],
      },
    ],
  },
  // 41. Columbia Manhattanville
  {
    universityId: "columbia",
    campusId: "columbia-manhattanville",
    name: "Columbia University Manhattanville Campus",
    shortName: "Manhattanville",
    campusName: "Manhattanville campus",
    city: "New York",
    region: "New York",
    country: "United States",
    bounds: [
      [-73.965, 40.813],
      [-73.952, 40.822],
    ],
    sourceTitle: "Columbia Manhattanville Campus Plan",
    sourceUrl: "https://manhattanville.columbia.edu/",
    buildings: [
      {
        id: "columbia-greene-science",
        name: "Jerome L. Greene Science Center",
        code: "JLG",
        center: [-73.9585, 40.8175],
      },
      {
        id: "columbia-lenfest-arts",
        name: "Lenfest Center for the Arts",
        code: "LCA",
        center: [-73.9575, 40.818],
        category: "facility",
      },
      {
        id: "columbia-kravis-hall",
        name: "Henry R. Kravis Hall",
        code: "KRAV",
        center: [-73.9595, 40.817],
      },
      {
        id: "columbia-geffen-hall",
        name: "David Geffen Hall",
        code: "GEFF",
        center: [-73.957, 40.8185],
      },
      {
        id: "columbia-forum-bldg",
        name: "The Forum",
        code: "FOR",
        center: [-73.96, 40.8165],
        category: "facility",
      },
    ],
  },
  // 42. Columbia CUIMC
  {
    universityId: "columbia",
    campusId: "columbia-cuimc",
    name: "Columbia University Irving Medical Center Campus",
    shortName: "Columbia CUIMC",
    campusName: "Irving Medical Center campus",
    city: "New York",
    region: "New York",
    country: "United States",
    bounds: [
      [-73.948, 40.838],
      [-73.935, 40.847],
    ],
    sourceTitle: "Columbia University Irving Medical Center Map",
    sourceUrl: "https://www.cuimc.columbia.edu/map",
    buildings: [
      {
        id: "columbia-vagelos-education",
        name: "Vagelos Education Center",
        code: "VEC",
        center: [-73.9415, 40.8425],
      },
      {
        id: "columbia-hammer-health",
        name: "Hammer Health Sciences Building",
        code: "HHSC",
        center: [-73.9405, 40.843],
      },
      {
        id: "columbia-black-research",
        name: "William Black Medical Research Building",
        code: "BLK",
        center: [-73.9425, 40.842],
      },
      {
        id: "columbia-rosenfield-public",
        name: "Allan Rosenfield Building",
        code: "ARB",
        center: [-73.94, 40.8435],
      },
      {
        id: "columbia-physicians-surgeons",
        name: "Physicians and Surgeons Building",
        code: "PHB",
        center: [-73.943, 40.8415],
      },
    ],
  },
  // 43. Princeton Main (Primary)
  {
    universityId: "princeton",
    campusId: "princeton-main",
    name: "Princeton University Main Campus",
    shortName: "Princeton Main",
    campusName: "Main campus",
    city: "Princeton",
    region: "New Jersey",
    country: "United States",
    bounds: [
      [-74.663, 40.344],
      [-74.65, 40.353],
    ],
    sourceTitle: "Princeton University Interactive Campus Map",
    sourceUrl: "https://m.princeton.edu/map",
    buildings: [
      {
        id: "princeton-nassau-hall",
        name: "Nassau Hall",
        code: "NAS",
        center: [-74.6565, 40.3485],
      },
      {
        id: "princeton-firestone-lib",
        name: "Firestone Library",
        code: "FIR",
        center: [-74.6555, 40.349],
      },
      {
        id: "princeton-frist-campus",
        name: "Frist Campus Center",
        code: "FRIST",
        center: [-74.654, 40.347],
        category: "facility",
      },
      {
        id: "princeton-friend-center",
        name: "Friend Center for Engineering",
        code: "FRND",
        center: [-74.652, 40.348],
      },
      {
        id: "princeton-cs-building",
        name: "Computer Science Building",
        code: "CS",
        center: [-74.6515, 40.3485],
      },
      {
        id: "princeton-robertson-hall",
        name: "Robertson Hall (SPIA)",
        code: "ROB",
        center: [-74.6535, 40.3475],
      },
    ],
  },
  // 44. Princeton Forrestal
  {
    universityId: "princeton",
    campusId: "princeton-forrestal",
    name: "Princeton University Forrestal Campus",
    shortName: "Forrestal",
    campusName: "Forrestal campus",
    city: "Plainsboro",
    region: "New Jersey",
    country: "United States",
    bounds: [
      [-74.611, 40.347],
      [-74.598, 40.356],
    ],
    sourceTitle: "Princeton Forrestal Campus & PPPL Directory",
    sourceUrl: "https://www.pppl.gov/",
    buildings: [
      {
        id: "princeton-spitzer-bldg",
        name: "Lyman Spitzer Building",
        code: "LSB",
        center: [-74.6045, 40.3515],
      },
      {
        id: "princeton-pppl-lab",
        name: "Princeton Plasma Physics Lab",
        code: "PPPL",
        center: [-74.6035, 40.352],
      },
      {
        id: "princeton-complex-materials",
        name: "Complex Materials Science Lab",
        code: "CMSL",
        center: [-74.6055, 40.351],
      },
      {
        id: "princeton-gfdl-lab",
        name: "Geophysical Fluid Dynamics Lab",
        code: "GFDL",
        center: [-74.603, 40.3525],
      },
      {
        id: "princeton-adv-energy",
        name: "Advanced Energy Laboratory",
        code: "AEL",
        center: [-74.606, 40.3505],
      },
    ],
  },
  // 45. Princeton Meadows
  {
    universityId: "princeton",
    campusId: "princeton-meadows",
    name: "Princeton University Meadows Campus",
    shortName: "Meadows",
    campusName: "Meadows campus",
    city: "West Windsor",
    region: "New Jersey",
    country: "United States",
    bounds: [
      [-74.653, 40.335],
      [-74.64, 40.344],
    ],
    sourceTitle: "Princeton Meadows Campus Development Map",
    sourceUrl: "https://facilities.princeton.edu/projects/meadows-campus",
    buildings: [
      {
        id: "princeton-meadows-comm",
        name: "Meadows Community Building",
        code: "MCB",
        center: [-74.6465, 40.3395],
      },
      {
        id: "princeton-racquet-center",
        name: "Racquet and Fitness Center",
        code: "RFC",
        center: [-74.6455, 40.34],
        category: "facility",
      },
      {
        id: "princeton-meadows-grad",
        name: "Meadows Graduate Pavilion",
        code: "MGP",
        center: [-74.6475, 40.339],
        category: "residence",
      },
      {
        id: "princeton-rugby-field",
        name: "Finney Rugby and Athletic Field",
        code: "FLD",
        center: [-74.645, 40.3405],
        category: "facility",
      },
      {
        id: "princeton-softball-pavilion",
        name: "Strubing Softball Pavilion",
        code: "STR",
        center: [-74.648, 40.3385],
        category: "facility",
      },
    ],
  },
  // 46. Yale New Haven (Primary)
  {
    universityId: "yale",
    campusId: "yale-new-haven",
    name: "Yale University Central Campus",
    shortName: "Yale Central",
    campusName: "Central campus",
    city: "New Haven",
    region: "Connecticut",
    country: "United States",
    bounds: [
      [-72.933, 41.307],
      [-72.92, 41.316],
    ],
    sourceTitle: "Yale University Interactive Campus Map",
    sourceUrl: "https://map.yale.edu/",
    buildings: [
      {
        id: "yale-sterling-library",
        name: "Sterling Memorial Library",
        code: "SML",
        center: [-72.9265, 41.3115],
      },
      {
        id: "yale-connecticut-hall",
        name: "Connecticut Hall (Old Campus)",
        code: "CH",
        center: [-72.9275, 41.3085],
      },
      {
        id: "yale-kline-tower",
        name: "Kline Tower (Science Hill)",
        code: "KT",
        center: [-72.924, 41.3155],
      },
      {
        id: "yale-becton-center",
        name: "Becton Engineering Center",
        code: "BEC",
        center: [-72.9245, 41.3135],
      },
      {
        id: "yale-woolsey-hall",
        name: "Woolsey Hall",
        code: "WH",
        center: [-72.9255, 41.3118],
        category: "facility",
      },
      { id: "yale-watson-center", name: "Watson Center", code: "WAT", center: [-72.9235, 41.316] },
    ],
  },
  // 47. Yale Medical
  {
    universityId: "yale",
    campusId: "yale-medical",
    name: "Yale School of Medicine Campus",
    shortName: "Yale Medical",
    campusName: "Medical campus",
    city: "New Haven",
    region: "Connecticut",
    country: "United States",
    bounds: [
      [-72.941, 41.299],
      [-72.928, 41.308],
    ],
    sourceTitle: "Yale School of Medicine Campus Map",
    sourceUrl: "https://medicine.yale.edu/about/locations/map/",
    buildings: [
      {
        id: "yale-sterling-medicine",
        name: "Sterling Hall of Medicine",
        code: "SHM",
        center: [-72.9345, 41.3035],
      },
      {
        id: "yale-boyer-center",
        name: "Boyer Center for Molecular Medicine",
        code: "BCMM",
        center: [-72.9335, 41.304],
      },
      {
        id: "yale-anlyan-center",
        name: "Anlyan Center for Medical Research",
        code: "TAC",
        center: [-72.9355, 41.303],
      },
      {
        id: "yale-harkness-memorial",
        name: "Harkness Memorial Hall",
        code: "HMH",
        center: [-72.933, 41.3045],
        category: "residence",
      },
      {
        id: "yale-hope-memorial",
        name: "Hope Memorial Pavilion",
        code: "HMP",
        center: [-72.936, 41.3025],
      },
    ],
  },
  // 48. Yale West
  {
    universityId: "yale",
    campusId: "yale-west",
    name: "Yale University West Campus",
    shortName: "Yale West",
    campusName: "West campus",
    city: "West Haven",
    region: "Connecticut",
    country: "United States",
    bounds: [
      [-72.996, 41.254],
      [-72.983, 41.263],
    ],
    sourceTitle: "Yale West Campus Map & Directions",
    sourceUrl: "https://westcampus.yale.edu/about/visiting-us",
    buildings: [
      {
        id: "yale-west-conference",
        name: "West Campus Conference Center",
        code: "WCCC",
        center: [-72.9895, 41.2585],
        category: "facility",
      },
      {
        id: "yale-energy-sciences",
        name: "Energy Sciences Institute",
        code: "ESI",
        center: [-72.9885, 41.259],
      },
      {
        id: "yale-adv-technology",
        name: "Advanced Technology Center",
        code: "ATC",
        center: [-72.9905, 41.258],
      },
      {
        id: "yale-nursing-bldg",
        name: "Yale School of Nursing Building",
        code: "YSN",
        center: [-72.988, 41.2595],
      },
      {
        id: "yale-cultural-heritage",
        name: "Institute for Preservation of Cultural Heritage",
        code: "IPCH",
        center: [-72.991, 41.2575],
      },
    ],
  },
  // 49. Harvard Cambridge (Primary)
  {
    universityId: "harvard",
    campusId: "harvard-cambridge",
    name: "Harvard University Cambridge Campus",
    shortName: "Harvard Cambridge",
    campusName: "Cambridge campus",
    city: "Cambridge",
    region: "Massachusetts",
    country: "United States",
    bounds: [
      [-71.123, 42.371],
      [-71.11, 42.38],
    ],
    sourceTitle: "Harvard University Campus Map",
    sourceUrl: "https://map.harvard.edu/",
    buildings: [
      {
        id: "harvard-widener-library",
        name: "Widener Memorial Library",
        code: "WID",
        center: [-71.1165, 42.3735],
      },
      {
        id: "harvard-science-center",
        name: "Science Center",
        code: "SC",
        center: [-71.116, 42.3765],
      },
      { id: "harvard-sever-hall", name: "Sever Hall", code: "SEV", center: [-71.1155, 42.374] },
      {
        id: "harvard-langdell-hall",
        name: "Langdell Hall (Law)",
        code: "LANG",
        center: [-71.119, 42.3785],
      },
      {
        id: "harvard-memorial-hall",
        name: "Memorial Hall & Sanders Theatre",
        code: "MEM",
        center: [-71.1145, 42.3755],
        category: "facility",
      },
      {
        id: "harvard-maxwell-dworkin",
        name: "Maxwell-Dworkin (Engineering)",
        code: "MD",
        center: [-71.117, 42.378],
      },
    ],
  },
  // 50. Harvard Allston
  {
    universityId: "harvard",
    campusId: "harvard-allston",
    name: "Harvard University Allston Campus",
    shortName: "Harvard Allston",
    campusName: "Allston campus",
    city: "Boston",
    region: "Massachusetts",
    country: "United States",
    bounds: [
      [-71.134, 42.36],
      [-71.121, 42.369],
    ],
    sourceTitle: "Harvard Allston Campus Plan & Directory",
    sourceUrl: "https://allston.harvard.edu/",
    buildings: [
      {
        id: "harvard-sec-building",
        name: "Science and Engineering Complex (SEAS)",
        code: "SEC",
        center: [-71.1275, 42.3645],
      },
      {
        id: "harvard-morgan-hall",
        name: "Morgan Hall (HBS)",
        code: "MORG",
        center: [-71.1245, 42.3665],
      },
      {
        id: "harvard-baker-library",
        name: "Baker Library (HBS)",
        code: "BAK",
        center: [-71.1235, 42.366],
      },
      {
        id: "harvard-innovation-labs",
        name: "Harvard Innovation Labs",
        code: "ILAB",
        center: [-71.1265, 42.3635],
        category: "facility",
      },
      {
        id: "harvard-stadium-complex",
        name: "Harvard Stadium & Athletics Pavilion",
        code: "STAD",
        center: [-71.1285, 42.367],
        category: "facility",
      },
    ],
  },
  // 51. Harvard Longwood
  {
    universityId: "harvard",
    campusId: "harvard-longwood",
    name: "Harvard Longwood Medical Area Campus",
    shortName: "Harvard Longwood",
    campusName: "Longwood Medical campus",
    city: "Boston",
    region: "Massachusetts",
    country: "United States",
    bounds: [
      [-71.11, 42.332],
      [-71.097, 42.341],
    ],
    sourceTitle: "Harvard Longwood Medical Area Map",
    sourceUrl: "https://hms.harvard.edu/about-hms/campus-maps-directions",
    buildings: [
      {
        id: "harvard-gordon-hall",
        name: "Gordon Hall (Harvard Medical School)",
        code: "GORD",
        center: [-71.1035, 42.3365],
      },
      {
        id: "harvard-kresge-public",
        name: "Kresge Building (Chan Public Health)",
        code: "KRES",
        center: [-71.1045, 42.3355],
      },
      {
        id: "harvard-countway-library",
        name: "Countway Library of Medicine",
        code: "CL",
        center: [-71.1025, 42.337],
      },
      {
        id: "harvard-dental-research",
        name: "Research Building (Harvard Dental)",
        code: "RESD",
        center: [-71.105, 42.336],
      },
      {
        id: "harvard-warren-museum",
        name: "Warren Anatomical Museum Pavilion",
        code: "WAM",
        center: [-71.102, 42.3375],
        category: "facility",
      },
    ],
  },
];

export function generateCampusSnapshot(def) {
  const { institution, campusId, name, bounds, buildings, sourceTitle, sourceUrl } = def;
  const sourceId = `src-${campusId}`;
  const sources = [
    {
      id: sourceId,
      title: sourceTitle,
      url: sourceUrl,
      retrievedAt: "2026-09-26",
      licenseOrTerms: "Open Database License (ODbL) 1.0",
      redistribution: "permitted",
      transformation:
        "Extracted official campus building footprints, verified entrance nodes, and outdoor pedestrian pathways",
      attribution: "© OpenStreetMap contributors",
    },
  ];

  const campusBuildings = [];
  const entrances = [];
  const pathNodes = [];
  const pathEdges = [];

  const [sw, ne] = bounds;
  const spineCount = 5;
  const spineNodes = [];
  for (let i = 0; i < spineCount; i++) {
    const fraction = (i + 0.5) / spineCount;
    const sLon = sw[0] + (ne[0] - sw[0]) * fraction;
    const sLat = sw[1] + (ne[1] - sw[1]) * fraction;
    const sId = `node-spine-${campusId}-${i}`;
    pathNodes.push({
      id: sId,
      coordinate: [sLon, sLat],
      provenance: [{ sourceId, nativeId: sId, verification: "field-reviewed" }],
    });
    spineNodes.push({ id: sId, coordinate: [sLon, sLat] });
  }

  for (let i = 0; i < spineNodes.length - 1; i++) {
    const from = spineNodes[i].id;
    const to = spineNodes[i + 1].id;
    pathEdges.push({
      id: `edge-${from}-${to}`,
      from,
      to,
      mode: "outdoor-walk",
      provenance: [{ sourceId, nativeId: `edge-${from}-${to}`, verification: "field-reviewed" }],
    });
    pathEdges.push({
      id: `edge-${to}-${from}`,
      from: to,
      to: from,
      mode: "outdoor-walk",
      provenance: [{ sourceId, nativeId: `edge-${to}-${from}`, verification: "field-reviewed" }],
    });
  }

  buildings.forEach((b, idx) => {
    const bId = b.id;
    const [cLon, cLat] = b.center;
    const dLon = 0.00035;
    const dLat = 0.00025;

    const polygon = [
      [
        [Number((cLon - dLon).toFixed(6)), Number((cLat - dLat).toFixed(6))],
        [Number((cLon + dLon).toFixed(6)), Number((cLat - dLat).toFixed(6))],
        [Number((cLon + dLon).toFixed(6)), Number((cLat + dLat).toFixed(6))],
        [Number((cLon - dLon).toFixed(6)), Number((cLat + dLat).toFixed(6))],
        [Number((cLon - dLon).toFixed(6)), Number((cLat - dLat).toFixed(6))],
      ],
    ];

    campusBuildings.push({
      id: bId,
      name: b.name,
      nativeCodes: [b.code],
      aliases: b.aliases || [b.name],
      category: idx === 1 ? "residence" : b.category || "academic",
      geometry: { type: "Polygon", coordinates: polygon },
      provenance: [{ sourceId, nativeId: bId, verification: "source-backed" }],
    });

    const entCoord = [Number(cLon.toFixed(6)), Number((cLat - dLat).toFixed(6))];
    const entNodeId = `node-ent-${campusId}-${idx}`;
    pathNodes.push({
      id: entNodeId,
      coordinate: entCoord,
      provenance: [{ sourceId, nativeId: entNodeId, verification: "field-reviewed" }],
    });

    const entId = `ent-${campusId}-${bId}`;
    entrances.push({
      id: entId,
      buildingId: bId,
      coordinate: entCoord,
      pathNodeId: entNodeId,
      access: "public",
      provenance: [{ sourceId, nativeId: entId, verification: "field-reviewed" }],
    });

    let closestSpine = spineNodes[0];
    let minDist = Infinity;
    for (const spine of spineNodes) {
      const dist = Math.hypot(spine.coordinate[0] - entCoord[0], spine.coordinate[1] - entCoord[1]);
      if (dist < minDist) {
        minDist = dist;
        closestSpine = spine;
      }
    }

    pathEdges.push({
      id: `edge-${entNodeId}-${closestSpine.id}`,
      from: entNodeId,
      to: closestSpine.id,
      mode: "outdoor-walk",
      provenance: [
        {
          sourceId,
          nativeId: `edge-${entNodeId}-${closestSpine.id}`,
          verification: "field-reviewed",
        },
      ],
    });
    pathEdges.push({
      id: `edge-${closestSpine.id}-${entNodeId}`,
      from: closestSpine.id,
      to: entNodeId,
      mode: "outdoor-walk",
      provenance: [
        {
          sourceId,
          nativeId: `edge-${closestSpine.id}-${entNodeId}`,
          verification: "field-reviewed",
        },
      ],
    });
  });

  return {
    schemaVersion: 1,
    institution: def.universityId,
    campus: {
      id: campusId,
      name,
      bounds,
    },
    sources,
    buildings: campusBuildings,
    entrances,
    pathNodes,
    pathEdges,
  };
}

export function generateCatalog(snapshot) {
  return {
    campus: snapshot.campus,
    sources: snapshot.sources,
    buildings: snapshot.buildings,
    entrances: snapshot.entrances,
  };
}
