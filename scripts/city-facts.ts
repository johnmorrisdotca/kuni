// What each city's record says about where it is on the clock and above the sea: its IANA time zone, and its elevation. For
// scripts/build-data.ts. The choices:
//
//   - Time zone, from IANA's zone.tab (public domain) and Wikidata's subdivision zones (CC0, in src/data/zones.data.ts), in
//     this order, and no other source (Natural Earth's TIMEZONE column is not used: NOTICE.md says why):
//       1. a country with one zone: that zone (`timeZoneEstimated` false);
//       2. the zone of the city's first-level subdivision where Wikidata names one zone for it alone (false);
//       3. the zone of a zone.tab city of the same country that the city is within NEAR_KM of, or is (Denver,
//          America/Denver) (false);
//       4. the zone kuni chose for the city's subdivision (src/zones.ts; true: it chose among Wikidata's, or the subdivision
//          is split between zones);
//       5. the zone of the nearest zone.tab city of the same country (true). Kuni has no boundaries, so a town near a zone's
//          edge can be given its neighbour's.
//   - Elevation: Wikidata's best-ranked P2044 values (CC0, scripts/fetch-city-elevations.ts), in metres as Wikidata
//     normalises them, kept to the whole metre. A city with one value has it. A city with several keeps them only when they
//     lie within ELEVATION_SPREAD metres of each other (the middle one); otherwise it has none, since a city whose values
//     differ by more than that is giving a range (a city on a slope) or has a mistaken value. Outside the range Earth's dry
//     land has (ELEVATION_MIN to ELEVATION_MAX) is a mistake and is left out. A value that is above sea level and more than
//     OUTLIER_METRES from the middle of the values of three or more cities within OUTLIER_KM , where they agree within OUTLIER_AGREE metres (not counting the highest and the lowest, where there are six or more), is a mistake and is left out (a town of Kentucky at 1,667 m); a value below sea level is never
//     left out (Jericho, Tiberias). Never made up, never from a model of the ground.

import type { CityRow } from "../src/city-rows.ts";

const NEAR_KM = 15;
const ELEVATION_SPREAD = 50;
const ELEVATION_MIN = -430;
const ELEVATION_MAX = 5500;
const OUTLIER_KM = 50;
const OUTLIER_METRES = 500;
const OUTLIER_AGREE = 150;
const OUTLIER_MINIMUM = 3;

// Cities whose zone none of the rules finds, set by id with the reason; each zone must be one zone.tab lists for the city's country,
// and each entry must be used.
const CITY_ZONES: Readonly<Record<string, { zone: string; why: string }>> = {
  Q22060342: { zone: "America/Eirunepe", why: "Tabatinga, Amazonas, on the Colombian border, keeps the western zone zone.tab lists as Eirunepe (UTC-5), not Manaus's" },
  Q6025: { zone: "Asia/Barnaul", why: "Gorno-Altaysk, the Altai Republic, keeps Barnaul's zone (UTC+7), the zone tzdb names for the Altai" },
  Q16562: { zone: "America/Denver", why: "El Paso, Texas, keeps Mountain time, the zone tzdb gives its county; the rest of Texas is Central" },
};

interface CityFact {
  zone: string | null;
  /** True where the zone is an estimate (see the top of this file). */
  guessed: boolean;
  /** Where the zone came from. */
  basis: "country" | "subdivision" | "named" | "near-city" | "subdivision-choice" | "nearest" | null;
  /** Metres above sea level, whole; null where there is none. */
  elevation: number | null;
}

interface SubdivisionZone {
  zone: string;
  /** True where kuni chose the zone (or the subdivision is split between zones), false where Wikidata names it alone. */
  guessed: boolean;
  /** True where the subdivision is known to lie in more than one zone (SPLIT_ZONES in scripts/facts-config.ts). */
  split: boolean;
  capital: [number, number] | null;
  middle: [number, number] | null;
}

interface CityFactsInput {
  rows: readonly CityRow[];
  /** Wikidata's best-ranked elevations, in metres, by item number. */
  elevations: ReadonlyMap<number, readonly number[]>;
  /** The zones zone.tab lists for a country (and the capital's, where zone.tab lists none). */
  countryZones: (alpha2: string) => readonly string[];
  /** The principal city of each zone, from zone.tab, by country. */
  principal: ReadonlyMap<string, readonly { zone: string; at: [number, number] }[]>;
  /** The zone of each first-level subdivision of a country with several zones. */
  subdivisionZones: ReadonlyMap<string, SubdivisionZone>;
  distanceKm: (a: [number, number], b: [number, number]) => number;
  /** Cities whose zone is set by id (CITY_ZONES in the build); none by default. */
  overrides?: Readonly<Record<string, { zone: string; why: string }>>;
}

interface CityFactsReport {
  cities: number;
  zoneOfOneZoneCountry: number;
  zoneOfSubdivision: number;
  /** Not estimated: within NEAR_KM of a zone.tab city's point, or that city. */
  zoneAtZoneTabCity: number;
  /** Not estimated: set by id in CITY_ZONES. */
  zoneNamed: number;
  zoneEstimated: number;
  /** Of the estimated: by the zone kuni chose for its subdivision (of which in a subdivision split between zones), and by the nearest zone.tab city, in a subdivision or in none. */
  zoneEstimatedBySubdivision: number;
  zoneEstimatedInSplitSubdivision: number;
  zoneEstimatedWithoutSubdivision: number;
  zoneNone: number;
  elevation: number;
  elevationManyValues: number;
  elevationDroppedSpread: number;
  elevationDroppedRange: number;
  elevationDroppedOutlier: number;
}

const idNumber = (id: number | string): number | null => (typeof id === "number" ? id : null);
const simple = (text: string): string => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const buildCityFacts = (input: CityFactsInput): { facts: Map<number | string, CityFact>; report: CityFactsReport } => {
  const facts = new Map<number | string, CityFact>();
  const report: CityFactsReport = {
    cities: input.rows.length,
    zoneOfOneZoneCountry: 0,
    zoneOfSubdivision: 0,
    zoneAtZoneTabCity: 0,
    zoneNamed: 0,
    zoneEstimated: 0,
    zoneEstimatedBySubdivision: 0,
    zoneEstimatedInSplitSubdivision: 0,
    zoneEstimatedWithoutSubdivision: 0,
    zoneNone: 0,
    elevation: 0,
    elevationManyValues: 0,
    elevationDroppedSpread: 0,
    elevationDroppedRange: 0,
    elevationDroppedOutlier: 0,
  };
  const overrides = input.overrides ?? {};
  const usedOverrides = new Set<string>();
  // The elevation each city has before the neighbours are asked, by place in rows.
  const candidates: (number | null)[] = [];
  for (const row of input.rows) {
    const id = row[0];
    const country = row[5];
    const point: [number, number] = [row[1], row[2]];
    const zones = input.countryZones(country);
    let zone: string | null = null;
    let guessed = false;
    let basis: CityFact["basis"] = null;
    const own = row[6] === null ? undefined : input.subdivisionZones.get(row[6]);
    const named = typeof id === "number" ? overrides[`Q${id}`] : undefined;
    if (named !== undefined) {
      if (!zones.includes(named.zone)) throw new Error(`CITY_ZONES: ${named.zone} is no zone of ${country} (${row[7]})`);
      usedOverrides.add(`Q${id}`);
      zone = named.zone;
      basis = "named";
      report.zoneNamed += 1;
    } else if (zones.length === 0) {
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
      let best = Infinity;
      let nearest: string | null = null;
      let isNamed = false;
      for (const one of input.principal.get(country) ?? []) {
        const km = input.distanceKm(point, one.at);
        if (km < best) {
          best = km;
          nearest = one.zone;
          // The zone's named city: America/Denver is Denver.
          const city = simple(one.zone.slice(one.zone.lastIndexOf("/") + 1));
          isNamed = [row[7], row[9]].some((name) => name !== null && simple(name) === city);
        }
      }
      if (nearest !== null && (best <= NEAR_KM || isNamed)) {
        zone = nearest;
        basis = "near-city";
        report.zoneAtZoneTabCity += 1;
      } else if (own !== undefined) {
        zone = own.zone;
        guessed = true;
        basis = "subdivision-choice";
        report.zoneEstimated += 1;
        report.zoneEstimatedBySubdivision += 1;
        if (own.split) report.zoneEstimatedInSplitSubdivision += 1;
      } else {
        zone = nearest;
        guessed = true;
        basis = "nearest";
        report.zoneEstimated += 1;
        report.zoneEstimatedWithoutSubdivision += 1;
      }
    }
    let elevation: number | null = null;
    const item = idNumber(id);
    const values = item === null ? undefined : input.elevations.get(item);
    if (values !== undefined && values.length > 0) {
      const sorted = [...values].sort((a, b) => a - b);
      if (sorted.length > 1) report.elevationManyValues += 1;
      if (sorted[sorted.length - 1]! - sorted[0]! > ELEVATION_SPREAD) {
        report.elevationDroppedSpread += 1;
      } else {
        const middle = Math.round(sorted[Math.floor((sorted.length - 1) / 2)]!);
        if (middle < ELEVATION_MIN || middle > ELEVATION_MAX) report.elevationDroppedRange += 1;
        else elevation = middle === 0 ? 0 : middle;
      }
    }
    candidates.push(elevation);
    facts.set(id, { zone, guessed, basis, elevation });
  }
  for (const id of Object.keys(overrides)) if (!usedOverrides.has(id)) throw new Error(`CITY_ZONES names ${id}, which is no city`);
  // A value far from the cities round it, where those agree with one another, is a mistake.
  const cell = (lat: number, lon: number): string => `${Math.floor(lat)},${Math.floor(((lon % 360) + 540) % 360)}`;
  // A cell is a degree wide, so 100 km round a city is at most the cells next to its own, except near the poles (where it can miss a few).
  const grid = new Map<string, number[]>();
  input.rows.forEach((row, at) => {
    if (candidates[at] === null) return;
    const key = cell(row[1], row[2]);
    grid.set(key, [...(grid.get(key) ?? []), at]);
  });
  input.rows.forEach((row, at) => {
    const own = candidates[at];
    if (own === null || own === undefined) return;
    if (own > 0) {
      // The elevations of the cities round it, within OUTLIER_KM.
      const near: { km: number; metres: number }[] = [];
      for (let dLat = -1; dLat <= 1; dLat += 1) {
        for (let dLon = -1; dLon <= 1; dLon += 1) {
          for (const other of grid.get(cell(row[1] + dLat, row[2] + dLon)) ?? []) {
            if (other === at) continue;
            const there = input.rows[other]!;
            const km = input.distanceKm([row[1], row[2]], [there[1], there[2]]);
            if (km <= OUTLIER_KM) near.push({ km, metres: candidates[other]! });
          }
        }
      }
      const round = near.map((one) => one.metres);
      if (round.length >= OUTLIER_MINIMUM) {
        round.sort((a, b) => a - b);
        const middle = round[Math.floor((round.length - 1) / 2)]!;
        // They must agree with one another: within OUTLIER_AGREE metres, not counting the highest and the lowest where there are
        // six or more (one of them may be a bad value too).
        const trimmed = round.length >= 6 ? round.slice(1, -1) : round;
        if (trimmed[trimmed.length - 1]! - trimmed[0]! <= OUTLIER_AGREE && Math.abs(own - middle) > OUTLIER_METRES) {
          report.elevationDroppedOutlier += 1;
          facts.get(row[0])!.elevation = null;
          return;
        }
      }
    }
    report.elevation += 1;
  });

  return { facts, report };
};

export { buildCityFacts, CITY_ZONES, ELEVATION_MAX, ELEVATION_MIN, ELEVATION_SPREAD, NEAR_KM, OUTLIER_AGREE, OUTLIER_KM, OUTLIER_METRES, OUTLIER_MINIMUM };
export type { CityFact, CityFactsInput, CityFactsReport, SubdivisionZone };
