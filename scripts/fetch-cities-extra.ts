// Fetches, from Wikidata (CC0), the cities the main snapshot's query cannot see because Wikidata gives them only a class
// that is not a kind of human settlement: a municipality of the Netherlands (Q2039348) is Nijmegen's only class, so the
// main snapshot (scripts/fetch-cities.ts) has no Nijmegen. Kept in data-sources/wikidata-cities-extra-<day>.json, in the
// main snapshot's columns, recorded in sources.json with its SHA-256; scripts/build-data.ts adds its items to the main
// snapshot's where the main one has no item of that number. Run by hand (`node scripts/fetch-cities-extra.ts`).

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, recordFile, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh, one query at a time)";
// The classes, each with the country whose official language names its places.
const CLASSES: Readonly<Record<string, { country: string; language: string; why: string }>> = {
  Q2039348: { country: "NL", language: "nl", why: "municipality of the Netherlands: Nijmegen, Haarlemmermeer and Zaanstad have no other class" },
};
const FLOOR = 15000;
const OLDEST = "2015-01-01";

const QUERIES = {
  // A municipality dissolved (P576: Zuilen, Kralingen, Nieuwer-Amstel) is no city now.
  items: `SELECT DISTINCT ?item WHERE { ?item wdt:P31 wd:$CLASS ; wdt:P625 ?coord ; wdt:P1082 ?pop . FILTER(?pop >= ${FLOOR}) FILTER NOT EXISTS { ?item wdt:P576 ?end } }`,
  names: `SELECT ?item ?en ?ja ?nat ?coord WHERE {
  VALUES ?item { $ITEMS }
  OPTIONAL { ?item rdfs:label ?en . FILTER(LANG(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?ja . FILTER(LANG(?ja) = "ja") }
  OPTIONAL { ?item rdfs:label ?nat . FILTER(LANG(?nat) = "$LANG") }
  OPTIONAL { ?item wdt:P625 ?coord }
}`,
  population: `SELECT ?item ?pop ?when WHERE {
  VALUES ?item { $ITEMS }
  ?item p:P1082 ?statement . ?statement a wikibase:BestRank ; ps:P1082 ?pop .
  OPTIONAL { ?statement pq:P585 ?when }
}`,
  subdivisions: `SELECT DISTINCT ?item ?code WHERE {
  VALUES ?item { $ITEMS }
  { ?item wdt:P300 ?code }
  UNION { ?item wdt:P131 ?a . ?a wdt:P300 ?code }
  UNION { ?item wdt:P131/wdt:P131 ?b . ?b wdt:P300 ?code }
}`,
  capitals: `SELECT ?item ?code WHERE {
  VALUES ?item { $ITEMS }
  ?place p:P36 ?statement . ?statement ps:P36 ?item ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  FILTER NOT EXISTS { ?statement pq:P582 ?end }
  { ?place wdt:P300 ?code } UNION { ?place wdt:P297 ?code }
}`,
};

interface Binding {
  [name: string]: { value: string } | undefined;
}

const wait = (seconds: number): Promise<void> => new Promise((done) => setTimeout(done, seconds * 1000));
const qid = (uri: string): string => uri.slice(uri.lastIndexOf("/") + 1);

const ask = async (query: string, tries = 4): Promise<Binding[]> => {
  await wait(2);
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { accept: "application/sparql-results+json", "content-type": "application/x-www-form-urlencoded", "user-agent": USER_AGENT },
    body: `format=json&query=${encodeURIComponent(query)}`,
  }).catch(() => null);
  if (response === null || response.status === 429 || response.status >= 500) {
    if (tries <= 1) throw new Error(`Wikidata did not answer: ${response?.status ?? "connection closed"}`);
    await wait(30);

    return ask(query, tries - 1);
  }
  if (!response.ok) throw new Error(`Wikidata answered ${response.status}: ${(await response.text()).slice(0, 300)}`);

  return (JSON.parse(await response.text()) as { results: { bindings: Binding[] } }).results.bindings;
};

type Item = [number, string | null, string | null, string | null, string | null, [number, number] | null, string, [number, string | null][], string[], string[]];

const main = async (): Promise<void> => {
  const items: Item[] = [];
  for (const [klass, { country, language }] of Object.entries(CLASSES)) {
    const ids = (await ask(QUERIES.items.replace("$CLASS", klass))).map((row) => qid(row.item!.value));
    const list = ids.map((id) => `wd:${id}`).join(" ");
    const byId = new Map<string, Item>(ids.map((id) => [id, [Number(id.slice(1)), null, null, null, null, null, country, [], [], []]]));
    for (const row of await ask(QUERIES.names.replace("$ITEMS", list).replace("$LANG", language))) {
      const one = byId.get(qid(row.item!.value))!;
      one[1] ??= row.en?.value ?? null;
      one[2] ??= row.ja?.value ?? null;
      one[3] ??= row.nat?.value ?? null;
      if (one[3] !== null) one[4] = language;
      const found = row.coord === undefined ? null : /^Point\(([-\d.eE]+) ([-\d.eE]+)\)$/.exec(row.coord.value);
      if (found !== null && one[5] === null) one[5] = [Number(found[2]), Number(found[1])];
    }
    for (const row of await ask(QUERIES.population.replace("$ITEMS", list))) {
      const one = byId.get(qid(row.item!.value))!;
      one[7].push([Math.round(Number(row.pop!.value)), row.when === undefined ? null : row.when.value.slice(0, 10)]);
    }
    for (const row of await ask(QUERIES.subdivisions.replace("$ITEMS", list))) byId.get(qid(row.item!.value))![8].push(row.code!.value);
    for (const row of await ask(QUERIES.capitals.replace("$ITEMS", list))) byId.get(qid(row.item!.value))![9].push(row.code!.value);
    for (const one of byId.values()) {
      // A figure older than 2015 is a municipality since merged away: left out with it.
      if (!one[7].some(([, day]) => day !== null && day >= OLDEST)) continue;
      one[7].sort((a, b) => ((a[1] ?? "") < (b[1] ?? "") ? -1 : (a[1] ?? "") > (b[1] ?? "") ? 1 : a[0] - b[0]));
      one[8] = [...new Set(one[8])].sort();
      one[9] = [...new Set(one[9])].sort();
      items.push(one);
    }
  }
  items.sort((a, b) => a[0] - b[0]);
  const read = new Date().toISOString().slice(0, 10);
  const text = `${JSON.stringify({
    source: ENDPOINT,
    licence: "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
    read,
    classes: CLASSES,
    queries: QUERIES,
    columns: ["item number (Q...)", "label en", "label ja", "label in the country's language", "its language", "point [lat, lon]", "country alpha-2 (the class's)", "populations [[value, day], ...] (P1082, best rank, P585)", "ISO 3166-2 codes of the item and the places it is in (P300, P131)", "codes of the places it is the capital of (P36)"],
    items,
  }).replace(/\],\[/g, "],\n[")}\n`;
  const path = `wikidata-cities-extra-${read}.json`;
  writeFileSync(join(SOURCES_DIR, path), text);
  writeManifest(recordFile({ files: readManifest().files.filter((file) => !file.path.startsWith("wikidata-cities-extra-") || file.path === path) }, { path, url: ENDPOINT, read, sha256: sha256(text), note: "Wikidata SPARQL answers: the cities whose only class is no kind of human settlement (a municipality of the Netherlands), in the columns of the main cities snapshot; the queries are in the file (CC0)" }));
  console.log(`Wrote data-sources/${path}: ${items.length} items.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
