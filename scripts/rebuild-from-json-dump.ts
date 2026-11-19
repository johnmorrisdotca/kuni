// Rebuilds the qualifier snapshots from the slim JSON subset (scripts/extract-dump-json.ts).
// The compressed dump is never stored. This writes candidates under ~/.cache/kuni-data and a diff beside them.
// It does not replace a file in data-sources/. A partial subset is refused unless --sample <code> is set, which
// prints that one code and writes nothing.
//
//   node scripts/rebuild-from-json-dump.ts [--day 2026-11-17] [--sample BE]

import { createReadStream, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

import { CAPITAL_ITEMS } from "./facts-config.ts";
import { factsFrom } from "./dump-facts.ts";
import type { FactAnswers, FactRows } from "./dump-facts.ts";
import { codesFrom, elevationsFrom, populationsFrom } from "./dump-figures.ts";
import type { DumpEntity } from "./dump-claims.ts";
import { splitRows } from "./dump-row-diff.ts";
import { MEMBERSHIPS } from "./groupings-config.ts";
import { SOURCES_DIR } from "./sources.ts";

const CACHE_DIR = process.env.KUNI_DATA_CACHE ?? join(homedir(), ".cache", "kuni-data");
const args = process.argv.slice(2);
const option = (name: string): string | undefined => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const day = option("--day") ?? "2026-11-17";
const sample = option("--sample");
const subsetFile = join(CACHE_DIR, `dump-json-subset-${day}.jsonl`);
const progressFile = join(CACHE_DIR, `dump-json-subset-${day}.progress.json`);
const DUMP = "https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.bz2";

const load = async (): Promise<Map<string, DumpEntity>> => {
  const entities = new Map<string, DumpEntity>();
  const lines = createInterface({ input: createReadStream(subsetFile), crlfDelay: Infinity });
  for await (const line of lines) {
    if (line.trim() === "") continue;
    const entity = JSON.parse(line) as DumpEntity;
    if (typeof entity.id === "string") entities.set(entity.id, entity);
  }
  return entities;
};

const readJson = (path: string): { answers?: FactAnswers; statements?: unknown; elevations?: unknown; ioc?: unknown; withdrawn?: unknown } => JSON.parse(readFileSync(path, "utf8")) as never;

const cityNumbers = (): number[] => {
  const numbers = new Set<number>();
  for (const name of readdirSync(SOURCES_DIR).filter((one) => /^wikidata-cities(-extra)?-\d/.test(one))) {
    const file = JSON.parse(readFileSync(join(SOURCES_DIR, name), "utf8")) as { items?: [number][] };
    for (const item of file.items ?? []) numbers.add(item[0]);
  }
  return [...numbers];
};

const elevationNumbers = (): number[] => {
  const numbers = new Set<number>(cityNumbers());
  for (const name of readdirSync(SOURCES_DIR).filter((one) => one.startsWith("natural-earth-populated-places-"))) {
    const file = JSON.parse(readFileSync(join(SOURCES_DIR, name), "utf8")) as { places?: [string][] };
    for (const place of file.places ?? []) if (/^Q\d+$/.test(place[0])) numbers.add(Number(place[0].slice(1)));
  }
  return [...numbers];
};

const compareRows = (name: string, pinned: FactRows, next: FactRows, present: ReadonlySet<string>): string[] => {
  const lines = [`## ${name}`];
  let same = 0;
  let precision = 0;
  let changed = 0;
  let gaps = 0;
  let onlyDump = 0;
  const samples: string[] = [];
  for (const code of [...new Set([...Object.keys(pinned), ...Object.keys(next)])].sort()) {
    const split = splitRows(code, pinned[code], next[code], present);
    same += split.same;
    precision += split.precision;
    changed += split.changed;
    gaps += split.gaps;
    onlyDump += split.onlyDump;
    for (const sample of split.samples) if (samples.length < 8) samples.push(sample);
  }
  lines.push(`${same} codes match, ${precision} differ only past 8 decimal places, ${changed} changed, ${gaps} gaps (the item is not in the subset; a gap is not a change), ${onlyDump} only in the dump.`);
  lines.push(...samples);
  return lines;
};

const compareNumbered = (name: string, pinned: unknown, next: unknown[], present: ReadonlySet<string>): string[] => {
  const rows = Array.isArray(pinned) ? pinned : [];
  let same = 0;
  let changed = 0;
  let gaps = 0;
  const byId = new Map<number, unknown>();
  for (const row of next) if (Array.isArray(row) && typeof row[0] === "number") byId.set(row[0], row);
  const seen = new Set<number>();
  for (const row of rows) {
    if (!Array.isArray(row) || typeof row[0] !== "number") continue;
    seen.add(row[0]);
    const split = splitRows(String(row[0]), [row], byId.has(row[0]) ? [byId.get(row[0])] : [], present);
    same += split.same;
    changed += split.changed;
    gaps += split.gaps;
  }
  let onlyDump = 0;
  for (const id of byId.keys()) if (!seen.has(id)) onlyDump += 1;
  return [`## ${name}`, `${same} match, ${changed} changed, ${gaps} gaps (the item is not in the subset; a gap is not a change), ${onlyDump} only in the dump.`];
};

const main = async (): Promise<void> => {
  const progress = JSON.parse(readFileSync(progressFile, "utf8")) as { complete?: boolean; bytesFed?: number; itemsKept?: number };
  if (progress.complete !== true && sample === undefined) {
    console.log(`subset is not complete (${progress.itemsKept ?? 0} items, ${progress.bytesFed ?? 0} bytes fed). Nothing written.`);
    process.exit(2);
  }
  console.log(`reading ${subsetFile}`);
  const entities = await load();
  console.log(`${entities.size} items`);
  const orgs = new Set(MEMBERSHIPS.map((body) => body.item));
  const facts = factsFrom(entities, orgs, CAPITAL_ITEMS);
  if (sample !== undefined) {
    for (const [name, rows] of Object.entries(facts) as Array<[keyof FactAnswers, FactRows]>) console.log(name, JSON.stringify(rows[sample] ?? null));
    return;
  }
  const populations = populationsFrom(entities, cityNumbers());
  const elevations = elevationsFrom(entities, elevationNumbers());
  const codes = codesFrom(entities);
  const header = { source: DUMP, licence: "CC0-1.0 (Wikidata's structured data, https://www.wikidata.org/wiki/Wikidata:Licensing)", read: day, note: "Rebuilt from the JSON dump subset. Not a replacement for the pinned snapshot until the diff is accepted." };
  writeFileSync(join(CACHE_DIR, `dump-facts-${day}.json`), JSON.stringify({ ...header, answers: facts }));
  writeFileSync(join(CACHE_DIR, `dump-populations-${day}.json`), JSON.stringify({ ...header, ...populations }));
  writeFileSync(join(CACHE_DIR, `dump-elevations-${day}.json`), JSON.stringify({ ...header, elevations: elevations.elevations, unknownUnits: elevations.unknownUnits }));
  writeFileSync(join(CACHE_DIR, `dump-codes-${day}.json`), JSON.stringify({ ...header, ...codes }));

  const present = new Set(entities.keys());
  const pinnedFacts = readJson(join(SOURCES_DIR, "wikidata-facts-2026-10-09.json")).answers!;
  const lines = ["# Qualifier snapshots rebuilt from the JSON dump", "", `Subset ${subsetFile}, dump ${DUMP}, read ${day}. The pinned files in data-sources/ are unchanged. A gap is an item that is not in the subset; it is not counted as a change.`, ""];
  for (const name of Object.keys(facts) as Array<keyof FactAnswers>) lines.push(...compareRows(name, pinnedFacts[name], facts[name], present), "");
  const pinnedPop = readJson(join(SOURCES_DIR, "wikidata-city-populations-2026-11-17.json"));
  const pinnedElev = readJson(join(SOURCES_DIR, "wikidata-city-elevations-2026-11-13.json"));
  const pinnedCodes = readJson(join(SOURCES_DIR, "wikidata-codes-2026-10-10.json"));
  lines.push(...compareNumbered("city populations", pinnedPop.statements, populations.statements, present), "");
  lines.push(...compareNumbered("city elevations", pinnedElev.elevations, elevations.elevations, present), `Unknown elevation units ${elevations.unknownUnits}.`, "");
  lines.push(`## codes`, `Pinned IOC ${Object.keys(pinnedCodes.ioc ?? {}).length}, dump ${Object.keys(codes.ioc).length}. Pinned withdrawn ${Object.keys(pinnedCodes.withdrawn ?? {}).length}, dump ${Object.keys(codes.withdrawn).length}.`, "");
  const diffPath = join(CACHE_DIR, `dump-rebuild-diff-${day}-full.md`);
  writeFileSync(diffPath, `${lines.join("\n")}\n`);
  console.log(`wrote candidates and ${diffPath}`);
  console.log(lines.filter((line) => line.endsWith(".")).join("\n"));
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
