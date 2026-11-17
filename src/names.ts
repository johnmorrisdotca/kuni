// The names of the countries in one more language, for the entries @johnmorrisdotca/kuni/names/<language>. Each entry
// carries one language's rows and these few lines that read them, so a page pays for the one language it shows.
// Pure and locale-free like the rest of the package: no locale API, no network, the same answer in every engine.
//
// The data is Unicode CLDR's and nothing else. A name CLDR does not have is `null`: never a name from another
// language copied in, never a machine translation. The rows are built to take subdivisions later (a `subdivisions`
// field beside `countries`, and functions beside these), which adds to an entry and changes none of what is here.

import type { CountryCode } from "./codes";
import { fold as baseFold } from "./fold";

/**
 * The languages that have a names entry: French, Spanish, German, Simplified Chinese, Traditional Chinese, Korean,
 * Portuguese, Arabic and Russian. English and Japanese are in the main entry.
 *
 * @example
 * ```ts
 * import type { NamesLanguage } from "@johnmorrisdotca/kuni/names/fr";
 *
 * const language: NamesLanguage = "zh-Hans";
 * console.log(language);   // "zh-Hans"
 * ```
 */
type NamesLanguage = "fr" | "es" | "de" | "zh-Hans" | "zh-Hant" | "ko" | "pt" | "ar" | "ru";

/**
 * One country in one language: its code, its CLDR name (`null` where CLDR has none in the language), its short
 * form where CLDR has one ("R.-U."), and the other forms CLDR gives ("République tchèque").
 *
 * @example
 * ```ts
 * import type { NamedCountry } from "@johnmorrisdotca/kuni/names/fr";
 *
 * const one: NamedCountry = { code: "JP", name: "Japon", shortName: null, variants: [] };
 * console.log(one.name);   // "Japon"
 * ```
 */
interface NamedCountry {
  /** The alpha-2 code, as in the main entry. */
  code: CountryCode;
  /** The name CLDR gives in this language; `null` where it has none. */
  name: string | null;
  /** The short form CLDR gives ("R.-U."), `null` where it has none. */
  shortName: string | null;
  /** The variant forms CLDR gives (alt-variant and the like), not the name or the short form; empty for most. */
  variants: readonly string[];
}

/**
 * What `countryName()` may be asked.
 *
 * @example
 * ```ts
 * import type { NamesNameOptions } from "@johnmorrisdotca/kuni/names/fr";
 *
 * const options: NamesNameOptions = { short: true };
 * console.log(options.short);   // true
 * ```
 */
interface NamesNameOptions {
  /** The short form where CLDR has one, the full name otherwise. */
  short?: boolean;
}

/**
 * What `countries()` may be asked.
 *
 * @example
 * ```ts
 * import type { NamesListOptions } from "@johnmorrisdotca/kuni/names/fr";
 *
 * const options: NamesListOptions = { order: "name" };
 * console.log(options.order);   // "name"
 * ```
 */
interface NamesListOptions {
  /** "code" (the default) is alpha-2 order; "name" is by the name folded for this language, in plain code-unit order (not a locale's collation), countries with no name last. */
  order?: "code" | "name";
}

/**
 * One language's names: what an entry `@johnmorrisdotca/kuni/names/<language>` exports. Every function is pure.
 *
 * @example
 * ```ts
 * import type { Names } from "@johnmorrisdotca/kuni/names/fr";
 *
 * const read = (names: Names): string | null => names.countryName("JP");
 * console.log(typeof read);   // "function"
 * ```
 */
interface Names {
  /** The language of this entry. */
  readonly language: NamesLanguage;
  /** A country's name in this language, as `countryName(code, options)` says. */
  countryName(code: string, options?: NamesNameOptions): string | null;
  /** The variant forms CLDR gives for a country in this language; empty for most and for a code that is not a country. */
  countryVariants(code: string): readonly string[];
  /** The country somebody typed, by name, short form, variant or alias in this language (or its alpha-2 code), as `countryByName(text)` says. */
  countryByName(text: string): CountryCode | null;
  /** All 250 countries with their names in this language, in the order asked. */
  countries(options?: NamesListOptions): readonly NamedCountry[];
  /** What two ways of typing a name have in common in this language, as `fold(text)` says; the lookups compare names folded this way. */
  fold(text: string): string;
}

/** The rows an entry's data file holds, and what `createNames` reads. Not public: the data files are built by scripts/build-names.ts. */
interface NamesData {
  language: NamesLanguage;
  /** Per alpha-2 code: [name, short name, variants joined by "|", search aliases joined by "|"], an absent value null or "". */
  countries: Readonly<Record<string, readonly [string | null, string | null, string, string]>>;
}

// An article typed before a name that the name is not written with, taken off a query when the whole of it finds nothing:
// "la France", "l'Espagne", "el Perú", "o Brasil", "die Schweiz".
const ARTICLES: Partial<Record<NamesLanguage, RegExp>> = {
  fr: /^(?:l['’]|(?:le|la|les|l)\s+)/i,
  es: /^(?:el|la|los|las)\s+/i,
  pt: /^(?:o|a|os|as)\s+/i,
  de: /^(?:der|die|das)\s+/i,
};

// Arabic: the letters people type alike. The hamza forms and the vowel marks are taken off by the common fold; these are
// the alef wasla (ٱ) to alef, the alef maqsura (ى) to ya, the ta marbuta (ة) to ha, and the tatweel (ـ) off.
const foldArabic = (folded: string): string => folded.replace(/\u0640/g, "").replace(/\u0671/g, "\u0627").replace(/\u0649/g, "\u064a").replace(/\u0629/g, "\u0647");

/**
 * Folds a name the way the lookups of one language do: the common fold (case, width, accents and marks, punctuation; see
 * `fold` in the main entry), and for Arabic the letters people type alike. A page can use it to compare what it has.
 */
const foldFor = (language: NamesLanguage, text: string): string => {
  const folded = baseFold(text);

  return language === "ar" ? foldArabic(folded) : folded;
};

const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Makes the functions of an entry from its rows. Built on first use, so importing the entry costs nothing until it is asked. */
const createNames = (data: NamesData): Names => {
  const { language } = data;
  const articles = ARTICLES[language];
  const foldName = (text: string): string => foldFor(language, text);
  const key = (text: string): string => foldName(text).replace(/ /g, "");
  let list: readonly NamedCountry[] | null = null;
  let byName: Map<string, CountryCode> | null = null;
  const byCode = new Map<string, NamedCountry>();
  const sorted = new Map<string, readonly NamedCountry[]>();

  const all = (): readonly NamedCountry[] => {
    if (list === null) {
      list = Object.freeze(
        Object.entries(data.countries).map(([code, [name, shortName, variants]]) => {
          const one: NamedCountry = Object.freeze({
            code: code as CountryCode,
            name,
            shortName,
            variants: Object.freeze(variants === "" ? [] : variants.split("|")),
          });
          byCode.set(code, one);

          return one;
        }),
      );
    }

    return list;
  };

  const names = (): Map<string, CountryCode> => {
    if (byName === null) {
      byName = new Map();
      for (const one of all()) {
        const aliases = data.countries[one.code]![3];
        for (const name of [one.name, one.shortName, ...one.variants, ...(aliases === "" ? [] : aliases.split("|"))]) {
          if (name !== null && !byName.has(key(name))) byName.set(key(name), one.code);
        }
      }
    }

    return byName;
  };

  const countryName = (code: string, options: NamesNameOptions = {}): string | null => {
    if (typeof code !== "string") return null;
    all();
    const found = byCode.get(code.trim().toUpperCase());
    if (found === undefined) return null;

    return (options.short === true ? found.shortName : null) ?? found.name;
  };

  const countryVariants = (code: string): readonly string[] => {
    if (typeof code !== "string") return [];
    all();

    return byCode.get(code.trim().toUpperCase())?.variants ?? [];
  };

  const countryByName = (text: string): CountryCode | null => {
    if (typeof text !== "string") return null;
    const typed = text.trim();
    if (key(typed) === "") return null;
    const table = names();
    const found = table.get(key(typed)) ?? (articles === undefined ? undefined : table.get(key(typed.replace(articles, ""))));
    if (found !== undefined) return found;
    all();

    const code = foldName(typed).toUpperCase();

    return /^[A-Z]{2}$/.test(code) && byCode.has(code) ? (code as CountryCode) : null;
  };

  const countries = (options: NamesListOptions = {}): readonly NamedCountry[] => {
    const order = options.order ?? "code";
    const base = all();
    if (order !== "name") return base;
    const found = sorted.get(order);
    if (found !== undefined) return found;
    const sortKey = (one: NamedCountry): string => (one.name === null ? "" : foldName(one.name));
    const made = Object.freeze(
      [...base].sort((a, b) => (a.name === null ? 1 : 0) - (b.name === null ? 1 : 0) || compare(sortKey(a), sortKey(b)) || compare(a.code, b.code)),
    );
    sorted.set(order, made);

    return made;
  };

  return Object.freeze({ language, countryName, countryVariants, countryByName, countries, fold: foldName });
};

export { createNames, foldFor };
export type { NamedCountry, Names, NamesData, NamesLanguage, NamesListOptions, NamesNameOptions };
