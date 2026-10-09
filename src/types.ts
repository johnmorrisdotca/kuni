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
  capital?: { en: string };
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

export { CONTINENTS, LANGUAGES, SUBDIVISION_TYPES };
export type { Continent, Country, Language, Subdivision, SubdivisionType };
