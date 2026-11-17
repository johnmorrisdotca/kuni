// The /trivia entry, for scripts/build-data.ts: the facts a quiz wants beside /facts. For each country,
//
//   - `inception`: when Wikidata says the country, as it is today, began (P571, the best-ranked statement of the
//     item the facts choose for the code): the year, and the day where Wikidata gives one. None where Wikidata has
//     no statement, or has several of the best rank, which nothing here could choose between.
//   - `officialLanguages`: the languages CLDR records as "official" or "de_facto_official" there (territoryInfo),
//     most spoken first, each as its language subtag with script and region left off ("zh" for zh_Hant). Those CLDR
//     calls "official_regional" (Welsh in the United Kingdom) are left out.
//   - `largestCity`: the city of the country with the most people in the city itself, its city proper (the
//     municipality, commune or district that is the city, as its census or statistics office counts it), not the
//     urban or metropolitan area round it: Rome, not Milan; Jerusalem, not Tel Aviv. The figure is the one /cities
//     holds (Wikidata's latest best-ranked P1082, else Natural Earth's), except where scripts/largest-city.ts sets
//     the census figure, with its source, because Wikidata's is not the city's own (Banikoara's is its department's);
//     a city with no figure comes after every city with one. China and India are ranked by their censuses, as /cities
//     ranks them (scripts/urban-facts.ts), since Wikidata's figure there is a whole municipality or territory. None
//     for a country with no city of 15,000 people in kuni, or whose largest place kuni does not have under its code
//     (LARGEST_CITY_ELSEWHERE: Dededo, Guam's, is under US).
//
// docs/trivia.md lists what is missing and every figure set by hand.

import { LARGEST_CITY_ELSEWHERE, LARGEST_CITY_FIGURES } from "./largest-city.ts";

type Row = unknown[];

interface TriviaSnapshot {
  read: string;
  inception: Record<string, Row[]>; // [item, time, precision]
}

interface TriviaRecord {
  alpha2: string;
  year: number | null;
  day: string | null;
  officialLanguages: string[];
  largestCity: { id: string; en: string; ja: string | null } | null;
}

/** A city of /cities, as the trivia reads it: its id, names, and the figure /cities holds. */
interface TriviaCity {
  id: string;
  en: string;
  ja: string | null;
  population: number | null;
}

interface TriviaInputs {
  snapshot: TriviaSnapshot;
  countries: { alpha2: string; en: string }[];
  itemOf: ReadonlyMap<string, string>;
  territoryInfo: Record<string, { languagePopulation?: Record<string, { _officialStatus?: string; _populationPercent?: string }> }>;
  /** Each country's cities, in the order /cities lists them. */
  cities: ReadonlyMap<string, readonly TriviaCity[]>;
  /** The countries /cities ranks by their censuses (scripts/urban-facts.ts): their first city is their largest. */
  censusRanked: ReadonlySet<string>;
}

// The largest city of one country, by the people of the city itself: scripts/largest-city.ts's figure where it sets
// one, else /cities'; a city it sets to none is not ranked, and a city with no figure comes after every city with one.
const largestOf = (alpha2: string, cities: readonly TriviaCity[], censusRanked: ReadonlySet<string>): TriviaCity | null => {
  const elsewhere = LARGEST_CITY_ELSEWHERE[alpha2];
  if (elsewhere !== undefined) {
    if (elsewhere.id !== undefined && cities.some((city) => city.id === elsewhere.id)) throw new Error(`scripts/largest-city.ts: ${alpha2}'s largest place, ${elsewhere.place} (${elsewhere.id}), is now among its cities: remove it from LARGEST_CITY_ELSEWHERE`);

    return null;
  }
  if (censusRanked.has(alpha2)) return cities[0] ?? null;
  const figure = (city: TriviaCity): number | null => (city.id in LARGEST_CITY_FIGURES ? LARGEST_CITY_FIGURES[city.id].population : city.population);
  const ranked = cities.filter((city) => !(city.id in LARGEST_CITY_FIGURES && LARGEST_CITY_FIGURES[city.id].population === null));
  // Stable: cities of one figure, and those with none, keep the order of /cities.
  ranked.sort((a, b) => (figure(b) ?? -1) - (figure(a) ?? -1));

  return ranked[0] ?? null;
};

// Every figure set by hand must still be for a city kuni has, and replace the figure Wikidata still gives.
const checkFigures = (cities: ReadonlyMap<string, readonly TriviaCity[]>): void => {
  const byId = new Map([...cities.values()].flat().map((city) => [city.id, city]));
  for (const [id, fix] of Object.entries(LARGEST_CITY_FIGURES)) {
    const city = byId.get(id);
    if (city === undefined) throw new Error(`scripts/largest-city.ts: ${id} is no city of /cities now: remove its figure`);
    if (city.population !== fix.wikidata) throw new Error(`scripts/largest-city.ts: ${id} (${city.en}) has ${city.population} in /cities now, not ${fix.wikidata}: check the figure again`);
  }
};

const OFFICIAL = new Set(["official", "de_facto_official"]);
// The countries whose largest city by its urban area is another, for the docs; src/trivia.test.ts pins each answer.
const URBAN_ANSWERS = [
  "Belgium, Brussels (the City of Brussels has 195,546; Antwerp 529,247)",
  "Cyprus, Nicosia (Limassol is the largest municipality, 108,105 at the 2021 census, Nicosia 56,848)",
  "Ghana, Accra (the Kumasi Metropolitan District had 443,981 at the 2021 census, Accra's 284,124)",
  "India, Delhi today",
  "Israel, Tel Aviv",
  "Italy, Milan",
  "the Philippines, Manila",
  "Sudan, Khartoum (at the 2008 census Omdurman had 1,849,659, Khartoum 1,410,858)",
  "Taiwan, Taipei",
];
const TIME = /^([+-]?\d{4,})-(\d{2})-(\d{2})T/;

const buildTrivia = (inputs: TriviaInputs): { records: TriviaRecord[]; doc: string[] } => {
  const { snapshot, countries, itemOf, territoryInfo, cities, censusRanked } = inputs;
  checkFigures(cities);
  const several: string[] = [];
  const records = countries.map(({ alpha2 }): TriviaRecord => {
    const rows = (snapshot.inception[alpha2] ?? []).filter((row) => row[0] === itemOf.get(alpha2)) as [string, string, number][];
    const values = [...new Map(rows.map((row) => [row[1], row])).values()];
    let year: number | null = null;
    let day: string | null = null;
    if (values.length === 1) {
      const found = TIME.exec(values[0][1]);
      if (found === null) throw new Error(`${alpha2}: Wikidata's inception ${values[0][1]} is no date`);
      year = Number(found[1]);
      if (values[0][2] >= 11 && year > 0) day = `${found[1].replace(/^\+/, "")}-${found[2]}-${found[3]}`;
    } else if (values.length > 1) several.push(`${alpha2} (${values.map((row) => row[1].slice(0, row[2] >= 11 ? 10 : 4)).join(", ")})`);

    const spoken = Object.entries(territoryInfo[alpha2]?.languagePopulation ?? {})
      .filter(([, { _officialStatus }]) => _officialStatus !== undefined && OFFICIAL.has(_officialStatus))
      .map(([language, { _populationPercent }]) => ({ language: language.split("_")[0], percent: Number(_populationPercent ?? 0) }))
      .sort((a, b) => b.percent - a.percent || (a.language < b.language ? -1 : 1));

    const largest = largestOf(alpha2, cities.get(alpha2) ?? [], censusRanked);

    return { alpha2, year, day, officialLanguages: [...new Set(spoken.map((one) => one.language))], largestCity: largest === null ? null : { id: largest.id, en: largest.en, ja: largest.ja } };
  });

  const nameOf = new Map(countries.map((one) => [one.alpha2, one.en]));
  const lacking = (test: (record: TriviaRecord) => boolean): string => records.filter(test).map((record) => `${record.alpha2} ${nameOf.get(record.alpha2)}`).join(", ") || "None.";
  const have = (test: (record: TriviaRecord) => boolean): number => records.filter(test).length;
  const number = (value: number | null): string => (value === null ? "none" : value.toLocaleString("en"));
  const cityName = new Map([...cities.values()].flat().map((city) => [city.id, city.en]));
  const figureRows = Object.entries(LARGEST_CITY_FIGURES).map(([id, fix]) => `| ${cityName.get(id)} (${id}) | ${number(fix.wikidata)} | ${number(fix.population)} | ${fix.date ?? ""} | ${fix.why} |`);
  const doc = [
    "# The trivia",
    "",
    "Written by `pnpm data`; do not edit by hand. The rules are at the top of `scripts/trivia.ts`.",
    "",
    `\`@johnmorrisdotca/kuni/trivia\` has, for each of the ${records.length} countries: when it began, from Wikidata (CC0), the snapshot \`data-sources/wikidata-trivia-${snapshot.read}.json\`, read on ${snapshot.read}; its official languages, from Unicode CLDR's territoryInfo; and its largest city, by the people of the city itself, from kuni's own cities.`,
    "",
    "| Fact | Countries that have it |",
    "| --- | --- |",
    `| \`inception\` | ${have((record) => record.year !== null)} of ${records.length}, ${have((record) => record.day !== null)} to the day |`,
    `| \`officialLanguages\` | ${have((record) => record.officialLanguages.length > 0)} of ${records.length} |`,
    `| \`largestCity\` | ${have((record) => record.largestCity !== null)} of ${records.length} |`,
    "",
    "## What an inception is",
    "",
    "Wikidata's inception (P571) is the day the country, as its item describes it, began. For many that is the day of independence (India, 1947-08-15; South Sudan, 2011-07-09). For others it is a constitution, a union or a republic: Japan's is 1947-05-03, the day its constitution came into force, the United Kingdom's 1921-12-06 and the United States' 1784-05-12. It is given as Wikidata has it and is not a date of independence.",
    "",
    "## Not kept",
    "",
    "- **A national day.** Wikidata's national days (instances of Q57598 that name a country) were read on 2026-11-17: 88 countries had one or more, mixed with observances of every kind, with nothing to tell the national day apart. No other open source was found, so there is no such field.",
    "- **Former names.** Not read. `/withdrawn` has the names of the countries whose codes were withdrawn.",
    "- **Wikidata's official languages (P37).** Read on 2026-11-17 and not used: CLDR's record is sounder.",
    "",
    `## Several inceptions of the best rank, so none is kept, ${several.length}`,
    "",
    several.join("; ") || "None.",
    "",
    "## No inception in Wikidata",
    "",
    lacking((record) => record.year === null && !several.some((line) => line.startsWith(record.alpha2))),
    "",
    "## No official language in CLDR",
    "",
    lacking((record) => record.officialLanguages.length === 0),
    "",
    "## The largest city",
    "",
    "`largestCity` is the city with the most people in the city itself: its city proper, the municipality, commune or district that is the city, as its census or statistics office counts it. Not the urban or metropolitan area round it, which joins other towns to it. So Rome is Italy's, not Milan; Jerusalem is Israel's, not Tel Aviv; Quezon City is the Philippines', not Manila; New Taipei City is Taiwan's, not Taipei. Where a country counts a city only as a whole (Greater Sydney, Santiago's communes together, Lagos), that whole is the city.",
    "",
    "The figure is the one `/cities` holds: Wikidata's latest best-ranked population (P1082), else Natural Earth's. Where Wikidata's figure is not the city's own (a department's, a kingdom's, an estimate of the urban area), `scripts/largest-city.ts` sets the census figure, below. A city with no figure comes after every city with one. China and India are ranked by their censuses, as `/cities` ranks them (`scripts/urban-facts.ts`), since Wikidata's figure there is a whole municipality or territory: China's urban population at the 2020 census (Shanghai; Chongqing's 32 million is its municipality's, mostly countryside), India's 2011 census (Mumbai; its cities proper also put Mumbai, 12,442,373, ahead of Delhi, 11,034,555).",
    "",
    `By the urban area round it, the answer would be another city in ${URBAN_ANSWERS.length} countries: ${URBAN_ANSWERS.join("; ")}.`,
    "",
    `### Figures set by hand, ${figureRows.length}`,
    "",
    "| City | Wikidata's figure | Used | Day | Why |",
    "| --- | --- | --- | --- | --- |",
    ...figureRows,
    "",
    "Sources: " + [...new Set(Object.values(LARGEST_CITY_FIGURES).flatMap((fix) => (fix.source === undefined ? [] : [fix.source])))].join("; ") + ".",
    "",
    `### The largest place is not among kuni's cities, ${Object.keys(LARGEST_CITY_ELSEWHERE).length}`,
    "",
    "These have no `largestCity`, rather than the wrong one:",
    "",
    ...Object.entries(LARGEST_CITY_ELSEWHERE).map(([alpha2, { place, why }]) => `- ${alpha2} ${nameOf.get(alpha2)}: ${place}; ${why}`),
    "",
    "## No city of 15,000 people in kuni",
    "",
    lacking((record) => record.largestCity === null && !(record.alpha2 in LARGEST_CITY_ELSEWHERE)),
    "",
  ];

  return { records, doc };
};

export { buildTrivia };
export type { TriviaCity, TriviaRecord, TriviaSnapshot };
