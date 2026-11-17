// The /trivia entry, for scripts/build-data.ts: the facts a quiz wants beside /facts. For each country,
//
//   - `inception`: when Wikidata says the country, as it is today, began (P571, the best-ranked statement of the
//     item the facts choose for the code): the year, and the day where Wikidata gives one. None where Wikidata has
//     no statement, or has several of the best rank, which nothing here could choose between.
//   - `officialLanguages`: the languages CLDR records as "official" or "de_facto_official" there (territoryInfo),
//     most spoken first, each as its language subtag with script and region left off ("zh" for zh_Hant). Those CLDR
//     calls "official_regional" (Welsh in the United Kingdom) are left out.
//   - `largestCity`: the city kuni ranks first in the country, by its urban area's people where one is known and
//     by its own otherwise, as every list of /cities does. None for a country with no city of 15,000 people.
//
// No choice is written by hand, so there is no config; docs/trivia.md lists what is missing.

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

interface TriviaInputs {
  snapshot: TriviaSnapshot;
  countries: { alpha2: string; en: string }[];
  itemOf: ReadonlyMap<string, string>;
  territoryInfo: Record<string, { languagePopulation?: Record<string, { _officialStatus?: string; _populationPercent?: string }> }>;
  largestCity: ReadonlyMap<string, { id: string; en: string; ja: string | null }>;
}

const OFFICIAL = new Set(["official", "de_facto_official"]);
const TIME = /^([+-]?\d{4,})-(\d{2})-(\d{2})T/;

const buildTrivia = (inputs: TriviaInputs): { records: TriviaRecord[]; doc: string[] } => {
  const { snapshot, countries, itemOf, territoryInfo, largestCity } = inputs;
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

    return { alpha2, year, day, officialLanguages: [...new Set(spoken.map((one) => one.language))], largestCity: largestCity.get(alpha2) ?? null };
  });

  const nameOf = new Map(countries.map((one) => [one.alpha2, one.en]));
  const lacking = (test: (record: TriviaRecord) => boolean): string => records.filter(test).map((record) => `${record.alpha2} ${nameOf.get(record.alpha2)}`).join(", ") || "None.";
  const have = (test: (record: TriviaRecord) => boolean): number => records.filter(test).length;
  const doc = [
    "# The trivia",
    "",
    "Written by `pnpm data`; do not edit by hand. The rules are at the top of `scripts/trivia.ts`.",
    "",
    `\`@johnmorrisdotca/kuni/trivia\` has, for each of the ${records.length} countries: when it began, from Wikidata (CC0), the snapshot \`data-sources/wikidata-trivia-${snapshot.read}.json\`, read on ${snapshot.read}; its official languages, from Unicode CLDR's territoryInfo; and its largest city, the first of kuni's own cities there.`,
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
    "## No city of 15,000 people in kuni",
    "",
    lacking((record) => record.largestCity === null),
    "",
  ];

  return { records, doc };
};

export { buildTrivia };
export type { TriviaRecord, TriviaSnapshot };
