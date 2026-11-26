import { describe, expect, it } from "vitest";

import { countries, country, COUNTRY_STATUSES, dependenciesOf } from "./index";
import { membersOf } from "./groupings";

// The other entities: every code that lists of the world's countries set apart from the 195.
const OTHER_ENTITIES = `AX AS AI AW BM BQ VG KY CX CC CK CW FK FO GF PF GI GL GP GU GG HK IM JE MO MQ YT MS NC NU NF MP PN PR RE SH BL MF SX PM SJ
TK TC VI WF EH XK TW BV HM TF IO UM AQ GS`.split(/\s+/);

describe("what each country is", () => {
  it("gives every country one of the six statuses", () => {
    for (const one of countries()) expect(COUNTRY_STATUSES, one.alpha2).toContain(one.status);
    expect(COUNTRY_STATUSES.map((status) => countries({ status }).length)).toEqual([193, 2, 46, 2, 3, 4]);
    expect(COUNTRY_STATUSES.reduce((sum, status) => sum + countries({ status }).length, 0)).toBe(250);
  });

  it("calls a member of the United Nations exactly what the UN grouping lists", () => {
    expect(countries({ status: "un-member" }).map((one) => one.alpha2)).toEqual([...membersOf("un")!].sort());
    expect(countries({ status: "un-observer" }).map((one) => one.alpha2)).toEqual(["PS", "VA"]);
  });

  it("sets the 195 apart from the other entities", () => {
    const states = [...countries({ status: "un-member" }), ...countries({ status: "un-observer" })].map((one) => one.alpha2);
    expect(states).toHaveLength(195);
    expect(countries().filter((one) => !states.includes(one.alpha2)).map((one) => one.alpha2).sort()).toEqual([...OTHER_ENTITIES].sort());
  });

  it("names the sovereign of a territory, and none for a state", () => {
    const sovereigns = { BM: "GB", PR: "US", GL: "DK", FO: "DK", AW: "NL", CW: "NL", SX: "NL", MQ: "FR", GP: "FR", GF: "FR", RE: "FR", YT: "FR", HK: "CN", MO: "CN", AX: "FI", TK: "NZ", NU: "NZ" };
    for (const [code, sovereign] of Object.entries(sovereigns)) expect(country(code)?.sovereign, code).toBe(sovereign);
    for (const one of countries()) {
      if (one.status === "un-member" || one.status === "un-observer") expect(one.sovereign, one.alpha2).toBeUndefined();
      if (one.sovereign !== undefined) expect(country(one.sovereign)?.status, one.alpha2).toBe("un-member");
    }
  });

  it("takes no side where sovereignty is disputed", () => {
    expect(countries({ status: "disputed" }).map((one) => one.alpha2)).toEqual(["EH", "TW", "XK"]);
    for (const one of countries({ status: "disputed" })) expect(one.sovereign, one.alpha2).toBeUndefined();
    expect(country("EH")?.type).toEqual({ en: "disputed territory", ja: "領有権が争われている地域" });
    expect(country("TW")?.type).toBeUndefined();
    expect(country("XK")?.type).toBeUndefined();
    expect(country("TW")?.name.en).toBe("Taiwan");
    expect(country("XK")?.name.en).toBe("Kosovo");
  });

  it("marks the special regions and the places nobody lives in for good", () => {
    expect(countries({ status: "special-region" }).map((one) => one.alpha2)).toEqual(["HK", "MO"]);
    expect(countries({ status: "uninhabited" }).map((one) => one.alpha2)).toEqual(["AQ", "BV", "GS", "HM"]);
    expect(country("AQ")?.sovereign).toBeUndefined();
  });

  it("gives a territory a short type in both languages, and a state none", () => {
    expect(country("BM")?.type).toEqual({ en: "British Overseas Territory", ja: "イギリスの海外領土" });
    expect(country("JE")?.type?.en).toBe("Crown Dependency");
    expect(country("PR")?.type?.en).toBe("unincorporated territory of the United States");
    expect(country("AW")?.type).toEqual({ en: "constituent country of the Kingdom of the Netherlands", ja: "オランダ王国の構成国" });
    expect(country("HK")?.type).toEqual({ en: "special administrative region of China", ja: "中国の特別行政区" });
    expect(country("PF")?.type?.en).toBe("overseas collectivity of France");
    expect(country("BV")?.type).toEqual({ en: "dependency of Norway", ja: "ノルウェーの属領" });
    expect(country("CK")?.type).toEqual({ en: "in free association with New Zealand", ja: "ニュージーランドとの自由連合" });
    expect(country("PF")?.type?.ja).toBe("フランスの海外共同体");
    expect(country("GP")?.type?.ja).toBe("フランスの海外県");
    expect(country("TF")?.type?.ja).toBe("フランスの属領");
    expect(country("TK")?.type?.ja).toBe("ニュージーランドの属領");
    expect(country("FO")?.type?.ja).toBe("デンマーク王国の自治領");
    expect(country("AX")?.type?.ja).toBe("フィンランドの自治領");
    expect(country("UM")?.type?.ja).toBe("アメリカ合衆国の島嶼地域");
    expect(country("SJ")?.type?.ja).toBe("ノルウェーの領土");
    expect(country("PR")?.type?.ja).toBe("アメリカ合衆国の未編入領域");
    expect(country("NU")?.type).toEqual({ en: "in free association with New Zealand", ja: "ニュージーランドとの自由連合" });
    // Whoever has a sovereign names it in Japanese.
    for (const one of countries({ status: "territory" })) if (one.type?.ja != null && one.alpha2 !== "BQ") expect(one.type.ja, one.alpha2).toMatch(/の|との/);
    expect(country("JP")?.type).toBeUndefined();
    expect(country("VA")?.type).toBeUndefined();
    // The two with no type are the two the build explains (scripts/status-config.ts, TYPE_GAPS).
    const untyped = countries().filter((one) => one.status !== "un-member" && one.status !== "un-observer" && one.type === undefined);
    expect(untyped.map((one) => one.alpha2)).toEqual(["AQ", "BQ", "TW", "XK"]);
  });

  it("filters by status in any order, and hands out frozen lists", () => {
    expect(countries({ status: "un-member", order: "en" })[0].name.en).toBe("Afghanistan");
    expect(countries({ status: "territory", order: "ja" })).toHaveLength(46);
    expect(countries({ status: "territory" })).toBe(countries({ status: "territory" }));
    expect(Object.isFrozen(countries({ status: "territory" }))).toBe(true);
    expect(Object.isFrozen(country("BM")?.type)).toBe(true);
  });

  it("lists the places that belong to a state", () => {
    expect(dependenciesOf("DK").map((one) => one.alpha2)).toEqual(["FO", "GL"]);
    expect(dependenciesOf("gbr").map((one) => one.alpha2)).toEqual(["AI", "BM", "FK", "GG", "GI", "GS", "IM", "IO", "JE", "KY", "MS", "PN", "SH", "TC", "VG"]);
    expect(dependenciesOf("NL").map((one) => one.alpha2)).toEqual(["AW", "BQ", "CW", "SX"]);
    expect(dependenciesOf("JP")).toEqual([]);
    expect(dependenciesOf("nowhere")).toEqual([]);
    expect(Object.isFrozen(dependenciesOf("GB"))).toBe(true);
  });
});
