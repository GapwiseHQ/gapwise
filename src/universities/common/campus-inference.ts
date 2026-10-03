import type { Campus } from "@/lib/timetable-types";

type CampusInferenceInput = {
  universityId: string;
  courseCode: string;
  sourceLocation?: string;
  summary?: string;
  description?: string;
  defaultCampusId: string;
};

type CampusRule = {
  campusId: string;
  fields: Array<"courseCode" | "sourceLocation" | "summary" | "description">;
  pattern: RegExp;
};

const ALL_FIELDS: Array<"courseCode" | "sourceLocation" | "summary" | "description"> = [
  "courseCode",
  "sourceLocation",
  "summary",
  "description",
];

const RULES: Record<string, readonly CampusRule[]> = {
  uoft: [
    {
      campusId: "utm",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bUTM\b|\bMississauga\b|\b[A-Z]{3,4}\d{3}H5\b|\b[A-Z]{3,4}\d{3}Y5\b|\bKaneff\b|\bDavis Building\b|\bMaanjiwe\b|\bCCT\b)/i,
    },
    {
      campusId: "utsc",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bUTSC\b|\bScarborough\b|\b[A-Z]{3,4}\d{3}H3\b|\b[A-Z]{3,4}\d{3}Y3\b|\bHighland Hall\b|\bBladen\b|\bScience Wing\b)/i,
    },
    {
      campusId: "utsg",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bUTSG\b|\bSt\.? George\b|\b[A-Z]{3,4}\d{3}H1\b|\b[A-Z]{3,4}\d{3}Y1\b|\bBahen\b|\bRobarts\b|\bSidney Smith\b|\bConvocation Hall\b)/i,
    },
  ],
  carleton: [
    {
      campusId: "carleton-dominion-chalmers",
      fields: ALL_FIELDS,
      pattern: /(?:\bDominion-Chalmers\b|\bCDCC\b|\bDominion Chalmers\b)/i,
    },
    {
      campusId: "carleton",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bCarleton Main\b|\bRichcraft\b|\bPaterson\b|\bCanal\b|\bRiver Building\b|\bSoutham\b|\bHerzberg\b|\bMackenzie\b)/i,
    },
  ],
  tmu: [
    {
      campusId: "tmu-brampton",
      fields: ALL_FIELDS,
      pattern: /(?:\bBrampton\b|\bSchool of Medicine\b|\bSOM\b)/i,
    },
    {
      campusId: "tmu",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bDowntown\b|\bTed Rogers\b|\bTRS\b|\bDCC\b|\bKerr Hall\b|\bSLC\b|\bVictoria\b)/i,
    },
  ],
  queens: [
    {
      campusId: "queens-west",
      fields: ALL_FIELDS,
      pattern: /(?:\bWest Campus\b|\bDuncan McArthur\b|\bJean Royce\b|\bA235\b)/i,
    },
    {
      campusId: "queens",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bMain Campus\b|\bStauffer\b|\bDunning\b|\bGoodes\b|\bChernoff\b|\bWalter Light\b|\bEllis\b|\bKingston\b)/i,
    },
  ],
  laurier: [
    {
      campusId: "laurier-brantford",
      fields: ALL_FIELDS,
      pattern: /(?:\bBrantford\b|\bOne Market\b|\bSC Johnson\b|\bGrand River Hall\b|\bOdeon\b)/i,
    },
    {
      campusId: "laurier-milton",
      fields: ALL_FIELDS,
      pattern: /(?:\bMilton\b)/i,
    },
    {
      campusId: "waterloo",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bWaterloo\b|\bLazaridis\b|\bLH\b|\bDAWB\b|\bScience Building\b|\bPeters\b|\bSchlegel\b)/i,
    },
  ],
  york: [
    {
      campusId: "markham",
      fields: ALL_FIELDS,
      pattern: /\b(?:Markham|MK campus|MKM)\b/i,
    },
    {
      campusId: "glendon",
      fields: ALL_FIELDS,
      pattern: /\b(?:Glendon|GLDN|York Hall)\b/i,
    },
    {
      campusId: "keele",
      fields: ALL_FIELDS,
      pattern: /\b(?:Keele|Bergeron|Lassonde|Vari Hall|Curtis Lecture)\b/i,
    },
  ],
  mcmaster: [
    {
      campusId: "mcmaster-burlington",
      fields: ALL_FIELDS,
      pattern: /(?:\bBurlington\b|\bRon Joyce\b|\bRJC\b)/i,
    },
    {
      campusId: "mcmaster",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bHamilton\b|\bMain Campus\b|\bBSB\b|\bJHE\b|\bMDCL\b|\bMUSC\b|\bMills\b|\bTogo Salmon\b)/i,
    },
  ],
  western: [
    {
      campusId: "western-huron",
      fields: ALL_FIELDS,
      pattern: /(?:\bHuron\b|\bHuron College\b|\bHuron University\b)/i,
    },
    {
      campusId: "western-kings",
      fields: ALL_FIELDS,
      pattern: /(?:\bKing'?s\b|\bKing'?s College\b|\bKing'?s University\b)/i,
    },
    {
      campusId: "western",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bLondon Main\b|\bMiddlesex\b|\bNatural Sciences\b|\bUniversity College\b|\bSocial Science\b|\bTaylor Library\b)/i,
    },
  ],
  guelph: [
    {
      campusId: "guelph-ridgetown",
      fields: ALL_FIELDS,
      pattern: /(?:\bRidgetown\b)/i,
    },
    {
      campusId: "guelph-humber",
      fields: ALL_FIELDS,
      pattern: /(?:\bHumber\b|\bUniversity of Guelph-Humber\b|\bGH\b)/i,
    },
    {
      campusId: "guelph",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bGuelph Main\b|\bRozanski\b|\bMacKinnon\b|\bMacNaughton\b|\bThornbrough\b|\bSummerlee\b)/i,
    },
  ],
  uottawa: [
    {
      campusId: "uottawa-alta-vista",
      fields: ALL_FIELDS,
      pattern: /(?:\bAlta Vista\b|\bRoger Guindon\b|\bRGN\b|\bHealth Sciences\b)/i,
    },
    {
      campusId: "uottawa",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bDowntown\b|\bTabaret\b|\bMorisset\b|\bSITE\b|\bFSS\b|\bMarion\b|\bDesmarais\b|\bSimard\b)/i,
    },
  ],
  brock: [
    {
      campusId: "brock-miw",
      fields: ALL_FIELDS,
      pattern: /(?:\bMarilyn I\.? Walker\b|\bMIW\b|\bDowntown Arts\b)/i,
    },
    {
      campusId: "brock",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bMain Campus\b|\bSchmon\b|\bCairns\b|\bPlaza\b|\bThistle\b|\bMacKenzie Chown\b)/i,
    },
  ],
  ubc: [
    {
      campusId: "ubc-okanagan",
      fields: ALL_FIELDS,
      pattern: /(?:\b[A-Z]{2,6}_O\b|\bUBCO\b|\bOkanagan\b|\bKelowna\b)/i,
    },
    {
      campusId: "ubc-vancouver",
      fields: ALL_FIELDS,
      pattern: /(?:\b[A-Z]{2,6}_V\b|\bUBCV\b|\bPoint Grey\b|\bVancouver\b)/i,
    },
  ],
  waterloo: [
    {
      campusId: "waterloo-cambridge",
      fields: ALL_FIELDS,
      pattern: /(?:\bCambridge\b|\bSchool of Architecture\b|\bARC\b)/i,
    },
    {
      campusId: "waterloo-kitchener",
      fields: ALL_FIELDS,
      pattern: /(?:\bKitchener\b|\bSchool of Pharmacy\b|\bHealth Sciences Campus\b|\bPHR\b)/i,
    },
    {
      campusId: "waterloo-stratford",
      fields: ALL_FIELDS,
      pattern: /(?:\bStratford\b|\bSchool of Interaction Design\b|\bDMS\b)/i,
    },
    {
      campusId: "waterloo-main",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bMain Campus\b|\bMath & Computer\b|\bMC\b|\bDavis Centre\b|\bDC\b|\bEngineering\b|\bE7\b|\bSTC\b|\bAL\b|\bQNC\b)/i,
    },
  ],
  mcgill: [
    {
      campusId: "mcgill-macdonald",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bMacdonald\b|\bSainte-Anne-de-Bellevue\b|\bMac Campus\b|\bMacdonald-Stewart\b)/i,
    },
    {
      campusId: "mcgill-downtown",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bDowntown\b|\bFrank Dawson Adams\b|\bAdams\b|\bMcConnell\b|\bBurnside\b|\bLeacock\b|\bTrottier\b)/i,
    },
  ],
  cmu: [
    {
      campusId: "cmu-silicon-valley",
      fields: ALL_FIELDS,
      pattern: /(?:\bSilicon Valley\b|\bMoffett\b|\bNASA Ames\b|\bCMU-SV\b)/i,
    },
    {
      campusId: "cmu-pittsburgh",
      fields: ALL_FIELDS,
      pattern: /(?:\bPittsburgh\b|\bWean\b|\bGates\b|\bHamerschlag\b|\bDoherty\b|\bPurnell\b)/i,
    },
  ],
  ucberkeley: [
    {
      campusId: "ucberkeley-richmond",
      fields: ALL_FIELDS,
      pattern: /(?:\bRichmond\b|\bField Station\b|\bRFS\b)/i,
    },
    {
      campusId: "ucberkeley-main",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bBerkeley\b|\bCory\b|\bSoda\b|\bWheeler\b|\bDwinelle\b|\bHearst\b|\bMemorial\b)/i,
    },
  ],
  nyu: [
    {
      campusId: "nyu-brooklyn",
      fields: ALL_FIELDS,
      pattern: /(?:\bBrooklyn\b|\bMetroTech\b|\bTandon\b|\b370 Jay\b)/i,
    },
    {
      campusId: "nyu-washington-square",
      fields: ALL_FIELDS,
      pattern: /(?:\bWashington Square\b|\bBobst\b|\bSilver\b|\bStern\b|\bTisch\b|\bKimmel\b)/i,
    },
  ],
  mit: [
    {
      campusId: "mit-lincoln-lab",
      fields: ALL_FIELDS,
      pattern: /(?:\bLincoln Lab\b|\bLexington\b)/i,
    },
    {
      campusId: "mit-cambridge",
      fields: ALL_FIELDS,
      pattern: /(?:\bCambridge\b|\bStata\b|\bBuilding 10\b|\bInfinite\b|\bKresge\b|\bSloan\b)/i,
    },
  ],
  stanford: [
    {
      campusId: "stanford-redwood-city",
      fields: ALL_FIELDS,
      pattern: /(?:\bRedwood City\b|\bSRWC\b|\bBarron\b|\bDiscovery Hall\b)/i,
    },
    {
      campusId: "stanford-main",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bMain Campus\b|\bPalo Alto\b|\bQuad\b|\bGates\b|\bHuang\b|\bGreen Library\b|\bMemorial Church\b)/i,
    },
  ],
  upenn: [
    {
      campusId: "upenn-pennovation",
      fields: ALL_FIELDS,
      pattern: /(?:\bPennovation\b|\bGrays Ferry\b)/i,
    },
    {
      campusId: "upenn-new-bolton",
      fields: ALL_FIELDS,
      pattern: /(?:\bNew Bolton\b|\bKennett Square\b)/i,
    },
    {
      campusId: "upenn-philadelphia",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bPhiladelphia\b|\bUniversity City\b|\bHuntsman\b|\bTowne\b|\bLevine\b|\bCollege Hall\b)/i,
    },
  ],
  cornell: [
    {
      campusId: "cornell-tech",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bRoosevelt Island\b|\bCornell Tech\b|\bBloomberg Center\b|\bTata Innovation\b)/i,
    },
    {
      campusId: "cornell-weill",
      fields: ALL_FIELDS,
      pattern: /(?:\bWeill\b|\bWeill Cornell\b|\bManhattan Medical\b|\bYork Ave\b)/i,
    },
    {
      campusId: "cornell-ithaca",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bIthaca\b|\bCornell Main\b|\bUris\b|\bOlin\b|\bGates Hall\b|\bStatler\b|\bBarton\b)/i,
    },
  ],
  dartmouth: [
    {
      campusId: "dartmouth-lebanon",
      fields: ALL_FIELDS,
      pattern: /(?:\bLebanon\b|\bDHMC\b|\bCenterra\b|\bDartmouth Health\b)/i,
    },
    {
      campusId: "dartmouth-hanover",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bHanover\b|\bDartmouth Green\b|\bBaker-Berry\b|\bHopkins\b|\bThayer\b|\bTuck\b)/i,
    },
  ],
  brown: [
    {
      campusId: "brown-jewelry-district",
      fields: ALL_FIELDS,
      pattern: /(?:\bJewelry District\b|\bSouth Street\b|\bWarren Alpert\b|\bShip Street\b)/i,
    },
    {
      campusId: "brown-providence",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bProvidence\b|\bCollege Hill\b|\bSayles\b|\bSalomon\b|\bWatson\b|\bFriedman\b)/i,
    },
  ],
  columbia: [
    {
      campusId: "columbia-manhattanville",
      fields: ALL_FIELDS,
      pattern: /(?:\bManhattanville\b|\bJerome L\.? Greene\b|\bKravis\b|\bGeffen\b)/i,
    },
    {
      campusId: "columbia-cuimc",
      fields: ALL_FIELDS,
      pattern: /(?:\bCUIMC\b|\bMedical Center\b|\bWashington Heights\b|\bHammer\b|\bArmory\b)/i,
    },
    {
      campusId: "columbia-morningside",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bMorningside\b|\bLow Library\b|\bButler\b|\bPupin\b|\bSchermerhorn\b|\bHamilton\b)/i,
    },
  ],
  princeton: [
    {
      campusId: "princeton-forrestal",
      fields: ALL_FIELDS,
      pattern: /(?:\bForrestal\b|\bPPPL\b|\bPlasma Physics\b)/i,
    },
    {
      campusId: "princeton-meadows",
      fields: ALL_FIELDS,
      pattern: /(?:\bMeadows\b|\bWest Windsor\b)/i,
    },
    {
      campusId: "princeton-main",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bMain Campus\b|\bNassau\b|\bFirestone\b|\bFriend Center\b|\bMcCosh\b|\bRobertson\b)/i,
    },
  ],
  yale: [
    {
      campusId: "yale-medical",
      fields: ALL_FIELDS,
      pattern: /(?:\bMedical\b|\bCedar\b|\bYSM\b|\bSterling Hall of Medicine\b|\bHope\b)/i,
    },
    {
      campusId: "yale-west",
      fields: ALL_FIELDS,
      pattern: /(?:\bWest Campus\b|\bOrange\b|\bWest Campus Drive\b)/i,
    },
    {
      campusId: "yale-new-haven",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bNew Haven\b|\bOld Campus\b|\bScience Hill\b|\bSterling Memorial\b|\bWoolsey\b|\bBass\b)/i,
    },
  ],
  harvard: [
    {
      campusId: "harvard-allston",
      fields: ALL_FIELDS,
      pattern: /(?:\bAllston\b|\bSEC\b|\bScience and Engineering Complex\b|\bHarvard Stadium\b)/i,
    },
    {
      campusId: "harvard-longwood",
      fields: ALL_FIELDS,
      pattern: /(?:\bLongwood\b|\bHMS\b|\bHarvard Medical\b|\bCountway\b|\bT\.?H\.? Chan\b)/i,
    },
    {
      campusId: "harvard-cambridge",
      fields: ALL_FIELDS,
      pattern:
        /(?:\bCambridge\b|\bHarvard Yard\b|\bWidener\b|\bMemorial Hall\b|\bScience Center\b|\bSever\b)/i,
    },
  ],
};

function canonicalCampus(id: string): Campus {
  return id.toUpperCase() as Campus;
}

/**
 * Infer only from explicit export evidence. Single-campus editions can safely use their
 * registered campus; multi-campus schools stay UNKNOWN when rules conflict or have no match.
 */
export function inferImportedCampus(input: CampusInferenceInput): Campus {
  const rules = RULES[input.universityId] ?? [];
  if (!rules.length) return canonicalCampus(input.defaultCampusId);
  const matches = new Set(
    rules
      .filter((rule) => rule.fields.some((field) => rule.pattern.test(input[field] ?? "")))
      .map((rule) => rule.campusId),
  );
  if (matches.size === 1) return canonicalCampus([...matches][0]!);
  if (matches.size > 1) return "UNKNOWN";
  if (input.universityId === "ubc" || input.universityId === "york") return "UNKNOWN";
  return canonicalCampus(input.defaultCampusId);
}
