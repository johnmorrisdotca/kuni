// What each city's record says about where it is on the clock and above the sea: its IANA time zone, and its elevation. For
// scripts/build-data.ts. The choices:
//
//   - Time zone, first choice: Natural Earth's TIMEZONE for the place (public domain; scripts/fetch-city-zones.ts), when it
//     is a zone IANA's zone.tab lists for the city's country, after the renames below (Natural Earth still writes some zones
//     by the names tzdb has since made links: Asia/Rangoon, Europe/Kiev). A zone that is not the country's is not used (the
//     build lists them).
//   - Second, in a country with one zone, that zone; and in a country with several, the zone of the city's first-level
//     subdivision when that is not an estimate (src/zones.ts: Wikidata names the one zone the subdivision is in). Both are
//     what the sources say, so `timeZoneEstimated` is false.
//   - Last, an estimate (`timeZoneEstimated` true): the zone of the nearest city of the same subdivision that has Natural Earth's
//     zone, within NEIGHBOUR_KM; else the zone whose principal city in zone.tab is within 30 km; else the zone of the
//     subdivision (the one src/zones.ts chose); else the zone of the nearest subdivision's capital or middle, as `timeZoneAt`
//     in /zones does. Wherever a boundary or a carve-out is not known, it can be wrong. scripts/build-data.ts checks each
//     estimate against Natural Earth's own zone for the cities that have one, and docs/cities.md says how often it agrees.
//   - Elevation: Wikidata's best-ranked P2044 values (CC0, scripts/fetch-city-elevations.ts), in metres as Wikidata
//     normalises them, kept to the whole metre. A city with one value has it. A city with several keeps them only when they
//     lie within ELEVATION_SPREAD metres of each other (the middle one); otherwise it has none, since a city whose values
//     differ by more than that is giving a range (a city on a slope) or has a mistaken value. Outside the range Earth's dry
//     land has (ELEVATION_MIN to ELEVATION_MAX) is a mistake and is left out. Never made up, never from a model of the ground.

import type { CityRow } from "../src/city-rows.ts";

/** Natural Earth zones that are the same place under the name tzdb gives now, and why. */
const NE_ZONE_RENAMES: Readonly<Record<string, string>> = {
  "Asia/Chongqing": "Asia/Shanghai", // a link to Asia/Shanghai since tzdb 2014
  "Asia/Harbin": "Asia/Shanghai",
  "Asia/Kashgar": "Asia/Urumqi",
  "Asia/Rangoon": "Asia/Yangon",
  "America/Montreal": "America/Toronto",
  "America/Nipigon": "America/Toronto",
  "America/Yellowknife": "America/Edmonton",
  "America/Godthab": "America/Nuuk",
  "Europe/Kiev": "Europe/Kyiv",
  "Europe/Uzhgorod": "Europe/Kyiv",
  "Europe/Zaporozhye": "Europe/Kyiv",
  "Africa/Khartoum": "Africa/Juba", // for a city of South Sudan; a city of Sudan keeps Khartoum, which is tried first
};

const ELEVATION_SPREAD = 50;
const ELEVATION_MIN = -430;
const ELEVATION_MAX = 5500;

interface CityFact {
  zone: string | null;
  /** True where the zone is an estimate (see the top of this file). */
  guessed: boolean;
  /** Where the zone came from. */
  basis: "natural-earth" | "country" | "subdivision" | "neighbour" | "near-city" | "subdivision-estimate" | "nearest" | null;
  /** Metres above sea level, whole; null where there is none. */
  elevation: number | null;
}

interface SubdivisionZone {
  zone: string;
  guessed: boolean;
  capital: [number, number] | null;
  middle: [number, number] | null;
}

interface CityFactsInput {
  rows: readonly CityRow[];
  /** Natural Earth's TIMEZONE by NE_ID. */
  neZones: ReadonlyMap<number, string>;
  /** The NE_ID of the Natural Earth place that names each Wikidata item (by item number). */
  neIds: ReadonlyMap<number, number>;
  /** Wikidata's best-ranked elevations, in metres, by item number. */
  elevations: ReadonlyMap<number, readonly number[]>;
  /** The zones zone.tab lists for a country (and the capital's, where zone.tab lists none). */
  countryZones: (alpha2: string) => readonly string[];
  /** The principal city of each zone, from zone.tab, by country. */
  principal: ReadonlyMap<string, readonly { zone: string; at: [number, number] }[]>;
  /** The zone of each first-level subdivision of a country with several zones. */
  subdivisionZones: ReadonlyMap<string, SubdivisionZone>;
  distanceKm: (a: [number, number], b: [number, number]) => number;
  /** For the check of the estimate: do not use a city's own Natural Earth zone for it (its neighbours' are still used). */
  ignoreOwnZone?: boolean;
}

interface CityFactsReport {
  cities: number;
  zoneFromNaturalEarth: number;
  zoneOfOneZoneCountry: number;
  zoneOfSubdivision: number;
  zoneEstimated: number;
  zoneNone: number;
  naturalEarthZonesDropped: Map<string, number>;
  elevation: number;
  elevationManyValues: number;
  elevationDroppedSpread: number;
  elevationDroppedRange: number;
  /** For the cities that have a Natural Earth zone: how often the estimate made without it, by how it was made, gives that zone. */
  estimateChecks: Map<string, { checked: number; agreed: number; sameClock: number }>;
}

const idNumber = (id: number | string): number | null => (typeof id === "number" ? id : null);

// How near the nearest city with a zone of Natural Earth's must be, in the same subdivision, to give its zone to another.
const NEIGHBOUR_KM = 150;

const buildCityFacts = (input: CityFactsInput): { facts: Map<number | string, CityFact>; report: CityFactsReport } => {
  const facts = new Map<number | string, CityFact>();
  // Each city whose zone Natural Earth gives and the country has, by country: the neighbours an estimate may borrow from.
  const neZoneOf = (row: CityRow): string | undefined => {
    const item = idNumber(row[0]);
    const neId = item === null ? Number((row[0] as string).slice(3)) : (input.neIds.get(item) ?? null);
    const given = neId === null ? undefined : input.neZones.get(neId);
    const zones = input.countryZones(row[5]);

    return given === undefined ? undefined : [given, NE_ZONE_RENAMES[given]].find((one) => one !== undefined && zones.includes(one));
  };
  const neighbours = new Map<string, { id: number | string; at: [number, number]; zone: string; subdivision: string | null }[]>();
  for (const row of input.rows) {
    const zone = neZoneOf(row);
    if (zone !== undefined) neighbours.set(row[5], [...(neighbours.get(row[5]) ?? []), { id: row[0], at: [row[1], row[2]], zone, subdivision: row[6] }]);
  }
  const report: CityFactsReport = {
    cities: input.rows.length,
    zoneFromNaturalEarth: 0,
    zoneOfOneZoneCountry: 0,
    zoneOfSubdivision: 0,
    zoneEstimated: 0,
    zoneNone: 0,
    naturalEarthZonesDropped: new Map(),
    elevation: 0,
    elevationManyValues: 0,
    elevationDroppedSpread: 0,
    elevationDroppedRange: 0,
    estimateChecks: new Map(),
  };
  for (const row of input.rows) {
    const id = row[0];
    const country = row[5];
    const point: [number, number] = [row[1], row[2]];
    const zones = input.countryZones(country);
    const item = idNumber(id);
    const neId = item === null ? Number((id as string).slice(3)) : (input.neIds.get(item) ?? null);
    const given = neId === null || input.ignoreOwnZone === true ? undefined : input.neZones.get(neId);
    const named = given === undefined ? undefined : [given, NE_ZONE_RENAMES[given]].find((one) => one !== undefined && zones.includes(one));
    let zone: string | null = null;
    let guessed = false;
    let basis: CityFact["basis"] = null;
    if (named !== undefined && zones.includes(named)) {
      zone = named;
      basis = "natural-earth";
      report.zoneFromNaturalEarth += 1;
    } else {
      if (given !== undefined) report.naturalEarthZonesDropped.set(`${country} ${given}`, (report.naturalEarthZonesDropped.get(`${country} ${given}`) ?? 0) + 1);
      const own = row[6] === null ? undefined : input.subdivisionZones.get(row[6]);
      if (zones.length === 0) {
        report.zoneNone += 1;
      } else if (zones.length === 1) {
        zone = zones[0]!;
        basis = "country";
        report.zoneOfOneZoneCountry += 1;
      } else if (own !== undefined && !own.guessed) {
        zone = own.zone;
        basis = "subdivision";
        report.zoneOfSubdivision += 1;
      } else {
        guessed = true;
        report.zoneEstimated += 1;
        // The nearest city in the same subdivision that has a zone of Natural Earth's, within NEIGHBOUR_KM.
        let neighbour: { zone: string } | null = null;
        let nearestKm = NEIGHBOUR_KM;
        for (const other of neighbours.get(country) ?? []) {
          if (other.id === id || other.subdivision !== row[6]) continue;
          const km = input.distanceKm(point, other.at);
          if (km <= nearestKm) {
            nearestKm = km;
            neighbour = other;
          }
        }
        const near = (input.principal.get(country) ?? []).find((one) => input.distanceKm(point, one.at) <= 30);
        if (neighbour !== null) {
          zone = neighbour.zone;
          basis = "neighbour";
        } else if (near !== undefined) {
          zone = near.zone;
          basis = "near-city";
        } else if (own !== undefined) {
          zone = own.zone;
          basis = "subdivision-estimate";
        } else {
          basis = "nearest";
          let best = Infinity;
          for (const [code, candidate] of input.subdivisionZones) {
            if (!code.startsWith(`${country}-`)) continue;
            for (const at of [candidate.capital, candidate.middle]) {
              if (at === null) continue;
              const km = input.distanceKm(point, at);
              if (km < best) {
                best = km;
                zone = candidate.zone;
              }
            }
          }
          if (zone === null) {
            for (const one of input.principal.get(country) ?? []) {
              const km = input.distanceKm(point, one.at);
              if (km < best) {
                best = km;
                zone = one.zone;
              }
            }
          }
        }
      }
    }
    let elevation: number | null = null;
    const values = item === null ? undefined : input.elevations.get(item);
    if (values !== undefined && values.length > 0) {
      const sorted = [...values].sort((a, b) => a - b);
      if (sorted.length > 1) report.elevationManyValues += 1;
      if (sorted[sorted.length - 1]! - sorted[0]! > ELEVATION_SPREAD) {
        report.elevationDroppedSpread += 1;
      } else {
        const middle = Math.round(sorted[Math.floor((sorted.length - 1) / 2)]!);
        if (middle < ELEVATION_MIN || middle > ELEVATION_MAX) report.elevationDroppedRange += 1;
        else {
          elevation = middle === 0 ? 0 : middle;
          report.elevation += 1;
        }
      }
    }
    facts.set(id, { zone, guessed, basis, elevation });
  }

  return { facts, report };
};

export { buildCityFacts, ELEVATION_MAX, ELEVATION_MIN, ELEVATION_SPREAD, NE_ZONE_RENAMES, NEIGHBOUR_KM };
export type { CityFact, CityFactsInput, CityFactsReport, SubdivisionZone };
