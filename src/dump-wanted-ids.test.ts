import { describe, expect, it } from "vitest";

import { wantedIds } from "../scripts/dump-wanted-ids.ts";
import { SOURCES_DIR } from "../scripts/sources.ts";

describe("wanted dump ids", () => {
  it("covers every city id the population snapshot asked for", () => {
    const wanted = wantedIds(SOURCES_DIR);
    expect(wanted.populationsAsked).toBe(34461);
    expect(wanted.cityIds).toBe(34461);
    expect(wanted.cityIdsMissing).toBe(0);
    expect(wanted.ids.has(60)).toBe(true);
    expect(wanted.ids.has(1863)).toBe(true);
    expect(wanted.ids.has(540844)).toBe(true);
    expect(wanted.ids.has(215992)).toBe(true);
    expect(wanted.ids.has(1897952)).toBe(true);
  });
});
