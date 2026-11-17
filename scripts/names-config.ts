// What scripts/build-names.ts needs that CLDR does not give: a few spellings people type that CLDR does not list, hand-written
// for kuni (MIT) and, like every string in data-config.ts, listed for review by a native reader before a release.
// An alias is a way in for a search, never a name: it is not answered by `countryName`. One that a name, short form or variant
// of the country already folds to is dropped by the build; one that would point at two countries fails the tests.

import type { NamesLanguage } from "../src/names.ts";

export const NAMES_ALIASES: Partial<Record<NamesLanguage, Record<string, string[]>>> = {
  // Austria written with the umlaut spelled out, as on keyboards without it and in Swiss writing.
  de: { AT: ["Oesterreich"] },
};
