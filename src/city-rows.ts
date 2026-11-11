// What the city tiers are made of: a row as scripts/build-data.ts writes it (src/data/cities-<tier>.data.ts), and
// the one function that makes the public City of it. Not an entry of its own; every tier entry and the core share it.

import { CITY_CONTINENTS } from "./data/city-continents.data";
import type { Continent } from "./types";

/**
 * Which input a fact in a city's record came from. Wikidata (CC0) is the first source; Natural Earth's populated
 * places (public domain) fill what Wikidata has not got.
 *
 * @example
 * ```ts
 * import type { CitySource } from "@johnmorrisdotca/kuni/cities";
 *
 * const value: CitySource = "wikidata";
 * console.log(value);
 * ```
 */
type CitySource = "wikidata" | "natural-earth";

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
  /** Its name in English, and in Japanese and in its own language where a source has them: `ja` and `native` are left out, never an English name copied in; `native` is also left out where it is the English name. */
  name: { en: string; ja?: string; native?: string };
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
  /** "national" for the capital of a country, "subdivision" for the capital of a subdivision; `null` for neither. */
  capital: "national" | "subdivision" | null;
  /** The codes it is the capital of (alpha-2 for a country, ISO 3166-2 for a subdivision), as Wikidata says; empty where only Natural Earth calls it a capital. */
  capitalOf: readonly string[];
  /** Where each fact came from; a fact no source gave is `null`. */
  source: { point: CitySource; population: CitySource | null; ja: CitySource | null };
}

// [item number (or "ne:<number>"), latitude, longitude, population, population date, country, subdivision, en, ja, native, native language,
//  capital (0 none, 1 national, 2 subdivision), capital of (space-separated), sources (bit 1: ja from Natural Earth, bit 2:
//  population from Natural Earth, bit 4: point from Natural Earth)]
type CityRow = readonly [number | string, number, number, number | null, number | string | null, string, string | null, string, string | null, string | null, string | null, 0 | 1 | 2, string | null, number];

const freezeCity = (row: CityRow): City => {
  const [id, lat, lon, population, date, country, subdivision, en, ja, native, nativeLanguage, capital, capitalOf, sources] = row;

  return Object.freeze({
    id: typeof id === "number" ? `Q${id}` : id,
    name: Object.freeze({ en, ...(ja === null ? {} : { ja }), ...(native === null ? {} : { native }) }),
    continent: CITY_CONTINENTS[country] as Continent,
    country,
    lat,
    lon,
    ...(nativeLanguage === null ? {} : { nativeLanguage }),
    population,
    populationDate: date === null ? null : String(date),
    subdivision,
    capital: capital === 1 ? "national" : capital === 2 ? "subdivision" : null,
    capitalOf: Object.freeze(capitalOf === null ? [] : capitalOf.split(" ")),
    source: Object.freeze({
      point: sources & 4 ? "natural-earth" : "wikidata",
      population: population === null ? null : sources & 2 ? "natural-earth" : "wikidata",
      ja: ja === null ? null : sources & 1 ? "natural-earth" : "wikidata",
    } as const),
  } satisfies City);
};

/** A tier's rows made into cities, frozen, in the order of the rows. */
const expandCities = (rows: readonly CityRow[]): readonly City[] => Object.freeze(rows.map(freezeCity));

export { expandCities };
export type { City, CityRow, CitySource };
