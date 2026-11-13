// Fetches, from Wikidata (CC0), the elevation above sea level (P2044, best rank, normalised to metres by Wikidata) of each
// city item kuni knows, into data-sources/wikidata-city-elevations-<day>.json, recorded in sources.json with its SHA-256.
// Run by hand from a Mac (`node scripts/fetch-city-elevations.ts`), never on a timer, one query at a time; answers are cached in
// .cities-cache/. The items are those of the cities snapshots and of Natural Earth's places that name an item; which of
// them are cities, and what each keeps of the answer, is decided in scripts/build-data.ts. The time zone (P421) was asked
// for too on 2026-11-13 and left out: of the first 4,500 items 4 had an IANA id (P6687) on their zone, since a city's
// zone is the "Pacific Time Zone" item, which names no IANA zone.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, readSource, recordFile, ROOT, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh, one query at a time)";
const CACHE = join(ROOT, ".cities-cache");
const PAUSE = 3;
const CHUNK = 500;

const QUERIES = {
  elevations: `SELECT ?item ?metres WHERE {
  VALUES ?item { $ITEMS }
  ?item p:P2044 ?statement . ?statement a wikibase:BestRank ; psn:P2044/wikibase:quantityAmount ?metres .
}`,
};

interface Binding {
  [name: string]: { type: string; value: string } | undefined;
}

const wait = (seconds: number): Promise<void> => new Promise((done) => setTimeout(done, seconds * 1000));
const chunks = <T>(list: T[], size: number): T[][] => Array.from({ length: Math.ceil(list.length / size) }, (_, at) => list.slice(at * size, at * size + size));

let asked = 0;
const ask = async (query: string, tries = 4): Promise<Binding[]> => {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${sha256(query).slice(0, 24)}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as Binding[];
  if (asked > 0) await wait(PAUSE);
  asked += 1;
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { accept: "application/sparql-results+json", "content-type": "application/x-www-form-urlencoded", "user-agent": USER_AGENT },
    body: `format=json&query=${encodeURIComponent(query)}`,
  }).catch(() => null);
  if (response === null || response.status === 429 || response.status >= 500) {
    if (tries <= 1) throw new Error(`Wikidata did not answer: ${response?.status ?? "connection closed"}`);
    const seconds = Math.min(Number(response?.headers.get("retry-after")) || 30, 120);
    console.log(`  Wikidata answered ${response?.status ?? "nothing"}; asking again in ${seconds} s.`);
    await wait(seconds);

    return ask(query, tries - 1);
  }
  if (!response.ok) throw new Error(`Wikidata answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const rows = (JSON.parse(await response.text()) as { results: { bindings: Binding[] } }).results.bindings;
  writeFileSync(file, JSON.stringify(rows));

  return rows;
};

// The item number of an entity address, "http://www.wikidata.org/entity/Q1490" is 1490.
const numberOf = (address: string): number => Number(address.slice(address.lastIndexOf("/") + 2));

const main = async (): Promise<void> => {
  const manifest = readManifest();
  const items = new Set<number>();
  for (const file of manifest.files.filter((one) => /^wikidata-cities(-extra)?-\d/.test(one.path))) {
    for (const item of (JSON.parse(readSource(manifest, file.path).text) as { items: [number][] }).items) items.add(item[0]);
  }
  const ne = manifest.files.find((one) => one.path.startsWith("natural-earth-populated-places-"));
  if (ne !== undefined) for (const place of (JSON.parse(readSource(manifest, ne.path).text) as { places: [string][] }).places) if (/^Q\d+$/.test(place[0])) items.add(Number(place[0].slice(1)));
  const list = [...items].sort((a, b) => a - b);
  const elevations = new Map<number, Set<number>>();
  const parts = chunks(list, CHUNK);
  let done = 0;
  for (const part of parts) {
    const values = part.map((number) => `wd:Q${number}`).join(" ");
    for (const row of await ask(QUERIES.elevations.replace("$ITEMS", values))) {
      const number = numberOf(row.item!.value);
      elevations.set(number, (elevations.get(number) ?? new Set()).add(Math.round(Number(row.metres!.value) * 10) / 10));
    }
    done += 1;
    console.log(`  ${done} of ${parts.length} chunks of ${CHUNK} items: ${elevations.size} with an elevation.`);
  }
  const read = new Date().toISOString().slice(0, 10);
  const byNumber = ([a]: [number, unknown], [b]: [number, unknown]): number => a - b;
  const elevationLines = [...elevations.entries()].sort(byNumber).map(([number, set]) => `    ${JSON.stringify([number, [...set].sort((a, b) => a - b)])}`);
  const text = `{
  "source": ${JSON.stringify(ENDPOINT)},
  "licence": "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
  "read": ${JSON.stringify(read)},
  "queries": ${JSON.stringify(QUERIES)},
  "columns": ["item number", "elevations above sea level (P2044, best rank), in metres, as Wikidata normalises them"],
  "items": ${list.length},
  "elevations": [
${elevationLines.join(",\n")}
  ]
}
`;
  const path = `wikidata-city-elevations-${read}.json`;
  writeFileSync(join(SOURCES_DIR, path), text);
  let next = { files: readManifest().files.filter((file) => !file.path.startsWith("wikidata-city-elevations-") || file.path === path) };
  next = recordFile(next, { path, url: ENDPOINT, read, sha256: sha256(text), note: "Wikidata SPARQL answers: the elevations (P2044) of the city items; the queries are in the file" });
  writeManifest(next);
  console.log(`Wrote data-sources/${path}: ${elevations.size} of ${list.length} items have an elevation.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
