import { describe, expect, it } from "vitest";

import { citiesOf } from "./cities";
import type { City } from "./cities";
import { capitalCities } from "./cities/capitals";
import { cities1m } from "./cities/1m";
import { COUNTRY_CODES, country } from "./index";
import { CITY_LOADERS } from "./data/city-loaders.data";
import { facts } from "./facts";
import { ZONE_ROWS } from "./data/zones.data";

const of = async (code: string): Promise<readonly City[]> => (await citiesOf(code)) ?? [];
const all = async (): Promise<City[]> => (await Promise.all(Object.values(CITY_LOADERS).map(async (load) => (await load()).CITIES))).flat();

const named = (list: readonly City[], id: string): City => {
  const city = list.find((one) => one.id === id);
  if (city === undefined) throw new Error(`no city ${id}`);

  return city;
};

// The hour on the clock of a zone at one instant, as the card shows it.
const hourIn = (zone: string, instant: string): number => Number(new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", hourCycle: "h23" }).format(new Date(instant)));

describe("a city's time zone", () => {
  it("is the IANA zone a page can give a date formatter, with the clock to show for it", async () => {
    const japan = await of("JP");
    const tokyo = named(japan, "Q1490");
    expect(tokyo.timeZone).toBe("Asia/Tokyo");
    expect(tokyo.timeZoneEstimated).toBe(false);
    const us = await of("US");
    const seattle = named(us, "Q5083");
    expect(seattle.timeZone).toBe("America/Los_Angeles");
    // 12:00 UTC on 15 January 2026 is 21:00 in Tokyo and 04:00 in Seattle.
    expect(hourIn(tokyo.timeZone!, "2026-01-15T12:00:00Z")).toBe(21);
    expect(hourIn(seattle.timeZone!, "2026-01-15T12:00:00Z")).toBe(4);
  });

  it("is a zone of the city's country (or of the territory it is in): every city's, in every country", async () => {
    const wrong: string[] = [];
    for (const city of await all()) {
      if (city.timeZone === null) continue;
      // A territory with a country code of its own (US-PR, Puerto Rico) keeps that country's zone.
      const territory = city.subdivision?.split("-")[1];
      const zones = new Set([...(country(city.country)?.zones ?? []), facts(city.country)?.capitalZone ?? "", ...(territory?.length === 2 ? (country(territory)?.zones ?? []) : [])]);
      if (!zones.has(city.timeZone)) wrong.push(`${city.id} ${city.name.en} (${city.country}): ${city.timeZone}`);
    }
    expect(wrong).toEqual([]);
  });

  it("is a zone the runtime knows, so that no page asks a date formatter for a name it rejects", async () => {
    const zones = new Set((await all()).map((city) => city.timeZone).filter((zone): zone is string => zone !== null));
    expect(zones.size).toBeGreaterThan(300);
    for (const zone of zones) expect(() => new Intl.DateTimeFormat("en", { timeZone: zone }), zone).not.toThrow();
  });

  it("is the one zone of a country with one, never an estimate", async () => {
    for (const code of ["JP", "KR", "IN", "CN", "GB", "FR"]) {
      const zones = new Set(ZONE_ROWS.filter((row) => row[0] === code).map((row) => row[3]));
      if (zones.size !== 1) continue;
      for (const city of await of(code)) {
        expect(city.timeZone, `${city.name.en} ${code}`).toBe([...zones][0]);
        expect(city.timeZoneEstimated).toBe(false);
      }
    }
    expect((await of("JP")).every((city) => city.timeZone === "Asia/Tokyo" && !city.timeZoneEstimated)).toBe(true);
  });

  it("is told apart in a country with several, by the place's own zone where a source names it", async () => {
    const us = await of("US");
    expect(named(us, "Q18094").timeZone).toBe("Pacific/Honolulu");
    // Arizona keeps no daylight saving time; Indianapolis and Louisville have zones of their own.
    expect(named(us, "Q16556").timeZone).toBe("America/Phoenix");
    expect(named(us, "Q6346").timeZone).toBe("America/Indiana/Indianapolis");
    expect(named(us, "Q43668").timeZone).toBe("America/Kentucky/Louisville");
    // El Paso is on Mountain time though Texas is mostly Central.
    expect(named(us, "Q16562").timeZone).toBe("America/Denver");
    const canada = await of("CA");
    expect(named(canada, "Q172").timeZone).toBe("America/Toronto");
    expect(named(canada, "Q2123").timeZone).toBe("America/Regina");
    expect(named(canada, "Q2141").timeZone).toBe("America/Halifax");
    // Western Australia's Perth, and Nepal's quarter-hour offset.
    expect(named(await of("AU"), "Q3183").timeZone).toBe("Australia/Perth");
    const kathmandu = named(await of("NP"), "Q3037");
    expect(kathmandu.timeZone).toBe("Asia/Kathmandu");
    expect(hourIn(kathmandu.timeZone!, "2026-01-15T12:00:00Z")).toBe(17);
  });

  it("reads the names tzdb has made links as the zones they are now", async () => {
    // Natural Earth still writes Asia/Chongqing, Europe/Kiev and Asia/Rangoon.
    const zones = new Set((await all()).map((city) => city.timeZone));
    for (const old of ["Asia/Chongqing", "Asia/Harbin", "Asia/Rangoon", "Europe/Kiev", "America/Montreal", "America/Godthab"]) expect(zones.has(old), old).toBe(false);
    expect(named(await of("UA"), "Q1899").timeZone).toBe("Europe/Kyiv");
    expect(named(await of("CN"), "Q956").timeZone).toBe("Asia/Shanghai");
    // Sudan keeps Khartoum, South Sudan has Juba.
    expect(named(await of("SD"), "Q1963").timeZone).toBe("Africa/Khartoum");
    expect(named(await of("SS"), "Q1947").timeZone).toBe("Africa/Juba");
  });

  it("is an estimate only where no source names it, and says so", async () => {
    const list = await all();
    const estimated = list.filter((city) => city.timeZoneEstimated);
    expect(estimated.length).toBeGreaterThan(5000);
    expect(estimated.length).toBeLessThan(list.length * 0.5);
    // Denver has no zone in Natural Earth: its zone is worked out, from the nearest city of the same state that has one.
    const denver = named(await of("US"), "Q16554");
    expect(denver.timeZone).toBe("America/Denver");
    expect(denver.timeZoneEstimated).toBe(true);
    for (const city of estimated) expect(city.timeZone, city.name.en).not.toBeNull();
  });

  it("is the same in every tier and every country's file", async () => {
    const tiers = [...capitalCities(), ...cities1m()];
    for (const code of ["US", "JP", "CA", "BR"]) {
      const own = new Map((await of(code)).map((city) => [city.id, city]));
      for (const city of tiers.filter((one) => one.country === code)) {
        const same = own.get(city.id);
        expect(same?.timeZone, city.id).toBe(city.timeZone);
        expect(same?.timeZoneEstimated).toBe(city.timeZoneEstimated);
        expect(same?.elevation).toBe(city.elevation);
      }
    }
  });
});

describe("a city's elevation", () => {
  it("is Wikidata's height above sea level in whole metres, where it has one", async () => {
    const mexico = named(await of("MX"), "Q1489");
    expect(mexico.elevation).toBe(2240);
    const us = await of("US");
    expect(named(us, "Q16554").elevation).toBe(1609);
    expect(named(us, "Q5083").elevation).toBe(40);
    expect(named(await of("NP"), "Q3037").elevation).toBe(1300);
    for (const city of await all()) if (city.elevation !== null) expect(Number.isInteger(city.elevation), city.name.en).toBe(true);
  });

  it("is `null`, not made up, where Wikidata has none, and for a place only Natural Earth has", async () => {
    const list = await all();
    expect(list.filter((city) => city.elevation === null).length).toBeGreaterThan(8000);
    for (const city of list.filter((one) => one.id.startsWith("ne:"))) expect(city.elevation, city.id).toBeNull();
    expect(list.filter((city) => city.elevation !== null).length).toBeGreaterThan(15000);
  });

  it("keeps to what land has: none below the Dead Sea's shore or above the highest town", async () => {
    for (const city of await all()) if (city.elevation !== null) expect(city.elevation, `${city.name.en} ${city.country}`).toBeGreaterThanOrEqual(-430);
    for (const city of await all()) if (city.elevation !== null) expect(city.elevation, `${city.name.en} ${city.country}`).toBeLessThanOrEqual(5500);
    // Some cities are below sea level (Baku, Amsterdam's region, Salton Sea towns).
    expect((await all()).some((city) => (city.elevation ?? 0) < 0)).toBe(true);
  });
});

describe("a city's language", () => {
  it("is its country's, which kuni already holds, in the order the speakers are most", () => {
    expect(country("JP")?.languages).toEqual(["ja"]);
    expect(country("CA")?.languages).toEqual(expect.arrayContaining(["en", "fr"]));
    // Where the city's own name is in a language, that is `nativeLanguage`.
    expect(COUNTRY_CODES.every((code) => country(code)?.languages === undefined || Array.isArray(country(code)?.languages))).toBe(true);
  });
});
