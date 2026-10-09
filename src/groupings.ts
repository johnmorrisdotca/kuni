// The entry @johnmorrisdotca/kuni/groupings: groupings of countries, and of the subdivisions inside a country, each
// named in English and Japanese, with its members as codes, the definition it follows, its source and its licence,
// and the day it was true. The kinds: the seven continents, the UN M49 areas, the members of international bodies
// (with the dates they joined and left), well-known informal groupings (the Middle East, the Balkans, Scandinavia),
// and regions inside a country (Japan's eight 地方, the US Census regions). docs/groupings.md says what each follows.

import { GROUPING_ROWS } from "./data/groupings.data";
import type { GroupingRow } from "./rows";
import { GROUPING_KINDS } from "./types";
import type { GroupingKind, GroupingStatus } from "./types";

/** One period of membership of a body: a member from `since` (or a day Wikidata does not give) until `until`. */
interface GroupingMember {
  /** The member's alpha-2 code: "DE". */
  code: string;
  /** The day it joined, "1958-01-01", from Wikidata; `null` where Wikidata does not give the day. */
  since: string | null;
  /** The day it left, "2020-01-31"; `null` while it is a member. */
  until: string | null;
}

/** Another name a grouping goes by, in English and Japanese. */
interface GroupingName {
  /** In English: "Kansai region". */
  en: string;
  /** In Japanese: "関西地方". */
  ja: string;
  /** The Japanese in hiragana, where it has kanji: "かんさいちほう". */
  reading?: string;
}

/** A country that stands with a body without being a member: a candidate, an associate, an observer or suspended. */
interface GroupingOther {
  /** The country's alpha-2 code. */
  code: string;
  /** How it stands. */
  status: GroupingStatus;
}

/** Where a grouping's definition comes from, and the terms its list is under. */
interface GroupingSource {
  /** The source's name: "European Union, Countries". */
  name: string;
  /** Where to read it. */
  url: string;
  /** The terms of the list as it is shipped here. */
  licence: string;
}

/** A grouping of countries, or of the subdivisions inside one country. */
interface Grouping {
  /** A stable id in kebab case: "eu", "m49-030", "continent-as", "jp-kanto". */
  id: string;
  /** What kind of grouping it is. */
  kind: GroupingKind;
  /** Its name in English and in Japanese. */
  name: { en: string; ja: string };
  /** A short form where one is in use: "EU", "NATO", 国連. */
  shortName?: { en?: string; ja?: string };
  /** The Japanese name in hiragana, where it is written with kanji. */
  reading?: string;
  /** Other names it is known by, each in both languages with its reading: Kansai (関西地方) for the Kinki region. */
  otherNames?: readonly GroupingName[];
  /** True for a grouping no body defines (the Middle East, Scandinavia), whose members follow the definition given. */
  informal: boolean;
  /** For a grouping of subdivisions: the alpha-2 code of the country they are in. */
  country?: string;
  /** For a UN M49 area: the id of the area that holds it ("m49-142" for Eastern Asia). */
  parent?: string;
  /** For a grouping of subdivisions: the sets it belongs to. The groupings of one set cover the country once. */
  sets?: readonly string[];
  /** The members now: alpha-2 codes, or ISO 3166-2 codes for a grouping inside a country. */
  members: readonly string[];
  /** For an international body: every period of membership, current and former, with its dates. */
  periods?: readonly GroupingMember[];
  /** For an international body: countries that stand with it without being members. */
  others?: readonly GroupingOther[];
  /** The definition the members follow. */
  definition: string;
  /** Where definitions disagree, or anything else a reader should know. */
  note?: string;
  /** Where the list comes from, and its terms. */
  source: GroupingSource;
  /** The day the list was true, "2026-10-09". */
  asOf: string;
}

/** What `groupings()` may be narrowed to. */
interface GroupingsOptions {
  /** Only groupings of this kind. */
  kind?: GroupingKind;
  /** Only groupings of the subdivisions inside this country (alpha-2, either case). */
  country?: string;
}

/** What `groupingsOf()` and `membersOf()` may be asked. */
interface GroupingDateOptions {
  /**
   * A day, "2015-06-30": an international body's members on that day rather than now. A member whose start Wikidata
   * does not give counts from the start. Groupings that are not bodies have no dates, and the day changes nothing.
   */
  on?: string;
  /** Only groupings of this kind (for `groupingsOf`). */
  kind?: GroupingKind;
}

const expand = (row: GroupingRow): Grouping => {
  const grouping: Grouping = {
    id: row.id,
    kind: row.kind,
    name: Object.freeze({ en: row.en, ja: row.ja }),
    informal: row.kind === "informal",
    members: Object.freeze([...row.members]),
    definition: row.definition,
    source: Object.freeze({ name: row.source[0], url: row.source[1], licence: row.source[2] }),
    asOf: row.asOf,
  };
  if (row.shortEn !== undefined || row.shortJa !== undefined) {
    grouping.shortName = Object.freeze({ ...(row.shortEn === undefined ? {} : { en: row.shortEn }), ...(row.shortJa === undefined ? {} : { ja: row.shortJa }) });
  }
  if (row.reading !== undefined) grouping.reading = row.reading;
  if (row.otherNames !== undefined) grouping.otherNames = Object.freeze(row.otherNames.map((name) => Object.freeze({ ...name })));
  if (row.country !== undefined) grouping.country = row.country;
  if (row.parent !== undefined) grouping.parent = row.parent;
  if (row.sets !== undefined) grouping.sets = Object.freeze([...row.sets]);
  if (row.periods !== undefined) grouping.periods = Object.freeze(row.periods.map(([code, since, until]) => Object.freeze({ code, since, until })));
  if (row.others !== undefined) grouping.others = Object.freeze(row.others.map(([code, status]) => Object.freeze({ code, status })));
  if (row.note !== undefined) grouping.note = row.note;

  return Object.freeze(grouping);
};

let table: { list: readonly Grouping[]; byId: ReadonlyMap<string, Grouping> } | null = null;
const getTable = (): NonNullable<typeof table> => {
  if (table === null) {
    const list = Object.freeze(GROUPING_ROWS.map(expand));
    table = { list, byId: new Map(list.map((one) => [one.id, one])) };
  }

  return table;
};

const DAY = /^\d{4}-\d\d-\d\d$/;

// The members of a grouping on a day: for a body, those whose period covers the day; for anything else, the members.
const membersOn = (one: Grouping, on: string | undefined): readonly string[] => {
  if (on === undefined || one.periods === undefined) return one.members;

  return [...new Set(one.periods.filter((period) => (period.since === null || period.since <= on) && (period.until === null || on < period.until)).map((period) => period.code))].sort();
};

/**
 * Every grouping, or those of one kind or inside one country, in a fixed order: continents, UN M49 areas,
 * international bodies, informal groupings, then regions inside a country.
 *
 * @param options - `kind` to keep one kind, `country` to keep the groupings of one country's subdivisions.
 * @returns The groupings, frozen; an empty list where none match.
 * @example
 * ```ts
 * import { groupings } from "@johnmorrisdotca/kuni/groupings";
 *
 * groupings({ kind: "continent" }).map((one) => one.name.en); // ["Africa", "Antarctica", "Asia", "Europe", ...]
 * groupings({ country: "JP" }).length;                         // 10: the eight 地方, and the nine-region variant's two
 * ```
 */
const groupings = (options: GroupingsOptions = {}): readonly Grouping[] => {
  const country = typeof options.country === "string" ? options.country.trim().toUpperCase() : undefined;

  return Object.freeze(getTable().list.filter((one) => (options.kind === undefined || one.kind === options.kind) && (country === undefined || one.country === country)));
};

/**
 * One grouping by its id.
 *
 * @param id - The grouping's id: "eu", "nato", "m49-030", "continent-as", "middle-east", "jp-kanto".
 * @returns The grouping, frozen; `null` for an id that is not one.
 * @example
 * ```ts
 * import { grouping } from "@johnmorrisdotca/kuni/groupings";
 *
 * grouping("eu")?.members.length;    // 27
 * grouping("eu")?.name.ja;           // "欧州連合"
 * grouping("jp-kanto")?.members[5];  // "JP-13"
 * grouping("atlantis");              // null
 * ```
 */
const grouping = (id: string): Grouping | null => (typeof id === "string" ? (getTable().byId.get(id.trim().toLowerCase()) ?? null) : null);

/**
 * The groupings a country, or a subdivision, is a member of: now, or on a given day.
 *
 * @param code - An alpha-2 code ("FR", either case) or an ISO 3166-2 code ("JP-13").
 * @param options - `on` for a day in the past, `kind` to keep one kind.
 * @returns The groupings, frozen, in the order of `groupings()`; an empty list for a code in none, or not a code.
 * @example
 * ```ts
 * import { groupingsOf } from "@johnmorrisdotca/kuni/groupings";
 *
 * groupingsOf("GB", { kind: "membership" }).map((one) => one.id);                    // ["un", "nato", "g7", ...]
 * groupingsOf("GB", { kind: "membership", on: "2015-01-01" }).some((one) => one.id === "eu"); // true
 * groupingsOf("JP-13").map((one) => one.id);                                          // ["jp-kanto"]
 * ```
 */
const groupingsOf = (code: string, options: GroupingDateOptions = {}): readonly Grouping[] => {
  if (typeof code !== "string") return Object.freeze([]);
  const wanted = code.trim().toUpperCase();
  const on = options.on !== undefined && DAY.test(options.on) ? options.on : undefined;

  return Object.freeze(getTable().list.filter((one) => (options.kind === undefined || one.kind === options.kind) && membersOn(one, on).includes(wanted)));
};

/**
 * The members of a grouping: now, or on a given day for an international body.
 *
 * @param id - The grouping's id.
 * @param options - `on`, a day such as "2019-06-30".
 * @returns The members' codes, frozen; `null` for an id that is not a grouping.
 * @example
 * ```ts
 * import { membersOf } from "@johnmorrisdotca/kuni/groupings";
 *
 * membersOf("eu")?.includes("GB");                       // false
 * membersOf("eu", { on: "2019-06-30" })?.includes("GB"); // true
 * membersOf("us-pacific");                               // ["US-AK", "US-CA", "US-HI", "US-OR", "US-WA"]
 * ```
 */
const membersOf = (id: string, options: GroupingDateOptions = {}): readonly string[] | null => {
  const found = grouping(id);
  if (found === null) return null;
  const on = options.on !== undefined && DAY.test(options.on) ? options.on : undefined;

  return Object.freeze([...membersOn(found, on)]);
};

export { GROUPING_KINDS, grouping, groupings, groupingsOf, membersOf };
export type { Grouping, GroupingDateOptions, GroupingKind, GroupingMember, GroupingName, GroupingOther, GroupingsOptions, GroupingSource, GroupingStatus };
