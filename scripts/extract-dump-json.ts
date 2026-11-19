// Streams Wikimedia's full JSON Wikidata dump once and keeps a slim line for every item kuni already holds
// (MODULES-1599). The dump is about 100 GB compressed. Nothing here stores it: curl's bytes go through `bzip2 -dc`
// into a filter, and the disk keeps only those items, with sitelinks and descriptions dropped and claims kept whole,
// qualifiers included. query.wikidata.org and www.wikidata.org disallow the query service and the API; this asks
// dumps.wikimedia.org for the one file it publishes for this.
//
//   node scripts/extract-dump-json.ts [--day <yyyy-mm-dd>] [--url <dump>]
//
// Output: ~/.cache/kuni-data/dump-json-subset-<day>.jsonl and a progress file beside it. A dropped connection waits
// and reads the dump again from byte 0. A Range resume cannot be shown to land on the bzip2 block that continues
// the last entity (an earlier one jumped from Q56557664 to Q97233421), so an id already in the jsonl is skipped.
// The same pass also keeps Chinese constellations (P31 Q1074076), and a part-of target once its id has been seen,
// in ~/.cache/kuni-data/hoshi-1219d-chinese-constellations.jsonl. A target earlier in the dump than the item that
// names it is not reached again.

import { spawn } from "node:child_process";
import { appendFileSync, closeSync, createReadStream, createWriteStream, existsSync, ftruncateSync, openSync, readFileSync, readSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { entityId } from "./dump-claims.ts";
import { wantedIds } from "./dump-wanted-ids.ts";
import { SOURCES_DIR, USER_AGENT } from "./sources.ts";

const CACHE_DIR = process.env.KUNI_DATA_CACHE ?? join(homedir(), ".cache", "kuni-data");
const STAR_FILE = join(CACHE_DIR, "hoshi-1219d-chinese-constellations.jsonl");
const CHINESE_CONSTELLATION = "Q1074076";
const STAR_NEEDLE = Buffer.from(`"${CHINESE_CONSTELLATION}"`);
const STAR_LANGS = ["zh", "zh-hant", "zh-hans", "en", "ja"] as const;
const REWIND = 8_000_000;
const BACKOFF_SECONDS = [60, 120, 240, 300, 300, 300, 300, 300];

const args = process.argv.slice(2);
const option = (name: string): string | undefined => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const DUMP_URL = option("--url") ?? "https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.bz2";
const day = option("--day") ?? "2026-11-17";
const subsetFile = join(CACHE_DIR, `dump-json-subset-${day}.jsonl`);
const progressFile = join(CACHE_DIR, `dump-json-subset-${day}.progress.json`);
const requestLog = join(SOURCES_DIR, `requests-${new Date().toISOString().slice(0, 10)}.log`);

interface Progress {
  source: string;
  header: string | null;
  bytesFed: number;
  totalBytes: number | null;
  itemsKept: number;
  linesRead: number;
  starsKept: number;
  complete: boolean;
}

interface Entity {
  id?: string;
  labels?: unknown;
  aliases?: unknown;
  claims?: unknown;
}

const logRequest = (text: string): void => appendFileSync(requestLog, `${new Date().toISOString()} ${text}\n`);

const readProgress = (): Progress => {
  if (!existsSync(progressFile)) return { source: DUMP_URL, header: null, bytesFed: 0, totalBytes: null, itemsKept: 0, linesRead: 0, starsKept: 0, complete: false };
  const progress = JSON.parse(readFileSync(progressFile, "utf8")) as Progress;
  if (typeof progress.starsKept !== "number") progress.starsKept = 0;
  return progress;
};

const writeProgress = (progress: Progress): void => writeFileSync(progressFile, `${JSON.stringify(progress, null, 2)}\n`);

const wait = (seconds: number): Promise<void> => new Promise((done) => setTimeout(done, seconds * 1000));

// A crash can leave a half line. Drop it so the next item starts a line of its own.
const truncatePartialLine = (): void => {
  if (!existsSync(subsetFile) || statSync(subsetFile).size === 0) return;
  const size = statSync(subsetFile).size;
  const window = Math.min(size, 64 * 1024 * 1024);
  const fd = openSync(subsetFile, "r+");
  const buf = Buffer.alloc(window);
  readSync(fd, buf, 0, window, size - window);
  const last = buf.lastIndexOf(10);
  if (last === window - 1) {
    closeSync(fd);
    return;
  }
  const keep = last === -1 ? size - window : size - window + last + 1;
  ftruncateSync(fd, keep);
  closeSync(fd);
};

const idsAlreadyKept = async (): Promise<Set<number>> => {
  const ids = new Set<number>();
  if (!existsSync(subsetFile) || statSync(subsetFile).size === 0) return ids;
  let left = "";
  for await (const chunk of createReadStream(subsetFile, { encoding: "utf8" })) {
    const data = left + chunk;
    const end = data.lastIndexOf("\n");
    if (end === -1) {
      left = data;
      continue;
    }
    // Only the entity's own id, which starts the slim line. Claim values also carry "id":"Q…", and counting those would skip the entity when it arrives.
    for (const match of data.slice(0, end).matchAll(/(?:^|\n)\{"id":"Q(\d+)"/g)) ids.add(Number(match[1]));
    left = data.slice(end + 1);
  }
  return ids;
};

// A bzip2 block header is 48 bits and only the first one is byte-aligned, so a Range resume has to find it on a bit boundary and shift the rest onto a byte boundary before prepending the stream header.
const findBlockBit = (buf: Buffer, fromByte: number): number => {
  const needle = 0x314159265359n;
  const mask = (1n << 48n) - 1n;
  for (let i = Math.max(0, fromByte); i + 6 < buf.length; i += 1) {
    let bits = 0n;
    for (let b = 0; b < 7; b += 1) bits = (bits << 8n) | BigInt(buf[i + b]!);
    for (let shift = 0; shift < 8; shift += 1) {
      if (((bits >> BigInt(8 - shift)) & mask) === needle) return i * 8 + shift;
    }
  }
  return -1;
};

const claimItems = (claims: unknown, property: string): string[] => {
  const rows = (claims as Record<string, { mainsnak?: Parameters<typeof entityId>[0] }[]> | undefined)?.[property] ?? [];
  const found: string[] = [];
  for (const row of rows) {
    const id = entityId(row.mainsnak);
    if (id !== null) found.push(id);
  }
  return found;
};

const pickedLabels = (labels: unknown): Record<string, string> => {
  const source = labels as Record<string, { value?: string }> | undefined;
  const out: Record<string, string> = {};
  if (source === undefined) return out;
  for (const lang of STAR_LANGS) {
    const value = source[lang]?.value;
    if (typeof value === "string" && value !== "") out[lang] = value;
  }
  return out;
};

const jaAliases = (aliases: unknown): string[] => {
  const list = (aliases as Record<string, { value?: string }[]> | undefined)?.ja ?? [];
  return list.flatMap((row) => (typeof row.value === "string" && row.value !== "" ? [row.value] : []));
};

const parsedEntity = (text: string): Entity | null => {
  const at = text.indexOf("{");
  if (at === -1) return null;
  let body = text.slice(at).trimEnd();
  if (body.endsWith(",")) body = body.slice(0, -1);
  return JSON.parse(body) as Entity;
};

const slimLine = (text: string): string | null => {
  const at = text.indexOf("{");
  if (at === -1) return null;
  let body = text.slice(at).trimEnd();
  if (body.endsWith(",")) body = body.slice(0, -1);
  const entity = JSON.parse(body) as Entity;
  if (entity.id === undefined || entity.claims === undefined) return null;
  return `${JSON.stringify({ id: entity.id, labels: entity.labels ?? {}, aliases: entity.aliases ?? {}, claims: entity.claims })}\n`;
};

const main = async (): Promise<void> => {
  const wanted = wantedIds(SOURCES_DIR);
  const ids = wanted.ids;
  console.log(`${ids.size} items wanted; city ids asked ${wanted.cityIds}, missing from the wanted set ${wanted.cityIdsMissing}; populations file counts ${wanted.populationsAsked ?? "none"}`);
  if (wanted.cityIdsMissing > 0) throw new Error(`${wanted.cityIdsMissing} city ids are not in the wanted set`);
  let progress = readProgress();
  if (progress.complete) {
    progress = { ...progress, bytesFed: 0, linesRead: 0, starsKept: 0, complete: false };
    writeProgress(progress);
    console.log("previous pass completed; reading again from byte 0 and skipping ids already kept");
  }
  truncatePartialLine();
  const keptIds = await idsAlreadyKept();
  console.log(`${keptIds.size} items already kept; resuming from ${progress.bytesFed} bytes`);
  const partTargets = new Set<number>();
  const starsWritten = new Set<number>();
  writeFileSync(STAR_FILE, `${JSON.stringify({ dump: DUMP_URL, lastModified: "Tue, 17 Nov 2026 18:42:29 GMT", etag: "6afca015-1832128e37", licence: "CC0", read: day })}\n`);

  for (let attempt = 0; attempt <= BACKOFF_SECONDS.length; attempt += 1) {
    try {
      progress = await onePass(ids, keptIds, progress, partTargets, starsWritten);
      if (progress.complete) return;
      throw new Error(`stream ended early at ${progress.bytesFed} of ${progress.totalBytes ?? "?"} bytes`);
    } catch (error) {
      const waitFor = BACKOFF_SECONDS[attempt];
      if (waitFor === undefined) throw error;
      console.log(`${new Date().toISOString()} ${error instanceof Error ? error.message : String(error)}; backing off ${waitFor}s`);
      writeProgress(progress);
      await wait(waitFor);
      progress = readProgress();
    }
  }
};

const starLine = (text: string, id: number, partTargets: Set<number>, starsWritten: Set<number>, progress: Progress): void => {
  if (starsWritten.has(id)) return;
  const entity = parsedEntity(text);
  if (entity?.id === undefined) return;
  const p31 = claimItems(entity.claims, "P31");
  const p361 = claimItems(entity.claims, "P361");
  const chinese = p31.includes(CHINESE_CONSTELLATION);
  if (!chinese && !partTargets.has(id)) return;
  const labels = pickedLabels(entity.labels);
  if (chinese) {
    for (const target of p361) {
      const number = Number(target.slice(1));
      if (Number.isInteger(number)) partTargets.add(number);
    }
    const aliases = jaAliases(entity.aliases);
    const row = { id: entity.id, labels, ...(aliases.length > 0 ? { aliases: { ja: aliases } } : {}), p31, p361 };
    appendFileSync(STAR_FILE, `${JSON.stringify(row)}\n`);
  } else {
    const targetLabels: Record<string, string> = {};
    if (labels.en !== undefined) targetLabels.en = labels.en;
    if (labels.zh !== undefined) targetLabels.zh = labels.zh;
    appendFileSync(STAR_FILE, `${JSON.stringify({ id: entity.id, role: "p361-target", labels: targetLabels })}\n`);
  }
  starsWritten.add(id);
  progress.starsKept += 1;
};

const onePass = (ids: Set<number>, keptIds: Set<number>, progress: Progress, partTargets: Set<number>, starsWritten: Set<number>): Promise<Progress> =>
  new Promise((done, fail) => {
    const start = 0;
    const bzip = spawn("bzip2", ["-dc"], { stdio: ["pipe", "pipe", "pipe"] });
    bzip.stdin.on("error", () => undefined);
    bzip.stderr.on("data", () => undefined);
    const headers = join(CACHE_DIR, `dump-json-subset-${day}.headers`);
    const curlArgs = ["-sS", "-L", "--fail", "-A", USER_AGENT, "-D", headers, ...(start > 0 ? ["-r", `${start}-`] : []), DUMP_URL];
    const curl = spawn("curl", curlArgs, { stdio: ["ignore", "pipe", "inherit"] });
    logRequest(`GET ${DUMP_URL}${start > 0 ? ` (Range: bytes=${start}-)` : ""} -> streamed through bzip2 into a filter; the compressed dump is not stored (scripts/extract-dump-json.ts)`);

    let received = 0;
    let primed = start === 0;
    let pending = Buffer.alloc(0);
    let scanned = 0;
    let shift = 0;
    let held: number | null = null;
    const shifted = (chunk: Buffer): Buffer => {
      if (shift === 0) return chunk;
      const out = Buffer.alloc(chunk.length);
      let n = 0;
      for (let i = 0; i < chunk.length; i += 1) {
        const byte = chunk[i]!;
        if (held !== null) out[n++] = ((held << shift) | (byte >> (8 - shift))) & 0xff;
        held = byte;
      }
      return out.subarray(0, n);
    };
    let header = progress.header;
    let headerBytes = Buffer.alloc(0);
    let settled = false;
    const stop = (error: Error): void => {
      if (settled) return;
      settled = true;
      curl.kill();
      bzip.kill();
      writeProgress({ ...progress, header });
      fail(error);
    };
    curl.stdout.on("data", (chunk: Buffer) => {
      received += chunk.length;
      progress.bytesFed = start + received;
      if (header === null && start === 0) {
        headerBytes = Buffer.concat([headerBytes, chunk.subarray(0, 4)]);
        if (headerBytes.length >= 4) {
          header = headerBytes.subarray(0, 4).toString("utf8");
          progress.header = header;
        }
      }
      if (primed) {
        bzip.stdin.write(shifted(chunk));
        return;
      }
      const fromByte = Math.max(0, scanned - 6);
      pending = Buffer.concat([pending, chunk]);
      scanned = pending.length;
      const bit = findBlockBit(pending, fromByte);
      if (bit === -1) {
        if (pending.length > REWIND + 1_000_000) stop(new Error("no bzip2 block in the resumed range"));
        return;
      }
      if (header === null) {
        stop(new Error("no bzip2 header saved from the start of the dump; cannot resume"));
        return;
      }
      shift = bit % 8;
      held = null;
      primed = true;
      bzip.stdin.write(Buffer.concat([Buffer.from(header), shifted(pending.subarray(Math.floor(bit / 8)))]));
      pending = Buffer.alloc(0);
    });
    curl.on("close", () => {
      if (!primed && start > 0) stop(new Error("the range ended before a bzip2 block"));
      else bzip.stdin.end();
    });

    const out = createWriteStream(subsetFile, { flags: "a" });
    let left = Buffer.alloc(0);
    let skipPartial = start > 0;
    let lastReport = Date.now();
    const started = Date.now();

    bzip.stdout.on("data", (chunk: Buffer) => {
      const data = left.length === 0 ? chunk : Buffer.concat([left, chunk]);
      const kept: Buffer[] = [];
      let from = 0;
      for (;;) {
        const end = data.indexOf(10, from);
        if (end === -1) break;
        progress.linesRead += 1;
        if (skipPartial) {
          skipPartial = false;
        } else if (data[from] === 123 || data[from] === 44) {
          const head = data.toString("utf8", from, Math.min(end, from + 160));
          const match = /"id":"Q(\d+)"/.exec(head);
          const id = match === null ? -1 : Number(match[1]);
          const mentionsStar = data.subarray(from, end).includes(STAR_NEEDLE);
          const wanted = id >= 0 && (mentionsStar || partTargets.has(id));
          if (id >= 0 && ((ids.has(id) && !keptIds.has(id)) || wanted)) {
            try {
              const text = data.toString("utf8", from, end);
              if (ids.has(id) && !keptIds.has(id)) {
                const slim = slimLine(text);
                if (slim !== null) {
                  kept.push(Buffer.from(slim));
                  keptIds.add(id);
                  progress.itemsKept += 1;
                }
              }
              if (wanted) starLine(text, id, partTargets, starsWritten, progress);
            } catch {
              console.log(`skipped Q${id}: the line did not parse`);
            }
          }
        }
        from = end + 1;
      }
      left = Buffer.from(data.subarray(from));
      if (kept.length > 0) out.write(Buffer.concat(kept));
      if (Date.now() - lastReport > 60000) {
        lastReport = Date.now();
        progress.header = header;
        writeProgress(progress);
        console.log(`${new Date().toISOString()} fed ${(progress.bytesFed / 1e9).toFixed(2)} GB, read ${(progress.linesRead / 1e6).toFixed(1)} M lines, kept ${progress.itemsKept}, stars ${progress.starsKept}`);
      }
    });

    let curlCode: number | null = null;
    let bzipCode: number | null = null;
    const finish = (): void => {
      if (settled || curlCode === null || bzipCode === null) return;
      settled = true;
      out.end(() => {
        progress.header = header;
        const headerText = existsSync(headers) ? readFileSync(headers, "utf8") : "";
        const status = headerText.split("\n").find((line) => line.startsWith("HTTP/"))?.trim() ?? "no status";
        const total = /content-range: bytes \d+-\d+\/(\d+)/i.exec(headerText)?.[1] ?? /content-length: (\d+)/i.exec(headerText)?.[1];
        if (total !== undefined) progress.totalBytes = Number(total);
        logRequest(`GET ${DUMP_URL} -> ${status}, fed ${progress.bytesFed} bytes, ${Math.round((Date.now() - started) / 1000)} s, curl ${curlCode}, bzip2 ${bzipCode}`);
        const resumedCrc = start > 0 && bzipCode === 2;
        const clean = curlCode === 0 && (bzipCode === 0 || resumedCrc);
        const short = progress.totalBytes !== null && progress.bytesFed < progress.totalBytes;
        if (!clean || short) {
          writeProgress(progress);
          fail(new Error(`curl ${curlCode}, bzip2 ${bzipCode} after ${progress.bytesFed} bytes (${status})`));
          return;
        }
        progress.complete = true;
        writeProgress(progress);
        console.log(`${new Date().toISOString()} pass done: ${JSON.stringify(progress)}`);
        done(progress);
      });
    };
    curl.on("close", (code) => {
      curlCode = code;
      finish();
    });
    bzip.on("close", (code) => {
      bzipCode = code;
      finish();
    });
    curl.on("error", fail);
    bzip.on("error", fail);
  });

await main();
