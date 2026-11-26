import { describe, expect, it } from "vitest";

import { country, COUNTRY_CODES } from "./index";
import { loadCities } from "./cities";
import { LARGEST_CITY_ELSEWHERE, LARGEST_CITY_FIGURES } from "../scripts/largest-city";
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
    expect(trivia("IT")?.largestCity).toEqual({ id: "Q220", name: { en: "Rome", ja: "ローマ" } });
    expect(trivia("AQ")?.largestCity).toBeNull();
    expect(allTrivia().filter((one) => one.largestCity !== null)).toHaveLength(235);
  });

  // The city proper, not the urban area (docs/trivia.md): the capitals people take for the largest city, the cities an
  // urban area would put first, and the countries whose Wikidata figures needed the census's (scripts/largest-city.ts).
  const LARGEST: Readonly<Record<string, string>> = {
    // Not the capital.
    CA: "Toronto", AU: "Sydney", TR: "Istanbul", BR: "São Paulo", US: "New York City", CH: "Zurich", NZ: "Auckland", NG: "Lagos",
    PK: "Karachi", MA: "Casablanca", KZ: "Almaty", VN: "Ho Chi Minh City", AE: "Dubai", ZA: "Johannesburg", CM: "Douala", EC: "Guayaquil",
    BO: "Santa Cruz de la Sierra", TZ: "Dar es Salaam", MM: "Yangon", TT: "Chaguanas",
    // China and India, by their censuses: not Chongqing's municipality, not Delhi's territory.
    CN: "Shanghai", IN: "Mumbai",
    // The city itself, where its urban area would give another.
    IT: "Rome", IL: "Jerusalem", PH: "Quezon City", TW: "New Taipei City", BE: "Antwerp", CY: "Limassol", GH: "Kumasi", SD: "Omdurman", EH: "Laayoune", GU: "Dededo", GP: "Les Abymes", MT: "St. Paul's Bay", PF: "Faʻaʻā", TC: "Providenciales",
    // Wikidata's figure set right: a kingdom, a department, an atoll, a district, and estimates of another year.
    BJ: "Cotonou", SZ: "Mbabane", GQ: "Bata", KI: "South Tarawa", LC: "Castries",
    // The capital is the largest.
    JP: "Tokyo", FR: "Paris", GB: "London", CL: "Santiago", EG: "Cairo",
  };

  it("names the city proper for the countries that are easy to get wrong", () => {
    expect(Object.keys(LARGEST).length).toBeGreaterThanOrEqual(20);
    for (const [code, city] of Object.entries(LARGEST)) expect(trivia(code)?.largestCity?.name.en, code).toBe(city);
  });

  it("names none rather than a wrong city where kuni lacks the largest place", () => {
    // Liechtenstein's Schaan (kuni has no figure for it), San Marino's Dogana.
    for (const code of ["LI", "SM", "AS"]) expect(trivia(code)?.largestCity, code).toBeNull();
    const wrong = new Set(["Q24697413", "Q2200458", "Q101418", "Q2486", "Q3116994", "Q30988", "Q1844", "Q1848"]); // Dagbon, Banikoara, Lobamba, Tarawa, Gros Islet, Hagåtña, Vaduz, San Marino
    for (const one of allTrivia()) expect(wrong.has(one.largestCity?.id ?? ""), one.alpha2).toBe(false);
  });

  it("names as largest a city of the country, found in the country's own cities", async () => {
    const { citiesOf } = await import("./cities");
    for (const code of ["JP", "FR", "NZ", "KE", ...Object.keys(LARGEST)]) {
      const cities = (await citiesOf(code))!;
      const largest = trivia(code)!.largestCity!;
      const found = cities.find((one) => one.id === largest.id);
      expect(found?.name.en, code).toBe(largest.name.en);
      expect(country(found!.country)?.alpha2, code).toBe(code);
      // No city of the country has more people of its own, but where a census figure was set (Ghana, Sudan,
      // Eswatini, ...) or the census ranks (China, India).
      if (!["CN", "IN", "GH", "SD", "SZ", "BJ", "GQ", "KI", "LC"].includes(code)) {
        const most = Math.max(...cities.map((one) => one.population ?? 0));
        expect(found!.population, code).toBe(most);
      }
    }
  });

  it("hands out frozen objects", () => {
    const one = trivia("IN")!;
    expect(Object.isFrozen(one) && Object.isFrozen(one.inception) && Object.isFrozen(one.officialLanguages) && Object.isFrozen(one.largestCity) && Object.isFrozen(one.largestCity?.name)).toBe(true);
    expect(Object.isFrozen(allTrivia())).toBe(true);
  });
  // MODULES-1450: every country, not the ones listed above. The largest city is the one with the most people in the city itself among the cities kuni has of that code: the figure of /cities, or the census figure
  // scripts/largest-city.ts sets in its place; a city set to none is not ranked. China and India are ranked by their censuses (urban-area facts), a country in LARGEST_CITY_ELSEWHERE has none.
  it("names, for every country, the city with the most people in the data", async () => {
    const all = await loadCities("capitals", "1m", "100k", "15k");
    const censusRanked = new Set(["CN", "IN"]);
    const figure = (id: string, population: number | null): number | null => (id in LARGEST_CITY_FIGURES ? LARGEST_CITY_FIGURES[id].population : population);
    let checked = 0;
    for (const one of allTrivia()) {
      const largest = one.largestCity;
      const mine = all.inCountry(one.alpha2);
      if (largest === null) {
        // none only where kuni lacks the place, or has no city of that code at all
        expect(one.alpha2 in LARGEST_CITY_ELSEWHERE || mine.length === 0, `${one.alpha2} has no largest city though kuni has ${mine.length} cities of it`).toBe(true);
        continue;
      }
      expect(mine.some((city) => city.id === largest.id), `${one.alpha2}: ${largest.id} is one of its cities`).toBe(true);
      if (censusRanked.has(one.alpha2)) continue;
      const top = figure(largest.id, mine.find((city) => city.id === largest.id)!.population);
      for (const city of mine) {
        const people = figure(city.id, city.population);
        if (people === null) continue;
        expect(top, `${one.alpha2}: ${largest.name.en} (${top}) is not the largest, ${city.name.en} has ${people}`).not.toBeNull();
        expect(top!, `${one.alpha2}: ${largest.name.en} has ${top}, ${city.name.en} has ${people}`).toBeGreaterThanOrEqual(people);
      }
      checked += 1;
    }
    expect(checked).toBeGreaterThan(200);
  });

});
