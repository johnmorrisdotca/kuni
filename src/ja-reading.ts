// A Japanese name's reading in hiragana where its words are written in kana: the city files keep a reading only where
// it differs from readingOfName's (one from Wikidata or Japan Post for a name in kanji), and a city's `name.jaReading`
// is readingOfName's where they keep none.

/**
 * Kana written as hiragana: katakana to hiragana, the long-vowel mark kept, and the marks between words (the middle
 * dot, the equals signs, dashes, spaces) dropped (ニューヨーク, にゅーよーく; リオ・デ・ジャネイロ, りおでじゃねいろ). `null`
 * where the text holds anything else (a kanji: 東京都 has no reading of its own here).
 *
 * @param text - A name or a reading.
 * @returns The reading in hiragana, or `null`.
 */
const hiraganaOf = (text: string): string | null => {
  const plain = text.normalize("NFKC").replace(/[・･＝=゠\-‐‑–—―\s]/gu, "");
  const hiragana = [...plain].map((char) => {
    const code = char.codePointAt(0)!;

    if (code >= 0x30a1 && code <= 0x30f6) return String.fromCodePoint(code - 0x60);
    // ヷ, ヸ, ヹ and ヺ have no hiragana of their own: わ, ゐ, ゑ and を with the voiced mark.
    if (code >= 0x30f7 && code <= 0x30fa) return `${"わゐゑを"[code - 0x30f7]}\u3099`;
    return char;
  });

  return hiragana.length > 0 && hiragana.every((char) => /^[ぁ-ゖゝゞー]\u3099?$/u.test(char)) ? hiragana.join("") : null;
};

// The words a name in kana may end in that have one reading only: a city, a ward, a county, a prefecture, a state, a
// town of China. 町, 村 and 島 are left out, as each has two (まち and ちょう, むら and そん, しま and じま).
const SUFFIX_READINGS: Readonly<Record<string, string>> = { 市: "し", 区: "く", 郡: "ぐん", 県: "けん", 州: "しゅう", 鎮: "ちん" };

/**
 * A city's Japanese name read in hiragana where its words are kana: the name before a qualifier in brackets (ゴヤ
 * (アルゼンチン) is ごや), and a last word of one reading only after a name in kana (ラアス・アル＝ハイマ市, らあすあるはいまし).
 * `null` for a name with any other kanji.
 *
 * @param name - The Japanese name.
 * @returns The reading in hiragana, or `null`.
 */
const readingOfName = (name: string): string | null => {
  const bare = name.normalize("NFKC").replace(/\s*\([^()]*\)\s*$/u, "");
  const last = [...bare].at(-1) ?? "";
  const suffix = SUFFIX_READINGS[last];
  if (suffix === undefined) return hiraganaOf(bare);
  const stem = hiraganaOf(bare.slice(0, -last.length));

  return stem === null ? null : stem + suffix;
};

export { hiraganaOf, readingOfName };
