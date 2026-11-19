// Every item the dump pass must keep. Written Q-ids are not enough: the city snapshots store the item
// number bare (60, not Q60), and those cities are what the population diff is for.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface WantedIds {
  ids: Set<number>;
  /** Item numbers on the city rows (`wikidata-cities` and `wikidata-cities-extra`). */
  cityIds: number;
  /** City item numbers that are not in `ids`. Zero means the city list is covered. */
  cityIdsMissing: number;
  /** The count the population snapshot names, when it has one. */
  populationsAsked: number | null;
}

const addNumber = (ids: Set<number>, value: unknown): void => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) ids.add(value);
};

const addFirst = (ids: Set<number>, rows: unknown): void => {
  if (!Array.isArray(rows)) return;
  for (const row of rows) if (Array.isArray(row)) addNumber(ids, row[0]);
};

/** Q-ids written in any data-sources JSON, plus the bare item numbers the city, elevation, reading and metro snapshots use. */
export const wantedIds = (dir: string): WantedIds => {
  const ids = new Set<number>();
  const cityIds = new Set<number>();
  let populationsAsked: number | null = null;
  for (const name of readdirSync(dir).filter((one) => one.endsWith(".json"))) {
    const text = readFileSync(join(dir, name), "utf8");
    for (const match of text.matchAll(/\bQ(\d{1,9})\b/g)) ids.add(Number(match[1]));
    const data = JSON.parse(text) as Record<string, unknown>;
    if (/^wikidata-cities(-extra)?-\d/.test(name)) {
      if (Array.isArray(data.items)) for (const row of data.items) if (Array.isArray(row)) {
        addNumber(ids, row[0]);
        addNumber(cityIds, row[0]);
      }
    } else if (name.startsWith("wikidata-city-populations-")) {
      addFirst(ids, data.statements);
      if (typeof data.items === "number") populationsAsked = data.items;
      for (const list of Object.values((data.land ?? {}) as Record<string, unknown>)) if (Array.isArray(list)) for (const one of list) addNumber(ids, one);
    } else if (name.startsWith("wikidata-city-elevations-")) addFirst(ids, data.elevations);
    else if (name.startsWith("wikidata-city-readings-")) addFirst(ids, data.readings);
    else if (name === "city-ids.json") for (const one of (data.ids as unknown[]) ?? []) addNumber(ids, one);
    else if (name.startsWith("wikidata-metros-")) {
      addFirst(ids, data.areas);
      if (Array.isArray(data.links)) for (const row of data.links) if (Array.isArray(row)) {
        addNumber(ids, row[0]);
        addNumber(ids, row[1]);
      }
    }
  }
  let cityIdsMissing = 0;
  for (const id of cityIds) if (!ids.has(id)) cityIdsMissing += 1;
  return { ids, cityIds: cityIds.size, cityIdsMissing, populationsAsked };
};
