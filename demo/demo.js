// The demo page's own script. The page is a set of views, each a tab with its own address (#/country/JP,
// #/quiz/capital/12345), every one answering from the package's own built files as a page that installed it would.
// "Look up" is four panels: "Find a country" uses the main entry (./dist/index.js); "Subdivisions of a country" loads
// one country at a time with ./dist/load.js; "Look up a code" uses ./dist/subdivisions.js; "Search by code" filters
// the countries. The other views are in views/, each loaded when it is first opened. The page's words are set as
// text, never as HTML.
import { continentName, countries, country, countryByName } from "./dist/index.js";
import { loadSubdivisions } from "./dist/load.js";
import { subdivision, subdivisions, subdivisionTypeLabel } from "./dist/subdivisions.js";
import { $, say, setLanguage } from "./shared.js";
import { search, setUp as setUpSearch } from "./views/search.js";
import { WORDS } from "./words.js";

const language = familyLanguage({ id: "kuni", words: WORDS, onChange: () => render() });
setLanguage(language);

const ja = () => language.lang === "ja";
const quote = (text) => JSON.stringify(text);

// A definition list: [[label, value], ...] written as text.
function facts(target, pairs) {
  const list = document.createElement("dl");
  list.className = "facts";
  for (const [label, value] of pairs) {
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value;
    if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(value)) detail.lang = "ja";
    list.append(term, detail);
  }
  target.replaceChildren(list);
}

function note(target, text) {
  const line = document.createElement("p");
  line.className = "note fam-muted";
  line.textContent = text;
  target.replaceChildren(line);
}

// The word for a kind of place in the page's language: "prefecture" in English, 県 in Japanese (the English
// word where the Japanese names of that kind do not agree on one).
function kindOf(code) {
  const english = subdivisionTypeLabel(code, "en");
  if (english === null) return null;
  if (!ja()) return english;
  const word = subdivisionTypeLabel(code, "ja");

  return word ?? english;
}

// ----- Find a country ---------------------------------------------------------------------------------

function find() {
  const text = $("find-input").value;
  const out = $("find-answer");
  const found = countryByName(text);
  $("find-call").textContent = `countryByName(${quote(text)})  // ${found === null ? "null" : found.alpha2}`;
  if (found === null) {
    note(out, say("find_none"));
    return;
  }
  const pairs = [
    [say("find_codes"), `${found.flag} ${found.alpha2} · ${found.alpha3} · ${found.numeric}`],
    [say("find_name_en"), found.name.en],
    [say("find_name_ja"), found.name.ja],
  ];
  if (found.reading !== undefined) pairs.push([say("find_reading"), found.reading]);
  const short = found.shortName?.[language.lang];
  if (short !== undefined) pairs.push([say("find_short"), short]);
  if (found.name.local !== undefined) pairs.push([say("find_local"), found.name.local]);
  pairs.push([say("find_continent"), continentName(found.continent, language.lang)]);
  if (found.capital !== undefined) pairs.push([say("find_capital"), ja() ? `${found.capital.ja}（${found.capital.en}）` : `${found.capital.en} (${found.capital.ja})`]);
  if (found.callingCode !== undefined) pairs.push([say("find_calling"), found.callingCode]);
  if (found.currency !== undefined) pairs.push([say("find_currency"), found.currency.join(", ")]);
  if (found.tld !== undefined) pairs.push([say("find_tld"), `.${found.tld}`]);
  if (found.zones !== undefined) pairs.push([say("find_zones"), found.zones.length > 3 ? `${found.zones.slice(0, 3).join(", ")} … (${found.zones.length})` : found.zones.join(", ")]);
  const count = subdivisions(found.alpha2)?.length ?? 0;
  if (count > 0) pairs.push([say("find_divisions"), kindOf(found.alpha2) === null ? String(count) : (ja() ? `${count}（${kindOf(found.alpha2)}）` : `${count} (${kindOf(found.alpha2)})`)]);
  facts(out, pairs);
  const more = document.createElement("a");
  more.href = `#/country/${found.alpha2}`;
  more.className = "more-link";
  more.dataset.testid = "find-more";
  more.textContent = say("find_more", { name: found.name[language.lang] });
  out.append(more);
}

// ----- Subdivisions of a country ----------------------------------------------------------------------

let level = "1";
let listed = 0;

// The countries in the page's language's order, the one chosen kept chosen.
function fillCountries() {
  const select = $("list-country");
  const chosen = select.value || "JP";
  select.replaceChildren(
    ...countries({ order: language.lang }).map((one) => {
      const option = document.createElement("option");
      option.value = one.alpha2;
      option.textContent = `${one.flag} ${one.name[language.lang]} (${one.alpha2})`;
      return option;
    }),
  );
  select.value = chosen;
}

async function list() {
  const ask = (listed += 1);
  const code = $("list-country").value;
  const loaded = await loadSubdivisions(code);
  // A later choice has been made while this one loaded: that one draws.
  if (ask !== listed) return;
  const shown = (loaded ?? []).filter((one) => level === "all" || one.level === 1);
  $("list-call").textContent = `await loadSubdivisions(${quote(code)})  // ${loaded === null ? "null" : `${loaded.length} subdivisions`}`;
  const body = $("list-rows");
  body.replaceChildren(
    ...shown.map((one) => {
      const row = document.createElement("tr");
      const ja = one.name.ja;
      for (const [text, missing] of [[one.code, false], [one.name.en, false], [ja ?? say("missing"), ja === null]]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        if (missing) cell.className = "missing";
        row.append(cell);
      }
      row.lastChild.lang = "ja";
      return row;
    }),
  );
  const gaps = shown.filter((one) => one.name.ja === null).length;
  const kind = kindOf(code);
  const lines = shown.length === 0 ? [say("list_none")] : [say(kind === null ? "list_count_plain" : "list_count", { count: shown.length, type: kind }), gaps === 0 ? say("list_full") : say("list_gaps", { gaps })];
  $("list-summary").textContent = lines.join(ja() ? "" : " ");
  $("list-summary").dataset.gaps = String(gaps);
  $("list-box").scrollTop = 0;
}

function pressLevel() {
  $("list-level").querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.level === level)));
}

// ----- Look up a code ---------------------------------------------------------------------------------

function code() {
  const text = $("code-input").value;
  const out = $("code-answer");
  const place = subdivision(text);
  if (place !== null) {
    $("code-call").textContent = `subdivision(${quote(text)})  // ${place.code}`;
    const home = country(place.country);
    const pairs = [
      [say("code_code"), `${place.code} · ${place.shortCode}`],
      [say("code_country"), `${home.flag} ${home.name[language.lang]}`],
      [say("code_name_en"), place.name.en],
      [say("code_name_ja"), place.name.ja ?? say("missing")],
    ];
    if (place.reading !== undefined) pairs.push([say("code_reading"), place.reading]);
    const kind = kindOf(place.code);
    if (kind !== null) pairs.push([say("code_kind"), kind]);
    pairs.push([say("code_level"), String(place.level)]);
    if (place.parent !== undefined) {
      const parent = subdivision(place.parent);
      pairs.push([say("code_parent"), `${parent.code} ${ja() && parent.name.ja !== null ? parent.name.ja : parent.name.en}`]);
    }
    facts(out, pairs);
    return;
  }
  const nation = country(text);
  $("code-call").textContent = `subdivision(${quote(text)}) ?? country(${quote(text)})  // ${nation === null ? "null" : nation.alpha2}`;
  if (nation === null) {
    note(out, say("code_none"));
    return;
  }
  facts(out, [
    [say("code_code"), `${nation.alpha2} · ${nation.alpha3} · ${nation.numeric}`],
    [say("code_country"), `${nation.flag} ${nation.name[language.lang]}`],
    [say("code_name_en"), nation.name.en],
    [say("code_name_ja"), nation.name.ja],
  ]);
}

// ----- The page ---------------------------------------------------------------------------------------

const PANELS = {
  find: { run: find, input: "find-input", examples: ["Germany", "ドイツ", "にほん", "Holland", "UK", "米国", "cote d'ivoire", "JP"] },
  list: { run: list, input: "list-country", examples: ["JP", "US", "CA", "FR", "GB", "SI"] },
  code: { run: code, input: "code-input", examples: ["JP-13", "CA-ON", "US-NY", "FR-75C", "GB-ENG", "jp"] },
};

// ----- The views -------------------------------------------------------------------------------------------------

// Each view but "Look up" is a module of its own, loaded when it is first opened; its render() draws it, given what
// the address says after its name (#/country/JP gives "JP").
const VIEWS = {
  lookup: null,
  country: () => import("./views/country.js"),
  compare: () => import("./views/compare.js"),
  table: () => import("./views/table.js"),
  groupings: () => import("./views/groupings.js"),
  quiz: () => import("./views/quiz.js"),
  form: () => import("./views/form.js"),
  quality: () => import("./views/quality.js"),
};
let showing = "";

async function route() {
  const [, name = "lookup", ...rest] = (location.hash.replace(/^#\/?/, "/") || "/").split("/");
  const view = name in VIEWS ? name : "lookup";
  const asked = rest.length === 0 ? undefined : decodeURIComponent(rest.join("/"));
  for (const section of document.querySelectorAll("[data-view]")) section.hidden = section.dataset.view !== view;
  for (const link of document.querySelectorAll("[data-view-link]")) {
    if (link.dataset.viewLink === view) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  if (showing === "country" && view !== "country") (await VIEWS.country()).stopClock();
  if (view !== showing) {
    const panel = document.querySelector(`[data-view="${view}"]`);
    if (showing !== "") panel.scrollIntoView({ block: "nearest" });
  }
  showing = view;
  const main = document.querySelector("main");
  main.dataset.showing = view;
  if (VIEWS[view] !== null) {
    main.dataset.viewReady = "false";
    await (await VIEWS[view]()).render(asked);
  }
  main.dataset.viewReady = "true";
}

function fillExamples() {
  for (const [name, panel] of Object.entries(PANELS)) {
    $(`${name}-examples`).replaceChildren(
      ...panel.examples.map((example) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = example;
        button.dataset.value = example;
        button.addEventListener("click", () => {
          $(panel.input).value = example;
          panel.run();
          press();
        });
        return button;
      }),
    );
  }
}

// The example that is on show is the one pressed.
function press() {
  for (const [name, panel] of Object.entries(PANELS)) {
    const now = $(panel.input).value;
    $(`${name}-examples`).querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.value === now)));
  }
}

async function render() {
  language.say();
  fillCountries();
  find();
  code();
  search();
  pressLevel();
  press();
  await list();
  if (showing !== "" && showing !== "lookup") await route();
}

$("find-input").addEventListener("input", () => {
  find();
  press();
});
$("code-input").addEventListener("input", () => {
  code();
  press();
});
$("list-country").addEventListener("change", () => {
  press();
  list();
});
$("list-level").querySelectorAll("button").forEach((button) =>
  button.addEventListener("click", () => {
    level = button.dataset.level;
    pressLevel();
    list();
  }),
);

fillExamples();
setUpSearch();
window.addEventListener("hashchange", () => route());
await render();
await route();
document.querySelector("main").dataset.ready = "true";
