import { describe, expect, it } from "vitest";

import { CITY_TIERS, citiesOf, citySet, cityById, loadCities } from "./cities";
import type { City } from "./cities";
import { cities100k } from "./cities/100k";
import { cities15k } from "./cities/15k";
import { cities1m } from "./cities/1m";
import { capitalCities } from "./cities/capitals";
import { COUNTRY_CODES } from "./codes";
import { CITY_ALIASES } from "./data/city-aliases.data";
import { CITY_LOADERS } from "./data/city-loaders.data";
import { subdivision } from "./subdivisions";

// A few cities made by hand, for what the lookups do rather than for what the data says.
const make = (id: string, en: string, country: string, lat: number, lon: number, population: number | null, subdivisionCode: string | null = null): City =>
  Object.freeze({
    id,
    name: Object.freeze({ en }),
    continent: "EU",
    country,
    lat,
    lon,
    population,
    populationDate: null,
    subdivision: subdivisionCode,
    capital: null,
    capitalOf: Object.freeze([]),
    source: Object.freeze({ point: "wikidata", population: population === null ? null : "wikidata", ja: null } as const),
  });
const PARIS = make("Q90", "Paris", "FR", 48.8567, 2.351, 2165423, "FR-IDF");
const LYON = make("Q456", "Lyon", "FR", 45.76, 4.84, 522250, "FR-ARA");
const TOKYO = make("Q1490", "Tokyo", "JP", 35.6895, 139.6917, 14047594, "JP-13");
const FIJI = make("Q1", "Taveuni", "FJ", -16.85, 179.99, 4000);
const SAMOA = make("Q2", "Savai'i", "WS", -13.6, -172.4, 3000);

describe("citySet", () => {
  const set = citySet([PARIS, LYON], [TOKYO, PARIS]);

  it("keeps each city once, in the order the lists were given", () => {
    expect(set.cities.map((one) => one.id)).toEqual(["Q90", "Q456", "Q1490"]);
    expect(Object.isFrozen(set)).toBe(true);
    expect(Object.isFrozen(set.cities)).toBe(true);
  });

  it("finds a city by its id, in either case, and nothing for what it does not hold", () => {
    expect(set.byId("Q1490")).toBe(TOKYO);
    expect(set.byId(" q90 ")).toBe(PARIS);
    expect(set.byId("Q0")).toBeNull();
    expect(set.byId("")).toBeNull();
    expect(set.byId(undefined as unknown as string)).toBeNull();
  });

  it("lists a country's cities, and a subdivision's, by code in either case", () => {
    expect(set.inCountry("fr").map((one) => one.id)).toEqual(["Q90", "Q456"]);
    expect(set.inCountry(" JP ")).toEqual([TOKYO]);
    expect(set.inCountry("DE")).toEqual([]);
    expect(set.inSubdivision("jp-13")).toEqual([TOKYO]);
    expect(set.inSubdivision("FR-IDF")).toEqual([PARIS]);
    expect(set.inSubdivision("XX-1")).toEqual([]);
    expect(set.inCountry(3 as unknown as string)).toEqual([]);
  });

  it("answers the nearest city and how far it is", () => {
    const found = set.nearest({ lat: 48.9, lon: 2.4 });
    expect(found?.city).toBe(PARIS);
    expect(found?.km).toBeGreaterThan(5);
    expect(found?.km).toBeLessThan(8);
    expect(set.nearest({ lat: 35.7, lon: 139.7 })?.city).toBe(TOKYO);
    // A city is a point: a city asked about is at distance 0.
    expect(set.nearest(LYON)?.km).toBeCloseTo(0, 6);
  });

  it("measures across the antimeridian and past the poles", () => {
    const islands = citySet([FIJI, SAMOA, PARIS]);
    expect(islands.nearest({ lat: -16.85, lon: -179.99 })?.city).toBe(FIJI);
    expect(islands.nearest({ lat: -16.85, lon: -179.99 })?.km).toBeLessThan(5);
    expect(citySet([PARIS]).nearest({ lat: 90, lon: 0 })?.km).toBeCloseTo(((90 - 48.8567) * Math.PI * 6371.0088) / 180, 0);
  });

  it("agrees with the great-circle distance of two known cities", () => {
    // Paris to Lyon is about 392 km.
    expect(citySet([LYON]).nearest(PARIS)?.km).toBeGreaterThan(390);
    expect(citySet([LYON]).nearest(PARIS)?.km).toBeLessThan(394);
  });

  it("honours maxKm, minPopulation and country", () => {
    expect(set.nearest({ lat: 45.7, lon: 4.8 })?.city).toBe(LYON);
    expect(set.nearest({ lat: 45.7, lon: 4.8 }, { minPopulation: 1000000 })?.city).toBe(PARIS);
    expect(set.nearest({ lat: 45.7, lon: 4.8 }, { country: "jp" })?.city).toBe(TOKYO);
    expect(set.nearest({ lat: 45.7, lon: 4.8 }, { maxKm: 10 })?.city).toBe(LYON);
    expect(set.nearest({ lat: 45.7, lon: 4.8 }, { maxKm: 5 })).toBeNull();
    expect(set.nearest({ lat: 0, lon: 0 }, { maxKm: 100 })).toBeNull();
    expect(citySet([FIJI]).nearest({ lat: 0, lon: 0 }, { minPopulation: 1 })?.city).toBe(FIJI);
    expect(citySet([make("Q3", "X", "FR", 1, 1, null)]).nearest({ lat: 1, lon: 1 }, { minPopulation: 1 })).toBeNull();
  });

  it("lists the cities within a distance, nearest first", () => {
    const near = set.within({ lat: 46, lon: 3 }, 500);
    expect(near.map((one) => one.city.id)).toEqual(["Q456", "Q90"]);
    expect(near[0]!.km).toBeLessThan(near[1]!.km);
    expect(set.within({ lat: 0, lon: 0 }, 10)).toEqual([]);
  });

  it("answers nothing for a point that is not one", () => {
    expect(set.nearest({ lat: NaN, lon: 0 })).toBeNull();
    expect(set.nearest({ lat: 91, lon: 0 })).toBeNull();
    expect(set.nearest(null as unknown as { lat: number; lon: number })).toBeNull();
    expect(citySet().nearest({ lat: 0, lon: 0 })).toBeNull();
    expect(citySet().cities).toEqual([]);
  });
});

describe("the tiers", () => {
  const tiers = { capitals: capitalCities(), "1m": cities1m(), "100k": cities100k(), "15k": cities15k() };
  const all = Object.values(tiers).flat();

  it("hold every city once, with an id that is a Wikidata item or a Natural Earth number", () => {
    expect(new Set(all.map((one) => one.id)).size).toBe(all.length);
    for (const city of all) expect(city.id, city.id).toMatch(/^(Q[1-9]\d*|ne:[1-9]\d*)$/);
  });

  it("put a capital of any size in capitals and the rest by population", () => {
    for (const city of tiers.capitals) expect(city.capital, city.id).not.toBeNull();
    for (const city of [...tiers["1m"], ...tiers["100k"], ...tiers["15k"]]) expect(city.capital, city.id).toBeNull();
    for (const city of tiers["1m"]) expect(city.population, city.id).toBeGreaterThanOrEqual(1000000);
    for (const city of tiers["100k"]) {
      expect(city.population, city.id).toBeGreaterThanOrEqual(100000);
      expect(city.population, city.id).toBeLessThan(1000000);
    }
    for (const city of tiers["15k"]) {
      expect(city.population, city.id).toBeGreaterThanOrEqual(15000);
      expect(city.population, city.id).toBeLessThan(100000);
    }
  });

  it("list the most populous first", () => {
    for (const list of Object.values(tiers)) for (let at = 1; at < list.length; at += 1) expect(list[at - 1]!.population ?? 0, list[at]!.id).toBeGreaterThanOrEqual(list[at]!.population ?? 0);
  });

  it("give every city a name in English, a country kuni lists, a point on the earth and a source for each fact", () => {
    for (const city of all) {
      expect(city.name.en.length, city.id).toBeGreaterThan(0);
      expect(COUNTRY_CODES as readonly string[], city.id).toContain(city.country);
      expect(Math.abs(city.lat), city.id).toBeLessThanOrEqual(90);
      expect(Math.abs(city.lon), city.id).toBeLessThanOrEqual(180);
      expect(["wikidata", "natural-earth"], city.id).toContain(city.source.point);
      expect(city.source.ja === null, city.id).toBe(city.name.ja === undefined);
      expect(city.source.population === null, city.id).toBe(city.population === null);
    }
  });

  it("never copy an English name into the Japanese or the native one", () => {
    for (const city of all) {
      if (city.name.ja !== undefined) expect(city.name.ja.trim().length, city.id).toBeGreaterThan(0);
      if (city.name.native !== undefined) {
        expect(city.name.native, city.id).not.toBe(city.name.en);
        expect(city.nativeLanguage, city.id).toMatch(/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/);
      } else expect(city.nativeLanguage, city.id).toBeUndefined();
    }
  });

  it("name a first-level subdivision of the city's own country, or none", () => {
    for (const city of all) if (city.subdivision !== null) expect(subdivision(city.subdivision)?.country, city.id).toBe(city.country);
  });

  it("say what each is the capital of", () => {
    for (const city of tiers.capitals) {
      for (const code of city.capitalOf) expect(code, city.id).toMatch(/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/);
    }
  });

  it("hold the capital of every country that has one in the data", () => {
    const nations = new Set(capitalCities().filter((one) => one.capital === "national").map((one) => one.country));
    expect(nations.size).toBeGreaterThan(190);
    for (const code of ["JP", "FR", "DE", "US", "BR", "AU", "ZA", "IN"]) expect(nations.has(code), code).toBe(true);
  });

  it("freeze every city and share the list between calls", () => {
    expect(capitalCities()).toBe(capitalCities());
    expect(Object.isFrozen(capitalCities())).toBe(true);
    expect(Object.isFrozen(capitalCities()[0])).toBe(true);
    expect(Object.isFrozen(capitalCities()[0]!.name)).toBe(true);
    expect(Object.isFrozen(capitalCities()[0]!.capitalOf)).toBe(true);
  });
});

describe("what the data says of well-known places", () => {
  const world = citySet(capitalCities(), cities1m(), cities100k());

  it("has Paris, with its Wikidata id, its names and the right country", () => {
    const paris = world.byId("Q90")!;
    expect(paris.name.en).toBe("Paris");
    expect(paris.name.ja).toBe("パリ");
    expect(paris.country).toBe("FR");
    expect(paris.capital).toBe("national");
    expect(paris.source.ja).toBe("wikidata");
    expect(paris.lat).toBeCloseTo(48.86, 1);
    expect(paris.lon).toBeCloseTo(2.35, 1);
    expect(paris.population).toBeGreaterThan(2000000);
  });

  it("carries the continent of its country, and two capital letters for the country", () => {
    expect(world.byId("Q90")?.continent).toBe("EU");
    expect(world.byId("Q1490")?.continent).toBe("AS");
    for (const city of world.cities) {
      expect(city.country, city.id).toMatch(/^[A-Z]{2}$/);
      expect(["AF", "AN", "AS", "EU", "NA", "OC", "SA"], city.id).toContain(city.continent);
    }
  });

  it("has Osaka in Osaka Prefecture, and Sapporo as the capital of Hokkaido", () => {
    const osaka = world.inCountry("JP").find((one) => one.name.en === "Osaka")!;
    expect(osaka.subdivision).toBe("JP-27");
    expect(osaka.name.ja).toBe("大阪市");
    const sapporo = world.inCountry("JP").find((one) => one.name.en === "Sapporo")!;
    expect(sapporo.capital).toBe("subdivision");
    expect(sapporo.capitalOf).toContain("JP-01");
  });

  it("finds the city nearest to a point in a city", () => {
    expect(world.nearest({ lat: 52.52, lon: 13.405 })?.city.name.en).toBe("Berlin");
    expect(world.nearest({ lat: -33.87, lon: 151.21 })?.city.name.en).toBe("Sydney");
  });
});

describe("loading", () => {
  it("joins the tiers asked for, once each, and none gives an empty set", async () => {
    const some = await loadCities("capitals", "1m", "capitals");
    expect(some.cities.length).toBe(capitalCities().length + cities1m().length);
    expect((await loadCities()).cities).toEqual([]);
  });

  it("refuses a name that is not a tier", async () => {
    await expect(loadCities("5k" as never)).rejects.toThrow(RangeError);
    expect(CITY_TIERS).toEqual(["capitals", "1m", "100k", "15k"]);
  });

  it("loads one country's cities, every tier, the most populous first", async () => {
    const japan = (await citiesOf(" jp "))!;
    const set = citySet(...[capitalCities(), cities1m(), cities100k(), cities15k()]);
    expect(japan.length).toBe(set.inCountry("JP").length);
    expect(new Set(japan.map((one) => one.id))).toEqual(new Set(set.inCountry("JP").map((one) => one.id)));
    for (let at = 1; at < japan.length; at += 1) expect(japan[at - 1]!.population ?? 0).toBeGreaterThanOrEqual(japan[at]!.population ?? 0);
    expect(Object.isFrozen(japan)).toBe(true);
  });

  it("answers an empty list for a country with no city, and null for a code that is not one", async () => {
    const without = COUNTRY_CODES.find((code) => CITY_LOADERS[code.toLowerCase()] === undefined);
    if (without !== undefined) expect(await citiesOf(without)).toEqual([]);
    expect(await citiesOf("XX")).toBeNull();
    expect(await citiesOf(undefined as unknown as string)).toBeNull();
  });

  it("has a file for every country that holds a city, and no other", () => {
    const withCities = new Set([...capitalCities(), ...cities1m(), ...cities100k(), ...cities15k()].map((one) => one.country.toLowerCase()));
    expect(Object.keys(CITY_LOADERS).sort()).toEqual([...withCities].sort());
  });
});

describe("cityById", () => {
  it("finds a city in any tier by its id, in either case, and an id that is nobody's gives null", async () => {
    expect((await cityById("Q90"))?.name.en).toBe("Paris");
    expect((await cityById(" q1490 "))?.country).toBe("JP");
    const small = cities15k()[0]!;
    expect(await cityById(small.id)).toBe(small);
    expect(await cityById("Q0")).toBeNull();
    expect(await cityById("")).toBeNull();
    expect(await cityById(undefined as unknown as string)).toBeNull();
  });

  it("follows an alias to the city an id was merged into", async () => {
    for (const [old, target] of Object.entries(CITY_ALIASES)) expect((await cityById(old))?.id, old).toBe(target);
  });
});

describe("ids that never change", () => {
  it("answer, through byId, with the city an old id was merged into", () => {
    const everything = citySet(capitalCities(), cities1m(), cities100k(), cities15k());
    for (const [old, target] of Object.entries(CITY_ALIASES)) expect(everything.byId(old)?.id, old).toBe(target);
    expect(everything.byId("Q90")?.id).toBe("Q90");
  });
});
