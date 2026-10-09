// The groupings for the /groupings entry, for scripts/build-data.ts: the seven continents and the UN M49 areas, read
// from CLDR; the memberships of international bodies, as each body lists them (scripts/groupings-config.ts), with
// the dates Wikidata gives; the informal groupings, each with the definition it follows; and the regions inside a
// country. Members are alpha-2 codes, or ISO 3166-2 codes for a grouping inside a country.

import { AS_OF, CONTINENT_READINGS, INFORMAL, M49_READINGS, MEMBERSHIPS, MEMBERSHIPS_LEFT_OUT, SUBDIVISION_GROUPINGS } from "./groupings-config.ts";
import type { Status } from "./groupings-config.ts";

type Row = unknown[];

interface GroupingRecord {
  id: string;
  kind: "continent" | "m49" | "membership" | "informal" | "subdivision";
  en: string;
  ja: string;
  reading?: string;
  otherNames?: { en: string; ja: string; reading?: string }[];
  shortEn?: string;
  shortJa?: string;
  country?: string;
  parent?: string;
  sets?: string[];
  members: string[];
  periods?: [string, string | null, string | null][]; // [code, since, until]
  others?: [string, Status][];
  definition: string;
  note?: string;
  source: [string, string, string]; // [name, url, licence]
  asOf: string;
}

interface GroupingsInputs {
  countries: { alpha2: string; continent: string; en: string; ja: string }[];
  subdivisionCodes: Set<string>;
  territoriesEn: Record<string, string>;
  territoriesJa: Record<string, string>;
  containment: Record<string, { _contains: string[]; _grouping?: string }>;
  continentNames: Record<string, [string, string]>;
  memberships: Record<string, Row[]>; // the snapshot's "memberships", by country code
  cldrVersion: string;
  snapshotRead: string;
}

const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const codesOf = (text: string): string[] => text.split(/\s+/).filter(Boolean);
const CLDR_LICENCE = "Unicode-3.0";
const M49_URL = "https://unstats.un.org/unsd/methodology/m49/";
const HAN = /\p{Script=Han}/u;

const buildGroupings = (inputs: GroupingsInputs): { records: GroupingRecord[]; doc: string[] } => {
  const { countries, containment } = inputs;
  const known = new Set(countries.map((one) => one.alpha2));
  const problems: string[] = [];
  const check = (id: string, codes: string[]): void => {
    for (const code of codes) if (!known.has(code)) problems.push(`${id}: ${code} is not a country code`);
    if (new Set(codes).size !== codes.length) problems.push(`${id}: a member is listed twice`);
    if (codes.length === 0) problems.push(`${id}: no members`);
  };

  // ----- The continents ------------------------------------------------------------------------------------
  const records: GroupingRecord[] = [];
  for (const [continent, [en, ja]] of Object.entries(inputs.continentNames)) {
    const members = countries.filter((one) => one.continent === continent).map((one) => one.alpha2);
    const reading = CONTINENT_READINGS[continent];
    if (HAN.test(ja) && reading === undefined) problems.push(`continent ${continent}: ${ja} has kanji and no reading`);
    records.push({
      id: `continent-${continent.toLowerCase()}`,
      kind: "continent",
      en,
      ja,
      ...(reading === undefined ? {} : { reading }),
      members,
      definition: "Seven continents read from UN M49: Africa (002), Asia (142), Europe (150) and Oceania (009) as M49 has them, and the Americas (019) as South America (005) and North America (the rest: Northern America, Central America and the Caribbean). Antarctica, in no M49 region, is the seventh. So Russia is in Europe, Cyprus and Turkey in Asia, Timor-Leste in Asia, and the sub-Antarctic islands where M49 puts them (Bouvet Island and South Georgia in South America, Heard and McDonald in Oceania, the French Southern Lands in Africa).",
      note: "A six-continent model counts the Americas as one (UN M49's Americas, 019); another joins Europe and Asia.",
      source: [`Unicode CLDR ${inputs.cldrVersion}, territoryContainment (UN M49); Antarctica by hand`, M49_URL, CLDR_LICENCE],
      asOf: AS_OF,
    });
  }

  // ----- UN M49, from CLDR ---------------------------------------------------------------------------------
  const areas = Object.keys(containment).filter((area) => /^\d{3}$/.test(area) && area !== "001");
  const parentOf = new Map<string, string>();
  for (const [area, { _contains }] of Object.entries(containment)) {
    if (!/^\d{3}$/.test(area)) continue;
    for (const inner of _contains) if (/^\d{3}$/.test(inner) && !(inner === "419" || inner === "003" || inner === "202")) parentOf.set(inner, area);
  }
  // The intermediate areas (Latin America, Sub-Saharan Africa) sit between a region and its subregions in UN M49.
  for (const [inner, outer] of [["419", "019"], ["202", "002"]]) parentOf.set(inner, outer);
  for (const area of ["005", "013", "029"]) parentOf.set(area, "419");
  for (const area of ["011", "014", "017", "018"]) parentOf.set(area, "202");
  const leaves = (area: string): string[] =>
    (containment[area]?._contains ?? []).flatMap((inner) => (/^\d{3}$/.test(inner) ? leaves(inner) : known.has(inner) ? [inner] : []));
  for (const area of areas.sort(byText)) {
    const members = [...new Set(leaves(area))].sort(byText);
    const parent = parentOf.get(area);
    if (HAN.test(inputs.territoriesJa[area]) !== (M49_READINGS[area] !== undefined)) problems.push(`m49 ${area}: ${inputs.territoriesJa[area]} and its reading do not match`);
    records.push({
      id: `m49-${area}`,
      kind: "m49",
      en: inputs.territoriesEn[area],
      ja: inputs.territoriesJa[area],
      ...(M49_READINGS[area] === undefined ? {} : { reading: M49_READINGS[area] }),
      ...(parent === undefined || parent === "001" ? {} : { parent: `m49-${parent}` }),
      members,
      definition: `UN M49 area ${area}, with the members Unicode CLDR ${inputs.cldrVersion} gives it.`,
      ...(area === "003"
        ? { note: "North America in CLDR's sense: Northern America, Central America and the Caribbean together. UN M49 uses the code but does not place it in its tree." }
        : area === "030"
          ? { note: "CLDR counts Taiwan here; UN M49 does not list Taiwan." }
          : area === "039"
            ? { note: "CLDR counts Kosovo here; UN M49 does not list Kosovo." }
            : {}),
      source: [`Unicode CLDR ${inputs.cldrVersion}, territoryContainment (UN M49)`, M49_URL, CLDR_LICENCE],
      asOf: AS_OF,
    });
  }

  // ----- Memberships ---------------------------------------------------------------------------------------
  const unMembers = (containment.UN?._contains ?? []).filter((code) => known.has(code)).sort(byText);
  const crossCheck: string[] = [];
  for (const body of MEMBERSHIPS) {
    const members = body.id === "un" ? unMembers : codesOf(body.members).sort(byText);
    check(body.id, members);
    const others = Object.entries(body.others ?? {}).sort((a, b) => byText(a[0], b[0]));
    for (const [code] of others) {
      if (!known.has(code)) problems.push(`${body.id}: ${code} is not a country code`);
      if (members.includes(code)) problems.push(`${body.id}: ${code} is a member and also ${body.others![code]}`);
    }
    // What Wikidata says, for the dates and for the cross-check.
    const stated: { code: string; start: string | null; end: string | null }[] = [];
    for (const [code, rows] of Object.entries(inputs.memberships)) {
      for (const row of rows) if (row[1] === body.item && known.has(code)) stated.push({ code, start: row[3] as string | null, end: row[4] as string | null });
    }
    const periods: [string, string | null, string | null][] = [];
    for (const code of members) {
      const starts = [...new Set(stated.filter((one) => one.code === code && one.end === null).map((one) => one.start))].filter((start): start is string => start !== null);
      periods.push([code, starts.length === 1 ? starts[0] : null, null]);
    }
    for (const one of stated) if (one.end !== null) periods.push([one.code, one.start, one.end]);
    for (const left of body.former ?? []) {
      if (members.includes(left.code)) problems.push(`${body.id}: ${left.code} is a member and also listed as former`);
      if (!periods.some(([code, , until]) => code === left.code && until === left.until)) periods.push([left.code, left.since, left.until]);
    }
    periods.sort((a, b) => byText(a[0], b[0]) || byText(a[1] ?? "", b[1] ?? ""));
    const current = new Set(stated.filter((one) => one.end === null).map((one) => one.code));
    const wikidataOnly = [...current].filter((code) => !members.includes(code) && !(code in (body.others ?? {}))).sort(byText);
    const listOnly = members.filter((code) => !current.has(code));
    if (body.id !== "un") crossCheck.push(`| ${body.shortEn ?? body.en} | ${members.length} | ${listOnly.join(" ") || "–"} | ${wikidataOnly.join(" ") || "–"} | ${periods.filter(([, since, until]) => until === null && since !== null).length} |`);
    records.push({
      id: body.id,
      kind: "membership",
      en: body.en,
      ja: body.ja,
      ...(body.reading === undefined ? {} : { reading: body.reading }),
      ...(body.shortEn === undefined ? {} : { shortEn: body.shortEn }),
      ...(body.shortJa === undefined ? {} : { shortJa: body.shortJa }),
      members,
      periods,
      ...(others.length === 0 ? {} : { others }),
      definition: `The members ${body.id === "un" ? "the United Nations lists" : `${body.source.name.split(",")[0]} lists`} on ${AS_OF}; the dates they joined and left are Wikidata's (CC0), read ${inputs.snapshotRead}.`,
      ...(body.note === undefined ? {} : { note: body.note }),
      source: [body.source.name, body.source.url, body.id === "un" ? `${CLDR_LICENCE} (CLDR); dates CC0 (Wikidata)` : "A list of facts; dates CC0 (Wikidata)"],
      asOf: AS_OF,
    });
  }

  // ----- Informal ------------------------------------------------------------------------------------------
  for (const group of INFORMAL) {
    const members = [
      ...new Set(
        codesOf(group.members).flatMap((token) => {
          if (!token.startsWith("m49:")) return [token];
          const found = records.find((one) => one.id === `m49-${token.slice(4)}`);
          if (found === undefined) problems.push(`${group.id}: no M49 area ${token}`);

          return found?.members ?? [];
        }),
      ),
    ].sort(byText);
    check(group.id, members);
    records.push({
      id: group.id,
      kind: "informal",
      en: group.en,
      ja: group.ja,
      ...(group.reading === undefined ? {} : { reading: group.reading }),
      members,
      definition: group.definition,
      ...(group.note === undefined ? {} : { note: group.note }),
      source: [group.source.name, group.source.url, "A list of facts, written for kuni (MIT)"],
      asOf: AS_OF,
    });
  }

  // ----- Inside a country ----------------------------------------------------------------------------------
  const sets = new Map<string, string[]>();
  for (const group of SUBDIVISION_GROUPINGS) {
    const members = codesOf(group.members).map((short) => `${group.country}-${short}`).sort(byText);
    for (const code of members) if (!inputs.subdivisionCodes.has(code)) problems.push(`${group.id}: ${code} is not a subdivision`);
    for (const set of group.sets) sets.set(set, [...(sets.get(set) ?? []), ...members]);
    records.push({
      id: group.id,
      kind: "subdivision",
      en: group.en,
      ja: group.ja,
      ...(group.reading === undefined ? {} : { reading: group.reading }),
      country: group.country,
      sets: group.sets,
      ...(group.otherNames === undefined ? {} : { otherNames: group.otherNames }),
      members,
      definition: group.definition,
      source: [group.source.name, group.source.url, group.source.licence],
      asOf: AS_OF,
    });
  }
  // Every set covers its country's first level once, except the mainland-only Australian set and Canada's, which
  // cover every first-level code; a code twice in a set, or one left out, is a mistake.
  for (const [set, members] of sets) {
    if (new Set(members).size !== members.length) problems.push(`set ${set}: a subdivision is in two of its groupings`);
  }
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) problems.push(`two groupings are called ${record.id}`);
    ids.add(record.id);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(record.id)) problems.push(`${record.id} is not kebab case`);
    if (record.ja.trim() === "" || record.en.trim() === "") problems.push(`${record.id} has no name`);
  }
  if (problems.length > 0) throw new Error(`The groupings cannot be made:\n  ${problems.join("\n  ")}`);

  const count = (kind: GroupingRecord["kind"]): number => records.filter((record) => record.kind === kind).length;
  const doc = [
    "# Groupings: what each one follows",
    "",
    "Written by `pnpm data` (scripts/build-data.ts); do not edit by hand. The lists written by hand are in",
    "`scripts/groupings-config.ts`, each with its source.",
    "",
    `${records.length} groupings: ${count("continent")} continents, ${count("m49")} UN M49 areas, ${count("membership")} international bodies, ${count("informal")} informal groupings and ${count("subdivision")} groupings of subdivisions inside a country. As of ${AS_OF}.`,
    "",
    "## The continents",
    "",
    records.find((record) => record.kind === "continent")!.definition,
    "",
    "## UN M49",
    "",
    `The areas and their members are Unicode CLDR ${inputs.cldrVersion}'s copy of UN M49 (territoryContainment). CLDR places`,
    "Taiwan in Eastern Asia and Kosovo in Southern Europe, which UN M49 does not list; Antarctica is in no M49 area. The",
    "intermediate areas Latin America and the Caribbean (419) and Sub-Saharan Africa (202) are given with their parents.",
    "",
    "## International bodies",
    "",
    "Each body's members are its own published list on the day above, written by hand; Wikidata's \"member of\" (P463)",
    "gives the dates. The table is the cross-check: the members Wikidata does not list as current members, and the",
    "countries Wikidata lists that the body does not (stale or wrong statements there; the body's list is kept).",
    "",
    "| Body | Members | Not current in Wikidata | In Wikidata, not the body's list | With a start date |",
    "| --- | --- | --- | --- | --- |",
    ...crossCheck,
    "",
    "Left out on purpose:",
    "",
    ...Object.entries(MEMBERSHIPS_LEFT_OUT).map(([id, why]) => `- **${id}**: ${why}`),
    "",
    "## Informal groupings",
    "",
    ...INFORMAL.map((group) => `- **${group.en}** (${group.id}): ${group.definition} ${group.note ?? ""}`.trim()),
    "",
    "## Inside a country",
    "",
    ...SUBDIVISION_GROUPINGS.map((group) => `- **${group.en}** (${group.id}, sets ${group.sets.join(", ")}): ${group.definition}`),
    "",
  ];

  return { records, doc };
};

export { buildGroupings };
export type { GroupingRecord };
