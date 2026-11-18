// The entry @johnmorrisdotca/kuni/capitals: the capitals of the countries that have more than one capital city, or a capital
// that `capital` does not name alone, each with its role as the country's own government or law gives it. Kept out of
// the main entry and out of /facts so that a page that only names countries does not carry them. docs/capitals.md says
// what each role rests on: the page and the line.

import { CAPITAL_ROWS, CAPITALS_READ } from "./data/capitals.data";
import type { CapitalsRow } from "./rows";
import type { CapitalRole, CountryCapital } from "./types";

const expandCapitals = (row: CapitalsRow): readonly CountryCapital[] =>
  Object.freeze(
    row[1].map(([en, ja, role, note]) =>
      Object.freeze({
        name: Object.freeze({ en, ja }),
        role: role as CapitalRole,
        ...(note === null ? {} : { note }),
      } satisfies CountryCapital),
    ),
  );

// Built on first use, like the main entry's tables.
let table: ReadonlyMap<string, readonly CountryCapital[]> | null = null;

/**
 * The capitals of a country that has more than one capital city, or a capital that `capital` does not name alone,
 * each with its role: South Africa's Pretoria (administrative), Cape Town (legislative) and Bloemfontein (judicial).
 * Each role is what the country's own government or law says, read on the day in `CAPITALS_READ`; `docs/capitals.md`
 * lists the page and the line for every one. The country's `capital` is unchanged.
 *
 * @param code - An ISO 3166-1 alpha-2 code, "ZA" or "za".
 * @returns The capitals in the order of the table, frozen; `null` for a country with no entry (almost every country,
 *   whose one capital is `capital`) and for anything that is not a code. Israel and the Palestinian Territories have
 *   no entry: a disputed capital is left to the maintainer.
 * @example
 * ```ts
 * import { capitalsOf } from "@johnmorrisdotca/kuni/capitals";
 *
 * console.log(capitalsOf("ZA")?.map((one) => `${one.name.en} ${one.role}`)); // ["Pretoria administrative", "Cape Town legislative", "Bloemfontein judicial"]
 * console.log(capitalsOf("NL")?.[1]?.name.ja);                               // "デン・ハーグ"
 * console.log(capitalsOf("JP"));                                             // null
 * ```
 */
const capitalsOf = (code: string): readonly CountryCapital[] | null => {
  if (typeof code !== "string") return null;
  table ??= new Map(CAPITAL_ROWS.map((row) => [row[0], expandCapitals(row)]));

  return table.get(code.trim().toUpperCase()) ?? null;
};

export { CAPITALS_READ, capitalsOf };
export type { CapitalRole, CountryCapital };
