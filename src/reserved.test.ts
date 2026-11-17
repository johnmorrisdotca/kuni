import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { countries, country, isCountryCode } from "./index";
import { RESERVED_KINDS, RESERVED_READ, reservedPlace, reservedPlaces } from "./reserved";
import { subdivision } from "./subdivisions";

describe("the places outside ISO 3166-1", () => {
  it("are fourteen, of three kinds, in order of id", () => {
    expect(reservedPlaces()).toHaveLength(14);
    expect(RESERVED_KINDS.map((kind) => reservedPlaces({ kind }).length)).toEqual([7, 3, 4]);
    const ids = reservedPlaces().map((one) => one.id);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(14);
    expect(RESERVED_READ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("have the seven codes ISO 3166-1 reserves exceptionally for a place", () => {
    expect(reservedPlaces({ kind: "iso-reserved" }).map((one) => one.code).sort()).toEqual(["AC", "CP", "CQ", "DG", "EA", "IC", "TA"]);
    expect(reservedPlaces({ kind: "user-assigned" }).map((one) => one.code).sort()).toEqual(["XA", "XC", "XO"]);
    for (const one of reservedPlaces({ kind: "de-facto" })) expect(one.code, one.id).toBeUndefined();
  });

  it("are never countries, and never share a code with one", () => {
    for (const one of reservedPlaces()) {
      if (one.code === undefined) continue;
      expect(isCountryCode(one.code), one.code).toBe(false);
      expect(country(one.code), one.code).toBeNull();
    }
    expect(countries()).toHaveLength(250);
    expect(reservedPlace("JP")).toBeNull();
    expect(reservedPlace("XK")).toBeNull();
  });

  it("name each place in English and Japanese", () => {
    expect(reservedPlace("AC")?.name).toEqual({ en: "Ascension Island", ja: "アセンション島" });
    expect(reservedPlace("IC")?.name).toEqual({ en: "Canary Islands", ja: "カナリア諸島" });
    expect(reservedPlace("EA")?.name).toEqual({ en: "Ceuta & Melilla", ja: "セウタ・メリリャ" });
    expect(reservedPlace("somaliland")?.name).toEqual({ en: "Somaliland", ja: "ソマリランド" });
    for (const one of reservedPlaces()) {
      expect(one.name.en, one.id).not.toBe("");
      if (one.name.ja !== null) expect(one.name.ja, one.id).toMatch(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u);
    }
  });

  it("give a reserved code its parent state, and take no side for the others", () => {
    const parents = { AC: "GB", CP: "FR", CQ: "GB", DG: "GB", EA: "ES", IC: "ES", TA: "GB" };
    for (const [code, parent] of Object.entries(parents)) expect(reservedPlace(code)?.parent, code).toBe(parent);
    for (const one of reservedPlaces()) {
      if (one.kind === "iso-reserved") expect(["territory", "uninhabited"], one.id).toContain(one.status);
      else expect(one.status, one.id).toBe("disputed");
      if (one.parent !== undefined) expect(country(one.parent)?.status, one.id).toBe("un-member");
    }
    expect(reservedPlace("CP")?.status).toBe("uninhabited");
    expect(reservedPlace("sahrawi-republic")?.parent).toBeUndefined();
  });

  it("point to the subdivisions kuni has for the same place", () => {
    expect(reservedPlace("AC")?.subdivisions).toEqual(["SH-AC"]);
    expect(reservedPlace("TA")?.subdivisions).toEqual(["SH-TA"]);
    expect(reservedPlace("EA")?.subdivisions).toEqual(["ES-CE", "ES-ML"]);
    expect(reservedPlace("IC")?.subdivisions).toEqual(["ES-CN"]);
    for (const one of reservedPlaces()) for (const code of one.subdivisions) expect(subdivision(code), code).not.toBeNull();
  });

  it("find a place by code in either case, by three letters and by id", () => {
    expect(reservedPlace("ic")?.id).toBe("canary-islands");
    expect(reservedPlace(" ASC ")?.code).toBe("AC");
    expect(reservedPlace("Canary-Islands")?.code).toBe("IC");
    expect(reservedPlace("")).toBeNull();
    expect(reservedPlace("nowhere")).toBeNull();
    expect(reservedPlace(undefined as unknown as string)).toBeNull();
  });

  it("say where each comes from, and when one ended", () => {
    for (const one of reservedPlaces()) {
      expect(one.source.name, one.id).not.toBe("");
      expect(one.source.url, one.id).toMatch(/^https:\/\//);
    }
    expect(reservedPlace("artsakh")?.until).toBe("2023");
    expect(reservedPlace("somaliland")?.until).toBeUndefined();
  });

  it("hand out frozen objects", () => {
    const one = reservedPlace("AC")!;
    expect(Object.isFrozen(one) && Object.isFrozen(one.name) && Object.isFrozen(one.subdivisions) && Object.isFrozen(one.source)).toBe(true);
    expect(Object.isFrozen(reservedPlaces()) && Object.isFrozen(reservedPlaces({ kind: "de-facto" }))).toBe(true);
  });

  it("keep the record of every choice in docs/reserved.md", () => {
    const doc = readFileSync("docs/reserved.md", "utf8");
    for (const one of reservedPlaces()) expect(doc, one.id).toContain(`| ${one.id} |`);
  });
});
