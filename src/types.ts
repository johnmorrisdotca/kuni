// The shapes of the data. This file imports nothing, so scripts/build-data.ts can read the lists below too.

// The seven continents, as two letters: Africa, Antarctica, Asia, Europe, North America, Oceania, South America.
const CONTINENTS = ["AF", "AN", "AS", "EU", "NA", "OC", "SA"] as const;

// The kinds of subdivision, in kebab case. Most are read from what Wikidata says each place is an instance
// of; Japan's four come from the last character of the prefecture's name.
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

// The two languages every name is kept in.
const LANGUAGES = ["en", "ja"] as const;

type Continent = (typeof CONTINENTS)[number];
type SubdivisionType = (typeof SUBDIVISION_TYPES)[number];
type Language = (typeof LANGUAGES)[number];

interface Country {
  alpha2: string; // ISO 3166-1 alpha-2, "JP"
  alpha3: string; // ISO 3166-1 alpha-3, "JPN"
  numeric: string; // ISO 3166-1 numeric, three digits, "392"
  kind: "iso" | "user"; // "user" for a user-assigned code in common use: Kosovo, XK
  name: { en: string; ja: string; local?: string }; // CLDR's names; local is the country's own name, where it differs
  shortName?: { en?: string; ja?: string }; // CLDR's short form: "US" and アメリカ for the United States
  reading?: string; // The Japanese name in hiragana, only where the name is written in kanji
  flag: string; // The flag emoji: the two regional-indicator letters of alpha2
  continent: Continent;
  subregion?: string; // The UN M49 subregion, three digits: "030" is Eastern Asia
  callingCode?: string; // The ITU country calling code, "+81"; "+1" for every member of the North American plan
  currency?: string[]; // ISO 4217 codes of the currencies in use now, from CLDR: ["JPY"]
  tld?: string; // The country-code top-level domain without its dot: "jp", and "uk" for GB
  capital?: { en: string; ja: string }; // The capital's name: English from countries-list, Japanese from Wikidata
  zones?: string[]; // IANA time zones, from zone.tab, in its order: ["Asia/Tokyo"]
  languages?: string[]; // ISO 639-1 codes of the languages spoken, most used first
  subdivisionType?: SubdivisionType; // The kind most of its first-level subdivisions are
  aliases?: string[]; // Other names people use for it, in either language: "Holland", "UK", 米国
}

interface Subdivision {
  code: string; // ISO 3166-2, always in full: "JP-13", "CA-ON", "US-NY"
  country: string; // ISO 3166-1 alpha-2 of the country it is in: "JP"
  shortCode: string; // The part after the hyphen: "13", "ON", "NY"
  type: SubdivisionType | null; // What kind of place it is; null when no source says
  level: 1 | 2 | 3; // 1 for a country's first division; 2 and 3 for those inside one (France's departments)
  parent?: string; // The code of the subdivision it is inside, for levels 2 and 3: "FR-ARA" for "FR-01"
  name: { en: string; ja: string | null }; // ja is null where no source has a Japanese name, never a guess
  reading?: string; // The name in hiragana, for Japan's prefectures: "とうきょうと"
}

// The side of the road a country drives on.
type DrivingSide = "left" | "right";
// The first day of the week on a calendar there, as CLDR writes it.
type WeekStart = "mon" | "sun" | "sat" | "fri";
// The system of measurement in everyday use, as CLDR writes it: the United States' and Britain's are their own.
type MeasurementSystem = "metric" | "US" | "UK";
// The paper size in everyday use, as CLDR writes it.
type PaperSize = "A4" | "US-Letter";
// The clock in everyday use, named as an hour cycle is in JavaScript: "h12" is 1 to 12 with AM and PM, "h23" is 0 to 23.
type HourCycle = "h12" | "h23";

// A point on the earth, in degrees: north and east are positive.
interface LatLon {
  lat: number;
  lon: number;
}

interface CountryFacts {
  alpha2: string; // ISO 3166-1 alpha-2, "JP"
  population: number | null; // People, from Wikidata; null where there is no permanent population (Antarctica)
  populationYear: number | null; // The year the population is for; null only where the figure has none (0, uninhabited)
  areaKm2: number | null; // Area in square kilometres, from Wikidata
  areaYear: number | null; // The year the area is for, where Wikidata says; most areas carry no year
  areaOf: "whole" | "land" | null; // "land" where the only figure is for the land alone; null with no area
  point: LatLon | null; // Wikidata's coordinate location for the country: a representative point, not a computed centroid
  capitalPoint: LatLon | null; // The capital's coordinates; null where there is no capital
  borders: readonly string[]; // Alpha-2 codes of the countries it shares a land border with; [] for an island
  drivingSide: DrivingSide | null; // null where there are no public roads
  weekStart: WeekStart; // CLDR
  measurement: MeasurementSystem; // CLDR
  paper: PaperSize; // CLDR
  hourCycle: HourCycle; // CLDR's preferred clock for the region
}

interface SubdivisionFacts {
  code: string; // ISO 3166-2, "JP-13"
  capital: { en: string; ja: string | null; reading?: string } | null; // The seat of its government; reading in hiragana
  capitalPoint: LatLon | null; // The capital's coordinates
  population: number | null; // People, from Wikidata
  populationYear: number | null; // The year the population is for, where Wikidata says
  areaKm2: number | null; // Area in square kilometres, from Wikidata
  areaYear: number | null; // The year the area is for, where Wikidata says
  point: LatLon | null; // Wikidata's coordinate location for the subdivision
}

// What kind of grouping it is: a continent, a UN M49 area, an international body's members, a well-known informal
// grouping, or a grouping of the subdivisions inside one country.
const GROUPING_KINDS = ["continent", "m49", "membership", "informal", "subdivision"] as const;
type GroupingKind = (typeof GROUPING_KINDS)[number];

// How a country stands with a body when it is not a member.
type GroupingStatus = "candidate" | "associate" | "observer" | "suspended";

export { CONTINENTS, GROUPING_KINDS, LANGUAGES, SUBDIVISION_TYPES };
export type { Continent, Country, CountryFacts, GroupingKind, GroupingStatus, DrivingSide, HourCycle, Language, LatLon, MeasurementSystem, PaperSize, Subdivision, SubdivisionFacts, SubdivisionType, WeekStart };
