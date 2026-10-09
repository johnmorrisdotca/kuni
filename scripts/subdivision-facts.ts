// The facts about each subdivision, for scripts/build-data.ts and the /subdivision-facts entry: its capital (the
// seat of its government) in English and Japanese with a reading where Wikidata has one, the capital's coordinates,
// its population and area with the year each is for, and its own coordinates. All from the Wikidata snapshot
// (CC0). The rules:
//
//   - The items are the code's current items, the ones the names build uses (former and historical places left out).
//     Where two items both answer for a fact and do not agree (a city and the district of the same name), the fact
//     is left out, as "the items disagree", unless SUBDIVISION_CAPITALS names the capital.
//   - The capital is the one current capital (P36, no end). Where Wikidata names two, it is left out unless
//     SUBDIVISION_CAPITALS names one. Its Japanese name is Wikidata's label when that is written in Japanese with no
//     bracket; its reading is the one kana name (P1814) Wikidata gives, in hiragana, for a name with kanji.
//   - The population is the best-ranked figure with the latest date, for the whole (or a part in POPULATION_PARTS).
//   - The area is the best-ranked figure in square kilometres for the whole, else with no part, else the land; two
//     equally good figures leave it out.
//   - Coordinates are rounded to two decimal places, about a kilometre. Where Wikidata gives one item two points,
//     the first in the snapshot's order is kept.

import { POPULATION_PARTS } from "./facts-config.ts";

type Row = unknown[];

interface SubdivisionFactRecord {
  code: string;
  capitalEn: string | null;
  capitalJa: string | null;
  capitalReading: string | null;
  capitalPoint: [number, number] | null;
  population: number | null;
  populationYear: number | null;
  area: number | null;
  areaYear: number | null;
  point: [number, number] | null;
}

type Gap = "no item" | "none" | "items disagree" | "two capitals";

interface SubdivisionFactsResult {
  records: Map<string, SubdivisionFactRecord>;
  gaps: Map<string, Record<"capital" | "population" | "area" | "point", Gap | null>>;
}

const KM2 = "Q712226";
const WHOLE = "Q16868672";
const LAND = "Q11081619";
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const HAN = /\p{Script=Han}/u;

// Capitals named by hand where Wikidata names two, each with its reason.
const SUBDIVISION_CAPITALS: Record<string, { item: string; why: string }> = {
  "JP-13": { item: "Q179645", why: "Tokyo's government sits in Shinjuku; Wikidata also names the former City of Tokyo (東京市)." },
};

const round = (value: number): number => Number(value.toFixed(2));
const pointOf = (value: unknown): [number, number] | null => (Array.isArray(value) ? [round(value[0] as number), round(value[1] as number)] : null);
const yearOf = (day: unknown): number | null => (typeof day === "string" && /^\d{4}-/.test(day) ? Number(day.slice(0, 4)) : null);
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const buildSubdivisionFacts = (
  answers: Record<string, Record<string, Row[]>>,
  subdivisions: { code: string; items: string[] }[],
): SubdivisionFactsResult => {
  const records = new Map<string, SubdivisionFactRecord>();
  const gaps: SubdivisionFactsResult["gaps"] = new Map();
  const unused = new Set(Object.keys(SUBDIVISION_CAPITALS));

  for (const { code, items } of subdivisions) {
    const rowsOf = (name: string): Row[] => (answers[name][code] ?? []).filter((row) => items.includes(row[0] as string));
    // The rows of a fact, when one item answers for it, or when every item that answers gives the same; else null.
    const oneItem = (rows: Row[], same: (a: Row, b: Row) => boolean): Row[] | "items disagree" => {
      const ids = [...new Set(rows.map((row) => row[0] as string))];
      if (ids.length <= 1) return rows;
      const first = rows.filter((row) => row[0] === ids[0]);

      return ids.every((id) => rows.filter((row) => row[0] === id).some((row) => first.some((other) => same(row, other)))) ? first : "items disagree";
    };
    const gap = { capital: null, population: null, area: null, point: null } as Record<"capital" | "population" | "area" | "point", Gap | null>;

    // The capital.
    let capital: Row | null = null;
    const pinned = SUBDIVISION_CAPITALS[code];
    const capitalRows = rowsOf("subdivisionCapitals");
    if (pinned !== undefined) {
      unused.delete(code);
      capital = capitalRows.find((row) => row[1] === pinned.item) ?? null;
      if (capital === null) throw new Error(`SUBDIVISION_CAPITALS names ${pinned.item} for ${code}, which Wikidata does not give`);
    } else {
      const found = oneItem(capitalRows, (a, b) => a[1] === b[1]);
      if (found === "items disagree") gap.capital = found;
      else if (new Set(found.map((row) => row[1])).size > 1) gap.capital = "two capitals";
      else capital = found[0] ?? null;
    }
    const capitalEn = capital === null || typeof capital[2] !== "string" ? null : capital[2].trim();
    if (capital !== null && capitalEn === null) capital = null;
    if (capital === null && gap.capital === null) gap.capital = items.length === 0 ? "no item" : "none";
    const ja = capital === null ? null : (capital[3] as string | null);
    const capitalJa = ja !== null && JAPANESE.test(ja) && !/[()（）]/.test(ja) ? ja.trim() : null;
    const kana = capital === null ? [] : [...new Set(capitalRows.filter((row) => row[1] === capital![1] && typeof row[4] === "string").map((row) => (row[4] as string).trim()))];
    const capitalReading = capitalJa !== null && HAN.test(capitalJa) && kana.length === 1 && /^[\p{Script=Hiragana}ー]+$/u.test(kana[0]) ? kana[0] : null;

    // The population: the latest best-ranked figure for the whole.
    const people = oneItem(
      rowsOf("subdivisionPopulation").filter((row) => row[3] === null || (row[3] as string) in POPULATION_PARTS),
      (a, b) => a[1] === b[1],
    );
    let population: Row | null = null;
    if (people === "items disagree") gap.population = people;
    else population = [...people].sort((a, b) => byText(String(b[2] ?? ""), String(a[2] ?? "")))[0] ?? null;
    if (population === null && gap.population === null) gap.population = items.length === 0 ? "no item" : "none";

    // The area.
    const areas = oneItem(
      rowsOf("subdivisionArea").filter((row) => row[2] === KM2),
      (a, b) => a[1] === b[1],
    );
    let area: Row | null = null;
    if (areas === "items disagree") gap.area = areas;
    else {
      const whole = areas.filter((row) => row[4] === WHOLE);
      const plain = areas.filter((row) => row[4] === null);
      const land = areas.filter((row) => row[4] === LAND);
      const pool = whole.length > 0 ? whole : plain.length > 0 ? plain : land;
      const values = [...new Set(pool.map((row) => row[1]))];
      if (values.length === 1) area = pool[0];
      else if (values.length > 1) gap.area = "items disagree";
    }
    if (area === null && gap.area === null) gap.area = items.length === 0 ? "no item" : "none";

    // The place's own point.
    const points = oneItem(rowsOf("subdivisionPoints"), (a, b) => JSON.stringify(pointOf(a[1])) === JSON.stringify(pointOf(b[1])));
    const point = points === "items disagree" ? null : pointOf(points[0]?.[1]);
    if (points === "items disagree") gap.point = points;
    else if (point === null) gap.point = items.length === 0 ? "no item" : "none";

    records.set(code, {
      code,
      capitalEn: capital === null ? null : capitalEn,
      capitalJa: capital === null ? null : capitalJa,
      capitalReading: capital === null ? null : capitalReading,
      capitalPoint: capital === null ? null : pointOf(capital[5]),
      population: population === null ? null : (population[1] as number),
      populationYear: population === null ? null : yearOf(population[2]),
      area: area === null ? null : round(area[1] as number),
      areaYear: area === null ? null : yearOf(area[3]),
      point,
    });
    gaps.set(code, gap);
  }
  if (unused.size > 0) throw new Error(`SUBDIVISION_CAPITALS names no subdivision: ${[...unused].join(", ")}`);

  return { records, gaps };
};

export { buildSubdivisionFacts, SUBDIVISION_CAPITALS };
export type { SubdivisionFactRecord, SubdivisionFactsResult };
