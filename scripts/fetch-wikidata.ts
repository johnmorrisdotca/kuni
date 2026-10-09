// Asks Wikidata (CC0) once for what CLDR does not carry, and keeps the answer in the repository as
// data-sources/wikidata-<day>.json, so that scripts/build-data.ts never touches the network:
//
//   - for every ISO 3166-2 code (P300): the item, its Japanese label, its name in kana (P1814) and what it
//     is an instance of (P31, with the class's English label), used to fill CLDR's gaps in Japanese, to
//     give Japan's prefectures their readings, and to say what kind of place each subdivision is;
//   - for every ISO 3166-1 alpha-2 code (P297): the item, its Japanese label, its kana name and its
//     telephone country code (P474).
//
//   pnpm data:wikidata
//
// The answer is sorted and grouped by code, so a later run shows as a readable diff. A new file is a new
// day's snapshot; build-data.ts reads the one sources.json names.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, recordFile, sha256, SOURCES_DIR, USER_AGENT, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";

const SUBDIVISION_QUERY = `SELECT ?code ?item ?ja ?kana ?type ?typeLabel WHERE {
  ?item p:P300 ?statement .
  ?statement ps:P300 ?code ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?item rdfs:label ?ja . FILTER(LANG(?ja) = "ja") }
  OPTIONAL { ?item wdt:P1814 ?kana }
  OPTIONAL { ?item wdt:P31 ?type . ?type rdfs:label ?typeLabel . FILTER(LANG(?typeLabel) = "en") }
}`;

const COUNTRY_QUERY = `SELECT ?code ?item ?ja ?kana ?calling WHERE {
  ?item p:P297 ?statement .
  ?statement ps:P297 ?code ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?item rdfs:label ?ja . FILTER(LANG(?ja) = "ja") }
  OPTIONAL { ?item wdt:P1814 ?kana }
  OPTIONAL { ?item wdt:P474 ?calling }
}`;

interface Binding {
  [name: string]: { type: string; value: string } | undefined;
}

interface WikidataItem {
  id: string; // Q-number
  ja: string | null;
  kana: string[];
  types?: { id: string; label: string }[];
  calling?: string[];
}

interface WikidataSnapshot {
  source: string;
  licence: string;
  read: string;
  queries: { subdivisions: string; countries: string };
  subdivisions: Record<string, WikidataItem[]>;
  countries: Record<string, WikidataItem[]>;
}

const ask = async (query: string): Promise<Binding[]> => {
  const response = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, {
    headers: { accept: "application/sparql-results+json", "user-agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`Wikidata answered ${response.status}: ${(await response.text()).slice(0, 400)}`);
  const body = (await response.json()) as { results: { bindings: Binding[] } };

  return body.results.bindings;
};

const qid = (uri: string): string => uri.slice(uri.lastIndexOf("/") + 1);
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// Rows to { code: [item, ...] }, each item's lists de-duplicated and sorted, so the file is the same for the
// same answer however the endpoint ordered its rows.
const group = (rows: Binding[], withTypes: boolean): Record<string, WikidataItem[]> => {
  const codes = new Map<string, Map<string, WikidataItem>>();
  for (const row of rows) {
    const code = row.code?.value;
    const item = row.item?.value;
    if (code === undefined || item === undefined) continue;
    const items = codes.get(code) ?? new Map<string, WikidataItem>();
    codes.set(code, items);
    const id = qid(item);
    const found: WikidataItem = items.get(id) ?? { id, ja: row.ja?.value ?? null, kana: [], ...(withTypes ? { types: [] } : { calling: [] }) };
    items.set(id, found);
    const kana = row.kana?.value;
    if (kana !== undefined && !found.kana.includes(kana)) found.kana.push(kana);
    const type = row.type?.value;
    const typeLabel = row.typeLabel?.value;
    if (found.types !== undefined && type !== undefined && typeLabel !== undefined && !found.types.some((one) => one.id === qid(type))) {
      found.types.push({ id: qid(type), label: typeLabel });
    }
    const calling = row.calling?.value;
    if (found.calling !== undefined && calling !== undefined && !found.calling.includes(calling)) found.calling.push(calling);
  }
  const out: Record<string, WikidataItem[]> = {};
  for (const code of [...codes.keys()].sort(byText)) {
    out[code] = [...codes.get(code)!.values()]
      .map((item) => ({
        ...item,
        kana: [...item.kana].sort(byText),
        ...(item.types ? { types: [...item.types].sort((a, b) => byText(a.id, b.id)) } : {}),
        ...(item.calling ? { calling: [...item.calling].sort(byText) } : {}),
      }))
      .sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  }

  return out;
};

// One line per code: small diffs, and still readable.
const stringify = (snapshot: WikidataSnapshot): string => {
  const block = (record: Record<string, WikidataItem[]>): string =>
    Object.entries(record)
      .map(([code, items]) => `    ${JSON.stringify(code)}: ${JSON.stringify(items)}`)
      .join(",\n");

  return `{
  "source": ${JSON.stringify(snapshot.source)},
  "licence": ${JSON.stringify(snapshot.licence)},
  "read": ${JSON.stringify(snapshot.read)},
  "queries": ${JSON.stringify(snapshot.queries)},
  "subdivisions": {
${block(snapshot.subdivisions)}
  },
  "countries": {
${block(snapshot.countries)}
  }
}
`;
};

const main = async (): Promise<void> => {
  const read = new Date().toISOString().slice(0, 10);
  console.log("Asking Wikidata for every ISO 3166-2 code ...");
  const subdivisionRows = await ask(SUBDIVISION_QUERY);
  console.log(`${subdivisionRows.length} rows. Asking for every ISO 3166-1 code ...`);
  const countryRows = await ask(COUNTRY_QUERY);
  console.log(`${countryRows.length} rows.`);
  const snapshot: WikidataSnapshot = {
    source: ENDPOINT,
    licence: "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
    read,
    queries: { subdivisions: SUBDIVISION_QUERY, countries: COUNTRY_QUERY },
    subdivisions: group(subdivisionRows, true),
    countries: group(countryRows, false),
  };
  const text = stringify(snapshot);
  const path = `wikidata-${read}.json`;
  mkdirSync(SOURCES_DIR, { recursive: true });
  let manifest = readManifest();
  // One snapshot at a time: the older file goes, and sources.json names the new one.
  // The facts snapshot (wikidata-facts-<day>.json, scripts/fetch-wikidata-facts.ts) is a file of its own and stays.
  for (const old of manifest.files.filter((file) => /^wikidata-\d{4}-\d{2}-\d{2}\.json$/.test(file.path) && file.path !== path)) {
    rmSync(join(SOURCES_DIR, old.path), { force: true });
    manifest = { files: manifest.files.filter((file) => file.path !== old.path) };
  }
  writeFileSync(join(SOURCES_DIR, path), text);
  manifest = recordFile(manifest, {
    path,
    url: ENDPOINT,
    read,
    sha256: sha256(text),
    note: "Wikidata SPARQL answers for ISO 3166-2 (P300) and ISO 3166-1 (P297) codes; the queries are in the file (CC0)",
  });
  writeManifest(manifest);
  console.log(`Wrote data-sources/${path}: ${Object.keys(snapshot.subdivisions).length} subdivision codes, ${Object.keys(snapshot.countries).length} country codes.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
