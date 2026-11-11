// Fetches Statistics Canada's 2021 census populations of the census metropolitan areas (CMA) and census agglomerations
// (CA), table 98-10-0005-01, into data-sources/statcan-cma-2021.json (name, province, DGUID, kind, population 2021),
// recorded in sources.json with its SHA-256. Run by hand (`node scripts/fetch-statcan.ts`), never on a timer.
// Statistics Canada Open Licence, https://www.statcan.gc.ca/en/reference/licence (read 2026-11-11); the credit is in
// NOTICE.md and in the file.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readManifest, recordFile, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const URL = "https://www150.statcan.gc.ca/n1/tbl/csv/98100005-eng.zip";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh)";

// One CSV line into its fields: quoted fields may hold commas.
const fields = (line: string): string[] => {
  const out: string[] = [];
  let at = 0;
  while (at <= line.length) {
    if (line[at] === '"') {
      let end = at + 1;
      let text = "";
      while (end < line.length) {
        if (line[end] === '"' && line[end + 1] === '"') {
          text += '"';
          end += 2;
        } else if (line[end] === '"') break;
        else text += line[end++];
      }
      out.push(text);
      at = end + 2;
    } else {
      const end = line.indexOf(",", at);
      out.push(line.slice(at, end === -1 ? line.length : end));
      at = end === -1 ? line.length + 1 : end + 1;
    }
  }

  return out;
};

const main = async (): Promise<void> => {
  const response = await fetch(URL, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Statistics Canada answered ${response.status}`);
  const folder = mkdtempSync(join(tmpdir(), "kuni-statcan-"));
  try {
    writeFileSync(join(folder, "table.zip"), Buffer.from(await response.arrayBuffer()));
    execFileSync("unzip", ["-q", "-o", join(folder, "table.zip"), "98100005.csv", "98100005_MetaData.csv", "-d", folder]);
    // The metadata names each place's parent: a province, or Canada.
    const meta = readFileSync(join(folder, "98100005_MetaData.csv"), "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
    const members = new Map<string, { name: string; parent: string }>();
    for (const line of meta) {
      const row = fields(line);
      if (row[0] === "1" && /^\d+$/.test(row[3] ?? "")) members.set(row[3]!, { name: row[1]!, parent: row[4] ?? "" });
    }
    const data = readFileSync(join(folder, "98100005.csv"), "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
    const header = fields(data[0]!);
    const popAt = header.findIndex((name) => name.startsWith("Population and dwelling counts (13): Population, 2021"));
    const places: [string, string, string, "CMA" | "CA", number][] = [];
    for (const line of data.slice(1)) {
      if (line.trim() === "") continue;
      const row = fields(line);
      const [, geo, dguid, coordinate] = row;
      // DGUID 2021S0503… is a census metropolitan area, 2021S0504… a census agglomeration.
      const kind = /^2021S0503/.test(dguid ?? "") ? "CMA" : /^2021S0504/.test(dguid ?? "") ? "CA" : null;
      if (kind === null) continue;
      const province = members.get(members.get(coordinate ?? "")?.parent ?? "")?.name ?? "";
      const population = Number(row[popAt]);
      if (!Number.isFinite(population) || population <= 0) continue;
      places.push([geo!, province, dguid!, kind, population]);
    }
    places.sort((a, b) => b[4] - a[4]);
    const read = new Date().toISOString().slice(0, 10);
    const text = `${JSON.stringify(
      {
        source: URL,
        product: "Statistics Canada, Table 98-10-0005-01, Population and dwelling counts: Canada, provinces and territories, census metropolitan areas and census agglomerations, 2021 Census",
        licence: "Statistics Canada Open Licence (https://www.statcan.gc.ca/en/reference/licence)",
        credit: "Adapted from Statistics Canada, Table 98-10-0005-01, 2021 Census, reference date 2021-05-11. This does not constitute an endorsement by Statistics Canada of this product.",
        read,
        columns: ["geographic name", "province or territory", "DGUID", "CMA or CA", "population 2021"],
        places,
      },
      null,
      1,
    ).replace(/\n {2}/g, " ")}\n`;
    const path = "statcan-cma-2021.json";
    writeFileSync(join(SOURCES_DIR, path), text);
    writeManifest(recordFile(readManifest(), { path, url: URL, read, sha256: sha256(text), note: "Statistics Canada, Table 98-10-0005-01 (2021 Census): the population of each census metropolitan area and census agglomeration (Statistics Canada Open Licence)" }));
    console.log(`Wrote data-sources/${path}: ${places.filter((one) => one[3] === "CMA").length} CMAs and ${places.filter((one) => one[3] === "CA").length} CAs.`);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
