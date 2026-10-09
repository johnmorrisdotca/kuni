// Kuni 国: every country, with ISO 3166 codes and names in English and Japanese, and lookups by code or by
// what somebody typed. The main entry carries the countries; a country's subdivisions are in
// @johnmorrisdotca/kuni/subdivisions/<code> (one country), /subdivisions (all) and /load (on demand).
//
// Every lookup is pure and locale-free: no Intl, no network, the same answer on a server and in a browser.

import { COUNTRY_CODES, isCountryCode } from "./codes";
import type { CountryCode } from "./codes";
import { CONTINENT_NAMES, COUNTRY_ROWS, SUBREGION_NAMES } from "./data/countries.data";
import { fold, foldKey } from "./fold";
import { expandCountry } from "./rows";
import { CONTINENTS, LANGUAGES } from "./types";
import type { Continent, Country, Language } from "./types";
import { VERSION } from "./version";

type CountryOrder = "code" | "en" | "ja";

interface CountriesOptions {
  order?: CountryOrder; // "code" (the default) is alpha-2 order; "en" and "ja" are by name, see `countries`
}

interface CountryNameOptions {
  short?: boolean; // The short form where CLDR has one ("UK", アメリカ), the full name otherwise
}

interface Tables {
  list: readonly Country[];
  byCode: ReadonlyMap<string, Country>;
  byName: ReadonlyMap<string, Country>;
  ordered: Map<CountryOrder, readonly Country[]>;
}

const LEADING_THE = /^the /;

// Freezes an object and everything in it, so that one caller cannot change what the next one is given.
const deepFreeze = <T>(value: T): T => {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) deepFreeze(inner);
  }

  return value;
};

// Built on first use rather than when the module loads, so importing the entry costs nothing until it is asked.
let tables: Tables | null = null;

const build = (): Tables => {
  const list = deepFreeze(COUNTRY_ROWS.map(expandCountry));
  const byCode = new Map<string, Country>();
  const byName = new Map<string, Country>();
  for (const country of list) {
    byCode.set(country.alpha2, country);
    byCode.set(country.alpha3, country);
    byCode.set(country.numeric, country);
  }
  for (const country of list) {
    const names = [
      country.name.en,
      country.name.ja,
      country.name.local,
      country.shortName?.en,
      country.shortName?.ja,
      country.reading,
      ...(country.aliases ?? []),
    ];
    for (const name of names) if (name !== undefined) byName.set(foldKey(name), country);
  }

  return { list, byCode, byName, ordered: new Map([["code", list]]) };
};

const getTables = (): Tables => {
  if (tables === null) tables = build();

  return tables;
};

// One country by its code: alpha-2 ("JP", "jp"), alpha-3 ("JPN") or numeric ("392"). Null for anything else.
const country = (code: string): Country | null => {
  if (typeof code !== "string") return null;

  return getTables().byCode.get(code.trim().toUpperCase()) ?? null;
};

// The plain code-unit order of two strings: the same everywhere, which a locale's collation is not.
const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// Every country, 249 ISO 3166-1 codes and Kosovo (XK). `order: "en"` sorts by the English name folded
// (accents and case set aside); `order: "ja"` by the Japanese name in kana, its reading where it is written
// in kanji, in plain kana order (not a full Japanese collation). The list is frozen and shared.
const countries = (options: CountriesOptions = {}): readonly Country[] => {
  const order = options.order ?? "code";
  const { list, ordered } = getTables();
  const found = ordered.get(order);
  if (found !== undefined) return found;
  const sortKey = (one: Country): string => (order === "ja" ? fold(one.reading ?? one.name.ja) : fold(one.name.en));
  const sorted = Object.freeze([...list].sort((a, b) => compare(sortKey(a), sortKey(b)) || compare(a.alpha2, b.alpha2)));
  ordered.set(order, sorted);

  return sorted;
};

// A country from what somebody typed: its name or short name in English or Japanese ("Germany", ドイツ,
// どいつ), its own name ("Deutschland"), a name it is also known by ("Holland", "UK", 米国), or a code.
// Case, accents, width, kana and punctuation do not matter. Null when nothing matches.
const countryByName = (text: string): Country | null => {
  if (typeof text !== "string") return null;
  const { byName } = getTables();
  const folded = fold(text);
  if (folded === "") return null;
  const found = byName.get(folded.replace(/ /g, "")) ?? byName.get(folded.replace(LEADING_THE, "").replace(/ /g, ""));
  if (found !== undefined) return found;

  return /^[a-z]{2,3}$|^\d{3}$/.test(folded) ? country(folded) : null;
};

// A country's name in English or Japanese ("en" is the default). Null for a code that is not a country.
const countryName = (code: string, language: Language = "en", options: CountryNameOptions = {}): string | null => {
  const found = country(code);
  if (found === null || !(LANGUAGES as readonly string[]).includes(language)) return null;

  return (options.short === true ? found.shortName?.[language] : undefined) ?? found.name[language];
};

// The flag emoji of a country ("JP" gives the Japanese flag). Null for a code that is not a country.
const flag = (code: string): string | null => country(code)?.flag ?? null;

// A continent's name ("AS" is Asia, アジア), from CLDR. Null for anything that is not one of the seven.
const continentName = (continent: Continent, language: Language = "en"): string | null => {
  if (!(CONTINENTS as readonly string[]).includes(continent)) return null;

  return CONTINENT_NAMES[continent]?.[language === "ja" ? 1 : 0] ?? null;
};

// A UN M49 subregion's name ("030" is Eastern Asia, 東アジア), from CLDR. Null for a code no country is in.
const subregionName = (subregion: string, language: Language = "en"): string | null =>
  SUBREGION_NAMES[subregion]?.[language === "ja" ? 1 : 0] ?? null;

export {
  CONTINENTS,
  continentName,
  countries,
  country,
  countryByName,
  countryName,
  COUNTRY_CODES,
  flag,
  fold,
  isCountryCode,
  LANGUAGES,
  subregionName,
  VERSION,
};
export type { Continent, CountriesOptions, Country, CountryCode, CountryNameOptions, CountryOrder, Language };
export type { Subdivision, SubdivisionType } from "./types";
