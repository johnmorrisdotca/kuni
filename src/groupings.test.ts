// The /groupings entry: every grouping is named in both languages, has members that are real codes, a definition, a
// source and a day it was true; the bodies' lists are the ones a reader knows; the dates work; the sets cover
// their countries once.
import { describe, expect, it } from "vitest";

import { MEMBERSHIPS_LEFT_OUT } from "../scripts/groupings-config";
import { GROUPING_KINDS, grouping, groupings, groupingsOf, membersOf, unknownMembersOf } from "./groupings";
import { standing, sureFrom, sureTo } from "./grouping-days";
import { countries, COUNTRY_CODES } from "./index";
import { subdivision, subdivisions } from "./subdivisions";

const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const HAN = /\p{Script=Han}/u;

describe("every grouping", () => {
  it("has an id, both names, members that are real codes, a definition, a source with a licence, and a day", () => {
    const ids = new Set<string>();
    for (const one of groupings()) {
      expect(ids.has(one.id), one.id).toBe(false);
      ids.add(one.id);
      expect(one.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(GROUPING_KINDS).toContain(one.kind);
      expect(one.name.en.trim(), one.id).not.toBe("");
      if (!/^[A-Z0-9]+$/.test(one.name.ja)) expect(one.name.ja, one.id).toMatch(JAPANESE);
      if (HAN.test(one.name.ja)) expect(one.reading, `${one.id} ${one.name.ja} has no reading`).toMatch(/^[\p{Script=Hiragana}ー・]+$/u);
      expect(one.members.length, one.id).toBeGreaterThan(0);
      for (const code of one.members) {
        if (one.kind === "subdivision") expect(subdivision(code)?.country, `${one.id} ${code}`).toBe(one.country);
        else expect(COUNTRY_CODES as readonly string[], `${one.id} ${code}`).toContain(code);
      }
      expect([...one.members].sort(), one.id).toEqual(one.members);
      expect(one.definition.length, one.id).toBeGreaterThan(10);
      expect(one.source.url, one.id).toMatch(/^https?:\/\//);
      expect(one.source.licence.length, one.id).toBeGreaterThan(3);
      expect(one.asOf).toMatch(/^\d{4}-\d\d-\d\d$/);
      expect(one.informal).toBe(one.kind === "informal");
      if (one.parent !== undefined) expect(grouping(one.parent)?.members, one.id).toEqual(expect.arrayContaining([...one.members]));
    }
  });

  it("puts every country but none in exactly one continent, and the model is seven", () => {
    const continents = groupings({ kind: "continent" });
    expect(continents).toHaveLength(7);
    const all = continents.flatMap((one) => one.members).sort();
    expect(all).toEqual([...COUNTRY_CODES].sort());
    expect(grouping("continent-an")?.members).toEqual(["AQ"]);
    // UN M49's continents, where 1.0.0's departed from them.
    expect(groupingsOf("RU", { kind: "continent" })[0].id).toBe("continent-eu");
    expect(groupingsOf("CY", { kind: "continent" })[0].id).toBe("continent-as");
    expect(groupingsOf("TL", { kind: "continent" })[0].id).toBe("continent-as");
    expect(groupingsOf("TF", { kind: "continent" })[0].id).toBe("continent-af");
    for (const one of countries()) expect(groupingsOf(one.alpha2, { kind: "continent" }).map((found) => found.id)).toEqual([`continent-${one.continent.toLowerCase()}`]);
  });

  it("gives UN M49's tree, with Antarctica in no area", () => {
    expect(grouping("m49-030")?.members).toEqual(["CN", "HK", "JP", "KP", "KR", "MN", "MO", "TW"]);
    expect(grouping("m49-030")?.parent).toBe("m49-142");
    expect(grouping("m49-005")?.parent).toBe("m49-419");
    expect(grouping("m49-419")?.parent).toBe("m49-019");
    expect(groupingsOf("AQ", { kind: "m49" })).toEqual([]);
  });
});

describe("the international bodies", () => {
  it("have the members the bodies list", () => {
    expect(membersOf("eu")).toHaveLength(27);
    expect(membersOf("eurozone")).toEqual(expect.arrayContaining(["BG", "HR"]));
    expect(membersOf("eurozone")).toHaveLength(21);
    expect(membersOf("schengen")).toHaveLength(29);
    expect(membersOf("eea")).toHaveLength(30);
    expect(membersOf("nato")).toHaveLength(32);
    expect(membersOf("g7")).toEqual(["CA", "DE", "FR", "GB", "IT", "JP", "US"]);
    expect(membersOf("g20")).toHaveLength(19);
    expect(membersOf("oecd")).toHaveLength(38);
    expect(membersOf("asean")).toHaveLength(11);
    expect(membersOf("african-union")).toHaveLength(55);
    expect(membersOf("arab-league")).toHaveLength(22);
    expect(membersOf("commonwealth")).toHaveLength(56);
    expect(membersOf("un")).toHaveLength(193);
    expect(membersOf("opec")).not.toContain("AO");
    expect(membersOf("mercosur")).not.toContain("VE");
  });

  it("keep candidates, associates, observers and the suspended apart from members", () => {
    expect(grouping("eu")?.others?.find((one) => one.code === "UA")?.status).toBe("candidate");
    expect(grouping("mercosur")?.others?.find((one) => one.code === "VE")?.status).toBe("suspended");
    expect(grouping("caricom")?.others?.filter((one) => one.status === "associate")).toHaveLength(5);
    for (const one of groupings({ kind: "membership" })) for (const other of one.others ?? []) expect(one.members, `${one.id} ${other.code}`).not.toContain(other.code);
  });

  it("answer for a day in the past", () => {
    expect(membersOf("eu", { on: "2019-06-30" })).toContain("GB");
    expect(membersOf("eu", { on: "2021-01-01" })).not.toContain("GB");
    expect(membersOf("opec", { on: "2020-06-30" })).toContain("AO");
    expect(membersOf("opec")).toContain("GA");
    expect(membersOf("opec")).not.toContain("EC");
    expect(membersOf("opec", { on: "1980-06-01" })).toEqual(expect.arrayContaining(["EC", "GA"]));
    expect(membersOf("opec", { on: "1993-06-01" })).not.toContain("EC");
    expect(membersOf("opec", { on: "1993-06-01" })).toContain("GA");
    expect(unknownMembersOf("opec", { on: "1992-12-15" })).toContain("EC");
    expect(membersOf("opec", { on: "2007-06-01" })).not.toContain("EC");
    expect(unknownMembersOf("opec", { on: "2007-10-01" })).toContain("EC");
    expect(membersOf("opec", { on: "2007-10-31" })).toContain("EC");
    expect(membersOf("opec", { on: "2010-01-01" })).toContain("EC");
    expect(membersOf("opec", { on: "2010-01-01" })).not.toContain("GA");
    expect(unknownMembersOf("opec", { on: "1995-01-15" })).toContain("GA");
    expect(unknownMembersOf("opec", { on: "2016-07-01" })).toContain("GA");
    expect(membersOf("opec", { on: "2016-07-31" })).toContain("GA");
    expect(groupingsOf("GB", { kind: "membership", on: "2015-01-01" }).map((one) => one.id)).toContain("eu");
    expect(membersOf("eu", { on: "not a day" })).toEqual(membersOf("eu"));
  });

  it("do not count BRICS' later members in 2015", () => {
    const in2015 = membersOf("brics", { on: "2015-01-01" }) ?? [];
    for (const code of ["AE", "EG", "ET", "ID", "IR"]) expect(in2015, code).not.toContain(code);
    expect(in2015).toEqual(["BR", "CN", "IN", "RU", "ZA"]);
    expect(membersOf("brics", { on: "2024-06-30" })).toEqual(expect.arrayContaining(["AE", "EG", "ET", "IR"]));
  });

  it("have no NATO in 1940", () => {
    expect(membersOf("nato", { on: "1940-01-01" })).toEqual([]);
    expect(unknownMembersOf("nato", { on: "1940-01-01" })).toEqual([]);
    expect(membersOf("nato", { on: "1950-01-01" })).toEqual(expect.arrayContaining(["DK", "NL", "US"]));
  });

  it("report a member with no joining day as unknown on a day, and not as a member", () => {
    const body = groupings({ kind: "membership" }).find((one) => one.periods?.some((period) => period.since === null && period.until === null));
    expect(body).toBeDefined();
    const undated = (body?.periods ?? []).filter((period) => period.since === null && period.until === null).map((period) => period.code);
    for (const id of ["mercosur", "gcc", "oecd"]) {
      const on = "2015-01-01";
      const found = grouping(id)?.periods?.filter((period) => period.since === null && period.until === null).map((period) => period.code) ?? [];
      expect(found.length, id).toBeGreaterThan(0);
      for (const code of found) {
        expect(membersOf(id, { on }), `${id} ${code}`).not.toContain(code);
        expect(unknownMembersOf(id, { on }), `${id} ${code}`).toContain(code);
        expect(groupingsOf(code, { kind: "membership", on }).map((one) => one.id), `${id} ${code}`).not.toContain(id);
      }
    }
    expect(undated.length).toBeGreaterThan(0);
    // Nothing is both, and with no day (or a body with no dates) nothing is unknown.
    for (const one of groupings({ kind: "membership" })) {
      const members = membersOf(one.id, { on: "2015-01-01" }) ?? [];
      for (const code of unknownMembersOf(one.id, { on: "2015-01-01" }) ?? []) expect(members, `${one.id} ${code}`).not.toContain(code);
    }
    expect(unknownMembersOf("mercosur")).toEqual([]);
    expect(unknownMembersOf("jp-kanto", { on: "2015-01-01" })).toEqual([]);
    expect(unknownMembersOf("atlantis", { on: "2015-01-01" })).toBeNull();
    expect(unknownMembersOf("brics", { on: "2015-01-01" })).toEqual(["ID"]);
    expect(unknownMembersOf("brics", { on: "2030-01-01" })).toEqual(["ID"]);
  });

  it("count the G7 on a day in 2020, and in 1975 only as unknown", () => {
    expect(membersOf("g7", { on: "2020-01-01" })).toEqual(["CA", "DE", "FR", "GB", "IT", "JP", "US"]);
    const first = ["DE", "FR", "GB", "IT", "JP", "US"];
    const in1975 = membersOf("g7", { on: "1975-06-01" }) ?? [];
    for (const code of first) expect(in1975, code).not.toContain(code);
    expect(unknownMembersOf("g7", { on: "1975-06-01" })).toEqual(first);
    expect(groupingsOf("DE", { kind: "membership", on: "1975-06-01" }).map((one) => one.id)).not.toContain("g7");
    expect(membersOf("g7", { on: "1974-12-31" })).toEqual([]);
    expect(unknownMembersOf("g7", { on: "1974-12-31" })).toEqual([]);
    // Canada's page says 1976.
    expect(unknownMembersOf("g7", { on: "1976-06-01" })).toEqual(["CA"]);
    expect(membersOf("g7", { on: "1976-06-01" })).toEqual(first);
    expect(membersOf("g7", { on: "1975-12-31" })).toEqual(first);
  });

  it("count a year-only joining day from the end of that year", () => {
    expect(membersOf("g7", { on: "1975-12-31" })).toContain("DE");
    expect(membersOf("g7", { on: "1975-12-30" })).not.toContain("DE");
    expect(unknownMembersOf("g7", { on: "1975-12-30" })).toContain("DE");
    expect(unknownMembersOf("g7", { on: "1975-12-31" })).not.toContain("DE");
    expect(groupingsOf("DE", { kind: "membership", on: "1975-12-31" }).map((one) => one.id)).toContain("g7");
    expect(groupingsOf("DE", { kind: "membership", on: "1975-12-30" }).map((one) => one.id)).not.toContain("g7");
    // The pages that give a month and a year, or a year, only.
    expect(unknownMembersOf("african-union", { on: "1968-06-01" })).toContain("MU");
    expect(membersOf("african-union", { on: "1968-12-31" })).toContain("MU");
    expect(unknownMembersOf("african-union", { on: "1990-03-21" })).toContain("NA");
    expect(unknownMembersOf("commonwealth", { on: "1926-06-01" })).toContain("GB");
    expect(membersOf("commonwealth", { on: "1926-12-31" })).toContain("GB");
  });

  it("read a year-only leaving day as a member to the end of the year before, unknown inside the year", () => {
    expect(standing("1950-01-01", "2020", "2019-12-31")).toBe("yes");
    expect(standing("1950-01-01", "2020", "2020-01-01")).toBe("unknown");
    expect(standing("1950-01-01", "2020", "2020-12-31")).toBe("unknown");
    expect(standing("1950-01-01", "2020", "2021-01-01")).toBe("no");
    expect(standing("1950-01-01", "2020", "1949-12-31")).toBe("no");
    expect(standing("1950", "2020", "1950-12-30")).toBe("unknown");
    expect(standing("1950", "2020", "1950-12-31")).toBe("yes");
  });

  it("read a month-only day as a member from its last day, unknown inside the month", () => {
    expect(standing("2007-10", null, "2007-09-30")).toBe("no");
    expect(standing("2007-10", null, "2007-10-01")).toBe("unknown");
    expect(standing("2007-10", null, "2007-10-30")).toBe("unknown");
    expect(standing("2007-10", null, "2007-10-31")).toBe("yes");
    expect(standing("1950-01-01", "1992-12", "1992-11-30")).toBe("yes");
    expect(standing("1950-01-01", "1992-12", "1992-12-01")).toBe("unknown");
    expect(standing("1950-01-01", "1992-12", "1992-12-31")).toBe("unknown");
    expect(standing("1950-01-01", "1992-12", "1993-01-01")).toBe("no");
    expect(standing("2024-02", null, "2024-02-28")).toBe("unknown");
    expect(standing("2024-02", null, "2024-02-29")).toBe("yes");
    expect(standing("2023-02", null, "2023-02-28")).toBe("yes");
  });

  it("keep the rules for a full day", () => {
    expect(standing("1958-01-01", null, "1957-12-31")).toBe("no");
    expect(standing("1958-01-01", null, "1958-01-01")).toBe("yes");
    expect(standing("1973-01-01", "2020-01-31", "2020-01-30")).toBe("yes");
    expect(standing("1973-01-01", "2020-01-31", "2020-01-31")).toBe("no");
    expect(standing(null, null, "2015-01-01")).toBe("unknown");
    expect(standing(null, "2020-01-31", "2020-01-31")).toBe("no");
    expect(membersOf("eu", { on: "2020-01-30" })).toContain("GB");
    expect(membersOf("eu", { on: "2020-01-31" })).not.toContain("GB");
    expect(membersOf("nato", { on: "1949-04-03" })).toEqual([]);
    expect(membersOf("nato", { on: "1949-04-04" })).toContain("DK");
  });

  it("hold Schengen's Bulgaria and Romania to one rule", () => {
    const stage = (code: string) => grouping("schengen")?.periods?.find((period) => period.code === code && period.until === null);
    expect(stage("BG")?.since).toBe("2024-03-31");
    expect(stage("RO")?.since).toBe(stage("BG")?.since);
    expect(membersOf("schengen", { on: "2024-03-30" })).not.toEqual(expect.arrayContaining(["BG"]));
    expect(membersOf("schengen", { on: "2024-03-30" })).not.toEqual(expect.arrayContaining(["RO"]));
    expect(membersOf("schengen", { on: "2024-03-31" })).toEqual(expect.arrayContaining(["BG", "RO"]));
    expect(grouping("schengen")?.note).toMatch(/1 January 2025/);
  });

  it("give the Commonwealth's joining years as years, not as 1 January", () => {
    const current = (grouping("commonwealth")?.periods ?? []).filter((period) => period.until === null);
    for (const period of current) {
      // Nigeria's page gives no year for its return.
      if (period.code === "NG") continue;
      expect(period.since ?? "", period.code).not.toMatch(/-01-01$/);
    }
    const since = (code: string) => current.find((period) => period.code === code)?.since;
    expect(since("AU")).toBe("1931");
    expect(since("JM")).toBe("1962");
    expect(since("PK")).toBe("1989");
    // A year alone: unknown inside the year, a member from its last day.
    expect(membersOf("commonwealth", { on: "1957-12-30" })).not.toContain("GH");
    expect(unknownMembersOf("commonwealth", { on: "1957-12-30" })).toContain("GH");
    expect(membersOf("commonwealth", { on: "1957-12-31" })).toContain("GH");
    expect(membersOf("commonwealth", { on: "1956-12-31" })).not.toContain("GH");
    expect(unknownMembersOf("commonwealth", { on: "1956-12-31" })).not.toContain("GH");
  });

  it("keep Cameroon's Commonwealth day unknown", () => {
    expect(membersOf("commonwealth", { on: "1980-01-01" })).not.toContain("CM");
    expect(unknownMembersOf("commonwealth", { on: "1980-01-01" })).toContain("CM");
    expect(membersOf("commonwealth", { on: "2020-01-01" })).not.toContain("CM");
    expect(unknownMembersOf("commonwealth", { on: "2020-01-01" })).toContain("CM");
    expect(grouping("commonwealth")?.periods?.find((period) => period.code === "CM")?.since).toBeNull();
    expect(membersOf("commonwealth")).toContain("CM");
  });

  it("hold the EU's six founders to one joining day", () => {
    const since = (code: string) => grouping("eu")?.periods?.find((period) => period.code === code && period.until === null)?.since;
    for (const code of ["BE", "DE", "FR", "IT", "LU", "NL"]) expect(since(code), code).toBe("1958-01-01");
    expect(membersOf("eu", { on: "1957-12-31" })).toEqual([]);
    expect(unknownMembersOf("eu", { on: "1957-12-31" })).toEqual([]);
    expect(membersOf("eu", { on: "1958-01-01" })).toEqual(["BE", "DE", "FR", "IT", "LU", "NL"]);
    expect(membersOf("eu", { on: "1973-01-01" })).toEqual(expect.arrayContaining(["DK", "IE", "GB"]));
    expect(grouping("eu")?.note).toMatch(/25 March 1957/);
  });

  it("hold the Commonwealth's earlier periods to the years its pages give", () => {
    const periods = (code: string) => (grouping("commonwealth")?.periods ?? []).filter((period) => period.code === code).map((period) => [period.since, period.until]);
    expect(periods("SZ")).toEqual([["1968", null]]);
    expect(periods("NG")).toEqual([["1960", "1995"], ["1999-01-01", null]]);
    expect(periods("NR")).toEqual([["1968", "1999"], ["1999", null]]);
    expect(periods("PK")).toEqual([["1947", "1972"], ["1989", null]]);
    expect(periods("FJ")[0]).toEqual(["1970", "1987-10-01"]);
    // Pakistan left in 1972: a member to the end of 1971, unknown inside 1972, not one after; back from the end of 1989.
    expect(membersOf("commonwealth", { on: "1971-12-31" })).toContain("PK");
    expect(membersOf("commonwealth", { on: "1972-01-01" })).not.toContain("PK");
    expect(unknownMembersOf("commonwealth", { on: "1972-06-01" })).toContain("PK");
    expect(unknownMembersOf("commonwealth", { on: "1973-01-01" })).not.toContain("PK");
    expect(membersOf("commonwealth", { on: "1947-12-31" })).toContain("PK");
    expect(unknownMembersOf("commonwealth", { on: "1947-06-01" })).toContain("PK");
    expect(membersOf("commonwealth", { on: "1980-01-01" })).not.toContain("PK");
    expect(membersOf("commonwealth", { on: "1989-12-31" })).toContain("PK");
    // Nigeria's suspension is the gap between its periods.
    expect(membersOf("commonwealth", { on: "1994-12-31" })).toContain("NG");
    expect(membersOf("commonwealth", { on: "1997-01-01" })).not.toContain("NG");
    // Nauru: an associate to the end of 1998, a full member from the end of 1999.
    expect(membersOf("commonwealth", { on: "1998-12-31" })).toContain("NR");
    expect(membersOf("commonwealth", { on: "1999-12-31" })).toContain("NR");
    expect(unknownMembersOf("commonwealth", { on: "1999-06-01" })).toContain("NR");
  });

  it("list no country twice in overlapping periods", () => {
    for (const one of groupings({ kind: "membership" })) {
      const periods = one.periods ?? [];
      for (const [at, period] of periods.entries()) {
        for (const other of periods.slice(at + 1)) {
          if (period.code !== other.code || period.since === null || other.since === null) continue;
          // A year or a month alone counts from its end as `since`, and up to its start as `until`.
          const overlap = sureFrom(period.since)! < (sureTo(other.until) ?? "9999") && sureFrom(other.since)! < (sureTo(period.until) ?? "9999");
          expect(overlap, `${one.id} ${period.code} ${JSON.stringify(period)} ${JSON.stringify(other)}`).toBe(false);
        }
      }
      const current = periods.filter((period) => period.until === null).map((period) => period.code);
      expect(new Set(current).size, `${one.id} lists a member twice`).toBe(current.length);
    }
  });

  it("leave out on purpose only with a reason", () => {
    for (const [id, why] of Object.entries(MEMBERSHIPS_LEFT_OUT)) {
      expect(grouping(id), id).toBeNull();
      expect(why.length).toBeGreaterThan(40);
    }
  });
});

describe("the informal groupings", () => {
  it("are marked informal, and follow their definitions", () => {
    expect(grouping("scandinavia")?.members).toEqual(["DK", "NO", "SE"]);
    expect(grouping("nordic-countries")?.members).toEqual(["AX", "DK", "FI", "FO", "GL", "IS", "NO", "SE"]);
    expect(grouping("baltics")?.members).toEqual(["EE", "LT", "LV"]);
    expect(grouping("southeast-asia")?.members).toEqual(grouping("m49-035")?.members);
    expect(grouping("middle-east")?.informal).toBe(true);
    expect(grouping("middle-east")?.note).toMatch(/No definition is agreed/);
  });
});

describe("the groupings inside a country", () => {
  it("cover each set's country once, every first-level subdivision, no more", () => {
    const sets = new Map<string, string[]>();
    for (const one of groupings({ kind: "subdivision" })) for (const set of one.sets ?? []) sets.set(set, [...(sets.get(set) ?? []), ...one.members]);
    for (const [set, members] of sets) {
      expect(new Set(members).size, set).toBe(members.length);
      const country = members[0].slice(0, 2);
      if (set === "au-states-territories" || set === "ca-regions" || set.startsWith("jp-") || set === "gb-nations") {
        expect([...members].sort(), set).toEqual((subdivisions(country) ?? []).filter((one) => !(country === "AU" && one.code === "AU-JBT")).map((one) => one.code).sort());
      }
    }
    expect(sets.get("us-census-regions")).toHaveLength(51);
    expect(sets.get("us-census-divisions")).toHaveLength(51);
  });

  it("place a prefecture in its region under both of Japan's divisions", () => {
    expect(groupingsOf("JP-47").map((one) => one.id)).toEqual(["jp-kyushu", "jp-okinawa"]);
    expect(groupingsOf("JP-40").map((one) => one.id)).toEqual(["jp-kyushu", "jp-kyushu-without-okinawa"]);
    expect(groupings({ country: "jp" })).toHaveLength(10);
    expect(grouping("jp-kanto")?.name.ja).toBe("関東地方");
    expect(grouping("jp-kinki")?.name).toEqual({ en: "Kinki region", ja: "近畿地方" });
    expect(grouping("jp-kinki")?.otherNames).toEqual([{ en: "Kansai region", ja: "関西地方", reading: "かんさいちほう" }]);
  });

  it("answer nothing for what is not there", () => {
    expect(grouping("atlantis")).toBeNull();
    expect(membersOf("atlantis")).toBeNull();
    expect(groupingsOf("XX")).toEqual([]);
    expect(groupingsOf(5 as unknown as string)).toEqual([]);
    expect(grouping(5 as unknown as string)).toBeNull();
  });
});
