// Two countries side by side: their outlines (each drawn to fill its own box, so not to one scale), and a row for
// each fact, with how many times bigger the one is than the other and the distance between their capitals.
import { countries, country } from "../dist/index.js";
import { distanceKm, facts } from "../dist/facts.js";
import { $, countryRow, countrySelect, downloads, el, flagged, helpRow, lang, number, outline, ROW_COLUMNS, say } from "../shared.js";

let pair = ["JP", "GB"];
let drawn = 0;

const ratio = (a, b) => (a === null || b === null || a === 0 || b === 0 ? "" : a >= b ? say("times", { value: number(a / b, 1) }) : say("times", { value: number(b / a, 1) }));

export async function render(asked) {
  if (asked !== undefined) {
    const [a, b] = asked.split("/").map((one) => country(one ?? "")?.alpha2);
    if (a !== undefined) pair = [a, b ?? pair[1]];
  }
  const [a, b] = pair;
  const turn = (drawn += 1);
  const go = (left, right) => (location.hash = `#/compare/${left}/${right}`);
  const root = $("view-compare");
  const one = [country(a), country(b)];
  const fact = [facts(a), facts(b)];
  const cell = (value) => el("td", { class: "num" }, value);
  const line = (label, values, extra = "") => el("tr", {}, el("th", { scope: "row" }, label), cell(values[0]), cell(values[1]), el("td", { class: "fam-muted" }, extra));
  const density = fact.map((f) => (f.population !== null && f.areaKm2 ? f.population / f.areaKm2 : null));
  const capitals = fact[0].capitalPoint !== null && fact[1].capitalPoint !== null ? distanceKm(fact[0].capitalPoint, fact[1].capitalPoint) : null;
  const pictures = [0, 1].map((side) => el("figure", { class: "outline-box small", "data-testid": `compare-outline-${side}` }, el("figcaption", {}, flagged(pair[side])), el("p", { class: "fam-muted" }, say("outline_loading"))));

  root.replaceChildren(
    helpRow(
      "compare",
      el("label", { class: "fam-label", for: "compare-a" }, say("compare_a")),
      countrySelect("compare-a", a, (value) => go(value, pair[1]), { countries }),
      el("label", { class: "fam-label", for: "compare-b" }, say("compare_b")),
      countrySelect("compare-b", b, (value) => go(pair[0], value), { countries }),
      el("button", { type: "button", class: "fam-button", "data-testid": "compare-swap", onclick: () => go(pair[1], pair[0]) }, say("swap")),
    ),
    el("div", { class: "compare-pictures" }, pictures),
    el("p", { class: "fam-fine" }, say("compare_scale")),
    el(
      "div",
      { class: "fam-table-box" },
      el(
        "table",
        { "data-testid": "compare-table" },
        el("thead", {}, el("tr", {}, el("th", { scope: "col" }, ""), el("th", { scope: "col" }, flagged(a)), el("th", { scope: "col" }, flagged(b)), el("th", { scope: "col" }, say("compare_diff")))),
        el(
          "tbody",
          {},
          line(say("find_capital"), one.map((c) => c.capital?.[lang()] ?? "–"), capitals === null ? "" : say("km_apart", { value: number(capitals) })),
          line(say("fact_population"), fact.map((f) => number(f.population)), ratio(fact[0].population, fact[1].population)),
          line(say("fact_area"), fact.map((f) => `${number(f.areaKm2)} km²`), ratio(fact[0].areaKm2, fact[1].areaKm2)),
          line(say("fact_density"), density.map((d) => (d === null ? "–" : number(d, 1))), ratio(density[0], density[1])),
          line(say("fact_borders"), fact.map((f) => String(f.borders.length)), fact[0].borders.includes(b) ? say("neighbours_yes") : ""),
          line(say("fact_driving"), fact.map((f) => (f.drivingSide === null ? "–" : say(`drives_${f.drivingSide}`))), fact[0].drivingSide === fact[1].drivingSide ? say("same") : say("differ")),
          line(say("find_calling"), one.map((c) => c.callingCode ?? "–")),
          line(say("find_currency"), one.map((c) => c.currency?.join(", ") ?? "–"), one[0].currency?.some((money) => one[1].currency?.includes(money)) ? say("same") : ""),
          line(say("fact_week"), fact.map((f) => say(`day_${f.weekStart}`))),
          line(say("fact_units"), fact.map((f) => `${say(`measure_${f.measurement}`)} · ${f.paper}`)),
          line(say("zones_short"), one.map((c) => String(c.zones?.length ?? 0))),
        ),
      ),
    ),
    downloads(() => `kuni-${a.toLowerCase()}-${b.toLowerCase()}`, () => one.map((c) => countryRow(c, facts)), () => ROW_COLUMNS, "compare-downloads"),
  );
  for (const side of [0, 1]) {
    const svg = await outline(pair[side], say("outline_of", { name: one[side].name[lang()] }), fact[side].capitalPoint ?? undefined);
    if (turn !== drawn) return;
    pictures[side].lastChild.replaceWith(svg ?? el("p", { class: "fam-muted" }, say("outline_none")));
  }
}
