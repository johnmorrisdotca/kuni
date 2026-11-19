import { describe, expect, it } from "vitest";

import { TYPE_NOISE, TYPE_RULES } from "../scripts/data-config.ts";

// The head of a class label, as scripts/build-data.ts reads it before the rules.
const kind = (label: string): string | null => {
  const head = label.toLowerCase().replace(/ (of|in) .*$/, "");
  if (TYPE_NOISE.test(head)) return null;
  return TYPE_RULES.find(([rule]) => rule.test(head))?.[1] ?? null;
};

describe("a class label's kind", () => {
  it("reads the plural the way it reads the singular", () => {
    expect(kind("provinces of Vietnam")).toBe("province");
    expect(kind("province of Vietnam")).toBe("province");
    expect(kind("cities in Vietnam")).toBe("city");
    expect(kind("centrally-governed cities of Vietnam")).toBe("city");
    expect(kind("rural municipality of Estonia")).toBe("municipality");
    expect(kind("county of Estonia")).toBe("county");
  });
});
