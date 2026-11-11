import { describe, expect, it } from "vitest";

import { allSubdivisions } from "./subdivisions";
import { facts } from "./facts";
import { subdivisionTimeZone, timeZoneAt } from "./zones";

describe("the capital's zone", () => {
  it("is zone.tab's for a country with one, the nearest principal city's for one with several, and set by name for two", () => {
    expect(facts("JP")?.capitalZone).toBe("Asia/Tokyo");
    expect(facts("US")?.capitalZone).toBe("America/New_York");
    expect(facts("CA")?.capitalZone).toBe("America/Toronto");
    expect(facts("CN")?.capitalZone).toBe("Asia/Shanghai");
    // Astana is nearest Qostanay's principal city, but keeps Almaty's zone; zone.tab lists none for Kosovo.
    expect(facts("KZ")?.capitalZone).toBe("Asia/Almaty");
    expect(facts("XK")?.capitalZone).toBe("Europe/Belgrade");
    expect(facts("AQ")?.capitalZone).toBeNull();
  });
});

describe("a subdivision's zone", () => {
  it("is Wikidata's where it names one of the country's zones alone, and estimated otherwise", () => {
    expect(subdivisionTimeZone("US-WA")).toEqual({ zone: "America/Los_Angeles", estimated: false });
    // Western Australia keeps one zone but for Eucla: estimated.
    expect(subdivisionTimeZone("au-wa")).toEqual({ zone: "Australia/Perth", estimated: true });
    // Wikidata gives Quebec "US/Eastern": the Canadian zone of that offset nearest Quebec City.
    expect(subdivisionTimeZone("CA-QC")).toEqual({ zone: "America/Toronto", estimated: true });
    expect(subdivisionTimeZone("CA-BC")?.zone).toBe("America/Vancouver");
    expect(subdivisionTimeZone("JP-13")).toEqual({ zone: "Asia/Tokyo", estimated: false });
    expect(subdivisionTimeZone("CN-BJ")).toEqual({ zone: "Asia/Shanghai", estimated: true });
  });

  it("is right for every subdivision the review of 1.6.2 named", () => {
    const want: Record<string, string> = {
      "US-OR": "America/Los_Angeles",
      "US-TN": "America/Chicago",
      "US-FL": "America/New_York",
      "US-GA": "America/New_York",
      "US-NC": "America/New_York",
      "US-SC": "America/New_York",
      "US-OH": "America/New_York",
      "US-WV": "America/New_York",
      "US-KY": "America/New_York",
      "MX-ROO": "America/Cancun",
      "MX-DUR": "America/Mexico_City",
      "MX-NAY": "America/Mazatlan",
      "CA-NT": "America/Edmonton",
      "UA-51": "Europe/Kyiv",
      "UA-65": "Europe/Kyiv",
      "UA-48": "Europe/Kyiv",
      "UA-14": "Europe/Kyiv",
      "UA-23": "Europe/Kyiv",
      "UA-43": "Europe/Simferopol",
      "UA-40": "Europe/Simferopol",
      "RU-UD": "Europe/Samara",
      "ID-SL": "Asia/Makassar",
      "ID-NU": "Asia/Makassar",
      "ID-ML": "Asia/Jayapura",
      "CL-LL": "America/Santiago",
      "CL-LR": "America/Santiago",
      "US-GU": "Pacific/Guam",
      "US-MP": "Pacific/Saipan",
      "US-AS": "Pacific/Pago_Pago",
      "US-PR": "America/Puerto_Rico",
      "US-VI": "America/St_Thomas",
      // And the canonical zone of an offset: the subdivision's own, else the country capital's.
      "US-MI": "America/Detroit",
      "US-IN": "America/Indiana/Indianapolis",
      "AU-VIC": "Australia/Melbourne",
      "AU-TAS": "Australia/Hobart",
      "MX-CMX": "America/Mexico_City",
      "ES-AN": "Europe/Madrid",
      "PT-11": "Europe/Lisbon",
      "BR-SP": "America/Sao_Paulo",
      "EC-P": "America/Guayaquil",
      "EC-W": "Pacific/Galapagos",
    };
    for (const [code, zone] of Object.entries(want)) expect(subdivisionTimeZone(code)?.zone, code).toBe(zone);
  });

  it("is estimated for a subdivision split between zones", () => {
    for (const code of ["US-TX", "US-KS", "US-NE", "US-SD", "US-ND", "US-ID", "US-NV", "US-AK", "US-OR", "US-FL", "US-KY", "US-TN", "US-IN", "US-MI", "AU-NSW", "AU-WA", "BR-PE", "BR-AM", "CA-BC", "CA-ON", "CA-SK", "UA-43"])
      expect(subdivisionTimeZone(code)?.estimated, code).toBe(true);
  });

  it("answers every first-level subdivision kuni lists, and nothing else", () => {
    // Every one with a zone at all: the United States Minor Outlying Islands have no capital to take one from.
    for (const one of allSubdivisions().filter((each) => each.level === 1 && each.country !== "UM")) expect(subdivisionTimeZone(one.code), one.code).not.toBeNull();
    expect(subdivisionTimeZone("XX-1")).toBeNull();
    expect(subdivisionTimeZone("US-ZZ")).toBeNull();
    expect(subdivisionTimeZone(undefined as unknown as string)).toBeNull();
  });
});

describe("the zone at a point", () => {
  it("is the country's one zone, or the zone of the subdivision whose capital is nearest, estimated", () => {
    expect(timeZoneAt("JP", { lat: 43.06, lon: 141.35 })).toEqual({ zone: "Asia/Tokyo", estimated: false });
    // Seattle: Boise's principal city is nearer than Los Angeles's, but Olympia, Washington's capital, is nearer still.
    expect(timeZoneAt("US", { lat: 47.61, lon: -122.33 })).toEqual({ zone: "America/Los_Angeles", estimated: true });
    expect(timeZoneAt("US", { lat: 41.88, lon: -87.63 })?.zone).toBe("America/Chicago");
    expect(timeZoneAt("US", { lat: 40.71, lon: -74 })?.zone).toBe("America/New_York");
    expect(timeZoneAt("ca", { lat: 49.28, lon: -123.12 })?.zone).toBe("America/Vancouver");
    expect(timeZoneAt("AU", { lat: -31.95, lon: 115.86 })?.zone).toBe("Australia/Perth");
    expect(timeZoneAt("XK", { lat: 42.66, lon: 21.17 })).toEqual({ zone: "Europe/Belgrade", estimated: false });
    // A territory's own zone; a point near a zone's principal city; Las Vegas by Nevada's middle, not Arizona's capital.
    expect(timeZoneAt("US", { lat: 13.47, lon: 144.75 })?.zone).toBe("Pacific/Guam");
    expect(timeZoneAt("MX", { lat: 31.69, lon: -106.42 })?.zone).toBe("America/Ciudad_Juarez");
    expect(timeZoneAt("US", { lat: 36.17, lon: -115.14 })?.zone).toBe("America/Los_Angeles");
    expect(timeZoneAt("US", { lat: 43.62, lon: -116.2 })?.zone).toBe("America/Boise");
    expect(timeZoneAt("UA", { lat: 46.48, lon: 30.72 })?.zone).toBe("Europe/Kyiv");
  });

  it("is null for what is not a country or not a point", () => {
    expect(timeZoneAt("XX", { lat: 0, lon: 0 })).toBeNull();
    expect(timeZoneAt("US", { lat: Number.NaN, lon: 0 })).toBeNull();
    expect(timeZoneAt("US", null as unknown as { lat: number; lon: number })).toBeNull();
  });
});
