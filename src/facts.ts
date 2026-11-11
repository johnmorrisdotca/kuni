// The entry @johnmorrisdotca/kuni/facts: the figures about each country that a profile page, a table or a quiz
// wants beside its names: population and area with the year each is for, coordinates for the country and its
// capital, its land borders, the side of the road it drives on, and the conventions CLDR records for it (the first
// day of the week, the measurement system, the paper size and the clock). Kept out of the main entry so that a page
// that only names countries does not carry them.

import { FACT_ROWS, FACTS_READ } from "./data/facts.data";
import { ZONE_ROWS } from "./data/zones.data";
import type { FactsRow } from "./rows";
import type { CountryFacts, DrivingSide, HourCycle, LatLon, MeasurementSystem, PaperSize, WeekStart } from "./types";

const WEEK_STARTS = ["mon", "sun", "sat", "fri"] as const;
const MEASUREMENTS = ["metric", "US", "UK"] as const;
const PAPERS = ["A4", "US-Letter"] as const;
const HOUR_CYCLES = ["h12", "h23"] as const;

const pointOf = (lat: unknown, lon: unknown): LatLon | null => (typeof lat === "number" && typeof lon === "number" ? Object.freeze({ lat, lon }) : null);
const numberOr = (value: unknown): number | null => (typeof value === "number" ? value : null);

const expandFacts = (row: FactsRow): CountryFacts => {
  const [alpha2, population, populationYear, area, areaYear, areaOf, lat, lon, capitalLat, capitalLon, borders, side, conventions, zone] = row;
  const given = typeof conventions === "string" ? conventions.split(" ") : [];
  const pick = <T extends string>(choices: readonly T[], fallback: T): T => choices.find((choice) => given.includes(choice)) ?? fallback;
  const areaKm2 = numberOr(area);

  return Object.freeze({
    alpha2,
    population: numberOr(population),
    populationYear: numberOr(populationYear),
    areaKm2,
    areaYear: numberOr(areaYear),
    areaOf: areaKm2 === null ? null : areaOf === "L" ? "land" : "whole",
    point: pointOf(lat, lon),
    capitalPoint: pointOf(capitalLat, capitalLon),
    capitalZone: typeof zone === "string" ? zone : null,
    borders: Object.freeze(typeof borders === "string" ? borders.split(" ") : []),
    drivingSide: side === "L" ? "left" : side === "R" ? "right" : null,
    weekStart: pick(WEEK_STARTS, "mon"),
    measurement: pick(MEASUREMENTS, "metric"),
    paper: pick(PAPERS, "A4"),
    hourCycle: pick(HOUR_CYCLES, "h23"),
  } satisfies CountryFacts);
};

// Built on first use, like the main entry's tables.
let table: { list: readonly CountryFacts[]; byCode: ReadonlyMap<string, CountryFacts> } | null = null;
const getTable = (): NonNullable<typeof table> => {
  if (table === null) {
    const list = Object.freeze(FACT_ROWS.map(expandFacts));
    table = { list, byCode: new Map(list.map((one) => [one.alpha2, one])) };
  }

  return table;
};

/**
 * The facts about one country, by its alpha-2 code in either case.
 *
 * @param code - An ISO 3166-1 alpha-2 code, "JP" or "jp"; for an alpha-3 or numeric code, pass `country(code)?.alpha2`.
 * @returns The country's facts, frozen; `null` for anything that is not one of the 250 codes.
 * @example
 * ```ts
 * import { facts } from "@johnmorrisdotca/kuni/facts";
 *
 * console.log(facts("JP")?.population);    // 123802000
 * console.log(facts("JP")?.populationYear); // 2024
 * console.log(facts("FR")?.borders);        // ["AD", "BE", "BR", "CH", "DE", "ES", "IT", "LU", "MC", "SR"]
 * console.log(facts("GB")?.drivingSide);    // "left"
 * console.log(facts("US")?.weekStart);      // "sun"
 * console.log(facts("XX"));                 // null
 * ```
 */
const facts = (code: string): CountryFacts | null => {
  if (typeof code !== "string") return null;

  return getTable().byCode.get(code.trim().toUpperCase()) ?? null;
};

/**
 * The facts about every country, in alpha-2 order: one object for each of the 250 codes, the list and its objects
 * frozen and shared. Plain numbers and codes, so a build script can write them out as JSON as they are.
 *
 * @returns Every country's facts.
 * @example
 * ```ts
 * import { allFacts } from "@johnmorrisdotca/kuni/facts";
 *
 * const crowded = allFacts()
 *   .filter((one) => one.population !== null && one.areaKm2 !== null)
 *   .sort((a, b) => b.population! / b.areaKm2! - a.population! / a.areaKm2!)[0].alpha2; // "MC"
 * ```
 */
const allFacts = (): readonly CountryFacts[] => getTable().list;

const EARTH_KM = 6371.0088;
const RADIANS = Math.PI / 180;

/**
 * The great-circle distance between two points, in kilometres, on a sphere of the earth's mean radius (6,371 km).
 * Within about half a percent of the distance on the ground.
 *
 * @param from - A point, `{ lat, lon }` in degrees.
 * @param to - Another point.
 * @returns The distance in kilometres.
 * @example
 * ```ts
 * import { distanceKm, facts } from "@johnmorrisdotca/kuni/facts";
 *
 * console.log(Math.round(distanceKm(facts("JP")!.capitalPoint!, facts("GB")!.capitalPoint!))); // 9558
 * ```
 */
const distanceKm = (from: LatLon, to: LatLon): number => {
  const half = Math.sin(((to.lat - from.lat) * RADIANS) / 2) ** 2 + Math.cos(from.lat * RADIANS) * Math.cos(to.lat * RADIANS) * Math.sin(((to.lon - from.lon) * RADIANS) / 2) ** 2;

  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(half)));
};

/**
 * The IANA time zone at a point in a country, and whether it is known or estimated.
 *
 * A country with one zone gives that zone, `estimated: false`. A country with several gives the zone whose principal
 * city (zone.tab's, and the capital for the capital's zone) is nearest the point, `estimated: true`: right for most of
 * a country, and possibly wrong near the edge between two zones, since kuni has no zone boundaries. Say so where it is
 * shown.
 *
 * @param code - The country the point is in, an ISO 3166-1 alpha-2 code in either case.
 * @param point - The point, `{ lat, lon }` in degrees.
 * @returns The zone and whether it was estimated; `null` for a code that is not a country or a country with no zone.
 * @example
 * ```ts
 * import { timeZoneAt } from "@johnmorrisdotca/kuni/facts";
 *
 * console.log(timeZoneAt("JP", { lat: 43.06, lon: 141.35 })); // { zone: "Asia/Tokyo", estimated: false }
 * console.log(timeZoneAt("US", { lat: 47.61, lon: -122.33 })?.zone); // "America/Los_Angeles"
 * ```
 */
const timeZoneAt = (code: string, point: LatLon): { zone: string; estimated: boolean } | null => {
  const wanted = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (point === null || typeof point !== "object" || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return null;
  const own: (readonly [string, number, number, string])[] = ZONE_ROWS.filter((row) => row[0] === wanted);
  // The capital counts as a principal city of its own zone, checked by hand: Astana keeps Asia/Almaty, Kosovo's one zone
  // is Europe/Belgrade though zone.tab lists none.
  const country = facts(wanted);
  if (country?.capitalPoint && country.capitalZone) own.push([wanted, country.capitalPoint.lat, country.capitalPoint.lon, country.capitalZone]);
  const zones = new Set(own.map((row) => row[3]));
  if (zones.size === 0) return null;
  if (zones.size === 1) return Object.freeze({ zone: own[0]![3], estimated: false });
  let best = own[0]!;
  let bestKm = Infinity;
  for (const row of own) {
    const km = distanceKm(point, { lat: row[1], lon: row[2] });
    if (km < bestKm) {
      best = row;
      bestKm = km;
    }
  }

  return Object.freeze({ zone: best[3], estimated: true });
};

export { allFacts, distanceKm, facts, FACTS_READ, timeZoneAt };
export type { CountryFacts, DrivingSide, HourCycle, LatLon, MeasurementSystem, PaperSize, WeekStart };
