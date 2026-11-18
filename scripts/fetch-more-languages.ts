// Downloads CLDR's subdivision names for Spanish, German and Chinese (MODULES-1594) into data-sources/cldr/, records each file's
// address, day and SHA-256 in data-sources/sources.json, and keeps a log of every request in data-sources/requests-<day>.log.
//
//   pnpm data:more-languages
//
// The rules it keeps, from the brief: one request a second or slower (`PAUSE_MS`), the robots.txt of every host read first and a
// path it disallows never asked, a descriptive User-Agent, and a copy of every download in a cache outside the repository
// (`~/.cache/kuni-data`, or $KUNI_DATA_CACHE) so a second run asks nobody. Wikidata's labels are not fetched here: see
// scripts/extract-wikidata-labels.ts, which reads a Wikimedia dump instead of asking the query service or the API.

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { MANIFEST_PATH, readManifest, recordFile, sha256, SOURCES_DIR, USER_AGENT, writeManifest } from "./sources.ts";

const CLDR_TAG = "release-48-2";
const PAUSE_MS = 1200;
const CACHE_DIR = process.env.KUNI_DATA_CACHE ?? join(homedir(), ".cache", "kuni-data");

// CLDR's file for each language, named by CLDR's locale (zh is Simplified, zh_Hant is Traditional).
const LOCALES = [
  { locale: "es", language: "Spanish" },
  { locale: "de", language: "German" },
  { locale: "zh", language: "Simplified Chinese" },
  { locale: "zh_Hant", language: "Traditional Chinese" },
] as const;

const today = new Date().toISOString().slice(0, 10);
const LOG = join(SOURCES_DIR, `requests-${today}.log`);
const pause = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));
const log = (line: string): void => {
  appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`);
  console.log(line);
};

let last = 0;
// One request, no sooner than PAUSE_MS after the one before, and logged.
const ask = async (url: string): Promise<{ status: number; bytes: Buffer }> => {
  const wait = last + PAUSE_MS - Date.now();
  if (wait > 0) await pause(wait);
  last = Date.now();
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  const bytes = Buffer.from(await response.arrayBuffer());
  log(`GET ${url} -> ${response.status} ${bytes.length} bytes`);

  return { status: response.status, bytes };
};

// Whether robots.txt lets `*` read the path: the longest matching rule wins, Allow over Disallow at a tie; no robots.txt (404) allows all.
const allowed = (robots: string, path: string): boolean => {
  let applies = false;
  let best = { length: -1, allow: true };
  for (const raw of robots.split("\n")) {
    const line = raw.replace(/#.*/, "").trim();
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (field === "user-agent") applies = value === "*";
    else if (applies && (field === "allow" || field === "disallow") && value !== "" && path.startsWith(value) && value.length >= best.length) {
      best = { length: value.length, allow: field === "allow" };
    }
  }

  return best.allow;
};

const main = async (): Promise<void> => {
  mkdirSync(CACHE_DIR, { recursive: true });
  let manifest = readManifest();
  const robots = new Map<string, string>();
  for (const { locale, language } of LOCALES) {
    const url = `https://raw.githubusercontent.com/unicode-org/cldr/${CLDR_TAG}/common/subdivisions/${locale}.xml`;
    const { host, pathname } = new URL(url);
    if (!robots.has(host)) {
      const found = await ask(`https://${host}/robots.txt`);
      robots.set(host, found.status === 200 ? found.bytes.toString("utf8") : "");
    }
    if (!allowed(robots.get(host)!, pathname)) throw new Error(`${host}'s robots.txt disallows ${pathname}`);
    const cached = join(CACHE_DIR, `cldr-${CLDR_TAG}-subdivisions-${locale}.xml`);
    let bytes: Buffer;
    if (existsSync(cached)) {
      bytes = readFileSync(cached);
      log(`CACHE ${url} -> ${bytes.length} bytes`);
    } else {
      const found = await ask(url);
      if (found.status !== 200) throw new Error(`${url} answered ${found.status}`);
      bytes = found.bytes;
      writeFileSync(cached, bytes);
    }
    const path = `cldr/${CLDR_TAG}/subdivisions-${locale}.xml`;
    mkdirSync(dirname(join(SOURCES_DIR, path)), { recursive: true });
    writeFileSync(join(SOURCES_DIR, path), bytes);
    manifest = recordFile(manifest, { path, url, read: today, sha256: sha256(bytes), note: `Unicode CLDR 48.2, ${language} names of subdivisions (Unicode-3.0)` });
  }
  writeManifest(manifest);
  console.log(`Recorded in ${MANIFEST_PATH}; the request log is ${LOG}`);
};

await main();
