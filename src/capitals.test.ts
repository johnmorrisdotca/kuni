// Capitals with a role (MODULES-1627): what each country with more than one capital has, that `capital` has not
// changed for any country, and that no country without an entry gets the new data.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CAPITALS_READ, capitalsOf } from "./capitals";
import { countries } from "./index";

const ROLES = ["official", "administrative", "legislative", "judicial", "seat"];

// The role of each city, by country, as docs/capitals.md says and the sources were read.
const EXPECTED: Record<string, [string, string | null, string][]> = {
  BJ: [["Porto-Novo", "ポルトノボ", "official"], ["Cotonou", "コトヌー", "seat"]],
  BO: [["Sucre", "スクレ", "official"], ["La Paz", "ラパス", "seat"]],
  CI: [["Yamoussoukro", "ヤムスクロ", "administrative"]],
  LK: [["Sri Jayawardenepura Kotte", "スリジャヤワルダナプラコッテ", "administrative"]],
  MY: [["Kuala Lumpur", "クアラルンプール", "official"], ["Putrajaya", "プトラジャヤ", "administrative"]],
  NL: [["Amsterdam", "アムステルダム", "official"], ["The Hague", "デン・ハーグ", "seat"]],
  TZ: [["Dodoma", "ドドマ", "official"]],
  ZA: [["Pretoria", "プレトリア", "administrative"], ["Cape Town", "ケープタウン", "legislative"], ["Bloemfontein", "ブルームフォンテーン", "judicial"]],
};

describe("capitalsOf", () => {
  it("gives each listed country's capitals, their Japanese names and their roles", () => {
    for (const [code, expected] of Object.entries(EXPECTED)) {
      const got = capitalsOf(code)!;
      expect(got.map((one) => [one.name.en, one.name.ja, one.role]), code).toEqual(expected);
    }
  });

  it("reads a code in either case and answers null for what is not a code", () => {
    expect(capitalsOf("za")).toBe(capitalsOf("ZA"));
    expect(capitalsOf(" nl ")).toBe(capitalsOf("NL"));
    expect(capitalsOf("XX")).toBeNull();
    expect(capitalsOf(undefined as unknown as string)).toBeNull();
  });

  it("uses only the five roles, a Japanese name for every city, and a note that is not empty", () => {
    for (const code of Object.keys(EXPECTED)) {
      for (const one of capitalsOf(code)!) {
        expect(ROLES, `${code} ${one.name.en}`).toContain(one.role);
        expect(typeof one.name.ja, `${code} ${one.name.en}`).toBe("string");
        if (one.note !== undefined) expect(one.note.trim()).not.toBe("");
        expect(one.disputed, `${code} ${one.name.en}`).toBeUndefined();
      }
    }
  });

  it("freezes what it returns and returns the same list each time", () => {
    const list = capitalsOf("ZA")!;
    expect(Object.isFrozen(list)).toBe(true);
    expect(Object.isFrozen(list[0])).toBe(true);
    expect(Object.isFrozen(list[0]!.name)).toBe(true);
    expect(capitalsOf("ZA")).toBe(list);
  });

  it("gives the data to the listed countries only, and leaves out Israel and the Palestinian Territories", () => {
    const given = countries().filter((one) => capitalsOf(one.alpha2) !== null).map((one) => one.alpha2);
    expect(given).toEqual(Object.keys(EXPECTED).sort());
    expect(capitalsOf("IL")).toBeNull();
    expect(capitalsOf("PS")).toBeNull();
    expect(capitalsOf("JP")).toBeNull();
    expect(capitalsOf("SZ")).toBeNull();
  });

  it("names the day the pages were read", () => {
    expect(CAPITALS_READ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("the capital field", () => {
  // Every country's capital as it was before this change (src/capital-values.json, taken from the data at 56edf15).
  const before = JSON.parse(readFileSync(join(import.meta.dirname, "capital-values.json"), "utf8")) as Record<string, [string, string] | null>;

  it("is the same for every one of the 250 countries", () => {
    expect(Object.keys(before)).toHaveLength(250);
    for (const one of countries()) {
      const old = before[one.alpha2];
      expect(one.capital, one.alpha2).toEqual(old === null ? undefined : { en: old![0], ja: old![1] });
    }
  });

  it("is still one name, with no role, for a country that has several capitals", () => {
    expect(countries().find((one) => one.alpha2 === "ZA")!.capital).toEqual({ en: "Pretoria", ja: "プレトリア" });
    expect(countries().find((one) => one.alpha2 === "LK")!.capital).toEqual({ en: "Colombo", ja: "コロンボ" });
    expect(countries().find((one) => one.alpha2 === "IL")!.capital).toEqual({ en: "Jerusalem", ja: "エルサレム" });
    expect(countries().find((one) => one.alpha2 === "PS")!.capital).toEqual({ en: "Ramallah", ja: "ラマッラー" });
  });
});
