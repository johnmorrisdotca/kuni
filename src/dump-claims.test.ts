import { describe, expect, it } from "vitest";

import { best, entityId, labelOf, metres, point, quantity, rankToken, referenceHosts, textValue, timeDay } from "../scripts/dump-claims.ts";
import type { DumpEntity, Statement } from "../scripts/dump-claims.ts";

const statement = (rank: string, value = "1"): Statement => ({
  rank,
  mainsnak: { snaktype: "value", datavalue: { type: "string", value } },
});

describe("dump claims", () => {
  it("keeps a preferred statement ahead of a normal one and drops a deprecated one", () => {
    expect(best([statement("normal", "a"), statement("preferred", "b"), statement("deprecated", "c")]).map((row) => textValue(row.mainsnak))).toEqual(["b"]);
    expect(best([statement("normal", "a"), statement("deprecated", "c")]).map((row) => textValue(row.mainsnak))).toEqual(["a"]);
  });

  it("reads a day, a quantity and an item id the way the facts snapshot writes them", () => {
    expect(timeDay({ datavalue: { type: "time", value: { time: "+2014-00-00T00:00:00Z" } } })).toBe("2014-01-01");
    expect(timeDay({ datavalue: { type: "time", value: { time: "+1991-12-26T00:00:00Z" } } })).toBe("1991-12-26");
    // The dump's year before the common era is one less than the historical year (year 0 is 1 BCE).
    expect(timeDay({ datavalue: { type: "time", value: { time: "-0044-03-15T00:00:00Z" } } })).toBe("-43-03-15");
    expect(timeDay({ datavalue: { type: "time", value: { time: "-3032-00-00T00:00:00Z" } } })).toBe("-3031-01-01");
    expect(timeDay({ datavalue: { type: "time", value: { time: "-2707-00-00T00:00:00Z" } } })).toBe("-2706-01-01");
    expect(timeDay({ datavalue: { type: "time", value: { time: "+0000-01-01T00:00:00Z" } } })).toBe("-1-01-01");
    expect(quantity({ datavalue: { type: "quantity", value: { amount: "+30688", unit: "http://www.wikidata.org/entity/Q712226" } } })).toEqual({ amount: 30688, unit: "Q712226" });
    expect(quantity({ datavalue: { type: "quantity", value: { amount: "+11", unit: "1" } } })).toEqual({ amount: 11, unit: null });
    expect(entityId({ datavalue: { type: "wikibase-entityid", value: { id: "Q239" } } })).toBe("Q239");
    expect(rankToken("preferred")).toBe("ontology#PreferredRank");
    expect(rankToken("normal")).toBe("ontology#NormalRank");
  });

  it("keeps an Earth point, converts a foot, and strips a soft hyphen from a label", () => {
    expect(point({ datavalue: { type: "globecoordinate", value: { latitude: 50.64, longitude: 4.66, globe: "http://www.wikidata.org/entity/Q2" } } })).toEqual([50.64, 4.66]);
    expect(point({ datavalue: { type: "globecoordinate", value: { latitude: 1, longitude: 2, globe: "http://www.wikidata.org/entity/Q111" } } })).toBeNull();
    expect(metres(100, "Q3710")).toBe(30.5);
    expect(metres(12, "Q11573")).toBe(12);
    expect(metres(12, "Q9")).toBeNull();
    const entity: DumpEntity = { id: "Q1", labels: { ja: { value: "フ\u00adクオカ" } } };
    expect(labelOf(entity, "ja")).toBe("フクオカ");
    expect(labelOf(entity, "en")).toBeNull();
  });

  it("keeps the host of a reference address without a leading www", () => {
    const row: Statement = { references: [{ snaks: { P854: [{ datavalue: { type: "string", value: "https://www.statbel.fgov.be/en" } }] } }] };
    expect(referenceHosts(row)).toEqual(["statbel.fgov.be"]);
  });
});
