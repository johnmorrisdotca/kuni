// What scripts/withdrawn.ts needs, beyond Wikidata's snapshot (data-sources/wikidata-codes-<day>.json), to make the
// withdrawn countries of the /withdrawn entry and the IOC codes of the main entry: the few choices written by hand,
// each with its reason. Everything here is MIT, written for kuni, from the list ISO 3166-3 publishes (a list of facts)
// where Wikidata has a gap. Every Japanese string in this file is hand-written and listed for review by a native
// reader of Japanese.
//
// The rules the build applies to the snapshot before any of these, so that a reader knows what the lists below are
// exceptions to:
//
//   - A record is one ISO 3166-3 code (P773): four letters, the first two of which are the alpha-2 code that was
//     withdrawn, as ISO 3166-3 itself defines them. Where Wikidata has two items for one code (the Socialist Federal
//     Republic and the Federal Republic of Yugoslavia, YUCS), they are one record.
//   - The alpha-2 code is the first two letters of the four. Where Wikidata has an alpha-2 statement that ended or
//     is deprecated, it must say the same, or the build stops.
//   - An alpha-3 or numeric code is kept when Wikidata's statement for it has ended, is deprecated, or belongs to an
//     item that was dissolved; a code the successor still uses (Timor-Leste's 626) is not a withdrawn code.
//   - `since` and `until` are the start and end Wikidata gives the alpha-2 statement. Wikidata gives them as the
//     first of January, a year; they are kept as the year ("1974"), and a date that is not the first of January in
//     full ("1990-08-14"). Where the statement has no start, ISO 3166-1 began in 1974 (FIRST_YEAR), or the item
//     began later; where it has no end, the item's dissolution date (P576) is used, or UNTIL_FILLS.
//   - A successor is a current country holding the alpha-2 code of an item that Wikidata says replaced (P1366) or
//     followed (P156) the withdrawn one. SUCCESSOR_FILLS adds the ones Wikidata does not give.

/** ISO 3166-1 was first published in 1974: a withdrawn code with no start was in the first edition. */
const FIRST_YEAR = "1974";

/** The IOC code to use where Wikidata gives a country two (the other is a former one). */
const IOC_CHOICES: Record<string, { ioc: string; why: string }> = {
  ES: { ioc: "ESP", why: "Wikidata also lists SPA, the code Spain's Olympic committee used until 1992; ESP is the one in use." },
};

/** The IOC code of a country whose Wikidata item with the alpha-2 code does not hold it. */
const IOC_FILLS: Record<string, { ioc: string; why: string }> = {
  NL: { ioc: "NED", why: "Wikidata holds NL on the Kingdom of the Netherlands (Q29999) and the IOC code NED on the Netherlands (Q55), the country that competes." },
};

/** Names for a record, where the item's own label does not fit the four-letter code. */
const NAME_FILLS: Record<string, { en?: string; ja?: string; why: string }> = {
  YUCS: { en: "Yugoslavia", ja: "ユーゴスラビア", why: "Two Wikidata items share the code (the Socialist Federal Republic, 1945 to 1992, and the Federal Republic, 1992 to 2003); ISO 3166-3's entry is just Yugoslavia." },
  BUMM: { en: "Burma", ja: "ビルマ", why: "Wikidata's item is today's Myanmar, which holds the code MM; the withdrawn code BU named the country Burma." },
  TPTL: { en: "East Timor", ja: "東ティモール", why: "Wikidata's item is today's Timor-Leste, which holds the code TL; the withdrawn code TP named the country East Timor." },
  FXFR: { en: "Metropolitan France", why: "Wikidata's label is in lower case." },
  DYBJ: { ja: "ダホメ共和国", why: "Wikidata's label has a bracket telling it from a place of the same name; kuni takes such brackets off, as it does CLDR's (docs/name-rules.md)." },
};

/** The alpha-3 and numeric codes of the withdrawn countries Wikidata has no code statements for (ISO 3166-3's list). */
const CODE_FILLS: Record<string, { alpha3?: string; numeric?: string; why: string }> = {
  NTHH: { alpha3: "NTZ", numeric: "536", why: "ISO 3166-3: the Neutral Zone's alpha-3 and numeric codes." },
  PUUM: { alpha3: "PUS", numeric: "849", why: "ISO 3166-3: US Miscellaneous Pacific Islands." },
  PZPA: { alpha3: "PCZ", numeric: "594", why: "ISO 3166-3: the Panama Canal Zone." },
  RHZW: { alpha3: "RHO", why: "ISO 3166-3: Southern Rhodesia has an alpha-3 code and no numeric one." },
  SKIN: { alpha3: "SKM", why: "ISO 3166-3: Sikkim has an alpha-3 code and no numeric one." },
  VDVN: { alpha3: "VDR", why: "ISO 3166-3: North Vietnam has an alpha-3 code and no numeric one." },
  WKUM: { alpha3: "WAK", numeric: "872", why: "ISO 3166-3: Wake Island." },
  ZRCD: { alpha3: "ZAR", numeric: "180", why: "ISO 3166-3: Zaire's alpha-3 code and its numeric code, 180, which the Democratic Republic of the Congo still uses." },
};

/** The years a withdrawn code was in force, where Wikidata's statements for it give none. [since, until] */
const PERIOD_FILLS: Record<string, { since?: string; until?: string; why: string }> = {
  NTHH: { until: "1993", why: "ISO 3166-3: the Saudi-Iraqi Neutral Zone's code was withdrawn in 1993; Wikidata dates the zone's end to 1991." },
  PUUM: { until: "1986", why: "ISO 3166-3: the code went when the US Minor Outlying Islands (UM) were given one code in 1986." },
  WKUM: { until: "1986", why: "ISO 3166-3: the code went when the US Minor Outlying Islands (UM) were given one code in 1986." },
};

/** Current countries a withdrawn country led to, which Wikidata does not say (it names an item without a code, or none). */
const SUCCESSOR_FILLS: Record<string, { codes: string[]; why: string }> = {
  BQAQ: { codes: ["AQ"], why: "The British Antarctic Territory is a claim on Antarctica, AQ." },
  CSHH: { codes: ["CZ", "SK"], why: "Czechoslovakia divided into Czechia and Slovakia on 1 January 1993." },
  CTKI: { codes: ["KI"], why: "The Canton and Enderbury Islands are part of Kiribati." },
  DYBJ: { codes: ["BJ"], why: "Dahomey was renamed Benin in 1975." },
  FQHH: { codes: ["TF"], why: "The French Southern and Antarctic Territories are TF today." },
  FXFR: { codes: ["FR"], why: "Metropolitan France is part of France." },
  GEHH: { codes: ["KI", "TV"], why: "The Gilbert and Ellice Islands became Kiribati and Tuvalu." },
  JTUM: { codes: ["UM"], why: "Johnston Atoll is one of the United States Minor Outlying Islands." },
  MIUM: { codes: ["UM"], why: "Midway Atoll is one of the United States Minor Outlying Islands." },
  NQAQ: { codes: ["AQ"], why: "Queen Maud Land is a claim on Antarctica, AQ." },
  NTHH: { codes: ["IQ", "SA"], why: "The Neutral Zone was divided between Saudi Arabia and Iraq." },
  PCHH: { codes: ["FM", "MH", "MP", "PW"], why: "The Trust Territory of the Pacific Islands became the Federated States of Micronesia, the Marshall Islands, the Northern Mariana Islands and Palau." },
  PUUM: { codes: ["UM"], why: "The islands became the United States Minor Outlying Islands." },
  PZPA: { codes: ["PA"], why: "The Canal Zone was returned to Panama." },
  SKIN: { codes: ["IN"], why: "Sikkim joined India in 1975." },
  TPTL: { codes: ["TL"], why: "Portuguese Timor's code TP became TL when East Timor became independent." },
  BUMM: { codes: ["MM"], why: "Burma was renamed Myanmar; its code BU became MM." },
  VDVN: { codes: ["VN"], why: "North Vietnam united with the south as Vietnam in 1976." },
  WKUM: { codes: ["UM"], why: "Wake Island is one of the United States Minor Outlying Islands." },
  YUCS: { codes: ["ME", "RS"], why: "The Federal Republic of Yugoslavia became Serbia and Montenegro, then these two; Wikidata gives the Socialist Federal Republic's four but not these." },
};

export { CODE_FILLS, FIRST_YEAR, IOC_CHOICES, IOC_FILLS, NAME_FILLS, PERIOD_FILLS, SUCCESSOR_FILLS };
