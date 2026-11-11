// Fetches, from Wikidata, the metropolitan areas round the cities of data-sources/wikidata-cities-<day>.json and their
// populations, into data-sources/wikidata-metros-<day>.json, recorded in sources.json with its SHA-256. Run by hand from
// a Mac (`node scripts/fetch-metros.ts`), never on a timer, one query at a time; answers are cached in .cities-cache/.
//   1. the classes of metropolitan area (Q1907114, Q1768043 and Q3175539 and everything below them through P279), once;
//   2. every area of those classes, and their links to the cities of the snapshot, a few hundred areas at a time: the
//      city's P8138 (statistical area) or P361 (part of), or the area's P150 (contains), P527 (has part), P36 (capital),
//      P138 (named after) or P131 (located in) pointing at the city;
//   3. for those areas, their English label and populations (P1082, best rank, with P585).
// Which area is a city's own metro is decided by scripts/cities.ts, not here.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, recordFile, ROOT, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh, one query at a time)";
const CACHE = join(ROOT, ".cities-cache");
const PAUSE = 3;
// Metropolitan areas, statistical areas and functional urban areas. The classes of "urban area" are left out: they hold
// tens of thousands of small localities, and the metro of every great city is a metropolitan area as well.
const ROOTS = ["Q1907114", "Q1768043", "Q3175539"];

const QUERIES = {
  classes: `SELECT DISTINCT ?t WHERE { VALUES ?root { ${ROOTS.map((id) => `wd:${id}`).join(" ")} } ?t wdt:P279* ?root }`,
  members: `SELECT DISTINCT ?area WHERE { VALUES ?class { $CLASSES } ?area wdt:P31 ?class }`,
  linksOut: `SELECT ?city ?area ?how WHERE {
  VALUES ?area { $ITEMS }
  { ?area wdt:P150 ?city . BIND("P150" AS ?how) } UNION { ?area wdt:P527 ?city . BIND("P527" AS ?how) }
  UNION { ?area wdt:P36 ?city . BIND("P36" AS ?how) } UNION { ?area wdt:P138 ?city . BIND("P138" AS ?how) }
  UNION { ?area wdt:P131 ?city . BIND("P131-of" AS ?how) }
}`,
  linksIn: `SELECT ?city ?area ?how WHERE {
  VALUES ?area { $ITEMS }
  { ?city wdt:P8138 ?area . BIND("P8138" AS ?how) } UNION { ?city wdt:P361 ?area . BIND("P361" AS ?how) }
}`,
  areas: `SELECT ?area ?en ?pop ?when WHERE {
  VALUES ?area { $ITEMS }
  OPTIONAL { ?area rdfs:label ?en . FILTER(LANG(?en) = "en") }
  OPTIONAL { ?area p:P1082 ?statement . ?statement a wikibase:BestRank ; ps:P1082 ?pop . OPTIONAL { ?statement pq:P585 ?when } }
}`,
};

interface Binding {
  [name: string]: { type: string; value: string } | undefined;
}

const wait = (seconds: number): Promise<void> => new Promise((done) => setTimeout(done, seconds * 1000));
const qid = (uri: string): string => uri.slice(uri.lastIndexOf("/") + 1);
const chunks = <T>(list: T[], size: number): T[][] => Array.from({ length: Math.ceil(list.length / size) }, (_, at) => list.slice(at * size, at * size + size));

let asked = 0;
// One query, from the cache when it was asked before; else asked, and kept. The endpoint's 429 is waited out.
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
  // Wikidata may cut an answer off, or put raw control characters in a label: both are asked again or read leniently.
  const text = [...(await response.text())].map((char) => (char.charCodeAt(0) < 32 && !"\t\n\r".includes(char) ? " " : char)).join("");
  let rows: Binding[];
  try {
    rows = (JSON.parse(text) as { results: { bindings: Binding[] } }).results.bindings;
  } catch (error) {
    if (tries <= 1) throw error;
    console.log("  The answer was cut off; asking again in 20 s.");
    await wait(20);

    return ask(query, tries - 1);
  }
  writeFileSync(file, JSON.stringify(rows));

  return rows;
};

const main = async (): Promise<void> => {
  const manifest = readManifest();
  const citiesFile = manifest.files.find((file) => file.path.startsWith("wikidata-cities-"));
  if (citiesFile === undefined) throw new Error("No cities snapshot in data-sources/sources.json: run pnpm data:cities first");
  const cities = JSON.parse(readFileSync(join(SOURCES_DIR, citiesFile.path), "utf8")) as { read: string; items: [number, ...unknown[]][] };
  const ids = cities.items.map((item) => `Q${item[0]}`);
  console.log(`${ids.length} cities, from ${citiesFile.path}.`);

  const classes = (await ask(QUERIES.classes)).map((row) => qid(row.t!.value));
  console.log(`${classes.length} classes of metropolitan and urban area.`);

  // Every area of those classes first, then the links of a few hundred areas at a time, both ways; only links to a city of
  // the snapshot are kept. (A city's own P131 to an area is not asked: it brings every school and street in a metro area.)
  const wanted = new Set(ids);
  const members = (await ask(QUERIES.members.replace("$CLASSES", classes.map((id) => `wd:${id}`).join(" ")))).map((row) => qid(row.area!.value));
  console.log(`${members.length} areas of those classes.`);
  const links = new Map<string, [number, number, string]>();
  const groups = chunks(members, 200);
  for (const [at, part] of groups.entries()) {
    const list = part.map((id) => `wd:${id}`).join(" ");
    for (const query of [QUERIES.linksOut, QUERIES.linksIn]) {
      for (const row of await ask(query.replace("$ITEMS", list))) {
        const cityId = qid(row.city!.value);
        if (!wanted.has(cityId)) continue;
        const city = Number(cityId.slice(1));
        const area = Number(qid(row.area!.value).slice(1));
        const how = row.how!.value;
        if (city !== area) links.set(`${city} ${area} ${how}`, [city, area, how]);
      }
    }
    if (at % 10 === 9) console.log(`  links: ${at + 1} of ${groups.length} groups of areas, ${links.size} so far`);
  }
  const areaIds = [...new Set([...links.values()].map((link) => `Q${link[1]}`))];
  console.log(`${links.size} links to ${areaIds.length} areas.`);

  const areas = new Map<number, { en: string | null; pops: [number, string | null][] }>();
  for (const part of chunks(areaIds, 250)) {
    for (const row of await ask(QUERIES.areas.replace("$ITEMS", part.map((id) => `wd:${id}`).join(" ")))) {
      const area = Number(qid(row.area!.value).slice(1));
      const one = areas.get(area) ?? { en: null, pops: [] };
      one.en ??= row.en?.value ?? null;
      const pop = row.pop === undefined ? Number.NaN : Number(row.pop.value);
      if (Number.isFinite(pop) && pop > 0) one.pops.push([Math.round(pop), row.when === undefined ? null : row.when.value.slice(0, 10)]);
      areas.set(area, one);
    }
  }

  const read = new Date().toISOString().slice(0, 10);
  const linkLines = [...links.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1] || (a[2] < b[2] ? -1 : 1)).map((link) => `    ${JSON.stringify(link)}`);
  const areaLines = [...areas.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, one]) => `    ${JSON.stringify([id, one.en, [...new Map(one.pops.map((pop) => [JSON.stringify(pop), pop])).values()].sort((a, b) => ((a[1] ?? "") < (b[1] ?? "") ? -1 : a[1] === b[1] ? a[0] - b[0] : 1))])}`);
  const text = `{
  "source": ${JSON.stringify(ENDPOINT)},
  "licence": "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
  "read": ${JSON.stringify(read)},
  "cities": ${JSON.stringify(citiesFile.path)},
  "queries": ${JSON.stringify({ ...QUERIES, classes: QUERIES.classes })},
  "classes": ${JSON.stringify(classes.sort())},
  "columns": { "links": ["city item number", "area item number", "how they are linked"], "areas": ["area item number", "label en", "populations [[value, day], ...] (P1082, best rank, P585)"] },
  "links": [
${linkLines.join(",\n")}
  ],
  "areas": [
${areaLines.join(",\n")}
  ]
}
`;
  mkdirSync(SOURCES_DIR, { recursive: true });
  const path = `wikidata-metros-${read}.json`;
  writeFileSync(join(SOURCES_DIR, path), text);
  let updated = { files: readManifest().files.filter((file) => !file.path.startsWith("wikidata-metros-") || file.path === path) };
  updated = recordFile(updated, {
    path,
    url: ENDPOINT,
    read,
    sha256: sha256(text),
    note: "Wikidata SPARQL answers for the metropolitan and urban areas round the cities: the areas linked to each city, their English labels and populations with dates; the queries are in the file (CC0)",
  });
  writeManifest(updated);
  console.log(`Wrote data-sources/${path} (${Math.round(text.length / 1024)} KB).`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
