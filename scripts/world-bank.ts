// The World Bank's "Population, total" (SP.POP.TOTL), CC BY 4.0, for one year and every economy it lists, read from the
// pinned response of its API (data-sources/world-bank-sp-pop-totl-<year>.json). The response also holds the World Bank's
// aggregates (regions, income groups, the world); they are not countries and scripts/facts.ts never looks them up, but
// `parseWorldBank` names them so that the record of what was decided can say what was dropped.

interface WorldBankPopulation {
  year: number;
  byIso3: Map<string, number>; // the ISO 3 code the World Bank uses (XKX for Kosovo), the people counted that year
  empty: string[]; // codes the World Bank lists with no figure for the year
  unkeyed: string[]; // the names of the rows with no ISO 3 code (some of its aggregates have none)
}

// The World Bank's code for Kosovo is not ISO 3166-1 (which has none); kuni's is XK, with the alpha-3 XKK.
const WORLD_BANK_ALPHA3 = { XK: "XKX" } as const satisfies Record<string, string>;

const parseWorldBank = (text: string, year: number): WorldBankPopulation => {
  const [meta, rows] = JSON.parse(text) as [{ total: number; pages: number }, { indicator: { id: string }; country: { value: string }; countryiso3code: string; date: string; value: number | null }[]];
  if (meta.pages !== 1) throw new Error(`The World Bank response has ${meta.pages} pages; it must be one`);
  if (rows.length !== meta.total) throw new Error(`The World Bank response says ${meta.total} rows and has ${rows.length}`);
  const byIso3 = new Map<string, number>();
  const empty: string[] = [];
  const unkeyed: string[] = [];
  for (const row of rows) {
    if (row.indicator.id !== "SP.POP.TOTL") throw new Error(`The World Bank response has the indicator ${row.indicator.id}`);
    if (row.date !== String(year)) throw new Error(`The World Bank response has a row for ${row.date}, not ${year}`);
    if (row.countryiso3code === "") {
      unkeyed.push(row.country.value);
      continue;
    }
    if (byIso3.has(row.countryiso3code) || empty.includes(row.countryiso3code)) throw new Error(`The World Bank response lists ${row.countryiso3code} twice`);
    if (row.value === null) empty.push(row.countryiso3code);
    else byIso3.set(row.countryiso3code, row.value);
  }

  return { year, byIso3, empty, unkeyed };
};

export { parseWorldBank, WORLD_BANK_ALPHA3 };
export type { WorldBankPopulation };
