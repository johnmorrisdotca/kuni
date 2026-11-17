// What scripts/reserved.ts needs, beyond its sources, to make the /reserved entry: the places that have a code or
// a flag in common use and are no country of ISO 3166-1. Everything here is MIT, written for kuni.
//
// The rules scripts/reserved.ts applies, so that a reader knows what the lists below are for:
//
//   - An "iso-reserved" place is a two-letter region subtag of IANA's Language Subtag Registry that is not
//     deprecated, is none of kuni's 250 country codes and is not a body kept in /groupings (ORGANISATIONS). RFC 5646,
//     section 2.2.4, says where such subtags come from: "the codes that are 'exceptionally reserved' (as opposed to
//     'assigned') in ISO 3166-1 were also defined in the registry". The build stops when the registry has one
//     that RESERVED_ITEMS does not name, or lacks one it names.
//   - A "user-assigned" place is one of USER_ASSIGNED: a code from ISO 3166-1's user-assigned range (AA, QM to QZ,
//     XA to XZ, ZZ) that a published flag set uses for the place, with the set named. ISO assigns these to nobody.
//   - A "de-facto" place is one of DE_FACTO: it has no code. The build stops unless Wikidata calls its item one of
//     DE_FACTO_CLASSES.
//   - Names are CLDR's for a code CLDR names, and otherwise the labels of the Wikidata item; a place with no
//     Japanese label has none.
//   - The parent is the member of the United Nations the item is in (P17, statements that have not ended, the item
//     itself left out; a country item with no code is read through PARENT_ITEMS), or else the one member Wikidata
//     records as claiming it (P1336). Where it names none, there is none. For a user-assigned or de-facto place
//     this is what Wikidata records, and says nothing about who governs it.
//   - The status of an iso-reserved place is "territory", or "uninhabited" where Wikidata's latest population is 0;
//     a user-assigned or de-facto place is "disputed".
//   - The subdivisions are the ISO 3166-2 codes kuni has for the same place: those Wikidata's item holds (P300),
//     the one CLDR retires in favour of the code (subdivisionAlias), and the one subdivision CLDR names exactly as
//     it names the code.
//   - `until` is the year Wikidata says the place was dissolved (P576).

// The registry's region subtags that are bodies, not places: kuni keeps them in /groupings.
const ORGANISATIONS: Record<string, string> = {
  EU: "The European Union, the grouping `eu`.",
  EZ: "The euro area, the grouping `eurozone`.",
  UN: "The United Nations, the grouping `un`.",
};

// The Wikidata items of the iso-reserved places, by code. Two items where the code covers two places.
const RESERVED_ITEMS: Record<string, { id: string; items: string[] }> = {
  AC: { id: "ascension-island", items: ["Q46197"] },
  CP: { id: "clipperton-island", items: ["Q161258"] },
  CQ: { id: "sark", items: ["Q3405693"] },
  DG: { id: "diego-garcia", items: ["Q184851"] },
  EA: { id: "ceuta-and-melilla", items: ["Q5823", "Q5831"] },
  IC: { id: "canary-islands", items: ["Q5813"] },
  TA: { id: "tristan-da-cunha", items: ["Q220982"] },
};

// Codes of the user-assigned range in use for a place, each with the flag set that uses it.
const USER_ASSIGNED_SOURCE = {
  name: "country-flag-icons 1.6.20 (MIT), its README",
  url: "https://unpkg.com/country-flag-icons@1.6.20/README.md",
  read: "2026-11-17",
};
const USER_ASSIGNED: Record<string, { id: string; item: string; words: string }> = {
  XA: { id: "abkhazia", item: "Q31354462", words: "`XA` — Abkhazia" },
  XC: { id: "northern-cyprus", item: "Q23681", words: "`XC` — Northern Cyprus" },
  XO: { id: "south-ossetia", item: "Q23427", words: "`XO` — South Ossetia" },
};

// The places with no code, by the id kuni gives them.
const DE_FACTO: Record<string, { item: string }> = {
  artsakh: { item: "Q244165" },
  "sahrawi-republic": { item: "Q40362" },
  somaliland: { item: "Q34754" },
  transnistria: { item: "Q907112" },
};

// A de-facto or user-assigned place's item must be an instance (P31) of one of these.
const DE_FACTO_CLASSES: Record<string, string> = {
  Q10711424: "state with limited recognition",
  Q1179466: "de facto regime",
};

// Country items (P17) that hold no alpha-2 code of their own: the code of the state they are.
const PARENT_ITEMS: Record<string, { code: string; why: string }> = {
  Q124653007: { code: "GB", why: "The realm of the United Kingdom: the United Kingdom with its Crown Dependencies and overseas territories, the state whose ISO 3166-1 code is GB." },
};

export { DE_FACTO, DE_FACTO_CLASSES, ORGANISATIONS, PARENT_ITEMS, RESERVED_ITEMS, USER_ASSIGNED, USER_ASSIGNED_SOURCE };
