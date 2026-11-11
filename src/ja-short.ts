// A city's short Japanese name, for a label on a map: 東京, not 東京都; 大阪, not 大阪市. Apart from city-rows.ts so the
// rule is read in one place; JA_SHORT_KEEP (generated, src/data/ja-short.data.ts) holds the names it must not shorten.

import { JA_SHORT_KEEP } from "./data/ja-short.data";

// Suffixes dropped whole, longest first: Korea's metropolitan and special cities (ソウル特別市, 釜山広域市, 世宗特別自治市).
const WHOLE = ["特別自治市", "特別市", "広域市"];
// A ward's suffix that is part of the name, kept: 地区 (district), 特別区 (a London borough), 新区 (Pudong New Area),
// 郡区 (a township: ワシントン郡区 is not ワシントン郡, the county), 自治区 (an autonomous region), 特区.
const PART_OF_NAME = /(地|特別|新|郡|自治|特)区$/;
// Names whose short form would mean something else, kept whole: a common word (中央市, Chūō City, is not 中央,
// "central"), a region (四国中央, 南九州), a Chinese province (雲南, 湖南, 海南, 河南), an old province (甲州, 奥州), a
// province of the Philippines (ケソン市, Quezon City), or a translated district name that is no label alone (拡張区,
// Eixample; 壁外区; 古町区).
const KEEP_WHOLE: ReadonlySet<string> = new Set([
  "中央市",
  "四国中央市",
  "南九州市",
  "雲南市",
  "湖南市",
  "海南市",
  "河南市",
  "甲州市",
  "奥州市",
  "ケソン市",
  "拡張区",
  "壁外区",
  "古町区",
]);

/**
 * The short Japanese name of a city, from its full one: Tokyo's 東京都 is 東京; a final 市 or 区 is dropped (大阪市 大阪,
 * 新宿区 新宿, ブルックリン区 ブルックリン); Korea's 特別市, 広域市 and 特別自治市 are dropped whole (ソウル). The name is
 * kept whole where dropping would leave one character (津市, 堺市, 中区), would give a country's name (クウェート市) or a
 * word, region or province (中央市, 南九州市, 雲南市, ケソン市), or where the 区 belongs to the name (ヤレン地区, 浦東新区,
 * ワシントン郡区). 町, 村 and 郡 are never dropped.
 *
 * @param ja - The city's Japanese name, as kuni has it.
 * @returns The short name; the name itself where nothing is dropped.
 */
const jaShortOf = (ja: string): string => {
  if (ja === "東京都") return "東京";
  if (JA_SHORT_KEEP.has(ja) || KEEP_WHOLE.has(ja)) return ja;
  for (const suffix of WHOLE) if (ja.endsWith(suffix) && [...ja].length - [...suffix].length >= 2) return ja.slice(0, -suffix.length);
  if ((ja.endsWith("市") || ja.endsWith("区")) && !PART_OF_NAME.test(ja) && [...ja].length >= 3) return ja.slice(0, -1);

  return ja;
};

export { jaShortOf };
