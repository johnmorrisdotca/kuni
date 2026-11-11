// Asks Wikidata (CC0) for the world's cities and keeps the answer in the repository as
// data-sources/wikidata-cities-<day>.json, and takes the places of Natural Earth's 10m Populated Places (public
// domain) as a second input, so that scripts/build-data.ts never touches the network:
//
//   pnpm data:cities
//
// By hand from a Mac, never on a timer. Wikidata's endpoint stops a query at 60 seconds, so a join over every item
// with a population is asked in steps, one query at a time with a pause between, and each answer is kept in
// .cities-cache/ (git-ignored) so that a run that stops carries on where it was. `--fresh` empties the cache.
//
//   1. the classes of human settlement (Q486972 and everything below it through P279), once;
//   2. the items with a population (P1082, best rank) of 15,000 or more and coordinates (P625), in bands of
//      population, so each answer is small enough to arrive;
//   3. what each of those items is an instance of (P31), in chunks, keeping those that are a settlement;
//   4. the capitals: the current P36 of every item with an ISO 3166-1 (P297) or ISO 3166-2 (P300) code;
//   5. for every kept item, and every Natural Earth place that names a Wikidata item, in chunks: its English and
//      Japanese labels, its native name (its label in the country's official language, P37 with P424; P1705 only where there is none),
//      its coordinates, its country's alpha-2 code, its best-ranked populations with their dates (P585), and the
//      ISO 3166-2 codes (P300) of itself and of the places it is in (P131, up to four steps).
//
// Natural Earth is read from its own release (nvkelso/natural-earth-vector, tag v5.1.2) and cut down to the columns
// the build uses, in data-sources/natural-earth-populated-places-5.1.2.json; the SHA-256 of the whole release file is
// in sources.json beside it. Places Natural Earth marks "Historic place" are left out.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, recordFile, ROOT, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh, one query at a time)";
const NE_VERSION = "5.1.2";
const NE_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v${NE_VERSION}/geojson/ne_10m_populated_places.geojson`;
const CACHE = join(ROOT, ".cities-cache");
const FLOOR = 15000;
const BANDS = [FLOOR, 20000, 30000, 50000, 100000, 300000, 1000000, 1e9];
const PAUSE = 3;
// Classes that name an area made of cities, or a part of a city, or a unit that holds cities, not a city: a metropolitan or
// urban area, a conurbation, a municipal arrondissement, a ward of Japan (Tokyo's special wards, Q5327704, are kept), a
// city district, a neighbourhood, a metropolitan city of Italy, the districts of Turkey, Moscow, Taiwan and the like. An item
// whose every settlement class is one of these is not a city; one that is also a city or a town stays, and so does every
// capital and every place Natural Earth names.
const AREAS = new Set([
  "Q702492", "Q159313", "Q245260", "Q1907114", "Q111739159", "Q453909", "Q20752426", "Q2342385", "Q124250988", "Q1768043", "Q5951278",
  "Q702842", "Q137773", "Q4286337", "Q15195406", "Q705296", "Q4389092", "Q18559008", "Q851110", "Q856976", "Q3565075", "Q1147395",
  "Q3976659", "Q149621", "Q986065", "Q2367508", "Q123705", "Q188509", "Q10267336", "Q17051044", "Q61089180", "Q15921247", "Q7897276",
  "Q1115575", "Q2755753", "Q211690", "Q192287", "Q56061", "Q15110",
]);

const QUERIES = {
  classes: "SELECT ?t WHERE { ?t wdt:P279* wd:Q486972 }",
  band: `SELECT ?item ?pop WHERE {
  ?item wdt:P1082 ?pop . FILTER(?pop >= $LOW && ?pop < $HIGH)
  ?item wdt:P625 ?coord .
}`,
  kinds: "SELECT ?item ?t WHERE { VALUES ?item { $ITEMS } ?item wdt:P31 ?t }",
  nationalCapitals: `SELECT ?code ?item WHERE {
  ?country p:P297 ?codeStatement . ?codeStatement ps:P297 ?code ; wikibase:rank ?codeRank .
  FILTER(?codeRank != wikibase:DeprecatedRank)
  ?country p:P36 ?statement . ?statement ps:P36 ?item ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  FILTER NOT EXISTS { ?statement pq:P582 ?end }
}`,
  subdivisionCapitals: `SELECT ?code ?item WHERE {
  ?place p:P300 ?codeStatement . ?codeStatement ps:P300 ?code ; wikibase:rank ?codeRank .
  FILTER(?codeRank != wikibase:DeprecatedRank)
  ?place p:P36 ?statement . ?statement ps:P36 ?item ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  FILTER NOT EXISTS { ?statement pq:P582 ?end }
}`,
  languages: `SELECT ?code ?lang WHERE {
  ?country wdt:P297 ?code ; wdt:P37 ?l . ?l wdt:P424 ?lang .
}`,
  names: `SELECT ?item ?en ?ja ?nat ?coord ?code WHERE {
  VALUES ?item { $ITEMS }
  OPTIONAL { ?item rdfs:label ?en . FILTER(LANG(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?ja . FILTER(LANG(?ja) = "ja") }
  OPTIONAL { ?item wdt:P1705 ?nat }
  OPTIONAL { ?item wdt:P625 ?coord }
  OPTIONAL { ?item wdt:P17 ?country . ?country wdt:P297 ?code }
}`,
  ownLanguage: `SELECT ?item ?label ?lang WHERE {
  VALUES (?item ?lang) { $PAIRS }
  ?item rdfs:label ?label . FILTER(LANG(?label) = ?lang)
}`,
  population: `SELECT ?item ?pop ?when WHERE {
  VALUES ?item { $ITEMS }
  ?item p:P1082 ?statement . ?statement a wikibase:BestRank ; ps:P1082 ?pop .
  OPTIONAL { ?statement pq:P585 ?when }
}`,
  // The item's own code and those of the places it is in, up to four steps up (P131 with a star runs out of time).
  subdivisions: `SELECT DISTINCT ?item ?code WHERE {
  VALUES ?item { $ITEMS }
  { ?item wdt:P300 ?code }
  UNION { ?item wdt:P131 ?a . ?a wdt:P300 ?code }
  UNION { ?item wdt:P131/wdt:P131 ?b . ?b wdt:P300 ?code }
  UNION { ?item wdt:P131/wdt:P131/wdt:P131 ?c . ?c wdt:P300 ?code }
  UNION { ?item wdt:P131/wdt:P131/wdt:P131/wdt:P131 ?d . ?d wdt:P300 ?code }
}`,
};

interface Binding {
  [name: string]: { type: string; value: string; "xml:lang"?: string } | undefined;
}

const wait = (seconds: number): Promise<void> => new Promise((done) => setTimeout(done, seconds * 1000));
const qid = (uri: string): string => uri.slice(uri.lastIndexOf("/") + 1);
const num = (id: string): number => Number(id.slice(1));
const day = (value: string | undefined): string | null => (value === undefined ? null : value.slice(0, 10));
const point = (value: string | undefined): [number, number] | null => {
  const found = value === undefined ? null : /^Point\(([-\d.eE]+) ([-\d.eE]+)\)$/.exec(value);

  return found === null ? null : [Number(found[2]), Number(found[1])];
};
const chunks = <T>(list: T[], size: number): T[][] => Array.from({ length: Math.ceil(list.length / size) }, (_, at) => list.slice(at * size, at * size + size));

let asked = 0;
// One query, from the cache when it was asked before; else asked, and kept. The endpoint's 429 is waited out.
const ask = async (query: string, tries = 4): Promise<Binding[]> => {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${sha256(query).slice(0, 24)}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as Binding[];
  if (asked > 0) await wait(PAUSE);
  asked += 1;
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { accept: "application/sparql-results+json", "content-type": "application/x-www-form-urlencoded", "user-agent": USER_AGENT },
      body: `format=json&query=${encodeURIComponent(query)}`,
    });
  } catch (error) {
    // A connection the other side closed: asked again after a wait.
    if (tries <= 1) throw error;
    console.log("  The connection was closed; asking again in 30 s.");
    await wait(30);
    asked = 0;

    return ask(query, tries - 1);
  }
  if (response.status >= 500) {
    const text = await response.text();
    if (/Timeout|timeout|timed out/.test(text)) throw new Error("Wikidata ran out of time on this query");
    if (tries <= 1) throw new Error(`Wikidata answered ${response.status}: ${text.slice(0, 300)}`);
  }
  if ((response.status === 429 || response.status >= 500) && tries > 1) {
    const seconds = Math.min(Number(response.headers.get("retry-after")) || 30, 120);
    console.log(`  Wikidata answered ${response.status}; asking again in ${seconds} s.`);
    await wait(seconds);
    asked = 0;

    return ask(query, tries - 1);
  }
  if (!response.ok) throw new Error(`Wikidata answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  let rows: Binding[];
  try {
    rows = (JSON.parse(await response.text()) as { results: { bindings: Binding[] } }).results.bindings;
  } catch (error) {
    if (tries <= 1) throw error;
    console.log("  The answer was cut off; asking again in 20 s.");
    await wait(20);

    return ask(query, tries - 1);
  }
  writeFileSync(file, JSON.stringify(rows));

  return rows;
};

const fill = (query: string, values: Record<string, string>): string => Object.entries(values).reduce((text, [name, value]) => text.replace(`$${name}`, value), query);
const items = (ids: string[]): string => ids.map((id) => `wd:${id}`).join(" ");

// A band of population, split in two when the endpoint cannot answer it in time.
const band = async (low: number, high: number): Promise<Map<string, number[]>> => {
  try {
    const rows = await ask(fill(QUERIES.band, { LOW: String(low), HIGH: String(high) }), 2);
    const found = new Map<string, number[]>();
    for (const row of rows) found.set(qid(row.item!.value), [...(found.get(qid(row.item!.value)) ?? []), Number(row.pop!.value)]);
    console.log(`  ${low} to ${high}: ${found.size} items.`);

    return found;
  } catch (error) {
    const middle = high >= 1e9 ? low * 3 : Math.floor((low + high) / 2);
    if (middle <= low || high - low < 100) throw error;
    console.log(`  ${low} to ${high} did not arrive; asking in two halves.`);
    const merged = await band(low, middle);
    for (const [id, pops] of await band(middle, high)) merged.set(id, pops);

    return merged;
  }
};

interface NePlace {
  id: string | null;
  name: string;
  en: string | null;
  ja: string | null;
  lat: number;
  lon: number;
  pop: number | null;
  kind: string;
  iso: string | null;
  neId: number | null;
}

const naturalEarth = async (): Promise<{ places: NePlace[]; whole: string }> => {
  const cached = join(CACHE, `ne-${NE_VERSION}.geojson`);
  mkdirSync(CACHE, { recursive: true });
  if (!existsSync(cached)) {
    console.log(`Downloading Natural Earth ${NE_VERSION}'s 10m populated places ...`);
    const response = await fetch(NE_URL, { headers: { "user-agent": USER_AGENT } });
    if (!response.ok) throw new Error(`Natural Earth answered ${response.status}`);
    writeFileSync(cached, Buffer.from(await response.arrayBuffer()));
  }
  const bytes = readFileSync(cached);
  const collection = JSON.parse(bytes.toString("utf8")) as { features: { properties: Record<string, unknown> }[] };
  const places: NePlace[] = [];
  for (const { properties: p } of collection.features) {
    if (String(p.FEATURECLA).toLowerCase() === "historic place") continue;
    const text = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);
    const population = Number(p.POP_MAX);
    places.push({
      id: typeof p.WIKIDATAID === "string" && /^Q\d+$/.test(p.WIKIDATAID) ? p.WIKIDATAID : null,
      name: String(p.NAME),
      en: text(p.NAME_EN),
      ja: text(p.NAME_JA),
      lat: Number(Number(p.LATITUDE).toFixed(4)),
      lon: Number(Number(p.LONGITUDE).toFixed(4)),
      pop: population > 0 ? population : null,
      kind: String(p.FEATURECLA),
      iso: typeof p.ISO_A2 === "string" && /^[A-Z]{2}$/.test(p.ISO_A2) ? p.ISO_A2 : null,
      neId: Number.isInteger(Number(p.NE_ID)) && Number(p.NE_ID) > 0 ? Number(p.NE_ID) : null,
    });
  }
  places.sort((a, b) => (a.id ?? "Q9") < (b.id ?? "Q9") ? -1 : a.id === b.id ? (a.name < b.name ? -1 : 1) : 1);

  return { places, whole: sha256(bytes) };
};

const main = async (): Promise<void> => {
  if (process.argv.includes("--fresh")) rmSync(CACHE, { recursive: true, force: true });
  const read = new Date().toISOString().slice(0, 10);

  console.log("Natural Earth ...");
  const ne = await naturalEarth();
  console.log(`  ${ne.places.length} places, ${ne.places.filter((one) => one.id !== null).length} name a Wikidata item.`);

  console.log("Asking Wikidata for the classes of human settlement ...");
  const classes = new Set((await ask(QUERIES.classes)).map((row) => qid(row.t!.value)));
  console.log(`  ${classes.size} classes.`);

  console.log("Asking Wikidata for the items with 15,000 people or more, band by band ...");
  const candidates = new Map<string, number[]>();
  for (let at = 0; at < BANDS.length - 1; at += 1) for (const [id, pops] of await band(BANDS[at]!, BANDS[at + 1]!)) candidates.set(id, pops);
  console.log(`  ${candidates.size} items in all.`);

  const neIds = new Set(ne.places.flatMap((one) => (one.id === null ? [] : [one.id])));
  console.log("Asking what each is an instance of ...");
  const kept = new Set<string>();
  const cityLike = new Set<string>();
  const toCheck = [...candidates.keys()].filter((id) => !neIds.has(id)).sort((a, b) => num(a) - num(b));
  for (const [at, chunk] of chunks(toCheck, 700).entries()) {
    for (const row of await ask(fill(QUERIES.kinds, { ITEMS: items(chunk) }))) {
      if (!classes.has(qid(row.t!.value))) continue;
      kept.add(qid(row.item!.value));
      if (!AREAS.has(qid(row.t!.value))) cityLike.add(qid(row.item!.value));
    }
    if ((at + 1) % 10 === 0) console.log(`  ${(at + 1) * 700} of ${toCheck.length} checked, ${kept.size} are settlements.`);
  }
  console.log(`  ${kept.size} of ${toCheck.length} are settlements.`);

  console.log("Asking for the capitals ...");
  const capitals: Record<string, string[]> = {};
  for (const name of ["nationalCapitals", "subdivisionCapitals"] as const) {
    for (const row of await ask(QUERIES[name])) {
      const id = qid(row.item!.value);
      (capitals[id] ??= []).push(row.code!.value);
    }
  }
  console.log(`  ${Object.keys(capitals).length} capital items.`);

  const base = [...new Set([...kept, ...neIds, ...Object.keys(capitals)])].sort((a, b) => num(a) - num(b));
  const everyone = base;
  console.log(`Asking for the names, places and figures of ${everyone.length} items ...`);
  interface Record_ {
    en: string | null;
    ja: string | null;
    nat: string | null;
    natLang: string | null;
    point: [number, number] | null;
    country: string | null;
    pops: [number, string | null][];
    subs: string[];
  }
  const records = new Map<string, Record_>(everyone.map((id) => [id, { en: null, ja: null, nat: null, natLang: null, point: null, country: null, pops: [], subs: [] }]));
  const languages = new Map<string, string[]>();
  for (const row of await ask(QUERIES.languages)) languages.set(row.code!.value, [...(languages.get(row.code!.value) ?? []), row.lang!.value].sort());
  const natives: Binding[] = [];
  for (const [at, chunk] of chunks(everyone, 400).entries()) {
    const ids = items(chunk);
    for (const row of await ask(fill(QUERIES.names, { ITEMS: ids }))) {
      const one = records.get(qid(row.item!.value))!;
      one.en ??= row.en?.value ?? null;
      one.ja ??= row.ja?.value ?? null;
      if (row.nat !== undefined && one.nat === null) {
        one.nat = row.nat.value;
        one.natLang = row.nat["xml:lang"] ?? null;
      }
      one.point ??= point(row.coord?.value);
      one.country ??= row.code?.value ?? null;
    }
    // The label in the country's official language(s), English left out (it is the English label), for every item with a country.
    const pairs = chunk.flatMap((id) => {
      const one = records.get(id)!;
      if (one.country === null) return [];

      return (languages.get(one.country) ?? []).filter((lang) => lang !== "en").map((lang) => `(wd:${id} "${lang}")`);
    });
    for (const part of chunks(pairs, 800)) natives.push(...(await ask(fill(QUERIES.ownLanguage, { PAIRS: part.join(" ") }))));
    for (const row of await ask(fill(QUERIES.population, { ITEMS: ids }))) records.get(qid(row.item!.value))!.pops.push([Number(row.pop!.value), day(row.when?.value)]);
    for (const row of await ask(fill(QUERIES.subdivisions, { ITEMS: ids }))) records.get(qid(row.item!.value))!.subs.push(row.code!.value);
    if ((at + 1) % 10 === 0) console.log(`  ${Math.min((at + 1) * 400, everyone.length)} of ${everyone.length}.`);
  }
  // The native name is the label in the country's official language: the first language in code order that has one. Only where the
  // country has an official language other than English and none of them has a label is Wikidata's native label (P1705) the
  // fallback; where English is the only official language, the English name is the native one and there is none to give.
  const officialLabels = new Map<string, [string, string][]>();
  for (const row of natives) officialLabels.set(qid(row.item!.value), [...(officialLabels.get(qid(row.item!.value)) ?? []), [row.lang!.value, row.label!.value]]);
  for (const [id, one] of records) {
    const others = one.country === null ? [] : (languages.get(one.country) ?? []).filter((lang) => lang !== "en");
    const found = (officialLabels.get(id) ?? []).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))[0];
    if (found !== undefined) {
      one.nat = found[1];
      one.natLang = found[0];
    } else if (others.length === 0 && one.country !== null && languages.has(one.country)) {
      one.nat = null;
      one.natLang = null;
    }
  }

  // One line an item: [id number, en, ja, native, native language, [lat, lon], country, [[population, day], ...], [subdivision codes], capital codes].
  // An item that is only an area (a metropolitan area, an urban area) is left out, unless Natural Earth names it or it is a capital.
  const output = everyone.filter((id) => neIds.has(id) || id in capitals || cityLike.has(id));
  console.log(`  ${everyone.length - output.length} items that are only an area (a metropolitan area, an urban area) are left out.`);
  const lines = output.map((id) => {
    const one = records.get(id)!;
    const pops = [...new Map(one.pops.map((pop) => [JSON.stringify(pop), pop])).values()].sort((a, b) => ((a[1] ?? "") < (b[1] ?? "") ? -1 : a[1] === b[1] ? a[0] - b[0] : 1));

    return `    ${JSON.stringify([num(id), one.en, one.ja, one.nat, one.natLang, one.point, one.country, pops, [...new Set(one.subs)].sort(), (capitals[id] ?? []).sort()])}`;
  });
  const text = `{
  "source": ${JSON.stringify(ENDPOINT)},
  "licence": "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
  "read": ${JSON.stringify(read)},
  "floor": ${FLOOR},
  "queries": ${JSON.stringify(QUERIES)},
  "columns": ["item number (Q...)", "label en", "label ja", "native label", "native label language", "point [lat, lon]", "country alpha-2 (P17, P297)", "populations [[value, day], ...] (P1082, best rank, P585)", "ISO 3166-2 codes of the item and the places it is in (P300, P131)", "codes of the countries and subdivisions it is the capital of (P36)"],
  "counts": ${JSON.stringify({ classes: classes.size, candidates: candidates.size, settlements: cityLike.size, areas: kept.size - cityLike.size, items: output.length })},
  "items": [
${lines.join(",\n")}
  ]
}
`;

  mkdirSync(SOURCES_DIR, { recursive: true });
  let manifest = readManifest();
  const path = `wikidata-cities-${read}.json`;
  for (const old of manifest.files.filter((file) => file.path.startsWith("wikidata-cities-") && file.path !== path)) {
    rmSync(join(SOURCES_DIR, old.path), { force: true });
    manifest = { files: manifest.files.filter((file) => file.path !== old.path) };
  }
  writeFileSync(join(SOURCES_DIR, path), text);
  manifest = recordFile(manifest, {
    path,
    url: ENDPOINT,
    read,
    sha256: sha256(text),
    note: "Wikidata SPARQL answers for the cities: the items with 15,000 people or more that are a human settlement, every capital, and every item Natural Earth's populated places name; labels, native label, coordinates, country, populations with dates, ISO 3166-2 codes; the queries are in the file (CC0)",
  });
  const nePath = `natural-earth-populated-places-${NE_VERSION}.json`;
  const neText = `${JSON.stringify({ source: NE_URL, licence: "Public domain (https://www.naturalearthdata.com/about/terms-of-use/)", release: NE_VERSION, wholeFileSha256: ne.whole, columns: ["Wikidata item", "NAME", "NAME_EN", "NAME_JA", "latitude", "longitude", "POP_MAX", "FEATURECLA", "ISO_A2", "NE_ID"], places: ne.places.map((one) => [one.id, one.name, one.en, one.ja, one.lat, one.lon, one.pop, one.kind, one.iso, one.neId]) }).replace(/\],\[/g, "],\n[")}\n`;
  writeFileSync(join(SOURCES_DIR, nePath), neText);
  manifest = recordFile(manifest, {
    path: nePath,
    url: NE_URL,
    read,
    sha256: sha256(neText),
    note: `Natural Earth ${NE_VERSION}, 10m Populated Places (public domain), cut down to the columns the build uses, "Historic place" left out; the SHA-256 of the whole file at the address is ${ne.whole}`,
  });
  writeManifest(manifest);
  console.log(`Wrote data-sources/${path} (${Math.round(text.length / 1024)} KB) and data-sources/${nePath} (${Math.round(neText.length / 1024)} KB).`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
