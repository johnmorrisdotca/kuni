// Reads Wikimedia's truthy Wikidata dump once, as a stream, and keeps every triple whose subject is an item kuni already holds
// (MODULES-1594, MODULES-1599). The dump is about 40 GB compressed and many times that read out, and nothing here stores it: the
// bytes go from the network through `bzip2 -dc` into a filter that keeps a few MB, so the disk holds the kept lines and (briefly) a
// partial file from an earlier download, which is read first and then deleted. Nobody is asked anything but the one file the server
// publishes for exactly this: query.wikidata.org and www.wikidata.org disallow the query service and the API in their robots.txt.
//
//   node scripts/extract-dump-subset.ts [--day <yyyy-mm-dd>] [--partial <file>] [--only-ids]
//
// The kept lines go to ~/.cache/kuni-data/dump-subset-<day>.nt, and what was read of the dump (its date, its size, how many lines
// were read and kept) to dump-subset-<day>.meta.json beside it. scripts/extract-wikidata-labels.ts reads the first, and
// MODULES-1599's rebuild of the 2026-10 snapshots reads it too, so the dump is read once for both.
// Resuming: a partial file (curl's own, from an earlier run) is fed first and the rest is asked for with a Range request.

import { spawn } from "node:child_process";
import { appendFileSync, createReadStream, createWriteStream, existsSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { SOURCES_DIR } from "./sources.ts";

const CACHE_DIR = process.env.KUNI_DATA_CACHE ?? join(homedir(), ".cache", "kuni-data");
const DUMP_URL = "https://dumps.wikimedia.org/wikidatawiki/entities/latest-truthy.nt.bz2";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni)";
const args = process.argv.slice(2);
const option = (name: string): string | undefined => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const day = option("--day") ?? new Date().toISOString().slice(0, 10);
const partialFile = option("--partial");
const subsetFile = join(CACHE_DIR, `dump-subset-${day}.nt`);
const metaFile = join(CACHE_DIR, `dump-subset-${day}.meta.json`);
const requestLog = join(SOURCES_DIR, `requests-${new Date().toISOString().slice(0, 10)}.log`);

// Every item the data-sources already name: the snapshots' own ids and what they point at, so a rebuild finds all its subjects here.
const heldIds = (): Set<number> => {
  const ids = new Set<number>();
  for (const file of readdirSync(SOURCES_DIR).filter((name) => /^(wikidata-.*|city-ids|city-id-aliases)\.json$/.test(name))) {
    for (const match of readFileSync(join(SOURCES_DIR, file), "utf8").matchAll(/\bQ(\d{1,9})\b/g)) ids.add(Number(match[1]));
  }

  return ids;
};

const logRequest = (text: string): void => appendFileSync(requestLog, `${new Date().toISOString()} ${text}\n`);

const main = async (): Promise<void> => {
  const ids = heldIds();
  const wanted = new Uint8Array(1 << 28);
  for (const id of ids) if (id < wanted.length * 8) wanted[id >> 3]! |= 1 << (id & 7);
  console.log(`${ids.size} items held in data-sources`);
  if (args.includes("--only-ids")) return;

  const prefix = Buffer.from("<http://www.wikidata.org/entity/Q");
  const out = createWriteStream(subsetFile);
  const bzip = spawn("bzip2", ["-dc"], { stdio: ["pipe", "pipe", "ignore"] });
  bzip.stdin.on("error", () => undefined);

  let fed = 0;
  let read = 0;
  let kept = 0;
  let head = "";
  let left: Buffer = Buffer.alloc(0);
  let lastReport = Date.now();
  const started = Date.now();

  bzip.stdout.on("data", (chunk: Buffer) => {
    const data = left.length === 0 ? chunk : Buffer.concat([left, chunk]);
    const kept$: Buffer[] = [];
    let from = 0;
    for (;;) {
      const end = data.indexOf(10, from);
      if (end === -1) break;
      read += 1;
      if (head.length < 6000) head += data.toString("utf8", from, end) + "\n";
      if (data.compare(prefix, 0, prefix.length, from, from + prefix.length) === 0) {
        let id = 0;
        let at = from + prefix.length;
        while (data[at]! >= 48 && data[at]! <= 57) id = id * 10 + data[at++]! - 48;
        if (id < wanted.length * 8 && (wanted[id >> 3]! & (1 << (id & 7))) !== 0) {
          kept$.push(data.subarray(from, end + 1));
          kept += 1;
        }
      }
      from = end + 1;
    }
    left = Buffer.from(data.subarray(from));
    if (kept$.length > 0) out.write(Buffer.concat(kept$));
    if (Date.now() - lastReport > 60000) {
      lastReport = Date.now();
      console.log(`${new Date().toISOString()} fed ${(fed / 1e9).toFixed(2)} GB, read ${(read / 1e6).toFixed(0)} M lines, kept ${kept}`);
    }
  });

  // The partial file first, then the rest with a Range request from its end (or the whole file, if there is no partial).
  let offset = 0;
  if (partialFile !== undefined && existsSync(partialFile)) {
    offset = statSync(partialFile).size;
    await new Promise<void>((done, fail) => {
      const input = createReadStream(partialFile, { start: 0, end: offset - 1 });
      input.on("data", (chunk) => (fed += chunk.length));
      input.on("error", fail);
      input.on("end", done);
      input.pipe(bzip.stdin, { end: false });
    });
    console.log(`partial file fed: ${offset} bytes`);
  }

  const headers = join(CACHE_DIR, `dump-subset-${day}.headers`);
  const curl = spawn("curl", ["-sS", "-L", "--fail", "-A", USER_AGENT, "-D", headers, ...(offset > 0 ? ["-r", `${offset}-`] : []), DUMP_URL], { stdio: ["ignore", "pipe", "inherit"] });
  logRequest(`GET ${DUMP_URL}${offset > 0 ? ` (Range: bytes=${offset}-)` : ""} -> streamed through bzip2 into a filter; nothing is stored but the lines kept (scripts/extract-dump-subset.ts)`);
  curl.stdout.on("data", (chunk: Buffer) => (fed += chunk.length));
  curl.stdout.pipe(bzip.stdin);

  const [curlCode, bzipCode] = await Promise.all([new Promise<number | null>((done) => curl.on("close", done)), new Promise<number | null>((done) => bzip.on("close", done))]);
  await new Promise((done) => out.end(done));
  if (curlCode !== 0) throw new Error(`curl ended with ${curlCode} after ${fed} bytes: rerun with --partial to resume`);
  if (bzipCode !== 0) throw new Error(`bzip2 ended with ${bzipCode}: the dump was not whole (${fed} bytes fed)`);

  const status = readFileSync(headers, "utf8").split("\n").filter((line) => line.startsWith("HTTP/")).at(-1)?.trim();
  const range = /content-range: bytes \d+-\d+\/(\d+)/i.exec(readFileSync(headers, "utf8"))?.[1];
  logRequest(`GET ${DUMP_URL} -> ${status}, ${fed} bytes in all, ${Math.round((Date.now() - started) / 1000)} s`);
  const meta = {
    source: DUMP_URL,
    licence: "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)",
    read: new Date().toISOString().slice(0, 10),
    dateModified: /schema.org\/dateModified> "([^"]+)"/.exec(head)?.[1] ?? null,
    compressedBytes: fed,
    totalBytesAnnounced: range === undefined ? null : Number(range),
    linesRead: read,
    linesKept: kept,
    itemsHeld: ids.size,
    subset: subsetFile,
  };
  writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`done: ${JSON.stringify(meta)}`);
  if (partialFile !== undefined && existsSync(partialFile)) unlinkSync(partialFile);
};

await main();
