// A city's short Japanese name, for a label on a map: 東京, not 東京都; 大阪, not 大阪市. Apart from city-rows.ts so the
// rule is read in one place; JA_SHORT_KEEP (generated, src/data/ja-short.data.ts) holds the names it must not shorten.

import { JA_SHORT_KEEP } from "./data/ja-short.data";

// Suffixes dropped whole, longest first: Korea's metropolitan and special cities (ソウル特別市, 釜山広域市, 世宗特別自治市).
const WHOLE = ["特別自治市", "特別市", "広域市"];
// A ward's suffix that is part of the name, kept: 地区 (district), 特別区 (a London borough), 新区 (Pudong New Area).
const PART_OF_NAME = /(地|特別|新)区$/;

/**
 * The short Japanese name of a city, from its full one: Tokyo's 東京都 is 東京; a final 市 or 区 is dropped (大阪市 大阪,
 * 新宿区 新宿, ブルックリン区 ブルックリン); Korea's 特別市, 広域市 and 特別自治市 are dropped whole (ソウル). The name is
 * kept whole where dropping would leave one character (津市, 堺市, 中区), would give a country's name (クウェート市), or
 * where the 区 belongs to the name (ヤレン地区, 浦東新区). 町, 村 and 郡 are never dropped.
 *
 * @param ja - The city's Japanese name, as kuni has it.
 * @returns The short name; the name itself where nothing is dropped.
 */
const jaShortOf = (ja: string): string => {
  if (ja === "東京都") return "東京";
  if (JA_SHORT_KEEP.has(ja)) return ja;
  for (const suffix of WHOLE) if (ja.endsWith(suffix) && [...ja].length - [...suffix].length >= 2) return ja.slice(0, -suffix.length);
  if ((ja.endsWith("市") || ja.endsWith("区")) && !PART_OF_NAME.test(ja) && [...ja].length >= 3) return ja.slice(0, -1);

  return ja;
};

export { jaShortOf };
