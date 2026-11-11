// The entry @johnmorrisdotca/kuni/cities: the way to ask questions of the world's cities, with no city data of its own.
// The cities come in four tiers, each its own entry so that a page pays only for what it uses: /cities/capitals,
// /cities/1m, /cities/100k and /cities/15k. A tier is a slice, not a bigger list: a city is in the first of these that
// holds it (a capital of any size, then by population), so the tiers are joined with `citySet`, or loaded and joined
// with `loadCities`. docs/cities.md says where each fact comes from and how many cities each tier holds.

import { isCountryCode } from "./codes";
import type { City, CitySource } from "./city-rows";
import { CITY_ALIASES } from "./data/city-aliases.data";
import { CITY_LOADERS } from "./data/city-loaders.data";
import type { LatLon } from "./types";

/** The four tiers, smallest first: `capitals` (every capital, of a country or a subdivision, of any size), `1m` (the other cities of a million people or more), `100k` (the others of 100,000 or more) and `15k` (the others of 15,000 or more). A city is in one tier only.
 *
 * @example
 * ```ts
 * import type { CityTier } from "@johnmorrisdotca/kuni/cities";
 *
 * const value: CityTier = "1m";
 * console.log(value);
 * ```
 */
type CityTier = "capitals" | "1m" | "100k" | "15k";

/**
 * The names of the four tiers, in the order of their size.
 *
 * @example
 * ```ts
 * import { CITY_TIERS } from "@johnmorrisdotca/kuni/cities";
 *
 * console.log(CITY_TIERS.join(" "));  // "capitals 1m 100k 15k"
 * ```
 */
const CITY_TIERS: readonly CityTier[] = Object.freeze(["capitals", "1m", "100k", "15k"] as const);

/**
 * What `nearest` and `within` may be asked.
 *
 * @example
 * ```ts
 * import type { NearestOptions } from "@johnmorrisdotca/kuni/cities";
 *
 * const value: NearestOptions = { maxKm: 100, minPopulation: 100000 };
 * console.log(Object.keys(value).join(" "));
 * ```
 */
interface NearestOptions {
  /** Ignore cities further than this many kilometres; none by default. */
  maxKm?: number;
  /** Ignore cities of fewer people, and those with no figure; none by default. */
  minPopulation?: number;
  /** Look only in this country, an ISO 3166-1 alpha-2 code in either case. */
  country?: string;
}

/**
 * A city and how far it is from the point asked about.
 *
 * @example
 * ```ts
 * import type { CityAt } from "@johnmorrisdotca/kuni/cities";
 *
 * const value: CityAt | null = null;
 * console.log(value);
 * ```
 */
interface CityAt {
  /** The city that was found. */
  city: City;
  /** The great-circle distance to it, in kilometres, on a sphere of the earth's mean radius (6,371 km). */
  km: number;
}

/**
 * Cities joined for lookups: by id, by country, by subdivision and by nearness. Built by `citySet`.
 *
 * @example
 * ```ts
 * import type { CitySet } from "@johnmorrisdotca/kuni/cities";
 * import { citySet } from "@johnmorrisdotca/kuni/cities";
 *
 * const set: CitySet = citySet([]);
 * console.log(set.cities.length);  // 0
 * ```
 */
interface CitySet {
  /** Every city in the set, in the order the lists were given, a city once. */
  readonly cities: readonly City[];
  /** The city with an id, "Q1490" (in either case); an id that was merged into another city, or whose item Wikidata gave another id, answers with the city it became; `null` when the set has none. */
  byId(id: string): City | null;
  /** The cities of one country, by its ISO 3166-1 alpha-2 code in either case, in the set's order. */
  inCountry(code: string): readonly City[];
  /** The cities of one first-level subdivision, by its ISO 3166-2 code in either case ("JP-13"). */
  inSubdivision(code: string): readonly City[];
  /** The city nearest to a point, with the distance; `null` when the set has none that the options allow. */
  nearest(point: LatLon, options?: NearestOptions): CityAt | null;
  /** Every city within a distance of a point, nearest first. */
  within(point: LatLon, km: number, options?: NearestOptions): readonly CityAt[];
}

const EARTH_KM = 6371.0088;
const RADIANS = Math.PI / 180;
const EMPTY: readonly City[] = Object.freeze([]);

const unit = (lat: number, lon: number): [number, number, number] => {
  const cosine = Math.cos(lat * RADIANS);

  return [cosine * Math.cos(lon * RADIANS), cosine * Math.sin(lon * RADIANS), Math.sin(lat * RADIANS)];
};

// The great-circle distance between the unit vectors of two points, from the angle between them.
const kmBetween = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
  const cross = Math.hypot(a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!);
  const dot = a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;

  return EARTH_KM * Math.atan2(cross, dot);
};

const isPoint = (point: LatLon): boolean => typeof point === "object" && point !== null && Number.isFinite(point.lat) && Number.isFinite(point.lon) && Math.abs(point.lat) <= 90;

/**
 * Joins lists of cities (a tier's list, or several) into one set with the lookups built once. A city that is in
 * more than one list is kept once, the first.
 *
 * @param lists - Lists of cities, such as `capitalCities()` and `cities1m()`.
 * @returns The set, with `byId`, `inCountry`, `inSubdivision`, `nearest` and `within`; nothing in it can be changed.
 * @example
 * ```ts
 * import { citySet } from "@johnmorrisdotca/kuni/cities";
 * import { capitalCities } from "@johnmorrisdotca/kuni/cities/capitals";
 *
 * const capitals = citySet(capitalCities());
 * console.log(capitals.byId("Q1490")?.country);                           // "JP"
 * console.log(capitals.inCountry("fr").some((one) => one.name.en === "Paris")); // true
 * console.log(capitals.nearest({ lat: 48.85, lon: 2.35 })?.city.name.en);   // "Paris"
 * console.log(capitals.byId("Q0"));                                        // null
 * ```
 */
const citySet = (...lists: readonly (readonly City[])[]): CitySet => {
  const seen = new Set<string>();
  const cities: City[] = [];
  for (const list of lists) {
    for (const city of list) {
      if (seen.has(city.id)) continue;
      seen.add(city.id);
      cities.push(city);
    }
  }
  const ids = new Map(cities.map((city) => [city.id, city]));
  const group = (key: (city: City) => string | null): Map<string, City[]> => {
    const groups = new Map<string, City[]>();
    for (const city of cities) {
      const name = key(city);
      if (name !== null) groups.set(name, [...(groups.get(name) ?? []), city]);
    }

    return groups;
  };
  const countries = group((city) => city.country);
  const subdivisions = group((city) => city.subdivision);
  // The unit vectors of every city, laid out flat, so that a search is a pass over one array.
  const vectors = new Float64Array(cities.length * 3);
  cities.forEach((city, at) => vectors.set(unit(city.lat, city.lon), at * 3));

  const search = (point: LatLon, options: NearestOptions | undefined, limit: number): CityAt[] => {
    if (!isPoint(point)) return [];
    const here = unit(point.lat, point.lon);
    const country = typeof options?.country === "string" ? options.country.trim().toUpperCase() : null;
    const maxKm = options?.maxKm ?? Infinity;
    const minPopulation = options?.minPopulation ?? 0;
    const found: CityAt[] = [];
    for (let at = 0; at < cities.length; at += 1) {
      const city = cities[at]!;
      if (country !== null && city.country !== country) continue;
      if (minPopulation > 0 && (city.population ?? 0) < minPopulation) continue;
      const km = kmBetween(here, vectors.subarray(at * 3, at * 3 + 3));
      if (km > maxKm) continue;
      found.push({ city, km });
    }
    found.sort((a, b) => a.km - b.km);

    return limit < found.length ? found.slice(0, limit) : found;
  };

  return Object.freeze({
    cities: Object.freeze(cities),
    byId: (id: string) => {
      if (typeof id !== "string") return null;
      const key = id.trim().replace(/^NE:/i, "ne:").replace(/^q/, "Q");

      return ids.get(key) ?? ids.get(CITY_ALIASES[key] ?? "") ?? null;
    },
    inCountry: (code: string) => (typeof code === "string" ? (countries.get(code.trim().toUpperCase()) ?? EMPTY) : EMPTY),
    inSubdivision: (code: string) => (typeof code === "string" ? (subdivisions.get(code.trim().toUpperCase()) ?? EMPTY) : EMPTY),
    nearest: (point: LatLon, options?: NearestOptions) => search(point, options, 1)[0] ?? null,
    within: (point: LatLon, km: number, options?: NearestOptions) => Object.freeze(search(point, { ...options, maxKm: Math.min(km, options?.maxKm ?? Infinity) }, Infinity)),
  } satisfies CitySet);
};

const TIER_LOADERS: Readonly<Record<CityTier, () => Promise<readonly City[]>>> = {
  capitals: async () => (await import("./cities/capitals.js")).capitalCities(),
  "1m": async () => (await import("./cities/1m.js")).cities1m(),
  "100k": async () => (await import("./cities/100k.js")).cities100k(),
  "15k": async () => (await import("./cities/15k.js")).cities15k(),
};

/**
 * The cities of the tiers asked for, fetched with a dynamic import (a bundler makes a chunk of each tier) and joined
 * into one set. A page that shows the capitals first and the great cities when it is zoomed in awaits each when it
 * needs it.
 *
 * @param tiers - The tiers wanted, `"capitals"`, `"1m"`, `"100k"` or `"15k"`; none gives an empty set.
 * @returns The set, as `citySet` makes it; a name that is not a tier throws a `RangeError`.
 * @example
 * ```ts
 * import { loadCities } from "@johnmorrisdotca/kuni/cities";
 *
 * const world = await loadCities("capitals", "1m");
 * console.log(world.nearest({ lat: 35.68, lon: 139.69 })?.city.country); // "JP"
 * console.log((await loadCities()).cities.length);                       // 0
 * ```
 */
const loadCities = async (...tiers: readonly CityTier[]): Promise<CitySet> => {
  for (const tier of tiers) if (!CITY_TIERS.includes(tier)) throw new RangeError(`"${String(tier)}" is not a tier of cities: ${CITY_TIERS.join(", ")}`);
  const lists = await Promise.all([...new Set(tiers)].map(async (tier) => await TIER_LOADERS[tier]()));

  return citySet(...lists);
};

/**
 * One country's cities, every tier together, the most populous first: the same list as
 * @johnmorrisdotca/kuni/cities/<code>, fetched with a dynamic import when it is asked for, so a page that has just
 * been given a country loads exactly this and nothing of any other country.
 *
 * @param countryCode - An ISO 3166-1 alpha-2 code, in either case.
 * @returns The list, frozen; an empty list for a country with no city in the data; `null` for a code that is not a country.
 * @example
 * ```ts
 * import { citiesOf } from "@johnmorrisdotca/kuni/cities";
 *
 * const japan = await citiesOf("jp");
 * console.log(japan?.[0].country);          // "JP"
 * console.log(japan?.some((one) => one.capital === "national")); // true
 * console.log(await citiesOf("XX")); // null
 * ```
 */
const citiesOf = async (countryCode: string): Promise<readonly City[] | null> => {
  const code = typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";
  if (!isCountryCode(code)) return null;
  const loader = CITY_LOADERS[code.toLowerCase()];
  if (loader === undefined) return EMPTY;

  return (await loader()).CITIES;
};

/**
 * One city, by its id: a Wikidata item ("Q90") or "ne:<number>", in either case; an id that was merged into another
 * city answers with the city it became. The tiers are loaded one at a time, the capitals first, until the city is
 * found, so an id of a great city loads little and an id that is nobody's loads every tier; where the country is
 * known, `citiesOf(country)` and `citySet(...).byId` are cheaper.
 *
 * @param id - The city's id.
 * @returns The city, frozen; `null` where no tier has it.
 * @example
 * ```ts
 * import { cityById } from "@johnmorrisdotca/kuni/cities";
 *
 * const paris = await cityById("Q90");
 * console.log(paris?.name.en);       // "Paris"
 * console.log(paris?.continent);     // "EU"
 * console.log(await cityById("Q0")); // null
 * ```
 */
const cityById = async (id: string): Promise<City | null> => {
  if (typeof id !== "string") return null;
  const key = id.trim().replace(/^NE:/i, "ne:").replace(/^q/, "Q");
  const wanted = CITY_ALIASES[key] ?? key;
  for (const tier of CITY_TIERS) {
    const found = (await TIER_LOADERS[tier]()).find((city) => city.id === wanted);
    if (found !== undefined) return found;
  }

  return null;
};

export { CITY_TIERS, citiesOf, citySet, cityById, loadCities };
export type { City, CityAt, CitySet, CitySource, CityTier, NearestOptions };
