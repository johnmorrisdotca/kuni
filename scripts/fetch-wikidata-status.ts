// Asks Wikidata (CC0) once for what each holder of an ISO 3166-1 alpha-2 code is and whose it is, and keeps the
// answer in the repository as data-sources/wikidata-status-<day>.json, so that scripts/build-data.ts never touches
// the network:
//
//   - what the item is an instance of (P31), with the class's English and Japanese labels, the statement's rank
//     and its end (P582);
//   - the country it is in (P17), with the alpha-2 code that country holds, if it holds one, its English label,
//     the statement's rank and its end (P582);
//   - who claims it (P1336, territory claimed by), with the claimant's alpha-2 code, if it holds one, and its
//     English label.
//
//   pnpm data:status
//
// Three queries, one after another, asked once. The answer is sorted and grouped by code, so a later run shows as
// a readable diff. A new file is a new day's snapshot, and the older one is removed; build-data.ts reads the one
// sources.json names. scripts/status.ts says how the rows become a status, a sovereign and a type.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, recordFile, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh, one query at a time)";

// Every query starts from the same place: the items holding an alpha-2 code by a statement that is not deprecated.
const COUNTRY = `?item p:P297 ?codeStatement .
  ?codeStatement ps:P297 ?code ; wikibase:rank ?codeRank .
  FILTER(?codeRank != wikibase:DeprecatedRank)`;

const QUERIES = {
  classes: `SELECT ?code ?item ?class ?en ?ja ?rank ?end WHERE {
  ${COUNTRY}
  ?item p:P31 ?statement .
  ?statement ps:P31 ?class ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P582 ?end }
  OPTIONAL { ?class rdfs:label ?en . FILTER(LANG(?en) = "en") }
  OPTIONAL { ?class rdfs:label ?ja . FILTER(LANG(?ja) = "ja") }
}`,
  countries: `SELECT ?code ?item ?country ?countryCode ?en ?rank ?end WHERE {
  ${COUNTRY}
  ?item p:P17 ?statement .
  ?statement ps:P17 ?country ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P582 ?end }
  OPTIONAL {
    ?country p:P297 ?countryStatement .
    ?countryStatement ps:P297 ?countryCode ; wikibase:rank ?countryRank .
    FILTER(?countryRank != wikibase:DeprecatedRank)
  }
  OPTIONAL { ?country rdfs:label ?en . FILTER(LANG(?en) = "en") }
}`,
  claims: `SELECT ?code ?item ?claimant ?claimantCode ?en ?rank ?end WHERE {
  ${COUNTRY}
  ?item p:P1336 ?statement .
  ?statement ps:P1336 ?claimant ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?statement pq:P582 ?end }
  OPTIONAL {
    ?claimant p:P297 ?claimantStatement .
    ?claimantStatement ps:P297 ?claimantCode ; wikibase:rank ?claimantRank .
    FILTER(?claimantRank != wikibase:DeprecatedRank)
  }
  OPTIONAL { ?claimant rdfs:label ?en . FILTER(LANG(?en) = "en") }
}`,
};

interface Binding {
  [name: string]: { type: string; value: string } | undefined;
}

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
    await new Promise((resolve) => setTimeout(resolve, attempt * 20000));
  }
};

const qid = (uri: string): string => uri.slice(uri.lastIndexOf("/") + 1);
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const day = (value: string | undefined): string | null => (value === undefined ? null : value.slice(0, 10));
const rankOf = (uri: string): string => uri.replace(/^.*#(\w+)Rank$/, "$1").toLowerCase();

// Every list sorted by what it holds, with no row twice, so that the same answer is the same file however the
// endpoint ordered its rows.
const sorted = (list: unknown[][]): unknown[][] =>
  [...new Map(list.map((one) => [JSON.stringify(one), one])).values()].sort((a, b) => byText(JSON.stringify(a), JSON.stringify(b)));

const main = async (): Promise<void> => {
  const read = new Date().toISOString().slice(0, 10);
  const answers: Record<string, Binding[]> = {};
  for (const [name, query] of Object.entries(QUERIES)) {
    console.log(`Asking Wikidata for ${name} ...`);
    answers[name] = await ask(query);
    console.log(`${answers[name].length} rows.`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const group = (rows: Binding[], row: (one: Binding) => unknown[]): Record<string, unknown[][]> => {
    const byCode: Record<string, unknown[][]> = {};
    for (const one of rows) {
      const code = one.code?.value;
      if (code === undefined || one.item === undefined) continue;
      (byCode[code] ??= []).push([qid(one.item.value), ...row(one)]);
    }
    for (const code of Object.keys(byCode)) byCode[code] = sorted(byCode[code]);

    return byCode;
  };
  const classes = group(answers.classes, (one) => [qid(one.class!.value), one.en?.value ?? null, one.ja?.value ?? null, rankOf(one.rank!.value), day(one.end?.value)]);
  const countries = group(answers.countries, (one) => [qid(one.country!.value), one.countryCode?.value ?? null, one.en?.value ?? null, rankOf(one.rank!.value), day(one.end?.value)]);
  const claims = group(answers.claims, (one) => [qid(one.claimant!.value), one.claimantCode?.value ?? null, one.en?.value ?? null, rankOf(one.rank!.value), day(one.end?.value)]);

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
    "classes": ["item", "class", "class label in English", "class label in Japanese", "rank", "end"],
    "countries": ["item", "country", "alpha2 the country holds, or null", "country label in English", "rank", "end"],
    "claims": ["item", "claimant", "alpha2 the claimant holds, or null", "claimant label in English", "rank", "end"]
  },
  "classes": {
${block(classes)}
  },
  "countries": {
${block(countries)}
  },
  "claims": {
${block(claims)}
  }
}
`;
  const path = `wikidata-status-${read}.json`;
  mkdirSync(SOURCES_DIR, { recursive: true });
  let manifest = readManifest();
  // One snapshot at a time: the older file goes, and sources.json names the new one.
  for (const old of manifest.files.filter((file) => /^wikidata-status-\d{4}-\d{2}-\d{2}\.json$/.test(file.path) && file.path !== path)) {
    rmSync(join(SOURCES_DIR, old.path), { force: true });
    manifest = { files: manifest.files.filter((file) => file.path !== old.path) };
  }
  writeFileSync(join(SOURCES_DIR, path), text);
  manifest = recordFile(manifest, {
    path,
    url: ENDPOINT,
    read,
    sha256: sha256(text),
    note: "Wikidata SPARQL answers for what each ISO 3166-1 code's item is an instance of (P31), the country it is in (P17) and who claims it (P1336); the queries are in the file (CC0)",
  });
  writeManifest(manifest);
  console.log(`Wrote data-sources/${path}: ${Object.keys(classes).length} codes with classes, ${Object.keys(countries).length} with a country, ${Object.keys(claims).length} with a claim.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
