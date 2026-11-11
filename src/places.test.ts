import { describe, expect, it } from "vitest";

import { continents, countriesOf, searchPlaces } from "./places";

describe("continents", () => {
  it("lists the seven, with a name in English and in Japanese", () => {
    const list = continents();
    expect(list.map((one) => one.code)).toEqual(["AF", "AN", "AS", "EU", "NA", "OC", "SA"]);
    expect(list.find((one) => one.code === "EU")?.name).toEqual({ en: "Europe", ja: "ヨーロッパ" });
    for (const one of list) expect(one.name.ja.length, one.code).toBeGreaterThan(0);
    expect(Object.isFrozen(list)).toBe(true);
    expect(Object.isFrozen(list[0])).toBe(true);
  });

  it("agrees with countriesOf: every continent has countries", () => {
    for (const one of continents()) expect(countriesOf(one.code).length, one.code).toBeGreaterThan(0);
  });
});

describe("countriesOf", () => {
  it("lists a continent's countries in alpha-2 order, from the groupings, in either case", () => {
    const asia = countriesOf("AS").map((one) => one.alpha2);
    expect(asia).toContain("JP");
    expect(asia).not.toContain("FR");
    expect([...asia].sort()).toEqual(asia);
    expect(countriesOf(" eu ").map((one) => one.alpha2)).toContain("FR");
    expect(countriesOf("OC").map((one) => one.alpha2)).toEqual(expect.arrayContaining(["AU", "NZ", "FJ"]));
  });

  it("agrees with each country's own continent, and holds every country once across the seven", () => {
    const seen = new Set<string>();
    for (const code of ["AF", "AN", "AS", "EU", "NA", "OC", "SA"]) {
      for (const one of countriesOf(code)) {
        expect(one.continent, one.alpha2).toBe(code);
        seen.add(one.alpha2);
      }
    }
    expect(seen.size).toBeGreaterThan(230);
  });

  it("gives an empty, frozen list for what is not a continent", () => {
    expect(countriesOf("XX")).toEqual([]);
    expect(countriesOf("")).toEqual([]);
    expect(countriesOf(undefined as unknown as string)).toEqual([]);
    expect(Object.isFrozen(countriesOf("AS"))).toBe(true);
  });
});

describe("searchPlaces", () => {
  it("finds a country and a city, folded, whatever the case or accent", async () => {
    const found = await searchPlaces("CÔTE d'ivoire");
    expect(found[0]).toMatchObject({ kind: "country", country: { alpha2: "CI" } });
    expect((await searchPlaces("zürich"))[0]).toMatchObject({ kind: "city", city: { id: "Q72", country: "CH" } });
    expect((await searchPlaces("ZURICH"))[0]).toMatchObject({ kind: "city", city: { id: "Q72" } });
  });

  it("finds by Japanese, in hiragana or katakana, and labels in the language asked for", async () => {
    const japan = (await searchPlaces("にほん", { lang: "ja" }))[0]!;
    expect(japan.kind).toBe("country");
    expect(japan.label).toBe("日本");
    expect((await searchPlaces("東京", { lang: "ja" })).find((one) => one.kind === "city")?.label).toMatch(/東京/);
    expect((await searchPlaces("パリ", { lang: "ja" }))[0]).toMatchObject({ kind: "city", label: "パリ", city: { id: "Q90" } });
    expect((await searchPlaces("paris", { lang: "ja" }))[0]!.label).toBe("パリ");
    expect((await searchPlaces("paris"))[0]!.label).toBe("Paris");
  });

  it("finds by the place's own language", async () => {
    const found = await searchPlaces("münchen");
    expect(found.some((one) => one.kind === "city" && one.city.country === "DE")).toBe(true);
  });

  it("ranks the whole name before the start, the start before the middle, and the larger place first among equals", async () => {
    const found = await searchPlaces("nice");
    expect(found[0]).toMatchObject({ kind: "city", label: "Nice" });
    const lon = await searchPlaces("lon");
    const ranks = lon.map((one) => (one.kind === "city" ? one.city.name.en : one.country.name.en));
    for (let at = 1; at < ranks.length; at += 1) {
      const a = ranks[at - 1]!.toLowerCase();
      const b = ranks[at]!.toLowerCase();
      expect(a.startsWith("lon") ? 0 : 1).toBeLessThanOrEqual(b.startsWith("lon") ? 0 : 1);
    }
    const sydney = await searchPlaces("sydney");
    expect(sydney[0]).toMatchObject({ kind: "city", city: { country: "AU" } });
  });

  it("folds the letters that do not decompose: Lodz finds Łódź, Strasse finds Straße", async () => {
    const lodz = await searchPlaces("Lodz");
    expect(lodz.some((one) => one.kind === "city" && one.city.country === "PL" && /Ł|Lodz|Łódź/.test(one.city.name.native ?? one.city.name.en))).toBe(true);
    expect(lodz[0]).toMatchObject({ kind: "city", city: { country: "PL" } });
    const strasse = await searchPlaces("Strasse", { country: "DE" });
    expect(strasse.every((one) => one.kind === "city")).toBe(true);
    expect((await searchPlaces("Gdansk", { tiers: ["capitals", "1m", "100k"] })).some((one) => one.kind === "city" && one.city.country === "PL")).toBe(true);
  });

  it("finds a city by its native name: genova finds Genoa, koln and köln find Cologne", async () => {
    expect((await searchPlaces("genova"))[0]).toMatchObject({ kind: "city", city: { name: { en: "Genoa" } } });
    expect((await searchPlaces("koln"))[0]).toMatchObject({ kind: "city", city: { name: { en: "Cologne", native: "Köln" } } });
    expect((await searchPlaces("Köln"))[0]).toMatchObject({ kind: "city", city: { name: { en: "Cologne" } } });
  });

  it("answers at most the limit, and nothing for empty text", async () => {
    expect((await searchPlaces("a", { limit: 5 })).length).toBe(5);
    expect((await searchPlaces("a", { limit: 0 })).length).toBe(1);
    expect((await searchPlaces("a", { limit: 5000 })).length).toBeLessThanOrEqual(100);
    expect((await searchPlaces("a", { limit: NaN })).length).toBe(20);
    expect((await searchPlaces("a", { limit: "7" as unknown as number })).length).toBe(20);
    expect(await searchPlaces("")).toEqual([]);
    expect(await searchPlaces("  !! ")).toEqual([]);
    expect(await searchPlaces(undefined as unknown as string)).toEqual([]);
  });

  it("looks in the capitals and the million-city tier by default, and in other tiers when asked", async () => {
    const { loadCities } = await import("./cities");
    const small = (await loadCities("15k")).cities[0]!;
    expect((await searchPlaces(small.name.en)).some((one) => one.kind === "city" && one.city.id === small.id)).toBe(false);
    expect((await searchPlaces(small.name.en, { tiers: ["15k"] })).some((one) => one.kind === "city" && one.city.id === small.id)).toBe(true);
    // The cities of 100,000 or more are in the default search.
    const middling = (await loadCities("100k")).cities.find((one) => one.capital === null)!;
    expect((await searchPlaces(middling.name.en)).some((one) => one.kind === "city" && one.city.id === middling.id)).toBe(true);
  });

  it("searches one country's cities only, with no countries", async () => {
    const found = await searchPlaces("osaka", { country: "jp" });
    expect(found.length).toBeGreaterThan(0);
    for (const one of found) {
      expect(one.kind).toBe("city");
      if (one.kind === "city") expect(one.city.country).toBe("JP");
    }
    expect(await searchPlaces("osaka", { country: "XX" })).toEqual([]);
  });
});
