// The entry @johnmorrisdotca/kuni/zones: the IANA time zone of a first-level subdivision, and the zone at a point in a
// country, worked out without boundaries: from IANA's zone.tab, Wikidata's zones of each subdivision and each
// subdivision's capital. Kept out of /facts, whose tables it would treble. A country's capital's zone is
// `facts(code).capitalZone`.

import { SUBDIVISION_ZONE_ROWS, ZONE_ROWS } from "./data/zones.data";
import { distanceKm, facts } from "./facts";
import type { LatLon } from "./types";

/**
 * A zone, and whether it was worked out rather than read: `estimated` is true where kuni had to choose.
 *
 * @example
 * ```ts
 * import { subdivisionTimeZone, type ZoneAnswer } from "@johnmorrisdotca/kuni/zones";
 *
 * const answer: ZoneAnswer | null = subdivisionTimeZone("CA-BC");
 * console.log(answer?.zone); // "America/Vancouver"
 * ```
 */
interface ZoneAnswer {
  /** The IANA zone, "America/Los_Angeles". */
  zone: string;
  /** True where kuni chose it (nearest a capital or a point), false where a source names it alone. */
  estimated: boolean;
}

// A country's zones from zone.tab, with the capital's (checked by hand) beside them: Kosovo's one zone is Europe/Belgrade
// though zone.tab lists none.
const zonesOf = (code: string): readonly string[] => {
  const zones = new Set(ZONE_ROWS.filter((row) => row[0] === code).map((row) => row[3]));
  const capital = facts(code)?.capitalZone;
  if (capital) zones.add(capital);

  return [...zones];
};

/**
 * The IANA time zone of a first-level subdivision, by its ISO 3166-2 code: what a map of a country's regions shows.
 *
 * In a country with one zone, that zone (`estimated: false`). In a country with several, the zone Wikidata gives the
 * subdivision where it gives one of the country's zones alone (`estimated: false`); where it gives several (Indiana,
 * Idaho) or none, the one whose principal city in IANA's zone.tab is nearest the subdivision's capital
 * (`estimated: true`); and for the few kuni has no point for and Wikidata names no zone of (Beijing, Catalonia), the
 * zone of the country's capital (`estimated: true`).
 *
 * @param code - An ISO 3166-2 code, "US-WA" or "us-wa".
 * @returns The zone and whether it was estimated; `null` for a code kuni does not list as a first-level subdivision,
 * or one in a country with no zone.
 * @example
 * ```ts
 * import { subdivisionTimeZone } from "@johnmorrisdotca/kuni/zones";
 *
 * console.log(subdivisionTimeZone("US-WA")); // { zone: "America/Los_Angeles", estimated: false }
 * console.log(subdivisionTimeZone("JP-13")?.zone); // "Asia/Tokyo"
 * ```
 */
const subdivisionTimeZone = (code: string): ZoneAnswer | null => {
  const wanted = typeof code === "string" ? code.trim().toUpperCase() : "";
  const row = SUBDIVISION_ZONE_ROWS.find((one) => one[0] === wanted);
  if (row !== undefined) return Object.freeze({ zone: row[1], estimated: row[2] !== 0 });
  const country = /^([A-Z]{2})-[A-Z0-9]{1,3}$/.exec(wanted)?.[1];
  if (country === undefined) return null;
  const zones = zonesOf(country);
  // A country with several zones has a row for each subdivision kuni lists: no row means the code is not one of them.
  if (zones.length !== 1) return null;

  return Object.freeze({ zone: zones[0]!, estimated: false });
};

/**
 * The IANA time zone at a point in a country, and whether it is known or estimated.
 *
 * A country with one zone gives that zone, `estimated: false`. A country with several gives the zone of the
 * subdivision whose capital is nearest the point (`subdivisionTimeZone`), `estimated: true`: kuni has no boundaries,
 * so a point near the edge of a state or province, or of a zone inside one, can be given its neighbour's. Say so where
 * it is shown; a map of regions that knows the region asks `subdivisionTimeZone` instead.
 *
 * @param code - The country the point is in, an ISO 3166-1 alpha-2 code in either case.
 * @param point - The point, `{ lat, lon }` in degrees.
 * @returns The zone and whether it was estimated; `null` for a code that is not a country or a country with no zone.
 * @example
 * ```ts
 * import { timeZoneAt } from "@johnmorrisdotca/kuni/zones";
 *
 * console.log(timeZoneAt("JP", { lat: 43.06, lon: 141.35 })); // { zone: "Asia/Tokyo", estimated: false }
 * console.log(timeZoneAt("US", { lat: 47.61, lon: -122.33 })?.zone); // "America/Los_Angeles"
 * ```
 */
const timeZoneAt = (code: string, point: LatLon): ZoneAnswer | null => {
  const wanted = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (point === null || typeof point !== "object" || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return null;
  const zones = zonesOf(wanted);
  if (zones.length === 0) return null;
  if (zones.length === 1) return Object.freeze({ zone: zones[0]!, estimated: false });
  // The nearest subdivision capital; where the country has no subdivision with a capital, the nearest zone.tab city.
  const places: readonly (readonly [string, number, number])[] = [
    ...SUBDIVISION_ZONE_ROWS.filter((row) => row[0].startsWith(`${wanted}-`) && row[3] !== null && row[4] !== null).map((row) => [row[1], row[3]!, row[4]!] as const),
  ];
  const pool = places.length > 0 ? places : ZONE_ROWS.filter((row) => row[0] === wanted).map((row) => [row[3], row[1], row[2]] as const);
  let best = pool[0]!;
  let bestKm = Infinity;
  for (const place of pool) {
    const km = distanceKm(point, { lat: place[1], lon: place[2] });
    if (km < bestKm) {
      best = place;
      bestKm = km;
    }
  }

  return Object.freeze({ zone: best[0], estimated: true });
};

export { subdivisionTimeZone, timeZoneAt };
export type { ZoneAnswer };
