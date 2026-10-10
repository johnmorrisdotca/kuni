// What scripts/withdrawn.ts needs, beyond Wikidata's snapshot (data-sources/wikidata-codes-<day>.json), to make the
// withdrawn countries of the /withdrawn entry and the IOC codes of the main entry. Written for kuni, from the list ISO 3166-3
// publishes (a list of facts), each choice with its reason. Every Japanese string in this file is hand-written and listed for
// review by a native reader of Japanese.
//
// ISO 3166-3 is the authority for a withdrawn country's codes, years and successors, and WITHDRAWN_TABLE below is that list
// transcribed, once, as ISO's Online Browsing Platform (https://www.iso.org/obp/ui/#iso:code:3166:3) and the published
// ISO 3166-3 list give it: the four-letter code (whose first two letters are the alpha-2 code that was withdrawn), the
// alpha-3 and numeric codes it held (none where it held none), the year its code came into force and the year it was
// withdrawn, and the new codes ISO lists for it. Wikidata is used for the names in English and Japanese only, and the build
// stops where one of its alpha-2 statements for a withdrawn code disagrees with the four letters.
//
//   - A successor is exactly ISO's new code. It may itself be withdrawn: Yugoslavia (YUCS) is replaced by "CS", which
//     is Serbia and Montenegro (CSXX) and, before it, Czechoslovakia (CSHH); `withdrawn("CS")` answers CSXX first (the one
//     withdrawn last), and docs/withdrawn.md says so.
//   - `since` and `until` are years.

/** One ISO 3166-3 entry: what the withdrawn country's codes were, when, and what ISO says replaced it. */
export interface WithdrawnEntry {
  /** The alpha-3 code it held. */
  alpha3: string;
  /** The numeric code it held, `null` where ISO lists none. */
  numeric: string | null;
  since: string;
  until: string;
  /** ISO's new codes, which may themselves be withdrawn codes. */
  successors: string[];
}

/** ISO 3166-3, in order of the four-letter code. Pinned whole by withdrawn.test.ts, so a rebuild cannot drift from it. */
const WITHDRAWN_TABLE: Record<string, WithdrawnEntry> = {
  AIDJ: { alpha3: "AFI", numeric: "262", since: "1974", until: "1977", successors: ["DJ"] },
  ANHH: { alpha3: "ANT", numeric: "530", since: "1974", until: "2010", successors: ["BQ", "CW", "SX"] },
  BQAQ: { alpha3: "ATB", numeric: null, since: "1974", until: "1979", successors: ["AQ"] },
  BUMM: { alpha3: "BUR", numeric: "104", since: "1974", until: "1989", successors: ["MM"] },
  BYAA: { alpha3: "BYS", numeric: "112", since: "1974", until: "1992", successors: ["BY"] },
  CSHH: { alpha3: "CSK", numeric: "200", since: "1974", until: "1993", successors: ["CZ", "SK"] },
  CSXX: { alpha3: "SCG", numeric: "891", since: "2003", until: "2006", successors: ["ME", "RS"] },
  CTKI: { alpha3: "CTE", numeric: "128", since: "1974", until: "1984", successors: ["KI"] },
  DDDE: { alpha3: "DDR", numeric: "278", since: "1974", until: "1990", successors: ["DE"] },
  DYBJ: { alpha3: "DHY", numeric: "204", since: "1974", until: "1977", successors: ["BJ"] },
  FQHH: { alpha3: "ATF", numeric: null, since: "1974", until: "1979", successors: ["AQ", "TF"] },
  FXFR: { alpha3: "FXX", numeric: "249", since: "1993", until: "1997", successors: ["FR"] },
  GEHH: { alpha3: "GEL", numeric: null, since: "1974", until: "1979", successors: ["KI"] },
  HVBF: { alpha3: "HVO", numeric: "854", since: "1974", until: "1984", successors: ["BF"] },
  JTUM: { alpha3: "JTN", numeric: "396", since: "1974", until: "1986", successors: ["UM"] },
  MIUM: { alpha3: "MID", numeric: "488", since: "1974", until: "1986", successors: ["UM"] },
  NHVU: { alpha3: "NHB", numeric: null, since: "1974", until: "1980", successors: ["VU"] },
  NQAQ: { alpha3: "ATN", numeric: "216", since: "1974", until: "1983", successors: ["AQ"] },
  NTHH: { alpha3: "NTZ", numeric: "536", since: "1974", until: "1993", successors: ["IQ", "SA"] },
  PCHH: { alpha3: "PCI", numeric: "582", since: "1974", until: "1986", successors: ["FM", "MH", "MP", "PW"] },
  PUUM: { alpha3: "PUS", numeric: "849", since: "1974", until: "1986", successors: ["UM"] },
  PZPA: { alpha3: "PCZ", numeric: null, since: "1974", until: "1980", successors: ["PA"] },
  RHZW: { alpha3: "RHO", numeric: null, since: "1974", until: "1980", successors: ["ZW"] },
  SKIN: { alpha3: "SKM", numeric: null, since: "1974", until: "1975", successors: ["IN"] },
  SUHH: { alpha3: "SUN", numeric: "810", since: "1974", until: "1992", successors: ["AM", "AZ", "EE", "GE", "KZ", "KG", "LV", "LT", "MD", "RU", "TJ", "TM", "UZ"] },
  TPTL: { alpha3: "TMP", numeric: "626", since: "1974", until: "2002", successors: ["TL"] },
  VDVN: { alpha3: "VDR", numeric: null, since: "1974", until: "1977", successors: ["VN"] },
  WKUM: { alpha3: "WAK", numeric: "872", since: "1974", until: "1986", successors: ["UM"] },
  YDYE: { alpha3: "YMD", numeric: "720", since: "1974", until: "1990", successors: ["YE"] },
  YUCS: { alpha3: "YUG", numeric: "891", since: "1974", until: "2003", successors: ["CS"] },
  ZRCD: { alpha3: "ZAR", numeric: "180", since: "1974", until: "1997", successors: ["CD"] },
};

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

export { IOC_CHOICES, IOC_FILLS, NAME_FILLS, WITHDRAWN_TABLE };
