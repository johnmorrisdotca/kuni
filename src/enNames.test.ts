// The English names of subdivisions: the faults found in kuni 1.0.0 are put right, and every name is checked for the
// same faults, so that another of each kind cannot ship unnoticed.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { CODE_CHANGES, EN_NAME_ACCEPTED, EN_NAME_OVERRIDES } from "../scripts/data-config";
import { englishSuspects } from "../scripts/en-names";
import { allSubdivisions, subdivision, subdivisions } from "./subdivisions";

const sources = JSON.parse(readFileSync("data-sources/sources.json", "utf8")) as { files: { path: string }[] };
const read = (prefix: RegExp) => JSON.parse(readFileSync(`data-sources/${sources.files.find((file) => prefix.test(file.path))!.path}`, "utf8"));
const labels = read(/^wikidata-facts-/).answers.subdivisionLabels as Record<string, [string, string][]>;
const items = read(/^wikidata-\d/).subdivisions as Record<string, { id: string; types?: { label: string }[] }[]>;
const current = (code: string): string[] => (items[code] ?? []).filter((item) => !(item.types ?? []).some((type) => /^(former|historical)\b/i.test(type.label))).map((item) => item.id);
const labelOf = (code: string): string | null => {
  const found = [...new Set((labels[code] ?? []).filter(([id]) => current(code).includes(id)).map(([, label]) => label))];
  return found.length === 1 ? found[0] : null;
};
const formerOf = (code: string): string[] => (labels[code] ?? []).filter(([id]) => !current(code).includes(id)).map(([, label]) => label);

describe("the checks on English names", () => {
  it("find each kind of fault found in 1.0.0", () => {
    const check = (en: string, wikidata: string, others: Record<string, string> = {}, former: string[] = []) =>
      englishSuspects(
        [{ code: "XX-1", country: "XX", en }, ...Object.keys(others).map((code) => ({ code, country: "XX", en: "Elsewhere" }))],
        (code) => (code === "XX-1" ? wikidata : others[code] ?? null),
        (code) => (code === "XX-1" ? former : []),
      ).map((one) => one.pattern);
    expect(check("Peter", "City of Peterborough")).toEqual(["cut short"]);
    expect(check("Marl", "Marlborough District")).toEqual(["cut short"]);
    expect(check("Buryat", "Buryatia")).toEqual(["cut short"]);
    expect(check("Chechen", "Chechnya")).toEqual(["adjective"]);
    expect(check("Altai", "Altai Republic")).toEqual(["adjective"]);
    expect(check("Can Tho", "Cần Thơ")).toEqual(["marks stripped"]);
    expect(check("Chiayi County", "Chiayi City", { "XX-2": "Chiayi County" })).toEqual(["swapped"]);
    expect(check("Grand Casablanca", "Drâa-Tafilalet", {}, ["Grand Casablanca"])).toEqual(["former place"]);
    // And not the differences that are only style.
    expect(check("Balkh", "Balkh Province")).toEqual([]);
    expect(check("Bogotá", "Bogotá")).toEqual([]);
  });

  it("point at no shipped name but those kept on purpose, each with its reason", () => {
    const found = englishSuspects(allSubdivisions().map((one) => ({ code: one.code, country: one.country, en: one.name.en })), labelOf, formerOf);
    expect(found.map((one) => one.code).sort()).toEqual(Object.keys(EN_NAME_ACCEPTED).sort());
    for (const why of Object.values(EN_NAME_ACCEPTED)) expect(why.length).toBeGreaterThan(30);
  });
});

describe("the names put right", () => {
  it("are the names, not CLDR's", () => {
    expect(subdivision("GB-PTE")?.name.en).toBe("Peterborough");
    expect(subdivision("NZ-MBH")?.name.en).toBe("Marlborough");
    expect(subdivision("TW-CYI")?.name).toEqual({ en: "Chiayi City", ja: "嘉義市" });
    expect(subdivision("TW-CYQ")?.name).toEqual({ en: "Chiayi County", ja: "嘉義県" });
    expect(subdivision("CO-DC")?.name.en).toBe("Bogotá");
    expect(subdivision("PH-COM")?.name).toEqual({ en: "Davao de Oro", ja: "ダバオ・デ・オロ州" });
    expect(subdivision("RU-CE")?.name.en).toBe("Chechnya");
    expect(subdivision("RU-BU")?.name.en).toBe("Buryatia");
    expect(subdivision("VN-CT")?.name.en).toBe("Cần Thơ");
    expect(subdivision("MA-04")?.name).toEqual({ en: "Rabat-Salé-Kénitra", ja: "ラバト＝サレ＝ケニトラ地方" });
    expect(subdivision("MA-RAB")?.parent).toBe("MA-04");
    for (const [code, { en }] of Object.entries(EN_NAME_OVERRIDES)) expect(subdivision(code)?.name.en, code).toBe(en);
  });

  it("are still found by the name somebody types, with or without its marks", async () => {
    const { subdivisionByName } = await import("./subdivisions");
    expect(subdivisionByName("Can Tho")?.code).toBe("VN-CT");
    expect(subdivisionByName("Chechnya")?.code).toBe("RU-CE");
  });
});

describe("Norway's counties", () => {
  it("are the fifteen of 2024: Viken, Vestfold og Telemark and Troms og Finnmark divided again", () => {
    const codes = (subdivisions("NO") ?? []).map((one) => one.code);
    for (const code of Object.keys(CODE_CHANGES.removed)) expect(codes, code).not.toContain(code);
    for (const code of Object.keys(CODE_CHANGES.added)) expect(codes, code).toContain(code);
    expect(codes).toHaveLength(17); // fifteen counties, Svalbard and Jan Mayen
    expect(subdivision("NO-55")).toMatchObject({ name: { en: "Troms", ja: "トロムス県" }, type: "county", level: 1 });
  });
});
