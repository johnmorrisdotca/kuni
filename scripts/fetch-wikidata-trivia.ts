// Asks Wikidata (CC0) once for when each country began, a fact a quiz wants that the /facts entry does not carry,
// and keeps the answer in the repository as data-sources/wikidata-trivia-<day>.json, so that scripts/build-data.ts
// never touches the network. For every item holding an ISO 3166-1 alpha-2 code (P297): when it began (P571,
// inception), the best-ranked statements, with the precision of each date (9 is a year, 11 a day).
//
//   pnpm data:trivia
//
// One query, asked once. The answer is sorted and grouped by code, so a later run shows as a readable diff. A new
// file is a new day's snapshot, and the older one is removed; build-data.ts reads the one sources.json names.
// scripts/trivia.ts says how the rows become the /trivia entry.
//
// Wikidata's official languages (P37) and national days were read on 2026-11-17 and are not asked for: the first
// gives the United States Spanish, Chamorro and Samoan and no English, where CLDR's own record of official status
// is sound and is what the build uses; the second names 88 countries' days mixed with observances of every kind
// (a National Garlic Day), with nothing to tell the national day apart.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, recordFile, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh, one query at a time)";

const COUNTRY = `?item p:P297 ?codeStatement .
  ?codeStatement ps:P297 ?code ; wikibase:rank ?codeRank .
  FILTER(?codeRank != wikibase:DeprecatedRank)`;

const QUERIES = {
  inception: `SELECT ?code ?item ?time ?precision WHERE {
  ${COUNTRY}
  ?item p:P571 ?statement .
  ?statement a wikibase:BestRank ; psv:P571 ?value .
  ?value wikibase:timeValue ?time ; wikibase:timePrecision ?precision .
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
const sorted = (list: unknown[][]): unknown[][] =>
  [...new Map(list.map((one) => [JSON.stringify(one), one])).values()].sort((a, b) => byText(JSON.stringify(a), JSON.stringify(b)));

const main = async (): Promise<void> => {
  const read = new Date().toISOString().slice(0, 10);
  const answers: Record<string, Binding[]> = {};
  for (const [name, query] of Object.entries(QUERIES)) {
    console.log(`Asking Wikidata for ${name} ...`);
    answers[name] = await ask(query);
    console.log(`${answers[name].length} rows.`);
    await pause(3000);
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
  const snapshot = {
    inception: group(answers.inception, (one) => [one.time!.value, Number(one.precision!.value)]),
  };
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
    "inception": ["item", "time", "precision (9 a year, 10 a month, 11 a day)"]
  },
${Object.entries(snapshot)
  .map(([name, record]) => `  ${JSON.stringify(name)}: {\n${block(record)}\n  }`)
  .join(",\n")}
}
`;
  const path = `wikidata-trivia-${read}.json`;
  mkdirSync(SOURCES_DIR, { recursive: true });
  let manifest = readManifest();
  for (const old of manifest.files.filter((file) => /^wikidata-trivia-\d{4}-\d{2}-\d{2}\.json$/.test(file.path) && file.path !== path)) {
    rmSync(join(SOURCES_DIR, old.path), { force: true });
    manifest = { files: manifest.files.filter((file) => file.path !== old.path) };
  }
  writeFileSync(join(SOURCES_DIR, path), text);
  manifest = recordFile(manifest, {
    path,
    url: ENDPOINT,
    read,
    sha256: sha256(text),
    note: "Wikidata SPARQL answers for when each ISO 3166-1 code's item began (P571, best rank, with the date's precision); the query is in the file (CC0)",
  });
  writeManifest(manifest);
  console.log(`Wrote data-sources/${path}: ${Object.keys(snapshot.inception).length} codes with an inception.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
