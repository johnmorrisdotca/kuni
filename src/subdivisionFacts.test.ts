// The /subdivision-facts entry: one object for every subdivision, a fact or null, never a guess, and Japan's
// prefectures complete enough for a quiz and a profile page.
import { describe, expect, it } from "vitest";

import { allSubdivisions, subdivisions } from "./subdivisions";
import { loadSubdivisionFacts } from "./subdivisionFacts";
import japan from "./subdivision-facts/jp";
import { COUNTRY_CODES } from "./index";

const HIRAGANA = /^[\p{Script=Hiragana}ー]+$/u;
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

describe("the facts about subdivisions", () => {
  it("give one object for every subdivision of every country, in the same order as its names", async () => {
    let total = 0;
    for (const code of COUNTRY_CODES) {
      const loaded = await loadSubdivisionFacts(code);
      const named = subdivisions(code, { level: "all" }) ?? [];
      expect(loaded?.map((one) => one.code), code).toEqual(named.map((one) => one.code));
      total += loaded!.length;
    }
    expect(total).toBe(allSubdivisions().length);
  });

  it("are a value or null, each value in range, never an empty string or a zero area", async () => {
    for (const code of ["JP", "US", "FR", "GB", "CN", "SI", "IN"]) {
      for (const one of (await loadSubdivisionFacts(code))!) {
        if (one.capital !== null) {
          expect(one.capital.en.trim(), one.code).not.toBe("");
          if (one.capital.ja !== null) expect(one.capital.ja, one.code).toMatch(JAPANESE);
          if (one.capital.reading !== undefined) expect(one.capital.reading, one.code).toMatch(HIRAGANA);
        } else expect(one.capitalPoint, one.code).toBeNull();
        if (one.population !== null) expect(one.population, one.code).toBeGreaterThanOrEqual(0);
        else expect(one.populationYear, one.code).toBeNull();
        if (one.areaKm2 !== null) expect(one.areaKm2, one.code).toBeGreaterThan(0);
        else expect(one.areaYear, one.code).toBeNull();
        for (const point of [one.point, one.capitalPoint]) if (point !== null) expect(Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180, one.code).toBe(true);
      }
    }
  });

  it("name every Japanese prefecture's capital in both languages, and give each a population and coordinates", () => {
    expect(japan).toHaveLength(47);
    for (const one of japan) {
      expect(one.capital?.ja, one.code).toMatch(/[市区]$/);
      expect(one.population, one.code).toBeGreaterThan(400000);
      expect(one.populationYear, one.code).toBeGreaterThanOrEqual(2014);
      expect(one.point, one.code).not.toBeNull();
    }
    expect(japan[0]).toMatchObject({ code: "JP-01", capital: { en: "Sapporo", ja: "札幌市", reading: "さっぽろし" } });
    expect(japan[12]).toMatchObject({ code: "JP-13", capital: { en: "Shinjuku", ja: "新宿区" } });
    expect(japan.filter((one) => one.capital?.reading !== undefined).length).toBeGreaterThanOrEqual(45);
    expect(japan.filter((one) => one.areaKm2 !== null).length).toBeGreaterThanOrEqual(46);
  });

  it("load nothing for a code that is not a country, and an empty list for a country with no subdivisions", async () => {
    expect(await loadSubdivisionFacts("XX")).toBeNull();
    expect(await loadSubdivisionFacts(7 as unknown as string)).toBeNull();
    expect(await loadSubdivisionFacts("AQ")).toEqual([]);
    expect(await loadSubdivisionFacts("jp")).toBe(japan);
  });

  it("are frozen", () => {
    expect(Object.isFrozen(japan)).toBe(true);
    expect(Object.isFrozen(japan[0])).toBe(true);
    expect(Object.isFrozen(japan[0].capital)).toBe(true);
  });
});
