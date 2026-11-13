import { describe, expect, it } from "vitest";

import { buildCityFacts, CITY_ELEVATION_DROPPED, CITY_ZONES } from "../scripts/city-facts.ts";
import type { CityFactsInput } from "../scripts/city-facts.ts";
import { citiesOf } from "./cities";
import type { City } from "./cities";
import type { CityRow } from "./city-rows";
import { capitalCities } from "./cities/capitals";
import { cities1m } from "./cities/1m";
import { country } from "./index";
import { CITY_LOADERS } from "./data/city-loaders.data";
import { ZONE_ROWS } from "./data/zones.data";
import { distanceKm, facts } from "./facts";
import { subdivisionTimeZone } from "./zones";

const of = async (code: string): Promise<readonly City[]> => (await citiesOf(code)) ?? [];
const all = async (): Promise<City[]> => (await Promise.all(Object.values(CITY_LOADERS).map(async (load) => (await load()).CITIES))).flat();

const named = (list: readonly City[], id: string): City => {
  const city = list.find((one) => one.id === id);
  if (city === undefined) throw new Error(`no city ${id}`);

  return city;
};

// The hour on the clock of a zone at one instant, as the card shows it.
const hourIn = (zone: string, instant: string): number => Number(new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", hourCycle: "h23" }).format(new Date(instant)));
// A zone's clock for the year: its UTC offset in January and in July of 2026. Two zones with one clock agree on the time all year.
const clockOf = (zone: string): string => {
  const at = (month: number): string => new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(new Date(Date.UTC(2026, month, 15, 12))).find((part) => part.type === "timeZoneName")!.value;

  return `${at(0)} ${at(6)}`;
};

describe("a city's time zone", () => {
  it("is the IANA zone a page can give a date formatter, with the clock to show for it", async () => {
    const tokyo = named(await of("JP"), "Q1490");
    expect(tokyo.timeZone).toBe("Asia/Tokyo");
    expect(tokyo.timeZoneEstimated).toBe(false);
    const seattle = named(await of("US"), "Q5083");
    expect(seattle.timeZone).toBe("America/Los_Angeles");
    // 12:00 UTC on 15 January 2026 is 21:00 in Tokyo and 04:00 in Seattle.
    expect(hourIn(tokyo.timeZone!, "2026-01-15T12:00:00Z")).toBe(21);
    expect(hourIn(seattle.timeZone!, "2026-01-15T12:00:00Z")).toBe(4);
  });

  it("is a zone of the city's country (or of the territory it is in), and one the runtime accepts: every city's", async () => {
    const wrong: string[] = [];
    const zones = new Set<string>();
    for (const city of await all()) {
      if (city.timeZone === undefined) continue;
      zones.add(city.timeZone);
      // A territory with a country code of its own (US-PR, Puerto Rico) keeps that country's zone.
      const territory = city.subdivision?.split("-")[1];
      const listed = new Set([...(country(city.country)?.zones ?? []), facts(city.country)?.capitalZone ?? "", ...(territory?.length === 2 ? (country(territory)?.zones ?? []) : [])]);
      if (!listed.has(city.timeZone)) wrong.push(`${city.id} ${city.name.en} (${city.country}): ${city.timeZone}`);
    }
    expect(wrong).toEqual([]);
    expect(zones.size).toBeGreaterThan(300);
    for (const zone of zones) expect(() => new Intl.DateTimeFormat("en", { timeZone: zone }), zone).not.toThrow();
  });

  it("is the one zone of a country with one, never an estimate", async () => {
    for (const code of ["JP", "KR", "IN", "CN", "GB", "FR"]) {
      const zones = new Set(ZONE_ROWS.filter((row) => row[0] === code).map((row) => row[3]));
      if (zones.size !== 1) continue;
      for (const city of await of(code)) {
        expect(city.timeZone, `${city.name.en} ${code}`).toBe([...zones][0]);
        expect(city.timeZoneEstimated).toBe(false);
      }
    }
    expect((await of("JP")).every((city) => city.timeZone === "Asia/Tokyo" && !city.timeZoneEstimated)).toBe(true);
  });

  // The cities a review found given the wrong clock when a coarse zone from another source overrode a finer one.
  it.each([
    ["Odesa", "UA", "Q1874", "Europe/Kyiv"],
    ["Kherson", "UA", "Q156732", "Europe/Kyiv"],
    ["Mykolaiv", "UA", "Q41572", "Europe/Kyiv"],
    ["Saratov", "RU", "Q5332", "Europe/Saratov"],
    ["Ulyanovsk", "RU", "Q5627", "Europe/Ulyanovsk"],
    ["Astrakhan", "RU", "Q3927", "Europe/Astrakhan"],
    ["Barnaul", "RU", "Q6014", "Asia/Barnaul"],
    ["Gorno-Altaysk", "RU", "Q6025", "Asia/Barnaul"],
    ["Denpasar", "ID", "Q11506", "Asia/Makassar"],
    ["Mataram", "ID", "Q14126", "Asia/Makassar"],
    ["Banjarmasin", "ID", "Q14182", "Asia/Makassar"],
    ["Khovd", "MN", "Q731256", "Asia/Hovd"],
    ["Eirunepé", "BR", "Q1646910", "America/Eirunepe"],
    ["Tabatinga", "BR", "Q22060342", "America/Eirunepe"],
    ["Sena Madureira", "BR", "Q1754389", "America/Rio_Branco"],
    ["Punta Arenas", "CL", "Q51599", "America/Punta_Arenas"],
    ["Coyhaique", "CL", "Q3810", "America/Coyhaique"],
    ["Heroica Matamoros", "MX", "Q738353", "America/Matamoros"],
    ["Ciudad Juárez", "MX", "Q26590", "America/Ciudad_Juarez"],
    ["Ojinaga", "MX", "Q1971351", "America/Ojinaga"],
    ["Waitangi", "NZ", "Q1809774", "Pacific/Chatham"],
    ["Arawa", "PG", "Q626729", "Pacific/Bougainville"],
    ["Coffs Harbour", "AU", "Q604283", "Australia/Sydney"],
    ["Shigatse", "CN", "Q1211183", "Asia/Shanghai"],
    ["Jiayuguan", "CN", "Q532560", "Asia/Shanghai"],
    ["Vincennes", "US", "Q585857", "America/Indiana/Vincennes"],
    ["Jasper", "US", "Q941441", "America/Indiana/Indianapolis"],
    ["Anchorage", "US", "Q39450", "America/Anchorage"],
    ["Fairbanks", "US", "Q79638", "America/Anchorage"],
    ["El Paso", "US", "Q16562", "America/Denver"],
    ["Astana", "KZ", "Q1520", "Asia/Almaty"],
    ["Atyrau", "KZ", "Q486913", "Asia/Atyrau"],
    ["Kyzylorda", "KZ", "Q491123", "Asia/Qyzylorda"],
    ["Kostanay", "KZ", "Q488990", "Asia/Qostanay"],
  ])("gives %s (%s, %s) %s", async (_name, code, id, zone) => {
    expect(named(await of(code), id).timeZone).toBe(zone);
  });

  it("gives Puerto Vallarta the clock of Bahía de Banderas, which is Mexico City's now", async () => {
    const city = named(await of("MX"), "Q853258");
    expect(clockOf(city.timeZone!)).toBe(clockOf("America/Bahia_Banderas"));
  });

  it("is told apart in a country with several zones", async () => {
    const us = await of("US");
    expect(named(us, "Q18094").timeZone).toBe("Pacific/Honolulu");
    // Arizona keeps no daylight saving time; Indianapolis and Louisville have zones of their own.
    expect(named(us, "Q16556").timeZone).toBe("America/Phoenix");
    expect(named(us, "Q6346").timeZone).toBe("America/Indiana/Indianapolis");
    expect(named(us, "Q43668").timeZone).toBe("America/Kentucky/Louisville");
    const canada = await of("CA");
    expect(named(canada, "Q172").timeZone).toBe("America/Toronto");
    expect(named(canada, "Q2123").timeZone).toBe("America/Regina");
    expect(named(canada, "Q2141").timeZone).toBe("America/Halifax");
    expect(named(await of("AU"), "Q3183").timeZone).toBe("Australia/Perth");
    const kathmandu = named(await of("NP"), "Q3037");
    expect(kathmandu.timeZone).toBe("Asia/Kathmandu");
    expect(hourIn(kathmandu.timeZone!, "2026-01-15T12:00:00Z")).toBe(17);
    expect(named(await of("SD"), "Q1963").timeZone).toBe("Africa/Khartoum");
    expect(named(await of("SS"), "Q1947").timeZone).toBe("Africa/Juba");
  });

  it("is the same in every tier and every country's file", async () => {
    const tiers = [...capitalCities(), ...cities1m()];
    for (const code of ["US", "JP", "CA", "BR"]) {
      const own = new Map((await of(code)).map((city) => [city.id, city]));
      for (const city of tiers.filter((one) => one.country === code)) {
        const same = own.get(city.id);
        expect(same?.timeZone, city.id).toBe(city.timeZone);
        expect(same?.timeZoneEstimated).toBe(city.timeZoneEstimated);
        expect(same?.elevation).toBe(city.elevation);
      }
    }
  });

  // The correctness check: no city that says its zone is not an estimate has a different clock, all year, from the zone of its
  // subdivision where one source names it alone, or from the zone.tab city it is within 15 km of.
  it("keeps the clock of its subdivision and of the zone.tab city beside it, where it is not an estimate", async () => {
    const wrong: string[] = [];
    let checkedSubdivision = 0;
    let checkedCity = 0;
    for (const city of await all()) {
      if (city.timeZone === undefined || city.timeZoneEstimated !== false) continue;
      const own = city.subdivision === null ? null : subdivisionTimeZone(city.subdivision);
      if (own !== null && !own.estimated) {
        checkedSubdivision += 1;
        if (clockOf(own.zone) !== clockOf(city.timeZone)) wrong.push(`${city.id} ${city.name.en} ${city.timeZone} against its subdivision ${own.zone}`);
      }
      const beside = ZONE_ROWS.filter((row) => row[0] === city.country && distanceKm(city, { lat: row[1], lon: row[2] }) <= 15);
      for (const row of beside) {
        checkedCity += 1;
        if (clockOf(row[3]) !== clockOf(city.timeZone)) wrong.push(`${city.id} ${city.name.en} ${city.timeZone} against the zone.tab city beside it, ${row[3]}`);
      }
    }
    expect(wrong).toEqual([]);
    expect(checkedSubdivision).toBeGreaterThan(1000);
    expect(checkedCity).toBeGreaterThan(300);
  });

  it("pins the counts: how many cities are given a zone by each way, and how many are estimates", async () => {
    const list = await all();
    const withZone = list.filter((city) => city.timeZone !== undefined);
    expect(list).toHaveLength(29982);
    expect(withZone).toHaveLength(29982);
    expect(withZone.filter((city) => city.timeZoneEstimated).length).toBe(13563);
    expect(withZone.filter((city) => !city.timeZoneEstimated).length).toBe(16419);
    // An estimate is only ever made for a city of a country with several zones.
    for (const city of withZone.filter((one) => one.timeZoneEstimated)) {
      const zones = new Set([...(country(city.country)?.zones ?? [])]);
      expect(zones.size, `${city.name.en} ${city.country}`).toBeGreaterThan(1);
    }
    expect(Object.keys(CITY_ZONES)).toHaveLength(3);
  });
});

// Made-up cities for the rules, not the data: [item, lat, lon, population, date, country, subdivision, en, ja, native, language, capital, capitalOf, sources].
const row = (item: number, lat: number, lon: number, country: string, subdivision: string | null, en: string): CityRow => [item, lat, lon, 100000, null, country, subdivision, en, null, null, null, 0, null, 0];
const input = (rows: readonly CityRow[], elevations: [number, number[]][] = [], extra: Partial<CityFactsInput> = {}): CityFactsInput => ({
  rows,
  elevations: new Map(elevations),
  countryZones: (code) => (code === "AA" ? ["Test/One"] : code === "BB" ? ["Test/West", "Test/East"] : []),
  principal: new Map([["BB", [{ zone: "Test/West", at: [10, 0] }, { zone: "Test/East", at: [10, 10] }]]]),
  subdivisionZones: new Map([
    ["BB-N", { zone: "Test/West", guessed: false, split: false, capital: null, middle: null }],
    ["BB-S", { zone: "Test/East", guessed: true, split: true, capital: null, middle: null }],
  ]),
  distanceKm: (a, b) => distanceKm({ lat: a[0], lon: a[1] }, { lat: b[0], lon: b[1] }),
  ...extra,
});

describe("the rules that choose a zone", () => {
  it("take a country's one zone, then a subdivision one source names, then a zone.tab city the city is at, then the subdivision's choice, then the nearest", () => {
    const rows = [
      row(1, 0, 0, "AA", null, "Alone"),
      row(2, 50, 50, "BB", "BB-N", "Named"),
      row(3, 10.05, 9.95, "BB", "BB-S", "Beside"),
      row(4, 10, 4, "BB", "BB-S", "Chosen"),
      row(5, 10, 6, "BB", null, "Nearest"),
      row(6, 10, 1, "BB", null, "Westish"),
    ];
    const { facts: made, report } = buildCityFacts(input(rows));
    expect(made.get(1)).toMatchObject({ zone: "Test/One", guessed: false, basis: "country" });
    // A subdivision one source names alone wins over a zone.tab city beside it.
    expect(made.get(2)).toMatchObject({ zone: "Test/West", guessed: false, basis: "subdivision" });
    // Within 15 km of a zone.tab city of the country: that city's zone, not an estimate, whatever the subdivision's choice.
    expect(made.get(3)).toMatchObject({ zone: "Test/East", guessed: false, basis: "near-city" });
    expect(made.get(4)).toMatchObject({ zone: "Test/East", guessed: true, basis: "subdivision-choice" });
    expect(made.get(5)).toMatchObject({ zone: "Test/East", guessed: true, basis: "nearest" });
    expect(made.get(6)).toMatchObject({ zone: "Test/West", guessed: true });
    expect(report).toMatchObject({ zoneOfOneZoneCountry: 1, zoneOfSubdivision: 1, zoneAtZoneTabCity: 1, zoneEstimated: 3, zoneEstimatedBySubdivision: 1, zoneEstimatedInSplitSubdivision: 1, zoneEstimatedWithoutSubdivision: 2 });
  });

  it("take the zone of the zone.tab city a city is called, however far", () => {
    const { facts: made } = buildCityFacts(input([row(1, 40, 40, "BB", null, "East")], [], { principal: new Map([["BB", [{ zone: "Test/West", at: [10, 0] }, { zone: "Test/East", at: [10, 10] }]]]) }));
    expect(made.get(1)).toMatchObject({ zone: "Test/East", guessed: false, basis: "near-city" });
  });

  it("give none to a country with no zone", () => {
    const { facts: made, report } = buildCityFacts(input([row(1, 0, 0, "CC", null, "Nowhere")]));
    expect(made.get(1)).toMatchObject({ zone: null, guessed: false });
    expect(report.zoneNone).toBe(1);
  });
});

describe("the rules that choose an elevation", () => {
  // Cities in a flat country, a few kilometres apart, so that each has the others for neighbours.
  const flat = (values: (number | null)[]): CityRow[] => values.map((_, at) => row(100 + at, 10 + at * 0.05, 20, "AA", null, `Town ${at}`));
  const elevationsOf = (values: (number | null)[], extra: [number, number[]][] = []): Map<number | string, { elevation: number | null }> =>
    buildCityFacts(input(flat(values), [...values.flatMap((value, at) => (value === null ? [] : [[100 + at, [value]] as [number, number[]]])), ...extra])).facts;

  it("keep the one value a city has, whole, and the middle of several within 50 m", () => {
    const made = buildCityFacts(input(flat([null, null, null]), [[100, [20.4]], [101, [10, 30, 50]], [102, [0, 100]]])).facts;
    expect(made.get(100)?.elevation).toBe(20);
    expect(made.get(101)?.elevation).toBe(30);
    // 100 m between two values: a range or a mistake, so none.
    expect(made.get(102)?.elevation).toBeNull();
  });

  it("leave out a value no land has, and keep one below sea level", () => {
    const made = buildCityFacts(input(flat([null, null, null]), [[100, [-500]], [101, [6000]], [102, [-258]]])).facts;
    expect(made.get(100)?.elevation).toBeNull();
    expect(made.get(101)?.elevation).toBeNull();
    expect(made.get(102)?.elevation).toBe(-258);
  });

  it("drop a value more than 500 m from the cities round it when three or more of them agree within 150 m", () => {
    const made = elevationsOf([20, 25, 30, 40, 1667]);
    expect(made.get(104)?.elevation).toBeNull();
    for (const at of [100, 101, 102, 103]) expect(made.get(at)?.elevation, `${at}`).not.toBeNull();
  });

  it("keep it with fewer than three cities round it, or where they do not agree: a mountain town above its valley", () => {
    // Two neighbours only.
    expect(elevationsOf([20, 25, 1667]).get(102)?.elevation).toBe(1667);
    // Four neighbours 300 m apart.
    expect(elevationsOf([20, 150, 320, 40, 1667]).get(104)?.elevation).toBe(1667);
  });

  it("never drop a value below sea level, however far it is from the cities round it (Jericho beside Jerusalem)", () => {
    expect(elevationsOf([750, 775, 790, 810, -258]).get(104)?.elevation).toBe(-258);
  });

  it("do not count the highest and the lowest of six or more neighbours, which may be bad values too", () => {
    const made = elevationsOf([10, 189, 16, 20, 26, 27, 30, 2286]);
    expect(made.get(107)?.elevation).toBeNull();
    // Two of the six agree with nobody but themselves: one bad value, but the others keep theirs.
    expect(made.get(101)?.elevation).toBe(189);
  });

  it("leave out by id a value known to be wrong, and refuse an id that has none", () => {
    const rows = [row(100, 10, 20, "AA", null, "Town"), row(101, 10.05, 20, "AA", null, "Other")];
    const made = buildCityFacts(input(rows, [[100, [1667]], [101, [200]]], { droppedElevations: { Q100: "a reason" } }));
    expect(made.facts.get(100)?.elevation).toBeNull();
    expect(made.facts.get(101)?.elevation).toBe(200);
    expect(made.report.elevationDroppedById).toBe(1);
    expect(() => buildCityFacts(input(rows, [[101, [200]]], { droppedElevations: { Q100: "a reason" } }))).toThrow(/no elevation/);
    expect(() => buildCityFacts(input(rows, [[100, [5]]], { droppedElevations: { Q999: "a reason" } }))).toThrow(/no city/);
    expect(Object.keys(CITY_ELEVATION_DROPPED)).toHaveLength(5);
  });

  it("leave out the five known-wrong values the rule cannot catch", async () => {
    const find = async (code: string, id: string): Promise<City | undefined> => (await of(code)).find((one) => one.id === id);
    for (const [code, id] of [["US", "Q694545"], ["GL", "Q191047"], ["US", "Q577511"], ["US", "Q755102"], ["ET", "Q100928375"]] as const) expect((await find(code, id))?.elevation, id).toBeUndefined();
  });

  it("drop the single bad values of the cities a review found, in the data, and keep the real ones below sea level", async () => {
    const find = (list: readonly City[], id: string): City | undefined => list.find((one) => one.id === id);
    const us = await citiesOf("US");
    for (const id of ["Q2153666", "Q2110162", "Q3098591", "Q953543", "Q260282"]) expect(find(us!, id)?.elevation, id).toBeUndefined();
    expect(find((await citiesOf("KR"))!, "Q42071")?.elevation).toBeUndefined();
    expect(find((await citiesOf("PS"))!, "Q5687")?.elevation).toBe(-275);
    expect(find((await citiesOf("IL"))!, "Q151920")?.elevation).toBe(-200);
    expect(find((await citiesOf("AZ"))!, "Q9248")?.elevation).toBe(-28);
  });
});

describe("a city's elevation", () => {
  it("is Wikidata's height above sea level in whole metres, where it has one", async () => {
    expect(named(await of("MX"), "Q1489").elevation).toBe(2240);
    const us = await of("US");
    expect(named(us, "Q16554").elevation).toBe(1609);
    expect(named(us, "Q5083").elevation).toBe(40);
    expect(named(await of("NP"), "Q3037").elevation).toBe(1300);
    for (const city of await all()) if (city.elevation !== undefined) expect(Number.isInteger(city.elevation), city.name.en).toBe(true);
  });

  it("is left out, not made up, where Wikidata has none, and for a place only Natural Earth has", async () => {
    const list = await all();
    for (const city of list.filter((one) => one.id.startsWith("ne:"))) expect(city.elevation, city.id).toBeUndefined();
    // Pinned: how many cities have one.
    expect(list.filter((city) => city.elevation !== undefined)).toHaveLength(17183);
  });

  it("keeps to what land has", async () => {
    const list = await all();
    for (const city of list) if (city.elevation !== undefined) expect(city.elevation, `${city.name.en} ${city.country}`).toBeGreaterThanOrEqual(-430);
    for (const city of list) if (city.elevation !== undefined) expect(city.elevation, `${city.name.en} ${city.country}`).toBeLessThanOrEqual(5500);
    expect(list.some((city) => (city.elevation ?? 0) < 0)).toBe(true);
  });
});

describe("a city's language", () => {
  it("is its country's, which kuni already holds", () => {
    expect(country("JP")?.languages).toEqual(["ja"]);
    expect(country("CA")?.languages).toEqual(expect.arrayContaining(["en", "fr"]));
  });
});
