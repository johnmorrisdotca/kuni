// The groupings of countries and of subdivisions that are written by hand for the /groupings entry: the memberships of
// international bodies as each body lists them, the well-known informal groupings with the definition each follows,
// and the regions inside a country. The continents and the UN M49 regions are read from CLDR by scripts/groupings.ts;
// Wikidata (CC0) gives the dates members joined and left. Everything here is MIT, written for kuni; every Japanese
// string is hand-written and listed for review by a native reader.
//
// The lists are facts as each source publishes them on the day in AS_OF. Where Wikidata's "member of" (P463) and a
// list here disagree, the list here is kept and docs/groupings.md shows the difference.

const AS_OF = "2026-10-09";

type Status = "candidate" | "associate" | "observer" | "suspended";

interface MembershipConfig {
  id: string;
  item: string; // The body's Wikidata item, whose P463 statements give the dates
  en: string;
  ja: string;
  reading?: string; // Hiragana, where the Japanese name has kanji
  shortEn?: string;
  shortJa?: string;
  members: string; // Alpha-2 codes, with spaces between
  others?: Record<string, Status>; // Candidates, associates, observers and suspended members, not counted as members
  former?: { code: string; since: string | null; until: string; why: string }[]; // Left, where Wikidata does not say so
  source: { name: string; url: string };
  note?: string;
}

interface InformalConfig {
  id: string;
  en: string;
  ja: string;
  reading?: string;
  members: string; // Alpha-2 codes, or "m49:<area>" for every member of a UN M49 area
  definition: string;
  source: { name: string; url: string };
  note?: string;
}

interface SubdivisionGroupingConfig {
  id: string;
  country: string;
  sets: string[]; // The partitions it is part of: every grouping of a set together covers the country once
  en: string;
  ja: string;
  reading?: string;
  members: string; // Short codes of the country's subdivisions ("13" for JP-13), with spaces between
  definition: string;
  source: { name: string; url: string; licence: string };
}

const EU = "AT BE BG CY CZ DE DK EE ES FI FR GR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK";

const MEMBERSHIPS: MembershipConfig[] = [
  {
    id: "un",
    item: "Q1065",
    en: "United Nations",
    ja: "国際連合",
    reading: "こくさいれんごう",
    shortEn: "UN",
    shortJa: "国連",
    members: "",
    source: { name: "Unicode CLDR 48.2, the UN grouping (the 193 member states)", url: "https://www.un.org/en/about-us/member-states" },
    note: "Members are CLDR's list of the 193 member states. The Holy See (VA) and Palestine (PS) are observer states.",
    others: { VA: "observer", PS: "observer" },
  },
  {
    id: "eu",
    item: "Q458",
    en: "European Union",
    ja: "欧州連合",
    reading: "おうしゅうれんごう",
    shortEn: "EU",
    shortJa: "EU",
    members: EU,
    others: { AL: "candidate", BA: "candidate", GE: "candidate", MD: "candidate", ME: "candidate", MK: "candidate", RS: "candidate", TR: "candidate", UA: "candidate" },
    source: { name: "European Union, Countries", url: "https://european-union.europa.eu/principles-countries-history/eu-countries_en" },
    note: "Candidates are the countries the EU lists as candidate countries; Kosovo, a potential candidate, is not counted.",
  },
  {
    id: "eurozone",
    item: "Q8268",
    en: "Euro area",
    ja: "ユーロ圏",
    reading: "ゆーろけん",
    shortEn: "Eurozone",
    members: "AT BE BG CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK",
    source: { name: "European Central Bank, Euro area", url: "https://www.ecb.europa.eu/euro/intro/html/index.en.html" },
    note: "The 21 EU members that use the euro: Croatia from 2023 and Bulgaria from 1 January 2026. Countries that use the euro without being members (Andorra, Kosovo, Monaco, Montenegro, San Marino, Vatican City) are not in the euro area.",
  },
  {
    id: "schengen",
    item: "Q1969730",
    en: "Schengen Area",
    ja: "シェンゲン圏",
    reading: "しぇんげんけん",
    members: "AT BE BG CH CZ DE DK EE ES FI FR GR HR HU IS IT LI LT LU LV MT NL NO PL PT RO SE SI SK",
    source: { name: "European Commission, Schengen Area", url: "https://home-affairs.ec.europa.eu/policies/schengen/schengen-area_en" },
    note: "Bulgaria and Romania in full from 1 January 2025. Cyprus and Ireland are EU members outside it.",
  },
  {
    id: "eea",
    item: "Q8932",
    en: "European Economic Area",
    ja: "欧州経済領域",
    reading: "おうしゅうけいざいりょういき",
    shortEn: "EEA",
    shortJa: "EEA",
    members: `${EU} IS LI NO`,
    source: { name: "EFTA, The EEA Agreement", url: "https://www.efta.int/eea" },
    note: "The EU's 27 and three EFTA states; Switzerland, the fourth, is not in it.",
  },
  {
    id: "nato",
    item: "Q7184",
    en: "North Atlantic Treaty Organization",
    ja: "北大西洋条約機構",
    reading: "きたたいせいようじょうやくきこう",
    shortEn: "NATO",
    shortJa: "NATO",
    members: "AL BE BG CA CZ DE DK EE ES FI FR GB GR HR HU IS IT LT LU LV ME MK NL NO PL PT RO SE SI SK TR US",
    source: { name: "NATO, Member countries", url: "https://www.nato.int/cps/en/natohq/topics_52044.htm" },
  },
  {
    id: "g7",
    item: "Q1764511",
    en: "Group of Seven",
    ja: "主要7か国",
    reading: "しゅようななかこく",
    shortEn: "G7",
    shortJa: "G7",
    members: "CA DE FR GB IT JP US",
    source: { name: "G7 Research Group, University of Toronto", url: "https://www.g7.utoronto.ca/" },
    note: "The European Union also takes part, as a non-enumerated member.",
  },
  {
    id: "g20",
    item: "Q19771",
    en: "Group of Twenty",
    ja: "主要20か国・地域",
    reading: "しゅようにじゅっかこく・ちいき",
    shortEn: "G20",
    shortJa: "G20",
    members: "AR AU BR CA CN DE FR GB ID IN IT JP KR MX RU SA TR US ZA",
    source: { name: "G20, About the G20", url: "https://g20.org/about-the-g20/" },
    note: "Nineteen countries; the European Union and, from 2023, the African Union are members too, and are not countries.",
  },
  {
    id: "oecd",
    item: "Q41550",
    en: "Organisation for Economic Co-operation and Development",
    ja: "経済協力開発機構",
    reading: "けいざいきょうりょくかいはつきこう",
    shortEn: "OECD",
    shortJa: "OECD",
    members: "AT AU BE CA CH CL CO CR CZ DE DK EE ES FI FR GB GR HU IE IL IS IT JP KR LT LU LV MX NL NO NZ PL PT SE SI SK TR US",
    source: { name: "OECD, Members and partners", url: "https://www.oecd.org/en/about/members-partners.html" },
  },
  {
    id: "asean",
    item: "Q7768",
    en: "Association of Southeast Asian Nations",
    ja: "東南アジア諸国連合",
    reading: "とうなんあじあしょこくれんごう",
    shortEn: "ASEAN",
    shortJa: "ASEAN",
    members: "BN ID KH LA MM MY PH SG TH TL VN",
    others: { PG: "observer" },
    source: { name: "ASEAN, Member States", url: "https://asean.org/member-states/" },
    note: "Timor-Leste joined as the eleventh member on 26 October 2025.",
  },
  {
    id: "african-union",
    item: "Q7159",
    en: "African Union",
    ja: "アフリカ連合",
    reading: "あふりかれんごう",
    shortEn: "AU",
    shortJa: "AU",
    members: "AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RW SC SD SL SN SO SS ST SZ TD TG TN TZ UG ZA ZM ZW",
    source: { name: "African Union, Member States", url: "https://au.int/en/member_states/countryprofiles2" },
    note: "Every African state and the Sahrawi Republic (EH). Members the Union has suspended are still members, and are not marked.",
  },
  {
    id: "arab-league",
    item: "Q7172",
    en: "Arab League",
    ja: "アラブ連盟",
    reading: "あらぶれんめい",
    members: "AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE",
    source: { name: "League of Arab States", url: "http://www.leagueofarabstates.net/" },
    note: "Syria was suspended in 2011 and readmitted in 2023.",
  },
  {
    id: "gcc",
    item: "Q217172",
    en: "Gulf Cooperation Council",
    ja: "湾岸協力会議",
    reading: "わんがんきょうりょくかいぎ",
    shortEn: "GCC",
    shortJa: "GCC",
    members: "AE BH KW OM QA SA",
    source: { name: "Gulf Cooperation Council Secretariat General", url: "https://www.gcc-sg.org/" },
  },
  {
    id: "commonwealth",
    item: "Q7785",
    en: "Commonwealth of Nations",
    ja: "イギリス連邦",
    reading: "いぎりすれんぽう",
    shortEn: "Commonwealth",
    shortJa: "英連邦",
    members: "AG AU BB BD BN BS BW BZ CA CM CY DM FJ GA GB GD GH GM GY IN JM KE KI KN LC LK LS MT MU MV MW MY MZ NA NG NR NZ PG PK RW SB SC SG SL SZ TG TO TT TV TZ UG VC VU WS ZA ZM",
    source: { name: "The Commonwealth, Member countries", url: "https://thecommonwealth.org/our-member-countries" },
    note: "Gabon and Togo joined in 2022.",
  },
  {
    id: "opec",
    item: "Q7795",
    en: "Organization of the Petroleum Exporting Countries",
    ja: "石油輸出国機構",
    reading: "せきゆゆしゅつこくきこう",
    shortEn: "OPEC",
    shortJa: "OPEC",
    members: "AE CG DZ GA GQ IQ IR KW LY NG SA VE",
    former: [
      { code: "AO", since: "2007-01-01", until: "2024-01-01", why: "Angola left OPEC on 1 January 2024." },
      { code: "QA", since: "1961-01-01", until: "2019-01-01", why: "Qatar left OPEC on 1 January 2019." },
      { code: "EC", since: "2007-01-01", until: "2020-01-01", why: "Ecuador left OPEC on 1 January 2020, for the second time." },
    ],
    source: { name: "OPEC, Member Countries", url: "https://www.opec.org/opec_web/en/about_us/25.htm" },
    note: "OPEC+ (Russia and others) is an agreement beside OPEC, not membership of it.",
  },
  {
    id: "brics",
    item: "Q243630",
    en: "BRICS",
    ja: "BRICS",
    members: "AE BR CN EG ET ID IN IR RU ZA",
    source: { name: "BRICS, Member countries", url: "https://brics.br/en/about-the-brics" },
    note: "Egypt, Ethiopia, Iran and the United Arab Emirates joined in 2024 and Indonesia in 2025. Saudi Arabia was invited and has not confirmed, so it is not counted; the partner countries are not members.",
  },
  {
    id: "mercosur",
    item: "Q4264",
    en: "Mercosur",
    ja: "南米南部共同市場",
    reading: "なんべいなんぶきょうどうしじょう",
    shortJa: "メルコスール",
    members: "AR BO BR PY UY",
    others: { VE: "suspended", CL: "associate", CO: "associate", EC: "associate", GY: "associate", PA: "associate", PE: "associate", SR: "associate" },
    source: { name: "Mercosur, Countries", url: "https://www.mercosur.int/en/about-mercosur/mercosur-countries/" },
    note: "Bolivia became a full member in 2024. Venezuela has been suspended since 2016.",
  },
  {
    id: "usmca",
    item: "Q56839716",
    en: "United States–Mexico–Canada Agreement",
    ja: "米国・メキシコ・カナダ協定",
    reading: "べいこく・めきしこ・かなだきょうてい",
    shortEn: "USMCA",
    shortJa: "USMCA",
    members: "CA MX US",
    source: { name: "Office of the United States Trade Representative, USMCA", url: "https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement" },
    note: "Called CUSMA in Canada and T-MEC in Mexico.",
  },
  {
    id: "apec",
    item: "Q170481",
    en: "Asia-Pacific Economic Cooperation",
    ja: "アジア太平洋経済協力",
    reading: "あじあたいへいようけいざいきょうりょく",
    shortEn: "APEC",
    shortJa: "APEC",
    members: "AU BN CA CL CN HK ID JP KR MX MY NZ PE PG PH RU SG TH TW US VN",
    source: { name: "APEC, Member Economies", url: "https://www.apec.org/about-us/about-apec/member-economies" },
    note: "Its members are economies: Hong Kong is a member as Hong Kong, China, and Taiwan as Chinese Taipei.",
  },
  {
    id: "caricom",
    item: "Q205995",
    en: "Caribbean Community",
    ja: "カリブ共同体",
    reading: "かりぶきょうどうたい",
    shortEn: "CARICOM",
    shortJa: "カリコム",
    members: "AG BB BS BZ DM GD GY HT JM KN LC MS SR TT VC",
    others: { AI: "associate", BM: "associate", KY: "associate", TC: "associate", VG: "associate" },
    source: { name: "CARICOM, Member States and Associate Members", url: "https://caricom.org/member-states-and-associate-members/" },
  },
  {
    id: "pacific-islands-forum",
    item: "Q757276",
    en: "Pacific Islands Forum",
    ja: "太平洋諸島フォーラム",
    reading: "たいへいようしょとうふぉーらむ",
    shortEn: "PIF",
    shortJa: "PIF",
    members: "AU CK FJ FM KI MH NC NR NU NZ PF PG PW SB TO TV VU WS",
    source: { name: "Pacific Islands Forum, Our Members", url: "https://forumsec.org/who-we-are" },
    note: "French Polynesia and New Caledonia have been full members since 2016.",
  },
  {
    id: "nordic-council",
    item: "Q146165",
    en: "Nordic Council",
    ja: "北欧理事会",
    reading: "ほくおうりじかい",
    members: "AX DK FI FO GL IS NO SE",
    source: { name: "Nordic Co-operation, The Nordic Council", url: "https://www.norden.org/en/information/about-nordic-council" },
    note: "Five states and three autonomous territories, Åland, the Faroe Islands and Greenland, which sit in the delegations of Finland and Denmark.",
  },
  {
    id: "benelux",
    item: "Q13116",
    en: "Benelux Union",
    ja: "ベネルクス",
    shortEn: "Benelux",
    members: "BE LU NL",
    source: { name: "Benelux Union", url: "https://www.benelux.int/en/" },
  },
];

// Bodies asked for and left out on purpose, with the reason, so that their absence is a decision.
const MEMBERSHIPS_LEFT_OUT: Record<string, string> = {
  francophonie:
    "Organisation internationale de la Francophonie: its members come in three tiers (members, associates, observers), Burkina Faso, Mali and Niger announced their withdrawal in 2025, and the list could not be checked against the organisation's own on the day this was written. Left for a later version rather than shipped with a doubt.",
};

const INFORMAL: InformalConfig[] = [
  {
    id: "middle-east",
    en: "Middle East",
    ja: "中東",
    reading: "ちゅうとう",
    members: "AE BH CY EG IL IQ IR JO KW LB OM PS QA SA SY TR YE",
    definition: "Western Asia as most English sources use it today, with Egypt and Iran, and without the Caucasus.",
    source: { name: "Encyclopaedia Britannica, Middle East", url: "https://www.britannica.com/place/Middle-East" },
    note: "No definition is agreed: some add Libya, Sudan or Afghanistan; some leave out Cyprus or Turkey. UN M49's Western Asia (145) includes Armenia, Azerbaijan and Georgia and leaves out Egypt and Iran.",
  },
  {
    id: "latin-america",
    en: "Latin America and the Caribbean",
    ja: "ラテンアメリカ・カリブ",
    members: "m49:419",
    definition: "UN M49's Latin America and the Caribbean (419): Central America, the Caribbean and South America.",
    source: { name: "UN Statistics Division, M49", url: "https://unstats.un.org/unsd/methodology/m49/" },
    note: "Latin America in its narrower sense, the countries speaking Spanish, Portuguese or French, leaves out the English- and Dutch-speaking Caribbean.",
  },
  {
    id: "caribbean",
    en: "Caribbean",
    ja: "カリブ",
    members: "m49:029",
    definition: "UN M49's Caribbean (029).",
    source: { name: "UN Statistics Division, M49", url: "https://unstats.un.org/unsd/methodology/m49/" },
    note: "Some definitions add the Caribbean coasts of Central and South America (Belize, Guyana, Suriname), which M49 puts in Central and South America.",
  },
  {
    id: "balkans",
    en: "Balkans",
    ja: "バルカン半島",
    reading: "ばるかんはんとう",
    members: "AL BA BG HR ME MK RO RS SI XK",
    definition: "The countries usually counted as the Balkans.",
    source: { name: "Encyclopaedia Britannica, Balkans", url: "https://www.britannica.com/place/Balkans" },
    note: "Greece and the European part of Turkey are on the peninsula and are sometimes counted; Slovenia and Romania are sometimes not. See also the Western Balkans.",
  },
  {
    id: "western-balkans",
    en: "Western Balkans",
    ja: "西バルカン",
    reading: "にしばるかん",
    members: "AL BA ME MK RS XK",
    definition: "The European Union's usage: the Balkan countries that are not EU members.",
    source: { name: "European Commission, Enlargement", url: "https://enlargement.ec.europa.eu/" },
  },
  {
    id: "scandinavia",
    en: "Scandinavia",
    ja: "スカンジナビア",
    members: "DK NO SE",
    definition: "Scandinavia in its strict sense: Denmark, Norway and Sweden.",
    source: { name: "Encyclopaedia Britannica, Scandinavia", url: "https://www.britannica.com/place/Scandinavia" },
    note: "Often used loosely for the Nordic countries, adding Finland and Iceland, which is a different grouping (see the Nordic countries).",
  },
  {
    id: "nordic-countries",
    en: "Nordic countries",
    ja: "北欧",
    reading: "ほくおう",
    members: "AX DK FI FO GL IS NO SE",
    definition: "The five Nordic states and the three autonomous territories, as Nordic Co-operation counts them.",
    source: { name: "Nordic Co-operation, Facts about the Nordic countries", url: "https://www.norden.org/en/information/facts-about-nordic-countries" },
  },
  {
    id: "baltics",
    en: "Baltic states",
    ja: "バルト三国",
    reading: "ばるとさんごく",
    members: "EE LT LV",
    definition: "Estonia, Latvia and Lithuania.",
    source: { name: "Encyclopaedia Britannica, Baltic states", url: "https://www.britannica.com/place/Baltic-states" },
  },
  {
    id: "central-asia",
    en: "Central Asia",
    ja: "中央アジア",
    reading: "ちゅうおうあじあ",
    members: "m49:143",
    definition: "UN M49's Central Asia (143): the five former Soviet republics.",
    source: { name: "UN Statistics Division, M49", url: "https://unstats.un.org/unsd/methodology/m49/" },
    note: "Wider definitions add Afghanistan, Mongolia or parts of China.",
  },
  {
    id: "southeast-asia",
    en: "Southeast Asia",
    ja: "東南アジア",
    reading: "とうなんあじあ",
    members: "m49:035",
    definition: "UN M49's South-eastern Asia (035), the same countries as ASEAN.",
    source: { name: "UN Statistics Division, M49", url: "https://unstats.un.org/unsd/methodology/m49/" },
  },
  {
    id: "maghreb",
    en: "Maghreb",
    ja: "マグリブ",
    members: "DZ LY MA MR TN",
    definition: "The members of the Arab Maghreb Union.",
    source: { name: "Encyclopaedia Britannica, Maghrib", url: "https://www.britannica.com/place/Maghrib" },
    note: "The Maghreb in its narrow sense is Algeria, Morocco and Tunisia; Western Sahara is sometimes counted.",
  },
  {
    id: "horn-of-africa",
    en: "Horn of Africa",
    ja: "アフリカの角",
    reading: "あふりかのつの",
    members: "DJ ER ET SO",
    definition: "The peninsula's four countries.",
    source: { name: "Encyclopaedia Britannica, Horn of Africa", url: "https://www.britannica.com/place/Horn-of-Africa" },
    note: "Wider uses add Kenya, Sudan, South Sudan and Uganda (the members of IGAD).",
  },
  {
    id: "sahel",
    en: "Sahel",
    ja: "サヘル",
    members: "BF ML MR NE TD",
    definition: "The five countries of the former G5 Sahel.",
    source: { name: "Encyclopaedia Britannica, Sahel", url: "https://www.britannica.com/place/Sahel" },
    note: "The Sahel is a belt of land, not a set of countries: wider uses add Senegal, The Gambia, Nigeria, Cameroon, Sudan and Eritrea, which it also crosses.",
  },
  {
    id: "british-isles",
    en: "British Isles",
    ja: "イギリス諸島",
    reading: "いぎりすしょとう",
    members: "GB GG IE IM JE",
    definition: "The islands of Great Britain and Ireland and the islands near them: the United Kingdom, Ireland, the Isle of Man and the Channel Islands.",
    source: { name: "Encyclopaedia Britannica, British Isles", url: "https://www.britannica.com/place/British-Isles" },
    note: "The name is disliked in Ireland, and the Irish government does not use it.",
  },
  {
    id: "iberia",
    en: "Iberian Peninsula",
    ja: "イベリア半島",
    reading: "いべりあはんとう",
    members: "AD ES GI PT",
    definition: "The countries on the peninsula: Spain, Portugal, Andorra and Gibraltar.",
    source: { name: "Encyclopaedia Britannica, Iberian Peninsula", url: "https://www.britannica.com/place/Iberian-Peninsula" },
  },
  {
    id: "asia-pacific",
    en: "Asia-Pacific",
    ja: "アジア太平洋",
    reading: "あじあたいへいよう",
    members: "m49:142 m49:009",
    definition: "UN M49's Asia (142) and Oceania (009) together.",
    source: { name: "UN Statistics Division, M49", url: "https://unstats.un.org/unsd/methodology/m49/" },
    note: "Uses differ widely: APEC adds the Pacific coast of the Americas, and the UN's ESCAP adds Russia and leaves out western Asia.",
  },
];

const CENSUS = { name: "United States Census Bureau, Census Regions and Divisions", url: "https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf", licence: "Public domain (a work of the United States government)" };
const JP_REGIONS = { name: "The eight regions (八地方区分) taught in Japanese schools", url: "https://ja.wikipedia.org/wiki/日本の地域", licence: "A list of facts, written for kuni (MIT)" };
const CA_REGIONS = { name: "Canada's regions as commonly named", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/prepare-life-canada/provinces-territories.html", licence: "A list of facts, written for kuni (MIT)" };

const SUBDIVISION_GROUPINGS: SubdivisionGroupingConfig[] = [
  // Japan: eight regions, Kyushu with Okinawa; the nine-region variant splits Okinawa off.
  { id: "jp-hokkaido", country: "JP", sets: ["jp-regions-8", "jp-regions-9"], en: "Hokkaido region", ja: "北海道地方", reading: "ほっかいどうちほう", members: "01", definition: "The prefecture of Hokkaido.", source: JP_REGIONS },
  { id: "jp-tohoku", country: "JP", sets: ["jp-regions-8", "jp-regions-9"], en: "Tohoku region", ja: "東北地方", reading: "とうほくちほう", members: "02 03 04 05 06 07", definition: "Aomori, Iwate, Miyagi, Akita, Yamagata and Fukushima.", source: JP_REGIONS },
  { id: "jp-kanto", country: "JP", sets: ["jp-regions-8", "jp-regions-9"], en: "Kanto region", ja: "関東地方", reading: "かんとうちほう", members: "08 09 10 11 12 13 14", definition: "Ibaraki, Tochigi, Gunma, Saitama, Chiba, Tokyo and Kanagawa.", source: JP_REGIONS },
  { id: "jp-chubu", country: "JP", sets: ["jp-regions-8", "jp-regions-9"], en: "Chubu region", ja: "中部地方", reading: "ちゅうぶちほう", members: "15 16 17 18 19 20 21 22 23", definition: "Niigata, Toyama, Ishikawa, Fukui, Yamanashi, Nagano, Gifu, Shizuoka and Aichi.", source: JP_REGIONS },
  { id: "jp-kinki", country: "JP", sets: ["jp-regions-8", "jp-regions-9"], en: "Kinki region", ja: "近畿地方", reading: "きんきちほう", members: "24 25 26 27 28 29 30", definition: "Mie, Shiga, Kyoto, Osaka, Hyogo, Nara and Wakayama; also called Kansai.", source: JP_REGIONS },
  { id: "jp-chugoku", country: "JP", sets: ["jp-regions-8", "jp-regions-9"], en: "Chugoku region", ja: "中国地方", reading: "ちゅうごくちほう", members: "31 32 33 34 35", definition: "Tottori, Shimane, Okayama, Hiroshima and Yamaguchi.", source: JP_REGIONS },
  { id: "jp-shikoku", country: "JP", sets: ["jp-regions-8", "jp-regions-9"], en: "Shikoku region", ja: "四国地方", reading: "しこくちほう", members: "36 37 38 39", definition: "Tokushima, Kagawa, Ehime and Kochi.", source: JP_REGIONS },
  { id: "jp-kyushu", country: "JP", sets: ["jp-regions-8"], en: "Kyushu region", ja: "九州地方", reading: "きゅうしゅうちほう", members: "40 41 42 43 44 45 46 47", definition: "Fukuoka, Saga, Nagasaki, Kumamoto, Oita, Miyazaki, Kagoshima and Okinawa, as the eight-region division counts it.", source: JP_REGIONS },
  { id: "jp-kyushu-without-okinawa", country: "JP", sets: ["jp-regions-9"], en: "Kyushu region (without Okinawa)", ja: "九州地方（沖縄を除く）", reading: "きゅうしゅうちほう", members: "40 41 42 43 44 45 46", definition: "Kyushu's seven prefectures, where Okinawa is counted as a region of its own.", source: JP_REGIONS },
  { id: "jp-okinawa", country: "JP", sets: ["jp-regions-9"], en: "Okinawa region", ja: "沖縄地方", reading: "おきなわちほう", members: "47", definition: "Okinawa, where it is counted apart from Kyushu (as in weather forecasts).", source: JP_REGIONS },
  // The United States: four Census regions and nine divisions.
  { id: "us-northeast", country: "US", sets: ["us-census-regions"], en: "Northeast", ja: "北東部", reading: "ほくとうぶ", members: "CT MA ME NH NJ NY PA RI VT", definition: "Census Region 1.", source: CENSUS },
  { id: "us-midwest", country: "US", sets: ["us-census-regions"], en: "Midwest", ja: "中西部", reading: "ちゅうせいぶ", members: "IA IL IN KS MI MN MO ND NE OH SD WI", definition: "Census Region 2.", source: CENSUS },
  { id: "us-south", country: "US", sets: ["us-census-regions"], en: "South", ja: "南部", reading: "なんぶ", members: "AL AR DC DE FL GA KY LA MD MS NC OK SC TN TX VA WV", definition: "Census Region 3.", source: CENSUS },
  { id: "us-west", country: "US", sets: ["us-census-regions"], en: "West", ja: "西部", reading: "せいぶ", members: "AK AZ CA CO HI ID MT NM NV OR UT WA WY", definition: "Census Region 4.", source: CENSUS },
  { id: "us-new-england", country: "US", sets: ["us-census-divisions"], en: "New England", ja: "ニューイングランド", members: "CT MA ME NH RI VT", definition: "Census Division 1, in the Northeast.", source: CENSUS },
  { id: "us-middle-atlantic", country: "US", sets: ["us-census-divisions"], en: "Middle Atlantic", ja: "中部大西洋岸", reading: "ちゅうぶたいせいようがん", members: "NJ NY PA", definition: "Census Division 2, in the Northeast.", source: CENSUS },
  { id: "us-east-north-central", country: "US", sets: ["us-census-divisions"], en: "East North Central", ja: "東北中部", reading: "とうほくちゅうぶ", members: "IL IN MI OH WI", definition: "Census Division 3, in the Midwest.", source: CENSUS },
  { id: "us-west-north-central", country: "US", sets: ["us-census-divisions"], en: "West North Central", ja: "西北中部", reading: "せいほくちゅうぶ", members: "IA KS MN MO ND NE SD", definition: "Census Division 4, in the Midwest.", source: CENSUS },
  { id: "us-south-atlantic", country: "US", sets: ["us-census-divisions"], en: "South Atlantic", ja: "南部大西洋岸", reading: "なんぶたいせいようがん", members: "DC DE FL GA MD NC SC VA WV", definition: "Census Division 5, in the South.", source: CENSUS },
  { id: "us-east-south-central", country: "US", sets: ["us-census-divisions"], en: "East South Central", ja: "東南中部", reading: "とうなんちゅうぶ", members: "AL KY MS TN", definition: "Census Division 6, in the South.", source: CENSUS },
  { id: "us-west-south-central", country: "US", sets: ["us-census-divisions"], en: "West South Central", ja: "西南中部", reading: "せいなんちゅうぶ", members: "AR LA OK TX", definition: "Census Division 7, in the South.", source: CENSUS },
  { id: "us-mountain", country: "US", sets: ["us-census-divisions"], en: "Mountain", ja: "山岳部", reading: "さんがくぶ", members: "AZ CO ID MT NM NV UT WY", definition: "Census Division 8, in the West.", source: CENSUS },
  { id: "us-pacific", country: "US", sets: ["us-census-divisions"], en: "Pacific", ja: "太平洋岸", reading: "たいへいようがん", members: "AK CA HI OR WA", definition: "Census Division 9, in the West.", source: CENSUS },
  // Canada: five regions as they are commonly named.
  { id: "ca-atlantic", country: "CA", sets: ["ca-regions"], en: "Atlantic Canada", ja: "大西洋岸カナダ", reading: "たいせいようがんかなだ", members: "NB NL NS PE", definition: "The four Atlantic provinces.", source: CA_REGIONS },
  { id: "ca-central", country: "CA", sets: ["ca-regions"], en: "Central Canada", ja: "中部カナダ", reading: "ちゅうぶかなだ", members: "ON QC", definition: "Ontario and Quebec.", source: CA_REGIONS },
  { id: "ca-prairies", country: "CA", sets: ["ca-regions"], en: "Prairie Provinces", ja: "プレーリー諸州", reading: "ぷれーりーしょしゅう", members: "AB MB SK", definition: "Alberta, Saskatchewan and Manitoba.", source: CA_REGIONS },
  { id: "ca-west-coast", country: "CA", sets: ["ca-regions"], en: "West Coast", ja: "西海岸", reading: "にしかいがん", members: "BC", definition: "British Columbia.", source: CA_REGIONS },
  { id: "ca-north", country: "CA", sets: ["ca-regions"], en: "Northern Canada", ja: "北部カナダ", reading: "ほくぶかなだ", members: "NT NU YT", definition: "The three territories.", source: CA_REGIONS },
  // The United Kingdom's four countries, and Australia's states and territories.
  { id: "gb-nations", country: "GB", sets: ["gb-nations"], en: "The four nations of the United Kingdom", ja: "イギリスの4つの国", reading: "いぎりすのよっつのくに", members: "ENG NIR SCT WLS", definition: "England, Northern Ireland, Scotland and Wales, the first level of ISO 3166-2:GB.", source: { name: "ISO 3166-2:GB, as Unicode CLDR 48.2 lists it", url: "https://www.iso.org/obp/ui/#iso:code:3166:GB", licence: "Unicode-3.0 (CLDR)" } },
  { id: "au-states", country: "AU", sets: ["au-states-territories"], en: "States of Australia", ja: "オーストラリアの州", reading: "おーすとらりあのしゅう", members: "NSW QLD SA TAS VIC WA", definition: "The six states.", source: { name: "Australian Government, States and territories", url: "https://info.australia.gov.au/about-australia/our-country/states-and-territories", licence: "A list of facts, written for kuni (MIT)" } },
  { id: "au-territories", country: "AU", sets: ["au-states-territories"], en: "Mainland territories of Australia", ja: "オーストラリアの準州", reading: "おーすとらりあのじゅんしゅう", members: "ACT NT", definition: "The Australian Capital Territory and the Northern Territory; the external territories (Christmas Island, the Cocos Islands, Norfolk Island and others) have codes of their own as countries.", source: { name: "Australian Government, States and territories", url: "https://info.australia.gov.au/about-australia/our-country/states-and-territories", licence: "A list of facts, written for kuni (MIT)" } },
];

// The continents: the seven-continent model of the `continent` field (countries-list), named from CLDR, with the
// readings of the names written with kanji.
const CONTINENT_READINGS: Record<string, string> = { AN: "なんきょく", NA: "きたあめりかたいりく", SA: "みなみあめりか" };

// The readings of CLDR's Japanese names of the UN M49 areas that are written with kanji.
const M49_READINGS: Record<string, string> = {
  "003": "きたあめりかたいりく",
  "005": "みなみあめりか",
  "011": "にしあふりか",
  "013": "ちゅうおうあめりか",
  "014": "ひがしあふりか",
  "015": "きたあふりか",
  "017": "ちゅうぶあふりか",
  "018": "なんぶあふりか",
  "019": "あめりかたいりく",
  "021": "きたあめりか",
  "030": "ひがしあじあ",
  "034": "みなみあじあ",
  "035": "とうなんあじあ",
  "039": "みなみよーろっぱ",
  "143": "ちゅうおうあじあ",
  "145": "にしあじあ",
  "151": "ひがしよーろっぱ",
  "154": "きたよーろっぱ",
  "155": "にしよーろっぱ",
};

export { AS_OF, CONTINENT_READINGS, M49_READINGS, INFORMAL, MEMBERSHIPS, MEMBERSHIPS_LEFT_OUT, SUBDIVISION_GROUPINGS };
export type { InformalConfig, MembershipConfig, Status, SubdivisionGroupingConfig };
