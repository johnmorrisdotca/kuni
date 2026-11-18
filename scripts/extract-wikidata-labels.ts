// Reads the Spanish, German and Chinese labels of the Wikidata items kuni already holds for its subdivisions (MODULES-1594) out of the
// subset scripts/extract-dump-subset.ts kept from Wikimedia's dump, and writes them to data-sources/wikidata-labels-<day>.json. It asks
// nobody: the dump is one file the server publishes for exactly this, and query.wikidata.org and www.wikidata.org both disallow the
// query service and the API in their robots.txt (see data-sources/requests-*.log), which is why the SPARQL snapshots of 2026-10 are
// not repeated for these languages. Wikidata's data is CC0. Only labels (rdfs:label) in es, de and zh and its variants are kept, and
// only for the items in the newest data-sources/wikidata-<day>.json.
//
//   node scripts/extract-wikidata-labels.ts [--day <yyyy-mm-dd>]      the day of the dump subset (dump-subset-<day>.nt)

import { createReadStream, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

import { SOURCES_DIR } from "./sources.ts";

const CACHE_DIR = process.env.KUNI_DATA_CACHE ?? join(homedir(), ".cache", "kuni-data");
// The language tags of Wikidata labels kept: Spanish, German, and every tag Chinese is written under.
const LABEL_LANGUAGES = ["es", "de", "zh", "zh-hans", "zh-cn", "zh-sg", "zh-my", "zh-hant", "zh-tw", "zh-hk", "zh-mo"] as const;

const args = process.argv.slice(2);
const dayOfDump = args.includes("--day") ? args[args.indexOf("--day") + 1]! : "2026-11-14";
const subset = join(CACHE_DIR, `dump-subset-${dayOfDump}.nt`);
const meta = join(CACHE_DIR, `dump-subset-${dayOfDump}.meta.json`);

const snapshot = readdirSync(SOURCES_DIR).filter((file) => /^wikidata-\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort().at(-1);
if (snapshot === undefined) throw new Error("no data-sources/wikidata-<day>.json: it names the items");
const held = (JSON.parse(readFileSync(join(SOURCES_DIR, snapshot), "utf8")) as { subdivisions: Record<string, { id: string }[]> }).subdivisions;
const ids = new Set(Object.values(held).flatMap((items) => items.map((item) => item.id)));
console.log(`${ids.size} items for ${Object.keys(held).length} subdivision codes, from ${snapshot}`);

const unescape = (text: string): string =>
  text.replace(/\\(?:u([0-9A-Fa-f]{4})|U([0-9A-Fa-f]{8})|(["\\nrt]))/g, (_, short, long, plain) => {
    if (short !== undefined) return String.fromCharCode(parseInt(short, 16));
    if (long !== undefined) return String.fromCodePoint(parseInt(long, 16));

    return { '"': '"', "\\": "\\", n: "\n", r: "\r", t: "\t" }[plain as string]!;
  });

const main = async (): Promise<void> => {
  if (!existsSync(meta)) throw new Error(`${meta} is not there: the dump has not been read to its end (scripts/extract-dump-subset.ts)`);
  const dump = JSON.parse(readFileSync(meta, "utf8")) as { dateModified: string | null; compressedBytes: number; linesRead: number; linesKept: number; read: string };
  const labels: Record<string, Record<string, string>> = {};
  const wanted = new Set<string>(LABEL_LANGUAGES);
  const lines = createInterface({ input: createReadStream(subset, "utf8"), crlfDelay: Infinity });
  for await (const line of lines) {
    const match = /^<http:\/\/www\.wikidata\.org\/entity\/(Q\d+)> <[^>]*rdf-schema#label> "((?:[^"\\]|\\.)*)"@([A-Za-z-]+) \.$/.exec(line);
    if (match === null || !ids.has(match[1]!) || !wanted.has(match[3]!.toLowerCase())) continue;
    (labels[match[1]!] ??= {})[match[3]!.toLowerCase()] = unescape(match[2]!).normalize("NFC");
  }
  const sorted = Object.fromEntries(Object.entries(labels).sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1))));
  const file = join(SOURCES_DIR, `wikidata-labels-${dayOfDump}.json`);
  writeFileSync(
    file,
    JSON.stringify(
      {
        source: "https://dumps.wikimedia.org/wikidatawiki/entities/latest-truthy.nt.bz2",
        licence: "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
        read: dump.read,
        dump: { dateModified: dump.dateModified, compressedBytes: dump.compressedBytes, linesRead: dump.linesRead },
        items: `the ${ids.size} items of ${snapshot}`,
        languages: LABEL_LANGUAGES,
        labels: sorted,
      },
      null,
      0,
    ).replace(/"labels":\{/, '"labels":{\n').replace(/\},"Q/g, '},\n"Q') + "\n",
  );
  const count = (language: string): number => Object.values(sorted).filter((one) => one[language] !== undefined).length;
  console.log(`${Object.keys(sorted).length} items have a label; ${LABEL_LANGUAGES.map((language) => `${language} ${count(language)}`).join(", ")}`);
  console.log(`Written to ${file}`);
};

await main();
