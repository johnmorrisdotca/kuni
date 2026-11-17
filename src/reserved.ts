// The entry @johnmorrisdotca/kuni/reserved: the places that have a code or a flag in common use and are no country
// of ISO 3166-1. Three kinds: a place with a code ISO 3166-1 reserves exceptionally (AC Ascension Island, IC the
// Canary Islands, EA Ceuta and Melilla), a place a flag set gives a code of the user-assigned range (XA Abkhazia),
// and a de-facto state with no code at all (Somaliland). Kept out of the main entry on purpose: a country list or a
// picker built from `countries()` never offers one, and a lookup in the main entry never returns one.
// docs/reserved.md says where each record comes from.

import { RESERVED_READ, RESERVED_ROWS } from "./data/reserved.data";
import type { ReservedRow } from "./rows";

/**
 * The kinds of place outside ISO 3166-1, in kebab case: "iso-reserved" has a code ISO 3166-1 reserves exceptionally,
 * "user-assigned" a code of its user-assigned range that a published flag set uses, "de-facto" no code.
 *
 * @example
 * ```ts
 * import { RESERVED_KINDS, reservedPlaces } from "@johnmorrisdotca/kuni/reserved";
 *
 * console.log(RESERVED_KINDS.map((kind) => reservedPlaces({ kind }).length)); // [7, 3, 4]
 * ```
 */
const RESERVED_KINDS = ["iso-reserved", "user-assigned", "de-facto"] as const;

/** A kind of place outside ISO 3166-1: "iso-reserved", "user-assigned" or "de-facto".
 *
 * @example
 * ```ts
 * import type { ReservedKind } from "@johnmorrisdotca/kuni/reserved";
 * import { RESERVED_KINDS } from "@johnmorrisdotca/kuni/reserved";
 *
 * const value: ReservedKind = RESERVED_KINDS[0];
 * console.log(typeof value === "object" ? Object.keys(value).slice(0,6) : value);
 * ```
 */
type ReservedKind = (typeof RESERVED_KINDS)[number];

/** A place outside ISO 3166-1, as the lookups hand it out (frozen).
 *
 * @example
 * ```ts
 * import type { ReservedPlace } from "@johnmorrisdotca/kuni/reserved";
 * import { reservedPlace } from "@johnmorrisdotca/kuni/reserved";
 *
 * const value: ReservedPlace = reservedPlace("IC")!;
 * console.log(typeof value === "object" ? Object.keys(value).slice(0,6) : value);
 * ```
 */
interface ReservedPlace {
  /** A name for it in kebab case that does not change: "ascension-island", "somaliland". */
  id: string;
  /** Its two letters, "AC" or "XA"; absent for a de-facto place, which has none. */
  code?: string;
  /** The three letters CLDR gives a reserved code, "ASC"; absent where it gives none. */
  alpha3?: string;
  /** Which kind of place it is. */
  kind: ReservedKind;
  /** CLDR's names for a reserved code, Wikidata's labels otherwise; `ja` is `null` where the source has none. */
  name: { en: string; ja: string | null };
  /** "territory" or "uninhabited" for a reserved code, which is part of a state; "disputed" for the others. */
  status: "territory" | "disputed" | "uninhabited";
  /**
   * The alpha-2 code of the member of the United Nations Wikidata names as the country it is in, or as claiming it:
   * "GB" for Ascension Island, "ES" for the Canary Islands. For a user-assigned or de-facto place it is what Wikidata
   * records and says nothing about who governs it. Absent where Wikidata names none.
   */
  parent?: string;
  /** The ISO 3166-2 codes kuni has for the same place: ["SH-AC"], ["ES-CE", "ES-ML"]; empty where there is none. */
  subdivisions: readonly string[];
  /** The year Wikidata says it was dissolved, "2023"; absent for a place that still is. */
  until?: string;
  /** Where the code, or the place, comes from: a name and an address. */
  source: { name: string; url: string };
}

/** What `reservedPlaces()` may be asked.
 *
 * @example
 * ```ts
 * import type { ReservedPlacesOptions } from "@johnmorrisdotca/kuni/reserved";
 *
 * const value: ReservedPlacesOptions = {kind:"iso-reserved"};
 * console.log(typeof value === "object" ? Object.keys(value).slice(0,6) : value);
 * ```
 */
interface ReservedPlacesOptions {
  /** Only the places of this kind. */
  kind?: ReservedKind;
}

const expand = (row: ReservedRow): ReservedPlace => {
  const place: ReservedPlace = {
    id: row.id,
    kind: row.kind,
    name: Object.freeze({ en: row.en, ja: row.ja }),
    status: row.status,
    subdivisions: Object.freeze([...row.subdivisions]),
    source: Object.freeze({ name: row.source[0], url: row.source[1] }),
  };
  if (row.code !== null) place.code = row.code;
  if (row.alpha3 !== null) place.alpha3 = row.alpha3;
  if (row.parent !== null) place.parent = row.parent;
  if (row.until !== null) place.until = row.until;

  return Object.freeze(place);
};

let table: readonly ReservedPlace[] | null = null;
const getTable = (): readonly ReservedPlace[] => {
  if (table === null) table = Object.freeze(RESERVED_ROWS.map(expand));

  return table;
};

/**
 * Every place outside ISO 3166-1, in order of its id. Never part of `countries()`, so a picker does not offer them
 * unless it asks.
 *
 * @param options - `kind`: only the places of one of `RESERVED_KINDS`.
 * @returns The places, the list and its objects frozen.
 * @example
 * ```ts
 * import { reservedPlaces } from "@johnmorrisdotca/kuni/reserved";
 *
 * console.log(reservedPlaces().length);                                             // 14
 * console.log(reservedPlaces({ kind: "iso-reserved" }).map((one) => one.code));     // ["AC", "IC", "EA", "CP", "DG", "CQ", "TA"]
 * console.log(reservedPlaces({ kind: "de-facto" }).map((one) => one.id));           // ["artsakh", "sahrawi-republic", "somaliland", "transnistria"]
 * ```
 */
const reservedPlaces = (options: ReservedPlacesOptions = {}): readonly ReservedPlace[] => {
  const { kind } = options;

  return kind === undefined ? getTable() : Object.freeze(getTable().filter((one) => one.kind === kind));
};

/**
 * One place outside ISO 3166-1, by its code ("IC", "ic"), its three letters ("ASC") or its id ("somaliland").
 *
 * @param text - A code, in either case, or an id.
 * @returns The place, frozen; `null` for anything else, a country's code included.
 * @example
 * ```ts
 * import { reservedPlace } from "@johnmorrisdotca/kuni/reserved";
 *
 * console.log(reservedPlace("IC")?.name.ja);            // "カナリア諸島"
 * console.log(reservedPlace("ea")?.subdivisions);       // ["ES-CE", "ES-ML"]
 * console.log(reservedPlace("AC")?.parent);             // "GB"
 * console.log(reservedPlace("somaliland")?.kind);       // "de-facto"
 * console.log(reservedPlace("JP"));                     // null
 * ```
 */
const reservedPlace = (text: string): ReservedPlace | null => {
  if (typeof text !== "string") return null;
  const wanted = text.trim();
  if (wanted === "") return null;
  const upper = wanted.toUpperCase();

  return getTable().find((one) => one.code === upper || one.alpha3 === upper || one.id === wanted.toLowerCase()) ?? null;
};

export { reservedPlace, reservedPlaces, RESERVED_KINDS, RESERVED_READ };
export type { ReservedKind, ReservedPlace, ReservedPlacesOptions };
