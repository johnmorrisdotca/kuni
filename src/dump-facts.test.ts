import { describe, expect, it } from "vitest";

import { factsFrom } from "../scripts/dump-facts.ts";
import type { DumpEntity } from "../scripts/dump-claims.ts";

const entity = (id: string, claims: DumpEntity["claims"], labels?: DumpEntity["labels"]): DumpEntity => ({ id, labels, claims });

describe("facts from dump claims", () => {
  it("keeps Belgium's preferred area and leaves a capital's words blank until that item is in the subset", () => {
    const belgium = entity("Q31", {
      P297: [{ rank: "normal", mainsnak: { snaktype: "value", datavalue: { type: "string", value: "BE" } } }],
      P36: [{ rank: "normal", mainsnak: { snaktype: "value", datavalue: { type: "wikibase-entityid", value: { id: "Q239" } } } }],
      P2046: [
        { rank: "normal", mainsnak: { snaktype: "value", datavalue: { type: "quantity", value: { amount: "+30528", unit: "http://www.wikidata.org/entity/Q712226" } } } },
        { rank: "preferred", mainsnak: { snaktype: "value", datavalue: { type: "quantity", value: { amount: "+30688", unit: "http://www.wikidata.org/entity/Q712226" } } } },
      ],
      P625: [{ rank: "normal", mainsnak: { snaktype: "value", datavalue: { type: "globecoordinate", value: { latitude: 50.641111111, longitude: 4.668055555, globe: "http://www.wikidata.org/entity/Q2" } } } }],
    });
    const answers = factsFrom(new Map([["Q31", belgium]]), new Set(["Q458"]), {});
    expect(answers.items.BE).toEqual([["Q31", null, null]]);
    expect(answers.area.BE).toEqual([["Q31", 30688, "Q712226", null, null]]);
    expect(answers.points.BE).toEqual([["Q31", [50.641111111, 4.668055555]]]);
    expect(answers.capitals.BE).toEqual([["Q31", "Q239", null, null, null, "ontology#NormalRank", null, null]]);
    expect(answers.memberships.BE).toBeUndefined();
  });
});
