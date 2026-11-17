import { describe, expect, it } from "vitest";

import { country, COUNTRY_CODES } from "./index";
import { allTrivia, trivia, TRIVIA_READ } from "./trivia";

describe("the trivia", () => {
  it("has a record for every country, in code order", () => {
    expect(allTrivia().map((one) => one.alpha2)).toEqual([...COUNTRY_CODES]);
    expect(TRIVIA_READ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(trivia("jp")).toBe(trivia("JP"));
    expect(trivia("XX")).toBeNull();
    expect(trivia(undefined as unknown as string)).toBeNull();
  });

  it("says when a country began, as Wikidata has it, or nothing", () => {
    expect(trivia("IN")?.inception).toEqual({ year: 1947, day: "1947-08-15" });
    expect(trivia("SS")?.inception).toEqual({ year: 2011, day: "2011-07-09" });
    expect(trivia("AE")?.inception).toEqual({ year: 1971 });
    // Several of the best rank in Wikidata: none is chosen.
    expect(trivia("ES")?.inception).toBeNull();
    expect(trivia("AQ")?.inception).toBeNull();
    for (const one of allTrivia()) {
      if (one.inception === null) continue;
      expect(Number.isInteger(one.inception.year), one.alpha2).toBe(true);
      expect(one.inception.year, one.alpha2).toBeLessThanOrEqual(Number(TRIVIA_READ.slice(0, 4)));
      if (one.inception.day !== undefined) expect(one.inception.day.startsWith(`${String(one.inception.year).padStart(4, "0")}-`), one.alpha2).toBe(true);
    }
    expect(allTrivia().filter((one) => one.inception !== null).length).toBeGreaterThan(215);
  });

  it("lists the official languages CLDR records, most spoken first", () => {
    expect(trivia("JP")?.officialLanguages).toEqual(["ja"]);
    expect(trivia("CA")?.officialLanguages).toEqual(["en", "fr"]);
    expect(trivia("BE")?.officialLanguages).toEqual(["nl", "fr", "de"]);
    expect(trivia("US")?.officialLanguages).toEqual(["en"]);
    expect(trivia("HK")?.officialLanguages).toEqual(["zh", "en"]);
    expect(trivia("AQ")?.officialLanguages).toEqual([]);
    for (const one of allTrivia()) {
      expect(new Set(one.officialLanguages).size, one.alpha2).toBe(one.officialLanguages.length);
      for (const language of one.officialLanguages) expect(language, one.alpha2).toMatch(/^[a-z]{2,3}$/);
    }
    expect(allTrivia().filter((one) => one.officialLanguages.length > 0)).toHaveLength(246);
  });

  it("names the largest city in both languages", () => {
    expect(trivia("AU")?.largestCity).toEqual({ id: "Q3130", name: { en: "Sydney", ja: "シドニー" } });
    expect(trivia("CA")?.largestCity?.name.en).toBe("Toronto");
    expect(trivia("TR")?.largestCity?.name.en).toBe("Istanbul");
    expect(trivia("BR")?.largestCity?.name.en).toBe("São Paulo");
    expect(trivia("AQ")?.largestCity).toBeNull();
    expect(allTrivia().filter((one) => one.largestCity !== null)).toHaveLength(244);
  });

  it("names as largest a city of the country, found in the country's own cities", async () => {
    const { citiesOf } = await import("./cities");
    for (const code of ["JP", "FR", "NZ", "KE"]) {
      const cities = (await citiesOf(code))!;
      const largest = trivia(code)!.largestCity!;
      expect(cities[0].id, code).toBe(largest.id);
      expect(cities[0].name.en, code).toBe(largest.name.en);
      expect(country(cities[0].country)?.alpha2).toBe(code);
    }
  });

  it("hands out frozen objects", () => {
    const one = trivia("IN")!;
    expect(Object.isFrozen(one) && Object.isFrozen(one.inception) && Object.isFrozen(one.officialLanguages) && Object.isFrozen(one.largestCity) && Object.isFrozen(one.largestCity?.name)).toBe(true);
    expect(Object.isFrozen(allTrivia())).toBe(true);
  });
});
