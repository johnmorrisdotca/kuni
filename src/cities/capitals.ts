// The entry @johnmorrisdotca/kuni/cities/capitals: every capital, of a country or of a subdivision, of any size. Written by scripts/build-data.ts. The core,
// @johnmorrisdotca/kuni/cities, joins this tier with the others and answers the lookups.

import { expandCities } from "../city-rows";
import type { City } from "../city-rows";
import { CAPITAL_CITY_ROWS } from "../data/cities-capitals.data";

let table: readonly City[] | null = null;

/**
 * The cities of the tier `capitals`: every capital, of a country or of a subdivision, of any size. 4,277 of them, the most populous first, each a frozen object; the list is made on the first call and shared.
 *
 * @returns The list. Join it with other tiers through `citySet` in @johnmorrisdotca/kuni/cities.
 * @example
 * ```ts
 * import { capitalCities } from "@johnmorrisdotca/kuni/cities/capitals";
 *
 * console.log(capitalCities().length > 0);          // true
 * console.log(capitalCities()[0].name.en);          // "Guangzhou"
 * console.log(capitalCities()[0].id);               // "Q16572"
 * console.log(capitalCities()[0].country);          // "CN"
 * ```
 */
const capitalCities = (): readonly City[] => {
  if (table === null) table = expandCities(CAPITAL_CITY_ROWS);

  return table;
};

/**
 * The day the Wikidata snapshot of the cities was read: every name and figure in the cities is as Wikidata gave it on this day (Natural Earth's, 5.1.2, are as that release has them).
 *
 * @example
 * ```ts
 * import { CITIES_READ } from "@johnmorrisdotca/kuni/cities/capitals";
 *
 * console.log(CITIES_READ);  // "2026-11-11"
 * ```
 */
const CITIES_READ = "2026-11-11";

export { CITIES_READ, capitalCities };
export type { City };
