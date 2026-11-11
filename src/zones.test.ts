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
    expect(subdivisionTimeZone("au-wa")).toEqual({ zone: "Australia/Perth", estimated: false });
    // Wikidata gives Quebec "US/Eastern": the Canadian zone of that offset nearest Quebec City.
    expect(subdivisionTimeZone("CA-QC")).toEqual({ zone: "America/Toronto", estimated: true });
    expect(subdivisionTimeZone("CA-BC")?.zone).toBe("America/Vancouver");
    expect(subdivisionTimeZone("JP-13")).toEqual({ zone: "Asia/Tokyo", estimated: false });
    expect(subdivisionTimeZone("CN-BJ")).toEqual({ zone: "Asia/Shanghai", estimated: true });
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
  });

  it("is null for what is not a country or not a point", () => {
    expect(timeZoneAt("XX", { lat: 0, lon: 0 })).toBeNull();
    expect(timeZoneAt("US", { lat: Number.NaN, lon: 0 })).toBeNull();
    expect(timeZoneAt("US", null as unknown as { lat: number; lon: number })).toBeNull();
  });
});
