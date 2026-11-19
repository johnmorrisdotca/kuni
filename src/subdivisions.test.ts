import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import { country } from "./index";
import { loadSubdivisions } from "./load";
import {
  allSubdivisions,
  subdivision,
  subdivisionByFormerCode,
  subdivisionByName,
  subdivisionByShortCode,
  subdivisions,
  subdivisionsByFormerCode,
  subdivisionsByName,
  SUBDIVISION_TYPES,
  subdivisionTypeLabel,
} from "./subdivisions";
import JAPAN, { SUBDIVISIONS as JAPAN_NAMED } from "./subdivisions/jp";

const expectedGaps = JSON.parse(readFileSync("data-sources/expected-ja-gaps.json", "utf8")) as Record<string, string[]>;

describe("the subdivisions", () => {
  const all = allSubdivisions();

  it("are the 5,050 ISO 3166-2 codes: CLDR's, with ISO's changes since (Norway's counties of 2024), 3,594 of them at the first level", () => {
    expect(all).toHaveLength(5050);
    expect(all.filter((one) => one.level === 1)).toHaveLength(3594);
    expect(new Set(all.map((one) => one.code)).size).toBe(all.length);
  });

  it("each belong to a country that exists, and say so in their code", () => {
    for (const one of all) {
      expect(country(one.country), one.code).not.toBeNull();
      expect(one.code, one.code).toBe(`${one.country}-${one.shortCode}`);
      expect(one.code).toMatch(/^[A-Z]{2}-[A-Z0-9]{1,3}$/);
    }
  });

  it("each have an English name, and a Japanese name or null, never an empty string or the English copied in", () => {
    for (const one of all) {
      expect(one.name.en.trim(), one.code).not.toBe("");
      if (one.name.ja !== null) {
        expect(one.name.ja, one.code).toMatch(/[\p{Script=Han}\p{Script=Katakana}\p{Script=Hiragana}]/u);
        expect(one.name.ja, one.code).not.toBe(one.name.en);
      }
    }
  });

  it("are null in Japanese exactly where data-sources/expected-ja-gaps.json says", () => {
    const gaps: Record<string, string[]> = {};
    for (const one of all) if (one.name.ja === null) gaps[one.country] = [...(gaps[one.country] ?? []), one.code];
    expect(gaps).toEqual(expectedGaps);
  });

  it("keep their names tidy: no full-width Latin letters or digits, no ideographic or doubled spaces, nothing at either end", () => {
    for (const one of all) {
      for (const name of [one.name.en, one.name.ja]) {
        if (name === null) continue;
        expect(name, one.code).not.toMatch(/[\uff10-\uff19\uff21-\uff3a\uff41-\uff5a\u3000]|\s{2}|^\s|\s$/);
      }
    }
  });

  it("are inside a parent of the same country one level up, when they are below the first level", () => {
    for (const one of all.filter((each) => each.level > 1)) {
      const parent = subdivision(one.parent!);
      expect(parent, one.code).not.toBeNull();
      expect(parent!.country).toBe(one.country);
      expect(parent!.level).toBe(one.level - 1);
    }
    for (const one of all.filter((each) => each.level === 1)) expect(one.parent, one.code).toBeUndefined();
  });

  it("are a known kind of place, or null", () => {
    for (const one of all) if (one.type !== null) expect(SUBDIVISION_TYPES, one.code).toContain(one.type);
    expect(all.filter((one) => one.type !== null).length / all.length).toBeGreaterThan(0.9);
  });

  it("are frozen", () => {
    expect(Object.isFrozen(all[0])).toBe(true);
    expect(Object.isFrozen(all[0].name)).toBe(true);
    expect(Object.isFrozen(subdivisions("JP"))).toBe(true);
  });
});

describe("Japan", () => {
  const japan = subdivisions("JP")!;

  it("has its 47 prefectures, JP-01 to JP-47, in order", () => {
    expect(japan.map((one) => one.code)).toEqual(Array.from({ length: 47 }, (_, at) => `JP-${String(at + 1).padStart(2, "0")}`));
  });

  it("names each in both languages and reads each in hiragana", () => {
    for (const one of japan) {
      expect(one.name.ja, one.code).toMatch(/[都道府県]$/);
      expect(one.reading, one.code).toMatch(/^[\p{Script=Hiragana}]+$/u);
    }
    expect(subdivision("JP-13")).toMatchObject({ name: { en: "Tokyo", ja: "東京都" }, reading: "とうきょうと", type: "metropolis" });
    expect(subdivision("JP-01")).toMatchObject({ name: { ja: "北海道" }, reading: "ほっかいどう", type: "circuit" });
  });

  it("tells the four kinds apart: one 都, one 道, two 府 and forty-three 県", () => {
    const kinds = (type: string): string[] => japan.filter((one) => one.type === type).map((one) => one.name.ja!);
    expect(kinds("metropolis")).toEqual(["東京都"]);
    expect(kinds("circuit")).toEqual(["北海道"]);
    expect(kinds("urban-prefecture")).toEqual(["京都府", "大阪府"]);
    expect(kinds("prefecture")).toHaveLength(43);
    expect(subdivisionTypeLabel("JP-13", "ja")).toBe("都");
    expect(subdivisionTypeLabel("JP-01", "ja")).toBe("道");
    expect(subdivisionTypeLabel("JP-27", "ja")).toBe("府");
    expect(subdivisionTypeLabel("JP-14", "ja")).toBe("県");
    expect(subdivisionTypeLabel("JP", "ja")).toBe("県");
    expect(subdivisionTypeLabel("JP")).toBe("prefecture");
    expect(subdivisionTypeLabel("JP-27")).toBe("urban prefecture");
  });

  it("is the same list from its own entry, by default export and by name", () => {
    expect(JAPAN).toEqual(japan);
    expect(JAPAN_NAMED).toBe(JAPAN);
  });
});

describe("the United States and Canada", () => {
  it("have 57 and 13, every one named in Japanese", () => {
    const states = subdivisions("US")!;
    const provinces = subdivisions("CA")!;
    expect(states).toHaveLength(57);
    expect(provinces).toHaveLength(13);
    for (const one of [...states, ...provinces]) expect(one.name.ja, one.code).not.toBeNull();
    expect(subdivision("US-PR")).toMatchObject({ name: { en: "Puerto Rico", ja: "プエルトリコ" }, type: "territory" });
    expect(subdivisionTypeLabel("CA-ON", "ja")).toBe("州");
    expect(subdivisionTypeLabel("CA-YT", "ja")).toBe("準州");
  });
});

describe("subdivisions", () => {
  it("lists the first level unless asked for another, or for all", () => {
    expect(subdivisions("FR")).toHaveLength(26);
    expect(subdivisions("FR", { level: 2 })!.every((one) => one.level === 2 && one.parent !== undefined)).toBe(true);
    expect(subdivisions("FR", { level: "all" })!.length).toBeGreaterThan(100);
    expect(subdivisions("fr")).toEqual(subdivisions("FR"));
  });

  it("gives an empty list for a country with none, and null for a code that is not a country", () => {
    expect(subdivisions("AQ")).toEqual([]);
    expect(subdivisions("XK")).toEqual([]);
    expect(subdivisions("ZZ")).toBeNull();
    expect(subdivisions("Japan")).toBeNull();
  });
});

describe("subdivision and subdivisionByShortCode", () => {
  it("find a code in either case", () => {
    expect(subdivision("ca-on")?.name.en).toBe("Ontario");
    expect(subdivision("US-NY")?.name.ja).toBe("ニューヨーク州");
    expect(subdivisionByShortCode("CA", "ON")?.code).toBe("CA-ON");
    expect(subdivisionByShortCode("jp", "13")?.code).toBe("JP-13");
    expect(subdivisionByShortCode("ca", "on")?.code).toBe("CA-ON");
  });

  it("answer null for a code that is not one", () => {
    expect(subdivision("CA-XX")).toBeNull();
    expect(subdivision("Ontario")).toBeNull();
    expect(subdivisionByShortCode("CA", "")).toBeNull();
  });
});

describe("subdivisionByName", () => {
  const cases: [string, { country?: string } | undefined, string][] = [
    ["Ontario", undefined, "CA-ON"],
    ["オンタリオ州", { country: "CA" }, "CA-ON"],
    ["オンタリオ", undefined, "CA-ON"],
    ["ontario", { country: "ca" }, "CA-ON"],
    ["Tokyo", undefined, "JP-13"],
    ["東京都", undefined, "JP-13"],
    ["東京", undefined, "JP-13"],
    ["とうきょうと", undefined, "JP-13"],
    ["Hokkaido", undefined, "JP-01"],
    ["New York", undefined, "US-NY"],
    ["ニューヨーク州", undefined, "US-NY"],
    ["Bavaria", undefined, "DE-BY"],
    ["Île-de-France", undefined, "FR-IDF"],
    ["ile de france", undefined, "FR-IDF"],
    ["US-NY", undefined, "US-NY"],
    ["Punjab", { country: "IN" }, "IN-PB"],
  ];
  for (const [typed, options, code] of cases) {
    it(`finds ${code} from ${JSON.stringify(typed)}${options === undefined ? "" : ` in ${options.country}`}`, () => {
      expect(subdivisionByName(typed, options)?.code).toBe(code);
    });
  }

  it("answers null when a name is two places, and lists both with subdivisionsByName", () => {
    expect(subdivisionByName("Punjab")).toBeNull();
    expect(subdivisionsByName("Punjab").map((one) => one.code)).toEqual(["IN-PB", "PK-PB"]);
  });

  it("answers null for a name that is not a subdivision, or one in another country", () => {
    expect(subdivisionByName("Atlantis")).toBeNull();
    expect(subdivisionByName("")).toBeNull();
    expect(subdivisionByName("Ontario", { country: "US" })).toBeNull();
    expect(subdivisionByName("Ontario", { level: 2 })).toBeNull();
  });
});

describe("loadSubdivisions", () => {
  it("loads one country's list, the same as its entry", async () => {
    const loaded = await loadSubdivisions("JP");
    expect(loaded).toEqual(subdivisions("JP"));
    expect(await loadSubdivisions("ca")).toHaveLength(13);
  });

  it("gives an empty list for a country with none, and null for a code that is not a country", async () => {
    expect(await loadSubdivisions("AQ")).toEqual([]);
    expect(await loadSubdivisions("ZZ")).toBeNull();
  });
});

describe("the retired codes", () => {
  const all = allSubdivisions();
  const aliases = createRequire(import.meta.url)("cldr-core/supplemental/aliases.json").supplemental.metadata.alias.subdivisionAlias as Record<string, { _replacement: string; _reason: string }>;
  const isoOf = (id: string): string => `${id.slice(0, 2).toUpperCase()}-${id.slice(2).toUpperCase()}`;
  const retired = new Map<string, string[]>();
  for (const one of all) for (const former of one.formerCodes ?? []) retired.set(former, [...(retired.get(former) ?? []), one.code]);

  it("send FR-A to FR-GES, and FR-D and FR-I to FR-BFC, as CLDR 48.2 does", () => {
    expect(subdivisionByFormerCode("FR-A")?.code).toBe("FR-GES");
    expect(subdivisionByFormerCode("fr-d")?.code).toBe("FR-BFC");
    expect(subdivisionsByFormerCode("FR-I").map((one) => one.code)).toEqual(["FR-BFC"]);
    expect(subdivision("FR-GES")?.formerCodes).toEqual(["FR-A", "FR-G", "FR-M"]);
    expect(subdivision("NO-50")?.formerCodes).toEqual(["NO-23"]);
    expect(subdivisionByFormerCode("PL-DS")?.code).toBe("PL-02");
  });

  it("have no answer for Norway's NO-04, which CLDR 48.2 has no alias for", () => {
    expect(aliases.no04).toBeUndefined();
    expect(subdivisionsByFormerCode("NO-04")).toEqual([]);
  });

  it("give a split several successors, and no single one", () => {
    expect(subdivisionsByFormerCode("LU-D").map((one) => one.code)).toEqual(["LU-CL", "LU-DI", "LU-RD", "LU-VD", "LU-WI"]);
    expect(subdivisionsByFormerCode("NZ-N")).toHaveLength(9);
    expect(subdivisionsByFormerCode("NZ-S")).toHaveLength(7);
    expect(subdivisionByFormerCode("LU-D")).toBeNull();
    expect(subdivision("LU-DI")?.formerCodes).toEqual(["LU-D"]);
  });

  it("leave out the overlong forms, which kuni keeps as subdivisions", () => {
    const overlong = Object.entries(aliases).filter(([, alias]) => alias._reason === "overlong");
    expect(overlong).toHaveLength(27);
    for (const [id] of overlong) expect(retired.has(isoOf(id)), id).toBe(false);
    expect(subdivisionsByFormerCode("US-PR")).toEqual([]);
    expect(subdivision("US-PR")).not.toBeNull();
  });

  it("keep 109 of CLDR's 120 deprecated aliases and 3 of kuni's own Norwegian ones, 112 retired codes in 143 successor pairs, none also a current code", () => {
    expect(retired.size).toBe(112);
    expect([...retired.values()].reduce((sum, list) => sum + list.length, 0)).toBe(143);
    for (const former of retired.keys()) expect(subdivision(former), former).toBeNull();
  });

  it("each lead to subdivisions that exist, in the same country, and never to the code itself", () => {
    for (const [former, successors] of retired) {
      expect(successors.length, former).toBeGreaterThan(0);
      for (const code of successors) {
        expect(subdivision(code), `${former} to ${code}`).not.toBeNull();
        expect(code.slice(0, 2), former).toBe(former.slice(0, 2));
        expect(code).not.toBe(former);
      }
      expect(subdivisionsByFormerCode(former).map((one) => one.code)).toEqual([...successors].sort());
    }
  });

  it("send each Norwegian county CODE_CHANGES records as divided to the counties that took its place", () => {
    const divided: Record<string, string[]> = { "NO-30": ["NO-31", "NO-32", "NO-33"], "NO-38": ["NO-39", "NO-40"], "NO-54": ["NO-55", "NO-56"] };
    for (const [former, successors] of Object.entries(divided)) {
      expect(subdivisionsByFormerCode(former).map((one) => one.code), former).toEqual(successors);
      expect(subdivisionByFormerCode(former), former).toBeNull();
      for (const code of successors) expect(subdivision(code)?.formerCodes, code).toEqual([former]);
    }
    expect(subdivision("NO-34")).not.toHaveProperty("formerCodes");
    expect(aliases.no30).toBeUndefined();
  });

  it("find the counties that were divided by their old names, in English and Japanese", () => {
    expect(subdivisionsByName("Viken").map((one) => one.code)).toEqual(["NO-31", "NO-32", "NO-33"]);
    expect(subdivisionsByName("ヴィッケン県").map((one) => one.code)).toEqual(["NO-31", "NO-32", "NO-33"]);
    expect(subdivisionsByName("vestfold og telemark").map((one) => one.code)).toEqual(["NO-39", "NO-40"]);
    expect(subdivisionsByName("Troms og Finnmark", { country: "NO" }).map((one) => one.code)).toEqual(["NO-55", "NO-56"]);
    expect(subdivisionsByName("Tromssan ja Finmarkun").map((one) => one.code)).toEqual(["NO-55", "NO-56"]);
    expect(subdivisionByName("Viken")).toBeNull();
    expect(subdivision("NO-31")?.formerNames).toEqual(["Viken", "ヴィッケン県"]);
    expect(subdivisionByName("Troms")?.code).toBe("NO-55");
  });

  it("say CN-15 is CN-NM, where CLDR writes a code ISO does not use", () => {
    expect(aliases.cn15._replacement).toBe("cnmn");
    expect(subdivisionByFormerCode("CN-15")?.code).toBe("CN-NM");
  });

  it("answer an empty list, or null, for a current code and for anything that is not a code", () => {
    for (const typed of ["FR-GES", "JP-13", "XX-99", "", "  "]) {
      expect(subdivisionsByFormerCode(typed)).toEqual([]);
      expect(subdivisionByFormerCode(typed)).toBeNull();
    }
    expect(subdivisionsByFormerCode(undefined as unknown as string)).toEqual([]);
  });

  it("add nothing to a subdivision nothing was retired for", () => {
    expect(subdivision("JP-13")).not.toHaveProperty("formerCodes");
  });
});
