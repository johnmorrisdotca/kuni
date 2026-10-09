// The entry @johnmorrisdotca/kuni/load: one country's subdivisions, fetched when they are wanted. Each
// country is its own dynamic import, so a bundler makes a small chunk of each and a page downloads only the
// countries somebody picks.

import { isCountryCode } from "./codes";
import { LOADERS } from "./data/loaders.data";
import type { Subdivision } from "./types";

const EMPTY: readonly Subdivision[] = Object.freeze([]);

/**
 * The subdivisions of one country, every level, in code order: the same list as
 * @johnmorrisdotca/kuni/subdivisions/<code>, fetched with a dynamic import when it is asked for.
 *
 * @param countryCode - An alpha-2 code, either case.
 * @returns The list, frozen; an empty list for a country that has none (Antarctica); `null` for a code that is not
 * a country.
 * @example
 * ```ts
 * import { loadSubdivisions } from "@johnmorrisdotca/kuni/load";
 *
 * (await loadSubdivisions("CA"))?.length;         // 13
 * (await loadSubdivisions("jp"))?.[12].name.ja;   // "東京都"
 * await loadSubdivisions("AQ");                   // []
 * await loadSubdivisions("XX");                   // null
 * ```
 */
const loadSubdivisions = async (countryCode: string): Promise<readonly Subdivision[] | null> => {
  const code = typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";
  if (!isCountryCode(code)) return null;
  const loader = LOADERS[code.toLowerCase()];
  if (loader === undefined) return EMPTY;
  const loaded = await loader();

  return loaded.SUBDIVISIONS;
};

export { loadSubdivisions };
export type { Subdivision };
