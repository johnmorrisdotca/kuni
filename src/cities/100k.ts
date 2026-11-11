// The entry @johnmorrisdotca/kuni/cities/100k: the cities of 100,000 to a million people (capitals too). Written by scripts/build-data.ts. The core,
// @johnmorrisdotca/kuni/cities, joins this tier with the others and answers the lookups.

import { expandCities } from "../city-rows";
import type { City } from "../city-rows";
import { CITY_100K_ROWS } from "../data/cities-100k.data";

let table: readonly City[] | null = null;

/**
 * The cities of the tier `100k`: the cities of 100,000 to a million people (capitals too). 5,414 of them, the most populous first, each a frozen object; the list is made on the first call and shared.
 *
 * @returns The list. Join it with other tiers through `citySet` in @johnmorrisdotca/kuni/cities.
 * @example
 * ```ts
 * import { cities100k } from "@johnmorrisdotca/kuni/cities/100k";
 *
 * console.log(cities100k().length > 0);          // true
 * console.log(cities100k()[0].name.en);          // "Mymensingh Sadar Upazila"
 * console.log(cities100k()[0].id);               // "Q4293913"
 * console.log(cities100k()[0].country);          // "BD"
 * ```
 */
const cities100k = (): readonly City[] => {
  if (table === null) table = expandCities(CITY_100K_ROWS);

  return table;
};

/**
 * The day the Wikidata snapshot of the cities was read: every name and figure in the cities is as Wikidata gave it on this day (Natural Earth's, 5.1.2, are as that release has them).
 *
 * @example
 * ```ts
 * import { CITIES_READ } from "@johnmorrisdotca/kuni/cities/100k";
 *
 * console.log(CITIES_READ);  // "2026-11-11"
 * ```
 */
const CITIES_READ = "2026-11-11";

export { CITIES_READ, cities100k };
export type { City };
