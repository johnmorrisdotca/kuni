// The /withdrawn entry: the 31 entries of ISO 3166-3, each with a four-letter code that begins with its alpha-2 code,
// the years it was in force, at least one successor, and a name in English; a code that is a current country's too is
// marked; and none of them is in the main entry. The whole table of codes, years and successors is pinned below, written out
// again from ISO 3166-3's published list, so that a rebuild of the data cannot drift from it.
import { describe, expect, it } from "vitest";

import { IOC_CHOICES, IOC_FILLS, NAME_FILLS, WITHDRAWN_TABLE } from "../scripts/withdrawn-config";
import { countries, country, COUNTRY_CODES, isCountryCode } from "./index";
import { withdrawn, withdrawnCountries, WITHDRAWN_READ } from "./withdrawn";

/**
 * ISO 3166-3 as published (Online Browsing Platform, https://www.iso.org/obp/ui/#iso:code:3166:3): code | alpha-3 | numeric
 * (none where ISO lists none) | from | until | new codes in ISO's order. Written out here by hand, apart from the data's own table.
 */
const ISO_3166_3 = `BQAQ|ATB|none|1974|1979|AQ ; BUMM|BUR|104|1974|1989|MM ; BYAA|BYS|112|1974|1992|BY ; CTKI|CTE|128|1974|1984|KI ; CSHH|CSK|200|1974|1993|CZ,SK ; DYBJ|DHY|204|1974|1977|BJ ; NQAQ|ATN|216|1974|1983|AQ ; TPTL|TMP|626|1974|2002|TL ; FXFR|FXX|249|1993|1997|FR ; AIDJ|AFI|262|1974|1977|DJ ; FQHH|ATF|none|1974|1979|AQ,TF ; DDDE|DDR|278|1974|1990|DE ; GEHH|GEL|none|1974|1979|KI ; JTUM|JTN|396|1974|1986|UM ; MIUM|MID|488|1974|1986|UM ; ANHH|ANT|530|1974|2010|BQ,CW,SX ; NTHH|NTZ|536|1974|1993|IQ,SA ; NHVU|NHB|none|1974|1980|VU ; PCHH|PCI|582|1974|1986|FM,MH,MP,PW ; PZPA|PCZ|none|1974|1980|PA ; CSXX|SCG|891|2003|2006|ME,RS ; SKIN|SKM|none|1974|1975|IN ; RHZW|RHO|none|1974|1980|ZW ; PUUM|PUS|849|1974|1986|UM ; HVBF|HVO|854|1974|1984|BF ; SUHH|SUN|810|1974|1992|AM,AZ,EE,GE,KZ,KG,LV,LT,MD,RU,TJ,TM,UZ ; VDVN|VDR|none|1974|1977|VN ; WKUM|WAK|872|1974|1986|UM ; YDYE|YMD|720|1974|1990|YE ; YUCS|YUG|891|1974|2003|CS ; ZRCD|ZAR|180|1974|1997|CD`;

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

  it("has at least one successor: a current country, or a withdrawn one (Yugoslavia's is CS), in ISO's order", () => {
    const withdrawnCodes = new Set(withdrawnCountries().map((one) => one.alpha2));
    for (const one of withdrawnCountries()) {
      expect(one.successors.length, one.code).toBeGreaterThan(0);
      for (const code of one.successors) {
        expect((COUNTRY_CODES as readonly string[]).includes(code) || withdrawnCodes.has(code), `${one.code} ${code}`).toBe(true);
      }
    }
    // The chain: YUCS to CS, which is Serbia and Montenegro first and Czechoslovakia after, and from there to ME, RS, CZ and SK.
    expect(withdrawn("YUCS")[0].successors).toEqual(["CS"]);
    expect(withdrawn("CS").map((one) => one.code)).toEqual(["CSXX", "CSHH"]);
  });

  it("is ISO 3166-3's table, every code, alpha-3, numeric, year and successor, as published", () => {
    const written = ISO_3166_3.split(" ; ").map((row) => row.split("|"));
    expect(written).toHaveLength(31);
    const records = new Map(withdrawnCountries().map((one) => [one.code, one]));
    expect(records.size).toBe(31);
    for (const [code, alpha3, numeric, from, until, successors] of written) {
      const one = records.get(code as string);
      expect(one, code).toBeDefined();
      expect({ alpha3: one?.alpha3, numeric: one?.numeric ?? "none", since: one?.since, until: one?.until, successors: one?.successors.join(",") }, code).toEqual({ alpha3, numeric, since: from, until, successors });
    }
    // And the data's own table says the same, so that nothing but ISO's list can change what is served.
    const own = Object.entries(WITHDRAWN_TABLE).map(([code, e]) => [code, e.alpha3, e.numeric ?? "none", e.since, e.until, e.successors.join(",")].join("|"));
    expect(own.sort()).toEqual(written.map((row) => row.join("|")).sort());
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
    expect(withdrawn("SU")[0].successors).toEqual(["AM", "AZ", "EE", "GE", "KZ", "KG", "LV", "LT", "MD", "RU", "TJ", "TM", "UZ"]);
    expect(withdrawn("YU")[0]).toMatchObject({ code: "YUCS", alpha3: "YUG", name: { en: "Yugoslavia", ja: "ユーゴスラビア" }, until: "2003" });
    expect(withdrawn("YU")[0].successors).toEqual(["CS"]);
    expect(withdrawn("CSK")[0]).toMatchObject({ code: "CSHH", successors: ["CZ", "SK"], until: "1993" });
    expect(withdrawn("DD")[0]).toMatchObject({ code: "DDDE", numeric: "278", successors: ["DE"], until: "1990" });
    expect(withdrawn("ZR")[0]).toMatchObject({ code: "ZRCD", alpha3: "ZAR", name: { en: "Zaire" }, successors: ["CD"] });
    expect(withdrawn("TP")[0]).toMatchObject({ code: "TPTL", alpha3: "TMP", numeric: "626", name: { en: "East Timor" }, successors: ["TL"], until: "2002" });
    expect(withdrawn("AN")[0].successors).toEqual(["BQ", "CW", "SX"]);
    expect(withdrawn("BU")[0]).toMatchObject({ code: "BUMM", alpha3: "BUR", numeric: "104", name: { en: "Burma", ja: "ビルマ" }, successors: ["MM"] });
  });

  it("lists no numeric code where ISO lists none, and the ones a successor still uses where ISO does", () => {
    for (const code of ["BQAQ", "FQHH", "GEHH", "NHVU", "PZPA", "SKIN", "RHZW", "VDVN"]) expect(withdrawn(code)[0].numeric, code).toBeUndefined();
    expect(withdrawn("FQHH")[0]).toMatchObject({ alpha3: "ATF", successors: ["AQ", "TF"] });
    expect(withdrawn("PZPA")[0].until).toBe("1980");
    expect(withdrawn("VDVN")[0].until).toBe("1977");
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

describe("what was written by hand", () => {
  it("is explained, and is for a record that exists", () => {
    const codes = new Set(withdrawnCountries().map((one) => one.code));
    for (const [code, fill] of Object.entries(NAME_FILLS)) {
      expect(codes.has(code), code).toBe(true);
      expect(fill.why.trim().length, code).toBeGreaterThan(15);
    }
    expect([...codes].sort()).toEqual(Object.keys(WITHDRAWN_TABLE).sort());
    for (const fill of [...Object.values(IOC_CHOICES), ...Object.values(IOC_FILLS)]) expect(fill.why.trim().length).toBeGreaterThan(15);
  });
});
