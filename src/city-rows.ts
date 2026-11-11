// What the city tiers are made of: a row as scripts/build-data.ts writes it (src/data/cities-<tier>.data.ts), and
// the one function that makes the public City of it. Not an entry of its own; every tier entry and the core share it.

import { CITY_CONTINENTS } from "./data/city-continents.data";
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
   */
  name: { en: string; ja?: string; jaShort?: string; native?: string };
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

const freezeCity = (row: CityRow): City => {
  const [id, lat, lon, population, date, country, subdivision, en, ja, native, nativeLanguage, capital, capitalOf, sources] = row;
  const [metroId, metroName, metroPopulation, metroDate] = row.length > 15 ? (row.slice(14) as [number | string, string, number, number | string | null]) : [];
  const head = row.length === 15 ? row[14] : null;

  return Object.freeze({
    id: typeof id === "number" ? `Q${id}` : id,
    name: Object.freeze({ en, ...(ja === null ? {} : { ja, jaShort: jaShortOf(ja) }), ...(native === null ? {} : { native }) }),
    continent: CITY_CONTINENTS[country] as Continent,
    country,
    lat,
    lon,
    ...(nativeLanguage === null ? {} : { nativeLanguage }),
    population,
    populationDate: date === null ? null : String(date),
    subdivision,
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

/** A tier's rows made into cities, frozen, in the order of the rows. */
const expandCities = (rows: readonly CityRow[]): readonly City[] => Object.freeze(rows.map(freezeCity));

export { expandCities };
export type { City, CityRow, CitySource };
