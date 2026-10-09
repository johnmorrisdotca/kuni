// Asks Wikidata (CC0) once for the facts about each country that a form, a profile or a quiz wants and CLDR
// does not carry, and keeps the answer in the repository as data-sources/wikidata-facts-<day>.json, so that
// scripts/build-data.ts never touches the network:
//
//   - the items that hold each ISO 3166-1 alpha-2 code (P297), with whether the item was dissolved (P576), so
//     the build can tell today's country from a former one that held the same code;
//   - each one's capital (P36), with the capital's English and Japanese labels, its coordinates (P625) and the
//     statement's start and end (P580, P582);
//   - its population (P1082) and its area (P2046), the best-ranked statements only, with the day each is for
//     (P585), the area's unit, and what part of the place a figure is for (P518), if it says;
//   - its coordinate location (P625), the point Wikidata gives for the whole country;
//   - the side of the road it drives on (P1622), with its end (P582);
//   - the countries it shares a border with (P47), only those that hold an alpha-2 code themselves, with the
//     statement's end (P582);
//   - the English and Japanese labels and the coordinates of the capitals named by hand in
//     scripts/facts-config.ts (CAPITAL_ITEMS), for the countries whose item names no capital or names it otherwise;
//   - for every ISO 3166-2 code (P300): the same capital, population, area and coordinates, and the capital's name in
//     kana (P1814), for the /subdivision-facts entry, each row naming the item it is about, since some codes are
//     held by two items (a city and the district around it).
//
//   pnpm data:facts
//
// The answer is sorted and grouped by code, so a later run shows as a readable diff. A new file is a new day's
// snapshot, and the older one is removed; build-data.ts reads the one sources.json names.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { CAPITAL_ITEMS } from "./facts-config.ts";
import { readManifest, recordFile, sha256, SOURCES_DIR, USER_AGENT, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";

// Every query starts from the same place: the items holding an alpha-2 code by a statement that is not deprecated.
const COUNTRY = `?item p:P297 ?codeStatement .
  ?codeStatement ps:P297 ?code ; wikibase:rank ?codeRank .
  FILTER(?codeRank != wikibase:DeprecatedRank)`;

// The same for subdivisions, which hold an ISO 3166-2 code.
const SUBDIVISION = `?item p:P300 ?codeStatement .
  ?codeStatement ps:P300 ?code ; wikibase:rank ?codeRank .
  FILTER(?codeRank != wikibase:DeprecatedRank)`;

const QUERIES = {
  items: `SELECT ?code ?item ?dissolved ?codeEnd WHERE {
  ${COUNTRY}
  OPTIONAL { ?item wdt:P576 ?dissolved }
  OPTIONAL { ?codeStatement pq:P582 ?codeEnd }
}`,
  capitals: `SELECT ?code ?item ?capital ?en ?ja ?coord ?rank ?start ?end WHERE {
  ${COUNTRY}
  ?item p:P36 ?statement .
  ?statement ps:P36 ?capital ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P580 ?start }
  OPTIONAL { ?statement pq:P582 ?end }
  OPTIONAL { ?capital rdfs:label ?en . FILTER(LANG(?en) = "en") }
  OPTIONAL { ?capital rdfs:label ?ja . FILTER(LANG(?ja) = "ja") }
  OPTIONAL { ?capital wdt:P625 ?coord }
}`,
  population: `SELECT ?code ?item ?value ?when ?part WHERE {
  ${COUNTRY}
  ?item p:P1082 ?statement .
  ?statement a wikibase:BestRank ; ps:P1082 ?value .
  OPTIONAL { ?statement pq:P585 ?when }
  OPTIONAL { ?statement pq:P518 ?part }
}`,
  area: `SELECT ?code ?item ?amount ?unit ?when ?part WHERE {
  ${COUNTRY}
  ?item p:P2046 ?statement .
  ?statement a wikibase:BestRank ; psv:P2046 ?value .
  ?value wikibase:quantityAmount ?amount ; wikibase:quantityUnit ?unit .
  OPTIONAL { ?statement pq:P585 ?when }
  OPTIONAL { ?statement pq:P518 ?part }
}`,
  points: `SELECT ?code ?item ?coord WHERE {
  ${COUNTRY}
  ?item wdt:P625 ?coord .
}`,
  driving: `SELECT ?code ?item ?side ?rank ?end WHERE {
  ${COUNTRY}
  ?item p:P1622 ?statement .
  ?statement ps:P1622 ?side ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P582 ?end }
}`,
  borders: `SELECT ?code ?item ?other ?otherCode ?rank ?end WHERE {
  ${COUNTRY}
  ?item p:P47 ?statement .
  ?statement ps:P47 ?other ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  ?other p:P297 ?otherStatement .
  ?otherStatement ps:P297 ?otherCode ; wikibase:rank ?otherRank .
  FILTER(?otherRank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P582 ?end }
}`,
  subdivisionCapitals: `SELECT ?code ?item ?capital ?en ?ja ?kana ?coord WHERE {
  ${SUBDIVISION}
  ?item p:P36 ?statement .
  ?statement ps:P36 ?capital ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  FILTER NOT EXISTS { ?statement pq:P582 ?end }
  OPTIONAL { ?capital rdfs:label ?en . FILTER(LANG(?en) = "en") }
  OPTIONAL { ?capital rdfs:label ?ja . FILTER(LANG(?ja) = "ja") }
  OPTIONAL { ?capital wdt:P1814 ?kana }
  OPTIONAL { ?capital wdt:P625 ?coord }
}`,
  subdivisionPopulation: `SELECT ?code ?item ?value ?when ?part WHERE {
  ${SUBDIVISION}
  ?item p:P1082 ?statement .
  ?statement a wikibase:BestRank ; ps:P1082 ?value .
  OPTIONAL { ?statement pq:P585 ?when }
  OPTIONAL { ?statement pq:P518 ?part }
}`,
  subdivisionArea: `SELECT ?code ?item ?amount ?unit ?when ?part WHERE {
  ${SUBDIVISION}
  ?item p:P2046 ?statement .
  ?statement a wikibase:BestRank ; psv:P2046 ?value .
  ?value wikibase:quantityAmount ?amount ; wikibase:quantityUnit ?unit .
  OPTIONAL { ?statement pq:P585 ?when }
  OPTIONAL { ?statement pq:P518 ?part }
}`,
  subdivisionPoints: `SELECT ?code ?item ?coord WHERE {
  ${SUBDIVISION}
  ?item wdt:P625 ?coord .
}`,
  pinned: `SELECT ?code ?capital ?en ?ja ?coord WHERE {
  VALUES (?code ?capital) { ${Object.entries(CAPITAL_ITEMS)
    .map(([code, { item }]) => `("${code}" wd:${item})`)
    .join(" ")} }
  OPTIONAL { ?capital rdfs:label ?en . FILTER(LANG(?en) = "en") }
  OPTIONAL { ?capital rdfs:label ?ja . FILTER(LANG(?ja) = "ja") }
  OPTIONAL { ?capital wdt:P625 ?coord }
}`,
};

type QueryName = keyof typeof QUERIES;

interface Binding {
  [name: string]: { type: string; value: string } | undefined;
}

const wait = (seconds: number): Promise<void> => new Promise((done) => setTimeout(done, seconds * 1000));

// One query, asked again after the wait the endpoint names when it says it is busy (429), up to five times.
const ask = async (query: string, tries = 5): Promise<Binding[]> => {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { accept: "application/sparql-results+json", "content-type": "application/x-www-form-urlencoded", "user-agent": USER_AGENT },
    body: `format=json&query=${encodeURIComponent(query)}`,
  });
  if (response.status === 429 && tries > 1) {
    const seconds = Math.min(Number(response.headers.get("retry-after")) || 30, 120);
    console.log(`  Wikidata is busy; asking again in ${seconds} s.`);
    await wait(seconds);

    return ask(query, tries - 1);
  }
  if (!response.ok) throw new Error(`Wikidata answered ${response.status}: ${(await response.text()).slice(0, 400)}`);
  const body = (await response.json()) as { results: { bindings: Binding[] } };

  return body.results.bindings;
};

const qid = (uri: string): string => uri.slice(uri.lastIndexOf("/") + 1);
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
// "2024-01-01T00:00:00Z" to "2024-01-01"; anything that is not a date is kept as it came.
const day = (value: string | undefined): string | null => (value === undefined ? null : /^-?\d{4,}-\d\d-\d\d/.test(value) ? value.slice(0, value.indexOf("T") < 0 ? undefined : value.indexOf("T")) : value);
// "Point(139.69 35.68)" to [latitude, longitude]: Wikidata writes the longitude first.
const point = (value: string | undefined): [number, number] | null => {
  const found = value === undefined ? null : /^Point\(([-\d.eE]+) ([-\d.eE]+)\)$/.exec(value);

  return found === null ? null : [Number(found[2]), Number(found[1])];
};

// One query's rows as { code: [row, ...] }, each row the values that query asks for, in a fixed order, with
// repeated rows dropped and the rows of a code sorted, so the file is the same however the endpoint ordered them.
const shape: Record<QueryName, (row: Binding) => unknown[]> = {
  items: (row) => [qid(row.item!.value), day(row.dissolved?.value), day(row.codeEnd?.value)],
  capitals: (row) => [qid(row.item!.value), qid(row.capital!.value), row.en?.value ?? null, row.ja?.value ?? null, point(row.coord?.value), row.rank === undefined ? null : qid(row.rank.value), day(row.start?.value), day(row.end?.value)],
  population: (row) => [qid(row.item!.value), Number(row.value!.value), day(row.when?.value), row.part === undefined ? null : qid(row.part.value)],
  area: (row) => [qid(row.item!.value), Number(row.amount!.value), qid(row.unit!.value), day(row.when?.value), row.part === undefined ? null : qid(row.part.value)],
  points: (row) => [qid(row.item!.value), point(row.coord!.value)],
  driving: (row) => [qid(row.item!.value), qid(row.side!.value), qid(row.rank!.value), day(row.end?.value)],
  borders: (row) => [qid(row.item!.value), row.otherCode!.value, qid(row.other!.value), qid(row.rank!.value), day(row.end?.value)],
  pinned: (row) => [qid(row.capital!.value), row.en?.value ?? null, row.ja?.value ?? null, point(row.coord?.value)],
  subdivisionCapitals: (row) => [qid(row.item!.value), qid(row.capital!.value), row.en?.value ?? null, row.ja?.value ?? null, row.kana?.value ?? null, point(row.coord?.value)],
  subdivisionPopulation: (row) => [qid(row.item!.value), Number(row.value!.value), day(row.when?.value), row.part === undefined ? null : qid(row.part.value)],
  subdivisionArea: (row) => [qid(row.item!.value), Number(row.amount!.value), qid(row.unit!.value), day(row.when?.value), row.part === undefined ? null : qid(row.part.value)],
  subdivisionPoints: (row) => [qid(row.item!.value), point(row.coord!.value)],
};

const group = (name: QueryName, rows: Binding[]): Record<string, unknown[][]> => {
  const codes = new Map<string, Map<string, unknown[]>>();
  for (const row of rows) {
    const code = row.code?.value;
    if (code === undefined || !/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/.test(code)) continue;
    const values = shape[name](row);
    const found = codes.get(code) ?? new Map<string, unknown[]>();
    codes.set(code, found);
    found.set(JSON.stringify(values), values);
  }
  const out: Record<string, unknown[][]> = {};
  for (const code of [...codes.keys()].sort(byText)) out[code] = [...codes.get(code)!.entries()].sort((a, b) => byText(a[0], b[0])).map(([, values]) => values);

  return out;
};

// One line per code and query: small diffs, and still readable.
const stringify = (read: string, answers: Record<QueryName, Record<string, unknown[][]>>): string => {
  const block = (record: Record<string, unknown[][]>): string =>
    Object.entries(record)
      .map(([code, rows]) => `      ${JSON.stringify(code)}: ${JSON.stringify(rows)}`)
      .join(",\n");
  const columns: Record<QueryName, string[]> = {
    items: ["item", "dissolved", "codeEnd"],
    capitals: ["item", "capital", "en", "ja", "point [lat, lon]", "rank", "start", "end"],
    population: ["item", "value", "when", "appliesToPart"],
    area: ["item", "amount", "unit", "when", "appliesToPart"],
    points: ["item", "point [lat, lon]"],
    driving: ["item", "side", "rank", "end"],
    borders: ["item", "otherCode", "otherItem", "rank", "end"],
    pinned: ["capital", "en", "ja", "point [lat, lon]"],
    subdivisionCapitals: ["item", "capital", "en", "ja", "kana", "point [lat, lon]"],
    subdivisionPopulation: ["item", "value", "when", "appliesToPart"],
    subdivisionArea: ["item", "amount", "unit", "when", "appliesToPart"],
    subdivisionPoints: ["item", "point [lat, lon]"],
  };

  return `{
  "source": ${JSON.stringify(ENDPOINT)},
  "licence": "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
  "read": ${JSON.stringify(read)},
  "queries": ${JSON.stringify(QUERIES)},
  "columns": ${JSON.stringify(columns)},
  "answers": {
${(Object.keys(QUERIES) as QueryName[]).map((name) => `    ${JSON.stringify(name)}: {\n${block(answers[name])}\n    }`).join(",\n")}
  }
}
`;
};

const main = async (): Promise<void> => {
  const read = new Date().toISOString().slice(0, 10);
  const answers = {} as Record<QueryName, Record<string, unknown[][]>>;
  for (const name of Object.keys(QUERIES) as QueryName[]) {
    console.log(`Asking Wikidata for ${name} ...`);
    const rows = await ask(QUERIES[name]);
    answers[name] = group(name, rows);
    console.log(`  ${rows.length} rows, ${Object.keys(answers[name]).length} codes.`);
    // A pause between queries, so seven in a row are not taken for a flood.
    await wait(5);
  }
  const text = stringify(read, answers);
  const path = `wikidata-facts-${read}.json`;
  mkdirSync(SOURCES_DIR, { recursive: true });
  let manifest = readManifest();
  // One snapshot at a time: the older file goes, and sources.json names the new one.
  for (const old of manifest.files.filter((file) => file.path.startsWith("wikidata-facts-") && file.path !== path)) {
    rmSync(join(SOURCES_DIR, old.path), { force: true });
    manifest = { files: manifest.files.filter((file) => file.path !== old.path) };
  }
  writeFileSync(join(SOURCES_DIR, path), text);
  manifest = recordFile(manifest, {
    path,
    url: ENDPOINT,
    read,
    sha256: sha256(text),
    note: "Wikidata SPARQL answers for each ISO 3166-1 (P297) country and ISO 3166-2 (P300) subdivision: capital, population, area, coordinates, and for countries driving side and borders; the queries are in the file (CC0)",
  });
  writeManifest(manifest);
  console.log(`Wrote data-sources/${path}.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
