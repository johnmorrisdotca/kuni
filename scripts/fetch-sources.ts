// Downloads the pinned inputs that are not on npm into data-sources/, and records each file's address,
// the day it was read and its SHA-256 in data-sources/sources.json. scripts/build-data.ts checks every
// file against that hash before it reads it, so the normal build never touches the network and makes
// the same data from the same files every time.
//
//   pnpm data:fetch                 every input below
//   pnpm data:fetch world-bank      only the inputs whose path holds the word (here the World Bank's population)
//
// The CLDR files are read from the release tag that matches the cldr-core and cldr-localenames-full
// versions in package.json; the time-zone table from a tagged tzdb release. Only the TLD list has no
// release: IANA keeps one current file, whose first line names its version. The World Bank's population is one
// response of its API for one year, saved as it came (CC BY 4.0; the credit is in NOTICE.md).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { MANIFEST_PATH, readManifest, recordFile, sha256, SOURCES_DIR, USER_AGENT, writeManifest } from "./sources.ts";

const CLDR_TAG = "release-48-2";
const TZDB_RELEASE = "2026e";
const WORLD_BANK_YEAR = 2025;

const DOWNLOADS: { path: string; url: string; note: string }[] = [
  {
    path: `cldr/${CLDR_TAG}/subdivisions-en.xml`,
    url: `https://raw.githubusercontent.com/unicode-org/cldr/${CLDR_TAG}/common/subdivisions/en.xml`,
    note: "Unicode CLDR 48.2, English names of subdivisions (Unicode-3.0)",
  },
  {
    path: `cldr/${CLDR_TAG}/subdivisions-ja.xml`,
    url: `https://raw.githubusercontent.com/unicode-org/cldr/${CLDR_TAG}/common/subdivisions/ja.xml`,
    note: "Unicode CLDR 48.2, Japanese names of subdivisions (Unicode-3.0)",
  },
  {
    path: `cldr/${CLDR_TAG}/validity-subdivision.xml`,
    url: `https://raw.githubusercontent.com/unicode-org/cldr/${CLDR_TAG}/common/validity/subdivision.xml`,
    note: "Unicode CLDR 48.2, which subdivision codes are current and which deprecated (Unicode-3.0)",
  },
  {
    path: `iana/tzdb-${TZDB_RELEASE}/zone.tab`,
    url: `https://data.iana.org/time-zones/tzdb-${TZDB_RELEASE}/zone.tab`,
    note: `IANA time zone database ${TZDB_RELEASE}, country to zone table (public domain)`,
  },
  {
    path: "iana/tlds-alpha-by-domain.txt",
    url: "https://data.iana.org/TLD/tlds-alpha-by-domain.txt",
    note: "IANA root zone, the list of top-level domains",
  },
  {
    path: `world-bank-sp-pop-totl-${WORLD_BANK_YEAR}.json`,
    url: `https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?date=${WORLD_BANK_YEAR}&format=json&per_page=20000`,
    note: `World Bank, Population, total (SP.POP.TOTL), every country and aggregate for ${WORLD_BANK_YEAR}, as the API v2 answered (CC BY 4.0)`,
  },
];

const main = async (): Promise<void> => {
  let manifest = readManifest();
  const today = new Date().toISOString().slice(0, 10);
  const only = process.argv.slice(2);
  const chosen = DOWNLOADS.filter((download) => only.length === 0 || only.some((word) => download.path.includes(word)));
  if (chosen.length === 0) throw new Error(`No input has a path holding ${only.join(" or ")}`);
  for (const download of chosen) {
    console.log(`Downloading ${download.url}`);
    const response = await fetch(download.url, { headers: { "user-agent": USER_AGENT } });
    if (!response.ok) throw new Error(`${download.url} answered ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const target = join(SOURCES_DIR, download.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
    manifest = recordFile(manifest, { path: download.path, url: download.url, read: today, sha256: sha256(bytes), note: download.note });
  }
  writeManifest(manifest);
  console.log(`Wrote ${chosen.length} files and ${MANIFEST_PATH}`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

