import { describe, expect, it } from "vitest";

import { buildCities, cityAliases, unresolvedIds } from "../scripts/cities.ts";
import type { CitiesSnapshot, NaturalEarthFile } from "../scripts/cities.ts";

// A snapshot of a few made-up cities, for the rules that choose and join, not for the data.
const item = (number: number, en: string | null, ja: string | null, point: [number, number] | null, country: string | null, pops: [number, string | null][], subs: string[] = [], capitals: string[] = [], native: [string, string] | null = null): CitiesSnapshot["items"][number] => [number, en, ja, native?.[0] ?? null, native?.[1] ?? null, point, country, pops, subs, capitals];
const snapshot = (items: CitiesSnapshot["items"]): CitiesSnapshot => ({ read: "2026-11-11", floor: 15000, counts: {}, items });
const place = (id: string | null, name: string, ja: string | null, lat: number, lon: number, pop: number | null, kind: string, iso: string | null, neId: number | null = 1): NaturalEarthFile["places"][number] => [id, name, name, ja, lat, lon, pop, kind, iso, neId];
const natural = (places: NaturalEarthFile["places"]): NaturalEarthFile => ({ release: "5.1.2", places });
const levels = new Map([["JP-13", 1], ["JP-27", 1], ["FR-IDF", 1], ["FR-75", 2]]);
const countries = new Set(["JP", "FR", "BR"]);
const build = (items: CitiesSnapshot["items"], places: NaturalEarthFile["places"] = [], capitalNames?: Map<string, string>) => buildCities({ snapshot: snapshot(items), naturalEarth: natural(places), levels, countries, capitalNames });

describe("the tiers", () => {
  it("hold every capital in capitals, at any size, and every city by population in the others, capitals too, at the thresholds", () => {
    const { tiers } = build([
      item(1, "Capital", null, [1, 1], "FR", [[900, "2020-01-01"]], [], ["FR"]),
      item(2, "Million", null, [2, 2], "FR", [[1000000, "2020-01-01"]]),
      item(3, "AlmostMillion", null, [3, 3], "FR", [[999999, "2020-01-01"]]),
      item(4, "Hundred", null, [4, 4], "FR", [[100000, "2020-01-01"]]),
      item(5, "Fifteen", null, [5, 5], "FR", [[15000, "2020-01-01"]]),
      item(6, "Small", null, [6, 6], "FR", [[14999, "2020-01-01"]]),
      item(7, "NoFigure", null, [7, 7], "FR", []),
      item(8, "SubCapital", null, [8, 8], "FR", [[5000, null]], [], ["FR-IDF"]),
      item(9, "BigSubCapital", null, [9, 9], "FR", [[3000000, null]], [], ["FR-IDF"]),
    ]);
    // Most populous first.
    expect(tiers.capitals.map((row) => row[7])).toEqual(["BigSubCapital", "SubCapital", "Capital"]);
    expect(tiers.capitals.map((row) => row[11])).toEqual([2, 2, 1]);
    expect(tiers["1m"].map((row) => row[7])).toEqual(["BigSubCapital", "Million"]);
    expect(tiers["100k"].map((row) => row[7])).toEqual(["AlmostMillion", "Hundred"]);
    expect(tiers["15k"].map((row) => row[7])).toEqual(["Fifteen"]);
  });

  it("leave out what has no name, no point, no country or no figure, and count each", () => {
    const { tiers, report } = build([
      item(1, null, null, [1, 1], "FR", [[50000, null]]),
      item(2, "NoPoint", null, null, "FR", [[50000, null]]),
      item(3, "NoCountry", null, [3, 3], null, [[50000, null]]),
      item(4, "Unlisted", null, [4, 4], "ZZ", [[50000, null]]),
      item(5, "NoFigure", null, [5, 5], "FR", []),
      item(6, "Small", null, [6, 6], "FR", [[50, null]]),
      item(7, "Fine", null, [7, 7], "FR", [[50000, null]]),
    ]);
    expect(Object.values(tiers).flat().map((row) => row[7])).toEqual(["Fine"]);
    expect(report.leftOut).toEqual({ noName: 1, noPoint: 1, noCountry: 2, noPopulation: 1, belowFloor: 1, area: 0, duplicate: 0, township: 0 });
  });
});

describe("areas that are not cities", () => {
  it("leaves out an item named for an area or an administrative unit, unless it is a capital or Natural Earth names it", () => {
    const { tiers, report } = build(
      [
        item(1, "Lyon metropolitan area", null, [1, 1], "FR", [[2000000, null]]),
        item(2, "Konya Province", null, [2, 2], "FR", [[2200000, null]]),
        item(3, "Muan County", null, [3, 3], "FR", [[90000, null]]),
        item(4, "City of Ekurhuleni", null, [4, 4], "FR", [[3000000, null]]),
        item(5, "Kept Province", null, [5, 5], "FR", [[400000, null]], [], ["FR-IDF"]),
        item(6, "Named District", null, [6, 6], "FR", [[400000, null]]),
        item(7, "Countyville", null, [7, 7], "FR", [[400000, null]]),
        item(8, "Greater São Paulo", null, [8, 8], "FR", [[20000000, null]]),
        item(9, "Greater Sudbury", null, [9, 9], "FR", [[160000, null]]),
        item(10, "Rhine-Ruhr Metropolitan Region", null, [10, 10], "FR", [[12000000, null]]),
        item(11, "Prague 5", null, [11, 11], "FR", [[90000, null]]),
        item(12, "Sector 3", null, [12, 12], "FR", [[400000, null]]),
      ],
      [place("Q6", "Named District", null, 6, 6, 1, "Populated place", "FR")],
    );
    expect([...new Set(Object.values(tiers).flat().map((row) => row[7]))].sort()).toEqual(["Countyville", "Greater Sudbury", "Kept Province", "Named District"]);
    expect(report.leftOut.area).toBe(8);
  });

  it("leaves out regions, corridors, planned zones and the units round a city, and keeps a town told apart by its region", () => {
    const areas = [
      "Metropolitan Toronto",
      "Metro Manila",
      "Metropolis of Lyon",
      "Commune Mutimbuzi",
      "Commune of Bwambarangwe",
      "Sectorul Botanica",
      "Regional Municipality of Peel",
      "Øresund Region",
      "Kurdistan Region of Iraq",
      "North East State of Somalia",
      "Podgorica Capital City",
      "Front Range Urban Corridor",
      "Binhai New Area",
    ];
    const towns = ["Paxtaobod, Andijan Region", "Metropolis", "Metrotown", "Regina", "Statesboro", "Capitol Heights"];
    const { tiers, report } = build([
      ...[...areas, ...towns].map((en, at) => item(at + 1, en, null, [at, at], "FR", [[200000, null]])),
      item(103927888, "Moro", null, [50, 50], "FR", [[6310129, null]]),
    ]);
    expect([...new Set(Object.values(tiers).flat().map((row) => row[7]))].sort()).toEqual([...towns].sort());
    expect(report.leftOut.area).toBe(areas.length + 1);
  });
});

describe("metropolitan areas", () => {
  it("give a city the metro that carries its name or is named after it, the first city named in a shared one, and rank by it", () => {
    const { tiers, report } = buildCities({
      snapshot: snapshot([
        item(1, "Vancouver", null, [49.26, -123.11], "FR", [[662248, "2021-01-01"]]),
        item(2, "Surrey", null, [49.19, -122.85], "FR", [[568322, "2021-01-01"]]),
        item(3, "Calgary", null, [51.05, -114.07], "FR", [[1306784, "2021-01-01"]]),
        item(4, "Dallas", null, [32.78, -96.8], "FR", [[1304379, "2020-04-01"]]),
        item(5, "Fort Worth", null, [32.75, -97.33], "FR", [[918915, "2020-04-01"]]),
        item(6, "Düsseldorf", null, [51.23, 6.78], "FR", [[629047, "2022-12-31"]]),
        item(7, "Smallton", null, [10, 10], "FR", [[200000, null]]),
      ]),
      naturalEarth: natural([]),
      levels,
      countries,
      metros: {
        read: "2026-11-11",
        links: [
          [1, 101, "P150"],
          [2, 101, "P150"],
          [4, 102, "P8138"],
          [5, 102, "P8138"],
          [6, 103, "P361"],
          [7, 104, "P138"],
        ],
        areas: [
          [101, "Metro Vancouver Regional District", [[2463431, "2021-01-01"]]],
          [102, "Dallas–Fort Worth metroplex", [[7637387, "2020-04-01"]]],
          [103, "Rhine-Ruhr Metropolitan Region", [[10000000, null]]],
          [104, "Lake Region", [[150000, null]]],
        ],
      },
    });
    const rows = Object.values(tiers).flat();
    const metroOf = (en: string) => {
      const row = rows.find((one) => one[7] === en)!;

      return row.length > 14 ? [row[14], row[15], row[16]] : null;
    };
    expect(metroOf("Vancouver")).toEqual([101, "Metro Vancouver Regional District", 2463431]);
    expect(metroOf("Surrey")).toBeNull();
    expect(metroOf("Dallas")).toEqual([102, "Dallas–Fort Worth metroplex", 7637387]);
    expect(metroOf("Fort Worth")).toBeNull();
    expect(metroOf("Düsseldorf")).toBeNull();
    // Named after the city, but smaller than it: no metro.
    expect(metroOf("Smallton")).toBeNull();
    expect(report.withMetro).toBe(2);
    // The order of a tier: the metro's people where there is one, else the city's own.
    expect(tiers["100k"].map((row) => row[7])).toEqual(["Vancouver", "Fort Worth", "Düsseldorf", "Surrey", "Smallton"]);
    expect(tiers["1m"].map((row) => row[7])).toEqual(["Dallas", "Calgary"]);
  });
});

describe("civil townships", () => {
  it("leave out every township of the states where townships are civil units, and keep a municipal township", () => {
    const us = (number: number, en: string, state: string, point: [number, number], people: number) => item(number, en, null, point, "US", [[people, "2020-04-01"]], [state]);
    const { tiers, report } = buildCities({
      snapshot: snapshot([
        us(9040893, "Kaw Township", "US-MO", [39.06, -94.55], 183073),
        us(41819, "Kansas City", "US-MO", [39.1, -94.58], 508090),
        us(2550281, "Clinton Township", "US-MI", [42.58, -82.92], 100513),
        us(166000, "Sterling Heights", "US-MI", [42.58, -83.03], 134346),
        us(1087213, "Toms River", "US-NJ", [39.95, -74.2], 95438),
        us(7, "Quiet Township", "US-IL", [41, -89], 30000),
      ]),
      naturalEarth: natural([]),
      levels: new Map([["US-MO", 1], ["US-MI", 1], ["US-NJ", 1], ["US-IL", 1]]),
      countries: new Set(["US"]),
    });
    // Every township of a civil-township state goes, one with no city near too (its id answers with none).
    expect([...new Set(Object.values(tiers).flat().map((row) => row[7]))].sort()).toEqual(["Clinton Township", "Kansas City", "Sterling Heights", "Toms River"]);
    expect(report.townshipCities).toEqual({ Q9040893: "Q41819", Q7: null });
    expect(report.leftOut.township).toBe(2);
  });
});

describe("the capitals", () => {
  it("allow one national capital a country: kuni's own capital among those Wikidata names, the others alternates", () => {
    const { rows, report } = build(
      [
        item(1, "Pretoria", null, [1, 1], "FR", [[700000, null]], [], ["FR"]),
        item(2, "Cape Town", null, [2, 2], "FR", [[4000000, null]], [], ["FR", "FR-IDF"]),
        item(3, "Bloemfontein", null, [3, 3], "FR", [[500000, null]], [], ["FR"]),
        item(4, "Kyoto", null, [4, 4], "JP", [[1400000, null]], ["JP-13"]),
        item(5, "Tokyo", null, [5, 5], "JP", [[14000000, null]], ["JP-13"], ["JP"]),
        item(6, "Lagos", null, [6, 6], "BR", [[9000000, null]]),
        item(7, "Abuja", null, [7, 7], "BR", [[3000000, null]]),
      ],
      [
        place("Q1", "Pretoria", null, 1, 1, 700000, "Admin-0 capital", "FR", 11),
        place("Q4", "Kyoto", null, 4, 4, 1400000, "Admin-0 capital alt", "JP", 12),
        place("Q6", "Lagos", null, 6, 6, 9000000, "Admin-0 capital alt", "BR", 13),
        place("Q7", "Abuja", null, 7, 7, 3000000, "Admin-0 capital", "BR", 14),
      ],
    );
    const of = (name: string) => rows.find((row) => row[7] === name)!;
    expect([of("Pretoria")[11], of("Pretoria")[12]]).toEqual([1, "FR"]);
    // Cape Town is the legislative capital: an alternate of the country, and a subdivision's capital too.
    expect([of("Cape Town")[11], of("Cape Town")[12]]).toEqual([3, "FR FR-IDF"]);
    expect([of("Bloemfontein")[11], of("Bloemfontein")[12]]).toEqual([3, "FR"]);
    // Natural Earth's "alt" is not enough where Wikidata names a capital of the country: Kyoto is only a city.
    expect([of("Kyoto")[11], of("Kyoto")[12]]).toEqual([0, null]);
    expect([of("Tokyo")[11], of("Tokyo")[12]]).toEqual([1, "JP"]);
    expect([of("Lagos")[11], of("Lagos")[12]]).toEqual([3, "BR"]);
    expect([of("Abuja")[11], of("Abuja")[12]]).toEqual([1, "BR"]);
    for (const code of ["FR", "JP", "BR"]) expect(rows.filter((row) => row[5] === code && row[11] === 1).length, code).toBe(1);
    expect(report.capitals).toMatchObject({ national: 3, alternate: 3 });
  });

  it("put the national capital of a territory with a code of its own in that country, whatever the item's country says", () => {
    const { rows } = build([item(1, "Gibraltar", null, [36, -5], "FR", [[30000, null]], [], ["BR"])]);
    expect([rows[0]![5], rows[0]![11], rows[0]![12]]).toEqual(["BR", 1, "BR"]);
  });

  it("choose the capital kuni's own list of countries names, then Natural Earth's, then the most populous", () => {
    const items: CitiesSnapshot["items"] = [item(1, "Pretoria", null, [1, 1], "FR", [[700000, null]], [], ["FR"]), item(2, "Cape Town", null, [2, 2], "FR", [[4000000, null]], [], ["FR"]), item(3, "Johannesburg", null, [3, 3], "FR", [[5000000, null]])];
    const places = [place("Q3", "Johannesburg", null, 3, 3, 5000000, "Admin-0 capital", "FR", 3)];
    const national = (names?: Map<string, string>) => build(items, places, names).rows.filter((row) => row[11] === 1).map((row) => row[7]);
    expect(national(new Map([["FR", "Pretoria"]]))).toEqual(["Pretoria"]);
    expect(national(new Map([["FR", "Cape Town"]]))).toEqual(["Cape Town"]);
    // With no name to go by, the most populous Wikidata names. Natural Earth's Johannesburg is no candidate: Wikidata names others.
    expect(national()).toEqual(["Cape Town"]);
  });

  it("is not taken in by a former country's code: Djibouti is not the capital of Anguilla", () => {
    const { rows } = build([item(1, "Djibouti", null, [11, 43], "BR", [[600000, null]], [], ["BR", "FR"]), item(2, "The Valley", null, [18, -63], "FR", [[1000, null]], [], ["FR"])]);
    const national = Object.fromEntries(rows.filter((row) => row[11] === 1).map((row) => [row[5], row[7]]));
    expect(national).toEqual({ BR: "Djibouti", FR: "The Valley" });
  });

  it("make the most populous the national capital where Natural Earth names none", () => {
    const { rows } = build([item(1, "Small", null, [1, 1], "FR", [[10000, null]], [], ["FR"]), item(2, "Large", null, [2, 2], "FR", [[900000, null]], [], ["FR"])]);
    expect(rows.filter((row) => row[11] === 1).map((row) => row[7])).toEqual(["Large"]);
    expect(rows.find((row) => row[7] === "Small")![11]).toBe(3);
  });

  it("give every capital something it is the capital of, and no other city anything", () => {
    const { rows, report } = build(
      [item(1, "Seat", null, [1, 1], "FR", [[900000, null]]), item(2, "Plain", null, [2, 2], "FR", [[900000, null]]), item(3, "Unlisted", null, [3, 3], "FR", [[900000, null]], [], ["FR-ZZ"])],
      [place("Q1", "Seat", null, 1, 1, 900000, "Admin-1 capital", "FR", 1), place("Q3", "Unlisted", null, 3, 3, 900000, "Admin-1 capital", "FR", 3)],
    );
    for (const row of rows) expect(row[11] !== 0, String(row[7])).toBe(row[12] !== null);
    // Natural Earth's word is not enough for a capital of a subdivision: no code kuni lists, no capital.
    expect(rows.find((row) => row[7] === "Seat")![11]).toBe(0);
    expect(rows.find((row) => row[7] === "Unlisted")![11]).toBe(0);
    expect(report.capitals.droppedWithoutCode).toBe(2);
  });

  it("keep the nearer of one name in one country as one city: the capital's item, else Natural Earth's, else the more populous", () => {
    const { rows, report } = build([
      item(1, "Tokyo", "東京都", [35.69, 139.69], "JP", [[14000000, null]], ["JP-13"], ["JP"]),
      item(2, "Tokyo", "東京", [35.68, 139.74], "JP", [[9000000, null]], ["JP-13"]),
      item(3, "Twin", null, [10, 10], "FR", [[500000, null]]),
      item(4, "Twin", null, [10.05, 10.05], "FR", [[800000, null]]),
      item(5, "Twin", null, [30, 30], "FR", [[600000, null]]),
      item(6, "Tiny", null, [20, 20], "FR", [[20000, null]]),
      item(7, "Tiny", null, [20.01, 20.01], "FR", [[20000, null]]),
    ]);
    expect(rows.filter((row) => row[7] === "Tokyo").map((row) => row[0])).toEqual([1]);
    expect(rows.filter((row) => row[7] === "Twin").map((row) => row[0])).toEqual([4, 5]);
    // Two small places of one name are two places: only where one is 100,000 or more are they taken for one.
    expect(rows.filter((row) => row[7] === "Tiny").length).toBe(2);
    expect(report.leftOut.duplicate).toBe(2);
  });
});

describe("the population", () => {
  it("is the latest day's, and the largest of those with no day", () => {
    const { tiers } = build([
      item(1, "Later", null, [1, 1], "FR", [[200000, "2010-04-01"], [90000, "2021-01-01"]]),
      item(2, "Undated", null, [2, 2], "FR", [[40000, null], [60000, null]]),
      item(3, "Dated", null, [3, 3], "FR", [[500, null], [70000, "2019-07-01"]]),
    ]);
    const rows = Object.fromEntries(Object.values(tiers).flat().map((row) => [row[7], row]));
    expect(rows.Later![3]).toBe(90000);
    expect(rows.Later![4]).toBe(2021);
    expect(rows.Undated![3]).toBe(60000);
    expect(rows.Undated![4]).toBeNull();
    expect(rows.Dated![4]).toBe("2019-07-01");
  });

  it("takes Natural Earth's where Wikidata has none, and says so", () => {
    const { tiers, report } = build([item(1, "Town", null, [1, 1], "JP", [])], [place("Q1", "Town", null, 1, 1, 80000, "Populated place", "JP")]);
    const row = tiers["100k"].concat(tiers["15k"])[0]!;
    expect(row[3]).toBe(80000);
    expect(row[13] & 2).toBe(2);
    expect(report.tiers["15k"].populationFromNaturalEarth).toBe(1);
  });
});

describe("the names", () => {
  it("use Wikidata's Japanese name before Natural Earth's, and never an English name for either", () => {
    const { tiers, report } = build(
      [item(1, "Both", "二つ", [1, 1], "JP", [[50000, null]]), item(2, "OnlyNe", null, [2, 2], "JP", [[50000, null]]), item(3, "Neither", null, [3, 3], "JP", [[50000, null]])],
      [place("Q1", "Both", "別名", 1, 1, 5, "Populated place", "JP"), place("Q2", "OnlyNe", "ネだけ", 2, 2, 5, "Populated place", "JP")],
    );
    const rows = Object.fromEntries(Object.values(tiers).flat().map((row) => [row[7], row]));
    expect(rows.Both![8]).toBe("二つ");
    expect(rows.Both![13] & 1).toBe(0);
    expect(rows.OnlyNe![8]).toBe("ネだけ");
    expect(rows.OnlyNe![13] & 1).toBe(1);
    expect(rows.Neither![8]).toBeNull();
    expect(report.withoutJa).toBe(1);
    expect(report.tiers["15k"].jaFromNaturalEarth).toBe(1);
  });

  it("leave out a Natural Earth Japanese name written in hiragana for a place outside Japan, and keep one for a place in Japan", () => {
    const { tiers } = build(
      [item(1, "Umm Ruwaba", null, [1, 1], "FR", [[50000, null]]), item(2, "Tsukuba", null, [2, 2], "JP", [[50000, null]])],
      [place("Q1", "Umm Ruwaba", "うーんルワバ", 1, 1, 5, "Populated place", "FR"), place("Q2", "Tsukuba", "つくば", 2, 2, 5, "Populated place", "JP")],
    );
    const rows = Object.fromEntries(Object.values(tiers).flat().map((row) => [row[7], row]));
    expect(rows["Umm Ruwaba"]![8]).toBeNull();
    expect(rows.Tsukuba![8]).toBe("つくば");
  });

  it("write 東エルサレム for East Jerusalem over Wikidata's エルサレム, and say so in the source bits", () => {
    const { rows } = build([item(212938, "East Jerusalem", "エルサレム", [31.78, 35.23], "FR", [[236000, null]])], [place("Q212938", "East Jerusalem", "東エルサレム", 31.78, 35.23, 236000, "Populated place", "FR")]);
    expect(rows[0]![8]).toBe("東エルサレム");
    expect(rows[0]![13] & 8).toBe(8);
    expect(rows[0]![13] & 1).toBe(0);
  });

  it("keep the native name only where it differs from the English one", () => {
    const { tiers } = build([item(1, "Munich", null, [1, 1], "FR", [[50000, null]], [], [], ["München", "de"]), item(2, "Paris", null, [2, 2], "FR", [[50000, null]], [], [], ["Paris", "fr"])]);
    const rows = Object.fromEntries(Object.values(tiers).flat().map((row) => [row[7], row]));
    expect([rows.Munich![9], rows.Munich![10]]).toEqual(["München", "de"]);
    expect([rows.Paris![9], rows.Paris![10]]).toEqual([null, null]);
  });
});

describe("the subdivision", () => {
  it("is the first-level one kuni lists for the country, in code order, and none otherwise", () => {
    const { tiers } = build([
      item(1, "Tokyo", null, [1, 1], "JP", [[50000, null]], ["JP-13", "FR-75", "JP-27"]),
      item(2, "Paris", null, [2, 2], "FR", [[50000, null]], ["FR-75", "FR-IDF"]),
      item(3, "Nowhere", null, [3, 3], "BR", [[50000, null]], ["BR-SP"]),
    ]);
    const rows = Object.fromEntries(Object.values(tiers).flat().map((row) => [row[7], row[6]]));
    expect(rows).toEqual({ Tokyo: "JP-13", Paris: "FR-IDF", Nowhere: null });
  });
});

describe("Natural Earth", () => {
  it("joins through the Wikidata id, and by position and name where it has none", () => {
    const { report } = build(
      [item(1, "Alpha", null, [10, 10], "FR", [[50000, null]]), item(2, "Beta", null, [20, 20], "FR", [[50000, null]])],
      [place("Q1", "Alpha", null, 10, 10, 1, "Populated place", "FR", 1), place(null, "Beta", "ベータ", 20.05, 20.05, 1, "Populated place", "FR", 2)],
    );
    expect(report.naturalEarthJoined).toBe(1);
    expect(report.naturalEarthMatchedByPlace).toBe(1);
  });

  it("moves a place that names an area to the city of its name beside it, and keeps the area's item where there is no such city", () => {
    const { tiers, report } = build(
      [
        item(1, "Jamalpur District", null, [24.92, 89.96], "FR", [[2500000, null]]),
        item(2, "Jamalpur", null, [24.9, 89.95], "FR", [[160000, null]]),
        item(3, "Kristiansand Municipality", null, [58.15, 8], "FR", [[119000, null]]),
      ],
      [
        place("Q1", "Jamalpur", null, 24.9, 89.95, 167900, "Admin-1 capital", "FR", 1),
        place("Q3", "Kristiansand", null, 58.15, 8, 100000, "Populated place", "FR", 2),
      ],
    );
    expect([...new Set(Object.values(tiers).flat().map((row) => row[0]))].sort()).toEqual([2, 3]);
    expect(report.naturalEarthToArea).toBe(1);
  });

  it("makes a city of its own, id ne:<number>, of a place Wikidata does not have, where it is a capital or 15,000 or more", () => {
    const { tiers, report } = build([], [
      place(null, "Bigville", "大町", 5, 5, 40000, "Populated place", "BR", 77),
      place(null, "Hamlet", null, 6, 6, 500, "Populated place", "BR", 78),
      place(null, "Seat", null, 7, 7, 900, "Admin-1 capital", "BR", 79),
      place(null, "Nowhere", null, 8, 8, 900000, "Populated place", null, 80),
    ]);
    expect(tiers["15k"].map((row) => row[0])).toEqual(["ne:77"]);
    // A subdivision capital needs a code kuni lists, which only Wikidata gives: Natural Earth's word alone is not enough.
    expect(tiers.capitals).toEqual([]);
    expect(tiers["15k"][0]![13]).toBe(1 | 2 | 4);
    expect(report.naturalEarthOnly).toBe(1);
  });

  it("adds a capital Wikidata names none of", () => {
    const { tiers } = build([item(1, "Capitalia", null, [1, 1], "FR", [[900000, null]])], [place("Q1", "Capitalia", null, 1, 1, 900000, "Admin-0 capital", "FR")]);
    expect(tiers.capitals[0]![11]).toBe(1);
    expect(tiers.capitals[0]![12]).toBe("FR");
  });
});

describe("ids that never change", () => {
  it("name an id an earlier release had that this one has lost, unless it has an alias or was retired", () => {
    const current = new Set(["Q1", "Q3"]);
    expect(unresolvedIds([1, 2, 3, "ne:5", "ne:6"], current, { Q2: "Q3", "ne:5": null })).toEqual(["ne:6"]);
    expect(unresolvedIds([1, 3], current, {})).toEqual([]);
  });

  it("writes the aliases that answer with a city of this release, and no others", () => {
    const text = cityAliases({ Q2: "Q3", Q9: null, Q8: "Q404", Q1000: "ne:7" }, new Set(["Q3", "ne:7"]));
    // Written small: item numbers in base 36, any other id after "!".
    expect(text).toContain('const PAIRS: string = "2=3,rs=!ne:7";');
    // And read back as it was.
    const PAIRS = /const PAIRS: string = (".*");/.exec(text)![1]!;
    const long = (part: string): string => (part.startsWith("!") ? part.slice(1) : `Q${Number.parseInt(part, 36)}`);
    expect(Object.fromEntries((JSON.parse(PAIRS) as string).split(",").map((pair) => pair.split("=").map(long)))).toEqual({ Q2: "Q3", Q1000: "ne:7" });
  });
});
