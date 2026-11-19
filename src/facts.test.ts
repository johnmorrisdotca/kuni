// The /facts entry, and the capitals in the main entry: every country has every fact or is listed as having none,
// with a reason, and the figures are what the sources say for the places a reader would check by heart.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { AREA_CHOICES, BORDERS_ADDED, CAPITAL_ITEMS, FACT_GAPS } from "../scripts/facts-config";
import { allFacts, distanceKm, facts, FACTS_READ } from "./facts";
import { countries, country, COUNTRY_CODES } from "./index";

const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

describe("every country, every fact", () => {
  it("has a row in /facts for each of the 250 codes, in code order", () => {
    expect(allFacts().map((one) => one.alpha2)).toEqual([...COUNTRY_CODES]);
  });

  // The coverage rule: a fact is there, or the country is named in FACT_GAPS with the reason it is not. Never both,
  // and never a value made up to fill the hole.
  const fields: [keyof typeof FACT_GAPS, (code: string) => boolean][] = [
    ["population", (code) => facts(code)!.population !== null],
    ["capital", (code) => country(code)!.capital !== undefined],
    ["capitalPoint", (code) => facts(code)!.capitalPoint !== null],
    ["drivingSide", (code) => facts(code)!.drivingSide !== null],
    ["borders", (code) => facts(code)!.borders.length > 0],
  ];
  for (const [field, has] of fields) {
    it(`has a ${field}, or is listed in FACT_GAPS.${field} with a reason, and never both`, () => {
      for (const code of COUNTRY_CODES) {
        const listed = FACT_GAPS[field][code];
        expect(has(code) || listed !== undefined, `${code} has no ${field} and no reason`).toBe(true);
        expect(has(code) && listed !== undefined, `${code} has a ${field} and is listed as having none`).toBe(false);
        if (listed !== undefined) expect(listed.trim().length, code).toBeGreaterThan(10);
      }
    });
  }

  it("has an area and coordinates, every one, with nothing listed as missing", () => {
    for (const one of allFacts()) {
      expect(one.areaKm2, one.alpha2).toBeGreaterThan(0);
      expect(one.areaOf, one.alpha2).toMatch(/^(whole|land)$/);
      expect(one.point, one.alpha2).not.toBeNull();
    }
  });

  it("gives a population a year whenever it is not 0, and never a year without a population", () => {
    for (const one of allFacts()) {
      if (one.population === null) expect(one.populationYear, one.alpha2).toBeNull();
      else if (one.population > 0) expect(one.populationYear, one.alpha2).toBeGreaterThanOrEqual(2000);
      if (one.areaKm2 === null) expect(one.areaYear).toBeNull();
    }
  });

  // MODULES-1626: the populations are one year's series, so that "the most populous" compares like with like.
  describe("one comparable population year", () => {
    const bankFile = new URL("../data-sources/world-bank-sp-pop-totl-2025.json", import.meta.url);
    const [, bankRows] = JSON.parse(readFileSync(bankFile, "utf8")) as [unknown, { countryiso3code: string; value: number }[]];
    const bank = new Map(bankRows.filter((row) => row.countryiso3code !== "").map((row) => [row.countryiso3code, row.value]));
    const fromWikidata = allFacts().filter((one) => one.populationSource === "Wikidata");

    it("has India as the most populous country, ahead of China", () => {
      const ranked = allFacts()
        .filter((one) => one.population !== null)
        .sort((a, b) => b.population! - a.population!);
      expect(ranked[0]!.alpha2).toBe("IN");
      expect(ranked[1]!.alpha2).toBe("CN");
      expect(facts("IN")!.population!).toBeGreaterThan(facts("CN")!.population!);
    });

    it("gives every country the same year, except the listed ones that keep Wikidata's figure", () => {
      const years = new Set(allFacts().filter((one) => one.populationSource === "World Bank SP.POP.TOTL").map((one) => one.populationYear));
      expect([...years]).toEqual([2025]);
      expect(fromWikidata.map((one) => one.alpha2)).toEqual("AI AX BL BQ BV CC CK CX EH FK GF GG GP GS HM IO JE MQ MS NF NU PM PN RE SH SJ TF TK TW UM VA WF YT".split(" "));
      expect(facts("AQ")!.population).toBeNull();
    });

    it("records where each population is from, on every row that has one", () => {
      for (const one of allFacts()) {
        if (one.population === null) expect(one.populationSource, one.alpha2).toBeNull();
        else expect(["World Bank SP.POP.TOTL", "Wikidata"], one.alpha2).toContain(one.populationSource);
      }
      expect(facts("IN")!.populationSource).toBe("World Bank SP.POP.TOTL");
      expect(facts("TW")!.populationSource).toBe("Wikidata");
    });

    it("takes the World Bank's figure as it is, Kosovo's under its code XKX", () => {
      for (const one of allFacts().filter((each) => each.populationSource === "World Bank SP.POP.TOTL")) {
        const code = one.alpha2 === "XK" ? "XKX" : country(one.alpha2)!.alpha3;
        expect(one.population, one.alpha2).toBe(bank.get(code));
      }
      expect(facts("XK")!.populationSource).toBe("World Bank SP.POP.TOTL");
    });

    it("leaves the World Bank's aggregates out: the world, the regions and the income groups are not countries", () => {
      expect(bank.has("WLD")).toBe(true);
      expect(allFacts().length).toBe(250);
      const alpha3 = new Set(countries().map((one) => one.alpha3));
      for (const aggregate of ["WLD", "EUU", "EAS", "SSF", "LMY", "CHI"]) expect(alpha3.has(aggregate), aggregate).toBe(false);
      // Counted in, the aggregates would double the world; the countries add up to it.
      const total = allFacts().reduce((sum, one) => sum + (one.populationSource === "World Bank SP.POP.TOTL" ? one.population! : 0), 0);
      expect(total / bank.get("WLD")!).toBeGreaterThan(0.99);
      expect(total / bank.get("WLD")!).toBeLessThan(1.001);
    });
  });

  it("names every capital in Japanese, in Japanese script and with no bracket", () => {
    for (const one of countries()) {
      if (one.capital === undefined) continue;
      expect(one.capital.ja, one.alpha2).toMatch(JAPANESE);
      expect(one.capital.ja, one.alpha2).not.toMatch(/[()（）]/);
    }
  });

  it("puts every point on the earth, and a capital within 4,000 km of its country's point", () => {
    for (const one of allFacts()) {
      for (const point of [one.point, one.capitalPoint]) {
        if (point === null) continue;
        expect(Math.abs(point.lat), one.alpha2).toBeLessThanOrEqual(90);
        expect(Math.abs(point.lon), one.alpha2).toBeLessThanOrEqual(180);
      }
      // Kiribati and the French Southern Lands spread over thousands of kilometres of sea; nothing else comes close.
      if (one.point !== null && one.capitalPoint !== null && !["KI", "TF", "UM", "PF"].includes(one.alpha2)) expect(distanceKm(one.point, one.capitalPoint), one.alpha2).toBeLessThan(4000);
    }
  });
});

describe("the land borders", () => {
  it("go both ways, name only real codes, and never the country itself", () => {
    for (const one of allFacts()) {
      for (const other of one.borders) {
        expect(COUNTRY_CODES as readonly string[], `${one.alpha2}–${other}`).toContain(other);
        expect(other).not.toBe(one.alpha2);
        expect(facts(other)!.borders, `${other} does not border ${one.alpha2} back`).toContain(one.alpha2);
      }
    }
  });

  it("are the ones a reader knows: islands have none, and the borders added by hand are there", () => {
    for (const island of ["JP", "IS", "AU", "NZ", "MG", "LK", "TW", "SG"]) expect(facts(island)!.borders, island).toEqual([]);
    expect(facts("CA")!.borders).toEqual(["GL", "US"]);
    expect(facts("US")!.borders).toEqual(["CA", "MX"]);
    expect(facts("ES")!.borders).toEqual(["AD", "FR", "GI", "MA", "PT"]);
    expect(facts("VA")!.borders).toEqual(["IT"]);
    expect(facts("LS")!.borders).toEqual(["ZA"]);
    expect(facts("CN")!.borders).toContain("HK");
    expect(facts("NA")!.borders).not.toContain("ZW"); // Natural Earth's outlines touch at Kazungula; the countries do not
    expect(facts("AF")!.borders).not.toContain("IN"); // Stated by Wikidata through Kashmir, a claim
    for (const pair of Object.keys(BORDERS_ADDED)) {
      const [a, b] = pair.split(" ");
      expect(facts(a)!.borders, pair).toContain(b);
    }
  });
});

describe("the figures", () => {
  it("are Wikidata's for places a reader would check", () => {
    expect(facts("JP")).toMatchObject({ population: 123366734, populationYear: 2025, populationSource: "World Bank SP.POP.TOTL", drivingSide: "left", weekStart: "sun", measurement: "metric", paper: "A4", hourCycle: "h23" });
    expect(facts("US")).toMatchObject({ drivingSide: "right", measurement: "US", paper: "US-Letter", hourCycle: "h12" });
    expect(facts("GB")).toMatchObject({ drivingSide: "left", measurement: "UK", weekStart: "mon" });
    expect(facts("jp")).toBe(facts("JP"));
    expect(facts("XX")).toBeNull();
    expect(facts("JPN")).toBeNull();
    expect(facts(42 as unknown as string)).toBeNull();
    expect(FACTS_READ).toMatch(/^\d{4}-\d\d-\d\d$/);
  });

  it("keep the hand-made choices", () => {
    for (const [code, choice] of Object.entries(AREA_CHOICES)) expect(facts(code)!.areaKm2, code).toBe(choice.km2);
    expect(country("GQ")!.capital).toEqual({ en: CAPITAL_ITEMS.GQ.en, ja: "シウダ・デ・ラ・パス" });
    expect(country("JP")!.capital!.en).toBe("Tokyo");
    expect(facts("AQ")!.population).toBeNull();
    expect(facts("BV")!.population).toBe(0);
  });

  it("measures distance on the earth", () => {
    expect(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 0 })).toBe(0);
    expect(Math.round(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 180 }))).toBe(20015);
    expect(Math.round(distanceKm(facts("JP")!.capitalPoint!, facts("GB")!.capitalPoint!))).toBe(9558);
  });

  it("are frozen, so one caller cannot change what the next is given", () => {
    const japan = facts("JP")!;
    expect(Object.isFrozen(japan)).toBe(true);
    expect(Object.isFrozen(japan.borders)).toBe(true);
    expect(Object.isFrozen(japan.point)).toBe(true);
    expect(Object.isFrozen(allFacts())).toBe(true);
  });
});
