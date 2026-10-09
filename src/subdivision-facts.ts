// The entry @johnmorrisdotca/kuni/subdivision-facts: the facts about one country's subdivisions (the capital of
// each, with its Japanese name and, in Japan, its reading; population and area with the year each is for; and
// coordinates), loaded when they are wanted. Each country is its own dynamic import, so a bundler makes a small
// chunk of each; @johnmorrisdotca/kuni/subdivision-facts/<code> is the same list as a static import.

import { isCountryCode } from "./codes";
import { FACT_LOADERS } from "./data/fact-loaders.data";
import type { LatLon, SubdivisionFacts } from "./types";

const EMPTY: readonly SubdivisionFacts[] = Object.freeze([]);

/**
 * The facts about one country's subdivisions, every level, in code order: one object for each subdivision, with
 * `null` for anything Wikidata does not give or gives two ways (docs/subdivision-facts.md counts them).
 *
 * @param countryCode - An ISO 3166-1 alpha-2 code, in either case.
 * @returns The list, frozen; an empty list for a country with no subdivisions (Antarctica); `null` for a code that is
 * not a country.
 * @example
 * ```ts
 * import { loadSubdivisionFacts } from "@johnmorrisdotca/kuni/subdivision-facts";
 *
 * const prefectures = await loadSubdivisionFacts("JP");
 * prefectures?.[0].capital;    // { en: "Sapporo", ja: "札幌市", reading: "さっぽろし" }
 * prefectures?.[12].population; // 14264798, for Tokyo
 * prefectures?.[12].populationYear; // 2022
 * await loadSubdivisionFacts("AQ"); // []
 * await loadSubdivisionFacts("XX"); // null
 * ```
 */
const loadSubdivisionFacts = async (countryCode: string): Promise<readonly SubdivisionFacts[] | null> => {
  const code = typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";
  if (!isCountryCode(code)) return null;
  const loader = FACT_LOADERS[code.toLowerCase()];
  if (loader === undefined) return EMPTY;

  return (await loader()).SUBDIVISION_FACTS;
};

export { loadSubdivisionFacts };
export type { LatLon, SubdivisionFacts };
