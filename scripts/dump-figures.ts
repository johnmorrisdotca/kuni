// Population statements, elevations and the IOC / withdrawn-code snapshot, read from the JSON dump.
// The keep rules match scripts/fetch-city-populations.ts, scripts/fetch-city-elevations.ts and
// scripts/fetch-wikidata-codes.ts. Those files ask the query service and are not imported: importing one would run it.

import { best, claims, entityId, labelOf, metres, qualifierDays, quantity, referenceHosts, textValue, timeDay, valued } from "./dump-claims.ts";
import type { DumpEntity, Statement } from "./dump-claims.ts";

const METHODS: Readonly<Record<string, string>> = {
  Q39825: "census",
  Q26944781: "census",
  Q65059106: "census",
  Q60745365: "census",
  Q791801: "estimate",
  Q965330: "estimate",
  Q29051383: "estimate",
  Q52679562: "estimate",
  Q15911027: "register",
  Q15194024: "register",
  Q6042918: "register",
};
const LAND = ["Q23442", "Q42523", "Q139595919", "Q33837"];
const OLDEST = "2000-01-01";
const OTHERS = 2;
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

type PopulationStatement = [number, string | null, 1 | 2, string | null, string[]];

const methodOf = (statement: Statement): string | null => {
  const ids = (statement.qualifiers?.P459 ?? []).map(entityId).filter((id): id is string => id !== null);
  const known = ids.find((id) => METHODS[id] !== undefined);
  return known !== undefined ? METHODS[known]! : (ids[0] ?? null);
};

const codeValue = (statement: Statement): string | null => {
  const text = textValue(statement.mainsnak);
  if (text !== null) return text;
  const amount = quantity(statement.mainsnak);
  return amount === null ? null : String(amount.amount);
};

export const populationsFrom = (entities: Map<string, DumpEntity>, items: readonly number[]): { items: number; land: Record<string, number[]>; statements: Array<[number, PopulationStatement[]]> } => {
  const wanted = new Set(items);
  const land: Record<string, number[]> = {};
  for (const entity of entities.values()) {
    const number = Number(entity.id.slice(1));
    if (!wanted.has(number) || best(claims(entity, "P1082")).length === 0) continue;
    for (const statement of best(claims(entity, "P31"))) {
      const id = entityId(statement.mainsnak);
      if (id === null || !LAND.includes(id)) continue;
      land[id] = [...new Set([...(land[id] ?? []), number])].sort((a, b) => a - b);
    }
  }
  const statements: Array<[number, PopulationStatement[]]> = [];
  for (const number of [...wanted].sort((a, b) => a - b)) {
    const entity = entities.get(`Q${number}`);
    if (entity === undefined) continue;
    const rows = valued(claims(entity, "P1082")).flatMap((statement): PopulationStatement[] => {
      const figure = quantity(statement.mainsnak);
      if (figure === null) return [];
      const rank: 1 | 2 = statement.rank === "preferred" ? 2 : 1;
      return [[Math.round(figure.amount), qualifierDays(statement, "P585")[0] ?? null, rank, methodOf(statement), referenceHosts(statement)]];
    });
    if (rows.length === 0) continue;
    const bestRank = Math.max(...rows.map((row) => row[2]));
    const others = rows
      .filter((row) => row[2] !== bestRank && row[3] !== "census")
      .sort((a, b) => ((a[1] ?? "") < (b[1] ?? "") ? 1 : (a[1] ?? "") > (b[1] ?? "") ? -1 : b[0] - a[0]))
      .slice(0, OTHERS);
    const kept = rows
      .filter((row) => row[2] === bestRank || (row[3] === "census" && row[1] !== null && row[1] >= OLDEST) || others.includes(row))
      .sort((a, b) => ((a[1] ?? "") < (b[1] ?? "") ? -1 : (a[1] ?? "") > (b[1] ?? "") ? 1 : a[0] - b[0] || a[2] - b[2]));
    statements.push([number, kept]);
  }
  return { items: items.length, land, statements };
};

export const elevationsFrom = (entities: Map<string, DumpEntity>, items: readonly number[]): { elevations: Array<[number, number[]]>; unknownUnits: number } => {
  const elevations: Array<[number, number[]]> = [];
  let unknownUnits = 0;
  for (const number of [...new Set(items)].sort((a, b) => a - b)) {
    const entity = entities.get(`Q${number}`);
    if (entity === undefined) continue;
    const values = new Set<number>();
    for (const statement of best(claims(entity, "P2044"))) {
      const figure = quantity(statement.mainsnak);
      if (figure === null) continue;
      const height = metres(figure.amount, figure.unit);
      if (height === null) {
        unknownUnits += 1;
        continue;
      }
      values.add(height);
    }
    if (values.size > 0) elevations.push([number, [...values].sort((a, b) => a - b)]);
  }
  return { elevations, unknownUnits };
};

export interface WithdrawnItem {
  id: string;
  en: string | null;
  ja: string | null;
  began: string[];
  ended: string[];
  codes: unknown[];
  successors: unknown[];
}

export const codesFrom = (entities: Map<string, DumpEntity>): { ioc: Record<string, string[]>; withdrawn: Record<string, WithdrawnItem[]> } => {
  const ioc: Record<string, string[]> = {};
  const withdrawn = new Map<string, WithdrawnItem>();
  for (const entity of entities.values()) {
    for (const { code } of valued(claims(entity, "P297")).map((statement) => ({ code: textValue(statement.mainsnak) })).filter((row): row is { code: string } => row.code !== null)) {
      for (const statement of best(claims(entity, "P984"))) {
        const value = textValue(statement.mainsnak);
        if (value === null) continue;
        ioc[code] = [...new Set([...(ioc[code] ?? []), value])].sort(byText);
      }
    }
    for (const statement of best(claims(entity, "P773"))) {
      const iso3 = textValue(statement.mainsnak);
      if (iso3 === null) continue;
      const found: WithdrawnItem = withdrawn.get(`${iso3}/${entity.id}`) ?? {
        id: entity.id,
        en: labelOf(entity, "en"),
        ja: labelOf(entity, "ja"),
        began: [],
        ended: [],
        codes: [],
        successors: [],
      };
      withdrawn.set(`${iso3}/${entity.id}`, found);
      found.began = [...new Set(best(claims(entity, "P571")).map((row) => timeDay(row.mainsnak)).filter((day): day is string => day !== null))].sort(byText);
      found.ended = [...new Set(best(claims(entity, "P576")).map((row) => timeDay(row.mainsnak)).filter((day): day is string => day !== null))].sort(byText);
    }
  }
  for (const found of withdrawn.values()) {
    const entity = entities.get(found.id);
    if (entity === undefined) continue;
    const rows: unknown[] = [];
    for (const property of ["P297", "P298", "P299"]) {
      for (const statement of claims(entity, property)) {
        if (statement.mainsnak?.snaktype !== "value" || statement.rank === undefined) continue;
        const value = codeValue(statement);
        if (value === null) continue;
        for (const end of qualifierDays(statement, "P582")) for (const start of qualifierDays(statement, "P580")) rows.push([property, value, statement.rank, start, end]);
      }
    }
    found.codes = [...new Map(rows.map((row) => [JSON.stringify(row), row])).values()].sort((a, b) => byText(JSON.stringify(a), JSON.stringify(b)));
    const successors: unknown[] = [];
    for (const property of ["P1366", "P156"]) {
      for (const statement of best(claims(entity, property))) {
        const successor = entityId(statement.mainsnak);
        if (successor === null) continue;
        const other = entities.get(successor);
        const alpha = other === undefined ? [] : best(claims(other, "P297")).map((row) => textValue(row.mainsnak)).filter((code): code is string => code !== null);
        const codes = alpha.length === 0 ? [null] : alpha;
        for (const code of codes) successors.push([successor, code]);
      }
    }
    found.successors = [...new Map(successors.map((row) => [JSON.stringify(row), row])).values()].sort((a, b) => byText(JSON.stringify(a), JSON.stringify(b)));
  }
  const ordered: Record<string, WithdrawnItem[]> = {};
  for (const [path, found] of [...withdrawn.entries()].sort((a, b) => byText(a[0], b[0]))) {
    const iso3 = path.slice(0, path.indexOf("/"));
    (ordered[iso3] ??= []).push(found);
  }
  for (const iso3 of Object.keys(ordered)) ordered[iso3]!.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  const iocOrdered = Object.fromEntries(Object.keys(ioc).sort(byText).map((code) => [code, ioc[code]!]));
  return { ioc: iocOrdered, withdrawn: ordered };
};
