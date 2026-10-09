// Builds src/data/ from the inputs in data-sources/ and node_modules/, with no network:
//
//   - Unicode CLDR 48.2 (Unicode-3.0): country names in English and Japanese with their short and variant
//     forms (cldr-localenames-full), alpha-3 and numeric codes, currencies, UN M49 regions and the
//     subdivision tree (cldr-core), and subdivision names and validity (the XML in data-sources/cldr/);
//   - Wikidata (CC0), a snapshot in data-sources/: Japanese names where CLDR has none, the kana readings of
//     Japan's prefectures and of kanji country names, calling codes, and what kind of place each is;
//   - countries-list (MIT): each country's own name, capital, continent and languages;
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
  COUNTRY_ALIASES,
  JA_TYPE_WORDS,
  JP_TYPE_BY_SUFFIX,
  READING_FILLS,
  TLD_EXCEPTIONS,
  TYPE_NOISE,
  TYPE_RULES,
} from "./data-config.ts";
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
  zones: string[];
  languages: string[];
  subdivisionType: string | null;
  aliases: string[];
}

interface SubdivisionRecord {
  code: string;
  country: string;
  shortCode: string;
  parent: string | null;
  level: number;
  en: string;
  ja: string | null;
  jaFrom: "cldr" | "wikidata" | null;
  wikidataJa: string | null;
  type: string | null;
  reading: string | null;
}

const CLDR_TAG = "release-48-2";
const NODE_MODULES = join(ROOT, "node_modules");
const OUT_DATA = join(ROOT, "src", "data");
const OUT_TABLES = join(OUT_DATA, "subdivisions");
const OUT_ENTRIES = join(ROOT, "src", "subdivisions");
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
    names.set(match[1], tidy(unescapeXml(match[2])));
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
const wikidataFile = manifest.files.find((file) => file.path.startsWith("wikidata-"));
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
const countriesList = readJson("countries-list/countries.min.json") as Record<string, { name: string; native: string; phone: number[]; continent: string; capital: string; languages: string[] }>;

const versions = { cldrCore: versionOf("cldr-core"), cldrNames: versionOf("cldr-localenames-full"), countriesList: versionOf("countries-list") };
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

const countries: CountryRecord[] = alpha2Codes.map((alpha2) => {
  const mapping = codeMappings[alpha2] ?? {};
  const listed = countriesList[alpha2];
  if (listed === undefined) throw new Error(`countries-list has no ${alpha2}`);
  const en = tidy(territoriesEn[alpha2]);
  const ja = tidy(territoriesJa[alpha2]);
  if (!JAPANESE.test(ja)) throw new Error(`CLDR's Japanese name for ${alpha2} is ${ja}`);
  const native = tidy(listed.native);
  const shortEn = territoriesEn[`${alpha2}-alt-short`] ?? null;
  const shortJa = territoriesJa[`${alpha2}-alt-short`] ?? null;
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
  if (!(CONTINENTS as readonly string[]).includes(listed.continent)) throw new Error(`${alpha2} is in continent ${listed.continent}`);

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
    continent: listed.continent,
    subregion: subregionOf.get(alpha2) ?? null,
    calling: callingOf(alpha2),
    currencies: currenciesOf(alpha2),
    tld: TLD_EXCEPTIONS[alpha2] ?? (tlds.has(alpha2.toLowerCase()) ? alpha2.toLowerCase() : null),
    capital: listed.capital.trim() === "" ? null : listed.capital.trim(),
    zones: zonesOf.get(alpha2) ?? [],
    languages: listed.languages,
    subdivisionType: null,
    aliases,
  };
});

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

const subdivisions: SubdivisionRecord[] = [];
const notReached: string[] = [];
const noEnglish: string[] = [];
const reached = new Set<string>();

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
    const territory = overlong.get(id);
    const en = namesEn.get(id) ?? (territory === undefined ? undefined : tidy(territoriesEn[territory]));
    if (en === undefined || en === "") {
      noEnglish.push(code);
      continue;
    }
    const items = currentItems(wikidata.subdivisions[code]);
    const cldrJaName = namesJa.get(id) ?? (territory === undefined ? null : tidy(territoriesJa[territory]));
    // Wikidata's Japanese label, only when the items agree on it and it is written in Japanese: a Latin
    // label or one with a disambiguation in brackets is not a name.
    const labels = [...new Set(items.map((item) => item.ja).filter((label): label is string => label !== null).map(tidy))];
    const wikidataJa = labels.length === 1 && JAPANESE.test(labels[0]) && !/[()（）]/.test(labels[0]) ? labels[0] : null;
    const ja = cldrJaName ?? wikidataJa;
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
      jaFrom: cldrJaName !== null ? "cldr" : wikidataJa !== null ? "wikidata" : null,
      wikidataJa,
      type,
      reading: country === "JP" ? readingFor(code, ja, items) : null,
    });
    if (level >= 3 && children.length > 0) throw new Error(`${code} has subdivisions below level 3`);
    walk(country, children, id, level + 1);
  }
};

for (const country of countries) {
  const top = subdivisionContainment[country.alpha2]?._contains ?? [];
  walk(country.alpha2, top, null, 1);
}
for (const id of regular) if (!reached.has(id)) notReached.push(isoOf(id));
if (noEnglish.length > 0) throw new Error(`No English name in CLDR for ${noEnglish.join(", ")}`);
subdivisions.sort((a, b) => byText(a.code, b.code));

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
    joined(country.zones, " "),
    joined(country.languages, " "),
    country.subdivisionType,
    joined(country.aliases, "|"),
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
      `const COUNTRY_CODES = [\n${codes.map((code, index) => `${index % 16 === 0 ? "  " : " "}${literal(code)},${index % 16 === 15 || index === codes.length - 1 ? "\n" : ""}`).join("")}] as const;\n\n` +
      "type CountryCode = (typeof COUNTRY_CODES)[number];\n\n" +
      "export { COUNTRY_CODES };\nexport type { CountryCode };\n",
  );
  writeFileSync(
    join(OUT_DATA, "countries.data.ts"),
    header(`Every country (${countries.length}), one row each; src/rows.ts says what the columns are.`, [
      `${CLDR_SOURCE}: names, short names, variants, codes, currencies, regions`,
      `${WIKIDATA_SOURCE}: calling codes, readings`,
      `${LIST_SOURCE}: own names, capitals, continents, languages`,
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

const lower = (alpha2: string): string => alpha2.toLowerCase();

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
        `// The subdivisions of ${country.en}, in code order, every level.`,
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
// CLDR's name is the one kept.
const writeDisagreements = (): void => {
  const differ = subdivisions.filter((record) => record.jaFrom === "cldr" && record.wikidataJa !== null && key(record.wikidataJa) !== key(record.ja!));
  const compared = subdivisions.filter((record) => record.jaFrom === "cldr" && record.wikidataJa !== null).length;
  const lines = [
    "# Japanese names: where CLDR and Wikidata disagree",
    "",
    "Written by `pnpm data` (scripts/build-data.ts); do not edit by hand.",
    "",
    `For ${compared} subdivisions both Unicode CLDR ${versions.cldrNames} and Wikidata (snapshot \`${wikidataFile.path}\`) have a Japanese`,
    `name. For ${differ.length} of them the two are not the same name once case, width, kana and punctuation are folded away. The`,
    "package keeps CLDR's name. This list is for a reader of Japanese to judge which is right; most of the differences are a",
    "type word one source adds (州, 県, 地域圏) or a different spelling of a foreign name in katakana.",
    "",
  ];
  for (const [country, records] of groupBy(differ)) {
    const named = countries.find((one) => one.alpha2 === country)!;
    lines.push(`## ${named.en} (${country}), ${records.length}`, "", "| Code | English | CLDR (kept) | Wikidata |", "| --- | --- | --- | --- |");
    for (const record of records) lines.push(`| ${record.code} | ${record.en.replace(/\|/g, "\\|")} | ${record.ja} | ${record.wikidataJa} |`);
    lines.push("");
  }
  mkdirSync(DOCS, { recursive: true });
  writeFileSync(join(DOCS, "disagreements.md"), lines.join("\n"));
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
    `Japanese names, level 1: ${count(first, (record) => record.ja !== null)} of ${first.length} (CLDR ${count(first, (record) => record.jaFrom === "cldr")}, Wikidata ${count(first, (record) => record.jaFrom === "wikidata")})`,
    `Japanese names, all levels: ${count(subdivisions, (record) => record.ja !== null)} of ${subdivisions.length} (CLDR ${count(subdivisions, (record) => record.jaFrom === "cldr")}, Wikidata ${count(subdivisions, (record) => record.jaFrom === "wikidata")})`,
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
  console.log(`Wrote ${countries.length} countries and ${subdivisions.length} subdivisions of ${byCountry.size} countries.`);
}
