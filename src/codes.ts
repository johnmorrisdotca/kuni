// The entry @johnmorrisdotca/kuni/codes: the 250 country codes and a check, for a form or a schema that
// needs to know a code is real and nothing more. No names, so it weighs a couple of kilobytes.

import { COUNTRY_CODES } from "./data/codes.data";
import type { CountryCode } from "./data/codes.data";

const CODE_SET: ReadonlySet<string> = new Set(COUNTRY_CODES);

// True for one of the 250 codes exactly as ISO writes it: two capital letters ("JP", and "XK" for Kosovo).
// Lower case is not a code here; `country()` in the main entry is the forgiving one.
const isCountryCode = (value: unknown): value is CountryCode => typeof value === "string" && CODE_SET.has(value);

export { COUNTRY_CODES, isCountryCode };
export type { CountryCode };
