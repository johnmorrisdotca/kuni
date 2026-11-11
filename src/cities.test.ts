import { describe, expect, it } from "vitest";

import { CITY_TIERS, citiesOf, citySet, cityById, loadCities } from "./cities";
import type { City } from "./cities";
import { cities100k } from "./cities/100k";
import { cities1m } from "./cities/1m";
import { capitalCities } from "./cities/capitals";
import { COUNTRY_CODES } from "./codes";
import { CITY_ALIASES } from "./data/city-aliases.data";
import { CITY_INDEX } from "./data/city-index.data";
import { rankingPopulation } from "./rank";
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
    metro: null,
    inMetroOf: null,
    urbanAreaUnknown: false,
    rankEstimated: false,
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
  const tiers = { capitals: capitalCities(), "1m": cities1m(), "100k": cities100k() };
  const everyone = citySet(...Object.values(tiers)).cities;

  it("hold each city once in a tier, with an id that is a Wikidata item or a Natural Earth number", () => {
    for (const list of Object.values(tiers)) expect(new Set(list.map((one) => one.id)).size).toBe(list.length);
    for (const city of everyone) expect(city.id, city.id).toMatch(/^(Q[1-9]\d*|ne:[1-9]\d*)$/);
  });

  it("hold every capital in capitals, and every city of the size in the others, capitals too", () => {
    for (const city of tiers.capitals) expect(city.capital, city.id).not.toBeNull();
    for (const city of tiers["1m"]) expect(city.population, city.id).toBeGreaterThanOrEqual(1000000);
    for (const city of tiers["100k"]) {
      expect(city.population, city.id).toBeGreaterThanOrEqual(100000);
      expect(city.population, city.id).toBeLessThan(1000000);
    }
    // A capital of a million people is in both capitals and 1m.
    const tokyo = tiers.capitals.find((one) => one.name.en === "Tokyo")!;
    expect(tiers["1m"].some((one) => one.id === tokyo.id)).toBe(true);
  });

  it("hold in 15k, made from the countries' files, the cities of 15,000 to 100,000 people, capitals too", async () => {
    const small = (await loadCities("15k")).cities;
    expect(small.length).toBeGreaterThan(10000);
    for (const city of small) {
      expect(city.population, city.id).toBeGreaterThanOrEqual(15000);
      expect(city.population, city.id).toBeLessThan(100000);
    }
    const national = small.filter((one) => one.capital === "national");
    expect(national.length).toBeGreaterThan(10);
  });

  it("list the most populous first", () => {
    // By the metropolitan area's people where a city has one, else its own.
    for (const list of Object.values(tiers)) for (let at = 1; at < list.length; at += 1) expect(rankingPopulation(list[at - 1]!), list[at]!.id).toBeGreaterThanOrEqual(rankingPopulation(list[at]!));
  });

  it("give every city a name in English, a country kuni lists, a point on the earth and a source for each fact", () => {
    for (const city of everyone) {
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
    for (const city of everyone) {
      if (city.name.ja !== undefined) expect(city.name.ja.trim().length, city.id).toBeGreaterThan(0);
      if (city.name.native !== undefined) {
        expect(city.name.native, city.id).not.toBe(city.name.en);
        expect(city.nativeLanguage, city.id).toMatch(/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/);
      } else expect(city.nativeLanguage, city.id).toBeUndefined();
    }
  });

  it("name a first-level subdivision of the city's own country, or none", () => {
    for (const city of everyone) if (city.subdivision !== null) expect(subdivision(city.subdivision)?.country, city.id).toBe(city.country);
  });

  it("say what each capital is the capital of, and nothing for any other city", () => {
    for (const city of everyone) {
      expect(city.capital !== null, city.id).toBe(city.capitalOf.length > 0);
      for (const code of city.capitalOf) expect(code, city.id).toMatch(/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/);
      if (city.capital === "national" || city.capital === "alternate") expect(city.capitalOf.some((code) => !code.includes("-")), city.id).toBe(true);
      if (city.capital === "subdivision") expect(city.capitalOf.every((code) => code.includes("-")), city.id).toBe(true);
    }
  });

  it("give each country one national capital at most, and the right one where it matters", () => {
    const nationals = new Map<string, string[]>();
    for (const city of tiers.capitals) if (city.capital === "national") nationals.set(city.country, [...(nationals.get(city.country) ?? []), city.name.en]);
    for (const [code, names] of nationals) expect(names.length, `${code}: ${names.join(", ")}`).toBe(1);
    expect(nationals.size).toBeGreaterThan(190);
    expect(nationals.get("JP")).toEqual(["Tokyo"]);
    expect(nationals.get("NG")).toEqual(["Abuja"]);
    expect(nationals.get("ZA")).toEqual(["Pretoria"]);
    expect(nationals.get("TZ")?.[0]).toBe("Dodoma");
    expect(nationals.get("MM")?.[0]).toMatch(/Naypyidaw|Nay Pyi Taw/);
    for (const code of ["FR", "DE", "US", "BR", "AU", "IN", "CA"]) expect(nationals.has(code), code).toBe(true);
    // The old seats are alternates, not capitals of the country.
    const alternates = new Map(tiers.capitals.filter((one) => one.capital === "alternate").map((one) => [one.name.en, one]));
    expect(alternates.get("Cape Town")?.capitalOf).toContain("ZA");
    expect(alternates.get("Bloemfontein")?.capitalOf).toContain("ZA");
    expect(tiers.capitals.find((one) => one.name.en === "Kyoto")?.capital).not.toBe("national");
    expect(tiers.capitals.find((one) => one.name.en === "Lagos")?.capital).not.toBe("national");
    expect(tiers.capitals.find((one) => one.name.en === "Dar es Salaam")?.capital).not.toBe("national");
    expect(tiers.capitals.find((one) => one.name.en === "Yangon")?.capital).not.toBe("national");
  });

  it("hold no area, no numbered district and no Greater ... among the cities", async () => {
    const AREA = /\bmetropolitan (area|region|municipality|statistical area)\b|\burban (area|agglomeration|region)\b|agglomeration|conurbation|built-up area|^Greater (?!Sudbury$|Napanee$|Noida$)|\s(#|No\. )?\d{1,3}(, \d+)?$/i;
    const everything = (await loadCities("capitals", "1m", "100k", "15k")).cities;
    // A capital, or a place Natural Earth names, may carry such a name; every other city may not.
    const found = everything.filter((one) => AREA.test(one.name.en) && one.capital === null && !one.id.startsWith("ne:")).map((one) => `${one.id} ${one.name.en}`);
    expect(found.slice(0, 20)).toEqual([]);
    const names = new Set(everything.map((one) => one.name.en));
    for (const gone of ["Greater São Paulo", "Greater Mexico City", "Rhine-Ruhr Metropolitan Region", "Prague 5", "Prague 14", "Greater Buenos Aires"]) expect(names.has(gone), gone).toBe(false);
    expect(names.has("Prague")).toBe(true);
    expect(names.has("Greater Sudbury")).toBe(true);
  });

  it("list each city once: Tokyo is one city", async () => {
    const japan = (await citiesOf("JP"))!;
    expect(japan.filter((one) => one.name.en === "Tokyo").length).toBe(1);
    const seen = new Set<string>();
    for (const city of japan) {
      expect(seen.has(city.id), city.id).toBe(false);
      seen.add(city.id);
    }
  });

  it("name each city's official-language name, not a regional one", () => {
    const set = citySet(...Object.values(tiers));
    const native = (en: string, country: string) => set.inCountry(country).find((one) => one.name.en === en)?.name.native;
    expect(native("Cologne", "DE")).toBe("Köln");
    expect(native("Genoa", "IT")).toBe("Genova");
    expect(native("Munich", "DE")).toBe("München");
    expect(native("Vienna", "AT")).toBe("Wien");
    expect(native("Prague", "CZ")).toBe("Praha");
    // Johannesburg is Johannesburg in the first official language with a label (Afrikaans): nothing to add to the English name.
    expect(native("Johannesburg", "ZA")).toBeUndefined();
    expect(set.inCountry("ZA").find((one) => one.name.en === "Johannesburg")?.name.native).not.toBe("eGoli");
    expect(set.inCountry("CA").find((one) => one.name.en === "Montreal")?.name.native).not.toBe("Mooniyang");
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

  it("calls East Jerusalem 東エルサレム and never plain エルサレム, and says the name is written for this package", async () => {
    const palestine = (await citiesOf("PS"))!;
    const east = palestine.find((one) => one.id === "Q212938")!;
    expect(east.name.en).toBe("East Jerusalem");
    expect(east.name.ja).toBe("東エルサレム");
    expect(east.source.ja).toBe("kuni");
    for (const city of (await loadCities("capitals", "1m", "100k", "15k")).cities) if (city.id === "Q212938") expect(city.name.ja).not.toBe("エルサレム");
    expect(world.byId("Q1218")?.name.ja ?? "エルサレム").toBe("エルサレム");
  });

  it("prefers Wikidata's Japanese name to Natural Earth's, and uses Natural Earth's only where Wikidata has none", async () => {
    const everything = (await loadCities("capitals", "1m", "100k", "15k")).cities;
    for (const city of everything) {
      if (city.name.ja === undefined) continue;
      expect(["wikidata", "natural-earth", "kuni"], city.id).toContain(city.source.ja);
    }
    expect(everything.filter((one) => one.source.ja === "kuni").map((one) => one.id)).toEqual(["Q212938"]);
    expect(everything.filter((one) => one.source.ja === "natural-earth").length).toBeGreaterThan(100);
  });

  it("has Osaka in Osaka Prefecture, and Sapporo as the capital of Hokkaido", () => {
    const osaka = world.inCountry("JP").find((one) => one.name.en === "Osaka")!;
    expect(osaka.subdivision).toBe("JP-27");
    expect(osaka.name.ja).toBe("大阪市");
    const sapporo = world.inCountry("JP").find((one) => one.name.en === "Sapporo")!;
    expect(sapporo.capital).toBe("subdivision");
    expect(sapporo.capitalOf).toContain("JP-01");
  });

  it("finds Paris at the centre of Paris among every city of France, not an arrondissement or a ward", async () => {
    const france = citySet((await citiesOf("FR"))!);
    expect(france.nearest({ lat: 48.8566, lon: 2.3522 })?.city.name.en).toBe("Paris");
    for (const city of france.cities) expect(city.name.en, city.id).not.toMatch(/arrondissement/i);
    const japan = citySet((await citiesOf("JP"))!);
    expect(japan.cities.filter((one) => /\bWard$/.test(one.name.en) && one.capital === null).length).toBe(0);
    expect(japan.nearest({ lat: 34.6937, lon: 135.5023 })?.city.name.en).toBe("Osaka");
  });

  it("finds the city nearest to a point in a city", () => {
    expect(world.nearest({ lat: 52.52, lon: 13.405 })?.city.name.en).toBe("Berlin");
    expect(world.nearest({ lat: -33.87, lon: 151.21 })?.city.name.en).toBe("Sydney");
  });
});

describe("loading", () => {
  it("joins the tiers asked for, once each, and none gives an empty set", async () => {
    const some = await loadCities("capitals", "1m", "capitals");
    // A capital of a million people is in both tiers and once in the set.
    expect(some.cities.length).toBe(new Set([...capitalCities(), ...cities1m()].map((one) => one.id)).size);
    expect(some.cities.length).toBeLessThan(capitalCities().length + cities1m().length);
    expect((await loadCities()).cities).toEqual([]);
  });

  it("refuses a name that is not a tier", async () => {
    await expect(loadCities("5k" as never)).rejects.toThrow(RangeError);
    expect(CITY_TIERS).toEqual(["capitals", "1m", "100k", "15k"]);
  });

  it("loads one country's cities, every tier, the most populous first", async () => {
    const japan = (await citiesOf(" jp "))!;
    const set = await loadCities("capitals", "1m", "100k", "15k");
    expect(japan.length).toBe(set.inCountry("JP").length);
    expect(new Set(japan.map((one) => one.id))).toEqual(new Set(set.inCountry("JP").map((one) => one.id)));
    for (let at = 1; at < japan.length; at += 1) expect(rankingPopulation(japan[at - 1]!)).toBeGreaterThanOrEqual(rankingPopulation(japan[at]!));
    expect(Object.isFrozen(japan)).toBe(true);
  });

  it("answers an empty list for a country with no city, and null for a code that is not one", async () => {
    const without = COUNTRY_CODES.find((code) => CITY_LOADERS[code.toLowerCase()] === undefined);
    if (without !== undefined) expect(await citiesOf(without)).toEqual([]);
    expect(await citiesOf("XX")).toBeNull();
    expect(await citiesOf(undefined as unknown as string)).toBeNull();
  });

  it("has a file for every country that holds a city, and no other", async () => {
    const withCities = new Set((await loadCities("capitals", "1m", "100k", "15k")).cities.map((one) => one.country.toLowerCase()));
    expect(Object.keys(CITY_LOADERS).sort()).toEqual([...withCities].sort());
  });
});

describe("cityById", () => {
  it("finds a city in any tier by its id, in either case, and an id that is nobody's gives null", async () => {
    expect((await cityById("Q90"))?.name.en).toBe("Paris");
    expect((await cityById(" q1490 "))?.country).toBe("JP");
    // A town only the 15k tier holds: not a capital, which the capitals tier holds too.
    const small = (await loadCities("15k")).cities.find((one) => one.capital === null)!;
    expect(await cityById(small.id)).toBe(small);
    expect(await cityById("Q0")).toBeNull();
    expect(await cityById("")).toBeNull();
    expect(await cityById(undefined as unknown as string)).toBeNull();
  });

  it("follows an alias to the city an id was merged into", async () => {
    for (const [old, target] of Object.entries(CITY_ALIASES)) expect((await cityById(old))?.id, old).toBe(target);
  });

  it("knows the country of every city no tier file holds, and of no other, so a small city fetches one country's file", async () => {
    const inTiers = new Set([...capitalCities(), ...cities1m(), ...cities100k()].map((city) => city.id));
    const small = new Map<string, string>();
    for (const code of Object.keys(CITY_LOADERS))
      for (const city of (await citiesOf(code))!) if (!inTiers.has(city.id)) small.set(city.id, city.country);
    const index = new Map<string, string>();
    for (const [code, list] of Object.entries(CITY_INDEX)) {
      let number = 0;
      for (const part of list.split(",")) {
        if (part.startsWith("~")) index.set(`ne:${Number.parseInt(part.slice(1), 36)}`, code.toUpperCase());
        else index.set(`Q${(number += Number.parseInt(part, 36))}`, code.toUpperCase());
      }
    }
    expect(index.size).toBe(small.size);
    for (const [id, country] of small) expect(index.get(id), id).toBe(country);
    const ne = [...small.keys()].find((id) => id.startsWith("ne:"));
    if (ne !== undefined) expect((await cityById(ne))?.id).toBe(ne);
    for (const id of [...small.keys()].filter((_, at) => at % 997 === 0)) expect((await cityById(id))?.id, id).toBe(id);
  });
});

describe("the same id, the same answer", () => {
  it("is found by cityById and byId alike, in any case, and an alias answers in both", async () => {
    // Every tier: an alias may answer with a town under 100,000 people (Sandnes Municipality with Sandnes).
    const set = await loadCities("capitals", "1m", "100k", "15k");
    for (const id of ["Q90", "q90", " Q1490 ", "Q0", "", "ne:1"]) expect((await cityById(id))?.id ?? null, id).toBe(set.byId(id)?.id ?? null);
    for (const old of Object.keys(CITY_ALIASES)) expect(set.byId(old)?.id ?? null, old).toBe((await cityById(old))?.id ?? null);
  });
});

describe("limits and options that are not numbers", () => {
  const set = citySet([PARIS, LYON]);

  it("treat a maxKm or minPopulation that is not a finite number as no limit", () => {
    expect(set.nearest({ lat: 0, lon: 0 }, { maxKm: NaN })?.city).toBeDefined();
    expect(set.nearest({ lat: 48.9, lon: 2.4 }, { minPopulation: NaN })?.city).toBe(PARIS);
    expect(set.within({ lat: 46, lon: 3 }, NaN)).toEqual([]);
    expect(set.within({ lat: 46, lon: 3 }, -5)).toEqual([]);
    expect(set.within({ lat: 46, lon: 3 }, Infinity).length).toBe(2);
  });

  it("keep an answer to itself: within gives a frozen list", () => {
    expect(Object.isFrozen(set.within({ lat: 46, lon: 3 }, 1000))).toBe(true);
  });

  it("finds the nearest of a large set in good time", () => {
    const many = Array.from({ length: 40000 }, (_, at) => make(`Q${at + 10}`, `City ${at}`, "FR", ((at * 7919) % 18000) / 100 - 90, ((at * 104729) % 36000) / 100 - 180, at));
    const started = performance.now();
    const big = citySet(many);
    for (let at = 0; at < 200; at += 1) big.nearest({ lat: (at * 0.9) % 90, lon: (at * 1.7) % 180 });
    expect(performance.now() - started).toBeLessThan(2000);
    expect(big.inCountry("FR").length).toBe(40000);
  });
});

describe("ids that never change", () => {
  it("answer, through byId, with the city an old id was merged into", async () => {
    const everything = await loadCities("capitals", "1m", "100k", "15k");
    for (const [old, target] of Object.entries(CITY_ALIASES)) expect(everything.byId(old)?.id, old).toBe(target);
    expect(everything.byId("Q90")?.id).toBe("Q90");
  });
});

describe("the top cities of a country", () => {
  // The order a country's list comes in, as scripts/build-data.ts ranks it.
  const top = async (code: string, count: number): Promise<string[]> => (await citiesOf(code))!.slice(0, count).map((city) => city.name.en);

  it("rank by the urban area each heads, by one source for each country, as a city picker lists them", async () => {
    // Statistics Canada's census metropolitan areas (1 July 2025) and the Census Bureau's statistical areas (1 July 2024).
    expect(await top("CA", 15)).toEqual(["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa", "Edmonton", "Winnipeg", "Quebec City", "Hamilton", "Kitchener", "London", "Halifax", "St. Catharines", "Oshawa", "Windsor"]);
    expect(await top("US", 15)).toEqual(["New York City", "Los Angeles", "Chicago", "Dallas", "Houston", "Miami", "Washington, D.C.", "Atlanta", "Philadelphia", "Phoenix", "Boston", "Riverside", "San Francisco", "Detroit", "Seattle"]);
    // The OECD's functional urban areas; a city of a million or more that heads none ranks by its own (Yokohama), or by
    // Wikidata's metro where that is bigger, an estimate (Kyoto, Kobe).
    expect(await top("GB", 10)).toEqual(["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool", "Newcastle upon Tyne", "Sheffield", "Bristol", "Leicester"]);
    expect(await top("JP", 10)).toEqual(["Tokyo", "Osaka", "Nagoya", "Kyoto", "Yokohama", "Fukuoka", "Kobe", "Sapporo", "Sendai", "Kawasaki"]);
    expect(await top("AU", 10)).toEqual(["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Geelong", "Wollongong"]);
    expect(await top("DE", 10)).toEqual(["Berlin", "Hamburg", "Munich", "Frankfurt", "Stuttgart", "Cologne", "Essen", "Düsseldorf", "Nuremberg", "Mannheim"]);
    expect(await top("FR", 10)).toEqual(["Paris", "Lyon", "Marseille", "Lille", "Toulouse", "Bordeaux", "Nantes", "Strasbourg", "Montpellier", "Rennes"]);
    expect(await top("MX", 10)).toEqual(["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Toluca", "Tijuana", "Santiago de Querétaro", "León", "Mérida", "Ciudad Juárez"]);
    expect(await top("KR", 10)).toEqual(["Seoul", "Busan", "Incheon", "Daegu", "Gwangju", "Daejeon", "Suwon", "Yongin", "Changwon", "Goyang"]);
    // China's and India's censuses: China's urban resident population of 2020, not the municipality (Chongqing fourth at
    // 16.3 million, not first at 32), once; India's urban agglomerations of 2011.
    expect(await top("CN", 10)).toEqual(["Shanghai", "Beijing", "Shenzhen", "Chongqing", "Guangzhou", "Chengdu", "Tianjin", "Wuhan", "Dongguan", "Xi'an"]);
    expect(await top("IN", 10)).toEqual(["Mumbai", "Delhi", "Kolkata", "Chennai", "Bengaluru", "Hyderabad", "Ahmedabad", "Pune", "Surat", "Jaipur"]);
    expect((await citiesOf("CN"))!.filter((city) => /^Chongqing/.test(city.name.en))).toHaveLength(1);
    // Every other country by its cities' own figures, the suburbs and districts inside their city's area.
    expect(await top("BR", 5)).toEqual(["São Paulo", "Rio de Janeiro", "Brasília", "Fortaleza", "Salvador"]);
    expect(await top("RU", 5)).toEqual(["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan"]);
    expect(await top("TR", 5)).toEqual(["Istanbul", "Ankara", "İzmir", "Bursa", "Antalya"]);
    expect(await top("EG", 4)).toEqual(["Cairo", "Alexandria", "Port Said", "Suez"]);
    expect(await top("NG", 5)).toEqual(["Lagos", "Kano", "Port Harcourt", "Ibadan", "Benin City"]);
    expect(await top("ZA", 5)).toEqual(["Johannesburg", "Cape Town", "Pietermaritzburg", "Pretoria", "Durban"]);
    expect(await top("PK", 5)).toEqual(["Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala"]);
    expect(await top("BD", 3)).toEqual(["Dhaka", "Chittagong", "Khulna"]);
    expect(await top("ID", 3)).toEqual(["Jakarta", "Surabaya", "Bandung"]);
    expect(await top("VN", 2)).toEqual(["Ho Chi Minh City", "Hanoi"]);
    expect(await top("PH", 4)).toEqual(["Quezon City", "Manila", "Davao City", "Caloocan"]);
    expect(await top("TH", 4)).toEqual(["Bangkok", "Chiang Mai", "Hat Yai", "Nakhon Ratchasima"]);
    expect((await citiesOf("BR"))!.filter((city) => city.name.en === "Natal" || city.name.en === "Vila Velha")).toHaveLength(2);
    // Somerset is a county, not a town; Taunton, its county town, stays.
    expect((await citiesOf("GB"))!.some((city) => city.name.en === "Somerset")).toBe(false);
    expect((await citiesOf("GB"))!.some((city) => city.name.en === "Taunton")).toBe(true);
  });

  it("list a city inside another's area after every city that heads one, and say whose area it is in", async () => {
    const inside = async (code: string, name: string): Promise<string | null | undefined> => (await citiesOf(code))!.find((city) => city.name.en === name)?.inMetroOf;
    const canada = (await citiesOf("CA"))!;
    for (const name of ["Mississauga", "Brampton", "Etobicoke"]) {
      const city = canada.find((one) => one.name.en === name)!;
      expect(city.inMetroOf, name).toBe("Q172");
      expect(canada.indexOf(city), name).toBeGreaterThan(canada.findIndex((one) => one.name.en === "Kelowna"));
    }
    expect(await inside("CA", "Laval")).toBe("Q340");
    expect(await inside("US", "Fort Worth")).toBe("Q16557");
    expect(await inside("US", "Long Beach")).toBe("Q65");
    expect(await inside("US", "Anaheim")).toBe("Q65");
    expect(await inside("US", "Brooklyn")).toBe("Q60");
    expect(await inside("MX", "Ecatepec de Morelos")).toBe("Q1489");
    expect(await inside("MX", "Zapopan")).toBe("Q9022");
    expect(await inside("BR", "Niterói")).toBe("Q8678");
    expect(await inside("IN", "Thane")).toBe("Q1156");
    expect(await inside("IN", "Pimpri-Chinchwad")).toBe("Q1538");
    expect(await inside("EG", "Giza")).toBe("Q85");
    expect(await inside("TH", "Sai Mai")).toBe("Q1861");
    expect(await inside("AU", "Ipswich")).toBe("Q34932");
    // A city of a million or more is never put inside another's for being near it.
    for (const [code, name] of [["JP", "Yokohama"], ["JP", "Kobe"], ["JP", "Kyoto"], ["KR", "Incheon"], ["PK", "Rawalpindi"]] as const) expect(await inside(code, name), name).toBeNull();
    expect(await inside("CA", "Toronto")).toBeNull();
    // In China and India a city below the twenty with a census figure comes after them; its own is its municipality's.
    const china = (await citiesOf("CN"))!;
    expect(china.find((city) => city.name.en === "Yantai")).toMatchObject({ inMetroOf: null, urbanAreaUnknown: true, metro: null, rankEstimated: true });
    expect(china.findIndex((city) => city.urbanAreaUnknown)).toBe(20);
    expect(china.find((city) => city.name.en === "Shanghai")).toMatchObject({ urbanAreaUnknown: false, rankEstimated: false });
  });

  it("keep each city's own figure beside its area's, show the area's own name, and say which figures are estimates", async () => {
    const vancouver = (await citiesOf("CA"))!.find((city) => city.name.en === "Vancouver")!;
    expect(vancouver.population).toBeLessThan(1000000);
    expect(vancouver.metro).toMatchObject({ id: expect.stringMatching(/^statcan:/), name: "Vancouver", populationDate: "2025-07-01", estimated: false });
    expect((await citiesOf("US"))!.find((city) => city.name.en === "Seattle")?.metro).toMatchObject({ id: "census:42660", name: "Seattle-Tacoma-Bellevue, WA", populationDate: "2024-07-01", estimated: false });
    expect((await citiesOf("GB"))!.find((city) => city.name.en === "Birmingham")?.metro).toMatchObject({ id: "oecd:UK002F", name: "West Midlands", estimated: false });
    expect((await citiesOf("CN"))!.find((city) => city.name.en === "Chongqing")?.metro).toMatchObject({ population: 16344000, populationDate: "2020-11-01", estimated: false });
    expect((await citiesOf("IN"))!.find((city) => city.name.en === "Mumbai")?.metro).toMatchObject({ name: "Greater Mumbai UA", population: 18394912, estimated: false });
    expect((await citiesOf("JP"))!.find((city) => city.name.en === "Kyoto")).toMatchObject({ metro: { estimated: true }, rankEstimated: true });
    // A country with no official areas ranks by the cities' own figures, marked as estimates.
    expect((await citiesOf("RU"))!.find((city) => city.name.en === "Moscow")).toMatchObject({ metro: null, rankEstimated: true });
    expect((await citiesOf("CA"))!.find((city) => city.name.en === "Toronto")?.rankEstimated).toBe(false);
    // An urban area's figure is used even below the city's own (Ulsan); no name ends in the kind of area.
    expect((await citiesOf("KR"))!.find((city) => city.name.en === "Ulsan")?.metro?.id).toBe("oecd:KOR07F");
    for (const code of ["CA", "GB", "US", "CN", "IN"]) for (const city of (await citiesOf(code))!) if (city.metro?.estimated === false) expect(city.metro.name, city.name.en).not.toMatch(/(functional )?urban area$|census (metropolitan area|agglomeration)$/);
    // The common English name, not the formal one; no figure of 750 for Malatya.
    expect((await citiesOf("MX"))!.some((city) => city.name.en === "Heroica Puebla de Zaragoza")).toBe(false);
    expect((await citiesOf("TR"))!.find((city) => city.name.en === "Malatya")?.population).toBeGreaterThan(100000);
  });
});

describe("what is no city", () => {
  it("names no unit or part of a city as one: a city whose name ends in such a word is a capital, or a municipality that is the town", async () => {
    const set = await loadCities("capitals", "1m", "100k", "15k");
    const unit = /\s(County|Subdistrict|Sub-district|Microdistrict|Raion|Governorate|Territory|Region|Area|District|Borough|Municipality)$|^(London|Royal) Borough of /i;
    const part = /^(?:(?:first|second|third|fourth|fifth|sixth|seventh|eighth) sector|Zone \d+|Municipality \d+|(?:North|South|East|West|Central) borough) of /i;
    const found = set.cities.filter((city) => city.capital === null && !city.name.en.includes(",") && (unit.test(city.name.en.replace(/\s*\([^)]*\)\s*/g, " ").trim()) || part.test(city.name.en)));
    expect(found.map((city) => `${city.id} ${city.name.en}`)).toEqual([]);
    // Each answers with its town or the city holding it.
    expect((await cityById("Q3479066"))?.name.en).toBe("Marseille");
    expect((await cityById("Q2076557"))?.name.en).toBe("Baku");
    expect((await cityById("Q27135"))?.name.en).toBe("Bisha");
    expect((await cityById("Q391980"))?.name.en).toBe("Trieste");
  });

  it("gives no city the Japanese name of a larger subdivision it is not the capital of, nor a country's", async () => {
    const { allSubdivisions } = await import("./subdivisions");
    const { countries } = await import("./index");
    const set = await loadCities("capitals", "1m", "100k", "15k");
    const units = new Map(allSubdivisions().filter((one) => /[州県省]$/.test(one.name.ja ?? "")).map((one) => [`${one.country} ${one.name.ja}`, one.code]));
    // A town of a country's own name (Armenia, Colombia; Lebanon, Pennsylvania) rightly shares its Japanese name.
    const nations = new Map(countries().map((one) => [one.name.ja, one.name.en]));
    const wrong = set.cities.filter((city) => {
      if (city.name.ja === undefined) return false;
      const code = units.get(`${city.country} ${city.name.ja}`);
      if (code !== undefined && code !== null && !city.capitalOf.includes(code)) return true;
      const nation = nations.get(city.name.ja);
      // Columbia, Taï and Chili sound as Colombia, Thailand and Chile do in Japanese, and are written so.
      return nation !== undefined && nation !== city.name.en && !["Q38453", "Q59670", "Q397905", "Q5675279", "Q3516529", "Q2412213"].includes(city.id);
    });
    expect(wrong.map((city) => `${city.id} ${city.name.en} ${city.name.ja}`)).toEqual([]);
  });
});
