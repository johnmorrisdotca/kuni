// Rebuilds data-sources/wikidata-<day>.json from the subset scripts/extract-dump-subset.ts kept out of Wikimedia's dump (MODULES-1599),
// instead of asking query.wikidata.org: its robots.txt disallows the query service and the API for us, and the dump is the file the
// server publishes for exactly this. The snapshot holds the same fields as the SPARQL one of 2026-10-09 did, for the same items:
//
//   - for every ISO 3166-2 code (P300): the item, its Japanese label, its name in kana (P1814) and what it is an instance of
//     (P31, with the class's English label), used to fill CLDR's gaps in Japanese, to give Japan's prefectures their readings, and
//     to say what kind of place each subdivision is;
//   - for every ISO 3166-1 alpha-2 code (P297): the item, its Japanese label, its kana name and its telephone country code (P474).
//
//   node scripts/fetch-wikidata.ts [--day <yyyy-mm-dd>]      the day of the dump subset (dump-subset-<day>.nt)
//
// What the dump cannot say. It is the truthy dump: best-rank direct values only, so an item whose code sits on a statement that is not
// the best rank of its property, and any item that has been added to Wikidata since the last snapshot, are not found by it. The items
// are therefore the ones the newest snapshot already holds, each one checked against the dump for its code, and every value that moved
// is written to docs/wikidata-dump-diff.md with the dump's date, so a rebuild shows what it changed instead of just changing it. The
// snapshots that need qualifiers (dated populations, areas) cannot be rebuilt from this dump at all and stay as they were.
//
// The answer is sorted and grouped by code, so a later run shows as a readable diff. A new file is a new day's snapshot;
// build-data.ts reads the one sources.json names.

import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

import { readManifest, recordFile, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const CACHE_DIR = process.env.KUNI_DATA_CACHE ?? join(homedir(), ".cache", "kuni-data");
const DUMP_URL = "https://dumps.wikimedia.org/wikidatawiki/entities/latest-truthy.nt.bz2";
const DIFF_FILE = join(import.meta.dirname, "..", "docs", "wikidata-dump-diff.md");

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
  dump: { dateModified: string | null; compressedBytes: number; linesRead: number };
  rebuilt: string;
  subdivisions: Record<string, WikidataItem[]>;
  countries: Record<string, WikidataItem[]>;
}

interface Facts {
  ja?: string;
  en?: string;
  kana: string[];
  types: string[];
  calling: string[];
  codes297: string[];
  codes300: string[];
}

const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const byNumber = (a: string, b: string): number => Number(a.slice(1)) - Number(b.slice(1));

const unescape = (text: string): string =>
  text.replace(/\\(?:u([0-9A-Fa-f]{4})|U([0-9A-Fa-f]{8})|(["\\nrt]))/g, (_, short, long, plain) => {
    if (short !== undefined) return String.fromCharCode(parseInt(short, 16));
    if (long !== undefined) return String.fromCodePoint(parseInt(long, 16));

    return { '"': '"', "\\": "\\", n: "\n", r: "\r", t: "\t" }[plain as string]!;
  }).replace(/\u00ad/g, "");

// One line of the subset: <entity> <predicate> object .
const LINE = /^<http:\/\/www\.wikidata\.org\/entity\/(Q\d+)> <([^>]+)> (.+) \.$/;
const LITERAL = /^"((?:[^"\\]|\\.)*)"(?:@([A-Za-z-]+)|\^\^<[^>]+>)?$/;
const ENTITY = /^<http:\/\/www\.wikidata\.org\/entity\/(Q\d+)>$/;

// What the dump says about each wanted item (and, for labels only, about each class an item is an instance of).
const readDump = async (path: string, items: ReadonlySet<string>): Promise<Map<string, Facts>> => {
  const facts = new Map<string, Facts>();
  const at = (id: string): Facts => {
    let found = facts.get(id);
    if (found === undefined) {
      found = { kana: [], types: [], calling: [], codes297: [], codes300: [] };
      facts.set(id, found);
    }

    return found;
  };
  const lines = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
  for await (const line of lines) {
    const match = LINE.exec(line);
    if (match === null) continue;
    const [, id, predicate, object] = match as unknown as [string, string, string, string];
    // rdfs:label is http://www.w3.org/2000/01/rdf-schema#label, so the name is the fragment. A direct claim is
    // http://www.wikidata.org/prop/direct/P300, so the name is the last path segment. The last slash of the label
    // predicate is inside the date, and reading that as the name dropped every label.
    const hash = predicate.lastIndexOf("#");
    const property = hash === -1 ? predicate.slice(predicate.lastIndexOf("/") + 1) : predicate.slice(hash + 1);
    const literal = LITERAL.exec(object);
    if (property === "label") {
      if (literal === null) continue;
      const language = literal[2]?.toLowerCase();
      if (language === "ja" && items.has(id)) at(id).ja = unescape(literal[1]!);
      else if (language === "en") at(id).en = unescape(literal[1]!);
      continue;
    }
    if (!items.has(id)) continue;
    if (property === "P1814" && literal !== null) at(id).kana.push(unescape(literal[1]!));
    else if (property === "P474" && literal !== null) at(id).calling.push(unescape(literal[1]!));
    else if (property === "P297" && literal !== null) at(id).codes297.push(unescape(literal[1]!));
    else if (property === "P300" && literal !== null) at(id).codes300.push(unescape(literal[1]!));
    else if (property === "P31") {
      const type = ENTITY.exec(object);
      if (type !== null) at(id).types.push(type[1]!);
    }
  }

  return facts;
};

const rebuild = (held: Record<string, WikidataItem[]>, facts: Map<string, Facts>, withTypes: boolean, codeOf: (facts: Facts) => string[]): Record<string, WikidataItem[]> => {
  const out: Record<string, WikidataItem[]> = {};
  for (const code of Object.keys(held).sort(byText)) {
    out[code] = held[code]!
      .map((old): WikidataItem => {
        const now = facts.get(old.id);
        // An item the dump does not know, or no longer gives this code, keeps what it held: the diff says so.
        if (now === undefined || !codeOf(now).includes(code)) return old;
        const kana = [...new Set(now.kana)].sort(byText);
        if (withTypes) {
          const ids = [...new Set(now.types)];
          const oldTypes = old.types ?? [];
          const labelOf = (id: string): string => facts.get(id)?.en ?? oldTypes.find((one) => one.id === id)?.label ?? "";
          // Keep the previous order when the set of classes is the same, so a sort does not count as a moved value.
          const kept = oldTypes.filter((one) => ids.includes(one.id)).map((one) => ({ id: one.id, label: labelOf(one.id) }));
          const added = ids
            .filter((id) => !oldTypes.some((one) => one.id === id))
            .sort(byNumber)
            .map((id) => ({ id, label: labelOf(id) }));
          const types = [...kept, ...added].filter((type) => type.label !== "");

          return { id: old.id, ja: now.ja ?? null, kana, types };
        }

        return { id: old.id, ja: now.ja ?? null, kana, calling: [...new Set(now.calling)].sort(byText) };
      })
      .sort((a, b) => byNumber(a.id, b.id));
  }

  return out;
};

const describe = (item: WikidataItem): string => JSON.stringify(item);

const diff = (kind: string, before: Record<string, WikidataItem[]>, after: Record<string, WikidataItem[]>, dump: string, notes: string[]): string[] => {
  const lines: string[] = [];
  for (const code of Object.keys(before)) {
    const was = new Map(before[code]!.map((item) => [item.id, item]));
    for (const item of after[code] ?? []) {
      const old = was.get(item.id);
      if (old === undefined || describe(old) === describe(item)) continue;
      for (const field of ["ja", "kana", "types", "calling"] as const) {
        const a = JSON.stringify(old[field] ?? null);
        const b = JSON.stringify(item[field] ?? null);
        if (a !== b) lines.push(`- ${kind} ${code} ${item.id} ${field}: ${a} -> ${b}`);
      }
    }
  }
  notes.push(`${kind}: ${lines.length} values moved against the dump of ${dump}.`);

  return lines;
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const dayOfDump = args.includes("--day") ? args[args.indexOf("--day") + 1]! : "2026-11-14";
  const subset = join(CACHE_DIR, `dump-subset-${dayOfDump}.nt`);
  const metaPath = join(CACHE_DIR, `dump-subset-${dayOfDump}.meta.json`);
  if (!existsSync(metaPath)) throw new Error(`${metaPath} is not there: the dump has not been read to its end (scripts/extract-dump-subset.ts)`);
  const dump = JSON.parse(readFileSync(metaPath, "utf8")) as { dateModified: string | null; compressedBytes: number; linesRead: number; read: string };

  const newest = readdirSync(SOURCES_DIR).filter((file) => /^wikidata-\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort().at(-1);
  if (newest === undefined) throw new Error("no data-sources/wikidata-<day>.json: it names the items");
  const held = JSON.parse(readFileSync(join(SOURCES_DIR, newest), "utf8")) as { subdivisions: Record<string, WikidataItem[]>; countries: Record<string, WikidataItem[]> };
  const items = new Set([...Object.values(held.subdivisions), ...Object.values(held.countries)].flatMap((list) => list.map((item) => item.id)));
  console.log(`${items.size} items in ${newest}; reading ${subset} ...`);
  const facts = await readDump(subset, items);

  const subdivisions = rebuild(held.subdivisions, facts, true, (one) => one.codes300);
  const countries = rebuild(held.countries, facts, false, (one) => one.codes297);
  const read = dump.dateModified?.slice(0, 10) ?? dayOfDump;
  const snapshot: WikidataSnapshot = {
    source: DUMP_URL,
    licence: "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
    read,
    dump: { dateModified: dump.dateModified, compressedBytes: dump.compressedBytes, linesRead: dump.linesRead },
    rebuilt: `the items of ${newest}, read from the dump's best-rank direct values (P300, P297, P1814, P31, P474 and labels ja and en)`,
    subdivisions,
    countries,
  };
  const block = (record: Record<string, WikidataItem[]>): string =>
    Object.entries(record)
      .map(([code, list]) => `    ${JSON.stringify(code)}: ${JSON.stringify(list)}`)
      .join(",\n");
  const text = `{
  "source": ${JSON.stringify(snapshot.source)},
  "licence": ${JSON.stringify(snapshot.licence)},
  "read": ${JSON.stringify(snapshot.read)},
  "dump": ${JSON.stringify(snapshot.dump)},
  "rebuilt": ${JSON.stringify(snapshot.rebuilt)},
  "subdivisions": {
${block(subdivisions)}
  },
  "countries": {
${block(countries)}
  }
}
`;

  const notes: string[] = [];
  const moved = [...diff("subdivision", held.subdivisions, subdivisions, read, notes), ...diff("country", held.countries, countries, read, notes)];
  const unknown = [...items].filter((id) => !facts.has(id));
  const wrongCode = [
    ...Object.entries(held.subdivisions).flatMap(([code, list]) => list.filter((item) => facts.has(item.id) && !facts.get(item.id)!.codes300.includes(code)).map((item) => `subdivision ${code} ${item.id}`)),
    ...Object.entries(held.countries).flatMap(([code, list]) => list.filter((item) => facts.has(item.id) && !facts.get(item.id)!.codes297.includes(code)).map((item) => `country ${code} ${item.id}`)),
  ];
  mkdirSync(join(DIFF_FILE, ".."), { recursive: true });
  writeFileSync(
    DIFF_FILE,
    `# Wikidata snapshot rebuilt from the dump (MODULES-1599)

\`data-sources/${newest}\` was made with SPARQL on its day. \`scripts/fetch-wikidata.ts\` now rebuilds it from Wikimedia's truthy dump of ${read}
(${DUMP_URL}) for the same items, and this file lists every value that moved. Written by the script; do not edit.

${notes.map((note) => `- ${note}`).join("\n")}
- ${unknown.length} of ${items.size} items are not in the dump subset and keep their old values.
- ${wrongCode.length} items do not carry their code as a best-rank value in the dump (a deprecated or non-best statement, or a changed code) and keep their old values.

## Values that moved

${moved.length === 0 ? "None." : moved.join("\n")}

## Items kept as they were

${[...unknown.map((id) => `- ${id}: not in the dump`), ...wrongCode.map((one) => `- ${one}: code not a best-rank value in the dump`)].join("\n") || "None."}
`,
  );

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
    url: DUMP_URL,
    read,
    sha256: sha256(text),
    note: "Wikidata's truthy dump read for ISO 3166-2 (P300) and ISO 3166-1 (P297) codes, kana, instance of and calling codes, for the items of the 2026-10 SPARQL snapshot (CC0)",
  });
  writeManifest(manifest);
  console.log(`Wrote data-sources/${path}: ${Object.keys(subdivisions).length} subdivision codes, ${Object.keys(countries).length} country codes; ${moved.length} values moved, ${unknown.length} items not in the dump, ${wrongCode.length} with another code. See docs/wikidata-dump-diff.md.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
