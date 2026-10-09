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
  "自治管区",
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

export { COUNTRY_ALIASES, JA_TYPE_WORDS, JP_TYPE_BY_SUFFIX, READING_FILLS, TLD_EXCEPTIONS, TYPE_NOISE, TYPE_RULES };
