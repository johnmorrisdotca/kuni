// Reads the Spanish, German and Chinese labels of the Wikidata items kuni already holds for its subdivisions out of Wikimedia's dump
// (MODULES-1594), and writes them to data-sources/wikidata-labels-<day>.json. It asks nobody: the dump is one file the server
// publishes for exactly this, and query.wikidata.org and www.wikidata.org both disallow the query service and the API in their
// robots.txt (see data-sources/requests-*.log), which is why the SPARQL snapshots of 2026-10 are not repeated for these languages.
//
//   node scripts/extract-wikidata-labels.ts [--dump <file>] [--follow-pid <pid>] [--day <yyyy-mm-dd>]
//
// The dump is ~/.cache/kuni-data/latest-truthy-<day>.nt.bz2 (the download is in the log). With --follow-pid the file is read while
// curl is still writing it and the script ends when that process has ended and the last byte is read. Wikidata's data is CC0.
// Only labels (rdfs:label) in es, de and zh and its variants are kept, and only for the items in data-sources/wikidata-*.json.

import { spawn, spawnSync } from "node:child_process";
import { closeSync, createWriteStream, existsSync, mkdtempSync, openSync, readFileSync, readSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, join } from "node:path";

import { SOURCES_DIR } from "./sources.ts";

const CACHE_DIR = process.env.KUNI_DATA_CACHE ?? join(homedir(), ".cache", "kuni-data");
// The language tags of Wikidata labels kept: Spanish, German, and every tag Chinese is written under.
const LABEL_LANGUAGES = ["es", "de", "zh", "zh-hans", "zh-cn", "zh-sg", "zh-my", "zh-hant", "zh-tw", "zh-hk", "zh-mo"] as const;

const args = process.argv.slice(2);
const option = (name: string): string | undefined => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const dayOfDump = option("--day") ?? "2026-11-14";
const dump = option("--dump") ?? join(CACHE_DIR, `latest-truthy-${dayOfDump}.nt.bz2`);
const followPid = option("--follow-pid") === undefined ? null : Number(option("--follow-pid"));

const snapshot = readdirSync(SOURCES_DIR).filter((file) => /^wikidata-\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort().at(-1);
if (snapshot === undefined) throw new Error("no data-sources/wikidata-<day>.json: it names the items");
const held = (JSON.parse(readFileSync(join(SOURCES_DIR, snapshot), "utf8")) as { subdivisions: Record<string, { id: string }[]> }).subdivisions;
const ids = [...new Set(Object.values(held).flatMap((items) => items.map((item) => item.id)))].sort();
console.log(`${ids.length} items for ${Object.keys(held).length} subdivision codes, from ${snapshot}`);

const work = mkdtempSync(join(tmpdir(), "kuni-labels-"));
const patterns = join(work, "patterns.txt");
writeFileSync(patterns, ids.map((id) => `<http://www.wikidata.org/entity/${id}> <http://www.w3.org/2000/01/rdf-schema#label> "`).join("\n") + "\n");
const found = join(work, "found.nt");

const alive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);

    return true;
  } catch {
    return false;
  }
};

const bzip = spawn("bzip2", ["-dc"], { stdio: ["pipe", "pipe", "ignore"] });
const search = spawn("rg", ["--text", "--no-line-number", "--no-filename", "-F", "-f", patterns], { stdio: ["pipe", "pipe", "inherit"] });
bzip.stdout.pipe(search.stdin);
const out = createWriteStream(found);
search.stdout.pipe(out);
// bzip2 stops with an error at a truncated end; a finished file must not.
bzip.stdin.on("error", () => undefined);

const feed = async (): Promise<number> => {
  const fd = openSync(dump, "r");
  const buffer = Buffer.alloc(1 << 20);
  let offset = 0;
  let lastReport = Date.now();
  try {
    for (;;) {
      const read = readSync(fd, buffer, 0, buffer.length, offset);
      if (read > 0) {
        offset += read;
        if (!bzip.stdin.write(Buffer.from(buffer.subarray(0, read)))) await new Promise((done) => bzip.stdin.once("drain", done));
        if (Date.now() - lastReport > 60000) {
          lastReport = Date.now();
          console.log(`${new Date().toISOString()} read ${(offset / 1e9).toFixed(2)} GB of ${(statSync(dump).size / 1e9).toFixed(2)} GB so far`);
        }
        continue;
      }
      if (followPid !== null && alive(followPid)) {
        await new Promise((done) => setTimeout(done, 2000));
        continue;
      }
      // The writer has ended (or there was none): one more look for bytes written between the last read and its end.
      if (statSync(dump).size > offset) continue;
      break;
    }
  } finally {
    closeSync(fd);
  }
  bzip.stdin.end();

  return offset;
};

const unescape = (text: string): string =>
  text.replace(/\\(?:u([0-9A-Fa-f]{4})|U([0-9A-Fa-f]{8})|(["\\nrt]))/g, (_, short, long, plain) => {
    if (short !== undefined) return String.fromCharCode(parseInt(short, 16));
    if (long !== undefined) return String.fromCodePoint(parseInt(long, 16));

    return { '"': '"', "\\": "\\", n: "\n", r: "\r", t: "\t" }[plain as string]!;
  });

const main = async (): Promise<void> => {
  if (!existsSync(dump)) throw new Error(`${dump} is not there`);
  const bytes = await feed();
  const [bzipCode, searchCode] = await Promise.all([
    new Promise<number | null>((done) => bzip.on("close", done)),
    new Promise<number | null>((done) => search.on("close", done)),
  ]);
  await new Promise((done) => out.end(done));
  // rg exits 1 when it found nothing, 0 when it found something; bzip2 must have read the whole file.
  if (bzipCode !== 0) throw new Error(`bzip2 ended with ${bzipCode}: the dump is not whole (${bytes} bytes read)`);
  if (searchCode !== 0) throw new Error(`rg ended with ${searchCode}`);

  const labels: Record<string, Record<string, string>> = {};
  const wanted = new Set<string>(LABEL_LANGUAGES);
  for (const line of readFileSync(found, "utf8").split("\n")) {
    const match = /^<http:\/\/www\.wikidata\.org\/entity\/(Q\d+)> <[^>]*rdf-schema#label> "((?:[^"\\]|\\.)*)"@([A-Za-z-]+) \.$/.exec(line);
    if (match === null || !wanted.has(match[3]!.toLowerCase())) continue;
    (labels[match[1]!] ??= {})[match[3]!.toLowerCase()] = unescape(match[2]!).normalize("NFC");
  }
  const header = spawnSync("sh", ["-c", `bzip2 -dc < '${dump}' 2>/dev/null | head -c 2000`], { encoding: "utf8" }).stdout;
  const modified = /schema.org\/dateModified> "([^"]+)"/.exec(header)?.[1] ?? null;
  const day = new Date().toISOString().slice(0, 10);
  const sorted = Object.fromEntries(Object.entries(labels).sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1))));
  const file = join(SOURCES_DIR, `wikidata-labels-${dayOfDump}.json`);
  writeFileSync(
    file,
    JSON.stringify(
      {
        source: "https://dumps.wikimedia.org/wikidatawiki/entities/latest-truthy.nt.bz2",
        licence: "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
        read: day,
        dump: { file: basename(dump), bytes, dateModified: modified },
        items: `the ${ids.length} items of ${snapshot}`,
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
