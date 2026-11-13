// What the city tiers are made of: a row as scripts/build-data.ts writes it (src/data/cities-<tier>.data.ts), and
// the one function that makes the public City of it. Not an entry of its own; every tier entry and the core share it.

import { CITY_CONTINENTS } from "./data/city-continents.data";
import { readingOfName } from "./ja-reading";
import { jaShortOf } from "./ja-short";
import type { Continent } from "./types";

/**
 * Which input a fact in a city's record came from. Wikidata (CC0) is the first source; Natural Earth's populated
 * places (public domain) fill what Wikidata has not got; "kuni" is a name written for this package, with its reason in
 * scripts/cities.ts (East Jerusalem is 東エルサレム).
 *
 * @example
 * ```ts
 * import type { CitySource } from "@johnmorrisdotca/kuni/cities";
 *
 * const value: CitySource = "wikidata";
 * console.log(value);
 * ```
 */
type CitySource = "wikidata" | "natural-earth" | "kuni";

/**
 * One city, as every tier hands it out (frozen): plain numbers and codes, `null` where no source has the fact.
 *
 * @example
 * ```ts
 * import type { City } from "@johnmorrisdotca/kuni/cities";
 * import { capitalCities } from "@johnmorrisdotca/kuni/cities/capitals";
 *
 * const paris: City = capitalCities().find((one) => one.id === "Q90")!;
 * console.log(paris.name.en);      // "Paris"
 * console.log(paris.country);      // "FR"
 * console.log(paris.continent);    // "EU"
 * console.log(paris.capital);      // "national"
 * ```
 */
interface City {
  /** Stable, the same in every tier and every release: the Wikidata item, "Q90" for Paris, or "ne:<number>" for a place only Natural Earth has. An id that stops being a city's (merged, or removed) is still answered by `citySet(...).byId`, with the record it was merged into. */
  id: string;
  /**
   * Its name in English, and in Japanese and in its own language where a source has them: `ja` and `native` are left
   * out, never an English name copied in; `native` is also left out where it is the English name. `jaShort`, with `ja`,
   * is the Japanese name a map labels it by: 東京 for 東京都, 大阪 for 大阪市, the same as `ja` where nothing is dropped.
   * `jaReading` is the reading of `ja` in hiragana, for sorting in Japanese order (とうきょうと, にゅーよーく): `ja` itself
   * where its words are kana (ゴヤ (アルゼンチン) is ごや; a last 市, 区, 郡, 県, 州 or 鎮 is read し, く, ぐん, けん,
   * しゅう, ちん); for a name in kanji only a source's, Wikidata's reading in kana (P1814) where `ja` is Wikidata's
   * label, else for a city of Japan Japan Post's reading of the municipality. Left out where none is so (a name of China
   * written in kanji), never guessed. It keeps the long-vowel mark (にゅーよーく), so sort it with a collator for
   * Japanese ("ja"), not by code point.
   */
  name: { en: string; ja?: string; jaShort?: string; jaReading?: string; native?: string };
  /** The continent of its country, in the seven-continent model kuni's groupings use: "AF", "AN", "AS", "EU", "NA", "OC" or "SA". */
  continent: Continent;
  /** The ISO 3166-1 alpha-2 code of its country, two capital letters: "FR". */
  country: string;
  /** Its latitude in degrees, north positive. */
  lat: number;
  /** Its longitude in degrees, east positive. */
  lon: number;
  /** The language code of `name.native` ("fr"); absent with it. */
  nativeLanguage?: string;
  /** The people living there, as the source gives it; `null` where no source has a figure. */
  population: number | null;
  /** The day the population is for: a year ("2020", for 1 January of it) or a day ("2020-10-01"); `null` when the source gives none. */
  populationDate: string | null;
  /** The ISO 3166-2 code of its first-level subdivision, "FR-IDF"; `null` where Wikidata does not say or kuni lists none. */
  subdivision: string | null;
  /**
   * The IANA time zone it keeps, "Asia/Tokyo", so that a page can show the time there (give it as the `timeZone` of a date
   * formatter). From IANA's zone.tab and Wikidata's subdivision zones: a country's one zone; else the zone Wikidata names
   * for the city's subdivision alone; else the zone of the nearest city zone.tab lists for the country
   * (`timeZoneEstimated` says whether that is an estimate). Left out only for a city of a country with no zone in zone.tab.
   * docs/cities.md counts each way.
   */
  timeZone?: string;
  /** Present with `timeZone`: true where the zone is an estimate (the nearest zone.tab city's, the city being neither at its point nor that city), false where a source names it or the city is that zone.tab city. Kuni has no boundaries, so a town near a zone's edge can be given its neighbour's: say "estimated" where it is shown. */
  timeZoneEstimated?: boolean;
  /** Its height above sea level in whole metres (negative below it), from Wikidata (CC0); left out where Wikidata has none, or several values far apart, or one no land has or one that stands out from the cities round it (a single bad value). */
  elevation?: number;
  /** "national" for the capital of a country (one only for each country), "alternate" for another seat of a country's government (Cape Town, Kyoto), "subdivision" for the capital of a subdivision; `null` for none. */
  capital: "national" | "alternate" | "subdivision" | null;
  /** The codes it is the capital of (alpha-2 for a country, ISO 3166-2 for a subdivision): never empty for a capital, always empty for a city that is not one. */
  capitalOf: readonly string[];
  /** Where each fact came from; a fact no source gave is `null`. */
  source: { point: CitySource; population: CitySource | null; ja: CitySource | null };
  /**
   * The urban area the city heads, by one source for each country: a Canadian city's census metropolitan area or
   * agglomeration by Statistics Canada (the estimate of 1 July 2025, else the 2021 Census; id "statcan:<DGUID>"), a city
   * of the United States its metropolitan or micropolitan statistical area by the Census Bureau (1 July 2024,
   * "census:<CBSA code>"), a city of another OECD member its functional urban area by the OECD ("oecd:<code>"), and the
   * first twenty cities of China and India the urban figure of their own census (China's urban resident population of
   * 2020, "cn-census-2020:<area>"; India's urban agglomerations of 2011, "in-census-2011:<area>"). In a country with
   * official areas, where a city heads none, the metropolitan area Wikidata names for it where that is bigger than the
   * city (its item, "Q683705"; CC0), an estimate. Its id, its name as the source writes it ("Seattle-Tacoma-Bellevue,
   * WA", "West Midlands"), people, the day the figure is for, and `estimated` (true for Wikidata's only). `null` where
   * there is none. Every list ranks a city by this figure where there is one, even below its own `population`, else by
   * its own; a tier still holds a city by its own `population`.
   */
  metro: { id: string; name: string; population: number; populationDate: string | null; estimated: boolean } | null;
  /**
   * The id of the city whose urban area this one lies inside, where it heads none of its own: Mississauga and Brampton
   * are in Toronto's ("Q172"). Such a city is ranked after every city that heads an area. `null` for the others, and in a
   * country whose areas are Wikidata's estimates.
   */
  inMetroOf: string | null;
  /**
   * True for a city of China or India below the twenty its census gives an urban figure for: its own figure is its
   * whole municipality (Yantai's 7 million), so it is ranked after the twenty. False for every other city.
   */
  urbanAreaUnknown: boolean;
  /**
   * True where the figure every list ranks the city by is an estimate: Wikidata's metropolitan area (`metro.estimated`),
   * or the city's own figure in a country with no official urban areas (every country but Canada, the United States,
   * the other members of the OECD, and China's and India's first twenty). False where it is an official urban area's.
   */
  rankEstimated: boolean;
}

// [item number (or "ne:<number>"), latitude, longitude, population, population date, country, subdivision, en, ja, native, native language,
//  capital (0 none, 1 national, 2 subdivision, 3 alternate), capital of (space-separated), sources (bit 8: ja written for this package, bit 1: ja from Natural Earth, bit 2:
//  population from Natural Earth, bit 4: point from Natural Earth, bit 16: ranked by an estimate, bit 32: in China or India, below the census list), and only where the city has a metro: its item number, English name, population and population date,
//  or only where it lies inside another city's urban area: that city's item number]
type CityRow =
  | readonly [number | string, number, number, number | null, number | string | null, string, string | null, string, string | null, string | null, string | null, 0 | 1 | 2 | 3, string | null, number]
  | readonly [number | string, number, number, number | null, number | string | null, string, string | null, string, string | null, string | null, string | null, 0 | 1 | 2 | 3, string | null, number, number | string | null]
  | readonly [number | string, number, number, number | null, number | string | null, string, string | null, string, string | null, string | null, string | null, 0 | 1 | 2 | 3, string | null, number, number | string, string, number, number | string | null];

/**
 * A list of cities as scripts/build-data.ts writes it (src/data/cities-*.data.ts): one array or string for each column
 * rather than an array for each city, so the file is smaller and packs better. `rowsOf` makes the rows of it.
 */
interface CityColumns {
  /** Each id, comma-separated: a Wikidata item's number in base 36, or "~" and Natural Earth's number in base 36. */
  id: string;
  /** Latitude and longitude in ten-thousandths of a degree. */
  lat: readonly number[];
  lon: readonly number[];
  /** The people, -1 where no source has a figure. */
  population: readonly number[];
  /** The day of each figure, comma-separated: a year, a day, or empty for none. */
  date: string;
  /** The countries, two letters each, one after another. */
  country: string;
  /** The subdivision codes after the country's ("CA" of "US-CA"), comma-separated, and each city's place in them (-1 for none). */
  subdivisions: string;
  subdivision: readonly number[];
  /** The names in English, Japanese and the native language, "|" between them; an empty Japanese or native name is none. */
  en: string;
  ja: string;
  native: string;
  /** The languages of the native names, comma-separated, and each city's place in them (-1 for none). */
  languages: string;
  language: readonly number[];
  /** One digit for each city's capital (0 none, 1 national, 2 subdivision, 3 alternate). */
  capital: string;
  /** What each is the capital of, "|" between cities, a space between codes; empty for none. */
  capitalOf: string;
  /** The time zones the list uses, comma-separated, and each city's place in them times two, plus one where its zone is an estimate (-1 for none). */
  zones: string;
  zone: readonly number[];
  /** Each city's elevation in whole metres, comma-separated; empty for none. */
  elevation: string;
  /** Two hexadecimal digits for each city's source bits. */
  sources: string;
  /** Each Japanese name's reading in hiragana, "|" between cities; empty for none. */
  reading: string;
  /** Only for the cities that have one, by place: the metro [place, id, name, people, day], or the city whose area it lies in [place, id]. */
  extra: readonly (readonly [number, number | string, string, number, number | string | null] | readonly [number, number | string])[];
}

const idOf = (text: string): number | string => (text.startsWith("~") ? `ne:${parseInt(text.slice(1), 36)}` : parseInt(text, 36));

/** The rows of a list written as columns, in its order. */
const rowsOf = (columns: CityColumns): CityRow[] => {
  const ids = columns.id.split(",");
  const dates = columns.date.split(",");
  const subdivisions = columns.subdivisions.split(",");
  const en = columns.en.split("|");
  const ja = columns.ja.split("|");
  const native = columns.native.split("|");
  const languages = columns.languages.split(",");
  const capitalOf = columns.capitalOf.split("|");
  const rows = ids.map((id, at): CityRow => {
    const country = columns.country.slice(at * 2, at * 2 + 2);
    const date = dates[at]!;
    const subdivision = columns.subdivision[at]!;
    const language = columns.language[at]!;
    const population = columns.population[at]!;

    return [
      idOf(id),
      columns.lat[at]! / 1e4,
      columns.lon[at]! / 1e4,
      population < 0 ? null : population,
      date === "" ? null : /^\d+$/.test(date) ? Number(date) : date,
      country,
      subdivision < 0 ? null : `${country}-${subdivisions[subdivision]}`,
      en[at]!,
      ja[at] === "" ? null : ja[at]!,
      native[at] === "" ? null : native[at]!,
      language < 0 ? null : languages[language]!,
      Number(columns.capital[at]) as 0 | 1 | 2 | 3,
      capitalOf[at] === "" ? null : capitalOf[at]!,
      parseInt(columns.sources.slice(at * 2, at * 2 + 2), 16),
    ];
  });
  for (const [at, ...rest] of columns.extra) rows[at] = [...rows[at]!, ...rest] as unknown as CityRow;

  return rows;
};

/** A Japanese name's reading: the one the file keeps, else the name read where its words are kana (readingOfName). */
const readingOf = (kept: string | null, ja: string): { jaReading?: string } => {
  const reading = kept ?? readingOfName(ja);

  return reading === null ? {} : { jaReading: reading };
};

/** A city's time zone and elevation, as the columns keep them. */
interface CityPlaceFacts {
  timeZone: string | null;
  timeZoneEstimated: boolean;
  elevation: number | null;
}

const NO_FACTS: CityPlaceFacts = { timeZone: null, timeZoneEstimated: false, elevation: null };

const freezeCity = (row: CityRow, reading: string | null = null, place: CityPlaceFacts = NO_FACTS): City => {
  const [id, lat, lon, population, date, country, subdivision, en, ja, native, nativeLanguage, capital, capitalOf, sources] = row;
  const [metroId, metroName, metroPopulation, metroDate] = row.length > 15 ? (row.slice(14) as [number | string, string, number, number | string | null]) : [];
  const head = row.length === 15 ? row[14] : null;

  return Object.freeze({
    id: typeof id === "number" ? `Q${id}` : id,
    name: Object.freeze({ en, ...(ja === null ? {} : { ja, jaShort: jaShortOf(ja), ...readingOf(reading, ja) }), ...(native === null ? {} : { native }) }),
    continent: CITY_CONTINENTS[country] as Continent,
    country,
    lat,
    lon,
    ...(nativeLanguage === null ? {} : { nativeLanguage }),
    population,
    populationDate: date === null ? null : String(date),
    subdivision,
    ...(place.timeZone === null ? {} : { timeZone: place.timeZone, timeZoneEstimated: place.timeZoneEstimated }),
    ...(place.elevation === null ? {} : { elevation: place.elevation }),
    capital: capital === 1 ? "national" : capital === 2 ? "subdivision" : capital === 3 ? "alternate" : null,
    capitalOf: Object.freeze(capitalOf === null ? [] : capitalOf.split(" ")),
    source: Object.freeze({
      point: sources & 4 ? "natural-earth" : "wikidata",
      population: population === null ? null : sources & 2 ? "natural-earth" : "wikidata",
      ja: ja === null ? null : sources & 8 ? "kuni" : sources & 1 ? "natural-earth" : "wikidata",
    } as const),
    metro:
      metroId === undefined || metroName === undefined || metroPopulation === undefined
        ? null
        : Object.freeze({
            id: typeof metroId === "number" ? `Q${metroId}` : metroId,
            name: metroName,
            population: metroPopulation,
            populationDate: metroDate === undefined || metroDate === null ? null : String(metroDate),
            estimated: typeof metroId === "number" || metroId.startsWith("ne:"),
          }),
    inMetroOf: head === null || head === undefined ? null : typeof head === "number" ? `Q${head}` : head,
    urbanAreaUnknown: (sources & 32) !== 0,
    rankEstimated: (sources & 16) !== 0 || (metroId !== undefined && (typeof metroId === "number" || metroId.startsWith("ne:"))),
  } satisfies City);
};

/**
 * A city in a country's light list (@johnmorrisdotca/kuni/cities/names-<code>): its id and names only, for a picker
 * to show before it fetches the rest, and whether it is one of the country's major cities (its capital, or one of its
 * first twenty, ranked by the urban area each heads).
 *
 * @example
 * ```ts
 * import type { CityName } from "@johnmorrisdotca/kuni/places";
 *
 * const tokyo: CityName = { id: "Q1490", name: { en: "Tokyo", ja: "東京都", jaShort: "東京" }, major: true };
 * console.log(tokyo.name.jaShort);
 * ```
 */
interface CityName {
  /** The city's id, as `City.id`. */
  id: string;
  /** Its names, as `City.name`. */
  name: { en: string; ja?: string; jaShort?: string; jaReading?: string; native?: string };
  /** True for the country's national capital and its first twenty cities. */
  major: boolean;
}

/** A light list written as columns (the id and name columns of CityColumns, and one digit each for major). */
const namesOf = (columns: Pick<CityColumns, "id" | "en" | "ja" | "native" | "reading"> & { major: string }): readonly CityName[] => {
  const en = columns.en.split("|");
  const reading = columns.reading.split("|");
  const ja = columns.ja.split("|");
  const native = columns.native.split("|");

  return Object.freeze(
    columns.id.split(",").map((id, at) => {
      const raw = idOf(id);

      return Object.freeze({
        id: typeof raw === "number" ? `Q${raw}` : raw,
        name: Object.freeze({ en: en[at]!, ...(ja[at] === "" ? {} : { ja: ja[at]!, jaShort: jaShortOf(ja[at]!), ...readingOf(reading[at] === "" || reading[at] === undefined ? null : reading[at]!, ja[at]!) }), ...(native[at] === "" ? {} : { native: native[at]! }) }),
        major: columns.major[at] === "1",
      });
    }),
  );
};

/** A tier's rows made into cities, frozen, in the order of the rows, with each Japanese name's reading where there is one. */
const expandCities = (rows: readonly CityRow[], readings: readonly (string | null)[] = [], places: readonly CityPlaceFacts[] = []): readonly City[] => Object.freeze(rows.map((row, at) => freezeCity(row, readings[at] ?? null, places[at])));

/** Each city's time zone and elevation, from the columns that keep them. */
const placeFactsOf = (columns: CityColumns): readonly CityPlaceFacts[] => {
  const zones = columns.zones === "" ? [] : columns.zones.split(",");
  const metres = columns.elevation.split(",");

  return columns.zone.map((at, index): CityPlaceFacts => ({
    timeZone: at < 0 ? null : zones[at >> 1]!,
    timeZoneEstimated: at >= 0 && (at & 1) === 1,
    elevation: metres[index] === "" || metres[index] === undefined ? null : Number(metres[index]),
  }));
};

/** A list written as columns made into cities. */
const expandColumns = (columns: CityColumns): readonly City[] =>
  expandCities(
    rowsOf(columns),
    columns.reading.split("|").map((one) => (one === "" ? null : one)),
    placeFactsOf(columns),
  );

export { expandCities, expandColumns, namesOf, rowsOf };
export type { City, CityColumns, CityName, CityRow, CitySource };
