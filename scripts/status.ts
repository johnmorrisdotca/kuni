// What each holder of a country code is and whose it is, for scripts/build-data.ts: a status ("un-member",
// "un-observer", "territory", "special-region", "disputed" or "uninhabited"), the sovereign state of a territory,
// and a short type in English and Japanese ("British Overseas Territory", イギリスの海外領土). The rules are
// written at the top of scripts/status-config.ts; the exceptions are listed there.

import { NO_PERMANENT_RESIDENTS, NO_SOVEREIGN, SOVEREIGN_ITEMS, SPECIAL_REGION_CLASS, TYPE_CLASSES, TYPE_GAPS, UN_OBSERVERS } from "./status-config.ts";
import type { Status } from "./status-config.ts";

type Row = unknown[];

interface StatusSnapshot {
  read: string;
  classes: Record<string, Row[]>; // [item, class, en, ja, rank, end]
  countries: Record<string, Row[]>; // [item, country, alpha2 or null, en, rank, end]
  claims: Record<string, Row[]>; // [item, claimant, alpha2 or null, en, rank, end]
}

interface StatusRecord {
  alpha2: string;
  status: Status;
  sovereign: string | null;
  type: { en: string; ja: string | null } | null;
}

interface StatusInputs {
  snapshot: StatusSnapshot;
  countries: { alpha2: string; en: string }[];
  itemOf: ReadonlyMap<string, string>; // The Wikidata item that is each code's country, as the facts choose it
  unMembers: ReadonlySet<string>;
  populationOf: ReadonlyMap<string, number | null>;
}

const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const buildStatus = (inputs: StatusInputs): { records: StatusRecord[]; doc: string[] } => {
  const { snapshot, countries, itemOf, unMembers, populationOf } = inputs;
  const problems: string[] = [];
  const used = { sovereignItems: new Set<string>(), noSovereign: new Set<string>(), residents: new Set<string>(), classes: new Set<string>(), gaps: new Set<string>() };
  const leftOut: string[] = [];
  const decided: string[] = [];

  for (const code of Object.keys(UN_OBSERVERS.codes)) {
    if (unMembers.has(code)) problems.push(`${code} is in UN_OBSERVERS and is a member of the United Nations in CLDR`);
    if (!countries.some((one) => one.alpha2 === code)) problems.push(`${code} in UN_OBSERVERS is not a country code`);
  }

  const current = (rows: Row[] | undefined, alpha2: string): Row[] => (rows ?? []).filter((row) => row[0] === itemOf.get(alpha2) && row[5] === null);

  const sovereignOf = (alpha2: string): string | null => {
    const found: { code: string; rank: string }[] = [];
    for (const row of current(snapshot.countries[alpha2], alpha2)) {
      const [item, country, code, en, rank] = row as [string, string, string | null, string | null, string];
      if (country === item) continue;
      const pinned = SOVEREIGN_ITEMS[country];
      if (pinned !== undefined) used.sovereignItems.add(country);
      const resolved = pinned?.code ?? code;
      if (resolved === null || resolved === alpha2 || !unMembers.has(resolved)) {
        leftOut.push(`${alpha2}: ${en ?? country} (${country}), which holds ${resolved === null ? "no country code" : `the code ${resolved}, not a member of the United Nations`}`);
        continue;
      }
      found.push({ code: resolved, rank });
    }
    const all = [...new Set(found.map((one) => one.code))].sort(byText);
    if (all.length <= 1) return all[0] ?? null;
    const preferred = [...new Set(found.filter((one) => one.rank === "preferred").map((one) => one.code))].sort(byText);
    if (preferred.length === 1) {
      decided.push(`${alpha2}: Wikidata names ${all.join(" and ")}; the statement of preferred rank is ${preferred[0]}.`);

      return preferred[0];
    }
    problems.push(`${alpha2}: Wikidata's P17 names ${all.join(", ")} and no one of them by preferred rank`);

    return null;
  };

  const typeOf = (alpha2: string): StatusRecord["type"] => {
    const classes = new Map(current(snapshot.classes[alpha2], alpha2).map((row) => [row[1] as string, row]));
    const chosen = TYPE_CLASSES.find((one) => classes.has(one.item));
    if (chosen === undefined) {
      if (TYPE_GAPS[alpha2] === undefined) problems.push(`${alpha2}: no class of TYPE_CLASSES among ${[...classes.values()].map((row) => `${row[2] as string} (${row[1] as string})`).join(", ") || "none"}; add one, or a line in TYPE_GAPS`);
      else used.gaps.add(alpha2);

      return null;
    }
    if (TYPE_GAPS[alpha2] !== undefined) problems.push(`${alpha2} is in TYPE_GAPS and has the class ${chosen.item}`);
    used.classes.add(chosen.item);
    const [, , en, ja] = classes.get(chosen.item) as [string, string, string | null, string | null];
    const english = chosen.en ?? en;
    if (english === null) {
      problems.push(`${alpha2}: the class ${chosen.item} has no English label`);

      return null;
    }

    return { en: english, ja: chosen.ja === undefined ? ja : chosen.ja };
  };

  const records: StatusRecord[] = countries.map(({ alpha2 }) => {
    if (unMembers.has(alpha2)) return { alpha2, status: "un-member", sovereign: null, type: null };
    if (UN_OBSERVERS.codes[alpha2] !== undefined) return { alpha2, status: "un-observer", sovereign: null, type: null };
    if (!itemOf.has(alpha2)) problems.push(`${alpha2}: no Wikidata item`);
    const sovereign = sovereignOf(alpha2);
    const population = populationOf.get(alpha2) ?? null;
    const nobody = population === null || population === 0;
    if (NO_PERMANENT_RESIDENTS[alpha2] !== undefined) {
      if (nobody || sovereign === null) problems.push(`${alpha2} is in NO_PERMANENT_RESIDENTS and ${nobody ? "has no population anyway" : "has no sovereign"}`);
      used.residents.add(alpha2);
    }
    const isSpecial = current(snapshot.classes[alpha2], alpha2).some((row) => row[1] === SPECIAL_REGION_CLASS);
    let status: Status;
    if (nobody || NO_PERMANENT_RESIDENTS[alpha2] !== undefined) status = "uninhabited";
    else if (sovereign !== null) status = isSpecial ? "special-region" : "territory";
    else {
      const listed = NO_SOVEREIGN[alpha2];
      if (listed === undefined) problems.push(`${alpha2}: not a member or observer of the United Nations and in no other state by Wikidata's P17; say what it is in NO_SOVEREIGN`);
      else used.noSovereign.add(alpha2);
      status = listed?.status ?? "disputed";
    }
    if (sovereign !== null && NO_SOVEREIGN[alpha2] !== undefined) problems.push(`${alpha2} is in NO_SOVEREIGN and Wikidata gives it the sovereign ${sovereign}`);

    return { alpha2, status, sovereign, type: typeOf(alpha2) };
  });

  const unused = (name: string, keys: string[], seen: Set<string>): void => {
    for (const key of keys) if (!seen.has(key)) problems.push(`${name} lists ${key}, which nothing used`);
  };
  unused("SOVEREIGN_ITEMS", Object.keys(SOVEREIGN_ITEMS), used.sovereignItems);
  unused("NO_SOVEREIGN", Object.keys(NO_SOVEREIGN), used.noSovereign);
  unused("NO_PERMANENT_RESIDENTS", Object.keys(NO_PERMANENT_RESIDENTS), used.residents);
  unused("TYPE_CLASSES", TYPE_CLASSES.map((one) => one.item), used.classes);
  unused("TYPE_GAPS", Object.keys(TYPE_GAPS), used.gaps);
  if (problems.length > 0) throw new Error(`The statuses cannot be built:\n${problems.join("\n")}`);

  // ----- The record of what was decided (docs/status.md) ------------------------------------------------------
  const nameOf = new Map(countries.map((one) => [one.alpha2, one.en]));
  const count = (status: Status): number => records.filter((one) => one.status === status).length;
  const others = records.filter((one) => one.status !== "un-member");
  const doc = [
    "# What each country code is, and whose",
    "",
    "Written by `pnpm data`; do not edit by hand. The rules are at the top of `scripts/status-config.ts`.",
    "",
    `Read from Wikidata on ${snapshot.read} (\`data-sources/wikidata-status-${snapshot.read}.json\`, CC0), from the United Nations' members as Unicode CLDR lists them, and from the United Nations' list of non-member observer states (${UN_OBSERVERS.url}, read ${UN_OBSERVERS.read}).`,
    "",
    "| Status | Codes |",
    "| --- | --- |",
    ...(["un-member", "un-observer", "territory", "special-region", "disputed", "uninhabited"] as const).map((status) => `| \`${status}\` | ${count(status)} |`),
    "",
    `## The ${others.length} that are not members of the United Nations`,
    "",
    "| Code | Name | Status | Sovereign | Type | In Japanese |",
    "| --- | --- | --- | --- | --- | --- |",
    ...others.map((one) => `| ${one.alpha2} | ${nameOf.get(one.alpha2)} | \`${one.status}\` | ${one.sovereign ?? ""} | ${one.type?.en ?? ""} | ${one.type?.ja ?? ""} |`),
    "",
    "## Choices",
    "",
    ...Object.entries(UN_OBSERVERS.codes).map(([code, name]) => `- **${code}** is an observer: the United Nations lists the ${name} among its non-member observer states.`),
    ...Object.entries(NO_SOVEREIGN).map(([code, { status, why }]) => `- **${code}**, \`${status}\` with no sovereign: ${why}`),
    ...Object.entries(NO_PERMANENT_RESIDENTS).map(([code, { quote, url, read }]) => `- **${code}** is \`uninhabited\` though Wikidata gives it a population: "${quote}" (${url}, read ${read}).`),
    ...Object.entries(SOVEREIGN_ITEMS).map(([item, { code, why }]) => `- A country item ${item} is read as **${code}**: ${why}`),
    ...decided.map((line) => `- **${line.slice(0, 2)}**${line.slice(2)}`),
    ...TYPE_CLASSES.filter((one) => one.why !== undefined).map((one) => `- The type from the class ${one.item}${one.en === undefined ? "" : `, ${one.en}`}${one.ja === null ? ", with no Japanese" : ""}: ${one.why}`),
    ...Object.entries(TYPE_GAPS).map(([code, why]) => `- **${code}** has no type: ${why}`),
    "",
    "## Countries Wikidata names that were not read as a sovereign",
    "",
    ...(leftOut.length === 0 ? ["None."] : leftOut.map((line) => `- ${line}`)),
    "",
    "## Not checked",
    "",
    "The sovereigns have not been compared with the United Nations' list of Non-Self-Governing Territories and its administering powers (https://www.un.org/dppa/decolonization/en/nsgt): the page refused an automated read on 2026-11-17. ISO 3166-1's remarks are not published as data.",
    "",
  ];

  return { records, doc };
};

export { buildStatus };
export type { StatusRecord, StatusSnapshot };
