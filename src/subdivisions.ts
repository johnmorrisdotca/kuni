// The entry @johnmorrisdotca/kuni/subdivisions: every country's subdivisions (5,050 of 200 countries) and
// the lookups over them. For one country only, import @johnmorrisdotca/kuni/subdivisions/<code> instead, or
// load it when it is wanted with @johnmorrisdotca/kuni/load.

import { isCountryCode } from "./codes";
import { SUBDIVISION_TABLES } from "./data/subdivisions/index.data";
import { fold, foldKey } from "./fold";
import { expandSubdivisions } from "./rows";
import type { SubdivisionTable } from "./rows";
import { SUBDIVISION_TYPES } from "./types";
import type { Language, Subdivision, SubdivisionType } from "./types";

/** A level of subdivision: 1 for a country's first division, 2 and 3 for those inside one, or "all". */
type Level = 1 | 2 | 3 | "all";

/** What `subdivisions()` may be asked. */
interface SubdivisionsOptions {
  /** 1 (the default) for the first division only; 2 or 3 for one deeper level; "all" for every level. */
  level?: Level;
}

/** What `subdivisionByName()` and `subdivisionsByName()` may be narrowed to. */
interface SubdivisionByNameOptions {
  /** Only this country's subdivisions (alpha-2, either case). */
  country?: string;
  /** Only this level; "all", the default, looks at every level. */
  level?: Level;
}

interface Tables {
  list: readonly Subdivision[];
  byCode: ReadonlyMap<string, Subdivision>;
  byCountry: ReadonlyMap<string, readonly Subdivision[]>;
  byName: ReadonlyMap<string, readonly Subdivision[]>;
  tableOf: ReadonlyMap<string, SubdivisionTable>;
}

const FULL_CODE = /^[a-z]{2}-[a-z0-9]{1,3}$/i;

const freeze = <T extends object>(value: T): T => Object.freeze(value);

// The Japanese word a subdivision's kind is written with in its name (州 for Canada's provinces, 県 for most
// of Japan's prefectures), where all the names of that kind in that country agree on one.
const typeWordJa = (table: SubdivisionTable, type: SubdivisionType | null): string | null => {
  if (type === null) return null;

  return table.typesJa[table.types.indexOf(type)] ?? null;
};

let tables: Tables | null = null;

// Built on first use, so importing the entry costs nothing until it is asked.
const build = (): Tables => {
  const byCode = new Map<string, Subdivision>();
  const byCountry = new Map<string, readonly Subdivision[]>();
  const byName = new Map<string, Subdivision[]>();
  const tableOf = new Map<string, SubdivisionTable>();
  const list: Subdivision[] = [];
  const index = (name: string | undefined | null, subdivision: Subdivision): void => {
    if (name === undefined || name === null) return;
    const key = foldKey(name);
    if (key === "") return;
    const found = byName.get(key) ?? [];
    if (!found.includes(subdivision)) byName.set(key, [...found, subdivision]);
  };
  for (const table of SUBDIVISION_TABLES) {
    tableOf.set(table.country, table);
    const expanded = expandSubdivisions(table);
    byCountry.set(table.country, expanded);
    for (const one of expanded) {
      list.push(one);
      byCode.set(one.code, one);
      index(one.name.en, one);
      index(one.name.ja, one);
      index(one.reading, one);
      // The name without its kind: オンタリオ for オンタリオ州, 東京 for 東京都.
      const word = typeWordJa(table, one.type);
      if (one.name.ja !== null && word !== null && one.name.ja.endsWith(word) && one.name.ja.length - word.length >= 2) {
        index(one.name.ja.slice(0, -word.length), one);
      }
    }
  }

  return { list: freeze(list), byCode, byCountry, byName, tableOf };
};

const getTables = (): Tables => {
  if (tables === null) tables = build();

  return tables;
};

const atLevel = (list: readonly Subdivision[], level: Level): readonly Subdivision[] =>
  level === "all" ? list : list.filter((one) => one.level === level);

/**
 * A country's subdivisions, in code order: the first level unless `level` asks for another or for "all".
 *
 * @param countryCode - An alpha-2 code, either case.
 * @param options - `level`: 1 (the default), 2, 3 or "all".
 * @returns The list, frozen; an empty list for a country that has none (Antarctica); `null` for a code that is not
 * a country.
 * @example
 * ```ts
 * import { subdivisions } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * subdivisions("JP")?.length;                    // 47
 * subdivisions("FR")?.length;                    // 26
 * subdivisions("FR", { level: "all" })?.length;  // 124
 * subdivisions("XX");                            // null
 * ```
 */
const subdivisions = (countryCode: string, options: SubdivisionsOptions = {}): readonly Subdivision[] | null => {
  const code = typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";
  if (!isCountryCode(code)) return null;
  const list = getTables().byCountry.get(code) ?? [];

  return freeze([...atLevel(list, options.level ?? 1)]);
};

/**
 * Every subdivision of every country, every level, in code order.
 *
 * @returns The 5,050 subdivisions, frozen and shared.
 * @example
 * ```ts
 * import { allSubdivisions } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * allSubdivisions().length;   // 5050
 * ```
 */
const allSubdivisions = (): readonly Subdivision[] => getTables().list;

/**
 * One subdivision by its ISO 3166-2 code.
 *
 * @param code - The full code, either case: "JP-13", "ca-on".
 * @returns The subdivision, frozen; `null` for anything that is not one.
 * @example
 * ```ts
 * import { subdivision } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * subdivision("JP-13")?.name.ja;   // "東京都"
 * subdivision("ca-on")?.name.en;   // "Ontario"
 * subdivision("FR-75C")?.parent;   // "FR-IDF"
 * subdivision("XX-99");            // null
 * ```
 */
const subdivision = (code: string): Subdivision | null => {
  if (typeof code !== "string") return null;

  return getTables().byCode.get(code.trim().toUpperCase()) ?? null;
};

/**
 * One subdivision by its country and the part of its code after the hyphen.
 *
 * @param countryCode - An alpha-2 code, either case.
 * @param shortCode - The part after the hyphen: "ON", "13".
 * @returns The subdivision, frozen; `null` where the two make no code.
 * @example
 * ```ts
 * import { subdivisionByShortCode } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * subdivisionByShortCode("CA", "ON")?.code;   // "CA-ON"
 * subdivisionByShortCode("JP", "99");         // null
 * ```
 */
const subdivisionByShortCode = (countryCode: string, shortCode: string): Subdivision | null => {
  if (typeof countryCode !== "string" || typeof shortCode !== "string") return null;

  return subdivision(`${countryCode.trim()}-${shortCode.trim()}`);
};

/**
 * Every subdivision a typed name could be, in code order: its English or Japanese name, its Japanese name without
 * the word for its kind (オンタリオ, 東京), a prefecture's reading, or its full code. Folded as `fold` folds, so
 * case, accents, width and kana do not matter.
 *
 * @param text - What was typed.
 * @param options - `country` and `level`, to narrow the search.
 * @returns The subdivisions it could be, frozen; an empty list for none.
 * @example
 * ```ts
 * import { subdivisionsByName } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * subdivisionsByName("Punjab").map((one) => one.code);   // ["IN-PB", "PK-PB"]
 * subdivisionsByName("とうきょうと").map((one) => one.code); // ["JP-13"]
 * subdivisionsByName("Narnia");                          // []
 * ```
 */
const subdivisionsByName = (text: string, options: SubdivisionByNameOptions = {}): readonly Subdivision[] => {
  if (typeof text !== "string" || fold(text) === "") return freeze([]);
  const { byName } = getTables();
  const country = options.country?.trim().toUpperCase();
  const byCode = FULL_CODE.test(text.trim()) ? subdivision(text) : null;
  const found = byCode !== null ? [byCode] : (byName.get(foldKey(text)) ?? []);
  const kept = atLevel(found, options.level ?? "all").filter((one) => country === undefined || one.country === country);

  return freeze([...kept].sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0)));
};

/**
 * The one subdivision a typed name means. When the name is at more than one level, the highest level wins (a
 * region over a department of the same name).
 *
 * @param text - What was typed: "Ontario", オンタリオ州, オンタリオ.
 * @param options - `country` and `level`, to narrow the search.
 * @returns The subdivision, frozen; `null` when nothing matches, or when the name is still more than one place
 * (Punjab is in India and in Pakistan): name the country.
 * @example
 * ```ts
 * import { subdivisionByName } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * subdivisionByName("オンタリオ州", { country: "CA" })?.code;   // "CA-ON"
 * subdivisionByName("Punjab");                                 // null
 * subdivisionByName("Punjab", { country: "PK" })?.code;        // "PK-PB"
 * ```
 */
const subdivisionByName = (text: string, options: SubdivisionByNameOptions = {}): Subdivision | null => {
  const found = subdivisionsByName(text, options);
  if (found.length === 0) return null;
  const top = Math.min(...found.map((one) => one.level));
  const atTop = found.filter((one) => one.level === top);

  return atTop.length === 1 ? atTop[0] : null;
};

// The kind most of a country's first-level subdivisions are.
const mainType = (table: SubdivisionTable, list: readonly Subdivision[]): SubdivisionType | null => {
  const counts = new Map<SubdivisionType, number>();
  for (const one of list) if (one.level === 1 && one.type !== null) counts.set(one.type, (counts.get(one.type) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  return ranked[0]?.[0] ?? (table.types[0] ?? null);
};

/**
 * The word for a kind of subdivision. Given a subdivision's code, its own kind ("JP-13" is "metropolis", 都); given
 * a country's code, the kind most of its first-level subdivisions are ("JP" is "prefecture", 県). In English the
 * kind's name with spaces; in Japanese the word the names of that kind in that country end in.
 *
 * @param code - A subdivision's code ("JP-13") or a country's alpha-2 code ("JP").
 * @param language - "en" (the default) or "ja".
 * @returns The word; `null` where the kind is not known, or, in Japanese, where the names do not agree on one.
 * @example
 * ```ts
 * import { subdivisionTypeLabel } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * subdivisionTypeLabel("JP-13");          // "metropolis"
 * subdivisionTypeLabel("JP-13", "ja");    // "都"
 * subdivisionTypeLabel("CA", "ja");       // "州"
 * subdivisionTypeLabel("XX");             // null
 * ```
 */
const subdivisionTypeLabel = (code: string, language: Language = "en"): string | null => {
  if (typeof code !== "string") return null;
  const { tableOf, byCountry } = getTables();
  const wanted = code.trim().toUpperCase();
  let table: SubdivisionTable | undefined;
  let type: SubdivisionType | null = null;
  if (/^[A-Z]{2}$/.test(wanted)) {
    table = tableOf.get(wanted);
    if (table !== undefined) type = mainType(table, byCountry.get(wanted) ?? []);
  } else {
    const one = subdivision(wanted);
    if (one !== null) {
      table = tableOf.get(one.country);
      type = one.type;
    }
  }
  if (table === undefined || type === null) return null;

  return language === "ja" ? typeWordJa(table, type) : type.replace(/-/g, " ");
};

export {
  allSubdivisions,
  subdivision,
  subdivisionByName,
  subdivisionByShortCode,
  subdivisions,
  subdivisionsByName,
  SUBDIVISION_TYPES,
  subdivisionTypeLabel,
};
export type { Level, Subdivision, SubdivisionByNameOptions, SubdivisionsOptions, SubdivisionType };
