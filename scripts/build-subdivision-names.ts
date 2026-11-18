// Writes the subdivision-names entries, @johnmorrisdotca/kuni/subdivision-names/<language>: src/subdivision-names/<language>.ts (the
// entry) and src/data/subdivision-names/<language>.data.ts (its rows), for Spanish, German, Simplified and Traditional Chinese, and
// docs/subdivision-names.md (the coverage of each language and each country, and what a native reader should look at).
// Running it twice leaves the tree as it was.
//
//   pnpm data:subdivision-names
//
// Inputs, all in the repository: Unicode CLDR 48.2's subdivisions-<locale>.xml (Unicode-3.0; pnpm data:more-languages fetches them),
// Wikidata's labels for the items kuni holds (CC0; data-sources/wikidata-labels-<day>.json, written by
// scripts/extract-wikidata-labels.ts from Wikimedia's dump), and kuni's own subdivisions and Wikidata ids (src/data/subdivisions,
// data-sources/wikidata-<day>.json). The order of preference is CLDR, then Wikidata's labels in the order SOURCES_OF lists their
// tags. A name no source gives, or that fails a check below, is left out: never copied in from another language, never made up,
// never Simplified turned into Traditional or back.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { checkName, CLDR_LOCALE, WIKIDATA_TAGS } from "./subdivision-names-config.ts";
import type { SubdivisionNamesLanguage } from "../src/subdivision-names.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = join(ROOT, "data-sources");
const CLDR_DIR = join(SOURCES, "cldr", "release-48-2");
const LANGUAGES: readonly { language: SubdivisionNamesLanguage; label: string }[] = [
  { language: "es", label: "Spanish" },
  { language: "de", label: "German" },
  { language: "zh-Hans", label: "Simplified Chinese" },
  { language: "zh-Hant", label: "Traditional Chinese" },
];

const tidy = (text: string): string =>
  text
    .normalize("NFC")
    .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (wide) => String.fromCharCode(wide.charCodeAt(0) - 0xfee0))
    .replace(/[\u3000\s]+/g, " ")
    .trim();
const key = (text: string): string =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");

// kuni's subdivisions: code -> English name, read from its own generated files so the two cannot differ.
const held = new Map<string, { country: string; shortCode: string; en: string }>();
for (const file of readdirSync(join(ROOT, "src/data/subdivisions")).filter((name) => /^[a-z]{2}\.data\.ts$/.test(name))) {
  const text = readFileSync(join(ROOT, "src/data/subdivisions", file), "utf8");
  const country = /country: "([A-Z]{2})"/.exec(text)?.[1];
  const rows = /rows: `([^`]*)`/.exec(text)?.[1];
  if (country === undefined || rows === undefined) throw new Error(`${file} has no country or rows`);
  for (const line of rows.split("\n")) {
    const [shortCode, en] = line.split("|");
    held.set(`${country}-${shortCode}`, { country, shortCode: shortCode!, en: en! });
  }
}
if (held.size !== 5050) throw new Error(`expected 5050 subdivisions, read ${held.size}`);
const countries = [...new Set([...held.values()].map((one) => one.country))].sort();

// CLDR names a subdivision by its code lowercased with the hyphen taken out.
const byCldrType = new Map<string, string>();
for (const code of held.keys()) {
  const type = code.replace("-", "").toLowerCase();
  if (byCldrType.has(type)) throw new Error(`two codes make the CLDR type ${type}`);
  byCldrType.set(type, code);
}

const decode = (text: string): string =>
  text.replace(/&(quot|apos|lt|gt|amp|#\d+|#x[0-9a-fA-F]+);/g, (_, entity: string) => {
    if (entity === "quot") return '"';
    if (entity === "apos") return "'";
    if (entity === "lt") return "<";
    if (entity === "gt") return ">";
    if (entity === "amp") return "&";

    return String.fromCodePoint(entity[1] === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
  });

interface Candidate {
  name: string;
  source: string;
}
const cldr = (locale: string): { names: Map<string, Candidate>; outside: number } => {
  const xml = readFileSync(join(CLDR_DIR, `subdivisions-${locale}.xml`), "utf8");
  const names = new Map<string, Candidate>();
  let outside = 0;
  for (const found of xml.matchAll(/<subdivision type="([a-z0-9]+)"([^>]*)>([^<]*)<\/subdivision>/g)) {
    const code = byCldrType.get(found[1]!);
    if (code === undefined) {
      outside += 1;
      continue;
    }
    const draft = /draft="([a-z]+)"/.exec(found[2]!)?.[1];
    names.set(code, { name: tidy(decode(found[3]!)), source: `cldr:${locale}${draft === undefined ? "" : `:${draft}`}` });
  }

  return { names, outside };
};

// Wikidata: the items for each code (without those its type marks former or historical, as build-data.ts does) and their labels.
const snapshotName = readdirSync(SOURCES).filter((file) => /^wikidata-\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort().at(-1)!;
const snapshot = JSON.parse(readFileSync(join(SOURCES, snapshotName), "utf8")) as { subdivisions: Record<string, { id: string; types?: { label: string }[] }[]> };
const itemsOf = (code: string): string[] =>
  (snapshot.subdivisions[code] ?? []).filter((item) => !(item.types ?? []).some((type) => /^(former|historical)\b/i.test(type.label))).map((item) => item.id);
const labelsName = readdirSync(SOURCES).filter((file) => /^wikidata-labels-\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort().at(-1);
const labels: Record<string, Record<string, string>> = labelsName === undefined ? {} : (JSON.parse(readFileSync(join(SOURCES, labelsName), "utf8")) as { labels: Record<string, Record<string, string>> }).labels;

interface Rejected {
  code: string;
  source: string;
  name: string;
  why: string;
}
interface Report {
  language: SubdivisionNamesLanguage;
  label: string;
  named: number;
  bySource: Map<string, number>;
  perCountry: Map<string, number>;
  rejected: Rejected[];
  ambiguous: { code: string; tag: string; names: string[] }[];
  sameAsEnglish: { code: string; name: string; source: string }[];
  disagree: { code: string; cldr: string; wikidata: string }[];
  outsideCldr: number;
  wikidataOnlyBareZh: number;
}
const reports: Report[] = [];

for (const { language, label } of LANGUAGES) {
  const { names: fromCldr, outside } = cldr(CLDR_LOCALE[language]);
  const rows = new Map<string, Candidate>();
  const report: Report = { language, label, named: 0, bySource: new Map(), perCountry: new Map(), rejected: [], ambiguous: [], sameAsEnglish: [], disagree: [], outsideCldr: outside, wikidataOnlyBareZh: 0 };
  for (const [code, one] of [...held.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    let chosen: Candidate | null = null;
    let wikidataName: Candidate | null = null;
    const candidate = fromCldr.get(code);
    if (candidate !== undefined) {
      const why = checkName(language, candidate.name);
      if (why === null) chosen = candidate;
      else report.rejected.push({ code, source: candidate.source, name: candidate.name, why });
    }
    for (const tag of WIKIDATA_TAGS[language]) {
      const found = [...new Set(itemsOf(code).map((id) => labels[id]?.[tag]).filter((text): text is string => text !== undefined).map(tidy))];
      if (found.length === 0) continue;
      if (found.length > 1) {
        report.ambiguous.push({ code, tag, names: found });
        continue;
      }
      const why = checkName(language, found[0]!);
      if (why !== null) {
        report.rejected.push({ code, source: `wikidata:${tag}`, name: found[0]!, why });
        continue;
      }
      wikidataName = { name: found[0]!, source: `wikidata:${tag}` };
      break;
    }
    if (chosen === null) chosen = wikidataName;
    else if (wikidataName !== null && key(wikidataName.name) !== key(chosen.name)) report.disagree.push({ code, cldr: chosen.name, wikidata: wikidataName.name });
    if (chosen === null) continue;
    rows.set(code, chosen);
    report.named += 1;
    report.bySource.set(chosen.source, (report.bySource.get(chosen.source) ?? 0) + 1);
    report.perCountry.set(one.country, (report.perCountry.get(one.country) ?? 0) + 1);
    if (key(chosen.name) === key(one.en)) report.sameAsEnglish.push({ code, name: chosen.name, source: chosen.source });
  }
  // Items that have only the bare zh label, which names no script and so is not used: counted for whoever decides to.
  if (language === "zh-Hans" || language === "zh-Hant") {
    for (const code of held.keys()) {
      if (rows.has(code)) continue;
      if (itemsOf(code).some((id) => labels[id]?.zh !== undefined)) report.wikidataOnlyBareZh += 1;
    }
  }
  reports.push(report);

  const sources = [...new Set([...rows.values()].map((one) => one.source))].sort();
  const lines = new Map<string, string[]>();
  for (const [code, one] of rows) {
    const { country, shortCode } = held.get(code)!;
    if (/[|\n`\\$]/.test(one.name)) throw new Error(`${language} ${code} has a character the rows cannot hold: ${one.name}`);
    lines.set(country, [...(lines.get(country) ?? []), `${shortCode}|${one.name}|${sources.indexOf(one.source)}`]);
  }
  const constant = `${language.replace("-", "_").toUpperCase()}_SUBDIVISIONS`;
  const body = countries
    .filter((country) => lines.has(country))
    .map((country) => `    ${country}: ${"`"}${lines.get(country)!.join("\n")}${"`"},`)
    .join("\n");
  mkdirSync(join(ROOT, "src/data/subdivision-names"), { recursive: true });
  writeFileSync(
    join(ROOT, "src/data/subdivision-names", `${language}.data.ts`),
    `// Generated by scripts/build-subdivision-names.ts. Do not edit by hand: change the script or its inputs and run pnpm data:subdivision-names.
// The subdivisions' names in ${label}: ${report.named} of ${held.size} have one, the rest are left out.
// Sources: Unicode CLDR 48.2.0 (Unicode-3.0), data-sources/cldr/release-48-2/subdivisions-${CLDR_LOCALE[language]}.xml${labelsName === undefined ? "" : `; Wikidata labels (CC0), data-sources/${labelsName}, read from Wikimedia's dump`}.

import type { SubdivisionNamesData } from "../../subdivision-names";

// country: a line each, shortCode|name|index into sources; "cldr:<locale>[:<draft>]" and "wikidata:<tag>" say where a name was read.
const ${constant}: SubdivisionNamesData = {
  language: "${language}",
  sources: ${JSON.stringify(sources)},
  countries: {
${body}
  },
};

export { ${constant} };
`,
  );

  // The example in the entry's own doc comment is the first of these that has a name here, so that it is true.
  const exampleCode = ["JP-13", "US-CA", "CA-ON", "DE-BY", "ES-M", "CN-BJ"].find((code) => rows.has(code)) ?? [...rows.keys()][0];
  if (exampleCode === undefined) throw new Error(`${language} has no names at all`);
  const exampleName = rows.get(exampleCode)!.name;
  mkdirSync(join(ROOT, "src/subdivision-names"), { recursive: true });
  writeFileSync(
    join(ROOT, "src/subdivision-names", `${language}.ts`),
    `// Generated by scripts/build-subdivision-names.ts. Do not edit by hand.
// The entry @johnmorrisdotca/kuni/subdivision-names/${language}: the names of the subdivisions in ${label}, from Unicode CLDR and Wikidata labels.

import { ${constant} } from "../data/subdivision-names/${language}.data";
import { createSubdivisionNames } from "../subdivision-names";
import type { NamedSubdivision, NameSource, SubdivisionNames, SubdivisionNamesLanguage, SubdivisionNamesSearchOptions } from "../subdivision-names";

/**
 * The subdivisions' names in ${label}: \`subdivisionName\`, \`subdivisionNameSource\`, \`subdivisionsByName\` and \`subdivisionByName\` (search that folds as ${label} is typed), \`subdivisionsOf\`, \`count\` and \`fold\`. ${report.named} of the ${held.size} subdivisions have a name; the rest answer \`null\`. Also the default export.
 *
 * @example
 * \`\`\`ts
 * import names from "@johnmorrisdotca/kuni/subdivision-names/${language}";
 *
 * console.log(names.language);                                 // ${JSON.stringify(language)}
 * console.log(names.subdivisionName(${JSON.stringify(exampleCode)}));              // ${JSON.stringify(exampleName)}
 * console.log(names.subdivisionNameSource(${JSON.stringify(exampleCode)})?.source); // ${JSON.stringify(rows.get(exampleCode)!.source.split(":")[0])}
 * console.log(names.subdivisionByName(${JSON.stringify(exampleName)}, { country: ${JSON.stringify(exampleCode.slice(0, 2))} }));   // ${JSON.stringify(names2(language, rows, exampleName, exampleCode))}
 * \`\`\`
 */
const names: SubdivisionNames = createSubdivisionNames(${constant});

export default names;
export { names };
export type { NamedSubdivision, NameSource, SubdivisionNames, SubdivisionNamesLanguage, SubdivisionNamesSearchOptions };
`,
  );
  console.log(`${language}: ${report.named} of ${held.size} named (${[...report.bySource].map(([source, count]) => `${source} ${count}`).join(", ")}); ${report.rejected.length} rejected, ${report.ambiguous.length} ambiguous, ${report.disagree.length} disagree`);
}

// The one code the example's name means inside its country, as subdivisionByName will say it.
function names2(_language: string, rows: Map<string, Candidate>, name: string, code: string): string | null {
  const same = [...rows].filter(([other, one]) => other.startsWith(code.slice(0, 2) + "-") && key(one.name) === key(name)).map(([other]) => other);

  return same.length === 1 ? same[0]! : null;
}

const percent = (part: number, whole: number): string => `${((100 * part) / whole).toFixed(1)}%`;
const cell = (value: string): string => value.replace(/\|/g, "\\|");
const doc: string[] = [];
doc.push(`<!-- Generated by scripts/build-subdivision-names.ts. Do not edit by hand: run pnpm data:subdivision-names. -->
# Subdivision names in more languages: coverage and review

What \`@johnmorrisdotca/kuni/subdivision-names/<language>\` holds, counted from the data files. Each of the ${held.size} subdivisions in the main entry
has a name in a language where a source gives one that passes the checks, and is left out where none does; none is translated or copied
from another language. Sources: Unicode CLDR 48.2 (Unicode-3.0)${labelsName === undefined ? "" : `, Wikidata labels (CC0) from Wikimedia's dump (\`${labelsName}\`)`}.
The design is in [design/more-languages.md](./design/more-languages.md).
${labelsName === undefined ? "\n**The Wikidata labels have not been read into this build yet:** every number below is CLDR's alone. Run `node scripts/extract-wikidata-labels.ts` and then `pnpm data:subdivision-names`.\n" : ""}
## By language

| Language | Named | Share | Left out | Sources |
| --- | ---: | ---: | ---: | --- |`);
for (const report of reports) {
  doc.push(`| ${report.label} (\`${report.language}\`) | ${report.named} | ${percent(report.named, held.size)} | ${held.size - report.named} | ${[...report.bySource].map(([source, count]) => `${source} ${count}`).join(", ")} |`);
}
doc.push(`
CLDR marks nearly every subdivision name in these languages \`provisional\`: they are CLDR's own first drafts, many imported from Wikidata, and
not yet confirmed by its Spanish, German or Chinese committees. They are the best published source and still not a reviewed one.

## By country

Subdivisions with a name in each language, out of the number the country has.

| Country | Subdivisions | ${reports.map((report) => `\`${report.language}\``).join(" | ")} |
| --- | ---: | ${reports.map(() => "---:").join(" | ")} |`);
for (const country of countries) {
  const total = [...held.values()].filter((one) => one.country === country).length;
  doc.push(`| ${country} | ${total} | ${reports.map((report) => `${report.perCountry.get(country) ?? 0}`).join(" | ")} |`);
}
doc.push(`
## For a native reader

Nothing here was changed by hand. Each list is what the build found and left to a person to judge.

### Left out by a check

A name that fails a check is not used, and the next source is tried; it is listed here so that a reader can say whether the check is wrong.
The Chinese checks are a heuristic over a list of characters that differ between the scripts (\`scripts/subdivision-names-config.ts\`), not a full
conversion table: they catch a name written in the wrong script, not every name with the wrong word.
`);
for (const report of reports) {
  doc.push(`#### ${report.label} (\`${report.language}\`): ${report.rejected.length}\n`);
  if (report.rejected.length === 0) doc.push("None.\n");
  else {
    doc.push("| Code | Source | Name | Why |\n| --- | --- | --- | --- |");
    for (const one of report.rejected.slice(0, 60)) doc.push(`| ${one.code} | ${one.source} | ${cell(one.name)} | ${one.why} |`);
    if (report.rejected.length > 60) doc.push(`\n…and ${report.rejected.length - 60} more.`);
    doc.push("");
  }
}
doc.push(`### Items with two different labels

Where a code has two current Wikidata items with different labels in a language, neither is used. Counts: ${reports.map((report) => `${report.label} ${report.ambiguous.length}`).join(", ")}.

### Where CLDR and Wikidata disagree

CLDR is preferred and Wikidata's label is not used when both exist; the number of codes where the two differ, after ignoring case, accents and punctuation:
${reports.map((report) => `${report.label} ${report.disagree.length}`).join(", ")}.
`);
for (const report of reports) {
  if (report.disagree.length === 0) continue;
  doc.push(`#### ${report.label}: the first 25\n\n| Code | CLDR (used) | Wikidata |\n| --- | --- | --- |`);
  for (const one of report.disagree.slice(0, 25)) doc.push(`| ${one.code} | ${cell(one.cldr)} | ${cell(one.wikidata)} |`);
  doc.push("");
}
doc.push(`### Names the same as the English name

Spanish and German share many names with English (Paris, Texas), so this is a list to look at and not a list of mistakes. Counts: ${reports
  .filter((report) => report.language === "es" || report.language === "de")
  .map((report) => `${report.label} ${report.sameAsEnglish.length} of ${report.named}`)
  .join(", ")}. In the Chinese entries a name with no Chinese character is always left out, so none is the English name.
`);
for (const report of reports.filter((one) => one.language === "es" || one.language === "de")) {
  const bySource = new Map<string, number>();
  for (const one of report.sameAsEnglish) bySource.set(one.source, (bySource.get(one.source) ?? 0) + 1);
  doc.push(`- ${report.label}, by source: ${[...bySource].map(([source, count]) => `${source} ${count}`).join(", ")}.`);
}
doc.push(`
### Chinese labels with no script

${reports
  .filter((report) => report.language === "zh-Hans" || report.language === "zh-Hant")
  .map((report) => `${report.label}: ${report.wikidataOnlyBareZh} subdivisions have only a Wikidata label tagged plain \`zh\``)
  .join("; ")}. Plain \`zh\` does not say which script it is written in, and Simplified and Traditional use different words for many places even where the characters match, so it is not used. Taking it would raise coverage; it is a decision for a reader of Chinese.

### CLDR entries outside the main entry's subdivisions

${reports.map((report) => `${report.label} ${report.outsideCldr}`).join(", ")} CLDR names are for codes the main entry does not hold (CLDR lists some regions and withdrawn codes), and are not used.
`);
writeFileSync(join(ROOT, "docs", "subdivision-names.md"), `${doc.join("\n")}\n`);
console.log(`docs/subdivision-names.md written${existsSync(join(SOURCES, labelsName ?? "none")) ? ` (with ${labelsName})` : " (CLDR only: no Wikidata labels yet)"}`);
