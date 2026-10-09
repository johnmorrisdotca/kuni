// Every country in one table: filtered by what is typed (a name in either language, a code, a capital), by continent
// and by grouping, sorted by any column, and downloaded as CSV, JSON or text, just the rows on show.
import { CONTINENTS, continentName, countries, fold } from "../dist/index.js";
import { facts } from "../dist/facts.js";
import { groupings, membersOf } from "../dist/groupings.js";
import { $, countryRow, downloads, el, flagged, helpRow, lang, number, ROW_COLUMNS, say } from "../shared.js";

const state = { text: "", continent: "", grouping: "", sort: "name", down: false };

const COLUMNS = [
  { key: "name", word: "col_country", value: (row) => fold(lang() === "ja" ? (row.reading ?? row.name_ja) : row.name_en) },
  { key: "alpha2", word: "col_code", value: (row) => row.alpha2 },
  { key: "capital", word: "find_capital", value: (row) => fold(row[`capital_${lang()}`] ?? "") },
  { key: "continent", word: "find_continent", value: (row) => row.continent },
  { key: "population", word: "fact_population", value: (row) => row.population, number: true },
  { key: "area_km2", word: "col_area", value: (row) => row.area_km2, number: true },
  { key: "density", word: "fact_density", value: (row) => row.density, number: true },
  { key: "calling_code", word: "find_calling", value: (row) => row.calling_code ?? "" },
  { key: "currency", word: "find_currency", value: (row) => row.currency?.join(" ") ?? "" },
  { key: "driving_side", word: "fact_driving", value: (row) => row.driving_side ?? "" },
];

let rows = null;
const allRows = () => (rows ??= countries().map((one) => countryRow(one, facts)));

// The rows the filters keep, in the order asked for; an absent number sorts last either way.
function shown() {
  const text = fold(state.text);
  const members = state.grouping === "" ? null : new Set(membersOf(state.grouping) ?? []);
  const column = COLUMNS.find((one) => one.key === state.sort);
  const kept = allRows().filter(
    (row) =>
      (state.continent === "" || row.continent === state.continent) &&
      (members === null || members.has(row.alpha2)) &&
      (text === "" || [row.name_en, row.name_ja, row.reading, row.alpha2, row.alpha3, row.capital_en, row.capital_ja].some((name) => name !== null && fold(name).includes(text))),
  );

  return kept.sort((a, b) => {
    const [x, y] = [column.value(a), column.value(b)];
    if (x === null || x === "") return 1;
    if (y === null || y === "") return -1;
    const order = column.number ? x - y : x < y ? -1 : x > y ? 1 : 0;

    return state.down ? -order : order;
  });
}

function draw() {
  const list = shown();
  const body = $("table-rows");
  body.replaceChildren(
    ...list.map((row) =>
      el(
        "tr",
        {},
        el("td", {}, flagged(row.alpha2, { link: true })),
        el("td", { class: "mono" }, row.alpha2),
        el("td", {}, row[`capital_${lang()}`] ?? "–"),
        el("td", {}, continentName(row.continent, lang())),
        el("td", { class: "num" }, number(row.population)),
        el("td", { class: "num" }, number(row.area_km2)),
        el("td", { class: "num" }, row.density === null ? "–" : number(row.density, 1)),
        el("td", { class: "num" }, row.calling_code ?? "–"),
        el("td", {}, row.currency?.join(" ") ?? "–"),
        el("td", {}, row.driving_side === null ? "–" : say(`drives_${row.driving_side}_short`)),
      ),
    ),
  );
  $("table-count").textContent = say("table_count", { count: list.length });
  for (const button of document.querySelectorAll("#table thead button")) {
    const on = button.dataset.sort === state.sort;
    button.closest("th").setAttribute("aria-sort", on ? (state.down ? "descending" : "ascending") : "none");
    button.dataset.arrow = on ? (state.down ? "▼" : "▲") : "";
  }
}

export function render() {
  const root = $("view-table");
  const text = el("input", { id: "table-filter", class: "fam-field", type: "search", "data-testid": "table-filter", value: state.text, autocomplete: "off", spellcheck: "false", oninput: () => ((state.text = text.value), draw()) });
  const continent = el("select", { id: "table-continent", class: "fam-field", "data-testid": "table-continent", onchange: () => ((state.continent = continent.value), draw()) }, el("option", { value: "" }, say("all_continents")), CONTINENTS.map((one) => el("option", { value: one }, continentName(one, lang()))));
  continent.value = state.continent;
  const kinds = ["membership", "informal", "m49"];
  const grouping = el(
    "select",
    { id: "table-grouping", class: "fam-field", "data-testid": "table-grouping", onchange: () => ((state.grouping = grouping.value), draw()) },
    el("option", { value: "" }, say("all_groupings")),
    kinds.map((kind) => el("optgroup", { label: say(`kind_${kind}`) }, groupings({ kind }).map((one) => el("option", { value: one.id }, one.name[lang()])))),
  );
  grouping.value = state.grouping;
  root.replaceChildren(
    helpRow("table_filter", el("label", { class: "fam-label", for: "table-filter" }, say("filter")), text),
    helpRow("table_narrow", el("label", { class: "fam-label", for: "table-continent" }, say("find_continent")), continent, el("label", { class: "fam-label", for: "table-grouping" }, say("grouping")), grouping),
    el("p", { class: "summary", id: "table-count", "data-testid": "table-count", "aria-live": "polite" }),
    el(
      "div",
      { class: "fam-table-box table-box", tabindex: "0", "aria-labelledby": "view-table-title" },
      el(
        "table",
        { id: "table", "data-testid": "table" },
        el(
          "thead",
          {},
          el(
            "tr",
            {},
            COLUMNS.map((column) =>
              el(
                "th",
                { scope: "col", "data-number": column.number ? "true" : undefined },
                el("button", { type: "button", class: "sort", "data-sort": column.key, onclick: () => ((state.down = state.sort === column.key ? !state.down : Boolean(column.number)), (state.sort = column.key), draw()) }, say(column.word)),
              ),
            ),
          ),
        ),
        el("tbody", { id: "table-rows", "data-testid": "table-rows" }),
      ),
    ),
    downloads("kuni-countries", shown, () => ROW_COLUMNS, "table-downloads", "countries"),
  );
  draw();
}
