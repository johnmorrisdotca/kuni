// The entry @johnmorrisdotca/kuni/trivia: the facts a quiz or a profile page wants beside /facts: when each country
// began, its official languages, and its largest city. Kept out of the main entry and out of /facts so that a page
// that asks for neither carries nothing of them. docs/trivia.md says where each comes from and what is missing.

import { TRIVIA_READ, TRIVIA_ROWS } from "./data/trivia.data";
import type { TriviaRow } from "./rows";

/** The trivia about one country, from the /trivia entry: `null` where the source has none.
 *
 * @example
 * ```ts
 * import type { CountryTrivia } from "@johnmorrisdotca/kuni/trivia";
 * import { trivia } from "@johnmorrisdotca/kuni/trivia";
 *
 * const value: CountryTrivia = trivia("JP")!;
 * console.log(typeof value === "object" ? Object.keys(value).slice(0,6) : value);
 * ```
 */
interface CountryTrivia {
  /** ISO 3166-1 alpha-2, "JP" */
  alpha2: string;
  /**
   * When Wikidata says the country, as it is today, began (P571, inception): the year, and the day where Wikidata
   * gives one. Often the day of independence (India, 1947-08-15), sometimes a constitution or a union (Japan,
   * 1947-05-03), so it is not a date of independence. `null` where Wikidata has none, or several.
   */
  inception: { year: number; day?: string } | null;
  /**
   * The languages CLDR records as official there, by law or in fact, most spoken first: language subtags, ISO 639-1
   * where the language has one ("en") and ISO 639-3 otherwise ("gsw"). Empty where CLDR records none. The languages
   * people speak, official or not, are `country(code).languages`.
   */
  officialLanguages: readonly string[];
  /**
   * The city with the most people in the city itself (its city proper: the municipality or district that is the
   * city, as its census counts it), not the urban area round it: Rome for Italy, not Milan. Its id in /cities and its
   * name. `null` for a country with no city of 15,000 people in kuni, or whose largest place kuni does not have
   * under its code (Guam's Dededo). docs/trivia.md lists the figures set by hand and every gap.
   */
  largestCity: { id: string; name: { en: string; ja: string | null } } | null;
}

const expand = (row: TriviaRow): CountryTrivia => {
  const [alpha2, year, day, languages, cityId, cityEn, cityJa] = row;
  const inception: { year: number; day?: string } | null = typeof year === "number" ? { year } : null;
  if (inception !== null && typeof day === "string") inception.day = day;

  return Object.freeze({
    alpha2,
    inception: inception === null ? null : Object.freeze(inception),
    officialLanguages: Object.freeze(typeof languages === "string" ? languages.split(" ") : []),
    largestCity: typeof cityId === "string" && typeof cityEn === "string" ? Object.freeze({ id: cityId, name: Object.freeze({ en: cityEn, ja: typeof cityJa === "string" ? cityJa : null }) }) : null,
  } satisfies CountryTrivia);
};

// Built on first use, like the main entry's tables.
let table: { list: readonly CountryTrivia[]; byCode: ReadonlyMap<string, CountryTrivia> } | null = null;
const getTable = (): NonNullable<typeof table> => {
  if (table === null) {
    const list = Object.freeze(TRIVIA_ROWS.map(expand));
    table = { list, byCode: new Map(list.map((one) => [one.alpha2, one])) };
  }

  return table;
};

/**
 * The trivia about one country, by its alpha-2 code in either case.
 *
 * @param code - An ISO 3166-1 alpha-2 code, "JP" or "jp"; for an alpha-3 or numeric code, pass `country(code)?.alpha2`.
 * @returns The country's trivia, frozen; `null` for anything that is not one of the 250 codes.
 * @example
 * ```ts
 * import { trivia } from "@johnmorrisdotca/kuni/trivia";
 *
 * console.log(trivia("CA")?.officialLanguages);      // ["en", "fr"]
 * console.log(trivia("AU")?.largestCity?.name.en);   // "Sydney"
 * console.log(trivia("IN")?.inception);              // { "year": 1947, "day": "1947-08-15" }
 * console.log(trivia("XX"));                         // null
 * ```
 */
const trivia = (code: string): CountryTrivia | null => {
  if (typeof code !== "string") return null;

  return getTable().byCode.get(code.trim().toUpperCase()) ?? null;
};

/**
 * The trivia about every country, in alpha-2 order: one object for each of the 250 codes, the list and its objects
 * frozen and shared.
 *
 * @returns Every country's trivia.
 * @example
 * ```ts
 * import { allTrivia } from "@johnmorrisdotca/kuni/trivia";
 *
 * console.log(allTrivia().length);                                              // 250
 * console.log(allTrivia().filter((one) => one.largestCity !== null).length);    // 228
 * ```
 */
const allTrivia = (): readonly CountryTrivia[] => getTable().list;

export { allTrivia, trivia, TRIVIA_READ };
export type { CountryTrivia };
