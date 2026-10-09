// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's shared header
// and footer, with the family's stylesheet, Kuni's own, the page's script and the compiled package (its ESM
// files only) beside it.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

import { API_CSS, apiPage } from "./api.mjs";
import { FAMILY, FAMILY_PITCH, FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "kuni";

// Kuni is not in the family's list yet: that list is changed in every repository at once, with a new
// template version, and family-template.mjs is never edited in one. Until that sweep adds it, the demo
// joins the list here, at its end, so the shared header and footer can name it. Once the template lists
// Kuni this does nothing.
if (!FAMILY.some((one) => one.id === id)) {
  FAMILY.push({ id, name: "Kuni", kana: "国" });
  FAMILY_PITCH[id] = "every country and its subdivisions, with ISO 3166 codes and names in English and Japanese";
}

const ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3Ccircle cx='50' cy='50' r='28' fill='none' stroke='%23f3efe4' stroke-width='5'/%3E%3Cpath d='M22 50h56M50 22c-10 9-14 18-14 28s4 19 14 28c10-9 14-18 14-28s-4-19-14-28z' fill='none' stroke='%23f3efe4' stroke-width='5'/%3E%3C/svg%3E";

const uses = [
  `import { country, countryByName } from "@johnmorrisdotca/kuni";`,
  `countryByName("ドイツ")?.alpha2  // "DE"; also "Germany", "どいつ", "Deutschland"`,
  `countryByName("Holland")?.name.ja  // "オランダ"`,
  `country("JP")?.callingCode  // "+81"`,
  `import prefectures from "@johnmorrisdotca/kuni/subdivisions/jp";  // 47, under 3 KB`,
  `subdivisionByName("オンタリオ州", { country: "CA" })?.code  // "CA-ON"`,
  `subdivisionTypeLabel("JP-13", "ja")  // "都"`,
  `await loadSubdivisions("CA")  // 13, loaded when asked`,
];
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** An option row: a label and the field, with the help line the Help switch shows in either language. */
const row = (help, content) => `<div class="fam-row" data-help-en="${escape(help[0])}" data-help-ja="${escape(help[1])}">${content}</div>`;
const field = (name, key, value) =>
  `<label class="fam-label" for="${name}" data-say="${key}"></label><input id="${name}" class="fam-field" data-testid="${name}" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" value="${escape(value)}" />`;
const examples = (name, help) => `<div class="fam-seg" role="group" data-say-label="examples" id="${name}-examples" data-testid="${name}-examples" data-help-en="${escape(help[0])}" data-help-ja="${escape(help[1])}"></div>`;

/** A lookup's panel: its title and import, what it does, the field, the examples, the answer and the call. */
const panel = ({ name, entry, fields, help, exampleHelp, answer }) => `<section class="fam-panels lookup" id="${name}" aria-labelledby="${name}-title" data-testid="${name}-panel">
        <div class="fam-panel">
          <h2 id="${name}-title"><span data-say="${name}_title"></span> <code>${entry}</code></h2>
          <p class="blurb" data-say="${name}_blurb"></p>
          ${row(help, fields)}
          ${examples(name, exampleHelp)}
          ${answer ?? `<div class="answer" id="${name}-answer" data-testid="${name}-answer" aria-live="polite"></div>`}
          <pre class="call" id="${name}-call" data-testid="${name}-call" aria-label="the call"></pre>
        </div>
      </section>`;

const panels = [
  panel({
    name: "find",
    entry: "@johnmorrisdotca/kuni",
    fields: field("find-input", "input", "ドイツ"),
    help: ["Type a country's name, in English or Japanese, or a code. Its codes, names, flag and the rest are shown.", "英語か日本語の国名、またはコードを入力します。コード、名前、国旗などが表示されます。"],
    exampleHelp: ["Fill the box with an example: names in either language, in kana, another name for a country, a code.", "入力欄に例を入れます：英語や日本語の国名、かな書きの国名、別名、コード。"],
  }),
  panel({
    name: "list",
    entry: "/load",
    fields: `<label class="fam-label" for="list-country" data-say="list_country"></label><select id="list-country" class="fam-field" data-testid="list-country"></select>
          <div class="fam-seg" role="group" id="list-level" data-testid="list-level" data-say-label="list_level"><button type="button" data-level="1" data-say="level_1"></button><button type="button" data-level="all" data-say="level_all"></button></div>`,
    help: ["Pick a country, and whether to see its first level only or every level below it too.", "国を選び、第一級だけを見るか、その下の階層まで見るかを選びます。"],
    exampleHelp: ["Pick an example country: Japan, the United States, Canada, France, the United Kingdom, Slovenia.", "例の国を選びます：日本、アメリカ、カナダ、フランス、イギリス、スロベニア。"],
    answer: `<div class="list-box" id="list-box" data-testid="list-box" tabindex="0" aria-labelledby="list-title">
            <table><thead><tr><th scope="col" data-say="col_code"></th><th scope="col" data-say="col_en"></th><th scope="col" data-say="col_ja"></th></tr></thead><tbody id="list-rows" data-testid="list-rows"></tbody></table>
          </div>
          <p class="summary" id="list-summary" data-testid="list-summary" aria-live="polite"></p>`,
  }),
  panel({
    name: "code",
    entry: "/subdivisions",
    fields: field("code-input", "input", "JP-13"),
    help: ["Type an ISO 3166-2 code such as JP-13, or a country's code. Its names, kind, level and the region it is inside are shown.", "JP-13 のような ISO 3166-2 のコード、または国のコードを入力します。名前、種類、階層、上位の区画が表示されます。"],
    exampleHelp: ["Fill the box with an example: a prefecture, a province, a state, a French department, a country of the United Kingdom, a country's code.", "入力欄に例を入れます：都道府県、州、フランスの県、イギリスの構成国、国のコード。"],
  }),
];

const page = `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({
      id,
      title: "Kuni · every country and its subdivisions, in English and Japanese",
      description: "Look up any country and its states, provinces and prefectures by ISO 3166 code or by name, in English or Japanese, in your browser. A typed, zero-dependency dataset from Unicode CLDR and Wikidata. Free and open source.",
      ogTitle: "Kuni: countries and their subdivisions in English and Japanese",
      ogDescription: "Every country and its 5,046 ISO 3166-2 subdivisions, with names in English and Japanese, looked up by code or by what somebody typed. No dependencies.",
    })}
    <link rel="icon" href="${ICON}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="kuni.css" />
  </head>
  <body>
    <main>
      ${familyHeader({ id, links: [{ href: "api.html", say: "pageApi" }] })}
      <div class="lookups">
      ${panels.join("\n      ")}
      </div>
      ${familyUnreviewed({ id })}
      <section class="more" aria-labelledby="more-title">
        <h2 id="more-title" data-say="moreTitle"></h2>
        <p data-say="moreText"></p>
        <ul class="uses">
          ${uses.map((line) => `<li><code>${escape(line)}</code></li>`).join("\n          ")}
        </ul>
      </section>
      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script type="module" src="demo.js"></script>
  </body>
</html>
`;

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
// The page imports the ESM build only; the CommonJS files and the type declarations are left out.
cpSync("dist", "site/dist", { recursive: true, filter: (source) => !/\.(cjs|d\.ts|d\.cts)$/.test(source) });
writeFileSync("site/index.html", page);
// The API reference, made from the source: every export of every entry point.
writeFileSync("site/api.css", API_CSS);
writeFileSync("site/api.html", apiPage({ id, name: "Kuni", icon: ICON }));
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
