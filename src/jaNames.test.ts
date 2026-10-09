import { describe, expect, it } from "vitest";

import { JA_BRACKET_WORDS, JA_NAME_OVERRIDES, JA_OPEN_QUESTIONS } from "../scripts/data-config";
import { allSubdivisions, subdivision } from "./subdivisions";

describe("the Japanese names that are written by hand", () => {
  it("override only codes that exist, and the name shipped is the override", () => {
    for (const [code, override] of Object.entries(JA_NAME_OVERRIDES)) {
      const one = subdivision(code);
      expect(one, code).not.toBeNull();
      expect(one!.name.ja, code).toBe(override.ja);
      expect(override.why.trim(), code).not.toBe("");
    }
  });

  it("ask open questions only about codes that exist", () => {
    for (const code of Object.keys(JA_OPEN_QUESTIONS)) expect(subdivision(code), code).not.toBeNull();
  });

  it("give the reviewer's findings: parishes are 教区, Ukraine's names are the Ukrainian forms, renamed places are renamed", () => {
    expect(subdivision("AG-06")!.name.ja).toBe("セント・ポール教区");
    expect(subdivision("DM-02")!.name.ja).toBe("セント・アンドリュー教区");
    expect(subdivision("UA-30")!.name.ja).toBe("キーウ");
    expect(subdivision("UA-51")!.name.ja).toBe("オデーサ州");
    expect(subdivision("KR-42")!.name.ja).toBe("江原特別自治道");
    expect(subdivision("IN-JK")!.name.ja).toBe("ジャンムー・カシミール連邦直轄領");
  });

  it("leave no shipped Japanese name ending in a bracket", () => {
    const bracketed = allSubdivisions()
      .filter((one) => one.name.ja !== null && /[)）]$/.test(one.name.ja))
      .map((one) => `${one.code} ${one.name.ja}`);
    expect(bracketed).toEqual([]);
  });

  it("do not leave a generic word in a bracket anywhere in a name", () => {
    for (const one of allSubdivisions()) {
      for (const word of JA_BRACKET_WORDS) expect(one.name.ja ?? "", one.code).not.toMatch(new RegExp(`[(（]${word}[)）]`));
    }
  });
});
