// What scripts/build-data.ts needs, beyond its sources, to make the facts about each country (the /facts entry and
// the Japanese name of each capital): the few choices written by hand, each with its reason. Everything here is MIT,
// written for kuni. Every Japanese string in this file is hand-written and listed for review by a native reader.
//
// The rules the build applies to the Wikidata snapshot (data-sources/wikidata-facts-<day>.json) before any of
// these, so that a reader knows what the lists below are exceptions to:
//
//   - A code's item is the one item holding it that was not dissolved (P576) and whose code statement has not
//     ended (P582). Where two remain, COUNTRY_ITEMS names the one.
//   - The capital is the current capital (P36, no end) whose English label is countries-list's capital. Where no
//     label matches, CAPITAL_ITEMS names the item, and may replace countries-list's English name.
//   - The population is the best-ranked figure with the latest date (P585). A figure for a part of the place (P518)
//     is used only when the part is one of POPULATION_PARTS.
//   - The area is the best-ranked figure in square kilometres for the whole (P518 "whole"), or else the one with no
//     part, or else the land; where two figures are equally good, AREA_CHOICES picks.
//   - A land border is one Wikidata states (P47, either side, not ended) AND the outlines of Natural Earth 5.1.2
//     (1:50m, as drawn by chizu) touch. BORDERS_ADDED adds the land borders Natural Earth cannot see, because one
//     side is not drawn on its own or the border is too short for the scale.

// Codes held by two current Wikidata items: the item that is the country.
const COUNTRY_ITEMS: Record<string, { item: string; why: string }> = {
  AQ: { item: "Q51", why: "Antarctica the continent, not the Antarctic Treaty area (Q10372207)." },
  CY: { item: "Q229", why: "The Republic of Cyprus, not the island (Q644636)." },
};

// Capitals whose Wikidata item is not found by countries-list's English name: either Wikidata labels it otherwise,
// or the country's item has no capital statement. `en` replaces countries-list's English name where that is out of
// date. `ja`, where given, replaces Wikidata's Japanese label (see CAPITAL_JA_OVERRIDES for the reason).
const CAPITAL_ITEMS: Record<string, { item: string; en?: string; why: string }> = {
  AG: { item: "Q36262", why: "Saint John's: Wikidata has no English label on the item." },
  BQ: { item: "Q331584", why: "Kralendijk: Wikidata's item for the Caribbean Netherlands names no capital." },
  EH: { item: "Q47837", why: "El Aaiún (Laayoune): Wikidata's item for Western Sahara names no capital." },
  GG: { item: "Q174262", why: "St. Peter Port: Wikidata spells it Saint Peter Port." },
  GQ: { item: "Q1140136", en: "Ciudad de la Paz", why: "Equatorial Guinea moved its capital from Malabo to Ciudad de la Paz in January 2026 (Wikidata, P36 from 2026-01-03); countries-list 3.4.1 still has Malabo." },
  HK: { item: "Q963152", why: "City of Victoria: Wikidata's item for Hong Kong names no capital." },
  MN: { item: "Q23430", why: "Ulan Bator: Wikidata spells it Ulaanbaatar." },
  MP: { item: "Q9332790", why: "Saipan: Wikidata's capital item (Q49755159) has no Japanese label; its municipality has." },
  NR: { item: "Q31026", why: "Yaren: Nauru has no official capital; Wikidata names Yaren District, the seat of government." },
  SJ: { item: "Q25923", why: "Longyearbyen: Wikidata's item for Svalbard and Jan Mayen names no capital." },
  SM: { item: "Q1848", why: "City of San Marino: Wikidata labels it San Marino." },
  TK: { item: "Q650847", why: "Fakaofo: Tokelau has no capital; its seat rotates. Wikidata's item for the atoll." },
  TO: { item: "Q38834", why: "Nuku'alofa: Wikidata writes the ʻokina, which does not fold to an apostrophe." },
};

// Japanese names of capitals where Wikidata's label is wrong for this use, with the reason.
const CAPITAL_JA_OVERRIDES: Record<string, { ja: string; why: string }> = {
  AF: { ja: "カブール", why: "Wikidata's カーブル is a rare spelling; Japanese media and the Ministry of Foreign Affairs write カブール." },
  AG: { ja: "セントジョンズ", why: "Wikidata's セイント・ジョンズ is not the usual spelling; the Ministry of Foreign Affairs and Japanese Wikipedia write セントジョンズ." },
  AI: { ja: "ザ・バレー", why: "Wikidata's バレー drops the article and reads as volleyball; the capital's name is The Valley, ザ・バレー." },
  AM: { ja: "エレバン", why: "Wikidata's イェレヴァン is rare; the Ministry of Foreign Affairs and Japanese media write エレバン." },
  BA: { ja: "サラエボ", why: "Wikidata's サラエヴォ is a rarer spelling; Japanese media and the Ministry of Foreign Affairs write サラエボ." },
  BE: { ja: "ブリュッセル", why: "Wikidata's ブリュッセル市 names the municipality; the capital is written ブリュッセル." },
  CG: { ja: "ブラザビル", why: "Wikidata's ブラザヴィル is a rarer spelling; Japanese media and the Ministry of Foreign Affairs write ブラザビル." },
  CN: { ja: "北京", why: "Wikidata's 北京市 is the municipality's formal name; the capital is written 北京." },
  GQ: { ja: "シウダ・デ・ラ・パス", why: "Wikidata's label ラパス is the name of Bolivia's La Paz; シウダ・デ・ラ・パス is the title of the Japanese Wikipedia article." },
  JP: { ja: "東京", why: "Wikidata's 東京都 names the prefecture; the capital is written 東京." },
  KP: { ja: "平壌", why: "Wikidata's 平壌市 is the municipality's formal name; the capital is written 平壌, as CLDR spells it for KP-01." },
  KR: { ja: "ソウル", why: "Wikidata's ソウル特別市 is the city's formal title; the capital is written ソウル." },
  LA: { ja: "ビエンチャン", why: "Wikidata's ヴィエンチャン is a rarer spelling; Japanese media and the Ministry of Foreign Affairs write ビエンチャン." },
  MP: { ja: "サイパン", why: "Wikidata's サイパン市 is the municipality's label; the capital is written サイパン." },
  NR: { ja: "ヤレン", why: "Wikidata's ヤレン地区 names a district; Nauru has no official capital and Yaren, the place, is written ヤレン." },
  TV: { ja: "フナフティ", why: "Wikidata's フナフティ島 names the atoll; the capital is written フナフティ." },
  TW: { ja: "台北", why: "Wikidata's 台北市 is the municipality's formal name; the capital is written 台北." },
};

// Parts of a place a population figure may be for and still stand for the whole (P518).
const POPULATION_PARTS: Record<string, string> = {
  Q33112019: "suburb and locality: an Australian census area that is the whole of Christmas Island and of Norfolk Island",
};

// Where Wikidata gives two best-ranked areas for the whole, the one kept.
// `part` says what the figure kept is for, where Wikidata's own qualifier says otherwise.
const AREA_CHOICES: Record<string, { km2: number; part?: "whole"; why: string }> = {
  HK: { km2: 2755.03, part: "whole", why: "Land and sea within its boundary together, the figure Hong Kong's government gives as its total; Wikidata labels it the land and also has the land alone, 1,105.69." },
  MX: { km2: 1964375, why: "INEGI's figure, the one Mexico publishes; Wikidata also has 1,972,550." },
  SD: { km2: 1886068, why: "Sudan since South Sudan's independence in 2011, the figure most sources give; Wikidata also has 1,840,687." },
};

// Land borders Natural Earth's 1:50m outlines cannot confirm, each true on the ground. Both directions are added.
const BORDERS_ADDED: Record<string, string> = {
  "BR GF": "French Guiana borders Brazil; Natural Earth draws French Guiana as part of France.",
  "GF SR": "French Guiana borders Suriname; Natural Earth draws French Guiana as part of France.",
  "ES GI": "Gibraltar borders Spain across the isthmus; Natural Earth does not draw Gibraltar on its own at 1:50m.",
  "ES MA": "Ceuta and Melilla, Spanish cities in Africa, border Morocco; too small for Natural Earth's 1:50m.",
  "CN HK": "Hong Kong borders mainland China at Shenzhen; Wikidata states it on neither side.",
  "CN MO": "Macao borders mainland China at Zhuhai; Wikidata states it on neither side.",
  "CA GL": "Hans Island, divided between Canada and Greenland by the treaty of 2022; Wikidata states it.",
  "CY GB": "The British Sovereign Base Areas of Akrotiri and Dhekelia border the Republic of Cyprus; Wikidata states it.",
};

// The few things the sources lack for good, so that a gap is a decision with its reason and never a value left out
// by accident. A test fails if a country lacks one of these without a line here, or has one and also a line here.
const FACT_GAPS: Record<"population" | "capital" | "capitalPoint" | "drivingSide" | "borders", Record<string, string>> = {
  population: {
    AQ: "No permanent population; Wikidata's figure of 5,000 is the summer's research stations.",
  },
  capital: {
    AQ: "Antarctica has no capital.",
    BV: "Bouvet Island is uninhabited.",
    HM: "Heard Island and McDonald Islands are uninhabited.",
    MO: "Macao is a city; countries-list names no capital.",
    UM: "The United States Minor Outlying Islands have no capital.",
  },
  capitalPoint: {
    AQ: "Antarctica has no capital.",
    BV: "Bouvet Island is uninhabited.",
    HM: "Heard Island and McDonald Islands are uninhabited.",
    MO: "Macao is a city; countries-list names no capital.",
    UM: "The United States Minor Outlying Islands have no capital.",
  },
  drivingSide: {
    AQ: "Antarctica has no public roads; Wikidata gives no driving side.",
    BV: "Bouvet Island is uninhabited and has no roads.",
    HM: "Heard Island and McDonald Islands are uninhabited and have no roads.",
  },
  // Islands and archipelagos with no land border, and Antarctica. Taken from the build's own list (a country with no
  // border kept) and read through, each one, before it was written here.
  borders: Object.fromEntries([
    ...["AG", "AI", "AS", "AU", "AW", "AX", "BB", "BH", "BL", "BM", "BQ", "BS", "BV", "CC", "CK", "CU", "CV", "CW", "CX", "DM", "FJ", "FK", "FM", "FO", "GD", "GG", "GP", "GS", "GU", "HM", "IM", "IO", "IS", "JE", "JM", "JP", "KI", "KM", "KN", "KY", "LC", "LK", "MG", "MH", "MP", "MQ", "MS", "MT", "MU", "MV", "NC", "NF", "NR", "NU", "NZ", "PF", "PH", "PM", "PN", "PR", "PW", "RE", "SB", "SC", "SG", "SH", "SJ", "ST", "TC", "TF", "TK", "TO", "TT", "TV", "TW", "UM", "VC", "VG", "VI", "VU", "WF", "WS", "YT"].map((code) => [code, "an island or islands, with no land border"]),
    ["AQ", "Antarctica, a continent of no country"],
  ]),
};

export { AREA_CHOICES, BORDERS_ADDED, CAPITAL_ITEMS, CAPITAL_JA_OVERRIDES, COUNTRY_ITEMS, FACT_GAPS, POPULATION_PARTS };
