// Fetches the GHSL Urban Centre Database (R2024A, release V1-2, general characteristics) into
// data-sources/ghsl-ucdb-r2024a.json, recorded in sources.json with its SHA-256. Run by hand
// (`node scripts/fetch-ghsl.ts`), never on a timer. Each urban centre: its id, its main name, the other names it holds,
// its country (the UN's English name), its population in 2025, and its centroid in degrees (the database gives it in
// World Mollweide, ESRI:54009, turned back here). (c) European Union, 1995-2026; licensed under CC BY 4.0
// (https://creativecommons.org/licenses/by/4.0), as the copyright.txt beside the files says (read 2026-11-11).

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { readManifest, recordFile, sha256, SOURCES_DIR, writeManifest } from "./sources.ts";

const URL =
  "https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_UCDB_GLOBE_R2024A/GHS_UCDB_THEME_GLOBE_R2024A/GHS_UCDB_THEME_GENERAL_CHARACTERISTICS_GLOBE_R2024A/V1-2/GHS_UCDB_THEME_GENERAL_CHARACTERISTICS_GLOBE_R2024A_V1_2.zip";
const GPKG = "GHS_UCDB_THEME_GENERAL_CHARACTERISTICS_GLOBE_R2024A.gpkg";
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; a hand-run data refresh)";
// World Mollweide is drawn on a sphere of the WGS 84 equatorial radius.
const RADIUS = 6378137;

const degrees = (x: number, y: number): [number, number] => {
  const theta = Math.asin(y / (Math.SQRT2 * RADIUS));
  const lat = (Math.asin((2 * theta + Math.sin(2 * theta)) / Math.PI) * 180) / Math.PI;
  const lon = ((Math.PI * x) / (2 * Math.SQRT2 * RADIUS * Math.cos(theta)) * 180) / Math.PI;

  return [Math.round(lat * 1e4) / 1e4, Math.round(lon * 1e4) / 1e4];
};

const main = async (): Promise<void> => {
  const response = await fetch(URL, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`The JRC answered ${response.status}`);
  const folder = mkdtempSync(join(tmpdir(), "kuni-ghsl-"));
  try {
    writeFileSync(join(folder, "ucdb.zip"), Buffer.from(await response.arrayBuffer()));
    execFileSync("unzip", ["-q", "-o", join(folder, "ucdb.zip"), GPKG, "-d", folder]);
    const db = new DatabaseSync(join(folder, GPKG), { readOnly: true });
    const rows = db
      .prepare(
        `SELECT m.ID_UC_G0 AS id, m.GC_UCN_MAI_2025 AS main, m.GC_UCN_LIS_2025 AS names, m.GC_CNT_UNN_2025 AS country, m.GC_POP_TOT_2025 AS people, c.GC_UCC_LON_2025 AS x, c.GC_UCC_LAT_2025 AS y
         FROM GHSL_UCDB_THEME_GENERAL_CHARACTERISTICS_GLOBE_R2024A m JOIN UC_centroids c ON c.ID_UC_G0 = m.ID_UC_G0`,
      )
      .all() as { id: number; main: string; names: string | null; country: string; people: number; x: number; y: number }[];
    db.close();
    const centres = rows
      .map((row): [number, string, string[], string, number, number, number] => {
        const [lat, lon] = degrees(row.x, row.y);
        const others = (row.names ?? "").split(";").map((name) => name.trim()).filter((name) => name !== "" && name !== row.main);

        return [row.id, row.main, others, row.country, Math.round(row.people), lat, lon];
      })
      .sort((a, b) => b[4] - a[4] || a[0] - b[0]);
    const read = new Date().toISOString().slice(0, 10);
    const text = `${JSON.stringify({
      source: URL,
      product: "GHSL Urban Centre Database R2024A (GHS-UCDB R2024A), release V1-2, theme General Characteristics",
      licence: "CC BY 4.0 (https://creativecommons.org/licenses/by/4.0): (c) European Union, 1995-2026; reuse is allowed provided appropriate credit is given and any changes are indicated",
      credit:
        "Mari Rivero, I., Melchiorri, M., Florio, P., Schiavina, M., Goch, K., Politis, P., Uhl, J. H., Pesaresi, M., Maffenini, L., Sulis, P., et al. (2024): GHS-UCDB R2024A - GHS Urban Centre Database 2025. European Commission, Joint Research Centre (JRC). Changes: cut to each centre's id, names, country, 2025 population and centroid, the centroid turned from World Mollweide to degrees.",
      read,
      columns: ["urban centre id", "main name", "other names", "country (UN name)", "population 2025", "centroid latitude", "centroid longitude"],
      centres,
    }).replace(/\],\[/g, "],\n[")}\n`;
    const path = "ghsl-ucdb-r2024a.json";
    writeFileSync(join(SOURCES_DIR, path), text);
    writeManifest(recordFile(readManifest(), { path, url: URL, read, sha256: sha256(text), note: "The GHSL Urban Centre Database R2024A (European Commission, JRC): each urban centre's names, country, 2025 population and centroid (CC BY 4.0)" }));
    console.log(`Wrote data-sources/${path}: ${centres.length} urban centres.`);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
