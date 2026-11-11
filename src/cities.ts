// The entry @johnmorrisdotca/kuni/cities: the way to ask questions of the world's cities, with no city data of its own.
// The cities come in tiers, each loaded only when it is asked for: /cities/capitals (every capital, of any size), /cities/1m
// and /cities/100k (every city of a million, and of 100,000 or more, capitals too), and the 15k tier (15,000 or more), which
// has no file of its own and is made by `loadCities("15k")` from the countries' files, /cities/<code>. Tiers overlap (a capital
// of a million people is in two), so they are joined with `citySet`, which keeps a city once, or loaded and joined with
// `loadCities`. docs/cities.md says where each fact comes from and how many cities each tier holds.

import { isCountryCode } from "./codes";
import type { City, CitySource } from "./city-rows";
import { rankingPopulation } from "./rank";
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
const EMPTY_AT: readonly CityAt[] = Object.freeze([]);

// An id as it is kept ("Q90", "ne:123"), whatever case or spaces it came in; null for what is not text.
const normalId = (id: string): string | null => (typeof id === "string" ? id.trim().replace(/^NE:/i, "ne:").replace(/^q/, "Q") : null);

const unit = (lat: number, lon: number): [number, number, number] => {
  const cosine = Math.cos(lat * RADIANS);

  return [cosine * Math.cos(lon * RADIANS), cosine * Math.sin(lon * RADIANS), Math.sin(lat * RADIANS)];
};

// The great-circle distance between a point's unit vector and the unit vector kept at an offset of a flat array, from the angle between them.
const kmAt = (here: readonly number[], vectors: Float64Array, offset: number): number => {
  const x = vectors[offset]!;
  const y = vectors[offset + 1]!;
  const z = vectors[offset + 2]!;
  const cross = Math.hypot(here[1]! * z - here[2]! * y, here[2]! * x - here[0]! * z, here[0]! * y - here[1]! * x);

  return EARTH_KM * Math.atan2(cross, here[0]! * x + here[1]! * y + here[2]! * z);
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
  const ids = new Map<string, City>();
  const countries = new Map<string, City[]>();
  const subdivisions = new Map<string, City[]>();
  const add = (groups: Map<string, City[]>, key: string | null, city: City): void => {
    if (key === null) return;
    const list = groups.get(key);
    if (list === undefined) groups.set(key, [city]);
    else list.push(city);
  };
  for (const city of cities) {
    ids.set(city.id, city);
    add(countries, city.country, city);
    add(subdivisions, city.subdivision, city);
  }
  // The unit vectors of every city, laid out flat, so that a search is one pass over one array.
  const vectors = new Float64Array(cities.length * 3);
  cities.forEach((city, at) => vectors.set(unit(city.lat, city.lon), at * 3));

  // The cities a search may look at: the country and the population options; the distance is the search's own.
  const allowed = (city: City, country: string | null, minPopulation: number): boolean => (country === null || city.country === country) && (minPopulation <= 0 || (city.population ?? 0) >= minPopulation);
  const countryOf = (options: NearestOptions | undefined): string | null => (typeof options?.country === "string" ? options.country.trim().toUpperCase() : null);
  const populationOf = (options: NearestOptions | undefined): number => (Number.isFinite(options?.minPopulation) ? options!.minPopulation! : 0);

  const nearest = (point: LatLon, options?: NearestOptions): CityAt | null => {
    if (!isPoint(point)) return null;
    const here = unit(point.lat, point.lon);
    const country = countryOf(options);
    const minPopulation = populationOf(options);
    const maxKm = Number.isFinite(options?.maxKm) ? options!.maxKm! : Infinity;
    // The nearest has the largest dot product with the point: one pass, nothing kept but the best.
    let best = -Infinity;
    let at = -1;
    for (let index = 0; index < cities.length; index += 1) {
      const offset = index * 3;
      const dot = here[0]! * vectors[offset]! + here[1]! * vectors[offset + 1]! + here[2]! * vectors[offset + 2]!;
      if (dot > best && allowed(cities[index]!, country, minPopulation)) {
        best = dot;
        at = index;
      }
    }
    if (at < 0) return null;
    const km = kmAt(here, vectors, at * 3);

    return km > maxKm ? null : { city: cities[at]!, km };
  };

  const within = (point: LatLon, km: number, options?: NearestOptions): readonly CityAt[] => {
    if (!isPoint(point) || !(km >= 0)) return EMPTY_AT;
    const here = unit(point.lat, point.lon);
    const country = countryOf(options);
    const minPopulation = populationOf(options);
    const limit = Math.min(km, Number.isFinite(options?.maxKm) ? options!.maxKm! : Infinity);
    const least = Math.cos(Math.min(limit / EARTH_KM, Math.PI));
    const found: CityAt[] = [];
    for (let index = 0; index < cities.length; index += 1) {
      const offset = index * 3;
      const dot = here[0]! * vectors[offset]! + here[1]! * vectors[offset + 1]! + here[2]! * vectors[offset + 2]!;
      if (dot < least - 1e-12 || !allowed(cities[index]!, country, minPopulation)) continue;
      const away = kmAt(here, vectors, offset);
      if (away <= limit) found.push({ city: cities[index]!, km: away });
    }
    found.sort((a, b) => a.km - b.km);

    return Object.freeze(found);
  };

  return Object.freeze({
    cities: Object.freeze(cities),
    byId: (id: string) => {
      const key = normalId(id);

      return key === null ? null : (ids.get(CITY_ALIASES[key] ?? key) ?? null);
    },
    inCountry: (code: string) => (typeof code === "string" ? (countries.get(code.trim().toUpperCase()) ?? EMPTY) : EMPTY),
    inSubdivision: (code: string) => (typeof code === "string" ? (subdivisions.get(code.trim().toUpperCase()) ?? EMPTY) : EMPTY),
    nearest,
    within,
  } satisfies CitySet);
};

// The cities of a range of population from the countries' own files: all of them are fetched, as the tier has no file of its own.
const fromCountries = async (least: number, below: number): Promise<readonly City[]> => {
  const lists = await Promise.all(Object.values(CITY_LOADERS).map(async (load) => (await load()).CITIES));

  return Object.freeze(lists.flatMap((list) => list.filter((city) => (city.population ?? 0) >= least && (city.population ?? 0) < below)).sort((a, b) => rankingPopulation(b) - rankingPopulation(a) || (a.id < b.id ? -1 : 1)));
};

const TIER_LOADERS: Readonly<Record<CityTier, () => Promise<readonly City[]>>> = {
  capitals: async () => (await import("./cities/capitals.js")).capitalCities(),
  "1m": async () => (await import("./cities/1m.js")).cities1m(),
  "100k": async () => (await import("./cities/100k.js")).cities100k(),
  "15k": () => fromCountries(15000, 100000),
};

/**
 * The cities of the tiers asked for, fetched with a dynamic import (a bundler makes a chunk of each tier) and joined
 * into one set. A page that shows the capitals first and the great cities when it is zoomed in awaits each when it
 * needs it. `capitals`, `1m` and `100k` are files of their own; `15k` is made from the countries' own files (all of them
 * are fetched), so it is the dearest.
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
 * city answers with the city it became. The capitals, 1m and 100k tiers are loaded one at a time until the city is
 * found; a smaller city is looked up in a small index of which country each is in, and only that country's file is
 * fetched. An id that is nobody's loads the three tiers and the index, never every country.
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
  const key = normalId(id)!;
  const wanted = CITY_ALIASES[key] ?? key;
  for (const tier of ["capitals", "1m", "100k"] as const) {
    const found = (await TIER_LOADERS[tier]()).find((city) => city.id === wanted);
    if (found !== undefined) return found;
  }
  const country = await countryOfSmallCity(wanted);
  if (country === null) return null;

  return (await citiesOf(country))?.find((city) => city.id === wanted) ?? null;
};

// The country of each city no tier file holds, read from its index the first time a small city is asked for.
let smallCities: ReadonlyMap<string, string> | null = null;
const countryOfSmallCity = async (id: string): Promise<string | null> => {
  if (smallCities === null) {
    const { CITY_INDEX } = await import("./cities/where.js");
    const index = new Map<string, string>();
    for (const [code, list] of Object.entries(CITY_INDEX)) {
      let number = 0;
      for (const part of list.split(",")) {
        if (part === "") continue;
        if (part.startsWith("~")) index.set(`ne:${Number.parseInt(part.slice(1), 36)}`, code.toUpperCase());
        else {
          number += Number.parseInt(part, 36);
          index.set(`Q${number}`, code.toUpperCase());
        }
      }
    }
    smallCities = index;
  }

  return smallCities.get(id) ?? null;
};

export { CITY_TIERS, citiesOf, citySet, cityById, loadCities };
export type { City, CityAt, CitySet, CitySource, CityTier, NearestOptions };
