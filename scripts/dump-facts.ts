// Rebuilds the answers in data-sources/wikidata-facts-<day>.json from items kept out of the JSON dump.
// A row is the same shape scripts/fetch-wikidata-facts.ts writes, so a later diff is line by line.
// Labels and coordinates of a capital come from that capital's own item. When the subset does not hold it, the
// row is still written and the missing words are null.

import { best, claims, entityId, labelOf, point, qualifierDays, qualifierIds, quantity, rankToken, textValue, timeDay, valued } from "./dump-claims.ts";
import type { DumpEntity, Statement } from "./dump-claims.ts";

export type FactRows = Record<string, unknown[][]>;

export interface FactAnswers {
  items: FactRows;
  capitals: FactRows;
  population: FactRows;
  area: FactRows;
  points: FactRows;
  driving: FactRows;
  borders: FactRows;
  pinned: FactRows;
  subdivisionCapitals: FactRows;
  subdivisionPopulation: FactRows;
  subdivisionArea: FactRows;
  subdivisionPoints: FactRows;
  subdivisionLabels: FactRows;
  memberships: FactRows;
}

const CODE = /^[A-Z]{2}(-[A-Z0-9]{1,3})?$/;
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const group = (rows: Array<[string, unknown[]]>): FactRows => {
  const codes = new Map<string, Map<string, unknown[]>>();
  for (const [code, values] of rows) {
    if (!CODE.test(code)) continue;
    const found = codes.get(code) ?? new Map<string, unknown[]>();
    codes.set(code, found);
    found.set(JSON.stringify(values), values);
  }
  const out: FactRows = {};
  for (const code of [...codes.keys()].sort(byText)) out[code] = [...codes.get(code)!.entries()].sort((a, b) => byText(a[0], b[0])).map(([, values]) => values);
  return out;
};

const codesOf = (entity: DumpEntity, property: string): Array<{ code: string; statement: Statement }> =>
  valued(claims(entity, property))
    .map((statement) => ({ code: textValue(statement.mainsnak), statement }))
    .filter((row): row is { code: string; statement: Statement } => row.code !== null);

const daysOf = (entity: DumpEntity, property: string): Array<string | null> => {
  const days = best(claims(entity, property)).map((statement) => timeDay(statement.mainsnak)).filter((day): day is string => day !== null);
  return days.length === 0 ? [null] : days;
};

const pointsOf = (entity: DumpEntity | undefined): Array<[number, number] | null> => {
  const points = best(claims(entity, "P625")).map((statement) => point(statement.mainsnak)).filter((value): value is [number, number] => value !== null);
  return points.length === 0 ? [null] : points;
};

const textsOf = (entity: DumpEntity | undefined, property: string): Array<string | null> => {
  const texts = best(claims(entity, property)).map((statement) => textValue(statement.mainsnak)).filter((value): value is string => value !== null);
  return texts.length === 0 ? [null] : texts;
};

export const factsFrom = (entities: Map<string, DumpEntity>, orgs: ReadonlySet<string>, pinned: Readonly<Record<string, { item: string }>>): FactAnswers => {
  const items: Array<[string, unknown[]]> = [];
  const capitals: Array<[string, unknown[]]> = [];
  const population: Array<[string, unknown[]]> = [];
  const area: Array<[string, unknown[]]> = [];
  const points: Array<[string, unknown[]]> = [];
  const driving: Array<[string, unknown[]]> = [];
  const borders: Array<[string, unknown[]]> = [];
  const pinnedRows: Array<[string, unknown[]]> = [];
  const subdivisionCapitals: Array<[string, unknown[]]> = [];
  const subdivisionPopulation: Array<[string, unknown[]]> = [];
  const subdivisionArea: Array<[string, unknown[]]> = [];
  const subdivisionPoints: Array<[string, unknown[]]> = [];
  const subdivisionLabels: Array<[string, unknown[]]> = [];
  const memberships: Array<[string, unknown[]]> = [];

  const pushFigures = (code: string, entity: DumpEntity, intoPopulation: Array<[string, unknown[]]>, intoArea: Array<[string, unknown[]]>): void => {
    for (const statement of best(claims(entity, "P1082"))) {
      const figure = quantity(statement.mainsnak);
      if (figure === null) continue;
      for (const when of qualifierDays(statement, "P585")) for (const part of qualifierIds(statement, "P518")) intoPopulation.push([code, [entity.id, figure.amount, when, part]]);
    }
    for (const statement of best(claims(entity, "P2046"))) {
      const figure = quantity(statement.mainsnak);
      if (figure === null) continue;
      for (const when of qualifierDays(statement, "P585")) for (const part of qualifierIds(statement, "P518")) intoArea.push([code, [entity.id, figure.amount, figure.unit, when, part]]);
    }
  };

  for (const entity of entities.values()) {
    for (const { code, statement } of codesOf(entity, "P297")) {
      for (const dissolved of daysOf(entity, "P576")) for (const codeEnd of qualifierDays(statement, "P582")) items.push([code, [entity.id, dissolved, codeEnd]]);
      for (const capital of valued(claims(entity, "P36"))) {
        const capitalId = entityId(capital.mainsnak);
        if (capitalId === null) continue;
        const place = entities.get(capitalId);
        for (const when of qualifierDays(capital, "P580")) {
          for (const end of qualifierDays(capital, "P582")) {
            for (const where of pointsOf(place)) capitals.push([code, [entity.id, capitalId, labelOf(place, "en"), labelOf(place, "ja"), where, rankToken(capital.rank), when, end]]);
          }
        }
      }
      pushFigures(code, entity, population, area);
      for (const where of pointsOf(entity)) if (where !== null) points.push([code, [entity.id, where]]);
      for (const side of valued(claims(entity, "P1622"))) {
        const sideId = entityId(side.mainsnak);
        if (sideId === null) continue;
        for (const end of qualifierDays(side, "P582")) driving.push([code, [entity.id, sideId, rankToken(side.rank), end]]);
      }
      for (const border of valued(claims(entity, "P47"))) {
        const otherId = entityId(border.mainsnak);
        const other = otherId === null ? undefined : entities.get(otherId);
        if (otherId === null || other === undefined) continue;
        for (const otherCode of codesOf(other, "P297")) {
          for (const end of qualifierDays(border, "P582")) borders.push([code, [entity.id, otherCode.code, otherId, rankToken(border.rank), end]]);
        }
      }
      for (const membership of valued(claims(entity, "P463"))) {
        const org = entityId(membership.mainsnak);
        if (org === null || !orgs.has(org)) continue;
        for (const start of qualifierDays(membership, "P580")) {
          for (const end of qualifierDays(membership, "P582")) {
            for (const role of qualifierIds(membership, "P2868")) memberships.push([code, [entity.id, org, rankToken(membership.rank), start, end, role]]);
          }
        }
      }
    }

    for (const { code } of codesOf(entity, "P300")) {
      const english = labelOf(entity, "en");
      if (english !== null) subdivisionLabels.push([code, [entity.id, english]]);
      for (const capital of valued(claims(entity, "P36"))) {
        if (qualifierDays(capital, "P582").some((end) => end !== null)) continue;
        const capitalId = entityId(capital.mainsnak);
        if (capitalId === null) continue;
        const place = entities.get(capitalId);
        for (const kana of textsOf(place, "P1814")) for (const where of pointsOf(place)) subdivisionCapitals.push([code, [entity.id, capitalId, labelOf(place, "en"), labelOf(place, "ja"), kana, where]]);
      }
      pushFigures(code, entity, subdivisionPopulation, subdivisionArea);
      for (const where of pointsOf(entity)) if (where !== null) subdivisionPoints.push([code, [entity.id, where]]);
    }
  }

  for (const [code, { item }] of Object.entries(pinned)) {
    const place = entities.get(item);
    for (const where of pointsOf(place)) pinnedRows.push([code, [item, labelOf(place, "en"), labelOf(place, "ja"), where]]);
  }

  return {
    items: group(items),
    capitals: group(capitals),
    population: group(population),
    area: group(area),
    points: group(points),
    driving: group(driving),
    borders: group(borders),
    pinned: group(pinnedRows),
    subdivisionCapitals: group(subdivisionCapitals),
    subdivisionPopulation: group(subdivisionPopulation),
    subdivisionArea: group(subdivisionArea),
    subdivisionPoints: group(subdivisionPoints),
    subdivisionLabels: group(subdivisionLabels),
    memberships: group(memberships),
  };
};
