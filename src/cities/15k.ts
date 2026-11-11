// The entry @johnmorrisdotca/kuni/cities/15k: the cities of 15,000 to 100,000 people that are not capitals. Written by scripts/build-data.ts. The core,
// @johnmorrisdotca/kuni/cities, joins this tier with the others and answers the lookups.

import { expandCities } from "../city-rows";
import type { City } from "../city-rows";
import { CITY_15K_ROWS } from "../data/cities-15k.data";

let table: readonly City[] | null = null;

/**
 * The cities of the tier `15k`: the cities of 15,000 to 100,000 people that are not capitals. 23,968 of them, the most populous first, each a frozen object; the list is made on the first call and shared.
 *
 * @returns The list. Join it with other tiers through `citySet` in @johnmorrisdotca/kuni/cities.
 * @example
 * ```ts
 * import { cities15k } from "@johnmorrisdotca/kuni/cities/15k";
 *
 * console.log(cities15k().length > 0);          // true
 * console.log(cities15k()[0].name.en);          // "Mumias"
 * console.log(cities15k()[0].id);               // "Q1020110"
 * console.log(cities15k()[0].country);          // "KE"
 * ```
 */
const cities15k = (): readonly City[] => {
  if (table === null) table = expandCities(CITY_15K_ROWS);

  return table;
};

/**
 * The day the Wikidata snapshot of the cities was read: every name and figure in the cities is as Wikidata gave it on this day (Natural Earth's, 5.1.2, are as that release has them).
 *
 * @example
 * ```ts
 * import { CITIES_READ } from "@johnmorrisdotca/kuni/cities/15k";
 *
 * console.log(CITIES_READ);  // "2026-11-11"
 * ```
 */
const CITIES_READ = "2026-11-11";

export { CITIES_READ, cities15k };
export type { City };
