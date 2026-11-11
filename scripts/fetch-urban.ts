// Fetches the official figures of the urban areas a city is ranked by, into data-sources/urban-areas-<day>.json,
// recorded in sources.json with its SHA-256. Run by hand (`node scripts/fetch-urban.ts`), never on a timer.
//   - Statistics Canada: the population estimates of each census metropolitan area and census agglomeration on 1 July
//     of the latest year (Table 17-10-0148-01, 2021 boundaries), and which municipalities (census subdivisions) each
//     holds (Table 98-10-0003-01, 2021 Census). Statistics Canada Open Licence,
//     https://www.statcan.gc.ca/en/reference/licence (read 2026-11-11).
//   - U.S. Census Bureau: the population estimates of each metropolitan and micropolitan statistical area on 1 July 2024
//     (Vintage 2024, cbsa-est2024-alldata.csv). A work of the United States government, in the public domain.
//   - OECD: the population of each functional urban area, the latest year (Data Explorer, DSD_FUA_DEMO@DF_AGE_SEX).
//     OECD Terms and Conditions, section 3, Data (read 2026-11-11): free for any use, with the credit given in the file.
// Each section of the file carries its own source, licence and credit; NOTICE.md repeats them.

import { execFileSync } from "node:child_process";
import { createReadStream, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

import { readManifest, recordFile, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh)";
const STATCAN_ESTIMATES = "https://www150.statcan.gc.ca/n1/tbl/csv/17100148-eng.zip";
const STATCAN_MEMBERS = "https://www150.statcan.gc.ca/n1/tbl/csv/98100003-eng.zip";
const CENSUS = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/metro/totals/cbsa-est2024-alldata.csv";
const OECD = "https://sdmx.oecd.org/public/rest/data/OECD.CFE.EDS,DSD_FUA_DEMO@DF_AGE_SEX,/.A.POP.PS._T._T._Z.FUA._Z?startPeriod=2015";
// The OECD's codes of its members are Eurostat's two letters in Europe (UK, EL) and ISO's three elsewhere.
const OECD_COUNTRIES: Readonly<Record<string, string>> = { UK: "GB", EL: "GR", AUS: "AU", CAN: "CA", COL: "CO", ISR: "IL", JPN: "JP", KOR: "KR", MEX: "MX", NZL: "NZ", USA: "US" };

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

const download = async (url: string, accept?: string): Promise<Buffer> => {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT, ...(accept === undefined ? {} : { accept }) } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);

  return Buffer.from(await response.arrayBuffer());
};

const unzipped = async (url: string, folder: string, names: string[]): Promise<void> => {
  writeFileSync(join(folder, "table.zip"), await download(url));
  execFileSync("unzip", ["-q", "-o", join(folder, "table.zip"), ...names, "-d", folder]);
  rmSync(join(folder, "table.zip"));
};

// DGUID 2021S0503… is a census metropolitan area, 2021S0504… a census agglomeration (a part of one has more digits).
const isArea = (dguid: string): boolean => /^2021S050[34]\d{3}$/.test(dguid);

const statcan = async (folder: string): Promise<{ year: number; estimates: [string, number][]; members: [string, string, string][] }> => {
  // The estimates: every year since 2001 by gender and age; the whole population of each area on 1 July of the latest.
  await unzipped(STATCAN_ESTIMATES, folder, ["17100148.csv"]);
  const latest = new Map<string, [number, number]>();
  const lines = createInterface({ input: createReadStream(join(folder, "17100148.csv"), "utf8"), crlfDelay: Infinity });
  let header: string[] | null = null;
  for await (const line of lines) {
    const row = fields(line.replace(/^﻿/, ""));
    if (header === null) {
      header = row;
      continue;
    }
    const at = (name: string): string => row[header!.indexOf(name)] ?? "";
    if (at("Gender") !== "Total - gender" || at("Age group") !== "All ages" || !isArea(at("DGUID"))) continue;
    const year = Number(at("REF_DATE"));
    const value = Number(at("VALUE"));
    if (!Number.isFinite(value) || value <= 0) continue;
    const before = latest.get(at("DGUID"));
    if (before === undefined || year > before[0]) latest.set(at("DGUID"), [year, value]);
  }
  const year = Math.max(...[...latest.values()].map(([one]) => one));
  const estimates = [...latest].filter(([, [one]]) => one === year).map(([dguid, [, value]]): [string, number] => [dguid, value]);
  estimates.sort((a, b) => b[1] - a[1]);

  // The members: the metadata names each place's parent, a municipality's being the area that holds it.
  await unzipped(STATCAN_MEMBERS, folder, ["98100003.csv", "98100003_MetaData.csv"]);
  const meta = readFileSync(join(folder, "98100003_MetaData.csv"), "utf8").replace(/^﻿/, "").split(/\r?\n/);
  const parentOf = new Map<string, string>();
  for (const line of meta) {
    const row = fields(line);
    if (row[0] === "1" && /^\d+$/.test(row[3] ?? "")) parentOf.set(row[3]!, row[4] ?? "");
  }
  const data = readFileSync(join(folder, "98100003.csv"), "utf8").replace(/^﻿/, "").split(/\r?\n/);
  const dguidOf = new Map<string, string>();
  const places: { name: string; dguid: string; member: string }[] = [];
  for (const line of data.slice(1)) {
    if (line.trim() === "") continue;
    const [, name, dguid, member] = fields(line);
    if (name === undefined || dguid === undefined || member === undefined) continue;
    dguidOf.set(member, dguid);
    places.push({ name, dguid, member });
  }
  const members: [string, string, string][] = [];
  for (const place of places) {
    if (!/^2021A0005/.test(place.dguid)) continue;
    let up = parentOf.get(place.member);
    while (up !== undefined && up !== "" && !isArea(dguidOf.get(up) ?? "")) up = parentOf.get(up);
    const area = up === undefined ? undefined : dguidOf.get(up);
    if (area !== undefined && isArea(area)) members.push([place.name, place.dguid, area]);
  }

  return { year, estimates, members };
};

const census = async (): Promise<[string, string, "MSA" | "μSA", number][]> => {
  const text = (await download(CENSUS)).toString("latin1").split(/\r?\n/);
  const header = fields(text[0]!);
  const at = (row: string[], name: string): string => row[header.indexOf(name)] ?? "";
  const areas: [string, string, "MSA" | "μSA", number][] = [];
  for (const line of text.slice(1)) {
    if (line.trim() === "") continue;
    const row = fields(line);
    const lsad = at(row, "LSAD");
    const kind = lsad === "Metropolitan Statistical Area" ? "MSA" : lsad === "Micropolitan Statistical Area" ? "μSA" : null;
    if (kind === null) continue;
    areas.push([at(row, "CBSA"), at(row, "NAME"), kind, Number(at(row, "POPESTIMATE2024"))]);
  }
  areas.sort((a, b) => b[3] - a[3]);

  return areas;
};

const oecd = async (): Promise<[string, string, string, number, number][]> => {
  const text = (await download(OECD, "application/vnd.sdmx.data+csv; labels=both")).toString("utf8").replace(/^﻿/, "").split(/\r?\n/);
  const header = fields(text[0]!);
  const area = header.findIndex((name) => name.startsWith("REF_AREA"));
  const time = header.findIndex((name) => name.startsWith("TIME_PERIOD"));
  const value = header.indexOf("OBS_VALUE");
  const latest = new Map<string, [string, string, number, number]>();
  for (const line of text.slice(1)) {
    if (line.trim() === "") continue;
    const row = fields(line);
    const [code, ...rest] = (row[area] ?? "").split(": ");
    const name = rest.join(": ");
    const prefix = /^[A-Z]+/.exec(code ?? "")?.[0] ?? "";
    const country = OECD_COUNTRIES[prefix] ?? (prefix.length === 2 ? prefix : null);
    if (code === undefined || country === null) throw new Error(`An OECD area of no known country: ${row[area]}`);
    const year = Number(row[time]);
    const people = Math.round(Number(row[value]));
    const before = latest.get(code);
    if (before === undefined || year > before[2]) latest.set(code, [name, country, year, people]);
  }
  const areas = [...latest].map(([code, [name, country, year, people]]): [string, string, string, number, number] => [code, name, country, year, people]);
  areas.sort((a, b) => b[4] - a[4]);

  return areas;
};

const main = async (): Promise<void> => {
  const folder = mkdtempSync(join(tmpdir(), "kuni-urban-"));
  try {
    const read = new Date().toISOString().slice(0, 10);
    const canada = await statcan(folder);
    const states = await census();
    const fuas = await oecd();
    const file = {
      read,
      statcan: {
        sources: [STATCAN_ESTIMATES, STATCAN_MEMBERS],
        product: `Statistics Canada, Table 17-10-0148-01, Population estimates, July 1, by census metropolitan area and census agglomeration, 2021 boundary (${canada.year}); Table 98-10-0003-01, Population and dwelling counts: Census metropolitan areas, census agglomerations and census subdivisions (municipalities), 2021 Census`,
        licence: "Statistics Canada Open Licence (https://www.statcan.gc.ca/en/reference/licence)",
        credit: "Adapted from Statistics Canada, Tables 17-10-0148-01 and 98-10-0003-01. This does not constitute an endorsement by Statistics Canada of this product.",
        estimatesFor: `${canada.year}-07-01`,
        estimatesColumns: ["DGUID of the area", `population, 1 July ${canada.year}`],
        estimates: canada.estimates,
        membersColumns: ["municipality (census subdivision)", "its DGUID", "DGUID of the area that holds it"],
        members: canada.members,
      },
      census: {
        source: CENSUS,
        product: "U.S. Census Bureau, Population Division, Annual Resident Population Estimates for Metropolitan and Micropolitan Statistical Areas, Vintage 2024 (July 1, 2024)",
        licence: "A work of the United States government, not subject to copyright (17 U.S.C. 105): public domain",
        credit: "Source: U.S. Census Bureau, Vintage 2024 Population Estimates.",
        columns: ["CBSA code", "title", "MSA (metropolitan) or μSA (micropolitan)", "population, 1 July 2024"],
        areas: states,
      },
      oecd: {
        source: OECD,
        product: "OECD, Functional urban areas: population by age and sex (DSD_FUA_DEMO@DF_AGE_SEX), total, the latest year of each area",
        licence: "OECD Terms and Conditions, section 3, Data (https://www.oecd.org/en/about/terms-conditions.html): free to extract, copy, adapt and redistribute for any purpose, with the credit below kept in any sub-licence",
        credit: `OECD (2026), Functional urban areas: population by age and sex, OECD Data Explorer, https://sdmx.oecd.org/public/rest/data/OECD.CFE.EDS,DSD_FUA_DEMO@DF_AGE_SEX (accessed on ${read}).`,
        columns: ["OECD code", "name", "country (ISO 3166-1 alpha-2)", "year", "population"],
        areas: fuas,
      },
    };
    const text = `${JSON.stringify(file).replace(/\],\[/g, "],\n[")}\n`;
    const path = `urban-areas-${read}.json`;
    writeFileSync(join(SOURCES_DIR, path), text);
    writeManifest(
      recordFile(readManifest(), {
        path,
        url: `${STATCAN_ESTIMATES} ${STATCAN_MEMBERS} ${CENSUS} ${OECD}`,
        read,
        sha256: sha256(text),
        note: "The official populations of urban areas: Statistics Canada's CMAs and CAs and their municipalities (Statistics Canada Open Licence), the U.S. Census Bureau's metropolitan and micropolitan statistical areas (public domain), and the OECD's functional urban areas (OECD Terms and Conditions)",
      }),
    );
    console.log(`Wrote data-sources/${path}: ${canada.estimates.length} Canadian areas (${canada.year}) with ${canada.members.length} municipalities, ${states.length} US areas, ${fuas.length} OECD areas.`);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
