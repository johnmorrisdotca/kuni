import { describe, expect, it } from "vitest";

import { countries, country } from "./index";

// Calling codes that more than one country has, each with the countries that have it and the reason. Source for
// every line: "List of Recommendation ITU-T E.164 assigned country codes" (Annex to ITU Operational Bulletin
// No. 1114, 15 December 2016, https://www.itu.int/pub/T-SP-E.164D, T-SP-E.164D-2016). The ITU names an entity
// for a code; where it lists no code of its own for another country, that country shares the code of the one
// the ITU names. A shared code in the data that is not here is a mistake until the ITU's list says otherwise.
const SHARED: Record<string, { countries: string[]; why: string }> = {
  "+1": {
    countries: ["AG", "AI", "AS", "BB", "BM", "BS", "CA", "DM", "DO", "GD", "GU", "JM", "KN", "KY", "LC", "MP", "MS", "PR", "SX", "TC", "TT", "UM", "US", "VC", "VG", "VI"],
    why: "ITU lists +1 once for each of the North American Numbering Plan's members (American Samoa, Anguilla, ... United States Virgin Islands), footnote b: integrated numbering plan. UM has no code of its own in the list.",
  },
  "+7": {
    countries: ["KZ", "RU"],
    why: "ITU lists +7 for Kazakhstan and for the Russian Federation, footnote b: integrated numbering plan.",
  },
  "+44": {
    countries: ["GB", "GG", "IM", "JE"],
    why: "ITU lists +44 for the United Kingdom of Great Britain and Northern Ireland and lists no code of its own for Guernsey, the Isle of Man or Jersey.",
  },
  "+47": {
    countries: ["BV", "NO", "SJ"],
    why: "ITU lists +47 for Norway and no code of its own for Bouvet Island or Svalbard and Jan Mayen.",
  },
  "+61": {
    countries: ["AU", "CC", "CX", "HM"],
    why: "ITU lists +61 for Australia, footnote i: including Christmas Island and Cocos (Keeling) Islands. It lists no code of its own for Heard Island and McDonald Islands.",
  },
  "+599": {
    countries: ["BQ", "CW"],
    why: "ITU lists +599 for Bonaire, Sint Eustatius and Saba and for Curaçao, note c: code shared between Curaçao and Bonaire, Sint Eustatius and Saba.",
  },
  "+64": {
    countries: ["NZ", "PN"],
    why: "ITU lists +64 for New Zealand and no code of its own for Pitcairn.",
  },
  "+212": {
    countries: ["EH", "MA"],
    why: "ITU lists +212 for Morocco (Kingdom of) and no code of its own for Western Sahara.",
  },
  "+262": {
    countries: ["RE", "TF", "YT"],
    why: "ITU lists +262 for the French Departments and Territories in the Indian Ocean, footnote j: Reunion, the Southern and Antarctic territories and other islands (Mayotte is not listed on its own).",
  },
  "+672": {
    countries: ["AQ", "NF"],
    why: "ITU lists +672 for the Australian External Territories, note g: including the Australian Antarctic Territory and Norfolk Island.",
  },
  "+358": {
    countries: ["AX", "FI"],
    why: "ITU lists +358 for Finland and no code of its own for the Åland Islands.",
  },
  "+500": {
    countries: ["FK", "GS"],
    why: "ITU lists +500 for the Falkland Islands (Malvinas) and no code of its own for South Georgia and the South Sandwich Islands.",
  },
  "+590": {
    countries: ["BL", "GP", "MF"],
    why: "ITU lists +590 for Guadeloupe (French Department of) and no code of its own for Saint Barthélemy or Saint Martin (French part).",
  },
};

const byCode = (): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const one of countries()) {
    if (one.callingCode === undefined) continue;
    map.set(one.callingCode, [...(map.get(one.callingCode) ?? []), one.alpha2]);
  }

  return map;
};

describe("calling codes", () => {
  it("are shared only by the countries the ITU's list has share them", () => {
    const shared = [...byCode()].filter(([, members]) => members.length > 1).map(([code, members]) => `${code}: ${members.sort().join(" ")}`);
    const allowed = Object.entries(SHARED).map(([code, entry]) => `${code}: ${[...entry.countries].sort().join(" ")}`);

    expect(shared.sort()).toEqual(allowed.sort());
  });

  it("each have a reason and the ITU for a source where they are shared", () => {
    for (const [code, entry] of Object.entries(SHARED)) {
      expect(entry.countries.length, code).toBeGreaterThan(1);
      expect(entry.why, code).toMatch(/^ITU lists /);
    }
  });

  it("are the ITU's country code alone, with no area written after it", () => {
    for (const one of countries()) {
      if (one.callingCode !== undefined) expect(one.callingCode, one.alpha2).toMatch(/^\+\d{1,3}$/);
    }
    expect(country("CW")?.callingCode).toBe("+599");
    expect(country("CC")?.callingCode).toBe("+61");
    expect(country("NF")?.callingCode).toBe("+672");
    expect(country("SJ")?.callingCode).toBe("+47");
  });

  it("give Türkiye +90 and Hungary +36, as the ITU assigns them, and Saint Helena +290", () => {
    expect(country("TR")?.callingCode).toBe("+90");
    expect(country("HU")?.callingCode).toBe("+36");
    expect(country("SH")?.callingCode).toBe("+290");
  });
});
