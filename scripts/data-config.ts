// What scripts/build-data.ts needs that no source gives: the few tables written by hand for this package.
// Everything here is MIT, written for kuni. Every Japanese string in this file is hand-written and is listed
// for review by a native reader before a release (see the README's Languages section).

// Other names people type for a country, beyond CLDR's own names, short names and variants. The English
// list started as itsutsu.com's profile-form aliases (the spellings its members had actually typed); an
// alias that folds to a name the country already has is dropped by the build, and one that would point at
// two countries stops it.
const COUNTRY_ALIASES: Record<string, string[]> = {
  AE: ["UAE"],
  BN: ["Brunei"],
  BO: ["Bolivia"],
  CI: ["Ivory Coast"],
  CV: ["Cape Verde"],
  CZ: ["Czech Republic", "Czechia"],
  GB: ["UK", "United Kingdom", "Great Britain", "Britain", "England", "Scotland", "Wales", "Northern Ireland", "英国"],
  HK: ["Hong Kong"],
  KP: ["North Korea"],
  KR: ["South Korea"],
  LA: ["Laos"],
  MD: ["Moldova"],
  MM: ["Burma"],
  MO: ["Macau"],
  NL: ["Holland", "The Netherlands"],
  PS: ["Palestine"],
  RU: ["Russia"],
  SY: ["Syria"],
  SZ: ["Swaziland"],
  TL: ["East Timor"],
  TR: ["Turkey"],
  TW: ["Taiwan"],
  TZ: ["Tanzania"],
  US: ["USA", "U.S.", "U.S.A.", "America", "United States of America", "米国"],
  VA: ["Vatican City"],
  VE: ["Venezuela"],
  VN: ["Vietnam", "Viet Nam"],
  AU: ["豪州"],
};

// Readings, in hiragana, for names written with kanji where Wikidata does not give one for the same name.
// Japan's 47 prefectures take theirs from Wikidata's kana name (P1814), and Hokkaido, which has none there,
// from here, and Fukuoka, which has two there (the second in historical kana). A country's reading is its CLDR Japanese name read aloud, so that a list can be put in
// Japanese order; brackets and the middle dot are left out of the reading.
const READING_FILLS: Record<string, string> = {
  "JP-01": "ほっかいどう",
  "JP-40": "ふくおかけん",
  AE: "あらぶしゅちょうこくれんぽう",
  AQ: "なんきょく",
  AS: "べいりょうさもあ",
  AX: "おーらんどしょとう",
  BQ: "おらんだりょうかりぶ",
  BV: "ぶーべとう",
  CC: "ここすきーりんぐしょとう",
  CD: "こんごみんしゅきょうわこくきんしゃさ",
  CF: "ちゅうおうあふりかきょうわこく",
  CG: "こんごきょうわこくぶらざびる",
  CK: "くっくしょとう",
  CN: "ちゅうごく",
  CX: "くりすますとう",
  DM: "どみにかこく",
  DO: "どみにかきょうわこく",
  EH: "にしさはら",
  FK: "ふぉーくらんどしょとう",
  FM: "みくろねしあれんぽう",
  FO: "ふぇろーしょとう",
  GF: "ふつりょうぎあな",
  GQ: "せきどうぎにあ",
  GS: "さうすじょーじあさうすさんどうぃっちしょとう",
  HK: "ちゅうかじんみんきょうわこくほんこんとくべつぎょうせいく",
  HM: "はーどとうまくどなるどしょとう",
  IM: "まんとう",
  IO: "えいりょういんどようちいき",
  JP: "にほん",
  KP: "きたちょうせん",
  KR: "かんこく",
  KY: "けいまんしょとう",
  MH: "まーしゃるしょとう",
  MK: "きたまけどにあ",
  MO: "ちゅうかじんみんきょうわこくまかおとくべつぎょうせいく",
  MP: "きたまりあなしょとう",
  NF: "のーふぉーくとう",
  PF: "ふつりょうぽりねしあ",
  PM: "さんぴえーるとうみくろんとう",
  PN: "ぴとけあんしょとう",
  PS: "ぱれすちなじちく",
  SB: "そろもんしょとう",
  SJ: "すばーるばるしょとうやんまいえんとう",
  SS: "みなみすーだん",
  TC: "たーくすかいこすしょとう",
  TF: "ふつりょうきょくなんしょとう",
  TL: "ひがしてぃもーる",
  TW: "たいわん",
  UM: "がっしゅうこくりょうゆうしょうりとう",
  US: "あめりかがっしゅうこく",
  VA: "ばちかんしこく",
  VC: "せんとびんせんとおよびぐれなでぃーんしょとう",
  VG: "えいりょうゔぁーじんしょとう",
  VI: "べいりょうゔぁーじんしょとう",
  ZA: "みなみあふりか",
};

// Japan's prefectures are told apart by the last character of their name, which is what the four kinds are:
// 都 (Tokyo), 道 (Hokkaido), 府 (Osaka and Kyoto) and 県 (the other 43).
const JP_TYPE_BY_SUFFIX: Record<string, string> = {
  都: "metropolis",
  道: "circuit",
  府: "urban-prefecture",
  県: "prefecture",
};

// The words a Japanese subdivision name can end in that say what kind of place it is. The build gives a
// (country, type) pair a Japanese word only when every name of that pair ends in the same one of these;
// otherwise the word is null. Longest first, so 自治州 is found before 州.
const JA_TYPE_WORDS: string[] = [
  "特別行政区",
  "自治共和国",
  "連邦直轄区",
  "自治管区",
  "自治地域",
  "直轄市",
  "特別市",
  "広域市",
  "特別区",
  "地域圏",
  "自治州",
  "自治区",
  "連邦区",
  "首都区",
  "共和国",
  "準州",
  "教区",
  "地方",
  "地区",
  "地域",
  "管区",
  "州",
  "県",
  "省",
  "市",
  "区",
  "郡",
  "都",
  "道",
  "府",
];

// CLDR's Japanese subdivision names sometimes end in a bracket that tells the place from one of the same name
// elsewhere: "セント・ポール (ドミニカ国)", "バリンゴ (カウンティ)", "江原道 (北)". The build takes the bracket off
// when what it holds is the Japanese name of a country (any country's CLDR name, short name or the spellings
// listed below, which CLDR uses in brackets but does not name a country by), one of these direction words, or
// one of these generic words for a kind of place or a county. A bracket holding anything else stays, and the
// test that no shipped name ends in one fails, so that somebody looks at it.
const JA_BRACKET_COUNTRY_NAMES: string[] = ["エル・サルバドル", "マケドニア", "モルドヴァ"];

const JA_BRACKET_WORDS: string[] = ["北", "南", "市", "カウンティ", "カントン", "バラ", "マージーサイド"];

// Japanese names written by hand where CLDR's is wrong, out of date or names another place, applied after CLDR
// (and the bracket rule) and before Wikidata fills a gap. Each says why, so that a reader can check it. These
// are the findings of a strong, not a native, reader of Japanese: see "For a native reader" in
// docs/disagreements.md for what is still to be confirmed.
const JA_NAME_OVERRIDES: Record<string, { ja: string; why: string }> = {
  "AG-06": { ja: "セント・ポール教区", why: "A parish (教区), as Wikidata names it; CLDR's bracket names Dominica, not Antigua." },
  "AG-07": { ja: "セント・ピーター教区", why: "A parish (教区), as Wikidata names it; CLDR's bracket names Dominica, not Antigua." },
  "GD-01": { ja: "セント・アンドリュー教区", why: "A parish (教区); CLDR's セント・アンドリューズ is not the form used for the other Eastern Caribbean parishes." },
  "GD-02": { ja: "セント・デイヴィッド教区", why: "A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county) and its bracket names Dominica, not Grenada." },
  "GD-03": { ja: "セント・ジョージ教区", why: "A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county)." },
  "GD-04": { ja: "セント・ジョン教区", why: "A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county) and its bracket names Dominica, not Grenada." },
  "GD-05": { ja: "セント・マーク教区", why: "A parish (教区), as Wikidata names it; CLDR leaves the word off and its bracket names Dominica, not Grenada." },
  "GD-06": { ja: "セント・パトリック教区", why: "A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county)." },
  "VC-02": { ja: "セント・アンドリュー教区", why: "A parish (教区), as the neighbouring islands' parishes are written; CLDR has セント・アンドリューズ." },
  "VC-03": { ja: "セント・デイヴィッド教区", why: "A parish (教区), as the neighbouring islands' parishes are written; CLDR calls it a 郡 (county)." },
  "DM-02": { ja: "セント・アンドリュー教区", why: "A parish (教区), as Wikidata names it; CLDR adds a country bracket." },
  "DM-03": { ja: "セント・デイヴィッド教区", why: "A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county)." },
  "DM-04": { ja: "セント・ジョージ教区", why: "A parish (教区), as Wikidata names it; CLDR adds a country bracket." },
  "DM-05": { ja: "セント・ジョン教区", why: "A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county)." },
  "DM-06": { ja: "セント・ジョゼフ教区", why: "A parish (教区), as Wikidata names it; CLDR adds a country bracket." },
  "DM-07": { ja: "セント・ルーク教区", why: "A parish (教区), as Wikidata names it; CLDR adds a country bracket." },
  "DM-08": { ja: "セント・マーク教区", why: "A parish (教区), as Wikidata names it; CLDR adds a country bracket." },
  "DM-09": { ja: "セント・パトリック教区", why: "A parish (教区), as Wikidata names it; CLDR adds a country bracket." },
  "DM-10": { ja: "セント・ポール教区", why: "A parish (教区), as Wikidata names it; CLDR adds a country bracket." },
  "DM-11": { ja: "セント・ピーター教区", why: "A parish (教区), as Wikidata names it; CLDR adds a country bracket." },
  "AZ-LA": { ja: "ランカラン", why: "CLDR swaps the city and the district: ISO's AZ-LA is the city of Lankaran." },
  "AZ-LAN": { ja: "ランカラン県", why: "CLDR swaps the city and the district: ISO's AZ-LAN is Lankaran District." },
  "MT-45": { ja: "ヴィクトリア", why: "The name of the town on Gozo; CLDR gives the Maltese Rabat." },
  "MT-06": { ja: "コスピクア", why: "CLDR gives the Maltese name, Bormla; Japanese uses the English-derived コスピクア." },
  "MT-20": { ja: "セングレア", why: "CLDR gives the Maltese name, L-Isla; Japanese uses the English-derived セングレア." },
  "IE-LS": { ja: "リーシュ州", why: "Laois is リーシュ in Japanese, as Wikidata also has it; Ireland's counties are written 州." },
  "NG-LA": { ja: "ラゴス州", why: "Lagos is ラゴス in Japanese, as Wikidata also has it, not CLDR's レゴス." },
  "PH-DAV": { ja: "北ダバオ州", why: "Davao del Norte is North Davao: 北ダバオ州." },
  "PH-DIN": { ja: "ディナガット諸島州", why: "CLDR leaves the English word Islands in katakana; 諸島 is the Japanese word." },
  "MA-MOH": { ja: "モハメディア", why: "CLDR names the city with its old name in brackets (Fedhala); the city's name today is Mohammedia." },
  "MK-201": { ja: "ベロヴォ", why: "The country in the bracket is no longer called Macedonia; the bracket is not part of the name." },
  "LU-LU": { ja: "ルクセンブルク郡", why: "Without CLDR's bracket the name would be the country's own; 郡 marks the canton." },
  "DO-25": { ja: "サンティアゴ州", why: "The Dominican Republic's divisions are 州 (provinces), as Wikidata has it; CLDR has 県." },
  "KP-07": { ja: "江原道", why: "North Korea's Kangwon is 江原道; CLDR's bracket (北) is not part of the name." },
  "UA-30": { ja: "キーウ", why: "Japan's government adopted the Ukrainian form Kyiv (キーウ) in 2022." },
  "UA-32": { ja: "キーウ州", why: "Japan's government adopted the Ukrainian form Kyiv (キーウ) in 2022." },
  "UA-51": { ja: "オデーサ州", why: "Japan's government adopted the Ukrainian form Odesa (オデーサ) in 2022." },
  "IN-JK": { ja: "ジャンムー・カシミール連邦直轄領", why: "Not a state since 2019: a union territory (連邦直轄領)." },
  "KR-42": { ja: "江原特別自治道", why: "Renamed in 2023: Gangwon State became Gangwon Special Self-Governing Province." },
  "KR-45": { ja: "全北特別自治道", why: "Renamed in 2024: North Jeolla became Jeonbuk Special Self-Governing Province." },
  "FR-CVL": { ja: "サントル＝ヴァル・ド・ロワール地域圏", why: "Renamed in 2015 from Centre; the full name, with its hyphens as ＝." },
  "LV-067": { ja: "オグレ", why: "Spelled after the Latvian name, as Wikidata does for its city of the same name; CLDR's spelling reads the English." },
  "LV-059": { ja: "マドナ", why: "Spelled after the Latvian name, as Wikidata does for its city of the same name; CLDR's spelling reads the English." },
  "LV-041": { ja: "イェルガヴァ", why: "Spelled after the Latvian name, as Wikidata does for its city of the same name; CLDR's spelling reads the English." },
  "LV-042": { ja: "イェーカブピルス", why: "Spelled after the Latvian name, as Wikidata does for its city of the same name; CLDR's spelling reads the English." },
  "LV-058": { ja: "ルザ", why: "Spelled after the Latvian name, as Wikidata does for its city of the same name; CLDR's spelling reads the English." },
};

// Questions a native reader of Japanese should settle, which the build cannot: the name kept is CLDR's, and
// the note says what the doubt is. They are listed in docs/disagreements.md; a code here must be a subdivision.
const JA_OPEN_QUESTIONS: Record<string, string> = {
  "HU-CS": "CLDR's チョングラード県 or Wikidata's チョングラード・チャナード県: the county is Csongrád-Csanád since 2020.",
  "NI-AS": "CLDR's 南アトランティコ自治地域 or Wikidata's 南カリブ海岸自治地域: which is the usual Japanese name of this autonomous region.",
  "PH-COM": "Compostela Valley is Davao de Oro since 2019: コンポステラ・バレー州 (CLDR) or ダバオ・デ・オロ (Wikidata)?",
  "VN-39": "ドンナイ省 (CLDR) or ドンナイ市 (Wikidata): a province, and Wikidata's 市 may come from its city.",
  "KP-01": "平壌 (CLDR) or 平壌市 (Wikidata): whether the city's name wants 市 here, as 東京都 and 大阪市 do.",
  "LV-041": "イェルガヴァ is also the name given to the city of Jelgava (LV-JEL), so a search for it finds two places: should the municipality carry a kind word?",
  "BB-09": "セント・ペーター, while the same saint is セント・ピーター in AG-07 and DM-11: should Barbados match?",
};

// Wikidata's instance-of (P31) classes, read through their English labels, to a small set of kinds. The
// label's head is matched (the part before " of " or " in ", so "province of Canada" is read as "province"),
// and the first rule that matches wins. Labels that say nothing about administration are left out first.
const TYPE_NOISE = /^(former|historical|capital of|largest|big city|megacity|global city|tourist|financial|port city|border city|human settlement|electoral|cultural region|administrative territorial entity|first-level administrative division|second-level administrative division|disputed territory|exclave|reef island|island$|atoll$)/;

const TYPE_RULES: [RegExp, string][] = [
  [/autonomous communit/, "autonomous-community"],
  [/autonomous (region|okrug|oblast|province|district)/, "autonomous-region"],
  [/special administrative region/, "special-administrative-region"],
  [/city-state|federal city|city of federal|centrally[- ]governed cit|direct-administered municipality|municipality directly/, "city"],
  [/city with (county|powiat) rights|county borough|county-level city|statutory city|city with municipal rights|state city/, "city"],
  [/capital (district|territory|region|city)|federal (district|capital|territory)|national capital/, "capital-district"],
  [/prefecture/, "prefecture"],
  [/voivodeship/, "voivodeship"],
  [/\boblast\b/, "oblast"],
  [/\bkrai\b/, "krai"],
  [/republic/, "republic"],
  [/\bstate\b|federative unit|land of/, "state"],
  [/\bprovince\b/, "province"],
  [/\bregion\b|regional unit/, "region"],
  [/\bcounty\b/, "county"],
  [/\bdepartment\b/, "department"],
  [/\bcanton\b/, "canton"],
  [/governorate/, "governorate"],
  [/\bemirate\b/, "emirate"],
  [/\bparish\b/, "parish"],
  [/\bdistrict\b/, "district"],
  [/municipality|\bmunicipal\b|concelho|commune/, "municipality"],
  [/\bborough\b/, "borough"],
  [/council area/, "council-area"],
  [/unitary authority/, "unitary-authority"],
  [/principal area/, "principal-area"],
  [/territory|insular area|dependency|overseas collectivity/, "territory"],
  [/\bdivision\b/, "division"],
  [/\bzone\b/, "zone"],
  [/\bcountry\b/, "country"],
  [/\bcity\b|\btown\b/, "city"],
  [/\bquarter\b/, "quarter"],
  [/\batoll\b/, "atoll"],
  [/\bisland/, "island"],
];

// The country-code top-level domain, where it is not the lower-case alpha-2 code. The United Kingdom's
// .gb is delegated but has never been in general use.
const TLD_EXCEPTIONS: Record<string, string> = { GB: "uk" };

export { COUNTRY_ALIASES, JA_BRACKET_COUNTRY_NAMES, JA_BRACKET_WORDS, JA_NAME_OVERRIDES, JA_OPEN_QUESTIONS, JA_TYPE_WORDS, JP_TYPE_BY_SUFFIX, READING_FILLS, TLD_EXCEPTIONS, TYPE_NOISE, TYPE_RULES };
