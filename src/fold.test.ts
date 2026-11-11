import { describe, expect, it } from "vitest";

import { fold, foldKey } from "./fold";

describe("fold", () => {
  it("writes the letters that do not decompose as the letters they stand for", () => {
    expect(fold("Łódź")).toBe("lodz");
    expect(fold("Straße")).toBe("strasse");
    expect(fold("Århus Ørsted")).toBe("arhus orsted");
    expect(fold("Đà Nẵng")).toBe("da nang");
    expect(fold("ıspanak")).toBe("ispanak");
    expect(fold("Æther Œuvre Ðóra Þór")).toBe("aether oeuvre dora thor");
    expect(fold("ŁÓDŹ ẞ")).toBe("lodz ss");
  });

  it("still folds case, accents, width and kana, and keeps the marks of が and ぱ", () => {
    expect(fold("Côte d'Ivoire")).toBe("cote divoire");
    expect(fold("ＵＳＡ")).toBe("usa");
    expect(fold("ドイツ")).toBe("どいつ");
    expect(fold("パリ")).not.toBe(fold("ハリ"));
    expect(foldKey("Viet Nam")).toBe("vietnam");
  });
});
