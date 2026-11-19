// Fetches, from Wikidata (CC0), what the population figures (P1082) of the city items rest on, into
// data-sources/wikidata-city-populations-<day>.json, recorded in sources.json with its SHA-256. The cities snapshot keeps
// only each item's best-ranked figures and their days; this keeps every figure that is not deprecated, with its rank, its
// day (P585), how it was found (P459: a census, an estimate) and the web sites its references name (P854), so that
// scripts/cities.ts can leave out a figure that is not the city's own count (a site's estimate, a region's figure) and
// use the next. It also lists the items that are an island, an atoll, a reef island or an archipelago (P31): a place of
// the land, not a town, when a town stands on it.
//
// Run by hand from a Mac (`pnpm data:populations`), never on a timer, one query at a time with a pause between; answers are
// cached in .cities-cache/ (git-ignored), so a run that stops carries on. The items are those of the cities snapshots.
// Not every figure is kept (OLDEST, OTHERS): a city's yearly figures since the 1950s choose nothing today.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, readSource, recordFile, ROOT, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh, one query at a time)";
const CACHE = join(ROOT, ".cities-cache");
const PAUSE = 3;
const CHUNK = 250;
// What is kept of an item's figures, so the file stays small: every best-ranked figure (the cities snapshot's); the
// census figures of this day or later; and the latest OTHERS of its other figures (the next, where the best is left out).
const OLDEST = "2000-01-01";
const OTHERS = 2;
// How a figure was found (P459), as the build reads it: a census (a national census of a year is one too), an
// estimate, a register; any other method is kept as its item.
const METHODS: Readonly<Record<string, string>> = {
  Q39825: "census",
  Q26944781: "census",
  Q65059106: "census",
  Q60745365: "census",
  Q791801: "estimate",
  Q965330: "estimate",
  Q29051383: "estimate",
  Q52679562: "estimate",
  Q15911027: "register",
  Q15194024: "register",
  Q6042918: "register",
};
// The classes of land, not towns: island, atoll, reef island, archipelago.
const LAND = ["Q23442", "Q42523", "Q139595919", "Q33837"];

const QUERIES = {
  land: `SELECT ?item ?class WHERE {
  VALUES ?class { $CLASSES }
  ?item wdt:P31 ?class ; wdt:P1082 ?pop .
}`,
  statements: `SELECT ?item ?statement ?pop ?rank ?when ?method ?url WHERE {
  VALUES ?item { $ITEMS }
  ?item p:P1082 ?statement . ?statement ps:P1082 ?pop ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P585 ?when }
  OPTIONAL { ?statement pq:P459 ?method }
  OPTIONAL { ?statement prov:wasDerivedFrom/pr:P854 ?url }
}`,
};

interface Binding {
  [name: string]: { type: string; value: string } | undefined;
}

const wait = (seconds: number): Promise<void> => new Promise((done) => setTimeout(done, seconds * 1000));
const chunks = <T>(list: T[], size: number): T[][] => Array.from({ length: Math.ceil(list.length / size) }, (_, at) => list.slice(at * size, at * size + size));
const numberOf = (address: string): number => Number(address.slice(address.lastIndexOf("/") + 2));
const qid = (address: string): string => address.slice(address.lastIndexOf("/") + 1);
const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
};

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

// One chunk, in two halves when Wikidata cannot answer it whole.
const statementsOf = async (part: number[]): Promise<Binding[]> => {
  try {
    return await ask(QUERIES.statements.replace("$ITEMS", part.map((number) => `wd:Q${number}`).join(" ")), 2);
  } catch (error) {
    if (part.length < 2) throw error;
    console.log(`  ${part.length} items did not arrive; asking in two halves.`);
    const half = Math.ceil(part.length / 2);

    return [...(await statementsOf(part.slice(0, half))), ...(await statementsOf(part.slice(half)))];
  }
};

// [value, day or null, rank (2 preferred, 1 normal), method or null, [reference hosts]]
type Statement = [number, string | null, 1 | 2, string | null, string[]];

const main = async (): Promise<void> => {
  const manifest = readManifest();
  const items = new Set<number>();
  for (const file of manifest.files.filter((one) => /^wikidata-cities(-extra)?-\d/.test(one.path))) {
    for (const item of (JSON.parse(readSource(manifest, file.path).text) as { items: [number][] }).items) items.add(item[0]);
  }
  const list = [...items].sort((a, b) => a - b);

  console.log("Asking which items are islands, atolls, reef islands or archipelagos ...");
  const land: Record<string, number[]> = {};
  for (const row of await ask(QUERIES.land.replace("$CLASSES", LAND.map((one) => `wd:${one}`).join(" ")))) {
    const number = numberOf(row.item!.value);
    if (items.has(number)) land[qid(row.class!.value)] = [...new Set([...(land[qid(row.class!.value)] ?? []), number])].sort((a, b) => a - b);
  }
  console.log(`  ${new Set(Object.values(land).flat()).size} of the items.`);

  console.log(`Asking for the population statements of ${list.length} items ...`);
  const byItem = new Map<number, Map<string, { value: number; day: string | null; rank: 1 | 2; method: string | null; hosts: Set<string> }>>();
  const parts = chunks(list, CHUNK);
  for (const [at, part] of parts.entries()) {
    for (const row of await statementsOf(part)) {
      const number = numberOf(row.item!.value);
      const statements = byItem.get(number) ?? new Map();
      byItem.set(number, statements);
      const key = row.statement!.value;
      const one = statements.get(key) ?? {
        value: Math.round(Number(row.pop!.value)),
        day: row.when === undefined ? null : row.when.value.slice(0, 10),
        rank: row.rank!.value.endsWith("PreferredRank") ? 2 : 1,
        method: null,
        hosts: new Set<string>(),
      };
      if (row.method !== undefined) one.method = METHODS[qid(row.method.value)] ?? one.method ?? qid(row.method.value);
      const host = row.url === undefined ? null : hostOf(row.url.value);
      if (host !== null) one.hosts.add(host);
      statements.set(key, one);
    }
    if ((at + 1) % 10 === 0 || at === parts.length - 1) console.log(`  ${at + 1} of ${parts.length} chunks of ${CHUNK} items.`);
  }

  const lines: string[] = [];
  for (const number of list) {
    const statements = [...(byItem.get(number)?.values() ?? [])];
    if (statements.length === 0) continue;
    const best = Math.max(...statements.map((one) => one.rank));
    const others = statements.filter((one) => one.rank !== best && one.method !== "census").sort((a, b) => ((a.day ?? "") < (b.day ?? "") ? 1 : (a.day ?? "") > (b.day ?? "") ? -1 : b.value - a.value)).slice(0, OTHERS);
    const kept: Statement[] = statements
      .filter((one) => one.rank === best || (one.method === "census" && one.day !== null && one.day >= OLDEST) || others.includes(one))
      .map((one): Statement => [one.value, one.day, one.rank, one.method, [...one.hosts].sort()])
      .sort((a, b) => ((a[1] ?? "") < (b[1] ?? "") ? -1 : (a[1] ?? "") > (b[1] ?? "") ? 1 : a[0] - b[0] || a[2] - b[2]));
    lines.push(`    ${JSON.stringify([number, kept])}`);
  }
  const read = new Date().toISOString().slice(0, 10);
  const text = `{
  "source": ${JSON.stringify(ENDPOINT)},
  "licence": "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
  "read": ${JSON.stringify(read)},
  "queries": ${JSON.stringify({ ...QUERIES, land: QUERIES.land.replace("$CLASSES", LAND.map((one) => `wd:${one}`).join(" ")) })},
  "methods": ${JSON.stringify(METHODS)},
  "kept": ${JSON.stringify(`of the statements (P1082) that are not deprecated: the best-ranked, the census figures of ${OLDEST} or later, and the latest ${OTHERS} others`)},
  "columns": ["item number", "its population statements: [value, day (P585), rank (2 preferred, 1 normal), method (P459: census, estimate, register, else the item), [the hosts of the reference URLs (P854)]]"],
  "items": ${list.length},
  "land": ${JSON.stringify(land)},
  "statements": [
${lines.join(",\n")}
  ]
}
`;
  const path = `wikidata-city-populations-${read}.json`;
  writeFileSync(join(SOURCES_DIR, path), text);
  let next = { files: readManifest().files.filter((file) => !file.path.startsWith("wikidata-city-populations-") || file.path === path) };
  next = recordFile(next, { path, url: ENDPOINT, read, sha256: sha256(text), note: "Wikidata SPARQL answers: the population statements (P1082) of the city items with their rank, day, method and reference hosts, and the items that are land (an island, an atoll); the queries are in the file" });
  writeManifest(next);
  console.log(`Wrote data-sources/${path}: ${lines.length} of ${list.length} items have a figure (${Math.round(text.length / 1024)} KB).`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
