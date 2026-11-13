// Takes the time zone of each place of Natural Earth's 10m Populated Places (public domain), the TIMEZONE column the
// build's other cut of the file leaves out, into data-sources/natural-earth-timezones-<version>.json, recorded in
// sources.json with its SHA-256. It reads the same release file as scripts/fetch-cities.ts (nvkelso/natural-earth-vector,
// tag v5.1.2, kept in .cities-cache/ne-<version>.geojson) and refuses a file whose SHA-256 is not the one recorded for it.
// Run by hand from a Mac (`node scripts/fetch-city-zones.ts`), never on a timer. Which of the zones a city keeps is decided
// in scripts/build-data.ts, against IANA's zone.tab.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readManifest, recordFile, ROOT, sha256, SOURCES_DIR, USER_AGENT, writeManifest } from "./sources.ts";

const NE_VERSION = "5.1.2";
const NE_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v${NE_VERSION}/geojson/ne_10m_populated_places.geojson`;
const CACHE = join(ROOT, ".cities-cache");

const main = async (): Promise<void> => {
  const cached = join(CACHE, `ne-${NE_VERSION}.geojson`);
  mkdirSync(CACHE, { recursive: true });
  if (!existsSync(cached)) {
    console.log(`Downloading Natural Earth ${NE_VERSION}'s 10m populated places ...`);
    const response = await fetch(NE_URL, { headers: { "user-agent": USER_AGENT } });
    if (!response.ok) throw new Error(`Natural Earth answered ${response.status}`);
    writeFileSync(cached, Buffer.from(await response.arrayBuffer()));
  }
  const bytes = readFileSync(cached);
  const whole = sha256(bytes);
  const recorded = readManifest().files.find((file) => file.path === `natural-earth-populated-places-${NE_VERSION}.json`)?.note.match(/is ([0-9a-f]{64})/)?.[1];
  if (recorded !== undefined && recorded !== whole) throw new Error(`The release file has SHA-256 ${whole}; sources.json records ${recorded}`);
  const collection = JSON.parse(bytes.toString("utf8")) as { features: { properties: Record<string, unknown> }[] };
  const zones: [number, string][] = [];
  for (const { properties: p } of collection.features) {
    if (String(p.FEATURECLA).toLowerCase() === "historic place") continue;
    const neId = Number(p.NE_ID);
    if (Number.isInteger(neId) && neId > 0 && typeof p.TIMEZONE === "string" && /^[A-Za-z]+(\/[A-Za-z0-9_+-]+)+$/.test(p.TIMEZONE)) zones.push([neId, p.TIMEZONE]);
  }
  zones.sort((a, b) => a[0] - b[0]);
  const read = new Date().toISOString().slice(0, 10);
  const text = `{
  "source": ${JSON.stringify(NE_URL)},
  "licence": "Public domain (https://www.naturalearthdata.com/about/terms-of-use/)",
  "release": ${JSON.stringify(NE_VERSION)},
  "wholeFileSha256": ${JSON.stringify(whole)},
  "columns": ["NE_ID", "TIMEZONE"],
  "zones": [
${zones.map((row) => `    ${JSON.stringify(row)}`).join(",\n")}
  ]
}
`;
  const path = `natural-earth-timezones-${NE_VERSION}.json`;
  writeFileSync(join(SOURCES_DIR, path), text);
  writeManifest(
    recordFile(readManifest(), {
      path,
      url: NE_URL,
      read,
      sha256: sha256(text),
      note: `Natural Earth ${NE_VERSION}, 10m Populated Places (public domain): the TIMEZONE of each place that has one, by NE_ID; the SHA-256 of the whole file at the address is ${whole}`,
    }),
  );
  console.log(`Wrote data-sources/${path}: ${zones.length} places have a zone.`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
