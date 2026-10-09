// Two countries side by side: their outlines (each drawn to fill its own box, so not to one scale), and a row for
// each fact, with how many times bigger the one is than the other and the distance between their capitals.
import { countries, country } from "../dist/index.js";
import { distanceKm, facts } from "../dist/facts.js";
import { WORDS } from "../words.js";
import { $, countryRow, countrySelect, downloads, el, flagged, helpRow, lang, number, outline, ROW_COLUMNS, say } from "../shared.js";

let pair = ["JP", "GB"];
let drawn = 0;

// The family's green and its red, so the two outlines differ at first. A choice other than these is kept in the
// address (#/compare/JP/GB?colours=2f5d4a,b5452c&capitals=off), so a shared link shows the same two colours.
const DEFAULT_COLOURS = ["#2f5d4a", "#b5452c"];
let colours = [...DEFAULT_COLOURS];
let showCapitals = true;

const HEX = /^[0-9a-f]{6}$/i;

/** The address's part after the countries, read: two colours (six hex digits each, no #) and whether capitals are on. */
function readLook(query) {
  const params = new URLSearchParams(query);
  const asked = (params.get("colours") ?? "").split(",");
  colours = DEFAULT_COLOURS.map((fallback, side) => (HEX.test(asked[side] ?? "") ? `#${asked[side].toLowerCase()}` : fallback));
  showCapitals = params.get("capitals") !== "off";
}

/** What the address says about the look: nothing while it is the default. */
function lookQuery() {
  const parts = [];
  if (colours.some((colour, side) => colour !== DEFAULT_COLOURS[side])) parts.push(`colours=${colours.map((colour) => colour.slice(1)).join(",")}`);
  if (!showCapitals) parts.push("capitals=off");

  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}

/** A colour darkened by a third, for an outline's line. */
const darker = (hex) => `#${[1, 3, 5].map((at) => Math.round(parseInt(hex.slice(at, at + 2), 16) * 0.66).toString(16).padStart(2, "0")).join("")}`;

/** White or near-black, whichever the colour shows up against: the capital's dot. */
const contrast = (hex) => {
  const [red, green, blue] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));

  return red * 0.299 + green * 0.587 + blue * 0.114 > 150 ? "#111111" : "#ffffff";
};

/** Give an outline box its colours: custom properties the stylesheet reads. */
function colour(box, hex) {
  box.style.setProperty("--outline-fill", hex);
  box.style.setProperty("--outline-line", darker(hex));
  box.style.setProperty("--outline-dot", contrast(hex));
  box.style.setProperty("--outline-dot-line", contrast(contrast(hex)));
}

const ratio = (a, b) => (a === null || b === null || a === 0 || b === 0 ? "" : a >= b ? say("times", { value: number(a / b, 1) }) : say("times", { value: number(b / a, 1) }));

export async function render(asked) {
  if (asked !== undefined) {
    const [path, query = ""] = asked.split("?");
    const [a, b] = path.split("/").map((one) => country(one ?? "")?.alpha2);
    if (a !== undefined) pair = [a, b ?? pair[1]];
    readLook(query);
  }
  const [a, b] = pair;
  const go = (left, right, swapped = false) => {
    if (swapped) colours = [colours[1], colours[0]];
    location.hash = `#/compare/${left}/${right}${lookQuery()}`;
  };
  /** Write the look into the address without a new page in the history or a redraw. */
  const remember = () => history.replaceState(history.state, "", `${location.pathname}${location.search}#/compare/${pair[0]}/${pair[1]}${lookQuery()}`);
  const root = $("view-compare");
  const one = [country(a), country(b)];
  const fact = [facts(a), facts(b)];
  const cell = (value) => el("td", { class: "num" }, value);
  const line = (label, values, extra = "") => el("tr", {}, el("th", { scope: "row" }, label), cell(values[0]), cell(values[1]), el("td", { class: "fam-muted" }, extra));
  const density = fact.map((f) => (f.population !== null && f.areaKm2 ? f.population / f.areaKm2 : null));
  const capitals = fact[0].capitalPoint !== null && fact[1].capitalPoint !== null ? distanceKm(fact[0].capitalPoint, fact[1].capitalPoint) : null;
  const pictures = [0, 1].map((side) => el("figure", { class: "outline-box small", "data-testid": `compare-outline-${side}` }, el("figcaption", {}, flagged(pair[side])), el("p", { class: "fam-muted" }, say("outline_loading"))));
  pictures.forEach((box, side) => colour(box, colours[side]));
  /** Draw (or draw again) the two outlines, with or without the capitals' dots. */
  const paint = async () => {
    const mine = (drawn += 1);
    for (const side of [0, 1]) {
      const svg = await outline(pair[side], say("outline_of", { name: one[side].name[lang()] }), showCapitals ? (fact[side].capitalPoint ?? undefined) : undefined);
      if (mine !== drawn) return;
      pictures[side].lastChild.replaceWith(svg ?? el("p", { class: "fam-muted" }, say("outline_none")));
    }
  };
  const picker = (side) =>
    el("input", {
      type: "color",
      id: `compare-colour-${side}`,
      class: "fam-colour",
      value: colours[side],
      "data-testid": `compare-colour-${side}`,
      oninput: (event) => {
        colours[side] = event.target.value.toLowerCase();
        colour(pictures[side], colours[side]);
        remember();
      },
    });
  const toggle = el(
    "button",
    {
      type: "button",
      class: "fam-button",
      "aria-pressed": String(showCapitals),
      "data-testid": "compare-capitals",
      "data-tip-en": WORDS.en.compare_capitals_tip,
      "data-tip-ja": WORDS.ja.compare_capitals_tip,
      onclick: (event) => {
        showCapitals = !showCapitals;
        event.currentTarget.setAttribute("aria-pressed", String(showCapitals));
        remember();
        paint();
      },
    },
    say("compare_capitals"),
  );

  root.replaceChildren(
    helpRow(
      "compare",
      el("label", { class: "fam-label", for: "compare-a" }, say("compare_a")),
      countrySelect("compare-a", a, (value) => go(value, pair[1]), { countries }),
      el("label", { class: "fam-label", for: "compare-b" }, say("compare_b")),
      countrySelect("compare-b", b, (value) => go(pair[0], value), { countries }),
      el("button", { type: "button", class: "fam-button", "data-testid": "compare-swap", onclick: () => go(pair[1], pair[0], true) }, say("swap")),
    ),
    helpRow(
      "compare_look",
      ...[0, 1].flatMap((side) => [el("label", { class: "fam-label", for: `compare-colour-${side}` }, say("compare_colour", { name: one[side].name[lang()] })), picker(side)]),
      toggle,
    ),
    el("div", { class: "compare-pictures" }, pictures),
    el("p", { class: "fam-fine" }, say("compare_scale")),
    el(
      "div",
      { class: "fam-table-box" },
      el(
        "table",
        { class: "compare-table", "data-testid": "compare-table" },
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
    downloads(() => `kuni-${a.toLowerCase()}-${b.toLowerCase()}`, () => one.map((c) => countryRow(c, facts)), () => ROW_COLUMNS, "compare-downloads", "countries"),
  );
  await paint();
}
