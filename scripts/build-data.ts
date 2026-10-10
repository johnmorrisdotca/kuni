// Builds src/data/ from the inputs in data-sources/ and node_modules/, with no network:
//
//   - Unicode CLDR 48.2 (Unicode-3.0): country names in English and Japanese with their short and variant
//     forms (cldr-localenames-full), alpha-3 and numeric codes, currencies, UN M49 regions and the
//     subdivision tree (cldr-core), and subdivision names and validity (the XML in data-sources/cldr/);
//   - Wikidata (CC0), a snapshot in data-sources/: Japanese names where CLDR has none, the kana readings of
//     Japan's prefectures and of kanji country names, calling codes, and what kind of place each is;
//   - countries-list (MIT): each country's own name, capital and languages;
//   - IANA: time zones (zone.tab) and top-level domains.
//
//   pnpm data            write src/data/, src/subdivisions/ and docs/disagreements.md
//   pnpm data:report     print the coverage and write docs/ja-gaps.md (add --accept to take the current
//                        Japanese gaps as data-sources/expected-ja-gaps.json, which the tests hold the data to)
//
// Running it twice leaves the tree as it was: nothing it writes depends on the day it runs.

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { CONTINENTS, SUBDIVISION_TYPES } from "../src/types.ts";
import {
  CODE_CHANGES,
  COUNTRY_ALIASES,
  EN_NAME_ACCEPTED,
  EN_NAME_OVERRIDES,
  JA_BRACKET_COUNTRY_NAMES,
  JA_BRACKET_WORDS,
  JA_NAME_OVERRIDES,
  JA_OPEN_QUESTIONS,
  JA_TYPE_WORDS,
  JP_TYPE_BY_SUFFIX,
  READING_FILLS,
  SHORT_NAME_FILLS,
  TLD_EXCEPTIONS,
  TYPE_NOISE,
  TYPE_RULES,
} from "./data-config.ts";
import { englishSuspects } from "./en-names.ts";
import { buildFacts } from "./facts.ts";
import { buildGroupings } from "./groupings.ts";
import { buildWithdrawn, withdrawnDoc } from "./withdrawn.ts";
import type { CodesSnapshot } from "./withdrawn.ts";
import { buildSubdivisionFacts, SUBDIVISION_CAPITALS } from "./subdivision-facts.ts";
import type { FactsSnapshot } from "./facts.ts";
import { readManifest, readSource, ROOT } from "./sources.ts";

type Json = Record<string, unknown>;

interface WikidataItem {
  id: string;
  ja: string | null;
  kana: string[];
  types?: { id: string; label: string }[];
  calling?: string[];
}

interface CountryRecord {
  alpha2: string;
  alpha3: string;
  numeric: string;
  kind: "iso" | "user";
  en: string;
  ja: string;
  local: string | null;
  shortEn: string | null;
  shortJa: string | null;
  reading: string | null;
  continent: string;
  subregion: string | null;
  calling: string | null;
  currencies: string[];
  tld: string | null;
  capital: string | null;
  capitalJa: string | null;
  zones: string[];
  languages: string[];
  subdivisionType: string | null;
  aliases: string[];
  ioc: string | null;
}

interface SubdivisionRecord {
  code: string;
  country: string;
  shortCode: string;
  parent: string | null;
  level: number;
  en: string;
  ja: string | null;
  jaFrom: "cldr" | "override" | "wikidata" | null;
  // CLDR's Japanese name as it is in CLDR, before the bracket rule and any override.
  cldrJa: string | null;
  // The reason an override gives, when jaFrom is "override".
  why: string | null;
  wikidataJa: string | null;
  type: string | null;
  reading: string | null;
}

const CLDR_TAG = "release-48-2";
const NODE_MODULES = join(ROOT, "node_modules");
const OUT_DATA = join(ROOT, "src", "data");
const OUT_TABLES = join(OUT_DATA, "subdivisions");
const OUT_ENTRIES = join(ROOT, "src", "subdivisions");
const OUT_FACT_TABLES = join(OUT_DATA, "subdivision-facts");
const OUT_FACT_ENTRIES = join(ROOT, "src", "subdivision-facts");
const DOCS = join(ROOT, "docs");
const EXPECTED_GAPS = join(ROOT, "data-sources", "expected-ja-gaps.json");
const HAN = /\p{Script=Han}/u;
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

const args = process.argv.slice(2);
const REPORT = args.includes("--report");
const ACCEPT = args.includes("--accept");

const readJson = (path: string): Json => JSON.parse(readFileSync(join(NODE_MODULES, path), "utf8")) as Json;
const versionOf = (name: string): string => (readJson(`${name}/package.json`) as { version: string }).version;
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const dig = (json: Json, path: string[]): Json => path.reduce((at, key) => at[key] as Json, json);

// A name as it is kept: trimmed, single-spaced, NFC, with full-width ASCII letters, digits and spaces made
// ordinary. Japanese punctuation such as ＝ and ・ is part of the name and is left as it is.
const tidy = (text: string): string =>
  text
    .normalize("NFC")
    .replace(/[\uff10-\uff19\uff21-\uff3a\uff41-\uff5a]/g, (wide) => String.fromCharCode(wide.charCodeAt(0) - 0xfee0))
    .replace(/[\u3000\s]+/g, " ")
    .trim();

// The same folding the package's lookups use (src/fold.ts), here to find duplicates and agreements.
const fold = (text: string): string =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, (mark) => (mark === "\u3099" || mark === "\u309a" ? mark : ""))
    .normalize("NFC")
    .replace(/[\u30a1-\u30f6]/g, (katakana) => String.fromCharCode(katakana.charCodeAt(0) - 0x60))
    .replace(/['\u2018\u2019`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const key = (text: string): string => fold(text).replace(/ /g, "");

const unescapeXml = (text: string): string =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

// CLDR's <subdivision type="jp13">Tokyo</subdivision> lines, by id.
const subdivisionNames = (xml: string): Map<string, string> => {
  const names = new Map<string, string>();
  for (const match of xml.matchAll(/<subdivision type="([a-z0-9]+)"[^>]*>([^<]*)<\/subdivision>/g)) {
    // CLDR marks a name it uses twice with a superscript digit ("Île-de-France²" for the region beside the
    // department); the mark tells its own lists apart and is no part of the name.
    names.set(match[1], tidy(unescapeXml(match[2]).replace(/[\u00b2\u00b3\u00b9\u2070-\u2079]+$/, "")));
  }

  return names;
};

// The ids CLDR's validity file lists as regular. "ad02~8" is ad02 to ad08: the range runs over the last
// character.
const regularIds = (xml: string): Set<string> => {
  const start = xml.indexOf("idStatus='regular'");
  const block = xml.slice(xml.indexOf(">", start) + 1, xml.indexOf("</id>", start));
  const ids = new Set<string>();
  for (const word of block.replace(/<!--[\s\S]*?-->/g, " ").split(/\s+/).filter(Boolean)) {
    const [first, last] = word.split("~");
    ids.add(first);
    if (last === undefined) continue;
    const stem = first.slice(0, -1);
    for (let code = first.charCodeAt(first.length - 1) + 1; code <= last.charCodeAt(0); code += 1) ids.add(stem + String.fromCharCode(code));
  }

  return ids;
};

// "jp13" to "JP-13".
const isoOf = (id: string): string => `${id.slice(0, 2).toUpperCase()}-${id.slice(2).toUpperCase()}`;

const sourceLine = (manifest: ReturnType<typeof readManifest>, path: string): string => {
  const entry = manifest.files.find((file) => file.path === path)!;

  return `${entry.url} (read ${entry.read})`;
};

// ----- Reading the inputs -------------------------------------------------------------------------------

const manifest = readManifest();
const cldrEn = readSource(manifest, `cldr/${CLDR_TAG}/subdivisions-en.xml`).text;
const cldrJa = readSource(manifest, `cldr/${CLDR_TAG}/subdivisions-ja.xml`).text;
const validity = readSource(manifest, `cldr/${CLDR_TAG}/validity-subdivision.xml`).text;
const zoneTab = readSource(manifest, "iana/tzdb-2026e/zone.tab").text;
const tldList = readSource(manifest, "iana/tlds-alpha-by-domain.txt");
const wikidataFile = manifest.files.find((file) => /^wikidata-\d{4}-\d{2}-\d{2}\.json$/.test(file.path));
if (wikidataFile === undefined) throw new Error("No Wikidata snapshot in data-sources/sources.json: run pnpm data:wikidata");
const wikidata = JSON.parse(readSource(manifest, wikidataFile.path).text) as {
  subdivisions: Record<string, WikidataItem[]>;
  countries: Record<string, WikidataItem[]>;
};

const territoriesEn = dig(readJson("cldr-localenames-full/main/en/territories.json"), ["main", "en", "localeDisplayNames", "territories"]) as Record<string, string>;
const territoriesJa = dig(readJson("cldr-localenames-full/main/ja/territories.json"), ["main", "ja", "localeDisplayNames", "territories"]) as Record<string, string>;
const codeMappings = dig(readJson("cldr-core/supplemental/codeMappings.json"), ["supplemental", "codeMappings"]) as Record<string, { _numeric?: string; _alpha3?: string }>;
const currencyData = dig(readJson("cldr-core/supplemental/currencyData.json"), ["supplemental", "currencyData", "region"]) as Record<string, Record<string, { _to?: string; _tender?: string }>[]>;
const territoryContainment = dig(readJson("cldr-core/supplemental/territoryContainment.json"), ["supplemental", "territoryContainment"]) as Record<string, { _contains: string[]; _grouping?: string }>;
const subdivisionContainment = dig(readJson("cldr-core/supplemental/subdivisionContainment.json"), ["supplemental", "subdivisionContainment"]) as Record<string, { _contains: string[] }>;
const factsFile = manifest.files.find((file) => file.path.startsWith("wikidata-facts-"));
if (factsFile === undefined) throw new Error("No Wikidata facts snapshot in data-sources/sources.json: run pnpm data:facts");
const factsSnapshot = JSON.parse(readSource(manifest, factsFile.path).text) as FactsSnapshot;
const codesFile = manifest.files.find((file) => file.path.startsWith("wikidata-codes-"));
if (codesFile === undefined) throw new Error("No Wikidata codes snapshot in data-sources/sources.json: run pnpm data:codes");
const codesSnapshot = JSON.parse(readSource(manifest, codesFile.path).text) as CodesSnapshot;
const countriesList = readJson("countries-list/countries.min.json") as Record<string, { name: string; native: string; phone: number[]; continent: string; capital: string; languages: string[] }>;

const versions = { cldrCore: versionOf("cldr-core"), cldrNames: versionOf("cldr-localenames-full"), countriesList: versionOf("countries-list"), chizu: versionOf("@johnmorrisdotca/chizu") };
const tlds = new Set(tldList.text.split("\n").filter((line) => line !== "" && !line.startsWith("#")).map((line) => line.trim().toLowerCase()));
const tldVersion = tldList.text.split("\n")[0].replace(/^#\s*/, "");

// ----- Countries ----------------------------------------------------------------------------------------

// ISO 3166-1: every two-letter CLDR territory with a numeric code below 900 (900 to 999 are user-assigned),
// and Kosovo, whose user-assigned XK is in general use.
const USER_ASSIGNED = ["XK"];
const alpha2Codes = Object.keys(territoriesEn)
  .filter((code) => /^[A-Z]{2}$/.test(code))
  .filter((code) => {
    const numeric = codeMappings[code]?._numeric;

    return numeric !== undefined && Number(numeric) < 900;
  })
  .concat(USER_ASSIGNED)
  .sort(byText);

// The subregion is the UN M49 area that holds a country directly; groupings (EU, Latin America) are not areas.
const subregionOf = new Map<string, string>();
for (const [area, { _contains, _grouping }] of Object.entries(territoryContainment)) {
  if (!/^\d{3}$/.test(area) || _grouping === "true" || area === "001") continue;
  for (const member of _contains) if (/^[A-Z]{2}$/.test(member)) subregionOf.set(member, area);
}

const zonesOf = new Map<string, string[]>();
for (const line of zoneTab.split("\n")) {
  if (line.startsWith("#") || line.trim() === "") continue;
  const [code, , zone] = line.split("\t");
  zonesOf.set(code, [...(zonesOf.get(code) ?? []), zone]);
}

// Wikidata's items for a code, without those it marks as former, historical or dissolved by their type.
const currentItems = (items: WikidataItem[] | undefined): WikidataItem[] =>
  (items ?? []).filter((item) => !(item.types ?? []).some((type) => /^(former|historical)\b/i.test(type.label)));

// A calling code as the ITU writes it. Members of the North American plan share +1 and are told apart by
// area code, which Wikidata writes after it ("+1264"); the country code is +1.
const callingOf = (alpha2: string): string | null => {
  const items = wikidata.countries[alpha2] ?? [];
  const own = items.find((item) => (item.calling ?? []).length > 0) ?? null;
  const values = (own?.calling ?? []).map((value) => value.replace(/[\s-]/g, ""));
  const fallback = (countriesList[alpha2]?.phone ?? []).map((value) => `+${value}`);
  const first = values[0] ?? fallback[0] ?? null;
  if (first === null) return null;

  return /^\+1\d{3}$/.test(first) ? "+1" : first;
};

const currenciesOf = (alpha2: string): string[] =>
  (currencyData[alpha2] ?? [])
    .flatMap((entry) => Object.entries(entry))
    .filter(([, when]) => when._to === undefined && when._tender !== "false")
    .map(([currency]) => currency);

// A reading for a name written in kanji: Wikidata's kana name, when Wikidata's label is the same name and it
// gives exactly one; otherwise the hand-written fill, if there is one; otherwise none.
const readingFor = (code: string, name: string | null, items: WikidataItem[]): string | null => {
  if (name === null || !HAN.test(name)) return null;
  const same = items.filter((item) => item.ja !== null && key(item.ja) === key(name));
  const kana = [...new Set(same.flatMap((item) => item.kana.map((one) => tidy(one))))];
  if (kana.length === 1 && /^[\p{Script=Hiragana}\u30fc]+$/u.test(kana[0])) return kana[0];

  return READING_FILLS[code] ?? null;
};

// The continent, from UN M49 as CLDR gives it: the region that holds the country (Africa 002, Asia 142, Europe 150,
// Oceania 009), and for the Americas (019) South America (005) or else North America, which takes in Central
// America and the Caribbean. Antarctica, in no M49 region, is the one continent named by hand.
const M49_CONTINENT: Record<string, string> = { "002": "AF", "142": "AS", "150": "EU", "009": "OC" };
const m49Parent = new Map<string, string>();
for (const [area, { _contains }] of Object.entries(territoryContainment)) {
  if (!/^\d{3}$/.test(area) || ["001", "003", "202", "419"].includes(area)) continue;
  for (const inner of _contains) m49Parent.set(inner, area);
}
const continentOf = (alpha2: string): string | null => {
  if (alpha2 === "AQ") return "AN";
  const chain: string[] = [];
  for (let at = m49Parent.get(alpha2); at !== undefined; at = m49Parent.get(at)) chain.push(at);
  const region = chain[chain.length - 1];
  if (region === "019") return chain.includes("005") ? "SA" : "NA";

  return region === undefined ? null : (M49_CONTINENT[region] ?? null);
};

const countries: CountryRecord[] = alpha2Codes.map((alpha2) => {
  const mapping = codeMappings[alpha2] ?? {};
  const listed = countriesList[alpha2];
  if (listed === undefined) throw new Error(`countries-list has no ${alpha2}`);
  const en = tidy(territoriesEn[alpha2]);
  const ja = tidy(territoriesJa[alpha2]);
  if (!JAPANESE.test(ja)) throw new Error(`CLDR's Japanese name for ${alpha2} is ${ja}`);
  const native = tidy(listed.native);
  const shortEn = territoriesEn[`${alpha2}-alt-short`] ?? SHORT_NAME_FILLS[alpha2]?.en ?? null;
  const shortJa = territoriesJa[`${alpha2}-alt-short`] ?? SHORT_NAME_FILLS[alpha2]?.ja ?? null;
  const variants = [territoriesEn, territoriesJa].flatMap((names) =>
    Object.entries(names)
      .filter(([name]) => name.startsWith(`${alpha2}-alt-`) && !name.endsWith("-alt-short"))
      .map(([, value]) => tidy(value)),
  );
  // An alias is kept only when it adds a way in: not a name, short name or own name it already has.
  const known = new Set([en, ja, native, shortEn, shortJa].filter((name): name is string => name !== null).map(key));
  const aliases: string[] = [];
  for (const alias of [...variants, ...(COUNTRY_ALIASES[alpha2] ?? [])]) {
    if (known.has(key(alias))) continue;
    known.add(key(alias));
    aliases.push(alias);
  }
  const continent = continentOf(alpha2);
  if (continent === null || !(CONTINENTS as readonly string[]).includes(continent)) throw new Error(`${alpha2} is in no UN M49 region`);

  return {
    alpha2,
    alpha3: mapping._alpha3 ?? "",
    numeric: (mapping._numeric ?? "").padStart(3, "0"),
    kind: USER_ASSIGNED.includes(alpha2) ? "user" : "iso",
    en,
    ja,
    local: native === "" || native === en ? null : native,
    shortEn: shortEn === null ? null : tidy(shortEn),
    shortJa: shortJa === null ? null : tidy(shortJa),
    reading: readingFor(alpha2, ja, wikidata.countries[alpha2] ?? []),
    continent,
    subregion: subregionOf.get(alpha2) ?? null,
    calling: callingOf(alpha2),
    currencies: currenciesOf(alpha2),
    tld: TLD_EXCEPTIONS[alpha2] ?? (tlds.has(alpha2.toLowerCase()) ? alpha2.toLowerCase() : null),
    capital: listed.capital.trim() === "" ? null : listed.capital.trim(),
    capitalJa: null,
    zones: zonesOf.get(alpha2) ?? [],
    languages: listed.languages,
    subdivisionType: null,
    aliases,
    ioc: null,
  };
});

// The IOC codes and the withdrawn countries (scripts/withdrawn.ts), from the codes snapshot.
const withdrawn = buildWithdrawn(codesSnapshot, new Set(countries.map((country) => country.alpha2)));
for (const country of countries) country.ioc = withdrawn.ioc.get(country.alpha2) ?? null;

for (const country of countries) {
  if (!/^[A-Z]{3}$/.test(country.alpha3) || !/^\d{3}$/.test(country.numeric)) throw new Error(`${country.alpha2} has no alpha-3 or numeric code`);
}

// No two countries may answer to the same folded name.
const countryKeys = new Map<string, string>();
for (const country of countries) {
  const names = [country.en, country.ja, country.local, country.shortEn, country.shortJa, country.reading, ...country.aliases];
  for (const name of names) {
    if (name === null) continue;
    const folded = key(name);
    const other = countryKeys.get(folded);
    if (other !== undefined && other !== country.alpha2) throw new Error(`"${name}" names both ${other} and ${country.alpha2}`);
    countryKeys.set(folded, country.alpha2);
  }
}

// ----- Facts ---------------------------------------------------------------------------------------------

// The capital's Japanese name and the /facts entry's figures; scripts/facts.ts says how, scripts/facts-config.ts
// lists the exceptions. Where the facts replace countries-list's capital (it moved), the country takes the new one.
const facts = buildFacts({
  snapshot: factsSnapshot,
  countries: countries.map((country) => ({ alpha2: country.alpha2, capital: country.capital })),
  cldr: {
    weekData: dig(readJson("cldr-core/supplemental/weekData.json"), ["supplemental", "weekData"]),
    measurementData: dig(readJson("cldr-core/supplemental/measurementData.json"), ["supplemental", "measurementData"]),
    timeData: dig(readJson("cldr-core/supplemental/timeData.json"), ["supplemental", "timeData"]),
    territoryContainment,
  },
  chizuCountries: join(NODE_MODULES, "@johnmorrisdotca", "chizu", "dist", "data", "countries"),
});
const factsOf = new Map(facts.records.map((record) => [record.alpha2, record]));
for (const country of countries) {
  const record = factsOf.get(country.alpha2)!;
  country.capital = record.capitalEn;
  country.capitalJa = record.capitalJa;
}

// ----- Subdivisions -------------------------------------------------------------------------------------

const namesEn = subdivisionNames(cldrEn);
const namesJa = subdivisionNames(cldrJa);
const regular = regularIds(validity);

// CLDR retires a subdivision code when the place also has a country code of its own (Puerto Rico is US-PR
// and PR), calling it "overlong". ISO 3166-2 keeps those codes, so they are kept here too, named as the
// country they are also.
const subdivisionAliases = dig(readJson("cldr-core/supplemental/aliases.json"), ["supplemental", "metadata", "alias", "subdivisionAlias"]) as Record<string, { _replacement: string; _reason: string }>;
const overlong = new Map<string, string>(
  Object.entries(subdivisionAliases)
    .filter(([, alias]) => alias._reason === "overlong" && /^[A-Z]{2}$/.test(alias._replacement))
    .map(([id, alias]) => [id, alias._replacement]),
);

// The type of a place from Wikidata's classes for it: the head of each class label, noise left out, then
// the first rule that matches any of them.
const typeFromWikidata = (items: WikidataItem[]): string | null => {
  const heads = items
    .flatMap((item) => item.types ?? [])
    .map((type) => type.label.toLowerCase())
    .filter((label) => !TYPE_NOISE.test(label))
    .map((label) => label.replace(/ (of|in) .*$/, ""));
  for (const [rule, type] of TYPE_RULES) if (heads.some((head) => rule.test(head))) return type;

  return null;
};

// A trailing bracket on a CLDR Japanese name, "セント・ポール (ドミニカ国)" or "バリンゴ (カウンティ)", tells two
// places of one name apart; in the data of a single country it is noise. It is taken off when what it holds is a
// country's Japanese name, a direction or a generic kind word (the lists are in scripts/data-config.ts), and left
// in place, to be caught by the tests, when it is anything else.
const BRACKET = /^(.*\S)\s*[(（]([^()（）]+)[)）]$/;
const bracketCountries = new Set([
  ...countries.flatMap((country) => [country.ja, country.shortJa]).filter((name): name is string => name !== null),
  ...JA_BRACKET_COUNTRY_NAMES,
].map(tidy));
const bracketWords = new Set(JA_BRACKET_WORDS.map(tidy));
const stripBracket = (name: string): string => {
  const found = BRACKET.exec(name);
  if (found === null) return name;
  const inside = tidy(found[2]);

  return bracketCountries.has(inside) || bracketWords.has(inside) ? tidy(found[1]) : name;
};

const subdivisions: SubdivisionRecord[] = [];
const notReached: string[] = [];
const noEnglish: string[] = [];
const reached = new Set<string>();
const usedOverrides = new Set<string>();
const usedEnOverrides = new Set<string>();

const walk = (country: string, ids: string[], parent: string | null, level: number): void => {
  for (const id of ids) {
    const children = subdivisionContainment[id]?._contains ?? [];
    if (!regular.has(id) && !overlong.has(id)) {
      // A grouping CLDR keeps but ISO does not list: its children belong to the level it would have had.
      walk(country, children, parent, level);
      continue;
    }
    reached.add(id);
    const code = isoOf(id);
    // A code ISO has withdrawn since CLDR's release is left out (CODE_CHANGES in scripts/data-config.ts).
    if (code in CODE_CHANGES.removed) continue;
    const territory = overlong.get(id);
    const cldrEn = namesEn.get(id) ?? (territory === undefined ? undefined : tidy(territoriesEn[territory]));
    const enOverride = EN_NAME_OVERRIDES[code];
    if (enOverride !== undefined) usedEnOverrides.add(code);
    const en = enOverride?.en ?? cldrEn;
    if (en === undefined || en === "") {
      noEnglish.push(code);
      continue;
    }
    const items = currentItems(wikidata.subdivisions[code]);
    const cldrJaRaw = namesJa.get(id) ?? (territory === undefined ? null : tidy(territoriesJa[territory]));
    const cldrJaName = cldrJaRaw === null ? null : stripBracket(cldrJaRaw);
    const override = JA_NAME_OVERRIDES[code];
    if (override !== undefined) usedOverrides.add(code);
    // Wikidata's Japanese label, only when the items agree on it and it is written in Japanese: a Latin
    // label or one with a disambiguation in brackets is not a name.
    const labels = [...new Set(items.map((item) => item.ja).filter((label): label is string => label !== null).map(tidy))];
    const wikidataJa = labels.length === 1 && JAPANESE.test(labels[0]) && !/[()（）]/.test(labels[0]) ? labels[0] : null;
    const ja = override?.ja ?? cldrJaName ?? wikidataJa;
    let type = typeFromWikidata(items);
    if (country === "JP" && ja !== null) type = JP_TYPE_BY_SUFFIX[ja.slice(-1)] ?? null;
    if (type !== null && !(SUBDIVISION_TYPES as readonly string[]).includes(type)) throw new Error(`${code}: unknown type ${type}`);
    subdivisions.push({
      code,
      country,
      shortCode: code.slice(3),
      parent: parent === null ? null : isoOf(parent),
      level,
      en,
      ja,
      jaFrom: override !== undefined ? "override" : cldrJaName !== null ? "cldr" : wikidataJa !== null ? "wikidata" : null,
      cldrJa: cldrJaRaw,
      why: override?.why ?? null,
      wikidataJa,
      type,
      reading: country === "JP" ? readingFor(code, ja, items) : null,
    });
    if (level >= 3 && children.length > 0) throw new Error(`${code} has subdivisions below level 3`);
    walk(country, children, id, level + 1);
  }
};

// A code ISO has added since CLDR's release, at the first level: its English name from CODE_CHANGES, its Japanese
// name and kind from Wikidata by the same rules as any code CLDR has no Japanese name for.
const addCode = (code: string, en: string): void => {
  const country = code.slice(0, 2);
  const items = currentItems(wikidata.subdivisions[code]);
  const labels = [...new Set(items.map((item) => item.ja).filter((label): label is string => label !== null).map(tidy))];
  const wikidataJa = labels.length === 1 && JAPANESE.test(labels[0]) && !/[()（）]/.test(labels[0]) ? labels[0] : null;
  const override = JA_NAME_OVERRIDES[code];
  if (override !== undefined) usedOverrides.add(code);
  const type = typeFromWikidata(items);
  if (type !== null && !(SUBDIVISION_TYPES as readonly string[]).includes(type)) throw new Error(`${code}: unknown type ${type}`);
  subdivisions.push({
    code,
    country,
    shortCode: code.slice(3),
    parent: null,
    level: 1,
    en,
    ja: override?.ja ?? wikidataJa,
    jaFrom: override !== undefined ? "override" : wikidataJa !== null ? "wikidata" : null,
    cldrJa: null,
    why: override?.why ?? null,
    wikidataJa,
    type,
    reading: null,
  });
};

for (const country of countries) {
  const top = subdivisionContainment[country.alpha2]?._contains ?? [];
  walk(country.alpha2, top, null, 1);
}
for (const [code, { en }] of Object.entries(CODE_CHANGES.added)) {
  if (subdivisions.some((record) => record.code === code)) throw new Error(`CODE_CHANGES adds ${code}, which CLDR already has`);
  addCode(code, en);
}
for (const code of Object.keys(CODE_CHANGES.removed)) if (!reached.has(code.replace("-", "").toLowerCase())) throw new Error(`CODE_CHANGES removes ${code}, which CLDR does not have`);
const unusedEn = Object.keys(EN_NAME_OVERRIDES).filter((code) => !usedEnOverrides.has(code));
if (unusedEn.length > 0) throw new Error(`EN_NAME_OVERRIDES names no subdivision: ${unusedEn.join(", ")}`);
for (const id of regular) if (!reached.has(id)) notReached.push(isoOf(id));
const unmatched = Object.keys(JA_NAME_OVERRIDES).filter((code) => !usedOverrides.has(code));
if (unmatched.length > 0) throw new Error(`JA_NAME_OVERRIDES names no subdivision: ${unmatched.join(", ")}`);
if (noEnglish.length > 0) throw new Error(`No English name in CLDR for ${noEnglish.join(", ")}`);
subdivisions.sort((a, b) => byText(a.code, b.code));

// Every English name a check in scripts/en-names.ts points at (cut short, an adjective, marks stripped, swapped
// with a neighbour's) must be put right in EN_NAME_OVERRIDES or kept on purpose in EN_NAME_ACCEPTED.
const englishLabels = (factsSnapshot.answers as unknown as Record<string, Record<string, unknown[][]>>).subdivisionLabels;
const suspects = englishSuspects(
  subdivisions.map((record) => ({ code: record.code, country: record.country, en: record.en })),
  (code) => {
    const ids = currentItems(wikidata.subdivisions[code]).map((item) => item.id);
    const labels = [...new Set((englishLabels[code] ?? []).filter((row) => ids.includes(row[0] as string)).map((row) => row[1] as string))];

    return labels.length === 1 ? labels[0] : null;
  },
  (code) => {
    const current = currentItems(wikidata.subdivisions[code]).map((item) => item.id);

    return (englishLabels[code] ?? []).filter((row) => !current.includes(row[0] as string)).map((row) => row[1] as string);
  },
);
const undecided = suspects.filter((one) => !(one.code in EN_NAME_ACCEPTED));
if (undecided.length > 0) throw new Error(`English names to decide (EN_NAME_OVERRIDES or EN_NAME_ACCEPTED):\n  ${undecided.map((one) => `${one.code} ${one.pattern}: ${one.en} / Wikidata ${one.wikidata}`).join("\n  ")}`);
const staleAccepted = Object.keys(EN_NAME_ACCEPTED).filter((code) => !suspects.some((one) => one.code === code));
if (staleAccepted.length > 0) throw new Error(`EN_NAME_ACCEPTED names a code no check points at: ${staleAccepted.join(", ")}`);

// The facts about each subdivision (scripts/subdivision-facts.ts), from the same current Wikidata items as its names.
const subdivisionFacts = buildSubdivisionFacts(
  factsSnapshot.answers as unknown as Record<string, Record<string, unknown[][]>>,
  subdivisions.map((record) => ({ code: record.code, items: currentItems(wikidata.subdivisions[record.code]).map((item) => item.id) })),
);

const byCountry = new Map<string, SubdivisionRecord[]>();
for (const subdivision of subdivisions) byCountry.set(subdivision.country, [...(byCountry.get(subdivision.country) ?? []), subdivision]);

// The Japanese word for each (country, type): the one every name of that kind ends in, or null.
const typeWordJa = (records: SubdivisionRecord[]): string | null => {
  const names = records.map((record) => record.ja);
  if (names.some((name) => name === null)) return null;
  const word = JA_TYPE_WORDS.find((ending) => names.every((name) => name!.endsWith(ending) && name!.length > ending.length));

  return word ?? null;
};

for (const country of countries) {
  const firsts = (byCountry.get(country.alpha2) ?? []).filter((record) => record.level === 1 && record.type !== null);
  const counts = new Map<string, number>();
  for (const record of firsts) counts.set(record.type!, (counts.get(record.type!) ?? 0) + 1);
  const most = [...counts.entries()].sort((a, b) => b[1] - a[1] || byText(a[0], b[0]))[0];
  country.subdivisionType = most === undefined ? null : most[0];
}

// ----- Writing ------------------------------------------------------------------------------------------

const header = (what: string, sources: string[]): string =>
  [
    "// Generated by scripts/build-data.ts. Do not edit by hand: change the script or its inputs and run pnpm data.",
    `// ${what}`,
    ...sources.map((source) => `// Source: ${source}`),
    "",
    "",
  ].join("\n");

const CLDR_SOURCE = `Unicode CLDR ${versions.cldrNames} (Unicode-3.0), cldr-localenames-full and cldr-core ${versions.cldrCore} on npm`;
const CLDR_XML_SOURCE = `Unicode CLDR ${versions.cldrNames} (Unicode-3.0), ${sourceLine(manifest, `cldr/${CLDR_TAG}/subdivisions-en.xml`)} and ja.xml`;
const WIKIDATA_SOURCE = `Wikidata (CC0), the snapshot data-sources/${wikidataFile.path}`;
const LIST_SOURCE = `countries-list ${versions.countriesList} (MIT), https://github.com/annexare/Countries`;
const IANA_SOURCE = `IANA tzdb 2026e zone.tab (public domain) and the TLD list, ${tldVersion}`;

const literal = (value: unknown): string => JSON.stringify(value);
const joined = (list: string[], separator: string): string | null => (list.length === 0 ? null : list.join(separator));

const countryRow = (country: CountryRecord): string => {
  const row: unknown[] = [
    country.alpha2,
    country.alpha3,
    country.numeric,
    country.en,
    country.ja,
    country.local,
    country.shortEn,
    country.shortJa,
    country.reading,
    country.continent,
    country.subregion,
    country.calling,
    joined(country.currencies, " "),
    country.tld,
    country.capital,
    country.capitalJa,
    joined(country.zones, " "),
    joined(country.languages, " "),
    country.subdivisionType,
    joined(country.aliases, "|"),
    country.ioc,
  ];
  if (country.kind === "user") row.push("user");

  return `  ${literal(row)},`;
};

// The continents and subregions by their M49 code, in both languages, for continentName and subregionName.
const CONTINENT_AREAS: Record<string, string> = { AF: "002", AN: "AQ", AS: "142", EU: "150", NA: "003", OC: "009", SA: "005" };
const subregions = [...new Set(countries.map((country) => country.subregion).filter((area): area is string => area !== null))].sort(byText);
const regionNames = (area: string): [string, string] => [tidy(territoriesEn[area]), tidy(territoriesJa[area])];

const writeCountries = (): void => {
  const codes = countries.map((country) => country.alpha2);
  writeFileSync(
    join(OUT_DATA, "codes.data.ts"),
    header(`The ${codes.length} country codes: ISO 3166-1 alpha-2, and XK for Kosovo.`, [CLDR_SOURCE]) +
      "/**\n * The 250 country codes: the 249 ISO 3166-1 alpha-2 codes and XK for Kosovo, in alphabetical order.\n *\n * @example\n * ```ts\n * import { COUNTRY_CODES } from \"@johnmorrisdotca/kuni/codes\";\n *\n * COUNTRY_CODES.length;   // 250\n * COUNTRY_CODES[0];       // \"AD\"\n * ```\n */\n" +
      `const COUNTRY_CODES = [\n${codes.map((code, index) => `${index % 16 === 0 ? "  " : " "}${literal(code)},${index % 16 === 15 || index === codes.length - 1 ? "\n" : ""}`).join("")}] as const;\n\n` +
      "/** One of the 250 country codes, as a type: \"JP\" | \"US\" | ... */\ntype CountryCode = (typeof COUNTRY_CODES)[number];\n\n" +
      "export { COUNTRY_CODES };\nexport type { CountryCode };\n",
  );
  writeFileSync(
    join(OUT_DATA, "countries.data.ts"),
    header(`Every country (${countries.length}), one row each; src/rows.ts says what the columns are.`, [
      `${CLDR_SOURCE}: names, short names, variants, codes, currencies, regions`,
      `${WIKIDATA_SOURCE}: calling codes, readings`,
      `Wikidata (CC0), the snapshot data-sources/${codesFile.path}: IOC codes`,
      `${LIST_SOURCE}: own names, capitals, languages`,
      `${CLDR_SOURCE}: continents, from UN M49`,
      `Wikidata (CC0), the snapshot data-sources/${factsFile.path}: capitals' Japanese names`,
      IANA_SOURCE,
    ]) +
      'import type { CountryRow } from "../rows";\n\n' +
      `const COUNTRY_ROWS: readonly CountryRow[] = [\n${countries.map(countryRow).join("\n")}\n];\n\n` +
      "// The continents (by their two letters) and the UN M49 subregions (by number), named in English and Japanese.\n" +
      `const CONTINENT_NAMES: Readonly<Record<string, readonly [string, string]>> = {\n${Object.entries(CONTINENT_AREAS)
        .map(([continent, area]) => `  ${continent}: ${literal(regionNames(area))},`)
        .join("\n")}\n};\n\n` +
      `const SUBREGION_NAMES: Readonly<Record<string, readonly [string, string]>> = {\n${subregions.map((area) => `  ${literal(area)}: ${literal(regionNames(area))},`).join("\n")}\n};\n\n` +
      "export { CONTINENT_NAMES, COUNTRY_ROWS, SUBREGION_NAMES };\n",
  );
};

// The /facts entry's table: one row a country, and the record of what was decided (docs/facts.md).
// Row: [alpha2, population, populationYear, areaKm2, areaYear, areaOf, lat, lon, capitalLat, capitalLon, borders,
// drivingSide, conventions]. borders is one string of codes with spaces between; drivingSide "L" or "R";
// conventions lists, with spaces between, only the CLDR values that are not the world's default (mon, metric, A4,
// h23), so that most countries write null there. areaOf is "L" for a figure for the land alone, null for the whole.
const FACTS_SOURCE = `Wikidata (CC0), the snapshot data-sources/${factsFile.path}`;
const DEFAULT_CONVENTIONS = new Set(["mon", "metric", "A4", "h23"]);
const writeFacts = (): void => {
  const rows = facts.records.map((record) => {
    const conventions = [record.weekStart, record.measurement, record.paper, record.hourCycle].filter((value) => !DEFAULT_CONVENTIONS.has(value));
    const row: unknown[] = [
      record.alpha2,
      record.population,
      record.populationYear,
      record.area,
      record.areaYear,
      record.areaPart === "land" ? "L" : null,
      record.point?.[0] ?? null,
      record.point?.[1] ?? null,
      record.capitalPoint?.[0] ?? null,
      record.capitalPoint?.[1] ?? null,
      joined(record.borders, " "),
      record.drivingSide === null ? null : record.drivingSide === "left" ? "L" : "R",
      joined(conventions, " "),
    ];
    while (row.length > 1 && row[row.length - 1] === null) row.pop();

    return `  ${literal(row)},`;
  });
  writeFileSync(
    join(OUT_DATA, "facts.data.ts"),
    header(`The facts about every country (${facts.records.length}), one row each; src/facts.ts says what the columns are.`, [
      `${FACTS_SOURCE}: population, area, coordinates, capitals' coordinates, driving side, borders`,
      `Natural Earth 5.1.2 admin-0 1:50m (public domain), as drawn by @johnmorrisdotca/chizu ${versions.chizu} (MIT): land borders confirmed`,
      `${CLDR_SOURCE}: first day of the week, measurement system, paper size, clock`,
    ]) +
      'import type { FactsRow } from "../rows";\n\n' +
      `/**\n * The day the Wikidata snapshot was read: every figure in /facts is as Wikidata gave it on this day.\n *\n * @example\n * \`\`\`ts\n * import { FACTS_READ, facts } from "@johnmorrisdotca/kuni/facts";\n *\n * console.log(\`\${facts("JP")?.population} people in \${facts("JP")?.populationYear}, as Wikidata gave it on \${FACTS_READ}\`);\n * \`\`\`\n */\nconst FACTS_READ = ${literal(factsFile.read)};\n\n` +
      `const FACT_ROWS: readonly FactsRow[] = [\n${rows.join("\n")}\n];\n\n` +
      "export { FACT_ROWS, FACTS_READ };\n",
  );
  writeFileSync(join(DOCS, "facts.md"), facts.doc.join("\n"));
};

const lower = (alpha2: string): string => alpha2.toLowerCase();

// One file a country of the facts about its subdivisions, an entry a country, the loaders, and the record of what
// is known (docs/subdivision-facts.md). Row: shortCode|capitalEn|capitalJa|capitalReading|capitalLat|capitalLon|
// population|populationYear|areaKm2|areaYear|lat|lon, an absent value empty and trailing ones left off.
// The /groupings entry's table, one object a line, and docs/groupings.md.
const writeGroupings = (): void => {
  const { records, doc } = buildGroupings({
    countries: countries.map((country) => ({ alpha2: country.alpha2, continent: country.continent, en: country.en, ja: country.ja })),
    subdivisionCodes: new Set(subdivisions.map((record) => record.code)),
    territoriesEn,
    territoriesJa,
    containment: territoryContainment,
    continentNames: Object.fromEntries(Object.entries(CONTINENT_AREAS).map(([continent, area]) => [continent, regionNames(area)])),
    memberships: (factsSnapshot.answers as unknown as Record<string, Record<string, unknown[][]>>).memberships,
    cldrVersion: versions.cldrNames,
    snapshotRead: factsFile.read,
  });
  writeFileSync(
    join(OUT_DATA, "groupings.data.ts"),
    header(`Every grouping (${records.length}): continents, UN M49 areas, international bodies, informal groupings and regions inside a country.`, [
      `${CLDR_SOURCE}: the continents' names, UN M49, the UN's members`,
      `${LIST_SOURCE}: each country's continent`,
      `${FACTS_SOURCE}: the dates members joined and left`,
      "scripts/groupings-config.ts (MIT): the bodies' members as each body lists them, the informal groupings and the regions inside a country",
    ]) +
      'import type { GroupingRow } from "../rows";\n\n' +
      `const GROUPING_ROWS: readonly GroupingRow[] = [\n${records.map((record) => `  ${literal(record)},`).join("\n")}\n];\n\n` +
      "export { GROUPING_ROWS };\n",
  );
  writeFileSync(join(DOCS, "groupings.md"), doc.join("\n"));
};

// The /withdrawn entry's table, one object a line, and docs/withdrawn.md.
const writeWithdrawn = (): void => {
  const { records } = withdrawn;
  const rows = records.map(({ items: _items, filled: _filled, ...row }) => row);
  writeFileSync(
    join(OUT_DATA, "withdrawn.data.ts"),
    header(`The ${records.length} withdrawn countries of ISO 3166-3, one object each.`, [
      `Wikidata (CC0), the snapshot data-sources/${codesFile.path}: the codes, names, years and successors`,
      "scripts/withdrawn-config.ts (MIT): the few codes, years, names and successors Wikidata does not give, with the reasons",
    ]) +
      'import type { WithdrawnRow } from "../rows";\n\n' +
      `const WITHDRAWN_ROWS: readonly WithdrawnRow[] = [\n${rows.map((row) => `  ${literal(row)},`).join("\n")}\n];\n\n` +
      `/**\n * The day the Wikidata snapshot of the withdrawn codes was read.\n *\n * @example\n * \`\`\`ts\n * import { WITHDRAWN_READ } from "@johnmorrisdotca/kuni/withdrawn";\n *\n * WITHDRAWN_READ; // "${codesFile.read}"\n * \`\`\`\n */\nconst WITHDRAWN_READ = ${literal(codesFile.read)};\n\n` +
      "export { WITHDRAWN_READ, WITHDRAWN_ROWS };\n",
  );
  writeFileSync(join(DOCS, "withdrawn.md"), withdrawnDoc(records, codesSnapshot, withdrawn.ioc.size).join("\n"));
};

const writeSubdivisionFacts = (): void => {
  mkdirSync(OUT_FACT_TABLES, { recursive: true });
  mkdirSync(OUT_FACT_ENTRIES, { recursive: true });
  const names: string[] = [];
  const text = (value: unknown): string => (value === null || value === undefined ? "" : String(value));
  for (const [alpha2, records] of byCountry) {
    const rows = records.map((record) => {
      const fact = subdivisionFacts.records.get(record.code)!;
      const fields = [record.shortCode, fact.capitalEn, fact.capitalJa, fact.capitalReading, fact.capitalPoint?.[0], fact.capitalPoint?.[1], fact.population, fact.populationYear, fact.area, fact.areaYear, fact.point?.[0], fact.point?.[1]].map(text);
      for (const field of fields) if (/[|\n`\\]|\$\{/.test(field)) throw new Error(`${record.code}: "${field}" cannot be written in a row`);
      while (fields.length > 1 && fields[fields.length - 1] === "") fields.pop();

      return fields.join("|");
    });
    const name = lower(alpha2);
    names.push(name);
    const named = countries.find((one) => one.alpha2 === alpha2)!;
    writeFileSync(
      join(OUT_FACT_TABLES, `${name}.data.ts`),
      header(`The facts about the ${records.length} subdivisions of ${named.en} (${alpha2}): capitals, population, area, coordinates.`, [`${FACTS_SOURCE}`]) +
        'import type { SubdivisionFactsTable } from "../../rows";\n\n' +
        `const ${alpha2}: SubdivisionFactsTable = {\n  country: ${literal(alpha2)},\n  rows: \`${rows.join("\n")}\`,\n};\n\nexport { ${alpha2} };\n`,
    );
    writeFileSync(
      join(OUT_FACT_ENTRIES, `${name}.ts`),
      [
        "// Generated by scripts/build-data.ts. Do not edit by hand.",
        `// The entry @johnmorrisdotca/kuni/subdivision-facts/${name}: the facts about the ${records.length} subdivisions of ${named.en}.`,
        "",
        `import { ${alpha2} } from "../data/subdivision-facts/${name}.data";`,
        'import { expandSubdivisionFacts } from "../rows";',
        'import type { SubdivisionFacts } from "../types";',
        "",
        "/**",
        ` * The facts about the subdivisions of ${named.en}, in code order, one for each subdivision, every level. Also the default export.`,
        " *",
        " * @example",
        " * ```ts",
        ` * import facts from "@johnmorrisdotca/kuni/subdivision-facts/${name}";`,
        " *",
        ` * facts.length;    // ${records.length}`,
        ` * facts[0].code;   // ${literal(records[0].code)}`,
        " * ```",
        " */",
        `const SUBDIVISION_FACTS: readonly SubdivisionFacts[] = expandSubdivisionFacts(${alpha2});`,
        "",
        "export default SUBDIVISION_FACTS;",
        "export { SUBDIVISION_FACTS };",
        "",
      ].join("\n"),
    );
  }
  for (const file of readdirSync(OUT_FACT_TABLES)) if (!names.includes(file.slice(0, 2))) rmSync(join(OUT_FACT_TABLES, file));
  for (const file of readdirSync(OUT_FACT_ENTRIES)) if (!names.includes(file.slice(0, 2))) rmSync(join(OUT_FACT_ENTRIES, file));
  names.sort(byText);
  writeFileSync(
    join(OUT_DATA, "fact-loaders.data.ts"),
    header(`One dynamic import for each of the ${names.length} countries with subdivisions, for loadSubdivisionFacts.`, [FACTS_SOURCE]) +
      'import type { SubdivisionFacts } from "../types";\n\n' +
      "type FactsLoader = () => Promise<{ SUBDIVISION_FACTS: readonly SubdivisionFacts[] }>;\n\n" +
      `const FACT_LOADERS: Readonly<Record<string, FactsLoader>> = {\n${names.map((name) => `  ${name}: () => import("../subdivision-facts/${name}.js"),`).join("\n")}\n};\n\n` +
      "export { FACT_LOADERS };\nexport type { FactsLoader };\n",
  );

  // The record: how much is known, country by country, and why the rest is not.
  const fields = ["capital", "population", "area", "point"] as const;
  const all = [...subdivisionFacts.gaps.entries()];
  const firsts = subdivisions.filter((record) => record.level === 1).map((record) => record.code);
  const known = (codes: string[], field: (typeof fields)[number]): number => codes.filter((code) => subdivisionFacts.gaps.get(code)![field] === null).length;
  const why = (field: (typeof fields)[number]): string =>
    (["none", "no item", "items disagree", "two capitals"] as const)
      .map((gap) => [gap, all.filter(([, gaps]) => gaps[field] === gap).length] as const)
      .filter(([, count]) => count > 0)
      .map(([gap, count]) => `${count} ${gap}`)
      .join(", ");
  const lines = [
    "# The facts about subdivisions: what is known",
    "",
    "Written by `pnpm data` (scripts/build-data.ts); do not edit by hand. The rules are at the top of",
    "`scripts/subdivision-facts.ts`. Every figure is Wikidata's (CC0), from the snapshot",
    `\`${factsFile.path}\`; a fact Wikidata does not give, or gives two ways, is \`null\`, never a guess.`,
    "",
    "| Fact | Level 1 | All levels | Why the rest are null |",
    "| --- | --- | --- | --- |",
    ...fields.map((field) => `| ${field} | ${known(firsts, field)} of ${firsts.length} | ${known(all.map(([code]) => code), field)} of ${all.length} | ${why(field)} |`),
    "",
    "*none*: Wikidata gives no such statement. *no item*: no current Wikidata item holds the code. *items disagree*:",
    "two items hold the code (a city and the district of the same name) and give different values. *two capitals*:",
    "Wikidata names two current capitals.",
    "",
    "Capitals with a Japanese name: " + `${[...subdivisionFacts.records.values()].filter((record) => record.capitalJa !== null).length}` + "; with a reading in kana: " + `${[...subdivisionFacts.records.values()].filter((record) => record.capitalReading !== null).length}.`,
    "",
    "## Capitals named by hand",
    "",
    ...Object.entries(SUBDIVISION_CAPITALS).map(([code, { item, why: reason }]) => `- **${code}**, ${item}: ${reason}`),
    "",
    "## By country, level 1",
    "",
    "| Country | Level 1 | Capital | Population | Area | Point |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const [alpha2, records] of [...byCountry.entries()].sort((a, b) => byText(a[0], b[0]))) {
    const codes = records.filter((record) => record.level === 1).map((record) => record.code);
    lines.push(`| ${alpha2} | ${codes.length} | ${fields.map((field) => known(codes, field)).join(" | ")} |`);
  }
  lines.push("");
  writeFileSync(join(DOCS, "subdivision-facts.md"), lines.join("\n"));
};



const writeSubdivisions = (): void => {
  mkdirSync(OUT_TABLES, { recursive: true });
  mkdirSync(OUT_ENTRIES, { recursive: true });
  const written = new Set<string>();
  const withSubdivisions = countries.filter((country) => (byCountry.get(country.alpha2) ?? []).length > 0);
  for (const country of withSubdivisions) {
    const records = byCountry.get(country.alpha2)!;
    const types = [...new Set(records.map((record) => record.type).filter((type): type is string => type !== null))].sort(byText);
    const typesJa = types.map((type) => typeWordJa(records.filter((record) => record.type === type)));
    const rows = records.map((record) => {
      const fields = [record.shortCode, record.en, record.ja ?? "", record.type === null ? "" : String(types.indexOf(record.type)), record.parent === null ? "" : record.parent.slice(3), record.reading ?? ""];
      for (const field of fields) if (/[|\n`\\]|\$\{/.test(field)) throw new Error(`${record.code}: "${field}" cannot be written in a row`);
      while (fields.length > 2 && fields[fields.length - 1] === "") fields.pop();

      return fields.join("|");
    });
    const levels = [...new Set(records.map((record) => record.level))].sort();
    const name = lower(country.alpha2);
    const constant = country.alpha2;
    writeFileSync(
      join(OUT_TABLES, `${name}.data.ts`),
      header(`${country.en} (${country.alpha2}): ${records.length} subdivisions, at level ${levels.join(" and ")}.`, [
        CLDR_XML_SOURCE,
        `${WIKIDATA_SOURCE}: kinds of place${records.some((record) => record.jaFrom === "wikidata") ? ", Japanese names CLDR lacks" : ""}${records.some((record) => record.reading !== null) ? ", readings" : ""}`,
      ]) +
        'import type { SubdivisionTable } from "../../rows";\n\n' +
        `const ${constant}: SubdivisionTable = {\n  country: ${literal(country.alpha2)},\n  types: ${literal(types)},\n  typesJa: ${literal(typesJa)},\n  rows: \`${rows.join("\n")}\`,\n};\n\n` +
        `export { ${constant} };\n`,
    );
    writeFileSync(
      join(OUT_ENTRIES, `${name}.ts`),
      [
        "// Generated by scripts/build-data.ts. Do not edit by hand.",
        `// The entry @johnmorrisdotca/kuni/subdivisions/${name}: the ${records.length} subdivisions of ${country.en}, as a list.`,
        "",
        `import { ${constant} } from "../data/subdivisions/${name}.data";`,
        'import { expandSubdivisions } from "../rows";',
        'import type { Subdivision } from "../types";',
        "",
        "/**",
        ` * The subdivisions of ${country.en}, in code order, every level: ${records.length}. Also the default export.`,
        " *",
        " * @example",
        " * ```ts",
        ` * import subdivisions from "@johnmorrisdotca/kuni/subdivisions/${name}";`,
        " *",
        ` * subdivisions.length;    // ${records.length}`,
        ` * subdivisions[0].code;   // ${literal(records[0].code)}`,
        " * ```",
        " */",
        `const SUBDIVISIONS: readonly Subdivision[] = expandSubdivisions(${constant});`,
        "",
        "export default SUBDIVISIONS;",
        "export { SUBDIVISIONS };",
        "",
      ].join("\n"),
    );
    written.add(name);
  }
  // A country that lost its subdivisions loses its files.
  for (const file of readdirSync(OUT_TABLES)) if (file.endsWith(".data.ts") && file !== "index.data.ts" && !written.has(file.slice(0, 2))) rmSync(join(OUT_TABLES, file));
  for (const file of readdirSync(OUT_ENTRIES)) if (file.endsWith(".ts") && !written.has(file.slice(0, 2))) rmSync(join(OUT_ENTRIES, file));

  const names = [...written].sort(byText);
  writeFileSync(
    join(OUT_TABLES, "index.data.ts"),
    header(`Every country's subdivision table (${names.length} countries, ${subdivisions.length} subdivisions), for the /subdivisions entry.`, [CLDR_XML_SOURCE, WIKIDATA_SOURCE]) +
      'import type { SubdivisionTable } from "../../rows";\n' +
      names.map((name) => `import { ${name.toUpperCase()} } from "./${name}.data";`).join("\n") +
      `\n\nconst SUBDIVISION_TABLES: readonly SubdivisionTable[] = [\n${names.map((name) => `  ${name.toUpperCase()},`).join("\n")}\n];\n\nexport { SUBDIVISION_TABLES };\n`,
  );
  writeFileSync(
    join(OUT_DATA, "loaders.data.ts"),
    header(`One dynamic import for each of the ${names.length} countries with subdivisions, so a bundler makes a chunk of each.`, [CLDR_XML_SOURCE]) +
      'import type { Subdivision } from "../types";\n\n' +
      "type Loader = () => Promise<{ SUBDIVISIONS: readonly Subdivision[] }>;\n\n" +
      `const LOADERS: Readonly<Record<string, Loader>> = {\n${names.map((name) => `  ${name}: () => import("../subdivisions/${name}.js"),`).join("\n")}\n};\n\n` +
      "export { LOADERS };\nexport type { Loader };\n",
  );
};

// Where CLDR and Wikidata both have a Japanese name and they are not the same name, for a reader to judge.
// CLDR's name is the one kept, unless the name is overridden (JA_NAME_OVERRIDES), which is listed as resolved.
const writeDisagreements = (): void => {
  const differ = subdivisions.filter((record) => record.jaFrom === "cldr" && record.wikidataJa !== null && key(record.wikidataJa) !== key(record.ja!));
  const compared = subdivisions.filter((record) => record.jaFrom === "cldr" && record.wikidataJa !== null).length;
  const overridden = subdivisions.filter((record) => record.jaFrom === "override");
  const cell = (text: string | null): string => (text === null ? "" : text.replace(/\|/g, "\\|"));
  const lines = [
    "# Japanese names: where CLDR and Wikidata disagree",
    "",
    "Written by `pnpm data` (scripts/build-data.ts); do not edit by hand.",
    "",
    `For ${compared} subdivisions both Unicode CLDR ${versions.cldrNames} and Wikidata (snapshot \`${wikidataFile.path}\`) have a Japanese`,
    `name. For ${differ.length} of them the two are not the same name once case, width, kana and punctuation are folded away. The`,
    "package keeps CLDR's name (after the bracket rule in [name-rules.md](name-rules.md)), except for the overridden names",
    "under Resolved. This list is for a reader of Japanese to judge which is right; most of the differences are a",
    "type word one source adds (州, 県, 地域圏) or a different spelling of a foreign name in katakana.",
    "",
    `## Resolved by an override, ${overridden.length}`,
    "",
    "A reviewer found these CLDR names wrong, out of date or naming another place. `JA_NAME_OVERRIDES` in",
    "`scripts/data-config.ts` replaces them, and the reason is beside each. They are no longer disagreements.",
    "",
    "| Code | English | CLDR | Wikidata | Kept | Why |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const record of overridden) lines.push(`| ${record.code} | ${cell(record.en)} | ${cell(record.cldrJa)} | ${cell(record.wikidataJa)} | ${cell(record.ja)} | ${cell(record.why)} |`);
  lines.push(
    "",
    `## English names corrected, ${Object.keys(EN_NAME_OVERRIDES).length}`,
    "",
    "Every English name is checked against Wikidata's English label for the patterns in `scripts/en-names.ts` (cut short,",
    "an adjective, marks stripped, swapped, a former place's name). These are corrected by `EN_NAME_OVERRIDES`; the build",
    "stops on a name a check points at that is neither corrected nor accepted below.",
    "",
    "| Code | CLDR | Kept | Why |",
    "| --- | --- | --- | --- |",
    ...Object.entries(EN_NAME_OVERRIDES).map(([code, { en, why }]) => `| ${code} | ${cell(namesEn.get(code.replace("-", "").toLowerCase()) ?? null)} | ${cell(en)} | ${cell(why)} |`),
    "",
    `## English names kept although a check points at them, ${Object.keys(EN_NAME_ACCEPTED).length}`,
    "",
    ...Object.entries(EN_NAME_ACCEPTED).map(([code, why]) => `- **${code}**: ${why}`),
    "",
    `## Codes ISO has changed since CLDR's release`,
    "",
    ...Object.entries(CODE_CHANGES.removed).map(([code, why]) => `- **${code}** withdrawn: ${why}`),
    ...Object.entries(CODE_CHANGES.added).map(([code, { en, why }]) => `- **${code}** ${en} added: ${why}`),
  );
  lines.push("", `## For a native reader, ${Object.keys(JA_OPEN_QUESTIONS).length}`, "");
  lines.push("The names below were reviewed by a strong reader of Japanese, not a native one, who left these as open questions.", "");
  for (const [code, question] of Object.entries(JA_OPEN_QUESTIONS)) {
    const record = subdivisions.find((one) => one.code === code);
    if (record === undefined) throw new Error(`JA_OPEN_QUESTIONS names no subdivision: ${code}`);
    lines.push(`- **${code}** ${record.en}, kept as ${record.ja ?? "(none)"}: ${question}`);
  }
  lines.push("");
  for (const [country, records] of groupBy(differ)) {
    const named = countries.find((one) => one.alpha2 === country)!;
    lines.push(`## ${named.en} (${country}), ${records.length}`, "", "| Code | English | CLDR (kept) | Wikidata |", "| --- | --- | --- | --- |");
    for (const record of records) lines.push(`| ${record.code} | ${record.en.replace(/\|/g, "\\|")} | ${record.ja} | ${record.wikidataJa} |`);
    lines.push("");
  }
  mkdirSync(DOCS, { recursive: true });
  writeFileSync(join(DOCS, "disagreements.md"), lines.join("\n"));
};

// The brackets the build took off CLDR's Japanese names, so that the rule can be seen at work.
const writeNameRules = (): void => {
  const stripped = subdivisions.filter((record) => record.cldrJa !== null && stripBracket(record.cldrJa) !== record.cldrJa);
  const lines = [
    "# Japanese names: the bracket rule",
    "",
    "Written by `pnpm data` (scripts/build-data.ts); do not edit by hand.",
    "",
    `Unicode CLDR ${versions.cldrNames} ends ${stripped.length} of its Japanese subdivision names in a bracket that tells the place`,
    "from one of the same name elsewhere: a country (セント・ポール (ドミニカ国)), a direction (江原道 (北)) or a generic word for a",
    "kind of place (バリンゴ (カウンティ)). In one country's list the bracket is noise, so the build takes it off when the",
    "bracket holds a country's Japanese name, a word in `JA_BRACKET_WORDS` or a spelling in `JA_BRACKET_COUNTRY_NAMES`",
    "(`scripts/data-config.ts`). A bracket holding anything else stays, and a test fails while any shipped name ends in one.",
    "A name that is then overridden shows the override in the last column.",
    "",
    "| Code | English | CLDR | Without the bracket | Shipped |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const record of stripped) lines.push(`| ${record.code} | ${record.en.replace(/\|/g, "\\|")} | ${record.cldrJa} | ${stripBracket(record.cldrJa!)} | ${record.ja} |`);
  lines.push("");
  writeFileSync(join(DOCS, "name-rules.md"), lines.join("\n"));
};

const groupBy = (records: SubdivisionRecord[]): [string, SubdivisionRecord[]][] => {
  const groups = new Map<string, SubdivisionRecord[]>();
  for (const record of records) groups.set(record.country, [...(groups.get(record.country) ?? []), record]);

  return [...groups.entries()].sort((a, b) => byText(a[0], b[0]));
};

// ----- The report ---------------------------------------------------------------------------------------

const gaps = (): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  for (const [country, records] of groupBy(subdivisions.filter((record) => record.ja === null))) out[country] = records.map((record) => record.code);

  return out;
};

const report = (): void => {
  const first = subdivisions.filter((record) => record.level === 1);
  const count = (records: SubdivisionRecord[], test: (record: SubdivisionRecord) => boolean): number => records.filter(test).length;
  const summary = [
    `Countries: ${countries.length} (${count(subdivisions, () => false) + countries.filter((country) => country.kind === "iso").length} ISO, ${countries.filter((country) => country.kind === "user").length} user-assigned)`,
    `Countries with subdivisions: ${byCountry.size}`,
    `Subdivisions: ${subdivisions.length} (level 1: ${first.length}, level 2: ${count(subdivisions, (record) => record.level === 2)}, level 3: ${count(subdivisions, (record) => record.level === 3)})`,
    `Japanese names, level 1: ${count(first, (record) => record.ja !== null)} of ${first.length} (CLDR ${count(first, (record) => record.jaFrom === "cldr")}, overrides ${count(first, (record) => record.jaFrom === "override")}, Wikidata ${count(first, (record) => record.jaFrom === "wikidata")})`,
    `Japanese names, all levels: ${count(subdivisions, (record) => record.ja !== null)} of ${subdivisions.length} (CLDR ${count(subdivisions, (record) => record.jaFrom === "cldr")}, overrides ${count(subdivisions, (record) => record.jaFrom === "override")}, Wikidata ${count(subdivisions, (record) => record.jaFrom === "wikidata")})`,
    `Kinds of place known: ${count(subdivisions, (record) => record.type !== null)} of ${subdivisions.length}`,
    `Country readings: ${countries.filter((country) => country.reading !== null).length}; kanji names without one: ${countries.filter((country) => HAN.test(country.ja) && country.reading === null).map((country) => `${country.alpha2} ${country.ja}`).join(", ") || "none"}`,
    `Regular CLDR codes not reached through the containment tree: ${notReached.length}${notReached.length > 0 ? ` (${notReached.join(", ")})` : ""}`,
  ];
  console.log(summary.join("\n"));
  const lines = ["# Subdivisions without a Japanese name", "", "Written by `pnpm data:report`; do not edit by hand.", "", ...summary.map((line) => `- ${line}`), ""];
  lines.push("Neither Unicode CLDR nor Wikidata has a Japanese name for these, so their `name.ja` is `null`.", "");
  for (const [country, records] of groupBy(subdivisions.filter((record) => record.ja === null))) {
    const named = countries.find((one) => one.alpha2 === country)!;
    lines.push(`## ${named.en} (${country}), ${records.length}`, "");
    for (const record of records) lines.push(`- ${record.code} ${record.en} (level ${record.level})`);
    lines.push("");
  }
  writeFileSync(join(DOCS, "ja-gaps.md"), lines.join("\n"));
  const types = new Map<string, Map<string, number>>();
  for (const record of first) {
    const kinds = types.get(record.country) ?? new Map<string, number>();
    kinds.set(record.type ?? "(none)", (kinds.get(record.type ?? "(none)") ?? 0) + 1);
    types.set(record.country, kinds);
  }
  if (args.includes("--types")) for (const [country, kinds] of types) console.log(country, [...kinds].map(([kind, n]) => `${kind} ${n}`).join(", "));
  if (ACCEPT) {
    writeFileSync(EXPECTED_GAPS, `${JSON.stringify(gaps(), null, 2)}\n`);
    console.log(`Wrote ${EXPECTED_GAPS}`);
  }
};

if (REPORT) {
  report();
} else {
  mkdirSync(OUT_DATA, { recursive: true });
  writeCountries();
  writeSubdivisions();
  writeDisagreements();
  writeNameRules();
  writeFacts();
  writeSubdivisionFacts();
  writeGroupings();
  writeWithdrawn();
  console.log(`Wrote ${countries.length} countries and ${subdivisions.length} subdivisions of ${byCountry.size} countries.`);
}
