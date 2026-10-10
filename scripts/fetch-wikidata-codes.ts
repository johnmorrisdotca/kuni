// Asks Wikidata (CC0) once for the country codes that CLDR does not carry, and keeps the answer in the
// repository as data-sources/wikidata-codes-<day>.json, so that scripts/build-data.ts never touches the network:
//
//   - for every item holding an ISO 3166-1 alpha-2 code (P297): its International Olympic Committee country
//     code (P984), the code of a National Olympic Committee ("JPN", "GER", "SUI");
//   - for every item holding an ISO 3166-3 code (P773), the four letters that mark a country as withdrawn from
//     ISO 3166-1: the item, its English and Japanese labels, when it began (P571) and ended (P576), every alpha-2
//     (P297), alpha-3 (P298) and numeric (P299) code it held with the rank, start and end of each statement, and
//     what replaced it (P1366) or followed it (P156), each with the alpha-2 code the successor holds now.
//
//   pnpm data:codes
//
// The answer is sorted and grouped by code, so a later run shows as a readable diff. A new file is a new day's
// snapshot, and the older one is removed; build-data.ts reads the one sources.json names.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, recordFile, sha256, SOURCES_DIR, USER_AGENT, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";

const QUERIES = {
  ioc: `SELECT ?code ?item ?ioc WHERE {
  ?item p:P297 ?statement .
  ?statement ps:P297 ?code ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  ?item wdt:P984 ?ioc .
}`,
  items: `SELECT ?iso3 ?item ?en ?ja ?began ?ended WHERE {
  ?item wdt:P773 ?iso3 .
  OPTIONAL { ?item rdfs:label ?en . FILTER(LANG(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?ja . FILTER(LANG(?ja) = "ja") }
  OPTIONAL { ?item wdt:P571 ?began }
  OPTIONAL { ?item wdt:P576 ?ended }
}`,
  codes: `SELECT ?iso3 ?item ?predicate ?value ?rank ?start ?end WHERE {
  ?item wdt:P773 ?iso3 .
  VALUES ?predicate { p:P297 p:P298 p:P299 }
  ?item ?predicate ?statement .
  ?statement ps:P297|ps:P298|ps:P299 ?value ; wikibase:rank ?rank .
  OPTIONAL { ?statement pq:P580 ?start }
  OPTIONAL { ?statement pq:P582 ?end . FILTER(DATATYPE(?end) = xsd:dateTime) }
}`,
  successors: `SELECT ?iso3 ?item ?successor ?alpha2 WHERE {
  ?item wdt:P773 ?iso3 .
  { ?item wdt:P1366 ?successor } UNION { ?item wdt:P156 ?successor }
  OPTIONAL { ?successor wdt:P297 ?alpha2 }
}`,
};

interface Binding {
  [name: string]: { type: string; value: string } | undefined;
}

// Asks once, and again after a pause when the service is busy (it answers 429, 502, 503 and 504 now and then).
const ask = async (query: string): Promise<Binding[]> => {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, {
      headers: { accept: "application/sparql-results+json", "user-agent": USER_AGENT },
    });
    if (response.ok) return ((await response.json()) as { results: { bindings: Binding[] } }).results.bindings;
    if (attempt === 4 || ![429, 502, 503, 504].includes(response.status)) {
      throw new Error(`Wikidata answered ${response.status}: ${(await response.text()).slice(0, 400)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
  }
};

const qid = (uri: string): string => uri.slice(uri.lastIndexOf("/") + 1);
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const day = (value: string | undefined): string | null => (value === undefined ? null : value.slice(0, 10));
const unique = <T>(list: T[]): T[] => [...new Map(list.map((one) => [JSON.stringify(one), one])).values()];

// Every list sorted by what it holds, so that the same answer is the same file however the endpoint ordered its rows.
const sorted = <T>(list: T[]): T[] => unique(list).sort((a, b) => byText(JSON.stringify(a), JSON.stringify(b)));

const main = async (): Promise<void> => {
  const read = new Date().toISOString().slice(0, 10);
  const answers: Record<string, Binding[]> = {};
  for (const [name, query] of Object.entries(QUERIES)) {
    console.log(`Asking Wikidata for ${name} ...`);
    answers[name] = await ask(query);
    console.log(`${answers[name].length} rows.`);
  }

  const ioc: Record<string, string[]> = {};
  for (const row of answers.ioc) {
    const code = row.code?.value;
    const value = row.ioc?.value;
    if (code === undefined || value === undefined) continue;
    ioc[code] = [...new Set([...(ioc[code] ?? []), value])].sort(byText);
  }

  const withdrawn: Record<string, unknown[]> = {};
  const itemsOf = new Map<string, Record<string, unknown>>();
  for (const row of answers.items) {
    const iso3 = row.iso3?.value;
    const item = row.item?.value;
    if (iso3 === undefined || item === undefined) continue;
    const id = qid(item);
    const found = itemsOf.get(`${iso3}/${id}`) ?? { id, en: row.en?.value ?? null, ja: row.ja?.value ?? null, began: [], ended: [], codes: [], successors: [] };
    itemsOf.set(`${iso3}/${id}`, found);
    for (const [field, value] of [["began", day(row.began?.value)], ["ended", day(row.ended?.value)]] as const) {
      if (value !== null) (found[field] as string[]).push(value);
    }
  }
  for (const row of answers.codes) {
    const found = itemsOf.get(`${row.iso3?.value}/${qid(row.item!.value)}`);
    if (found === undefined) continue;
    (found.codes as unknown[]).push([qid(row.predicate!.value), row.value!.value, row.rank!.value.replace(/^.*#(\w+)Rank$/, "$1").toLowerCase(), day(row.start?.value), day(row.end?.value)]);
  }
  for (const row of answers.successors) {
    const found = itemsOf.get(`${row.iso3?.value}/${qid(row.item!.value)}`);
    if (found === undefined) continue;
    (found.successors as unknown[]).push([qid(row.successor!.value), row.alpha2?.value ?? null]);
  }
  for (const [path, found] of itemsOf) {
    const iso3 = path.slice(0, path.indexOf("/"));
    found.began = [...new Set(found.began as string[])].sort(byText);
    found.ended = [...new Set(found.ended as string[])].sort(byText);
    found.codes = sorted(found.codes as unknown[]);
    found.successors = sorted(found.successors as unknown[]);
    (withdrawn[iso3] ??= []).push(found);
  }
  const ordered = Object.fromEntries(
    Object.keys(withdrawn)
      .sort(byText)
      .map((iso3) => [iso3, withdrawn[iso3].sort((a, b) => Number((a as { id: string }).id.slice(1)) - Number((b as { id: string }).id.slice(1)))]),
  );

  // One line per code: small diffs, and still readable.
  const block = (record: Record<string, unknown>): string =>
    Object.entries(record)
      .sort(([a], [b]) => byText(a, b))
      .map(([code, value]) => `    ${JSON.stringify(code)}: ${JSON.stringify(value)}`)
      .join(",\n");
  const text = `{
  "source": ${JSON.stringify(ENDPOINT)},
  "licence": "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
  "read": ${JSON.stringify(read)},
  "queries": ${JSON.stringify(QUERIES)},
  "columns": {
    "codes": ["property", "value", "rank", "start", "end"],
    "successors": ["item", "alpha2 it holds now, or null"]
  },
  "ioc": {
${block(ioc)}
  },
  "withdrawn": {
${block(ordered)}
  }
}
`;
  const path = `wikidata-codes-${read}.json`;
  mkdirSync(SOURCES_DIR, { recursive: true });
  let manifest = readManifest();
  // One snapshot at a time: the older file goes, and sources.json names the new one.
  for (const old of manifest.files.filter((file) => /^wikidata-codes-\d{4}-\d{2}-\d{2}\.json$/.test(file.path) && file.path !== path)) {
    rmSync(join(SOURCES_DIR, old.path), { force: true });
    manifest = { files: manifest.files.filter((file) => file.path !== old.path) };
  }
  writeFileSync(join(SOURCES_DIR, path), text);
  manifest = recordFile(manifest, {
    path,
    url: ENDPOINT,
    read,
    sha256: sha256(text),
    note: "Wikidata SPARQL answers for IOC codes (P984) and the withdrawn ISO 3166-3 codes (P773) with their former codes and successors; the queries are in the file (CC0)",
  });
  writeManifest(manifest);
  console.log(`Wrote data-sources/${path}: ${Object.keys(ioc).length} IOC codes, ${Object.keys(ordered).length} withdrawn codes.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
