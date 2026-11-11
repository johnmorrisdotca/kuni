// Which part of a split tier holds a city: the parts of @johnmorrisdotca/kuni/cities/capitals-<key> and
// /cities/100k-<key>, one for each first letter of a word of a name, so a search that matches from the start of a word
// fetches one part. Apart from the cities so scripts/build-data.ts writes the parts by the same rule.

// The rows of the kana table, by the first hiragana of each (folding makes katakana hiragana): あ, か, さ, た, な, は, ま, や, ら, わ.
const KANA_ROWS: readonly (readonly [number, string])[] = [
  [0x3041, "a"],
  [0x304b, "k"],
  [0x3055, "s"],
  [0x305f, "t"],
  [0x306a, "n"],
  [0x306f, "h"],
  [0x307e, "m"],
  [0x3083, "y"],
  [0x3089, "r"],
  [0x308e, "w"],
];

/**
 * The key of the part that holds the words starting with this folded text: its first letter a to z, "0" for a digit,
 * "kana-<row>" for a kana (kana-k for か, き, く, け, こ and their voiced forms), else "x" and one of sixteen groups of
 * the letter's code point (kanji, hangul, Cyrillic and the rest). `null` for empty text.
 */
const startKey = (folded: string): string | null => {
  const first = [...folded][0];
  if (first === undefined) return null;
  if (/^[a-z]$/.test(first)) return first;
  if (/^[0-9]$/.test(first)) return "0";
  const code = first.codePointAt(0)!;
  if (code >= 0x3041 && code <= 0x3096) {
    let row = "a";
    for (const [at, name] of KANA_ROWS) if (code >= at) row = name;

    return `kana-${row}`;
  }

  return `x${(code % 16).toString(16)}`;
};

/** Every key, in order. */
const START_KEYS: readonly string[] = Object.freeze([
  ..."abcdefghijklmnopqrstuvwxyz",
  "0",
  ...KANA_ROWS.map(([, row]) => `kana-${row}`),
  ..."0123456789abcdef".split("").map((digit) => `x${digit}`),
]);

/** The keys of the words of names already folded: "new york city" is in n, y and c. */
const startKeys = (folded: readonly string[]): Set<string> => {
  const keys = new Set<string>();
  for (const name of folded) for (const word of name.split(" ")) {
    const key = startKey(word);
    if (key !== null) keys.add(key);
  }

  return keys;
};

export { START_KEYS, startKey, startKeys };
