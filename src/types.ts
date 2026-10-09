// The shapes of the data. This file imports nothing, so scripts/build-data.ts can read the lists below too.

/**
 * The seven continents, as two letters: Africa, Antarctica, Asia, Europe, North America, Oceania, South America.
 *
 * @example
 * ```ts
 * import { CONTINENTS, continentName } from "@johnmorrisdotca/kuni";
 *
 * CONTINENTS.length; // 7
 * CONTINENTS.map((one) => continentName(one, "ja"))[0]; // "アフリカ"
 * ```
 */
const CONTINENTS = ["AF", "AN", "AS", "EU", "NA", "OC", "SA"] as const;

/**
 * The kinds of subdivision, in kebab case. Most are read from what Wikidata says each place is an instance
 * of; Japan's four come from the last character of the prefecture's name.
 *
 * @example
 * ```ts
 * import { SUBDIVISION_TYPES } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * SUBDIVISION_TYPES.includes("prefecture"); // true
 * ```
 */
const SUBDIVISION_TYPES = [
  "atoll",
  "autonomous-community",
  "autonomous-region",
  "borough",
  "canton",
  "capital-district",
  "circuit",
  "city",
  "council-area",
  "country",
  "county",
  "department",
  "district",
  "division",
  "emirate",
  "governorate",
  "island",
  "krai",
  "metropolis",
  "municipality",
  "oblast",
  "parish",
  "prefecture",
  "principal-area",
  "province",
  "quarter",
  "region",
  "republic",
  "special-administrative-region",
  "state",
  "territory",
  "unitary-authority",
  "urban-prefecture",
  "voivodeship",
  "zone",
] as const;

/**
 * The two languages every name is kept in.
 *
 * @example
 * ```ts
 * import { LANGUAGES } from "@johnmorrisdotca/kuni";
 *
 * LANGUAGES; // ["en", "ja"]
 * ```
 */
const LANGUAGES = ["en", "ja"] as const;

/** A continent's two letters: "AF", "AN", "AS", "EU", "NA", "OC" or "SA". */
type Continent = (typeof CONTINENTS)[number];
/** A kind of subdivision, in kebab case: "prefecture", "state", "autonomous-community". */
type SubdivisionType = (typeof SUBDIVISION_TYPES)[number];
/** A language every name is kept in: "en" or "ja". */
type Language = (typeof LANGUAGES)[number];

/** A country, or a territory with an ISO 3166-1 code of its own, as the lookups hand it out (frozen). */
interface Country {
  /** ISO 3166-1 alpha-2, "JP" */
  alpha2: string;
  /** ISO 3166-1 alpha-3, "JPN" */
  alpha3: string;
  /** ISO 3166-1 numeric, three digits, "392" */
  numeric: string;
  /** "user" for a user-assigned code in common use: Kosovo, XK */
  kind: "iso" | "user";
  /** CLDR's names; local is the country's own name, where it differs */
  name: { en: string; ja: string; local?: string };
  /** CLDR's short form: "US" and アメリカ for the United States */
  shortName?: { en?: string; ja?: string };
  /** The Japanese name in hiragana, only where the name is written in kanji */
  reading?: string;
  /** The flag emoji: the two regional-indicator letters of alpha2 */
  flag: string;
  /** The continent it is in, in the seven-continent model: "AS". */
  continent: Continent;
  /** The UN M49 subregion, three digits: "030" is Eastern Asia */
  subregion?: string;
  /** The ITU country calling code, "+81"; "+1" for every member of the North American plan */
  callingCode?: string;
  /** ISO 4217 codes of the currencies in use now, from CLDR: ["JPY"] */
  currency?: string[];
  /** The country-code top-level domain without its dot: "jp", and "uk" for GB */
  tld?: string;
  /** The capital's name: English from countries-list, Japanese from Wikidata */
  capital?: { en: string; ja: string };
  /** IANA time zones, from zone.tab, in its order: ["Asia/Tokyo"] */
  zones?: string[];
  /** ISO 639-1 codes of the languages spoken, most used first */
  languages?: string[];
  /** The kind most of its first-level subdivisions are */
  subdivisionType?: SubdivisionType;
  /** Other names people use for it, in either language: "Holland", "UK", 米国 */
  aliases?: string[];
}

/** A subdivision of a country (a state, a province, a prefecture), with its ISO 3166-2 code, as the lookups hand it out (frozen). */
interface Subdivision {
  /** ISO 3166-2, always in full: "JP-13", "CA-ON", "US-NY" */
  code: string;
  /** ISO 3166-1 alpha-2 of the country it is in: "JP" */
  country: string;
  /** The part after the hyphen: "13", "ON", "NY" */
  shortCode: string;
  /** What kind of place it is; null when no source says */
  type: SubdivisionType | null;
  /** 1 for a country's first division; 2 and 3 for those inside one (France's departments) */
  level: 1 | 2 | 3;
  /** The code of the subdivision it is inside, for levels 2 and 3: "FR-ARA" for "FR-01" */
  parent?: string;
  /** ja is null where no source has a Japanese name, never a guess */
  name: { en: string; ja: string | null };
  /** The name in hiragana, for Japan's prefectures: "とうきょうと" */
  reading?: string;
}

/** The side of the road a country drives on. */
type DrivingSide = "left" | "right";
/** The first day of the week on a calendar there, as CLDR writes it. */
type WeekStart = "mon" | "sun" | "sat" | "fri";
/** The system of measurement in everyday use, as CLDR writes it: the United States' and Britain's are their own. */
type MeasurementSystem = "metric" | "US" | "UK";
/** The paper size in everyday use, as CLDR writes it. */
type PaperSize = "A4" | "US-Letter";
/** The clock in everyday use, named as an hour cycle is in JavaScript: "h12" is 1 to 12 with AM and PM, "h23" is 0 to 23. */
type HourCycle = "h12" | "h23";

/** A point on the earth, in degrees: north and east are positive. */
interface LatLon {
  /** Latitude in degrees, north positive: -90 to 90. */
  lat: number;
  /** Longitude in degrees, east positive: -180 to 180. */
  lon: number;
}

/** The facts about one country, from the /facts entry: plain numbers and codes, `null` where a source has none. */
interface CountryFacts {
  /** ISO 3166-1 alpha-2, "JP" */
  alpha2: string;
  /** People, from Wikidata; null where there is no permanent population (Antarctica) */
  population: number | null;
  /** The year the population is for; null only where the figure has none (0, uninhabited) */
  populationYear: number | null;
  /** Area in square kilometres, from Wikidata */
  areaKm2: number | null;
  /** The year the area is for, where Wikidata says; most areas carry no year */
  areaYear: number | null;
  /** "land" where the only figure is for the land alone; null with no area */
  areaOf: "whole" | "land" | null;
  /** Wikidata's coordinate location for the country: a representative point, not a computed centroid */
  point: LatLon | null;
  /** The capital's coordinates; null where there is no capital */
  capitalPoint: LatLon | null;
  /** Alpha-2 codes of the countries it shares a land border with; [] for an island */
  borders: readonly string[];
  /** null where there are no public roads */
  drivingSide: DrivingSide | null;
  /** The first day of the week on a calendar there, from CLDR: "mon" for most, "sun" for the United States and Japan. */
  weekStart: WeekStart;
  /** The system of measurement in everyday use, from CLDR: "metric", or "US" and "UK". */
  measurement: MeasurementSystem;
  /** The paper size in everyday use, from CLDR: "A4", or "US-Letter" in the Americas' Letter countries. */
  paper: PaperSize;
  /** The clock CLDR prefers there: "h12" (1 to 12, with AM and PM) or "h23" (0 to 23). */
  hourCycle: HourCycle;
}

/** The facts about one subdivision, from the /subdivision-facts entry: `null` where Wikidata has none, or gives two. */
interface SubdivisionFacts {
  /** ISO 3166-2, "JP-13" */
  code: string;
  /** The seat of its government; reading in hiragana */
  capital: { en: string; ja: string | null; reading?: string } | null;
  /** The capital's coordinates */
  capitalPoint: LatLon | null;
  /** People, from Wikidata */
  population: number | null;
  /** The year the population is for, where Wikidata says */
  populationYear: number | null;
  /** Area in square kilometres, from Wikidata */
  areaKm2: number | null;
  /** The year the area is for, where Wikidata says */
  areaYear: number | null;
  /** Wikidata's coordinate location for the subdivision */
  point: LatLon | null;
}

/**
 * What kind of grouping it is: a continent, a UN M49 area, an international body's members, a well-known informal
 * grouping, or a grouping of the subdivisions inside one country.
 *
 * @example
 * ```ts
 * import { GROUPING_KINDS, groupings } from "@johnmorrisdotca/kuni/groupings";
 *
 * GROUPING_KINDS.map((kind) => groupings({ kind }).length)[0]; // 7
 * ```
 */
const GROUPING_KINDS = ["continent", "m49", "membership", "informal", "subdivision"] as const;
/** What kind of grouping it is: "continent", "m49", "membership", "informal" or "subdivision". */
type GroupingKind = (typeof GROUPING_KINDS)[number];

/** How a country stands with a body when it is not a member. */
type GroupingStatus = "candidate" | "associate" | "observer" | "suspended";

export { CONTINENTS, GROUPING_KINDS, LANGUAGES, SUBDIVISION_TYPES };
export type { Continent, Country, CountryFacts, GroupingKind, GroupingStatus, DrivingSide, HourCycle, Language, LatLon, MeasurementSystem, PaperSize, Subdivision, SubdivisionFacts, SubdivisionType, WeekStart };
