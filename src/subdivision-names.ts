// The names of the subdivisions (states, provinces, prefectures and the rest) in one more language, for the entries
// @johnmorrisdotca/kuni/subdivision-names/<language>. Each entry carries one language's rows and these few lines that read them, so
// a page pays for the one language it shows, and a page that needs only the countries' names pays nothing for these.
// Pure and locale-free like the rest of the package: no locale API, no network, the same answer in every engine.
//
// A name comes from Unicode CLDR or from Wikidata's labels (CC0), and each carries which. A name neither has is absent: never a name
// from another language copied in, never a machine translation, never Simplified turned into Traditional. The codes are the main
// entry's ISO 3166-2 codes; what a subdivision is (its kind, its parent, its level) is asked of the main entry's `subdivision(code)`.

import { foldFor } from "./names";
import type { NamesLanguage } from "./names";

/**
 * The languages that have a subdivision-names entry: Spanish, German, Simplified Chinese and Traditional Chinese.
 *
 * @example
 * ```ts
 * import type { SubdivisionNamesLanguage } from "@johnmorrisdotca/kuni/subdivision-names/es";
 *
 * const language: SubdivisionNamesLanguage = "zh-Hant";
 * console.log(language);   // "zh-Hant"
 * ```
 */
type SubdivisionNamesLanguage = Extract<NamesLanguage, "fr" | "es" | "de" | "zh-Hans" | "zh-Hant" | "ko" | "pt" | "ar" | "ru">;

/**
 * Where a name came from: Unicode CLDR (`tag` is its locale: "es", "zh", "zh_Hant"; `draft` is its draft status, "provisional" for
 * nearly all of CLDR 48.2's subdivision names, `null` for an approved one) or a Wikidata label (`tag` is the label's language
 * tag: "es", "zh-cn", "zh-tw"; `draft` is `null`).
 *
 * @example
 * ```ts
 * import type { NameSource } from "@johnmorrisdotca/kuni/subdivision-names/es";
 *
 * const source: NameSource = { source: "cldr", tag: "es", draft: "provisional" };
 * console.log(source.source);   // "cldr"
 * ```
 */
interface NameSource {
  /** Where the name was read: Unicode CLDR or a Wikidata label. */
  source: "cldr" | "wikidata";
  /** The CLDR locale or the Wikidata language tag it was read under. */
  tag: string;
  /** CLDR's draft status ("provisional"), `null` for an approved CLDR name and for every Wikidata label. */
  draft: string | null;
}

/**
 * One subdivision's name in one language, with where it came from.
 *
 * @example
 * ```ts
 * import type { NamedSubdivision } from "@johnmorrisdotca/kuni/subdivision-names/es";
 *
 * const one: NamedSubdivision = { code: "JP-13", country: "JP", shortCode: "13", name: "Tokio", source: { source: "cldr", tag: "es", draft: "provisional" } };
 * console.log(one.name);   // "Tokio"
 * ```
 */
interface NamedSubdivision {
  /** The ISO 3166-2 code, as in the main entry: "JP-13". */
  code: string;
  /** The alpha-2 code of the country. */
  country: string;
  /** The part of the code after the hyphen. */
  shortCode: string;
  /** The name in this language. Never empty; a subdivision with no name is not listed. */
  name: string;
  /** Where the name came from. */
  source: NameSource;
}

/**
 * What `subdivisionsByName()` may be narrowed to.
 *
 * @example
 * ```ts
 * import type { SubdivisionNamesSearchOptions } from "@johnmorrisdotca/kuni/subdivision-names/es";
 *
 * const options: SubdivisionNamesSearchOptions = { country: "ES" };
 * console.log(options.country);   // "ES"
 * ```
 */
interface SubdivisionNamesSearchOptions {
  /** Only this country's subdivisions (alpha-2, either case). */
  country?: string;
}

/**
 * One language's subdivision names: what an entry `@johnmorrisdotca/kuni/subdivision-names/<language>` exports. Every function is pure.
 *
 * @example
 * ```ts
 * import type { SubdivisionNames } from "@johnmorrisdotca/kuni/subdivision-names/es";
 *
 * const read = (names: SubdivisionNames): string | null => names.subdivisionName("JP-13");
 * console.log(typeof read);   // "function"
 * ```
 */
interface SubdivisionNames {
  /** The language of this entry. */
  readonly language: SubdivisionNamesLanguage;
  /** A subdivision's name in this language by its ISO 3166-2 code (either case); `null` where no source gives one, and for a code that is not a subdivision. */
  subdivisionName(code: string): string | null;
  /** Where a subdivision's name came from; `null` where it has no name. */
  subdivisionNameSource(code: string): NameSource | null;
  /** Every code a typed name could be, in code order: the name as written, folded as `fold` folds. Empty for none. */
  subdivisionsByName(text: string, options?: SubdivisionNamesSearchOptions): readonly string[];
  /** The one code a typed name means; `null` for none, and for a name that is more than one place (name the country). */
  subdivisionByName(text: string, options?: SubdivisionNamesSearchOptions): string | null;
  /** A country's subdivisions that have a name in this language, in code order; empty for a country with none, and for a code that is not a country. */
  subdivisionsOf(countryCode: string): readonly NamedSubdivision[];
  /** How many subdivisions have a name in this language, over all countries. */
  count(): number;
  /** What two ways of typing a name have in common in this language, as `fold(text)` says; the lookups compare names folded this way. */
  fold(text: string): string;
}

/**
 * The rows an entry's data file holds, and what `createSubdivisionNames` reads. Not public: the data files are built by
 * scripts/build-subdivision-names.ts.
 */
interface SubdivisionNamesData {
  language: SubdivisionNamesLanguage;
  /** The sources the rows point at, each "cldr:<locale>[:<draft>]" or "wikidata:<tag>". */
  sources: readonly string[];
  /** Per alpha-2 code, a line each in code order: shortCode|name|index into `sources`. */
  countries: Readonly<Record<string, string>>;
}

const sourceOf = (text: string): NameSource => {
  const [source, tag, draft] = text.split(":");

  return Object.freeze({ source: source as NameSource["source"], tag: tag!, draft: draft ?? null });
};

const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Makes the functions of an entry from its rows. Built on first use, so importing the entry costs nothing until it is asked. */
const createSubdivisionNames = (data: SubdivisionNamesData): SubdivisionNames => {
  const { language } = data;
  const key = (text: string): string => foldFor(language, text).replace(/ /g, "");
  const sources = data.sources.map(sourceOf);
  const byCode = new Map<string, NamedSubdivision>();
  const byCountry = new Map<string, readonly NamedSubdivision[]>();
  let byName: Map<string, readonly string[]> | null = null;

  const read = (): void => {
    if (byCountry.size > 0) return;
    for (const [country, text] of Object.entries(data.countries)) {
      const list = text.split("\n").map((line) => {
        const [shortCode, name, source] = line.split("|");
        const one: NamedSubdivision = Object.freeze({ code: `${country}-${shortCode}`, country, shortCode: shortCode!, name: name!, source: sources[Number(source)]! });
        byCode.set(one.code, one);

        return one;
      });
      byCountry.set(country, Object.freeze(list));
    }
  };

  const names = (): Map<string, readonly string[]> => {
    if (byName === null) {
      read();
      const made = new Map<string, string[]>();
      for (const one of byCode.values()) {
        const found = made.get(key(one.name)) ?? [];
        found.push(one.code);
        made.set(key(one.name), found);
      }
      byName = new Map([...made].map(([name, codes]) => [name, Object.freeze(codes.sort(compare))]));
    }

    return byName;
  };

  const subdivisionName = (code: string): string | null => {
    if (typeof code !== "string") return null;
    read();

    return byCode.get(code.trim().toUpperCase())?.name ?? null;
  };

  const subdivisionNameSource = (code: string): NameSource | null => {
    if (typeof code !== "string") return null;
    read();

    return byCode.get(code.trim().toUpperCase())?.source ?? null;
  };

  const subdivisionsByName = (text: string, options: SubdivisionNamesSearchOptions = {}): readonly string[] => {
    if (typeof text !== "string" || key(text) === "") return Object.freeze([]);
    const found = names().get(key(text)) ?? [];
    const country = options.country?.trim().toUpperCase();

    return Object.freeze(country === undefined ? [...found] : found.filter((code) => code.startsWith(`${country}-`)));
  };

  const subdivisionByName = (text: string, options: SubdivisionNamesSearchOptions = {}): string | null => {
    const found = subdivisionsByName(text, options);

    return found.length === 1 ? found[0]! : null;
  };

  const subdivisionsOf = (countryCode: string): readonly NamedSubdivision[] => {
    if (typeof countryCode !== "string") return [];
    read();

    return byCountry.get(countryCode.trim().toUpperCase()) ?? [];
  };

  const count = (): number => {
    read();

    return byCode.size;
  };

  return Object.freeze({ language, subdivisionName, subdivisionNameSource, subdivisionsByName, subdivisionByName, subdivisionsOf, count, fold: (text: string): string => foldFor(language, text) });
};

export { createSubdivisionNames };
export type { NamedSubdivision, NameSource, SubdivisionNames, SubdivisionNamesData, SubdivisionNamesLanguage, SubdivisionNamesSearchOptions };
