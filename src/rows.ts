// The generated data files keep each country and each subdivision as a short row rather than an object, so
// that a page importing one country's subdivisions carries a couple of kilobytes and not five. These turn a
// row back into the object the lookups hand out. Pure: the same row always makes an equal object.

import type { Continent, Country, GroupingKind, GroupingStatus, LatLon, Subdivision, SubdivisionFacts, SubdivisionType } from "./types";

// [alpha2, alpha3, numeric, en, ja, local, shortEn, shortJa, reading, continent, subregion, callingCode,
//  currencies, tld, capital, capitalJa, zones, languages, subdivisionType, aliases, ioc, kind]
// Lists of codes are one string with spaces between; aliases are one string with "|" between; an absent
// value is null. The last element is present only for a user-assigned code.
type CountryRow = readonly [
  string,
  string,
  string,
  string,
  string,
  string | null,
  string | null,
  string | null,
  string | null,
  Continent,
  string | null,
  string | null,
  string | null,
  string | null,
  string | null,
  string | null,
  string | null,
  string | null,
  SubdivisionType | null,
  string | null,
  string | null,
  "user"?,
];

// One country's subdivisions as text, a line each: shortCode|en|ja|type|parent|reading, where type is an
// index into the table's types, parent is the shortCode of the subdivision it is inside, and an absent value
// is empty (trailing ones are left off). Text rather than arrays because it is a third smaller, and Japan's
// 47 prefectures then fit in under 3 KB with the code that reads them.
interface SubdivisionTable {
  country: string;
  types: readonly SubdivisionType[];
  typesJa: readonly (string | null)[]; // The Japanese word each type's names end in, where they all agree
  rows: string;
}

const FIELD = "|";
const LINE = "\n";

const FIRST_INDICATOR = 0x1f1e6;
const LETTER_A = 65;

// The flag emoji of an alpha-2 code: two regional-indicator symbols, one for each letter.
const flagOf = (alpha2: string): string =>
  String.fromCodePoint(FIRST_INDICATOR + alpha2.charCodeAt(0) - LETTER_A, FIRST_INDICATOR + alpha2.charCodeAt(1) - LETTER_A);

const listOf = (text: string | null, separator: string): string[] | undefined =>
  text === null ? undefined : text.split(separator);

const expandCountry = (row: CountryRow): Country => {
  const [alpha2, alpha3, numeric, en, ja, local, shortEn, shortJa, reading, continent, subregion, calling] = row;
  const [, , , , , , , , , , , , currencies, tld, capital, capitalJa, zones, languages, subdivisionType, aliases, ioc, kind] = row;
  const country: Country = {
    alpha2,
    alpha3,
    numeric,
    kind: kind ?? "iso",
    name: local === null ? { en, ja } : { en, ja, local },
    flag: flagOf(alpha2),
    continent,
  };
  if (shortEn !== null || shortJa !== null) {
    country.shortName = {};
    if (shortEn !== null) country.shortName.en = shortEn;
    if (shortJa !== null) country.shortName.ja = shortJa;
  }
  if (reading !== null) country.reading = reading;
  if (subregion !== null) country.subregion = subregion;
  if (calling !== null) country.callingCode = calling;
  if (currencies !== null) country.currency = listOf(currencies, " ");
  if (tld !== null) country.tld = tld;
  if (capital !== null && capitalJa !== null) country.capital = { en: capital, ja: capitalJa };
  if (zones !== null) country.zones = listOf(zones, " ");
  if (languages !== null) country.languages = listOf(languages, " ");
  if (subdivisionType !== null) country.subdivisionType = subdivisionType;
  if (aliases !== null) country.aliases = listOf(aliases, "|");
  if (ioc !== null) country.ioc = ioc;

  return country;
};

// Frozen, list and objects alike: the lists are shared by every caller, so none may change them.
const expandSubdivisions = (table: SubdivisionTable): readonly Subdivision[] => {
  const rows = table.rows.split(LINE).map((line) => line.split(FIELD));
  const parents = new Map<string, string>(rows.map((row) => [row[0], row[4] ?? ""]));
  const levelOf = (shortCode: string): 1 | 2 | 3 => {
    const parent = parents.get(shortCode) ?? "";
    if (parent === "") return 1;

    return (parents.get(parent) ?? "") === "" ? 2 : 3;
  };
  const list = rows.map(([shortCode, en, ja = "", type = "", parent = "", reading = ""]) => {
    const subdivision: Subdivision = {
      code: `${table.country}-${shortCode}`,
      country: table.country,
      shortCode,
      type: type === "" ? null : table.types[Number(type)],
      level: levelOf(shortCode),
      name: Object.freeze({ en, ja: ja === "" ? null : ja }),
    };
    if (parent !== "") subdivision.parent = `${table.country}-${parent}`;
    if (reading !== "") subdivision.reading = reading;

    return Object.freeze(subdivision);
  });

  return Object.freeze(list);
};

// [alpha2, population, populationYear, areaKm2, areaYear, areaOf, lat, lon, capitalLat, capitalLon, borders,
//  drivingSide, conventions], written by scripts/build-data.ts. Trailing nulls are left off. areaOf is "L" for a
// figure for the land alone; borders is one string of codes with spaces between; drivingSide is "L" or "R";
// conventions lists, with spaces between, only the CLDR values that are not the world's default (mon, metric, A4, h23).
type FactsRow = readonly [string, ...(string | number | null)[]];

// One country's subdivision facts as text, a line each: shortCode|capitalEn|capitalJa|capitalReading|capitalLat|
// capitalLon|population|populationYear|areaKm2|areaYear|lat|lon, an absent value empty and trailing ones left off.
interface SubdivisionFactsTable {
  country: string;
  rows: string;
}

// Frozen, list and objects alike.
const expandSubdivisionFacts = (table: SubdivisionFactsTable): readonly SubdivisionFacts[] => {
  const number = (text: string | undefined): number | null => (text === undefined || text === "" ? null : Number(text));
  const point = (lat: string | undefined, lon: string | undefined): LatLon | null => {
    const [a, b] = [number(lat), number(lon)];

    return a === null || b === null ? null : Object.freeze({ lat: a, lon: b });
  };
  const list = table.rows.split(LINE).map((line) => {
    const [shortCode, capitalEn = "", capitalJa = "", reading = "", capitalLat, capitalLon, population, populationYear, area, areaYear, lat, lon] = line.split(FIELD);
    let capital: SubdivisionFacts["capital"] = null;
    if (capitalEn !== "") {
      const named: { en: string; ja: string | null; reading?: string } = { en: capitalEn, ja: capitalJa === "" ? null : capitalJa };
      if (reading !== "") named.reading = reading;
      capital = Object.freeze(named);
    }

    return Object.freeze({
      code: `${table.country}-${shortCode}`,
      capital,
      capitalPoint: point(capitalLat, capitalLon),
      population: number(population),
      populationYear: number(populationYear),
      areaKm2: number(area),
      areaYear: number(areaYear),
      point: point(lat, lon),
    } satisfies SubdivisionFacts);
  });

  return Object.freeze(list);
};

// A grouping as scripts/build-data.ts writes it: members as a list of codes, each membership period as
// [code, since, until], and the source as [name, url, licence]; src/groupings.ts makes the public object.
interface GroupingRow {
  id: string;
  kind: GroupingKind;
  en: string;
  ja: string;
  reading?: string;
  otherNames?: readonly { en: string; ja: string; reading?: string }[];
  shortEn?: string;
  shortJa?: string;
  country?: string;
  parent?: string;
  sets?: readonly string[];
  members: readonly string[];
  periods?: readonly (readonly [string, string | null, string | null])[];
  others?: readonly (readonly [string, GroupingStatus])[];
  definition: string;
  note?: string;
  source: readonly [string, string, string];
  asOf: string;
}

// A withdrawn country as scripts/build-data.ts writes it (src/withdrawn.ts makes the public object).
interface WithdrawnRow {
  code: string;
  alpha2: string;
  alpha3: string | null;
  numeric: string | null;
  en: string;
  ja: string | null;
  since: string;
  until: string;
  successors: readonly string[];
  reusedBy: string | null;
}

export { expandCountry, expandSubdivisionFacts, expandSubdivisions, flagOf };
export type { CountryRow, FactsRow, GroupingRow, SubdivisionFactsTable, SubdivisionTable, WithdrawnRow };
