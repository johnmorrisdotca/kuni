// The /withdrawn entry: the 31 entries of ISO 3166-3, each with a four-letter code that begins with its alpha-2 code,
// the years it was in force, at least one successor that is a current country, and a name in English; a code that is
// a current country's too is marked; and none of them is in the main entry.
import { describe, expect, it } from "vitest";

import { CODE_FILLS, IOC_CHOICES, IOC_FILLS, NAME_FILLS, PERIOD_FILLS, SUCCESSOR_FILLS } from "../scripts/withdrawn-config";
import { countries, country, COUNTRY_CODES, isCountryCode } from "./index";
import { withdrawn, withdrawnCountries, WITHDRAWN_READ } from "./withdrawn";

const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

describe("every withdrawn country", () => {
  it("is the 31 of ISO 3166-3, each once, in order of its code", () => {
    const codes = withdrawnCountries().map((one) => one.code);
    expect(codes).toHaveLength(31);
    expect(new Set(codes).size).toBe(31);
    expect([...codes].sort()).toEqual(codes);
    for (const wanted of ["SUHH", "YUCS", "CSHH", "CSXX", "DDDE", "ZRCD", "TPTL", "ANHH", "BUMM"]) expect(codes).toContain(wanted);
  });

  it("has a four-letter code that begins with its alpha-2 code, a name, and a year it began and ended", () => {
    for (const one of withdrawnCountries()) {
      expect(one.code, one.code).toMatch(/^[A-Z]{4}$/);
      expect(one.alpha2, one.code).toBe(one.code.slice(0, 2));
      expect(one.alpha3 ?? "AAA", one.code).toMatch(/^[A-Z]{3}$/);
      expect(one.numeric ?? "000", one.code).toMatch(/^\d{3}$/);
      expect(one.name.en.trim(), one.code).not.toBe("");
      if (one.name.ja !== null) expect(one.name.ja, one.code).toMatch(JAPANESE);
      for (const when of [one.since, one.until]) expect(when, one.code).toMatch(/^\d{4}(-\d\d-\d\d)?$/);
      expect(one.until > one.since, `${one.code} ends ${one.until} before it begins ${one.since}`).toBe(true);
    }
  });

  it("has at least one successor, every one a current country, in order", () => {
    for (const one of withdrawnCountries()) {
      expect(one.successors.length, one.code).toBeGreaterThan(0);
      for (const code of one.successors) expect(COUNTRY_CODES as readonly string[], `${one.code} ${code}`).toContain(code);
      expect([...one.successors].sort(), one.code).toEqual(one.successors);
    }
  });

  it("is never in the main entry's lists or lookups, and a code a current country holds says so", () => {
    const current = new Set(COUNTRY_CODES as readonly string[]);
    for (const one of withdrawnCountries()) {
      if (current.has(one.alpha2)) {
        expect(one.reusedBy, `${one.code}: ${one.alpha2} is a current country and the record does not say`).toBe(one.alpha2);
        expect(isCountryCode(one.alpha2)).toBe(true);
      } else {
        expect(one.reusedBy, one.code).toBeUndefined();
        expect(country(one.alpha2), `${one.code}: ${one.alpha2} found in the main entry`).toBeNull();
        expect(isCountryCode(one.alpha2), one.code).toBe(false);
      }
    }
    expect(countries().some((one) => ["SU", "YU", "CS", "DD", "ZR", "TP", "AN", "BU"].includes(one.alpha2))).toBe(false);
    // The ones that were reused are exactly these five.
    expect(withdrawnCountries().filter((one) => one.reusedBy !== undefined).map((one) => one.alpha2)).toEqual(["AI", "BQ", "BY", "GE", "SK"]);
  });

  it("gives the Japanese name or null, never an English name copied in", () => {
    const missing = withdrawnCountries().filter((one) => one.name.ja === null).map((one) => one.code);
    expect(missing).toEqual(["CTKI", "PUUM"]);
  });

  it("has no bracket left on a Japanese name", () => {
    for (const one of withdrawnCountries()) expect(one.name.ja ?? "", one.code).not.toMatch(/[()（）]/);
  });
});

describe("the places a reader would check", () => {
  it("knows the Soviet Union, Yugoslavia, Czechoslovakia, East Germany and Zaire", () => {
    expect(withdrawn("SU")).toHaveLength(1);
    expect(withdrawn("SU")[0]).toMatchObject({ code: "SUHH", alpha3: "SUN", numeric: "810", name: { en: "Soviet Union", ja: "ソビエト連邦" }, since: "1974", until: "1992" });
    expect(withdrawn("SU")[0].successors).toEqual(["AM", "AZ", "BY", "EE", "GE", "KG", "KZ", "LT", "LV", "MD", "RU", "TJ", "TM", "UA", "UZ"]);
    expect(withdrawn("YU")[0]).toMatchObject({ code: "YUCS", alpha3: "YUG", name: { en: "Yugoslavia", ja: "ユーゴスラビア" }, until: "2003" });
    expect(withdrawn("YU")[0].successors).toEqual(["BA", "HR", "ME", "MK", "RS", "SI"]);
    expect(withdrawn("CSK")[0]).toMatchObject({ code: "CSHH", successors: ["CZ", "SK"], until: "1993" });
    expect(withdrawn("DD")[0]).toMatchObject({ code: "DDDE", numeric: "278", successors: ["DE"], until: "1990" });
    expect(withdrawn("ZR")[0]).toMatchObject({ code: "ZRCD", alpha3: "ZAR", name: { en: "Zaire" }, successors: ["CD"] });
    expect(withdrawn("TP")[0]).toMatchObject({ code: "TPTL", alpha3: "TMP", name: { en: "East Timor" }, successors: ["TL"], until: "2002" });
    expect(withdrawn("AN")[0].successors).toEqual(["AW", "BQ", "CW", "SX"]);
    expect(withdrawn("BU")[0]).toMatchObject({ code: "BUMM", alpha3: "BUR", name: { en: "Burma", ja: "ビルマ" }, successors: ["MM"] });
  });

  it("leaves out a code the successor still uses", () => {
    expect(withdrawn("TPTL")[0].numeric).toBeUndefined();
    expect(withdrawn("BUMM")[0].numeric).toBeUndefined();
    expect(withdrawn("FQHH")[0].alpha3).toBeUndefined();
    expect(withdrawn("FQHH")[0].numeric).toBeUndefined();
    expect(withdrawn("ZRCD")[0].numeric).toBe("180");
  });

  it("tells two countries apart that held one code", () => {
    expect(withdrawn("CS").map((one) => one.code)).toEqual(["CSXX", "CSHH"]);
    expect(withdrawn("891").map((one) => one.code).sort()).toEqual(["CSXX", "YUCS"]);
  });
});

describe("the lookup", () => {
  it("takes a code in either case, with spaces, and any of the four kinds", () => {
    expect(withdrawn(" su ")[0].code).toBe("SUHH");
    expect(withdrawn("suhh")[0].code).toBe("SUHH");
    expect(withdrawn("sun")[0].code).toBe("SUHH");
    expect(withdrawn("810")[0].code).toBe("SUHH");
  });

  it("answers an empty list for anything else", () => {
    expect(withdrawn("JP")).toEqual([]);
    expect(withdrawn("")).toEqual([]);
    expect(withdrawn("XXXX")).toEqual([]);
    expect(withdrawn(undefined as unknown as string)).toEqual([]);
  });

  it("hands out frozen records", () => {
    expect(Object.isFrozen(withdrawnCountries())).toBe(true);
    expect(Object.isFrozen(withdrawnCountries()[0])).toBe(true);
    expect(Object.isFrozen(withdrawnCountries()[0].successors)).toBe(true);
  });

  it("says the day the snapshot was read", () => {
    expect(WITHDRAWN_READ).toMatch(/^\d{4}-\d\d-\d\d$/);
  });
});

describe("what was filled by hand", () => {
  it("is explained, and is for a record that exists", () => {
    const codes = new Set(withdrawnCountries().map((one) => one.code));
    for (const table of [CODE_FILLS, PERIOD_FILLS, SUCCESSOR_FILLS, NAME_FILLS]) {
      for (const [code, fill] of Object.entries(table)) {
        expect(codes.has(code), code).toBe(true);
        expect(fill.why.trim().length, code).toBeGreaterThan(15);
      }
    }
    for (const fill of [...Object.values(IOC_CHOICES), ...Object.values(IOC_FILLS)]) expect(fill.why.trim().length).toBeGreaterThan(15);
  });
});
