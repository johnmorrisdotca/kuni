// The withdrawn countries (ISO 3166-3) and the IOC codes, for scripts/build-data.ts, from the Wikidata snapshot
// data-sources/wikidata-codes-<day>.json and the choices in scripts/withdrawn-config.ts. Pure: the same inputs make
// the same records. It stops, with every problem listed, rather than make a record it cannot stand behind.

import { CODE_FILLS, FIRST_YEAR, IOC_CHOICES, IOC_FILLS, NAME_FILLS, PERIOD_FILLS, SUCCESSOR_FILLS } from "./withdrawn-config.ts";

type CodeRow = [property: string, value: string, rank: string, start: string | null, end: string | null];

interface SnapshotItem {
  id: string;
  en: string | null;
  ja: string | null;
  began: string[];
  ended: string[];
  codes: CodeRow[];
  successors: [string, string | null][];
}

interface CodesSnapshot {
  read: string;
  ioc: Record<string, string[]>;
  withdrawn: Record<string, SnapshotItem[]>;
}

interface WithdrawnRecord {
  code: string;
  alpha2: string;
  alpha3: string | null;
  numeric: string | null;
  en: string;
  ja: string | null;
  since: string;
  until: string;
  successors: string[];
  reusedBy: string | null;
  /** Wikidata item ids the record was made from, for the document. */
  items: string[];
  /** What was filled by hand rather than read from Wikidata, for the document. */
  filled: string[];
}

const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const HAN_BRACKET = /\s*[(（][^)）]*[)）]$/;

// "1974-01-01" is a year, as Wikidata gives it for these statements; any other day is kept whole.
const dateOf = (day: string): string => (day.endsWith("-01-01") ? day.slice(0, 4) : day);

const buildWithdrawn = (snapshot: CodesSnapshot, current: Set<string>): { records: WithdrawnRecord[]; ioc: Map<string, string> } => {
  const problems: string[] = [];
  const records: WithdrawnRecord[] = [];

  for (const [code, items] of Object.entries(snapshot.withdrawn)) {
    if (!/^[A-Z]{4}$/.test(code)) {
      problems.push(`${code} is not four letters`);
      continue;
    }
    const alpha2 = code.slice(0, 2);
    const filled: string[] = [];
    // The item that ended last is the one the record is about (the Federal Republic, for YUCS).
    const ordered = [...items].sort((a, b) => byText(a.ended.at(-1) ?? "9999", b.ended.at(-1) ?? "9999"));
    const last = ordered[ordered.length - 1];
    const dissolved = (item: SnapshotItem): boolean => item.ended.length > 0;
    const isWithdrawn = (item: SnapshotItem, row: CodeRow): boolean => row[4] !== null || row[2] === "deprecated" || dissolved(item);

    // The alpha-2 statements for the withdrawn code, which must agree with the four letters.
    const own = items.flatMap((item) => item.codes.filter((row) => row[0] === "P297" && row[1] === alpha2));
    for (const item of items) {
      for (const row of item.codes.filter((one) => one[0] === "P297" && isWithdrawn(item, one))) {
        if (row[1] !== alpha2) problems.push(`${code}: Wikidata's withdrawn alpha-2 code ${row[1]} is not the first two letters`);
      }
    }
    // The period.
    const ends = own.map((row) => row[4]).filter((day): day is string => day !== null).sort(byText);
    // Each item's start is its alpha-2 statement's, or the first edition's year, or the year the item began if later.
    const startOf = (item: SnapshotItem): string => {
      const given = item.codes.filter((row) => row[0] === "P297" && row[1] === alpha2 && row[3] !== null).map((row) => row[3] as string).sort(byText)[0];
      const began = item.began[0];

      return given !== undefined ? dateOf(given) : began !== undefined && began > `${FIRST_YEAR}-12-31` ? dateOf(began) : FIRST_YEAR;
    };
    const fill = PERIOD_FILLS[code];
    let since = items.map(startOf).sort(byText)[0];
    if (fill?.since !== undefined) since = fill.since;
    let until: string | null = ends.at(-1) !== undefined ? dateOf(ends.at(-1)!) : last.ended.at(-1) !== undefined ? dateOf(last.ended.at(-1)!) : null;
    if (fill?.until !== undefined) until = fill.until;
    if (fill !== undefined) filled.push(`period (${fill.why})`);
    if (until === null) {
      problems.push(`${code}: Wikidata gives no end and PERIOD_FILLS has none`);
      until = "";
    }

    // The alpha-3 and numeric codes: those of the last item that were withdrawn, else the fill.
    const pick = (property: string): string | null => {
      const rows = last.codes.filter((row) => row[0] === property && isWithdrawn(last, row));
      // The one that ended last: Netherlands Antilles' 530, not the 532 it had before.
      const latest = [...rows].sort((a, b) => byText(a[4] ?? "9999", b[4] ?? "9999") || byText(a[1], b[1]));

      return latest.at(-1)?.[1] ?? null;
    };
    let alpha3 = pick("P298");
    let numeric = pick("P299");
    const codeFill = CODE_FILLS[code];
    if (codeFill !== undefined) {
      if (alpha3 !== null || numeric !== null) problems.push(`${code}: CODE_FILLS has codes for a record that has its own`);
      alpha3 = codeFill.alpha3 ?? null;
      numeric = codeFill.numeric ?? null;
      filled.push(`codes (${codeFill.why})`);
    }

    // The names.
    const nameFill = NAME_FILLS[code];
    const en = nameFill?.en ?? last.en;
    if (en === null || en === undefined) problems.push(`${code}: no English name`);
    let ja = nameFill?.ja ?? last.ja?.replace(HAN_BRACKET, "") ?? null;
    if (ja !== null && ja.trim() === "") ja = null;
    if (nameFill !== undefined) filled.push(`name (${nameFill.why})`);

    // The successors: current countries that replaced it or followed it, from Wikidata and then SUCCESSOR_FILLS.
    const wikidata = items.flatMap((item) => item.successors.map(([, alpha]) => alpha)).filter((alpha): alpha is string => alpha !== null && current.has(alpha));
    const added = SUCCESSOR_FILLS[code]?.codes ?? [];
    for (const one of added) {
      if (!current.has(one)) problems.push(`${code}: successor ${one} is not a current country code`);
      if (wikidata.includes(one)) problems.push(`${code}: SUCCESSOR_FILLS repeats ${one}, which Wikidata gives`);
    }
    if (added.length > 0) filled.push(`successors ${added.join(" ")} (${SUCCESSOR_FILLS[code].why})`);
    const successors = [...new Set([...wikidata, ...added])].sort(byText);
    if (successors.length === 0) problems.push(`${code}: no successor`);

    records.push({
      code,
      alpha2,
      alpha3,
      numeric,
      en: en ?? "",
      ja,
      since,
      until,
      successors,
      reusedBy: current.has(alpha2) ? alpha2 : null,
      items: items.map((item) => item.id),
      filled,
    });
  }
  for (const code of [...Object.keys(CODE_FILLS), ...Object.keys(PERIOD_FILLS), ...Object.keys(SUCCESSOR_FILLS), ...Object.keys(NAME_FILLS)]) {
    if (!(code in snapshot.withdrawn)) problems.push(`${code} is in withdrawn-config.ts and not in the snapshot`);
  }

  // The IOC codes: one for each country, or a choice that says which.
  const ioc = new Map<string, string>();
  for (const [alpha2, codes] of Object.entries(snapshot.ioc)) {
    if (!current.has(alpha2)) continue;
    const choice = IOC_CHOICES[alpha2];
    if (codes.length > 1 && (choice === undefined || !codes.includes(choice.ioc))) problems.push(`${alpha2} has IOC codes ${codes.join(", ")} and no choice in IOC_CHOICES`);
    if (codes.length === 1 && choice !== undefined) problems.push(`IOC_CHOICES has ${alpha2}, which Wikidata gives one code`);
    const value = choice?.ioc ?? codes[0];
    if (!/^[A-Z]{3}$/.test(value)) problems.push(`${alpha2}: IOC code ${value} is not three letters`);
    ioc.set(alpha2, value);
  }
  for (const [alpha2, fill] of Object.entries(IOC_FILLS)) {
    if (ioc.has(alpha2)) problems.push(`IOC_FILLS has ${alpha2}, which Wikidata gives a code`);
    if (!current.has(alpha2)) problems.push(`IOC_FILLS has ${alpha2}, which is not a current country code`);
    ioc.set(alpha2, fill.ioc);
  }
  const seen = new Map<string, string>();
  for (const [alpha2, value] of ioc) {
    if (seen.has(value)) problems.push(`IOC code ${value} is held by ${seen.get(value)} and ${alpha2}`);
    seen.set(value, alpha2);
  }

  if (problems.length > 0) throw new Error(`The withdrawn countries and IOC codes have problems:\n${problems.map((one) => `  - ${one}`).join("\n")}`);

  return { records: records.sort((a, b) => byText(a.code, b.code)), ioc };
};

// docs/withdrawn.md: what was decided, with every record, its Japanese name for review, and what was filled by hand.
const withdrawnDoc = (records: WithdrawnRecord[], snapshot: CodesSnapshot, iocCount: number): string[] => {
  const lines = [
    "# Withdrawn countries and IOC codes",
    "",
    "Written by `pnpm data`; do not edit by hand.",
    "",
    "## What is here",
    "",
    `\`@johnmorrisdotca/kuni/withdrawn\` has the ${records.length} entries of ISO 3166-3, the list of country names that were removed from ISO 3166-1: the Soviet Union (SU), Yugoslavia (YU), Czechoslovakia (CS), East Germany (DD), Zaire (ZR), the Netherlands Antilles (AN) and the rest. They are in a list of their own, and no lookup in the main entry returns one, so a country picker never shows the USSR. A record has the four-letter ISO 3166-3 code, the alpha-2, alpha-3 and numeric codes the country held, its names in English and Japanese, the years the code was in force, and the current countries that came after it.`,
    "",
    `The IOC code of ${iocCount} of the 250 countries (\`country(code).ioc\`, "JPN", "GER", "SUI") is Wikidata's P984, the code of the country's National Olympic Committee. For the other ${250 - iocCount}, Wikidata gives none (territories and places with no committee of their own), and the field is absent, never guessed. Two choices:`,
    "",
    ...Object.entries(IOC_CHOICES).map(([code, one]) => `- ${code}: ${one.ioc}. ${one.why}`),
    ...Object.entries(IOC_FILLS).map(([code, one]) => `- ${code}: ${one.ioc}. ${one.why}`),
    "",
    `Both come from Wikidata (CC0), the snapshot \`data-sources/wikidata-codes-${snapshot.read}.json\`, read on ${snapshot.read}, with the choices in \`scripts/withdrawn-config.ts\`.`,
    "",
    "## How a record is made",
    "",
    "- A record is one ISO 3166-3 code (Wikidata property P773). Its first two letters are the alpha-2 code that was withdrawn, as the standard defines them; where Wikidata has an alpha-2 code that ended, it must say the same, or the build stops.",
    "- The years are those Wikidata gives the alpha-2 code's statement (start and end). Wikidata gives the first of January, so they are years (\"1974\"); a day that is not the first of January is kept whole. ISO 3166-1 began in 1974, which is the start where none is given.",
    "- A code the successor still uses (Timor-Leste's numeric 626, the French Southern Lands' ATF) is not a withdrawn code and is left out.",
    "- A successor is a current country that Wikidata says replaced or followed it, or one added by hand in `SUCCESSOR_FILLS` with the reason. Every record has at least one.",
    "- `reusedBy` is set where the withdrawn alpha-2 code was later given to a current country, so that BY, AI, BQ, GE and SK mean a country today and the older one only through this entry.",
    "- Japanese names are Wikidata's labels, with a trailing bracket taken off (ダホメ共和国 (西アフリカ) is ダホメ共和国); where Wikidata has none, the name is `null`, never an English name copied in.",
    "",
    "## The records",
    "",
    "| ISO 3166-3 | Alpha-2 | Alpha-3 | Numeric | English | Japanese | Since | Until | Successors | Reused by |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...records.map((one) => `| ${one.code} | ${one.alpha2} | ${one.alpha3 ?? ""} | ${one.numeric ?? ""} | ${one.en} | ${one.ja ?? "(none)"} | ${one.since} | ${one.until} | ${one.successors.join(" ")} | ${one.reusedBy ?? ""} |`),
    "",
    "## Japanese names, for review",
    "",
    "Wikidata's labels. A native reader of Japanese should look at these before they are relied on.",
    "",
    ...records.map((one) => `- ${one.code}: ${one.en} / ${one.ja ?? "(none)"}`),
    "",
    "## What was filled by hand",
    "",
    "Every other part of every record is Wikidata's.",
    "",
    ...records.filter((one) => one.filled.length > 0).flatMap((one) => [`- **${one.code}** ${one.en}`, ...one.filled.map((what) => `  - ${what}`)]),
    "",
  ];

  return lines;
};

export { buildWithdrawn, withdrawnDoc };
export type { CodesSnapshot, WithdrawnRecord };
