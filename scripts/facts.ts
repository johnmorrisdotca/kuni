// The facts about each country, for scripts/build-data.ts: its capital's Japanese name and coordinates, its
// population and area with the year each is for, its coordinates, its land borders, the side of the road it drives
// on, and the conventions CLDR records for it (the first day of the week, the measurement system, the paper size
// and the clock). The rules are written at the top of scripts/facts-config.ts; the exceptions are listed there.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { AREA_CHOICES, BORDERS_ADDED, CAPITAL_ITEMS, CAPITAL_JA_OVERRIDES, COUNTRY_ITEMS, FACT_GAPS, POPULATION_PARTS } from "./facts-config.ts";

type Row = unknown[];
type Point = [number, number];

interface FactsSnapshot {
  answers: Record<"items" | "capitals" | "population" | "area" | "points" | "driving" | "borders" | "pinned", Record<string, Row[]>>;
}

interface FactRecord {
  alpha2: string;
  capitalEn: string | null; // countries-list's, or the replacement CAPITAL_ITEMS gives
  capitalJa: string | null;
  capitalPoint: Point | null;
  population: number | null;
  populationYear: number | null;
  area: number | null;
  areaYear: number | null;
  areaPart: "whole" | "none" | "land" | null;
  point: Point | null;
  borders: string[];
  drivingSide: "left" | "right" | null;
  weekStart: string;
  measurement: string;
  paper: string;
  hourCycle: string;
}

interface FactsInputs {
  snapshot: FactsSnapshot;
  countries: { alpha2: string; capital: string | null }[];
  cldr: { weekData: Json; measurementData: Json; timeData: Json; territoryContainment: Record<string, { _contains: string[]; _grouping?: string }> };
  chizuCountries: string; // node_modules/@johnmorrisdotca/chizu/dist/data/countries
}

type Json = Record<string, unknown>;

const KM2 = "Q712226";
const WHOLE = "Q16868672";
const LAND = "Q11081619";
const LEFT = "Q11920728";
const RIGHT = "Q14565199";
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

// The same folding the build uses to compare names: case, accents and anything but letters and digits set aside.
const fold = (text: string): string =>
  text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
const yearOf = (day: unknown): number | null => (typeof day === "string" && /^\d{4}-/.test(day) ? Number(day.slice(0, 4)) : null);
const round = (value: number, places: number): number => Number(value.toFixed(places));
const pointOf = (value: unknown): Point | null => (Array.isArray(value) ? [round(value[0] as number, 2), round(value[1] as number, 2)] : null);
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// The outlines' neighbours, from chizu's map of each country (Natural Earth 1:50m): two countries are neighbours there
// when their outlines share a point. Read from the built files of the installed package; a code chizu does not draw
// on its own is absent.
const naturalEarthNeighbours = (folder: string): Map<string, string[]> => {
  const out = new Map<string, string[]>();
  for (const file of readdirSync(folder).filter((name) => /^[a-z]{2}\.js$/.test(name))) {
    const text = readFileSync(join(folder, file), "utf8");
    const found = /"code": "([A-Z]{2})"[\s\S]*?"neighbors": \[([^\]]*)\]/.exec(text);
    if (found === null) throw new Error(`chizu's ${file} has no code or neighbours`);
    out.set(found[1], found[2].trim() === "" ? [] : (JSON.parse(`[${found[2]}]`) as string[]));
  }

  return out;
};

const buildFacts = (inputs: FactsInputs): { records: FactRecord[]; doc: string[] } => {
  const { snapshot, countries, cldr } = inputs;
  const answers = snapshot.answers;
  const codes = new Set(countries.map((one) => one.alpha2));
  const problems: string[] = [];

  // ----- Which item is the country ---------------------------------------------------------------------------
  const itemOf = new Map<string, string>();
  for (const { alpha2 } of countries) {
    const pinned = COUNTRY_ITEMS[alpha2]?.item;
    const current = (answers.items[alpha2] ?? []).filter((row) => row[1] === null && row[2] === null).map((row) => row[0] as string);
    const chosen = pinned ?? (current.length === 1 ? current[0] : undefined);
    if (chosen === undefined) problems.push(`${alpha2}: ${current.length} current Wikidata items (${current.join(", ")}); name one in COUNTRY_ITEMS`);
    else itemOf.set(alpha2, chosen);
  }
  const rowsOf = (name: keyof FactsSnapshot["answers"], alpha2: string): Row[] => (answers[name][alpha2] ?? []).filter((row) => row[0] === itemOf.get(alpha2));

  // ----- Conventions, from CLDR ------------------------------------------------------------------------------
  const firstDay = cldr.weekData.firstDay as Record<string, string>;
  const measurement = (cldr.measurementData as { measurementSystem: Record<string, string>; paperSize: Record<string, string> }).measurementSystem;
  const paper = (cldr.measurementData as { paperSize: Record<string, string> }).paperSize;
  const timeData = cldr.timeData as Record<string, { _preferred: string }>;
  // The areas that hold a region, nearest first, groupings included (Latin America, 419, is one): CLDR's rule for
  // a region a table does not list is to use the nearest area that holds it, and the world (001) last.
  const holders = (region: string): string[] => {
    const out: string[] = [];
    let at = [region];
    while (at.length > 0) {
      const next = Object.entries(cldr.territoryContainment)
        .filter(([area, { _contains }]) => /^\d{3}$/.test(area) && at.some((one) => _contains.includes(one)) && !out.includes(area))
        .map(([area]) => area);
      out.push(...next);
      at = next;
    }

    return [region, ...out.filter((area) => area !== "001"), "001"];
  };
  const lookup = (table: Record<string, string>, region: string): string => table[holders(region).find((area) => area in table)!];

  // ----- Land borders ----------------------------------------------------------------------------------------
  const outlines = naturalEarthNeighbours(inputs.chizuCountries);
  const stated = new Set<string>();
  for (const { alpha2 } of countries) {
    for (const row of rowsOf("borders", alpha2)) {
      const other = row[1] as string;
      if (row[4] !== null || !codes.has(other) || other === alpha2 || row[2] !== itemOf.get(other)) continue;
      stated.add([alpha2, other].sort(byText).join(" "));
    }
  }
  const touching = new Set<string>();
  for (const [code, near] of outlines) for (const other of near) if (codes.has(code) && codes.has(other)) touching.add([code, other].sort(byText).join(" "));
  const added = new Set(Object.keys(BORDERS_ADDED).map((pair) => pair.split(" ").sort(byText).join(" ")));
  for (const pair of Object.keys(BORDERS_ADDED)) if (pair !== pair.split(" ").sort(byText).join(" ")) problems.push(`BORDERS_ADDED: write "${pair}" in code order`);
  const borders = new Set([...stated].filter((pair) => touching.has(pair)).concat([...added]));
  const statedOnly = [...stated].filter((pair) => !touching.has(pair) && !added.has(pair)).sort(byText);
  const outlinesOnly = [...touching].filter((pair) => !stated.has(pair) && !added.has(pair)).sort(byText);
  for (const pair of added) if (borders.has(pair) && stated.has(pair) && touching.has(pair)) problems.push(`BORDERS_ADDED: ${pair} is found without it`);

  // ----- Each country ----------------------------------------------------------------------------------------
  const records = countries.map(({ alpha2, capital }): FactRecord => {
    // The capital.
    const pin = CAPITAL_ITEMS[alpha2];
    let capitalJa: string | null = null;
    let capitalPoint: Point | null = null;
    const capitalEn = pin?.en ?? capital;
    if (pin !== undefined) {
      const row = (answers.pinned[alpha2] ?? []).find((one) => one[0] === pin.item);
      if (row === undefined) problems.push(`${alpha2}: the pinned capital ${pin.item} is not in the snapshot; run pnpm data:facts`);
      else {
        capitalJa = (row[2] as string | null) ?? null;
        capitalPoint = pointOf(row[3]);
      }
    } else if (capital !== null) {
      const current = rowsOf("capitals", alpha2).filter((row) => row[7] === null);
      const items = [...new Set(current.filter((row) => typeof row[2] === "string" && fold(row[2]) === fold(capital)).map((row) => row[1] as string))];
      if (items.length !== 1) problems.push(`${alpha2}: ${items.length} current Wikidata capitals are called ${capital}; name one in CAPITAL_ITEMS`);
      else {
        const row = current.find((one) => one[1] === items[0])!;
        capitalJa = (row[3] as string | null) ?? null;
        capitalPoint = pointOf(row[4]);
      }
    }
    capitalJa = CAPITAL_JA_OVERRIDES[alpha2]?.ja ?? capitalJa;
    if (capitalJa !== null && (!JAPANESE.test(capitalJa) || /[()（）]/.test(capitalJa))) problems.push(`${alpha2}: the capital's Japanese label ${capitalJa} is not a plain Japanese name`);
    if (capitalEn !== null && capitalJa === null) problems.push(`${alpha2}: the capital ${capitalEn} has no Japanese name`);

    // The population: the best-ranked figures for the whole (or a part listed as the whole), the latest first.
    const people = rowsOf("population", alpha2)
      .filter((row) => row[3] === null || (row[3] as string) in POPULATION_PARTS)
      .sort((a, b) => byText(String(b[2] ?? ""), String(a[2] ?? "")));
    const population = people[0] ?? null;

    // The area: in square kilometres, for the whole, else with no part, else the land.
    const areas = rowsOf("area", alpha2).filter((row) => row[2] === KM2);
    const whole = areas.filter((row) => row[4] === WHOLE);
    const plain = areas.filter((row) => row[4] === null);
    const land = areas.filter((row) => row[4] === LAND);
    const [pool, part] = whole.length > 0 ? [whole, "whole" as const] : plain.length > 0 ? [plain, "none" as const] : land.length > 0 ? [land, "land" as const] : [[], null];
    let area: Row | null = pool.length === 1 ? pool[0] : null;
    const choice = AREA_CHOICES[alpha2];
    let areaPart: FactRecord["areaPart"] = part;
    if (choice !== undefined) {
      area = pool.find((row) => row[1] === choice.km2) ?? null;
      areaPart = choice.part ?? part;
      if (area === null) problems.push(`${alpha2}: AREA_CHOICES names ${choice.km2} km², which Wikidata does not give`);
    } else if (pool.length > 1) problems.push(`${alpha2}: ${pool.length} areas (${pool.map((row) => row[1]).join(", ")}); pick one in AREA_CHOICES`);

    // The driving side, now.
    const sides = [...new Set(rowsOf("driving", alpha2).filter((row) => row[3] === null).map((row) => row[1] as string))];
    if (sides.length > 1) problems.push(`${alpha2}: drives on ${sides.length} sides`);
    const side = sides[0] === LEFT ? "left" : sides[0] === RIGHT ? "right" : sides[0] === undefined ? null : undefined;
    if (side === undefined) problems.push(`${alpha2}: unknown driving side ${sides[0]}`);

    const points = rowsOf("points", alpha2);

    return {
      alpha2,
      capitalEn,
      capitalJa,
      capitalPoint,
      population: population === null ? null : (population[1] as number),
      populationYear: population === null ? null : yearOf(population[2]),
      area: area === null ? null : round(area[1] as number, 2),
      areaYear: area === null ? null : yearOf(area[3]),
      areaPart: area === null ? null : areaPart,
      point: points.length === 1 ? pointOf(points[0][1]) : null,
      borders: [...borders].filter((pair) => pair.split(" ").includes(alpha2)).map((pair) => pair.split(" ").find((code) => code !== alpha2)!).sort(byText),
      drivingSide: side ?? null,
      weekStart: lookup(firstDay, alpha2),
      measurement: lookup(measurement, alpha2),
      paper: lookup(paper, alpha2),
      hourCycle: lookup(Object.fromEntries(Object.entries(timeData).map(([key, value]) => [key, value._preferred])), alpha2) === "h" ? "h12" : "h23",
    };
  });

  // ----- Every gap is a decision -----------------------------------------------------------------------------
  const lacking: Record<keyof typeof FACT_GAPS, (record: FactRecord) => boolean> = {
    population: (record) => record.population === null,
    capital: (record) => record.capitalEn === null,
    capitalPoint: (record) => record.capitalPoint === null,
    drivingSide: (record) => record.drivingSide === null,
    borders: (record) => record.borders.length === 0,
  };
  for (const record of records) {
    for (const [field, test] of Object.entries(lacking) as [keyof typeof FACT_GAPS, (record: FactRecord) => boolean][]) {
      const listed = record.alpha2 in FACT_GAPS[field];
      if (test(record) && !listed) problems.push(`${record.alpha2}: no ${field}, and FACT_GAPS.${field} does not say why`);
      if (!test(record) && listed) problems.push(`${record.alpha2}: has a ${field}, and FACT_GAPS.${field} says it has none`);
    }
    if (record.area === null) problems.push(`${record.alpha2}: no area`);
    if (record.point === null) problems.push(`${record.alpha2}: no coordinates`);
    if (record.population !== null && record.population > 0 && record.populationYear === null) problems.push(`${record.alpha2}: a population with no year`);
  }
  if (problems.length > 0) throw new Error(`The facts cannot be made:\n  ${problems.join("\n  ")}`);

  // ----- The record of what was decided ----------------------------------------------------------------------
  const count = (test: (record: FactRecord) => boolean): number => records.filter(test).length;
  const doc = [
    "# The facts: what was decided",
    "",
    "Written by `pnpm data` (scripts/build-data.ts); do not edit by hand. The rules are at the top of",
    "`scripts/facts-config.ts`, and every exception below is listed there with its reason.",
    "",
    "## Coverage",
    "",
    `- Capitals: ${count((record) => record.capitalEn !== null)} of ${records.length}, every one named in Japanese (${count((record) => record.alpha2 in CAPITAL_ITEMS)} found by hand, ${Object.keys(CAPITAL_JA_OVERRIDES).length} Japanese name written by hand)`,
    `- Capitals' coordinates: ${count((record) => record.capitalPoint !== null)} of ${records.length}`,
    `- Population: ${count((record) => record.population !== null)} of ${records.length}, ${count((record) => record.populationYear !== null)} with the year it is for`,
    `- Area: ${count((record) => record.area !== null)} of ${records.length} (${count((record) => record.areaPart === "whole")} for the whole, ${count((record) => record.areaPart === "none")} with no part named, ${count((record) => record.areaPart === "land")} for the land only: ${records.filter((record) => record.areaPart === "land").map((record) => record.alpha2).join(", ") || "none"}), ${count((record) => record.areaYear !== null)} with a year`,
    `- Coordinates: ${count((record) => record.point !== null)} of ${records.length}`,
    `- Land borders: ${borders.size} pairs; ${count((record) => record.borders.length > 0)} countries have one or more, ${count((record) => record.borders.length === 0)} have none`,
    `- Driving side: ${count((record) => record.drivingSide !== null)} of ${records.length} (${count((record) => record.drivingSide === "left")} left, ${count((record) => record.drivingSide === "right")} right)`,
    `- First day of the week, measurement system, paper size and clock: all ${records.length}, from CLDR (every region has one, by CLDR's own rule of falling back to the area that holds it)`,
    "",
    "## Gaps",
    "",
  ];
  for (const [field, gaps] of Object.entries(FACT_GAPS)) {
    if (field === "borders") continue;
    doc.push(`### ${field}, ${Object.keys(gaps).length}`, "");
    for (const [code, why] of Object.entries(gaps)) doc.push(`- **${code}**: ${why}`);
    doc.push("");
  }
  doc.push(
    `### No land border, ${Object.keys(FACT_GAPS.borders).length}`,
    "",
    Object.entries(FACT_GAPS.borders)
      .map(([code, why]) => `${code} (${why})`)
      .join(", "),
    "",
    "## Land borders",
    "",
    "Wikidata's \"shares border with\" (P47) does not say whether a border is on land or at sea, so a border is kept",
    "only when the outlines of Natural Earth 5.1.2 at 1:50m (as chizu 1.0.2 draws them) touch too, and the borders",
    "below are added by hand.",
    "",
    "### Added by hand",
    "",
    ...Object.entries(BORDERS_ADDED).map(([pair, why]) => `- **${pair.replace(" ", "–")}**: ${why}`),
    "",
    `### Stated by Wikidata, not kept, ${statedOnly.length}`,
    "",
    "Most are borders at sea; a few are claims (Afghanistan and India through Kashmir). A pair that is a land border",
    "belongs in `BORDERS_ADDED`.",
    "",
    statedOnly.map((pair) => pair.replace(" ", "–")).join(", ") || "None.",
    "",
    `### Touching in Natural Earth, not stated by Wikidata, not kept, ${outlinesOnly.length}`,
    "",
    outlinesOnly.map((pair) => pair.replace(" ", "–")).join(", ") || "None.",
    "",
    "## Choices",
    "",
    ...Object.entries(COUNTRY_ITEMS).map(([code, { item, why }]) => `- **${code}**, Wikidata item ${item}: ${why}`),
    ...Object.entries(CAPITAL_ITEMS).map(([code, { item, en, why }]) => `- **${code}** capital, ${item}${en === undefined ? "" : ` (${en})`}: ${why}`),
    ...Object.entries(CAPITAL_JA_OVERRIDES).map(([code, { ja, why }]) => `- **${code}** capital in Japanese, ${ja}: ${why}`),
    ...Object.entries(AREA_CHOICES).map(([code, { km2, why }]) => `- **${code}** area, ${km2.toLocaleString("en-US")} km²: ${why}`),
    ...Object.entries(POPULATION_PARTS).map(([item, why]) => `- A population for the part ${item} stands for the whole: ${why}`),
    "",
  );

  return { records, doc };
};

export { buildFacts };
export type { FactRecord, FactsSnapshot };
