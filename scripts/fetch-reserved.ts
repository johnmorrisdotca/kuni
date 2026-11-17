// Reads, once, the two inputs of the /reserved entry (the places that have a code or a flag in common use and are
// no country of ISO 3166-1), and keeps them in the repository so that scripts/build-data.ts never touches the
// network:
//
//   - IANA's Language Subtag Registry, cut down to its two-letter region subtags: each one's subtag, description,
//     the day it was added and the day it was deprecated, as data-sources/iana/language-subtag-regions.json;
//   - Wikidata (CC0), for the items scripts/reserved-config.ts names: the English and Japanese labels, what each is
//     an instance of (P31), the country it is in (P17) and who claims it (P1336) with the alpha-2 code each holds,
//     its ISO 3166-2 codes (P300), its best-ranked populations (P1082) and the day it was dissolved (P576), as
//     data-sources/wikidata-reserved-<day>.json.
//
//   pnpm data:reserved
//
// Seven requests, one after another, asked once. The answers are sorted, so a later run shows as a readable diff.
// A new Wikidata file is a new day's snapshot, and the older one is removed.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { DE_FACTO, RESERVED_ITEMS, USER_ASSIGNED } from "./reserved-config.ts";
import { readManifest, recordFile, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";
const REGISTRY = "https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh, one query at a time)";

const ITEMS = [...Object.values(RESERVED_ITEMS).flatMap((one) => one.items), ...Object.values(USER_ASSIGNED).map((one) => one.item), ...Object.values(DE_FACTO).map((one) => one.item)];
const VALUES = `VALUES ?item { ${ITEMS.map((item) => `wd:${item}`).join(" ")} }`;
const HOLDER = (name: string): string => `OPTIONAL {
    ?${name} p:P297 ?${name}Statement .
    ?${name}Statement ps:P297 ?${name}Code ; wikibase:rank ?${name}Rank .
    FILTER(?${name}Rank != wikibase:DeprecatedRank)
  }
  OPTIONAL { ?${name} rdfs:label ?en . FILTER(LANG(?en) = "en") }`;

const QUERIES = {
  labels: `SELECT ?item ?en ?ja WHERE {
  ${VALUES}
  OPTIONAL { ?item rdfs:label ?en . FILTER(LANG(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?ja . FILTER(LANG(?ja) = "ja") }
}`,
  classes: `SELECT ?item ?class ?en ?rank ?end WHERE {
  ${VALUES}
  ?item p:P31 ?statement .
  ?statement ps:P31 ?class ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P582 ?end }
  OPTIONAL { ?class rdfs:label ?en . FILTER(LANG(?en) = "en") }
}`,
  countries: `SELECT ?item ?country ?countryCode ?en ?rank ?end WHERE {
  ${VALUES}
  ?item p:P17 ?statement .
  ?statement ps:P17 ?country ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P582 ?end }
  ${HOLDER("country")}
}`,
  claims: `SELECT ?item ?claimant ?claimantCode ?en ?rank ?end WHERE {
  ${VALUES}
  ?item p:P1336 ?statement .
  ?statement ps:P1336 ?claimant ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P582 ?end }
  ${HOLDER("claimant")}
}`,
  subdivisions: `SELECT ?item ?code ?rank ?end WHERE {
  ${VALUES}
  ?item p:P300 ?statement .
  ?statement ps:P300 ?code ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P582 ?end }
}`,
  facts: `SELECT ?item ?population ?when ?dissolved WHERE {
  ${VALUES}
  OPTIONAL {
    ?item p:P1082 ?statement .
    ?statement a wikibase:BestRank ; ps:P1082 ?population .
    OPTIONAL { ?statement pq:P585 ?when }
  }
  OPTIONAL { ?item wdt:P576 ?dissolved }
}`,
};

interface Binding {
  [name: string]: { type: string; value: string } | undefined;
}

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Asks once, and again after a pause when the service is busy (it answers 429, 502, 503 and 504 now and then).
const ask = async (query: string): Promise<Binding[]> => {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { accept: "application/sparql-results+json", "content-type": "application/x-www-form-urlencoded", "user-agent": USER_AGENT },
      body: `query=${encodeURIComponent(query)}`,
    });
    if (response.ok) return ((await response.json()) as { results: { bindings: Binding[] } }).results.bindings;
    if (attempt === 3 || ![429, 502, 503, 504].includes(response.status)) {
      throw new Error(`Wikidata answered ${response.status}: ${(await response.text()).slice(0, 400)}`);
    }
    await pause(attempt * 20000);
  }
};

const qid = (uri: string): string => uri.slice(uri.lastIndexOf("/") + 1);
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const day = (value: string | undefined): string | null => (value === undefined ? null : value.slice(0, 10));
const rankOf = (uri: string): string => uri.replace(/^.*#(\w+)Rank$/, "$1").toLowerCase();
const sorted = (list: unknown[][]): unknown[][] =>
  [...new Map(list.map((one) => [JSON.stringify(one), one])).values()].sort((a, b) => byText(JSON.stringify(a), JSON.stringify(b)));
const block = (record: Record<string, unknown>): string =>
  Object.entries(record)
    .sort(([a], [b]) => byText(a, b))
    .map(([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)}`)
    .join(",\n");

// The registry's records are separated by a line of %%; a field runs on over lines that start with spaces.
const regionsOf = (text: string): { fileDate: string; regions: (string | null)[][] } => {
  const fileDate = /^File-Date: (\d{4}-\d{2}-\d{2})/.exec(text)?.[1];
  if (fileDate === undefined) throw new Error("The registry has no File-Date");
  const regions: (string | null)[][] = [];
  for (const record of text.split(/\n%%\n/)) {
    const fields = new Map<string, string[]>();
    for (const line of record.replace(/\n\s+/g, " ").split("\n")) {
      const at = line.indexOf(": ");
      if (at > 0) fields.set(line.slice(0, at), [...(fields.get(line.slice(0, at)) ?? []), line.slice(at + 2).trim()]);
    }
    const subtag = fields.get("Subtag")?.[0];
    if (fields.get("Type")?.[0] !== "region" || subtag === undefined || !/^[A-Z]{2}$/.test(subtag)) continue;
    regions.push([subtag, (fields.get("Description") ?? []).join("; "), fields.get("Added")?.[0] ?? null, fields.get("Deprecated")?.[0] ?? null]);
  }

  return { fileDate, regions: regions.sort((a, b) => byText(a[0]!, b[0]!)) };
};

const main = async (): Promise<void> => {
  const read = new Date().toISOString().slice(0, 10);
  mkdirSync(join(SOURCES_DIR, "iana"), { recursive: true });
  let manifest = readManifest();

  console.log("Reading IANA's Language Subtag Registry ...");
  const response = await fetch(REGISTRY, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`IANA answered ${response.status}`);
  const whole = Buffer.from(await response.arrayBuffer());
  const { fileDate, regions } = regionsOf(whole.toString("utf8"));
  const registryText = `{
  "source": ${JSON.stringify(REGISTRY)},
  "fileDate": ${JSON.stringify(fileDate)},
  "read": ${JSON.stringify(read)},
  "columns": ["subtag", "description", "added", "deprecated"],
  "regions": [
${regions.map((row) => `    ${JSON.stringify(row)}`).join(",\n")}
  ]
}
`;
  const registryPath = "iana/language-subtag-regions.json";
  writeFileSync(join(SOURCES_DIR, registryPath), registryText);
  manifest = recordFile(manifest, {
    path: registryPath,
    url: REGISTRY,
    read,
    sha256: sha256(registryText),
    note: `IANA Language Subtag Registry, File-Date ${fileDate}, cut down to its two-letter region subtags (subtag, description, added, deprecated); the SHA-256 of the whole file at the address is ${sha256(whole)}`,
  });
  console.log(`${regions.length} two-letter region subtags, File-Date ${fileDate}.`);

  const answers: Record<string, Binding[]> = {};
  for (const [name, query] of Object.entries(QUERIES)) {
    await pause(3000);
    console.log(`Asking Wikidata for ${name} ...`);
    answers[name] = await ask(query);
    console.log(`${answers[name].length} rows.`);
  }
  const group = (rows: Binding[], row: (one: Binding) => unknown[]): Record<string, unknown[][]> => {
    const byItem: Record<string, unknown[][]> = {};
    for (const one of rows) (byItem[qid(one.item!.value)] ??= []).push(row(one));
    for (const item of Object.keys(byItem)) byItem[item] = sorted(byItem[item]);

    return byItem;
  };
  const holder = (name: string) => (one: Binding): unknown[] => [qid(one[name]!.value), one[`${name}Code`]?.value ?? null, one.en?.value ?? null, rankOf(one.rank!.value), day(one.end?.value)];
  const snapshot = {
    labels: group(answers.labels, (one) => [one.en?.value ?? null, one.ja?.value ?? null]),
    classes: group(answers.classes, (one) => [qid(one.class!.value), one.en?.value ?? null, rankOf(one.rank!.value), day(one.end?.value)]),
    countries: group(answers.countries, holder("country")),
    claims: group(answers.claims, holder("claimant")),
    subdivisions: group(answers.subdivisions, (one) => [one.code!.value, rankOf(one.rank!.value), day(one.end?.value)]),
    facts: group(answers.facts, (one) => [one.population === undefined ? null : Number(one.population.value), day(one.when?.value), day(one.dissolved?.value)]),
  };
  const text = `{
  "source": ${JSON.stringify(ENDPOINT)},
  "licence": "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
  "read": ${JSON.stringify(read)},
  "queries": ${JSON.stringify(QUERIES)},
  "columns": {
    "labels": ["English", "Japanese"],
    "classes": ["class", "class label in English", "rank", "end"],
    "countries": ["country", "alpha2 the country holds, or null", "country label in English", "rank", "end"],
    "claims": ["claimant", "alpha2 the claimant holds, or null", "claimant label in English", "rank", "end"],
    "subdivisions": ["ISO 3166-2 code", "rank", "end"],
    "facts": ["population", "the day it is for", "dissolved"]
  },
${Object.entries(snapshot)
  .map(([name, record]) => `  ${JSON.stringify(name)}: {\n${block(record)}\n  }`)
  .join(",\n")}
}
`;
  const path = `wikidata-reserved-${read}.json`;
  for (const old of manifest.files.filter((file) => /^wikidata-reserved-\d{4}-\d{2}-\d{2}\.json$/.test(file.path) && file.path !== path)) {
    rmSync(join(SOURCES_DIR, old.path), { force: true });
    manifest = { files: manifest.files.filter((file) => file.path !== old.path) };
  }
  writeFileSync(join(SOURCES_DIR, path), text);
  manifest = recordFile(manifest, {
    path,
    url: ENDPOINT,
    read,
    sha256: sha256(text),
    note: "Wikidata SPARQL answers for the places of the /reserved entry (the items scripts/reserved-config.ts names): labels, classes (P31), countries (P17), claimants (P1336), ISO 3166-2 codes (P300), populations (P1082) and the day dissolved (P576); the queries are in the file (CC0)",
  });
  writeManifest(manifest);
  console.log(`Wrote data-sources/${registryPath} and data-sources/${path}: ${ITEMS.length} items.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
