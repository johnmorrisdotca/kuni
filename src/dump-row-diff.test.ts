import { describe, expect, it } from "vitest";

import { splitRows, subjectId } from "../scripts/dump-row-diff.ts";

describe("dump row diff", () => {
  it("calls a missing item a gap and not a change", () => {
    const pinned = [["Q228", "Q1863", "-3031-01-01"]];
    const split = splitRows("AD-07", pinned, [], new Set(["Q228"]));
    expect(subjectId(pinned[0])).toBe("Q228");
    expect(split.gaps).toBe(0);
    expect(split.changed).toBe(1);
    const missing = splitRows("AD-07", [["Q1863", "Andorra"]], [], new Set(["Q228"]));
    expect(missing.gaps).toBe(1);
    expect(missing.changed).toBe(0);
  });

  it("calls a different value a change when the item is in the subset", () => {
    const split = splitRows("BD", [["Q902", "2011-01-01"]], [["Q902", "2011-03-15"]], new Set(["Q902"]));
    expect(split.changed).toBe(1);
    expect(split.gaps).toBe(0);
  });

  it("still reports a change when the dump has no row for an item that was kept", () => {
    const split = splitRows("SU", [["Q15180", "1991-12-26", "1992-01-01"]], undefined, new Set(["Q15180"]));
    expect(split.changed).toBe(1);
    expect(split.gaps).toBe(0);
    expect(split.samples[0]).toContain("changed");
  });

  it("reads a bare city number as its item", () => {
    expect(subjectId([60, [[8419600, "2020-01-01"]]])).toBe("Q60");
    const split = splitRows("60", [[60, [[1, "2020-01-01"]]]], [], new Set<string>());
    expect(split.gaps).toBe(1);
    expect(split.changed).toBe(0);
  });
});
