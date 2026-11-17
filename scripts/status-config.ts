// What scripts/status.ts needs, beyond its sources, to say what each holder of a country code is (a member of the
// United Nations, an observer there, a territory of another state, and so on) and whose it is: the few choices
// written by hand, each with its reason. Everything here is MIT, written for kuni.
//
// The rules scripts/status.ts applies before any of these, so that a reader knows what the lists below are
// exceptions to:
//
//   - A member of the United Nations is one of the 193 codes of CLDR's "UN" grouping: "un-member".
//   - An observer is one of UN_OBSERVERS, the United Nations' own list of non-member observer states: "un-observer".
//   - Everything else is read from the code's Wikidata item (data-sources/wikidata-status-<day>.json). Its
//     sovereign is the country it is in (P17, statements that have not ended, the item itself left out), as the
//     alpha-2 code that country holds, when that code is a member of the United Nations. A country item that
//     holds no code is read through SOVEREIGN_ITEMS, or else left out. Where two states remain, the statements
//     of preferred rank decide; where they do not, the build stops.
//   - With a sovereign it is a "special-region" when it is an instance (P31) of SPECIAL_REGION_CLASS,
//     "uninhabited" when /facts gives it no population or a population of 0, or when NO_PERMANENT_RESIDENTS says
//     so with its source, and a "territory" otherwise.
//   - With no sovereign it is "uninhabited" by the same test, and otherwise must be listed in NO_SOVEREIGN, which
//     says whether it is "disputed" and why. The build stops on one that is not listed.
//   - Its type is the first class of TYPE_CLASSES the item is an instance of (statements that have not ended), in
//     Wikidata's English and Japanese labels but for the few reworded here. Members and observers of the United
//     Nations get none: their status says what they are. One with no such class must be listed in TYPE_GAPS.

type Status = "un-member" | "un-observer" | "territory" | "special-region" | "disputed" | "uninhabited";

// The United Nations' non-member observer states. Its page lists the two under "Non-Member States having received
// a standing invitation to participate as Observers in the sessions and the work of the General Assembly and
// maintaining Permanent Observer Missions at Headquarters": the Holy See and the State of Palestine.
const UN_OBSERVERS: { codes: Record<string, string>; url: string; read: string } = {
  codes: { PS: "State of Palestine", VA: "Holy See" },
  url: "https://www.un.org/en/about-us/non-member-states",
  read: "2026-11-17",
};

// Country items (P17) that hold no alpha-2 code of their own: the code of the state they are.
const SOVEREIGN_ITEMS: Record<string, { code: string; why: string }> = {
  Q756617: { code: "DK", why: "The Kingdom of Denmark (the Danish Realm), the state whose ISO 3166-1 code is DK; Wikidata keeps the code on Denmark (Q35)." },
};

// An instance of this class with a sovereign is a "special-region".
const SPECIAL_REGION_CLASS = "Q779415"; // special administrative region of China

// Places with a sovereign where Wikidata's population counts staff and not residents, each with the words of the
// source that says nobody lives there for good.
const NO_PERMANENT_RESIDENTS: Record<string, { quote: string; url: string; read: string }> = {
  GS: {
    quote: "There are no permanent residents in the Territory but the British Antarctic Survey (BAS) operates two bases on South Georgia.",
    url: "https://gov.gs/about-sgssi/",
    read: "2026-11-17",
  },
};

// The codes that are neither a member nor an observer of the United Nations and are in no other state by
// Wikidata's P17. `status` is what they are given, `why` what the snapshot says.
const NO_SOVEREIGN: Record<string, { status: "disputed" | "territory"; why: string }> = {
  EH: {
    status: "disputed",
    why: "Western Sahara: Wikidata calls it a disputed territory (P31, preferred rank) on the United Nations list of non-self-governing territories, and records two claimants (P1336), Morocco and the Sahrawi Arab Democratic Republic. No sovereign is given.",
  },
  TW: {
    status: "disputed",
    why: "Taiwan keeps the name it already has. It is neither a member nor an observer of the United Nations, and no sovereign is given. No type is added.",
  },
  XK: {
    status: "disputed",
    why: "Kosovo keeps the name it already has. It is neither a member nor an observer of the United Nations, its code is user-assigned, and no sovereign is given. No type is added.",
  },
};

// Niue is self-governing in free association with New Zealand. The Cook Islands already take New Zealand from Wikidata.
const FREE_ASSOCIATION: Record<string, { sovereign: string; en: string; ja: string; why: string }> = {
  NU: {
    sovereign: "NZ",
    en: "in free association with New Zealand",
    ja: "ニュージーランドとの自由連合",
    why: "Niue is in free association with New Zealand. Wikidata names no other state for it.",
  },
};

// No type is written for these. Their names stay as they are.
const NO_TYPE = new Set(["TW", "XK"]);

// The classes a type is read from, the most particular first. `en` rewords Wikidata's English label and `ja` its
// Japanese one (null: the label is not kept), each with the reason.
const TYPE_CLASSES: { item: string; en?: string; ja?: string | null; why?: string }[] = [
  { item: "Q46395", en: "British Overseas Territory", why: "Wikidata labels the class in the plural, British Overseas Territories." },
  { item: "Q185086", en: "Crown Dependency", why: "Wikidata labels the class in the plural, Crown Dependencies." },
  { item: "Q783733" }, // unincorporated territory of the United States
  { item: "Q15304003", en: "constituent country of the Kingdom of the Netherlands", why: "Wikidata's label, country of the Kingdom of the Netherlands, reads as any country in it; constituent country is the usual English term." },
  { item: "Q66724388" }, // autonomous country within the Kingdom of Denmark
  { item: "Q779415" }, // special administrative region of China
  { item: "Q202216" }, // overseas department and region of France
  { item: "Q719487" }, // overseas collectivity of France
  { item: "Q11687019" }, // external territory of Australia
  { item: "Q5260616", ja: null, why: "Wikidata's Japanese label, ノルウェーの南極領, says Norway's Antarctic territory, which Bouvet Island is not." },
  { item: "Q1138279" }, // associated state
  { item: "Q782614" }, // autonomous region
  { item: "Q10711424" }, // state with limited recognition
  { item: "Q15239622" }, // disputed territory
  { item: "Q161243" }, // dependent territory
  { item: "Q462778" }, // insular area of the United States
  { item: "Q15042037" }, // statistical territorial entity
];

// The codes that get no type, because their item is an instance of nothing in TYPE_CLASSES.
const TYPE_GAPS: Record<string, string> = {
  AQ: "Antarctica: Wikidata's item is the continent, and no class of TYPE_CLASSES fits a continent.",
  BQ: "The Caribbean Netherlands: Wikidata's item says only that it is an island group and an administrative entity. Its three islands are special municipalities of the Netherlands, which the item for the three together does not say.",
};

export { FREE_ASSOCIATION, NO_PERMANENT_RESIDENTS, NO_SOVEREIGN, NO_TYPE, SOVEREIGN_ITEMS, SPECIAL_REGION_CLASS, TYPE_CLASSES, TYPE_GAPS, UN_OBSERVERS };
export type { Status };
