import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { COUNTRY_CODES as CODES_ENTRY, isCountryCode as isCodeFromCodes } from "./codes";
import {
  continentName,
  countries,
  country,
  countryByName,
  countryName,
  COUNTRY_CODES,
  flag,
  fold,
  isCountryCode,
  subregionName,
  VERSION,
} from "./index";

// ISO 3166-1's 249 officially assigned alpha-2 codes, written out here rather than read from the data, so the
// data is checked against something it was not made from (the list itsutsu.com kept by hand).
const ISO_3166_1 = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY
BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT
MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG
UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(/\s+/);

describe("the countries", () => {
  it("are every ISO 3166-1 code, 249, and Kosovo as a user-assigned code", () => {
    expect(ISO_3166_1).toHaveLength(249);
    expect(COUNTRY_CODES).toHaveLength(250);
    expect([...COUNTRY_CODES].sort()).toEqual([...ISO_3166_1, "XK"].sort());
    expect(countries().filter((one) => one.kind === "user").map((one) => one.alpha2)).toEqual(["XK"]);
    expect(CODES_ENTRY).toBe(COUNTRY_CODES);
  });

  it("each have both codes, a name in English and in Japanese, a flag and a continent", () => {
    for (const one of countries()) {
      expect(one.alpha3, one.alpha2).toMatch(/^[A-Z]{3}$/);
      expect(one.numeric, one.alpha2).toMatch(/^\d{3}$/);
      expect(one.name.en.length, one.alpha2).toBeGreaterThan(2);
      expect(one.name.ja, one.alpha2).toMatch(/[\p{Script=Han}\p{Script=Katakana}\p{Script=Hiragana}]/u);
      expect([...one.flag].length, one.alpha2).toBe(2);
      expect(["AF", "AN", "AS", "EU", "NA", "OC", "SA"]).toContain(one.continent);
    }
    expect(new Set(countries().map((one) => one.alpha3)).size).toBe(250);
    expect(new Set(countries().map((one) => one.numeric)).size).toBe(250);
  });

  it("are ordered by code, by English name or by Japanese reading", () => {
    expect(countries()[0].alpha2).toBe("AD");
    const english = countries({ order: "en" }).map((one) => one.name.en);
    expect(english[0]).toBe("Afghanistan");
    expect(english.indexOf("Åland Islands")).toBe(1);
    const japanese = countries({ order: "ja" });
    expect(japanese[0].name.ja).toBe("アイスランド");
    // 日本 is read にほん, so it sits among the に, not at the end with the other kanji.
    const at = japanese.findIndex((one) => one.alpha2 === "JP");
    expect(japanese[at - 1].name.ja.startsWith("ニ") || japanese[at - 1].reading?.startsWith("に")).toBe(true);
    expect(countries({ order: "ja" })).toBe(japanese);
  });

  it("carry what CLDR, Wikidata, countries-list and IANA say of Japan", () => {
    expect(country("JP")).toEqual({
      alpha2: "JP",
      alpha3: "JPN",
      numeric: "392",
      kind: "iso",
      name: { en: "Japan", ja: "日本", local: "日本" },
      flag: "\u{1f1ef}\u{1f1f5}",
      continent: "AS",
      reading: "にほん",
      subregion: "030",
      callingCode: "+81",
      currency: ["JPY"],
      tld: "jp",
      capital: { en: "Tokyo", ja: "東京都" },
      zones: ["Asia/Tokyo"],
      languages: ["ja"],
      subdivisionType: "prefecture",
    });
  });

  it("give the North American plan's members +1, Kosovo +383, and the United Kingdom .uk", () => {
    expect(country("AI")?.callingCode).toBe("+1");
    expect(country("DO")?.callingCode).toBe("+1");
    expect(country("XK")?.callingCode).toBe("+383");
    expect(country("GB")?.tld).toBe("uk");
    expect(country("XK")?.tld).toBeUndefined();
  });

  it("have short names from CLDR where it has them", () => {
    expect(country("US")?.shortName).toEqual({ en: "US", ja: "アメリカ" });
    expect(country("GB")?.shortName).toEqual({ en: "UK", ja: "英国" });
    expect(country("FR")?.shortName).toBeUndefined();
  });

  it("are frozen, so one caller cannot change another's answer", () => {
    const japan = country("JP")!;
    expect(Object.isFrozen(japan)).toBe(true);
    expect(Object.isFrozen(japan.name)).toBe(true);
    expect(Object.isFrozen(japan.zones)).toBe(true);
    expect(Object.isFrozen(countries())).toBe(true);
  });
});

describe("country", () => {
  it("takes alpha-2 in either case, alpha-3 and numeric codes", () => {
    expect(country("jp")?.alpha2).toBe("JP");
    expect(country(" JPN ")?.alpha2).toBe("JP");
    expect(country("392")?.alpha2).toBe("JP");
    expect(country("XK")?.name.en).toBe("Kosovo");
  });

  it("answers null for anything that is not a country's code", () => {
    for (const code of ["", "ZZ", "EU", "UK", "J", "JPNX", "999"]) expect(country(code), code).toBeNull();
    expect(country(undefined as unknown as string)).toBeNull();
  });
});

describe("isCountryCode", () => {
  it("is true for the 250 codes as ISO writes them, and nothing else", () => {
    expect(isCountryCode("JP")).toBe(true);
    expect(isCountryCode("XK")).toBe(true);
    expect(isCountryCode("jp")).toBe(false);
    expect(isCountryCode("UK")).toBe(false);
    expect(isCountryCode(81)).toBe(false);
    expect(isCodeFromCodes("GB")).toBe(true);
  });
});

describe("countryByName", () => {
  const cases: [string, string][] = [
    ["Germany", "DE"],
    ["ドイツ", "DE"],
    ["どいつ", "DE"],
    ["ﾄﾞｲﾂ", "DE"],
    ["Deutschland", "DE"],
    ["GERMANY", "DE"],
    ["Holland", "NL"],
    ["the Netherlands", "NL"],
    ["UK", "GB"],
    ["England", "GB"],
    ["イギリス", "GB"],
    ["英国", "GB"],
    ["Burma", "MM"],
    ["Myanmar", "MM"],
    ["USA", "US"],
    ["U.S.A.", "US"],
    ["ＵＳＡ", "US"],
    ["アメリカ", "US"],
    ["米国", "US"],
    ["Côte d’Ivoire", "CI"],
    ["cote d'ivoire", "CI"],
    ["Ivory Coast", "CI"],
    ["Viet Nam", "VN"],
    ["Vietnam", "VN"],
    ["the Bahamas", "BS"],
    ["Türkiye", "TR"],
    ["Turkey", "TR"],
    ["日本", "JP"],
    ["にほん", "JP"],
    ["jp", "JP"],
    ["JPN", "JP"],
    ["Kosovo", "XK"],
  ];
  for (const [typed, code] of cases) {
    it(`finds ${code} from ${JSON.stringify(typed)}`, () => {
      expect(countryByName(typed)?.alpha2).toBe(code);
    });
  }

  it("answers null for what is not a country", () => {
    for (const typed of ["", "   ", "Atlantis", "Ontario", "zz", "--"]) expect(countryByName(typed), typed).toBeNull();
  });
});

describe("countryName and flag", () => {
  it("name a country in either language, short or in full", () => {
    expect(countryName("US")).toBe("United States");
    expect(countryName("US", "ja")).toBe("アメリカ合衆国");
    expect(countryName("US", "ja", { short: true })).toBe("アメリカ");
    expect(countryName("FR", "en", { short: true })).toBe("France");
    expect(countryName("ZZ")).toBeNull();
    expect(countryName("JP", "fr" as "en")).toBeNull();
  });

  it("make the flag from the code's two letters", () => {
    expect(flag("CA")).toBe("\u{1f1e8}\u{1f1e6}");
    expect(flag("ca")).toBe("\u{1f1e8}\u{1f1e6}");
    expect(flag("ZZ")).toBeNull();
  });
});

describe("continentName and subregionName", () => {
  it("name the seven continents and the UN subregions in English and Japanese, from CLDR", () => {
    expect(continentName("AS")).toBe("Asia");
    expect(continentName("AS", "ja")).toBe("アジア");
    expect(continentName("AN")).toBe("Antarctica");
    expect(continentName("XX" as "AS")).toBeNull();
    expect(subregionName("030")).toBe("Eastern Asia");
    expect(subregionName("030", "ja")).toBe("東アジア");
    expect(subregionName("999")).toBeNull();
    for (const one of countries()) if (one.subregion !== undefined) expect(subregionName(one.subregion), one.alpha2).not.toBeNull();
  });
});

describe("fold", () => {
  it("sets aside case, accents, width, the two kana scripts and punctuation", () => {
    expect(fold("Côte d’Ivoire")).toBe("cote divoire");
    expect(fold("ÅLAND")).toBe("aland");
    expect(fold("ＵＳＡ")).toBe("usa");
    expect(fold("ﾄﾞｲﾂ")).toBe(fold("ドイツ"));
    expect(fold("ドイツ")).toBe("どいつ");
    expect(fold("ガ")).toBe("が");
    expect(fold("パ")).toBe("ぱ");
    expect(fold("ローヌ＝アルプ")).toBe(fold("ローヌ・アルプ"));
    expect(fold("  St. Kitts & Nevis  ")).toBe("st kitts nevis");
    expect(fold("東京都")).toBe("東京都");
  });

  it("is the same answer twice, and leaves an already folded text as it is", () => {
    for (const text of ["Ōita", "オンタリオ州", "Saint-Pierre", "ＵＳＡ"]) expect(fold(fold(text))).toBe(fold(text));
  });
});

describe("the source", () => {
  it("asks Intl for nothing, so a server and a browser give the same answer", () => {
    const files = readdirSync("src").filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));
    for (const file of files) expect(readFileSync(join("src", file), "utf8"), file).not.toMatch(/\bIntl\.[A-Z]|localeCompare\(|toLocale\w*\(/);
  });

  it("says the version package.json says", () => {
    expect(VERSION).toBe(JSON.parse(readFileSync("package.json", "utf8")).version);
  });
});
