// The entry @johnmorrisdotca/kuni/cities/1m: the cities of a million people or more (capitals too). Written by scripts/build-data.ts. The core,
// @johnmorrisdotca/kuni/cities, joins this tier with the others and answers the lookups.

import { expandCities } from "../city-rows";
import type { City } from "../city-rows";
import { CITY_1M_ROWS } from "../data/cities-1m.data";

let table: readonly City[] | null = null;

/**
 * The cities of the tier `1m`: the cities of a million people or more (capitals too). 707 of them, the most populous first, each a frozen object; the list is made on the first call and shared.
 *
 * @returns The list. Join it with other tiers through `citySet` in @johnmorrisdotca/kuni/cities.
 * @example
 * ```ts
 * import { cities1m } from "@johnmorrisdotca/kuni/cities/1m";
 *
 * console.log(cities1m().length > 0);          // true
 * console.log(cities1m()[0].name.en);          // "Chongqing"
 * console.log(cities1m()[0].id);               // "Q11725"
 * console.log(cities1m()[0].country);          // "CN"
 * ```
 */
const cities1m = (): readonly City[] => {
  if (table === null) table = expandCities(CITY_1M_ROWS);

  return table;
};

/**
 * The day the Wikidata snapshot of the cities was read: every name and figure in the cities is as Wikidata gave it on this day (Natural Earth's, 5.1.2, are as that release has them).
 *
 * @example
 * ```ts
 * import { CITIES_READ } from "@johnmorrisdotca/kuni/cities/1m";
 *
 * console.log(CITIES_READ);  // "2026-11-11"
 * ```
 */
const CITIES_READ = "2026-11-11";

export { CITIES_READ, cities1m };
export type { City };
