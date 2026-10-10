// The entry @johnmorrisdotca/kuni/withdrawn: the countries ISO 3166-3 lists as withdrawn from ISO 3166-1, the codes
// they held (SU, YU, CS, DD, ZR, TP, AN, BU, and the four-letter ones such as SUHH and YUCS), when, and the current
// countries that came after them. Kept out of the main entry on purpose: a country list or a picker built from
// `countries()` never shows the Soviet Union, and a lookup in the main entry never returns one. docs/withdrawn.md says
// where each record comes from and what was filled by hand.

import { WITHDRAWN_READ, WITHDRAWN_ROWS } from "./data/withdrawn.data";
import type { WithdrawnRow } from "./rows";

/** A country that was withdrawn from ISO 3166-1, as ISO 3166-3 lists it (frozen). */
interface WithdrawnCountry {
  /** The four-letter ISO 3166-3 code: "SUHH" for the Soviet Union. Its first two letters are the alpha-2 code. */
  code: string;
  /** The ISO 3166-1 alpha-2 code it held: "SU". */
  alpha2: string;
  /** The alpha-3 code it held, "SUN", as ISO 3166-3 lists it. */
  alpha3?: string;
  /** The numeric code it held, "810"; absent where ISO 3166-3 lists none (Gilbert and Ellice Islands, New Hebrides). */
  numeric?: string;
  /** Its name in English and Japanese; `ja` is `null` where Wikidata has none, never an English name copied in. */
  name: { en: string; ja: string | null };
  /** The year its code came into force, "1974" (a full day, "1974-12-15", where Wikidata gives one). */
  since: string;
  /** The year its code was withdrawn, "1992", or a full day, "1990-08-14". */
  until: string;
  /**
   * The new codes ISO 3166-3 lists for it, in ISO's order: ["AM", "AZ", ...] for the Soviet Union. A successor may itself
   * be withdrawn: Yugoslavia's is "CS", which `withdrawn("CS")` resolves to Serbia and Montenegro (CSXX) first and
   * Czechoslovakia (CSHH) after it.
   */
  successors: readonly string[];
  /**
   * Set when the alpha-2 code was later given to a current country, so that the code means two things in time: "BY"
   * was the Byelorussian SSR and is Belarus. The value is that country's alpha-2 code. Absent for codes nobody has
   * been given again (SU, YU, CS, DD, ZR, TP, AN, BU).
   */
  reusedBy?: string;
}

const expand = (row: WithdrawnRow): WithdrawnCountry => {
  const country: WithdrawnCountry = {
    code: row.code,
    alpha2: row.alpha2,
    name: Object.freeze({ en: row.en, ja: row.ja }),
    since: row.since,
    until: row.until,
    successors: Object.freeze([...row.successors]),
  };
  if (row.alpha3 !== null) country.alpha3 = row.alpha3;
  if (row.numeric !== null) country.numeric = row.numeric;
  if (row.reusedBy !== null) country.reusedBy = row.reusedBy;

  return Object.freeze(country);
};

let table: readonly WithdrawnCountry[] | null = null;
const getTable = (): readonly WithdrawnCountry[] => {
  if (table === null) table = Object.freeze(WITHDRAWN_ROWS.map(expand));

  return table;
};

/**
 * Every withdrawn country of ISO 3166-3, in order of its four-letter code. Never part of `countries()`, so a picker
 * does not show them unless it asks.
 *
 * @returns The 31 records, the list and its objects frozen and shared.
 * @example
 * ```ts
 * import { withdrawnCountries } from "@johnmorrisdotca/kuni/withdrawn";
 *
 * withdrawnCountries().length;                              // 31
 * withdrawnCountries().map((one) => one.alpha2).includes("SU"); // true
 * ```
 */
const withdrawnCountries = (): readonly WithdrawnCountry[] => getTable();

/**
 * The withdrawn countries that held a code: the four-letter ISO 3166-3 code ("SUHH"), an alpha-2 ("SU"), an alpha-3
 * ("SUN") or a numeric code ("810"), in either case. A code can name more than one: "CS" was Czechoslovakia (CSHH)
 * and then Serbia and Montenegro (CSXX), later first; and "BY" is a withdrawn country as well as a current one, which
 * `country("BY")` answers on its own.
 *
 * @param code - Any code a withdrawn country held.
 * @returns The matching records, the one that was withdrawn last first; an empty list for anything else, and for
 * the code of a current country that was never withdrawn.
 * @example
 * ```ts
 * import { withdrawn } from "@johnmorrisdotca/kuni/withdrawn";
 *
 * withdrawn("su")[0].name.en;        // "Soviet Union"
 * withdrawn("SU")[0].until;          // "1992"
 * withdrawn("YUCS")[0].successors;   // ["CS"]: itself withdrawn, and resolved by withdrawn("CS")
 * withdrawn("CS").map((one) => one.code); // ["CSXX", "CSHH"]
 * withdrawn("JP");                   // []
 * ```
 */
const withdrawn = (code: string): readonly WithdrawnCountry[] => {
  if (typeof code !== "string") return [];
  const wanted = code.trim().toUpperCase();
  if (wanted === "") return [];

  return getTable()
    .filter((one) => one.code === wanted || one.alpha2 === wanted || one.alpha3 === wanted || one.numeric === wanted)
    .sort((a, b) => (a.until < b.until ? 1 : a.until > b.until ? -1 : 0));
};

export { withdrawn, withdrawnCountries, WITHDRAWN_READ };
export type { WithdrawnCountry };
