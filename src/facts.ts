// The entry @johnmorrisdotca/kuni/facts: the figures about each country that a profile page, a table or a quiz
// wants beside its names: population and area with the year each is for, coordinates for the country and its
// capital, its land borders, the side of the road it drives on, and the conventions CLDR records for it (the first
// day of the week, the measurement system, the paper size and the clock). Kept out of the main entry so that a page
// that only names countries does not carry them.

import { FACT_ROWS, FACTS_READ } from "./data/facts.data";
import type { FactsRow } from "./rows";
import type { CountryFacts, DrivingSide, HourCycle, LatLon, MeasurementSystem, PaperSize, WeekStart } from "./types";

const WEEK_STARTS = ["mon", "sun", "sat", "fri"] as const;
const MEASUREMENTS = ["metric", "US", "UK"] as const;
const PAPERS = ["A4", "US-Letter"] as const;
const HOUR_CYCLES = ["h12", "h23"] as const;

const pointOf = (lat: unknown, lon: unknown): LatLon | null => (typeof lat === "number" && typeof lon === "number" ? Object.freeze({ lat, lon }) : null);
const numberOr = (value: unknown): number | null => (typeof value === "number" ? value : null);

const expandFacts = (row: FactsRow): CountryFacts => {
  const [alpha2, population, populationYear, area, areaYear, areaOf, lat, lon, capitalLat, capitalLon, borders, side, conventions] = row;
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
 * facts("JP")?.population;    // 123802000
 * facts("JP")?.populationYear; // 2024
 * facts("FR")?.borders;        // ["AD", "BE", "BR", "CH", "DE", "ES", "IT", "LU", "MC", "SR"]
 * facts("GB")?.drivingSide;    // "left"
 * facts("US")?.weekStart;      // "sun"
 * facts("XX");                 // null
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
 * Math.round(distanceKm(facts("JP")!.capitalPoint!, facts("GB")!.capitalPoint!)); // 9558
 * ```
 */
const distanceKm = (from: LatLon, to: LatLon): number => {
  const half = Math.sin(((to.lat - from.lat) * RADIANS) / 2) ** 2 + Math.cos(from.lat * RADIANS) * Math.cos(to.lat * RADIANS) * Math.sin(((to.lon - from.lon) * RADIANS) / 2) ** 2;

  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(half)));
};

export { allFacts, distanceKm, facts, FACTS_READ };
export type { CountryFacts, DrivingSide, HourCycle, LatLon, MeasurementSystem, PaperSize, WeekStart };
