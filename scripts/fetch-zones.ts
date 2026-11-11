// Fetches, from Wikidata, the time zones of each first-level subdivision kuni lists: the IANA ids (P6687) of the zones
// each subdivision's item is in (P421), into data-sources/wikidata-zones-<day>.json, recorded in sources.json with its
// SHA-256. Run by hand from a Mac (`node scripts/fetch-zones.ts`), never on a timer, one query at a time; answers are
// cached in .cities-cache/. Which of the ids a subdivision keeps is decided in scripts/build-data.ts, against zone.tab.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, recordFile, ROOT, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh, one query at a time)";
const CACHE = join(ROOT, ".cities-cache");
const PAUSE = 3;

const QUERIES = {
  zones: `SELECT ?code ?iana WHERE {
  VALUES ?code { $CODES }
  ?sub wdt:P300 ?code ; wdt:P421 ?zone . ?zone wdt:P6687 ?iana .
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

const main = async (): Promise<void> => {
  // The first-level subdivisions kuni lists, from its build (pnpm build first). The path is a variable so the type
  // check, which runs before the build, does not look for the built file.
  const built = "../dist/subdivisions.js";
  const { allSubdivisions } = (await import(built)) as { allSubdivisions: () => readonly { code: string; level: number }[] };
  const listed = allSubdivisions()
    .filter((one) => one.level === 1)
    .map((one) => one.code);
  const zones = new Map<string, Set<string>>();
  for (const part of chunks(listed, 300)) {
    for (const row of await ask(QUERIES.zones.replace("$CODES", part.map((code) => JSON.stringify(code)).join(" ")))) {
      const code = row.code!.value;
      zones.set(code, (zones.get(code) ?? new Set()).add(row.iana!.value));
    }
  }
  const read = new Date().toISOString().slice(0, 10);
  const lines = [...zones.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([code, set]) => `    ${JSON.stringify([code, [...set].sort()])}`);
  const text = `{
  "source": ${JSON.stringify(ENDPOINT)},
  "licence": "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
  "read": ${JSON.stringify(read)},
  "queries": ${JSON.stringify(QUERIES)},
  "columns": ["ISO 3166-2 code (P300)", "IANA ids (P6687) of the zones it is in (P421)"],
  "zones": [
${lines.join(",\n")}
  ]
}
`;
  const path = `wikidata-zones-${read}.json`;
  writeFileSync(join(SOURCES_DIR, path), text);
  let manifest = { files: readManifest().files.filter((file) => !file.path.startsWith("wikidata-zones-") || file.path === path) };
  manifest = recordFile(manifest, { path, url: ENDPOINT, read, sha256: sha256(text), note: "Wikidata SPARQL answers: the IANA ids of the time zones of each first-level subdivision; the query is in the file (CC0)" });
  writeManifest(manifest);
  console.log(`Wrote data-sources/${path}: ${zones.size} of ${listed.length} subdivisions have a zone with an IANA id.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
