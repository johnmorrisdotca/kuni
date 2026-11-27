import { describe, expect, it } from "vitest";

import { fold, foldKana, foldKey } from "./fold";

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

  it("treats a small kana and its full-size one as the same sound", () => {
    expect(foldKana("はっぶる")).toBe("ハツブル");
    expect(foldKana("ハッブル")).toBe("ハツブル");
    expect(fold("霞ヶ関")).toBe(fold("霞ケ関"));
    expect(foldKana("ゕゖ")).toBe("カケ");
    expect(foldKana("はっぶる")).toBe(foldKana("ハッブル"));
    expect(foldKana("ちゃんどら")).toBe(foldKana("チャンドラ"));
    expect(foldKana("ちゃ")).toBe("チヤ");
    expect(foldKana("ラー")).toBe("ラー");
    expect(foldKana("あー")).toBe("アー");
    expect(foldKana("ゔ")).toBe("ヴ");
    expect(foldKana("ISS 衛星 123")).toBe("ISS 衛星 123");
    expect(foldKana("ﾊｯﾌﾞﾙ")).toBe("ハツブル");
    expect(foldKana("")).toBe("");
    expect(foldKana("とうきょう")).toBe("トウキヨウ");
    expect(fold("とうきょう")).toBe(fold("とうきよう"));
    expect(fold("トウキョウ")).toBe(fold("ﾄｳｷｮｳ"));
    expect(fold("とうきょう")).toBe(fold("トウキョウ"));
  });
});
