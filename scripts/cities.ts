// Makes the four tiers of /cities from the two inputs data-sources/ holds: the Wikidata snapshot
// (wikidata-cities-<day>.json, scripts/fetch-cities.ts) and Natural Earth's populated places
// (natural-earth-populated-places-<version>.json). The choices:
//
//   - A city is a Wikidata item. A Natural Earth place joins it through the place's WIKIDATAID; one with none is
//     matched to a Wikidata item of its country within 15 km that has the same name, and is otherwise left out.
//   - Wikidata's fact is kept where it has one. Natural Earth fills the Japanese name, the population and the point
//     where Wikidata has none, and says so in the row's source bits. Natural Earth's capital class adds a capital
//     where Wikidata names none.
//   - The population is the best-ranked statement of the latest day; of statements with no day, the largest.
//   - The subdivision is the first-level one (kuni's own list of ISO 3166-2 codes) among the codes of the places the
//     city is in; the others, and codes kuni does not list, are not kept.
//   - Tiers: a capital of any size is in `capitals`; every other city of 15,000 people or more is in `1m`, `100k` or
//     `15k` by its population. A city with no population that is not a capital is left out.
//   - Names: English is Wikidata's label, else Natural Earth's English name. A city with neither is left out.
//   - The native name is Wikidata's native label (P1705), else its label in the country's official language; it is
//     `null` where it is the English name.

import type { CityRow } from "../src/city-rows.ts";

type TierName = "capitals" | "1m" | "100k" | "15k";

// [item number, en, ja, native, native language, point, country, populations, subdivision codes, capital codes]
type WikidataItem = [number, string | null, string | null, string | null, string | null, [number, number] | null, string | null, [number, string | null][], string[], string[]];
interface CitiesSnapshot {
  read: string;
  floor: number;
  counts: Record<string, number>;
  items: WikidataItem[];
}
// [item, NAME, NAME_EN, NAME_JA, latitude, longitude, POP_MAX, FEATURECLA, ISO_A2, NE_ID]
type NePlace = [string | null, string, string | null, string | null, number, number, number | null, string, string | null, number | null];
interface NaturalEarthFile {
  release: string;
  places: NePlace[];
}

interface Report {
  read: string;
  neRelease: string;
  tiers: Record<TierName, { cities: number; ja: number; jaFromNaturalEarth: number; populationFromNaturalEarth: number }>;
  total: number;
  wikidataItems: number;
  naturalEarthPlaces: number;
  naturalEarthJoined: number;
  naturalEarthMatchedByPlace: number;
  naturalEarthOnly: number;
  naturalEarthLeftOut: { noItemNoMatch: number; noCountry: number; belowFloor: number };
  leftOut: { noName: number; noPoint: number; noCountry: number; noPopulation: number; belowFloor: number; area: number };
  withoutJa: number;
  withoutNative: number;
  withoutSubdivision: number;
}

const FLOOR = 15000;
// Wikidata's human settlements include the areas around cities and the units that hold them. An item that no capital and
// no Natural Earth place stands behind, and whose English label names one of those, is not a city.
const AREA_NAME = /\b(metropolitan (area|region|municipality|statistical area)|urban (area|agglomeration|region)|agglomeration|conurbation|built-up area|micropolitan)\b|\b(Province|County|Prefecture|Governorate|District|district|Regency|Oblast|Department)$|^(County|Province|District|Municipality|City) of /;
const RADIANS = Math.PI / 180;
const km = (a: [number, number], b: [number, number]): number => {
  const half = Math.sin(((b[0] - a[0]) * RADIANS) / 2) ** 2 + Math.cos(a[0] * RADIANS) * Math.cos(b[0] * RADIANS) * Math.sin(((b[1] - a[1]) * RADIANS) / 2) ** 2;

  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(half)));
};
const simple = (text: string): string => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const rounded = (value: number): number => Math.round(value * 10000) / 10000;

// The population Wikidata gives: the latest day's, else the largest of those with no day.
const populationOf = (pops: [number, string | null][]): { value: number; day: string | null } | null => {
  if (pops.length === 0) return null;
  const dated = pops.filter(([, day]) => day !== null).sort((a, b) => (a[1]! < b[1]! ? 1 : a[1]! > b[1]! ? -1 : b[0] - a[0]));
  const pick = dated[0] ?? [...pops].sort((a, b) => b[0] - a[0])[0]!;

  return { value: pick[0], day: pick[1] };
};

// "2020-01-01" is kept as the year 2020; any other day as it is. Years before 1000 and days of no use are dropped.
const dateOf = (day: string | null): number | string | null => {
  if (day === null || !/^\d{4}-\d\d-\d\d$/.test(day)) return null;

  return day.endsWith("-01-01") ? Number(day.slice(0, 4)) : day;
};

const buildCities = (input: { snapshot: CitiesSnapshot; naturalEarth: NaturalEarthFile; levels: ReadonlyMap<string, number>; countries: ReadonlySet<string> }): { tiers: Record<TierName, CityRow[]>; report: Report } => {
  const { snapshot, naturalEarth, levels, countries } = input;
  const report: Report = {
    read: snapshot.read,
    neRelease: naturalEarth.release,
    tiers: { capitals: { cities: 0, ja: 0, jaFromNaturalEarth: 0, populationFromNaturalEarth: 0 }, "1m": { cities: 0, ja: 0, jaFromNaturalEarth: 0, populationFromNaturalEarth: 0 }, "100k": { cities: 0, ja: 0, jaFromNaturalEarth: 0, populationFromNaturalEarth: 0 }, "15k": { cities: 0, ja: 0, jaFromNaturalEarth: 0, populationFromNaturalEarth: 0 } },
    total: 0,
    wikidataItems: snapshot.items.length,
    naturalEarthPlaces: naturalEarth.places.length,
    naturalEarthJoined: 0,
    naturalEarthMatchedByPlace: 0,
    naturalEarthOnly: 0,
    naturalEarthLeftOut: { noItemNoMatch: 0, noCountry: 0, belowFloor: 0 },
    leftOut: { noName: 0, noPoint: 0, noCountry: 0, noPopulation: 0, belowFloor: 0, area: 0 },
    withoutJa: 0,
    withoutNative: 0,
    withoutSubdivision: 0,
  };

  const wikidata = new Map<string, WikidataItem>(snapshot.items.map((item) => [`Q${item[0]}`, item]));
  const ne = new Map<string, NePlace>();
  const unmatched: NePlace[] = [];
  const only: NePlace[] = [];
  for (const place of naturalEarth.places) {
    if (place[0] !== null && wikidata.has(place[0])) {
      // Two places naming one item: the more populous is kept.
      const other = ne.get(place[0]);
      if (other === undefined || (place[6] ?? 0) > (other[6] ?? 0)) ne.set(place[0], place);
      report.naturalEarthJoined += 1;
    } else unmatched.push(place);
  }
  // The places with no item of Wikidata's: matched to a city of the same country, near and of the same name.
  const byCountry = new Map<string, WikidataItem[]>();
  for (const item of snapshot.items) if (item[6] !== null) byCountry.set(item[6], [...(byCountry.get(item[6]) ?? []), item]);
  for (const place of unmatched) {
    const names = [place[1], place[2]].flatMap((name) => (name === null ? [] : [simple(name)]));
    const found = (place[8] === null ? [] : (byCountry.get(place[8]) ?? [])).find((item) => item[5] !== null && km(item[5], [place[4], place[5]]) < 15 && [item[1], item[2]].some((name) => name !== null && names.includes(simple(name))));
    if (found === undefined) only.push(place);
    else if (!ne.has(`Q${found[0]}`)) {
      ne.set(`Q${found[0]}`, place);
      report.naturalEarthMatchedByPlace += 1;
    }
  }

  const tiers: Record<TierName, CityRow[]> = { capitals: [], "1m": [], "100k": [], "15k": [] };
  for (const item of snapshot.items) {
    const [number, enLabel, jaLabel, nativeLabel, nativeLanguage, wikidataPoint, wikidataCountry, pops, subs, capitalCodes] = item;
    const place = ne.get(`Q${number}`);
    const en = enLabel ?? place?.[2] ?? place?.[1] ?? null;
    if (en === null) {
      report.leftOut.noName += 1;
      continue;
    }
    if (place === undefined && capitalCodes.length === 0 && AREA_NAME.test(en)) {
      report.leftOut.area += 1;
      continue;
    }
    const point = wikidataPoint ?? (place === undefined ? null : ([place[4], place[5]] as [number, number]));
    if (point === null) {
      report.leftOut.noPoint += 1;
      continue;
    }
    const country = wikidataCountry ?? (place?.[8] != null && countries.has(place[8]) ? place[8] : null);
    if (country === null || !countries.has(country)) {
      report.leftOut.noCountry += 1;
      continue;
    }
    const wikidataPopulation = populationOf(pops);
    const population = wikidataPopulation?.value ?? place?.[6] ?? null;
    const populationDate = wikidataPopulation === null ? null : dateOf(wikidataPopulation.day);
    const nationalCapital = capitalCodes.some((code) => !code.includes("-")) || place?.[7] === "Admin-0 capital" || place?.[7] === "Admin-0 capital alt";
    const subdivisionCapital = capitalCodes.some((code) => code.includes("-")) || (place !== undefined && /^Admin-[01] (region )?capital$/.test(place[7]) && place[7] !== "Admin-0 capital");
    const capital = nationalCapital ? 1 : subdivisionCapital ? 2 : 0;
    const tier: TierName | null = capital !== 0 ? "capitals" : population === null ? null : population >= 1000000 ? "1m" : population >= 100000 ? "100k" : population >= FLOOR ? "15k" : null;
    if (tier === null) {
      if (population === null) report.leftOut.noPopulation += 1;
      else report.leftOut.belowFloor += 1;
      continue;
    }
    const ja = jaLabel ?? place?.[3] ?? null;
    const native = nativeLabel !== null && nativeLabel !== en ? nativeLabel : null;
    const subdivision = [...new Set(subs)].filter((code) => code.startsWith(`${country}-`) && levels.has(code)).sort((a, b) => levels.get(a)! - levels.get(b)! || (a < b ? -1 : 1))[0] ?? null;
    // Bit 1: the Japanese name is Natural Earth's; 2: the population is; 4: the point is.
    const sources = (jaLabel === null && ja !== null ? 1 : 0) | (wikidataPopulation === null && population !== null ? 2 : 0) | (wikidataPoint === null ? 4 : 0);
    tiers[tier].push([number, rounded(point[0]), rounded(point[1]), population, populationDate, country, subdivision, en, ja, native, native === null ? null : nativeLanguage, capital, capitalCodes.length === 0 ? null : capitalCodes.join(" "), sources]);

    const stats = report.tiers[tier];
    stats.cities += 1;
    report.total += 1;
    if (ja !== null) stats.ja += 1;
    if (sources & 1) stats.jaFromNaturalEarth += 1;
    if (sources & 2) stats.populationFromNaturalEarth += 1;
    if (ja === null) report.withoutJa += 1;
    if (native === null) report.withoutNative += 1;
    if (subdivision === null) report.withoutSubdivision += 1;
  }
  // The places only Natural Earth has: a city of its own, with an id that starts "ne:" and Natural Earth's own number.
  for (const place of only) {
    const [, name, nameEn, nameJa, lat, lon, pop, kind, iso, neId] = place;
    if (iso === null || !countries.has(iso) || neId === null) {
      report.naturalEarthLeftOut.noCountry += 1;
      continue;
    }
    const capital = kind === "Admin-0 capital" || kind === "Admin-0 capital alt" ? 1 : /^Admin-[01] (region )?capital$/.test(kind) ? 2 : 0;
    const tier: TierName | null = capital !== 0 ? "capitals" : pop === null ? null : pop >= 1000000 ? "1m" : pop >= 100000 ? "100k" : pop >= FLOOR ? "15k" : null;
    if (tier === null) {
      report.naturalEarthLeftOut.belowFloor += 1;
      continue;
    }
    // Bit 1: the Japanese name is Natural Earth's, 2: the population is, 4: the point is; here all three are.
    tiers[tier].push([`ne:${neId}`, rounded(lat), rounded(lon), pop, null, iso, null, nameEn ?? name, nameJa, null, null, capital, null, (nameJa === null ? 0 : 1) | (pop === null ? 0 : 2) | 4]);
    const stats = report.tiers[tier];
    stats.cities += 1;
    report.total += 1;
    report.naturalEarthOnly += 1;
    if (nameJa !== null) {
      stats.ja += 1;
      stats.jaFromNaturalEarth += 1;
    } else report.withoutJa += 1;
    if (pop !== null) stats.populationFromNaturalEarth += 1;
    report.withoutNative += 1;
    report.withoutSubdivision += 1;
  }
  for (const rows of Object.values(tiers)) rows.sort((a, b) => (b[3] ?? 0) - (a[3] ?? 0) || String(a[0]).localeCompare(String(b[0]), "en", { numeric: true }));

  return { tiers, report };
};

export type { CitiesSnapshot, NaturalEarthFile, Report, TierName };

// ----- Writing -----------------------------------------------------------------------------------------

const TIER_FILES: Record<TierName, { fn: string; constant: string; what: string }> = {
  capitals: { fn: "capitalCities", constant: "CAPITAL_CITY_ROWS", what: "every capital, of a country or of a subdivision, of any size" },
  "1m": { fn: "cities1m", constant: "CITY_1M_ROWS", what: "the cities of a million people or more that are not capitals" },
  "100k": { fn: "cities100k", constant: "CITY_100K_ROWS", what: "the cities of 100,000 to a million people that are not capitals" },
  "15k": { fn: "cities15k", constant: "CITY_15K_ROWS", what: "the cities of 15,000 to 100,000 people that are not capitals" },
};

// The files of one tier: the data (src/data/cities-<tier>.data.ts) and the entry (src/cities/<tier>.ts).
const cityFiles = (tier: TierName, rows: CityRow[], read: string, neRelease: string): { data: string; entry: string } => {
  const { fn, constant, what } = TIER_FILES[tier];
  const first = rows[0]!;
  const data = `// Generated by scripts/build-data.ts. Do not edit by hand: change the script or its inputs and run pnpm data.
// The ${rows.length.toLocaleString("en-US")} cities of the tier ${tier}: ${what}. src/city-rows.ts says what the columns are.
// Source: Wikidata (CC0), the snapshot data-sources/wikidata-cities-${read}.json
// Source: Natural Earth ${neRelease} 10m Populated Places (public domain), data-sources/natural-earth-populated-places-${neRelease}.json: what Wikidata lacks, and the capital class

import type { CityRow } from "../city-rows";

const ${constant}: readonly CityRow[] = [
${rows.map((row) => `  ${JSON.stringify(row)},`).join("\n")}
];

export { ${constant} };
`;
  const name = first[7];
  const entry = `// The entry @johnmorrisdotca/kuni/cities/${tier}: ${what}. Written by scripts/build-data.ts. The core,
// @johnmorrisdotca/kuni/cities, joins this tier with the others and answers the lookups.

import { expandCities } from "../city-rows";
import type { City } from "../city-rows";
import { ${constant} } from "../data/cities-${tier}.data";

let table: readonly City[] | null = null;

/**
 * The cities of the tier \`${tier}\`: ${what}. ${rows.length.toLocaleString("en-US")} of them, the most populous first, each a frozen object; the list is made on the first call and shared.
 *
 * @returns The list. Join it with other tiers through \`citySet\` in @johnmorrisdotca/kuni/cities.
 * @example
 * \`\`\`ts
 * import { ${fn} } from "@johnmorrisdotca/kuni/cities/${tier}";
 *
 * console.log(${fn}().length > 0);          // true
 * console.log(${fn}()[0].name.en);          // ${JSON.stringify(name)}
 * console.log(${fn}()[0].id);               // ${JSON.stringify(`Q${first[0]}`)}
 * console.log(${fn}()[0].country);          // ${JSON.stringify(first[5])}
 * \`\`\`
 */
const ${fn} = (): readonly City[] => {
  if (table === null) table = expandCities(${constant});

  return table;
};

/**
 * The day the Wikidata snapshot of the cities was read: every name and figure in the cities is as Wikidata gave it on this day (Natural Earth's, ${neRelease}, are as that release has them).
 *
 * @example
 * \`\`\`ts
 * import { CITIES_READ } from "@johnmorrisdotca/kuni/cities/${tier}";
 *
 * console.log(CITIES_READ);  // ${JSON.stringify(read)}
 * \`\`\`
 */
const CITIES_READ = ${JSON.stringify(read)};

export { CITIES_READ, ${fn} };
export type { City };
`;

  return { data, entry };
};

// One country's cities, every tier together, the most populous first: src/data/cities-by-country/<code>.data.ts and the
// entry src/cities/<code>.ts, which the picker (and anything that wants one country) loads on its own.
const countryCityFiles = (alpha2: string, rows: CityRow[], englishName: string): { data: string; entry: string } => {
  const code = alpha2.toLowerCase();
  const data = `// Generated by scripts/build-data.ts. Do not edit by hand: change the script or its inputs and run pnpm data.
// The ${rows.length.toLocaleString("en-US")} cities of ${englishName} (${alpha2}), every tier together, the most populous first. src/city-rows.ts says what the columns are.
// Source: Wikidata (CC0) and Natural Earth (public domain), as src/data/cities-capitals.data.ts says

import type { CityRow } from "../../city-rows";

const ${alpha2}: readonly CityRow[] = [
${rows.map((row) => `  ${JSON.stringify(row)},`).join("\n")}
];

export { ${alpha2} };
`;
  const entry = `// Generated by scripts/build-data.ts. Do not edit by hand.
// The entry @johnmorrisdotca/kuni/cities/${code}: the ${rows.length.toLocaleString("en-US")} cities of ${englishName}, every tier together, as a list.

import { ${alpha2} } from "../data/cities-by-country/${code}.data";
import { expandCities } from "../city-rows";
import type { City } from "../city-rows";

/**
 * The cities of ${englishName} in every tier (the capitals and the cities of 15,000 people or more): ${rows.length.toLocaleString("en-US")}, the most populous first. Also the default export.
 *
 * @example
 * \`\`\`ts
 * import cities from "@johnmorrisdotca/kuni/cities/${code}";
 *
 * console.log(cities.length);      // ${rows.length}
 * console.log(cities[0].name.en);  // ${JSON.stringify(rows[0]![7])}
 * console.log(cities[0].country);  // ${JSON.stringify(alpha2)}
 * \`\`\`
 */
const CITIES: readonly City[] = expandCities(${alpha2});

export default CITIES;
export { CITIES };
`;

  return { data, entry };
};

// The loaders: one dynamic import for each country that has cities, so a bundler makes a chunk of each.
const cityLoaders = (codes: string[]): string => `// Generated by scripts/build-data.ts. Do not edit by hand: change the script or its inputs and run pnpm data.
// One dynamic import for each of the ${codes.length} countries with cities, so a bundler makes a chunk of each.

import type { City } from "../city-rows";

type Loader = () => Promise<{ CITIES: readonly City[] }>;

const CITY_LOADERS: Readonly<Record<string, Loader>> = {
${codes.map((code) => `  ${code}: () => import("../cities/${code}.js"),`).join("\n")}
};

export { CITY_LOADERS };
`;

// docs/cities.md: what the tiers hold, where each fact came from, and what is missing.
const citiesDoc = (report: Report, snapshot: CitiesSnapshot, naturalEarth: NaturalEarthFile): string[] => {
  const percent = (part: number, whole: number): string => (whole === 0 ? "0%" : `${((part / whole) * 100).toFixed(1)}%`);
  const n = (value: number): string => value.toLocaleString("en-US");
  const names = Object.keys(report.tiers) as TierName[];
  const lines = [
    "# The cities: what is known",
    "",
    "Written by `scripts/build-data.ts` from `scripts/cities.ts`; do not edit it by hand. Every figure here is counted",
    `from the two inputs: the Wikidata snapshot of ${report.read} (CC0) and Natural Earth ${report.neRelease}'s 10m Populated Places (public domain).`,
    "",
    "## The tiers",
    "",
    "A city is in one tier only: a capital of any size is in `capitals`; every other city is in the tier its population names.",
    "",
    "| Tier | Entry | Holds | Cities | With a Japanese name | Japanese name from Natural Earth | Population from Natural Earth |",
    "|---|---|---|---:|---:|---:|---:|",
    ...names.map((name) => {
      const stats = report.tiers[name];

      return `| \`${name}\` | \`@johnmorrisdotca/kuni/cities/${name}\` | ${TIER_FILES[name].what} | ${n(stats.cities)} | ${n(stats.ja)} (${percent(stats.ja, stats.cities)}) | ${n(stats.jaFromNaturalEarth)} | ${n(stats.populationFromNaturalEarth)} |`;
    }),
    `| all | | | ${n(report.total)} | ${n(report.total - report.withoutJa)} (${percent(report.total - report.withoutJa, report.total)}) | ${n(names.reduce((sum, name) => sum + report.tiers[name].jaFromNaturalEarth, 0))} | ${n(names.reduce((sum, name) => sum + report.tiers[name].populationFromNaturalEarth, 0))} |`,
    "",
    "## How a city is chosen",
    "",
    `- **Wikidata**: the items that are an instance of a human settlement (Q486972 and every class below it through P279), have coordinates (P625) and a best-ranked population (P1082) of ${n(snapshot.floor)} or more: ${n(snapshot.counts.candidates ?? 0)} items with that population and coordinates, of which ${n(snapshot.counts.settlements ?? 0)} are a city, town or other settlement (${n(snapshot.counts.areas ?? 0)} more are only a metropolitan area, urban area or conurbation, and are left out; the rest are districts, counties and the like); every item that is the current capital (P36) of a country or a subdivision; and every item Natural Earth's places name. The queries are written in the snapshot file itself.`,
    `- **Natural Earth**: ${n(report.naturalEarthPlaces)} places ("Historic place" left out). ${n(report.naturalEarthJoined)} name a Wikidata item (WIKIDATAID) that the snapshot holds; ${n(report.naturalEarthMatchedByPlace)} more were matched by position (within 15 km, same country, same name); the ${n(report.naturalEarthOnly + report.naturalEarthLeftOut.noCountry + report.naturalEarthLeftOut.belowFloor)} left have no Wikidata item here: ${n(report.naturalEarthOnly)} are cities of their own, with an id \`ne:<Natural Earth's number>\` (a capital, or 15,000 people or more); the others have no country, or are small and no capital, and are left out.`,
    "- **Which source wins**: Wikidata's label, point and population are kept where it has them. Natural Earth fills a Japanese name, a population or a point Wikidata does not have, and a capital where Wikidata names none; each city says which in its `source` field.",
    "- **Population**: the best-ranked statement of the latest day (P585); of statements with no day, the largest. Natural Earth's `POP_MAX` has no day.",
    "- **Subdivision**: the ISO 3166-2 code, from Wikidata's P300 on the city or the places it is in (P131), restricted to the first-level subdivisions kuni lists for its country; where there are several, the first in code order.",
    "- **Areas**: Wikidata's human settlements include areas of several cities and the units that hold them. An item that is only a metropolitan area, an urban area, a conurbation, an urban agglomeration or a built-up area (by its class) is left out when the snapshot is made, and so is one whose English name ends in Province, County, Prefecture, Governorate, District, Regency, Oblast or Department, or names an area (metropolitan area, urban area, agglomeration, conurbation), or starts 'County of', 'Province of', 'District of', 'Municipality of' or 'City of', unless it is a capital or Natural Earth names it. Some cities with such a name are lost; a city that Natural Earth names is kept.",
    "- **Names**: English is Wikidata's label, else Natural Earth's; a city with neither is left out. Japanese is Wikidata's label, else Natural Earth's, else `null`: never an English name copied in, and never made up. The native name is Wikidata's native label (P1705), else its label in the country's official language (P37, language code P424), and `null` where it is the English name.",
    "",
    "## What was left out",
    "",
    `Of the ${n(report.wikidataItems)} items in the snapshot: ${n(report.leftOut.noName)} had no English name (in Wikidata or Natural Earth), ${n(report.leftOut.noPoint)} no coordinates, ${n(report.leftOut.noCountry)} no country, ${n(report.leftOut.noPopulation)} no population and were no capital, ${n(report.leftOut.area)} had an English name of an area or an administrative unit (a metropolitan area, an urban area, a province, a county, a district) and no capital or Natural Earth place behind them, and ${n(report.leftOut.belowFloor)} fell below ${n(snapshot.floor)} people by the figure used (they were in because another statement was above it, or Natural Earth names them).`,
    "",
    "## What is missing",
    "",
    `- **Japanese name**: ${n(report.withoutJa)} of ${n(report.total)} cities have none, in either source; the field is \`null\`.`,
    `- **Native name**: ${n(report.withoutNative)} cities have none or it is the English name; the field is \`null\`.`,
    `- **Subdivision**: ${n(report.withoutSubdivision)} cities have none (Wikidata does not place them in a first-level subdivision kuni lists).`,
    "",
    `Natural Earth release ${naturalEarth.release}; Wikidata read ${snapshot.read}.`,
    "",
  ];

  return lines;
};

// The ids of cities never change: an id a past release had that this one does not must be in data-sources/city-id-aliases.json,
// either as the id of the city it was merged into or as null (removed, and answering nothing). Returns what is not.
const unresolvedIds = (released: readonly (number | string)[], current: ReadonlySet<string>, aliases: Record<string, string | null>): string[] => {
  const idOf = (id: number | string): string => (typeof id === "number" ? `Q${id}` : id);

  return released.map(idOf).filter((id) => !current.has(id) && !(id in aliases));
};

// src/data/city-aliases.data.ts: the old ids and the ids they answer with.
const cityAliases = (aliases: Record<string, string | null>, current: ReadonlySet<string>): string => {
  const pairs = Object.entries(aliases).filter(([, target]) => target !== null && current.has(target)).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }));

  return `// Generated by scripts/build-data.ts. Do not edit by hand: the aliases are in data-sources/city-id-aliases.json.
// The ids that were a city's in an earlier release and now answer with another city (merged), so that an id a page stored keeps working.

const CITY_ALIASES: Readonly<Record<string, string>> = {
${pairs.map(([old, target]) => `  ${JSON.stringify(old)}: ${JSON.stringify(target)},`).join("\n")}
};

export { CITY_ALIASES };
`;
};

export { buildCities, cityAliases, unresolvedIds, citiesDoc, cityFiles, cityLoaders, countryCityFiles, TIER_FILES };
