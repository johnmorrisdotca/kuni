// The withdrawn countries (ISO 3166-3) and the IOC codes, for scripts/build-data.ts. The withdrawn countries' codes, years and
// successors are ISO 3166-3's (WITHDRAWN_TABLE in scripts/withdrawn-config.ts); their names, and the IOC codes, are Wikidata's
// (the snapshot data-sources/wikidata-codes-<day>.json). Pure: the same inputs make the same records. It stops, with every
// problem listed, rather than make a record it cannot stand behind.

import { IOC_CHOICES, IOC_FILLS, NAME_FILLS, WITHDRAWN_TABLE } from "./withdrawn-config.ts";

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

const buildWithdrawn = (snapshot: CodesSnapshot, current: Set<string>): { records: WithdrawnRecord[]; ioc: Map<string, string> } => {
  const problems: string[] = [];
  const records: WithdrawnRecord[] = [];
  const known = new Set(Object.keys(WITHDRAWN_TABLE).map((code) => code.slice(0, 2)));

  for (const code of Object.keys(WITHDRAWN_TABLE)) if (!(code in snapshot.withdrawn)) problems.push(`${code} is in ISO 3166-3's table and not in the Wikidata snapshot, which names it`);
  for (const [code, items] of Object.entries(snapshot.withdrawn)) {
    const entry = WITHDRAWN_TABLE[code];
    if (!entry) {
      problems.push(`${code} is in the Wikidata snapshot and not in ISO 3166-3's table (WITHDRAWN_TABLE)`);
      continue;
    }
    const alpha2 = code.slice(0, 2);
    // The item that ended last is the one the names come from (the Federal Republic, for YUCS).
    const ordered = [...items].sort((a, b) => byText(a.ended.at(-1) ?? "9999", b.ended.at(-1) ?? "9999"));
    const last = ordered[ordered.length - 1] as SnapshotItem;
    const nameFill = NAME_FILLS[code];
    const en = nameFill?.en ?? last.en;
    if (en === null || en === undefined) problems.push(`${code}: no English name`);
    let ja = nameFill?.ja ?? last.ja?.replace(HAN_BRACKET, "") ?? null;
    if (ja !== null && ja.trim() === "") ja = null;
    for (const one of entry.successors) {
      if (!current.has(one) && !known.has(one)) problems.push(`${code}: successor ${one} is neither a current country code nor a withdrawn one`);
    }
    if (entry.successors.length === 0) problems.push(`${code}: no successor`);
    if (!(entry.until > entry.since)) problems.push(`${code}: until ${entry.until} is not after since ${entry.since}`);
    records.push({
      code,
      alpha2,
      alpha3: entry.alpha3,
      numeric: entry.numeric,
      en: en ?? "",
      ja,
      since: entry.since,
      until: entry.until,
      successors: [...entry.successors],
      reusedBy: current.has(alpha2) ? alpha2 : null,
      items: items.map((item) => item.id),
      filled: nameFill ? [`name (${nameFill.why})`] : [],
    });
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
    "- **ISO 3166-3 is the authority** for a withdrawn country's codes, years and successors. `WITHDRAWN_TABLE` in `scripts/withdrawn-config.ts` is that list transcribed once, as ISO's Online Browsing Platform and the published ISO 3166-3 list give it, and `src/withdrawn.test.ts` pins the whole table, so a rebuild cannot drift from it. The first two letters of a four-letter code are the alpha-2 code that was withdrawn; the alpha-3 and numeric codes are the ones it held (none, where ISO lists none); `since` and `until` are the years the code was in force.",
    "- **Wikidata is used for the names** in English and Japanese only (property P773 finds the item), with the few fixes in `NAME_FILLS`. The build stops if the Wikidata snapshot and ISO's table do not name the same 31 codes.",
    "- **A successor is exactly the new code ISO lists.** It may itself be withdrawn: Yugoslavia (`YUCS`) is replaced by `CS`, which names Serbia and Montenegro (`CSXX`, 2003 to 2006) and, before it, Czechoslovakia (`CSHH`, 1974 to 1993). `withdrawn(\"CS\")` answers both, `CSXX` first, the one withdrawn last, so following the chain from `YUCS` leads to Serbia and Montenegro, and from there to `ME` and `RS`.",
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
    "## Names written by hand",
    "",
    "Every other name is Wikidata's.",
    "",
    ...records.filter((one) => one.filled.length > 0).flatMap((one) => [`- **${one.code}** ${one.en}`, ...one.filled.map((what) => `  - ${what}`)]),
    "",
  ];

  return lines;
};

export { buildWithdrawn, withdrawnDoc };
export type { CodesSnapshot, WithdrawnRecord };
