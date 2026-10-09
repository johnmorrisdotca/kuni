// The /groupings entry: every grouping is named in both languages, has members that are real codes, a definition, a
// source and a day it was true; the bodies' lists are the ones a reader knows; the dates work; the sets cover
// their countries once.
import { describe, expect, it } from "vitest";

import { MEMBERSHIPS_LEFT_OUT } from "../scripts/groupings-config";
import { GROUPING_KINDS, grouping, groupings, groupingsOf, membersOf } from "./groupings";
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
    expect(groupingsOf("GB", { kind: "membership", on: "2015-01-01" }).map((one) => one.id)).toContain("eu");
    expect(membersOf("eu", { on: "not a day" })).toEqual(membersOf("eu"));
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
