import { describe, expect, it } from "vitest";

import { hiraganaOf, readingOfName } from "./ja-reading";

describe("hiraganaOf", () => {
  it("writes kana as hiragana, keeps the long-vowel mark and drops the marks between words", () => {
    expect(hiraganaOf("ニューヨーク")).toBe("にゅーよーく");
    expect(hiraganaOf("リオ・デ・ジャネイロ")).toBe("りおでじゃねいろ");
    expect(hiraganaOf("ラアス・アル＝ハイマ")).toBe("らあすあるはいま");
    expect(hiraganaOf("ｻｯﾎﾟﾛ")).toBe("さっぽろ");
    expect(hiraganaOf("ヴェネツィア")).toBe("ゔぇねつぃあ");
  });

  it("reads ヷ to ヺ as わ, ゐ, ゑ and を with the voiced mark", () => {
    expect(hiraganaOf("ヷヸヹヺ")).toBe("わ\u3099ゐ\u3099ゑ\u3099を\u3099");
  });

  it("is null for anything not kana", () => {
    expect(hiraganaOf("東京都")).toBeNull();
    expect(hiraganaOf("Tokyo")).toBeNull();
    expect(hiraganaOf("")).toBeNull();
  });
});

describe("readingOfName", () => {
  it("reads the name before a bracketed qualifier, and a last word of one reading", () => {
    expect(readingOfName("ゴヤ (アルゼンチン)")).toBe("ごや");
    expect(readingOfName("コザン県")).toBe("こざんけん");
    expect(readingOfName("フジャイラ市")).toBe("ふじゃいらし");
    expect(readingOfName("ミッテ区")).toBe("みってく");
  });

  it("leaves a word of two readings, and kanji, unread", () => {
    expect(readingOfName("ナントカ町")).toBeNull();
    expect(readingOfName("上海市")).toBeNull();
  });
});
