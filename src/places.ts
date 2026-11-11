// The entry @johnmorrisdotca/kuni/places: the questions a place chooser asks, as pure functions over kuni's data. Which
// countries are on a continent (from the groupings), and what a person's text finds among countries and cities, in English,
// Japanese or the place's own language. It draws nothing: a page builds its own chooser on these.

import { citiesOf, citySet, loadCities } from "./cities";
import { rankingPopulation } from "./rank";
import type { City, CityTier } from "./cities";
import { CONTINENTS } from "./types";
import type { Continent, Country } from "./types";
import { country, countries } from "./index";
import { facts } from "./facts";
import { fold } from "./fold";
import { groupings, membersOf } from "./groupings";

/**
 * A continent as the groupings name it.
 *
 * @example
 * ```ts
 * import type { PlaceContinent } from "@johnmorrisdotca/kuni/places";
 *
 * const value: PlaceContinent | null = null;
 * console.log(value);
 * ```
 */
interface PlaceContinent {
  /** "AF", "AN", "AS", "EU", "NA", "OC" or "SA". */
  code: Continent;
  /** Its name in English and in Japanese. */
  name: { en: string; ja: string };
}

/**
 * The seven continents, from kuni's groupings, in the groupings' order: the first choice of a place chooser.
 *
 * @returns The continents, frozen: each with its code and its name in English and Japanese.
 * @example
 * ```ts
 * import { continents } from "@johnmorrisdotca/kuni/places";
 *
 * console.log(continents().length);                       // 7
 * console.log(continents().map((one) => one.code).join(" ")); // "AF AN AS EU NA OC SA"
 * console.log(continents().find((one) => one.code === "AS")?.name.ja); // "アジア"
 * ```
 */
const continents = (): readonly PlaceContinent[] =>
  Object.freeze(
    groupings({ kind: "continent" }).map((one) =>
      Object.freeze({ code: one.id.slice("continent-".length).toUpperCase() as Continent, name: Object.freeze({ en: one.name.en, ja: one.name.ja ?? one.name.en }) }),
    ),
  );

/**
 * The countries of a continent, from kuni's groupings (the seven continents), in alpha-2 order.
 *
 * @param continent - "AF", "AN", "AS", "EU", "NA", "OC" or "SA", in either case.
 * @returns The countries, frozen; an empty list for a code that is not a continent.
 * @example
 * ```ts
 * import { countriesOf } from "@johnmorrisdotca/kuni/places";
 *
 * console.log(countriesOf("OC").map((one) => one.alpha2).includes("AU")); // true
 * console.log(countriesOf("eu").some((one) => one.alpha2 === "FR"));       // true
 * console.log(countriesOf("XX").length);                                   // 0
 * ```
 */
const countriesOf = (continent: string): readonly Country[] => {
  const code = typeof continent === "string" ? continent.trim().toUpperCase() : "";
  if (!(CONTINENTS as readonly string[]).includes(code as Continent)) return Object.freeze([]);
  const members = membersOf(`continent-${code.toLowerCase()}`) ?? [];

  return Object.freeze(members.flatMap((alpha2) => country(alpha2) ?? []).sort((a, b) => (a.alpha2 < b.alpha2 ? -1 : 1)));
};

/**
 * One result of `searchPlaces`: a country, or a city.
 *
 * @example
 * ```ts
 * import type { PlaceHit } from "@johnmorrisdotca/kuni/places";
 *
 * const value: PlaceHit | null = null;
 * console.log(value);
 * ```
 */
type PlaceHit =
  | {
      /** A country. */
      kind: "country";
      /** The name in the language asked for, English where there is none. */
      label: string;
      /** The country. */
      country: Country;
    }
  | {
      /** A city. */
      kind: "city";
      /** The name in the language asked for, English where there is none. */
      label: string;
      /** The city. */
      city: City;
    };

/**
 * What `searchPlaces` may be asked.
 *
 * @example
 * ```ts
 * import type { SearchPlacesOptions } from "@johnmorrisdotca/kuni/places";
 *
 * const value: SearchPlacesOptions = { lang: "ja", limit: 5 };
 * console.log(Object.keys(value).join(" "));
 * ```
 */
interface SearchPlacesOptions {
  /** The language of each hit's `label`: "en" (the default) or "ja". The search itself is over every name. */
  lang?: "en" | "ja";
  /** The most hits to return; 20 by default, at most 100. */
  limit?: number;
  /** The tiers of cities to search: the capitals, the cities of a million or more and of 100,000 or more by default. `"15k"` fetches every country's file. */
  tiers?: readonly CityTier[];
  /** Search the cities of this country only (every tier, loaded on its own), and no countries. */
  country?: string;
}

const LIMIT = 20;
const DEFAULT_TIERS: readonly CityTier[] = Object.freeze(["capitals", "1m", "100k"] as const);

/**
 * What a person typed, found among countries and cities, best first. Names are compared folded (case, accents, width and
 * kana set aside, as `fold` does) over the English, Japanese and native names, and over a country's reading in kana; a city's
 * Japanese name is found as it is written (パリ, 東京), since no source gives a city's reading. A match is ranked: the whole name, then the
 * start of the name, then the start of a word in it, then anywhere in it; among equal matches the more populous place
 * comes first. Only the tiers asked for are loaded (by default the capitals and the cities of 100,000 or more); with
 * `country`, that country's cities, every tier, and no countries.
 *
 * @param text - What somebody typed; empty or all punctuation finds nothing.
 * @param options - The language of the labels, how many, and which cities to look in.
 * @returns The hits, countries and cities mixed, best first.
 * @example
 * ```ts
 * import { searchPlaces } from "@johnmorrisdotca/kuni/places";
 *
 * const found = await searchPlaces("paris");
 * console.log(found[0].kind);                                 // "city"
 * console.log(found.some((one) => one.kind === "city" && one.city.country === "FR")); // true
 * console.log((await searchPlaces("にほん", { lang: "ja" }))[0].label); // "日本"
 * console.log((await searchPlaces("  ")).length);             // 0
 * ```
 */
const searchPlaces = async (text: string, options: SearchPlacesOptions = {}): Promise<PlaceHit[]> => {
  const wanted = fold(typeof text === "string" ? text : "");
  if (wanted === "") return [];
  const lang = options.lang === "ja" ? "ja" : "en";
  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(100, Math.floor(options.limit!))) : LIMIT;
  const inCountry = typeof options.country === "string" ? options.country : null;
  const cities: readonly City[] = inCountry !== null ? ((await citiesOf(inCountry)) ?? []) : citySet(...(await Promise.all((options.tiers ?? DEFAULT_TIERS).map(async (tier) => (await loadCities(tier)).cities)))).cities;

  const scored: { hit: PlaceHit; score: number; population: number; length: number; order: number }[] = [];
  const consider = (hit: PlaceHit, names: readonly (string | undefined)[], population: number | null, order: number): void => {
    let score = Infinity;
    let length = 0;
    for (const name of names) {
      if (name === undefined || name === "") continue;
      const folded = fold(name);
      const at = folded.indexOf(wanted);
      if (at < 0) continue;
      const here = folded === wanted ? 0 : at === 0 ? 1 : folded[at - 1] === " " ? 2 : 3;
      if (here < score || (here === score && folded.length < length)) {
        score = here;
        length = folded.length;
      }
    }
    if (score !== Infinity) scored.push({ hit, score, population: population ?? 0, length, order });
  };
  let order = 0;
  if (inCountry === null) {
    for (const one of countries()) consider({ kind: "country", label: one.name[lang] ?? one.name.en, country: one }, [one.name.en, one.name.ja, one.reading, one.name.local, one.alpha2, one.alpha3], facts(one.alpha2)?.population ?? null, (order += 1));
  }
  // A city ranks by its metropolitan area's people where it has one: Vancouver before Surrey.
  for (const city of cities) consider({ kind: "city", label: city.name[lang] ?? city.name.en, city }, [city.name.en, city.name.ja, city.name.native], rankingPopulation(city), (order += 1));
  scored.sort((a, b) => a.score - b.score || b.population - a.population || a.length - b.length || a.order - b.order);

  return scored.slice(0, limit).map((one) => one.hit);
};

export { continents, countriesOf, searchPlaces };
export type { PlaceContinent, PlaceHit, SearchPlacesOptions };
