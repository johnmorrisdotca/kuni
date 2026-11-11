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
const build = (items: CitiesSnapshot["items"], places: NaturalEarthFile["places"] = []) => buildCities({ snapshot: snapshot(items), naturalEarth: natural(places), levels, countries });

describe("the tiers", () => {
  it("put a capital in capitals at any size and the rest by population, at the thresholds", () => {
    const { tiers } = build([
      item(1, "Capital", null, [1, 1], "FR", [[900, "2020-01-01"]], [], ["FR"]),
      item(2, "Million", null, [2, 2], "FR", [[1000000, "2020-01-01"]]),
      item(3, "AlmostMillion", null, [3, 3], "FR", [[999999, "2020-01-01"]]),
      item(4, "Hundred", null, [4, 4], "FR", [[100000, "2020-01-01"]]),
      item(5, "Fifteen", null, [5, 5], "FR", [[15000, "2020-01-01"]]),
      item(6, "Small", null, [6, 6], "FR", [[14999, "2020-01-01"]]),
      item(7, "NoFigure", null, [7, 7], "FR", []),
      item(8, "SubCapital", null, [8, 8], "FR", [[5000, null]], [], ["FR-IDF"]),
    ]);
    // Most populous first: the subdivision's capital of 5,000 comes before the country's of 900.
    expect(tiers.capitals.map((row) => row[7])).toEqual(["SubCapital", "Capital"]);
    expect(tiers.capitals.map((row) => row[11])).toEqual([2, 1]);
    expect(tiers["1m"].map((row) => row[7])).toEqual(["Million"]);
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
    expect(report.leftOut).toEqual({ noName: 1, noPoint: 1, noCountry: 2, noPopulation: 1, belowFloor: 1, area: 0 });
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
      ],
      [place("Q6", "Named District", null, 6, 6, 1, "Populated place", "FR")],
    );
    expect(Object.values(tiers).flat().map((row) => row[7]).sort()).toEqual(["Countyville", "Kept Province", "Named District"]);
    expect(report.leftOut.area).toBe(4);
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

  it("makes a city of its own, id ne:<number>, of a place Wikidata does not have, where it is a capital or 15,000 or more", () => {
    const { tiers, report } = build([], [
      place(null, "Bigville", "大町", 5, 5, 40000, "Populated place", "BR", 77),
      place(null, "Hamlet", null, 6, 6, 500, "Populated place", "BR", 78),
      place(null, "Seat", null, 7, 7, 900, "Admin-1 capital", "BR", 79),
      place(null, "Nowhere", null, 8, 8, 900000, "Populated place", null, 80),
    ]);
    expect(tiers["15k"].map((row) => row[0])).toEqual(["ne:77"]);
    expect(tiers.capitals.map((row) => [row[0], row[11]])).toEqual([["ne:79", 2]]);
    expect(tiers["15k"][0]![13]).toBe(1 | 2 | 4);
    expect(report.naturalEarthOnly).toBe(2);
  });

  it("adds a capital Wikidata names none of", () => {
    const { tiers } = build([item(1, "Capitalia", null, [1, 1], "FR", [[900000, null]])], [place("Q1", "Capitalia", null, 1, 1, 900000, "Admin-0 capital", "FR")]);
    expect(tiers.capitals[0]![11]).toBe(1);
    expect(tiers.capitals[0]![12]).toBeNull();
  });
});

describe("ids that never change", () => {
  it("name an id an earlier release had that this one has lost, unless it has an alias or was retired", () => {
    const current = new Set(["Q1", "Q3"]);
    expect(unresolvedIds([1, 2, 3, "ne:5", "ne:6"], current, { Q2: "Q3", "ne:5": null })).toEqual(["ne:6"]);
    expect(unresolvedIds([1, 3], current, {})).toEqual([]);
  });

  it("writes the aliases that answer with a city of this release, and no others", () => {
    const text = cityAliases({ Q2: "Q3", Q9: null, Q8: "Q404" }, new Set(["Q3"]));
    expect(text).toContain('"Q2": "Q3"');
    expect(text).not.toContain("Q9");
    expect(text).not.toContain("Q404");
  });
});
