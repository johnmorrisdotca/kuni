// Fetches, from Wikidata, the reading in kana of each city of data-sources/wikidata-cities-<day>.json (P1814, "name in
// kana", best rank), into data-sources/wikidata-city-readings-<day>.json, recorded in sources.json with its SHA-256. Run
// by hand (`node scripts/fetch-readings.ts`), never on a timer, one query at a time. CC0, as all of Wikidata's
// structured data. scripts/cities.ts gives a city its reading from this file only where its Japanese name is
// Wikidata's own label; a name written in kana alone is its own reading.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, recordFile, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh, one query at a time)";
const QUERY = "SELECT ?item ?kana WHERE { VALUES ?item { $ITEMS } ?item p:P1814 ?statement . ?statement a wikibase:BestRank ; ps:P1814 ?kana }";
const PAUSE = 3;

const wait = (seconds: number): Promise<void> => new Promise((done) => setTimeout(done, seconds * 1000));

const ask = async (query: string, tries = 4): Promise<{ item: string; kana: string }[]> => {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { accept: "application/sparql-results+json", "content-type": "application/x-www-form-urlencoded", "user-agent": USER_AGENT },
    body: `format=json&query=${encodeURIComponent(query)}`,
  }).catch(() => null);
  if (response === null || response.status === 429 || response.status >= 500) {
    if (tries <= 1) throw new Error(`Wikidata did not answer: ${response?.status ?? "connection closed"}`);
    await wait(Math.min(Number(response?.headers.get("retry-after")) || 30, 120));

    return ask(query, tries - 1);
  }
  if (!response.ok) throw new Error(`Wikidata answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const rows = (JSON.parse(await response.text()) as { results: { bindings: { item: { value: string }; kana: { value: string } }[] } }).results.bindings;

  return rows.map((row) => ({ item: row.item.value.slice(row.item.value.lastIndexOf("/") + 1), kana: row.kana.value }));
};

const main = async (): Promise<void> => {
  const manifest = readManifest();
  const citiesFile = manifest.files.find((file) => file.path.startsWith("wikidata-cities-"));
  if (citiesFile === undefined) throw new Error("No cities snapshot in data-sources/sources.json");
  const cities = JSON.parse(readFileSync(join(SOURCES_DIR, citiesFile.path), "utf8")) as { items: [number, string | null, string | null, ...unknown[]][] };
  // Only the items with a Japanese label: a reading is of that name.
  const ids = cities.items.filter((item) => item[2] !== null).map((item) => item[0]);
  console.log(`${ids.length} cities with a Japanese label, from ${citiesFile.path}.`);
  const readings = new Map<number, string>();
  for (let at = 0; at < ids.length; at += 1500) {
    if (at > 0) await wait(PAUSE);
    for (const row of await ask(QUERY.replace("$ITEMS", ids.slice(at, at + 1500).map((id) => `wd:Q${id}`).join(" ")))) {
      const id = Number(row.item.slice(1));
      // Two readings of one name: the first in code order is kept, the same on every run.
      const before = readings.get(id);
      if (before === undefined || row.kana < before) readings.set(id, row.kana);
    }
  }
  const read = new Date().toISOString().slice(0, 10);
  const text = `${JSON.stringify({
    source: ENDPOINT,
    licence: "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
    read,
    cities: citiesFile.path,
    query: QUERY,
    columns: ["city item number", "name in kana (P1814, best rank)"],
    readings: [...readings].sort((a, b) => a[0] - b[0]),
  }).replace(/\],\[/g, "],\n[")}\n`;
  const path = `wikidata-city-readings-${read}.json`;
  writeFileSync(join(SOURCES_DIR, path), text);
  writeManifest(recordFile({ files: readManifest().files.filter((file) => !file.path.startsWith("wikidata-city-readings-") || file.path === path) }, { path, url: ENDPOINT, read, sha256: sha256(text), note: "Wikidata SPARQL answers: the reading in kana (P1814) of each city with a Japanese label; the query is in the file (CC0)" }));
  console.log(`Wrote data-sources/${path}: ${readings.size} readings.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
