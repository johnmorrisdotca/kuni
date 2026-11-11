// Fetches Japan Post's postal-code data (the UTF-8 file of every town, utf_ken_all.zip) and keeps, for each
// municipality, its local government code, prefecture, name and reading in katakana, in
// data-sources/japan-post-municipalities-<day>.json, recorded in sources.json with its SHA-256. Run by hand
// (`node scripts/fetch-japan-post.ts`), never on a timer. Japan Post claims no copyright on its postal-code data
// (NOTICE.md quotes its terms). The build reads a Japanese city a reading from it where Wikidata has none.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";

import { readManifest, recordFile, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const URL = "https://www.post.japanpost.jp/service/search/zipcode/download/utf/zip/utf_ken_all.zip";
const TERMS = "https://www.post.japanpost.jp/service/search/zipcode/download/readme.html";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh)";

/** The one file of a zip archive, as bytes: read from its central directory, stored or deflated. */
const onlyFile = (zip: Buffer): Buffer => {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error("Not a zip archive");
  const central = zip.readUInt32LE(end + 16);
  if (zip.readUInt32LE(central) !== 0x02014b50) throw new Error("No central directory");
  const method = zip.readUInt16LE(central + 10);
  const size = zip.readUInt32LE(central + 20);
  const local = zip.readUInt32LE(central + 42);
  const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
  const body = zip.subarray(start, start + size);
  if (method === 0) return body;
  if (method === 8) return inflateRawSync(body);
  throw new Error(`A zip method this script does not read: ${method}`);
};

const main = async (): Promise<void> => {
  const response = await fetch(URL, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Japan Post answered ${response.status}`);
  const csv = onlyFile(Buffer.from(await response.arrayBuffer())).toString("utf8");
  // Columns: the local government code, the old and the new postal code, the prefecture, municipality and town in
  // katakana, then in kanji, then flags. A municipality has many towns: it is kept once, by its code.
  const municipalities = new Map<string, [string, string, string, string]>();
  for (const line of csv.split(/\r?\n/)) {
    if (line === "") continue;
    const cells = line.split(",").map((cell) => cell.replace(/^"|"$/g, ""));
    const [code, , , , cityKana, , prefecture, city] = cells;
    if (code === undefined || cityKana === undefined || prefecture === undefined || city === undefined) throw new Error(`A row this script does not read: ${line}`);
    // The reading in full-width katakana, nothing else: the build makes it hiragana and trusts it.
    const katakana = cityKana.normalize("NFKC");
    if (!/^[ァ-ヶー]+$/u.test(katakana)) throw new Error(`A municipality's reading that is not katakana alone: ${code} ${city} ${cityKana}`);
    if (!municipalities.has(code)) municipalities.set(code, [code, prefecture, city, katakana]);
  }
  const read = new Date().toISOString().slice(0, 10);
  const text = `${JSON.stringify({
    source: URL,
    terms: TERMS,
    licence: "No copyright claimed: 郵便番号データに限っては日本郵便株式会社は著作権を主張しません。 (Japan Post claims no copyright on its postal-code data.)",
    read,
    columns: ["local government code", "prefecture", "municipality", "municipality in katakana"],
    municipalities: [...municipalities.values()].sort((a, b) => (a[0] < b[0] ? -1 : 1)),
  }).replace(/\],\[/g, "],\n[")}\n`;
  const path = `japan-post-municipalities-${read}.json`;
  writeFileSync(join(SOURCES_DIR, path), text);
  writeManifest(
    recordFile(
      { files: readManifest().files.filter((file) => !file.path.startsWith("japan-post-municipalities-") || file.path === path) },
      { path, url: URL, read, sha256: sha256(text), note: "Japan Post's postal-code data (utf_ken_all.zip): each municipality's code, prefecture, name and reading in katakana, once each" },
    ),
  );
  console.log(`Wrote data-sources/${path}: ${municipalities.size} municipalities.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
