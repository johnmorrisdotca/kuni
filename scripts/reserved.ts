// The places of the /reserved entry, for scripts/build-data.ts: the places that have a code or a flag in common
// use and are no country of ISO 3166-1 (Ascension Island, the Canary Islands, Abkhazia, Somaliland). The rules are
// written at the top of scripts/reserved-config.ts.

import { DE_FACTO, DE_FACTO_CLASSES, JA_NAMES, ORGANISATIONS, PARENT_ITEMS, RESERVED_ITEMS, USER_ASSIGNED, USER_ASSIGNED_SOURCE } from "./reserved-config.ts";

type Row = unknown[];
type Kind = "iso-reserved" | "user-assigned" | "de-facto";

interface RegistrySnapshot {
  source: string;
  fileDate: string;
  read: string;
  regions: [string, string, string | null, string | null][]; // [subtag, description, added, deprecated]
}

interface ReservedSnapshot {
  read: string;
  labels: Record<string, Row[]>; // [en, ja]
  classes: Record<string, Row[]>; // [class, en, rank, end]
  countries: Record<string, Row[]>; // [country, alpha2 or null, en, rank, end]
  claims: Record<string, Row[]>; // [claimant, alpha2 or null, en, rank, end]
  subdivisions: Record<string, Row[]>; // [code, rank, end]
  facts: Record<string, Row[]>; // [population, day, dissolved]
}

interface ReservedRecord {
  id: string;
  code: string | null;
  alpha3: string | null;
  kind: Kind;
  en: string;
  ja: string | null;
  status: "territory" | "disputed" | "uninhabited";
  parent: string | null;
  subdivisions: string[];
  until: string | null;
  source: [string, string];
}

interface ReservedInputs {
  registry: RegistrySnapshot;
  snapshot: ReservedSnapshot;
  countryCodes: ReadonlySet<string>;
  unMembers: ReadonlySet<string>;
  cldr: { en: Record<string, string>; ja: Record<string, string>; alpha3: Record<string, { _alpha3?: string }>; subdivisionAlias: Record<string, { _replacement: string }> };
  subdivisions: { code: string; en: string }[];
  tidy: (text: string) => string;
}

const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const PRIVATE_USE = /^(AA|Q[M-Z]|X[A-Z]|ZZ)$/;

const buildReserved = (inputs: ReservedInputs): { records: ReservedRecord[]; doc: string[] } => {
  const { registry, snapshot, countryCodes, unMembers, cldr, subdivisions, tidy } = inputs;
  const problems: string[] = [];
  const notes: string[] = [];
  const usedParents = new Set<string>();
  const usedNames = new Set<string>();
  const known = new Set(subdivisions.map((one) => one.code));

  // ----- Which codes are iso-reserved -------------------------------------------------------------------------
  const reserved = registry.regions.filter(([subtag, , , deprecated]) => deprecated === null && !countryCodes.has(subtag) && ORGANISATIONS[subtag] === undefined && !PRIVATE_USE.test(subtag)).map(([subtag]) => subtag);
  for (const code of reserved) if (RESERVED_ITEMS[code] === undefined) problems.push(`${code} is a region subtag of IANA's registry that is no country: name its Wikidata item in RESERVED_ITEMS, or the body it is in ORGANISATIONS`);
  for (const code of Object.keys(RESERVED_ITEMS)) if (!reserved.includes(code)) problems.push(`RESERVED_ITEMS lists ${code}, which IANA's registry does not have as a current region that is no country`);
  for (const code of Object.keys(ORGANISATIONS)) if (!registry.regions.some(([subtag]) => subtag === code)) problems.push(`ORGANISATIONS lists ${code}, which IANA's registry does not have`);
  for (const code of Object.keys(USER_ASSIGNED)) {
    if (!PRIVATE_USE.test(code)) problems.push(`USER_ASSIGNED lists ${code}, which is not in ISO 3166-1's user-assigned range`);
    if (countryCodes.has(code)) problems.push(`USER_ASSIGNED lists ${code}, which is one of kuni's countries`);
  }

  const current = (rows: Row[] | undefined, endAt: number): Row[] => (rows ?? []).filter((row) => row[endAt] === null);
  const stateOf = (item: string, rows: Row[] | undefined): string[] => {
    const out = new Set<string>();
    for (const [other, code] of current(rows, 4) as [string, string | null][]) {
      if (other === item) continue;
      const pinned = PARENT_ITEMS[other];
      if (pinned !== undefined) usedParents.add(other);
      const resolved = pinned?.code ?? code;
      if (resolved !== null && unMembers.has(resolved)) out.add(resolved);
    }

    return [...out].sort(byText);
  };

  const named = (id: string, ja: string | null): string | null => {
    const fix = JA_NAMES[id];
    if (fix === undefined) return ja;
    usedNames.add(id);
    if (ja !== fix.from) problems.push(`${id}: its Japanese name is ${ja ?? "none"} now, not ${fix.from}: check JA_NAMES again`);

    return fix.ja;
  };

  const make = (id: string, code: string | null, kind: Kind, items: string[], source: [string, string]): ReservedRecord | null => {
    for (const item of items) if (snapshot.labels[item] === undefined) problems.push(`${id}: the snapshot has no item ${item}; run pnpm data:reserved`);
    if (items.some((item) => snapshot.labels[item] === undefined)) return null;

    // Names: CLDR's for a code CLDR names as a place; else the item's labels.
    let en: string | null = null;
    let ja: string | null = null;
    if (kind === "iso-reserved" && code !== null) {
      en = cldr.en[code] ?? null;
      ja = cldr.ja[code] ?? null;
    } else {
      [en, ja] = snapshot.labels[items[0]][0] as [string | null, string | null];
    }
    if (en === null) {
      problems.push(`${id}: no English name`);

      return null;
    }

    // The parent: the one state every item is in; else the one state that claims it.
    const inStates = [...new Set(items.flatMap((item) => stateOf(item, snapshot.countries[item])))];
    const claimants = [...new Set(items.flatMap((item) => stateOf(item, snapshot.claims[item])))];
    let parent: string | null = null;
    if (inStates.length === 1) parent = inStates[0];
    else if (inStates.length === 0 && claimants.length === 1) {
      parent = claimants[0];
      notes.push(`**${id}**: Wikidata names no state it is in (P17); the parent ${parent} is the one state it records as claiming it (P1336).`);
    } else if (inStates.length > 1) problems.push(`${id}: Wikidata's P17 names ${inStates.join(", ")}`);
    else notes.push(`**${id}**: no parent. Wikidata names no member of the United Nations it is in (P17) and ${claimants.length === 0 ? "none" : claimants.join(", ")} as claiming it (P1336).`);
    if (kind === "iso-reserved" && parent === null) problems.push(`${id}: an iso-reserved place with no parent`);

    if (kind !== "iso-reserved") {
      for (const item of items) {
        const classes = current(snapshot.classes[item], 3).map((row) => row[0] as string);
        if (!classes.some((one) => DE_FACTO_CLASSES[one] !== undefined)) problems.push(`${id}: Wikidata's item ${item} is none of DE_FACTO_CLASSES`);
      }
    }

    // The latest population, and the day it was dissolved.
    const facts = items.flatMap((item) => (snapshot.facts[item] ?? []) as [number | null, string | null, string | null][]);
    const latest = [...facts].filter((row) => row[0] !== null).sort((a, b) => byText(b[1] ?? "", a[1] ?? ""))[0];
    const dissolved = [...new Set(facts.map((row) => row[2]).filter((day): day is string => day !== null))].sort(byText);
    if (dissolved.length > 1) problems.push(`${id}: Wikidata gives ${dissolved.length} days it was dissolved`);
    const status = kind !== "iso-reserved" ? "disputed" : latest !== undefined && latest[0] === 0 ? "uninhabited" : "territory";

    // The ISO 3166-2 codes kuni has for the same place.
    const linked = new Set<string>();
    for (const item of items) for (const [subdivision] of current(snapshot.subdivisions[item], 2) as [string][]) if (known.has(subdivision)) linked.add(subdivision);
    if (code !== null && kind === "iso-reserved") {
      for (const [alias, { _replacement }] of Object.entries(cldr.subdivisionAlias)) {
        const subdivision = `${alias.slice(0, 2).toUpperCase()}-${alias.slice(2).toUpperCase()}`;
        if (_replacement === code && known.has(subdivision)) linked.add(subdivision);
      }
      const same = subdivisions.filter((one) => one.en === tidy(en!));
      if (same.length === 1) linked.add(same[0].code);
    }

    return {
      id,
      code,
      alpha3: kind === "iso-reserved" && code !== null ? (cldr.alpha3[code]?._alpha3 ?? null) : null,
      kind,
      en: tidy(en),
      ja: named(id, ja === null ? null : tidy(ja)),
      status,
      parent,
      subdivisions: [...linked].sort(byText),
      until: dissolved[0]?.slice(0, 4) ?? null,
      source,
    };
  };

  const registrySource: [string, string] = [`IANA Language Subtag Registry, File-Date ${registry.fileDate}: a region subtag from the codes ISO 3166-1 reserves exceptionally (RFC 5646, section 2.2.4)`, registry.source];
  const records = [
    ...Object.entries(RESERVED_ITEMS).map(([code, { id, items }]) => make(id, code, "iso-reserved", items, registrySource)),
    ...Object.entries(USER_ASSIGNED).map(([code, { id, item }]) => make(id, code, "user-assigned", [item], [`${USER_ASSIGNED_SOURCE.name}: a code of ISO 3166-1's user-assigned range, which ISO assigns to nobody`, USER_ASSIGNED_SOURCE.url])),
    ...Object.entries(DE_FACTO).map(([id, { item }]) => make(id, null, "de-facto", [item], [`Wikidata (CC0), the item ${item}`, `https://www.wikidata.org/wiki/${item}`])),
  ]
    .filter((one): one is ReservedRecord => one !== null)
    .sort((a, b) => byText(a.id, b.id));
  const ids = new Set(records.map((one) => one.id));
  if (ids.size !== records.length) problems.push("Two places have one id");
  for (const id of Object.keys(JA_NAMES)) if (!usedNames.has(id)) problems.push(`JA_NAMES lists ${id}, which nothing used`);
  for (const item of Object.keys(PARENT_ITEMS)) if (!usedParents.has(item)) problems.push(`PARENT_ITEMS lists ${item}, which nothing used`);
  if (problems.length > 0) throw new Error(`The reserved places cannot be built:\n${problems.join("\n")}`);

  const count = (kind: Kind): number => records.filter((one) => one.kind === kind).length;
  const doc = [
    "# Places outside ISO 3166-1",
    "",
    "Written by `pnpm data`; do not edit by hand. The rules are at the top of `scripts/reserved-config.ts`.",
    "",
    `\`@johnmorrisdotca/kuni/reserved\` has ${records.length} places that have a code or a flag in common use and are no country of ISO 3166-1: ${count("iso-reserved")} with a code ISO 3166-1 reserves exceptionally, ${count("user-assigned")} with a code of its user-assigned range, and ${count("de-facto")} with no code. They are never in \`countries()\`.`,
    "",
    `Read from IANA's Language Subtag Registry (File-Date ${registry.fileDate}, read ${registry.read}; \`data-sources/iana/language-subtag-regions.json\`), Unicode CLDR (the names of the reserved codes) and Wikidata on ${snapshot.read} (\`data-sources/wikidata-reserved-${snapshot.read}.json\`, CC0).`,
    "",
    "| Id | Code | Kind | Name | In Japanese | Status | Parent | Subdivisions | Until |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...records.map((one) => `| ${one.id} | ${one.code ?? ""} | \`${one.kind}\` | ${one.en} | ${one.ja ?? ""} | \`${one.status}\` | ${one.parent ?? ""} | ${one.subdivisions.join(", ")} | ${one.until ?? ""} |`),
    "",
    "## Choices",
    "",
    ...Object.entries(ORGANISATIONS).map(([code, why]) => `- **${code}** is a region subtag of the registry and is not here: ${why}`),
    ...Object.entries(USER_ASSIGNED).map(([code, { words }]) => `- **${code}** as ${USER_ASSIGNED_SOURCE.name} has it (read ${USER_ASSIGNED_SOURCE.read}): "${words}". Unicode CLDR uses XA for a testing locale; no standard gives these codes to anyone.`),
    ...Object.entries(PARENT_ITEMS).map(([item, { code, why }]) => `- A country item ${item} is read as **${code}**: ${why}`),
    ...Object.entries(JA_NAMES).map(([id, { from, ja, why }]) => `- **${id}** is named ${ja} in Japanese, where the source has ${from}: ${why}`),
    ...notes.map((line) => `- ${line}`),
    "- A parent of a `user-assigned` or `de-facto` place is what Wikidata records, and says nothing about who governs it.",
    "",
  ];

  return { records, doc };
};

export { buildReserved };
export type { RegistrySnapshot, ReservedRecord, ReservedSnapshot };
