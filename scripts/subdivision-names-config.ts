// What scripts/build-subdivision-names.ts needs that no source gives: which CLDR file and which Wikidata language tags stand for each
// language, in the order they are preferred, and the checks a name must pass. Hand-written for kuni (MIT); every character list is
// listed for review by a native reader, and none of it ever produces a name.

import type { SubdivisionNamesLanguage } from "../src/subdivision-names.ts";

// CLDR's locale for each language (CLDR calls Simplified Chinese plain zh).
export const CLDR_LOCALE: Record<SubdivisionNamesLanguage, string> = { es: "es", de: "de", "zh-Hans": "zh", "zh-Hant": "zh_Hant" };

// The Wikidata label tags read for each language, most preferred first. Plain `zh` is not here: it does not say its script.
// The variants after the first are labels written in the same script for a region (zh-cn for the mainland, zh-tw for Taiwan); each
// name keeps the tag it was read under, so a page can tell. Traditional prefers Taiwan's wording to Hong Kong's and Macau's.
export const WIKIDATA_TAGS: Record<SubdivisionNamesLanguage, readonly string[]> = {
  es: ["es"],
  de: ["de"],
  "zh-Hans": ["zh-hans", "zh-cn", "zh-sg", "zh-my"],
  "zh-Hant": ["zh-hant", "zh-tw", "zh-hk", "zh-mo"],
};

// Characters one script writes and the other does not (a heuristic: place names use few of the thousands that differ, and these are
// common in them). A Simplified name with one of the first is Traditional or Japanese; a Traditional name with one of the second is
// Simplified. Taken by reading, not by a conversion table, and so never used to change a name: only to refuse one.
const TRADITIONAL_ONLY = "國區縣島與華門馬鳥蘭東亞聯邊灣寧廣陽陸鄉鎮義爾倫優樂書達順濟興寶衛總開關貴賓納蘇維盧圖專學約紐薩內賽湯羅凱貝烏諾韋費魯錫邁帶鐵環溫頓紹長澤輝隊臨揚滬營";
const SIMPLIFIED_ONLY = "国区县岛与华门马鸟兰东亚联边湾宁广阳陆乡镇义尔伦优乐书达顺济兴宝卫总开关贵宾纳苏维卢图专学约纽萨内赛汤罗凯贝乌诺韦费鲁锡迈带铁环温顿绍长泽辉队临扬沪营";

// Characters Japanese writes its own way (県 for 縣 and 县), which neither Chinese script uses: a Japanese form in a Chinese name.
const JAPANESE_ONLY = "県関広沢";
const TRADITIONAL = new Set([...TRADITIONAL_ONLY, ...JAPANESE_ONLY]);
const SIMPLIFIED = new Set([...SIMPLIFIED_ONLY, ...JAPANESE_ONLY]);

/**
 * Why a name is not used, or `null` when it passes. Every language: nothing empty, and none of the characters a name never holds (a
 * quotation mark or an angle bracket is a typing mistake in a place's name, as in CLDR's Provincia de Vestland"). Chinese: at least one
 * Chinese character, and none that belongs to the other script.
 */
export const checkName = (language: SubdivisionNamesLanguage, name: string): string | null => {
  if (name === "") return "empty";
  if (/["<>|`\\]/.test(name)) return "a stray quotation mark, bracket or bar in the name";
  if (language !== "zh-Hans" && language !== "zh-Hant") return null;
  if (!/\p{Script=Han}/u.test(name)) return "no Chinese character";
  const wrong = [...name].find((character) => (language === "zh-Hans" ? TRADITIONAL : SIMPLIFIED).has(character));
  if (wrong !== undefined) {
    if (JAPANESE_ONLY.includes(wrong)) return `${wrong} is a Japanese form, in a Chinese name`;

    return language === "zh-Hans" ? `${wrong} is Traditional, in a Simplified name` : `${wrong} is Simplified, in a Traditional name`;
  }

  return null;
};
