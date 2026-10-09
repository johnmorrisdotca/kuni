// What every view of the demo shares: the page's language and words, building elements as text (never as HTML),
// numbers in the page's language, a flag with its name always beside it, furigana, downloads, the copy button and
// a country's outline from Chizu.
import { countryName, flag } from "./dist/index.js";
import { WORDS } from "./words.js";

export const $ = (id) => document.getElementById(id);

// The page's language, set up once by demo.js with familyLanguage; read through `lang()` so it is always current.
let language = { lang: "en" };
export const setLanguage = (state) => {
  language = state;
};
export const lang = () => language.lang;
export const ja = () => language.lang === "ja";

/** A line of the page in its language, with each `{name}` filled in from `values`. */
export function say(key, values) {
  const word = WORDS[language.lang][key] ?? WORDS.en[key];
  if (word === undefined) throw new Error(`no word for ${key}`);

  return values === undefined ? word : word.replace(/\{(\w+)\}/g, (whole, name) => String(values[name] ?? ""));
}

const JAPANESE = /[぀-ヿ一-鿿]/;

/** An element with text (never HTML), a class, attributes and children: el("td", { class: "num" }, "42"). */
export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === "class") node.className = value;
    else if (name.startsWith("on")) node.addEventListener(name.slice(2), value);
    else if (name === "dataset") Object.assign(node.dataset, value);
    else node.setAttribute(name, value === true ? "" : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === "string" || typeof child === "number" ? String(child) : child);
  }
  if (node.childNodes.length === 1 && node.firstChild.nodeType === 3 && JAPANESE.test(node.textContent) && !node.lang) node.lang = "ja";

  return node;
}

/** A number in the page's language: 123,802,000. */
export const number = (value, digits = 0) => (value === null || value === undefined ? "–" : value.toLocaleString(language.lang === "ja" ? "ja-JP" : "en-US", { maximumFractionDigits: digits }));

/**
 * A country's flag and name, together: the flag is an emoji, which Windows draws as two letters, so the name is
 * always beside it. This is the one place a flag is drawn, so a flags package (Hata) can take its place later.
 */
export function flagged(code, { short = true, tag = "span", link = false } = {}) {
  const name = countryName(code, language.lang, { short }) ?? code;
  const inner = [el("span", { class: "flag", "aria-hidden": "true" }, flag(code) ?? ""), el("span", { class: "flag-name" }, name)];

  return link ? el("a", { class: "flagged", href: `#/country/${code}` }, inner) : el(tag, { class: "flagged" }, inner);
}

/** A name with its reading over it, as furigana, where there is a reading; the name alone otherwise. */
export function ruby(name, reading) {
  if (reading === undefined || reading === null || !/[一-鿿]/.test(name)) return el("span", { lang: JAPANESE.test(name) ? "ja" : undefined }, name);

  return el("ruby", { lang: "ja" }, name, el("rp", {}, "("), el("rt", {}, reading), el("rp", {}, ")"));
}

// ----- Downloads -----------------------------------------------------------------------------------------------

const csvCell = (value) => {
  const text = value === null || value === undefined ? "" : Array.isArray(value) ? value.join(" ") : String(value);

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Rows of objects as CSV, with the columns named in the first line. */
export const toCsv = (rows, columns) => `${columns.join(",")}\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")).join("\n")}\n`;

/** Rows of objects as plain text: one row a line, the columns padded into place. */
export const toText = (rows, columns) => {
  const cells = [columns, ...rows.map((row) => columns.map((column) => (row[column] === null || row[column] === undefined ? "" : Array.isArray(row[column]) ? row[column].join(" ") : String(row[column]))))];
  const widths = columns.map((column, at) => Math.max(...cells.map((line) => [...line[at]].length)));

  return `${cells.map((line) => line.map((cell, at) => (at === line.length - 1 ? cell : cell + " ".repeat(widths[at] - [...cell].length))).join("  ").trimEnd()).join("\n")}\n`;
};

/** Hand the browser a file to save. */
export function save(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const link = el("a", { href: url, download: name, hidden: true });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The three download buttons, CSV, JSON and TXT, for what `rows()` gives when pressed: [{ ... }, ...] with
 * `columns` in that order. `name` is the file's name without its extension.
 */
export function downloads(name, rows, columns, testid) {
  const make = (kind) => () => {
    const list = rows();
    const file = typeof name === "function" ? name() : name;
    if (kind === "csv") save(`${file}.csv`, toCsv(list, columns()), "text/csv");
    if (kind === "json") save(`${file}.json`, `${JSON.stringify(list, null, 2)}\n`, "application/json");
    if (kind === "txt") save(`${file}.txt`, toText(list, columns()), "text/plain");
  };

  return el(
    "div",
    { class: "fam-actions downloads", role: "group", "aria-label": say("download"), "data-testid": testid },
    el("span", { class: "fam-label" }, say("download")),
    ...["csv", "json", "txt"].map((kind) => el("button", { type: "button", class: "fam-button", "data-kind": kind, "data-tip-en": WORDS.en[`download_${kind}`], "data-tip-ja": WORDS.ja[`download_${kind}`], onclick: make(kind) }, kind.toUpperCase())),
  );
}

/** A button that copies `text()` to the clipboard and says so for a moment. */
export function copyButton(text, testid, word = "copy") {
  const button = el("button", { type: "button", class: "fam-button", "data-testid": testid }, say(word));
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text());
      button.textContent = say("copied");
    } catch {
      button.textContent = say("copy_failed");
    }
    setTimeout(() => (button.textContent = say(word)), 1600);
  });

  return button;
}

// ----- Outlines, from Chizu ------------------------------------------------------------------------------------

const outlines = new Map();
const SVG = "http://www.w3.org/2000/svg";

/**
 * A country's outline as an SVG, from Chizu's map of that country alone (Natural Earth 1:50m), loaded when it is
 * wanted: one file a country, copied into site/chizu/ when the demo is built. `marker`, { lat, lon }, puts a dot on
 * it (the capital). Null where Chizu draws none.
 */
export async function outline(code, label, marker) {
  const map = await chizuMap(code);
  if (map === null) return null;
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", map.viewBox);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label);
  svg.classList.add("outline");
  for (const region of map.regions) {
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", region.path);
    svg.append(path);
  }
  const at = marker ? project(map, marker.lat, marker.lon) : null;
  if (at !== null) {
    const [width, height] = map.viewBox.split(" ").slice(2).map(Number);
    if (at[0] >= 0 && at[1] >= 0 && at[0] <= width && at[1] <= height) {
      const dot = document.createElementNS(SVG, "circle");
      dot.setAttribute("cx", at[0].toFixed(1));
      dot.setAttribute("cy", at[1].toFixed(1));
      dot.setAttribute("r", String(Math.max(width, height) / 70));
      dot.classList.add("capital-dot");
      svg.append(dot);
    }
  }

  return svg;
}

const RAD = Math.PI / 180;

/**
 * A point on Chizu's map of one country, in the map's own units: the same Lambert azimuthal equal-area projection
 * Chizu draws with (d3-geo's, rotated to the country's centre, scaled and moved by the map's numbers). Null for a
 * map drawn any other way.
 */
export function project(map, lat, lon) {
  const { kind, centre, scale, translate } = map.projection;
  if (kind !== "azimuthal-equal-area") return null;
  // Rotate the globe so the map's centre is at 0°, 0° (d3's rotation by [-λ0, -φ0]).
  const lambda = (lon - centre[0]) * RAD;
  const phi = lat * RAD;
  const deltaPhi = -centre[1] * RAD;
  const cosPhi = Math.cos(phi);
  const x = Math.cos(lambda) * cosPhi;
  const y = Math.sin(lambda) * cosPhi;
  const z = Math.sin(phi);
  const k = z * Math.cos(deltaPhi) + x * Math.sin(deltaPhi);
  const rotatedLambda = Math.atan2(y, x * Math.cos(deltaPhi) - z * Math.sin(deltaPhi));
  const rotatedPhi = Math.asin(Math.max(-1, Math.min(1, k)));
  // Lambert azimuthal equal-area.
  const cosRotated = Math.cos(rotatedPhi);
  const factor = Math.sqrt(2 / (1 + cosRotated * Math.cos(rotatedLambda)));

  return [translate[0] + scale * factor * cosRotated * Math.sin(rotatedLambda), translate[1] - scale * factor * Math.sin(rotatedPhi)];
}

/** The map Chizu draws one country with, or null; loaded once. */
export async function chizuMap(code) {
  const file = code.toLowerCase();
  if (!outlines.has(file)) outlines.set(file, import(`./chizu/countries/${file}.js`).then((module) => module.default).catch(() => null));

  return outlines.get(file);
}

/** An option row, with the words the Help switch shows under it in either language (WORDS' `help_<key>`). */
export function helpRow(key, ...children) {
  return el("div", { class: "fam-row", "data-help-en": WORDS.en[`help_${key}`], "data-help-ja": WORDS.ja[`help_${key}`] }, ...children);
}

/** A labelled select of every country, in the page language's order, each with its flag and name. */
export function countrySelect(id, chosen, onchange, { countries }) {
  const select = el("select", { id, class: "fam-field", "data-testid": id, onchange: () => onchange(select.value) });
  select.append(...countries({ order: language.lang }).map((one) => el("option", { value: one.alpha2 }, `${one.flag} ${one.name[language.lang]} (${one.alpha2})`)));
  select.value = chosen;

  return select;
}

/** One country's names and facts as a flat row: what the table shows and every download gives. */
export function countryRow(one, facts) {
  const fact = facts(one.alpha2);
  const density = fact.population !== null && fact.areaKm2 ? Math.round((fact.population / fact.areaKm2) * 10) / 10 : null;

  return {
    alpha2: one.alpha2,
    alpha3: one.alpha3,
    numeric: one.numeric,
    name_en: one.name.en,
    name_ja: one.name.ja,
    reading: one.reading ?? null,
    capital_en: one.capital?.en ?? null,
    capital_ja: one.capital?.ja ?? null,
    continent: one.continent,
    population: fact.population,
    population_year: fact.populationYear,
    area_km2: fact.areaKm2,
    density,
    calling_code: one.callingCode ?? null,
    currency: one.currency ?? null,
    tld: one.tld ?? null,
    driving_side: fact.drivingSide,
    borders: fact.borders,
    lat: fact.point?.lat ?? null,
    lon: fact.point?.lon ?? null,
    capital_lat: fact.capitalPoint?.lat ?? null,
    capital_lon: fact.capitalPoint?.lon ?? null,
    week_start: fact.weekStart,
    measurement: fact.measurement,
    paper: fact.paper,
    hour_cycle: fact.hourCycle,
    time_zones: one.zones ?? null,
  };
}

export const ROW_COLUMNS = ["alpha2", "alpha3", "numeric", "name_en", "name_ja", "reading", "capital_en", "capital_ja", "continent", "population", "population_year", "area_km2", "density", "calling_code", "currency", "tld", "driving_side", "borders", "lat", "lon", "capital_lat", "capital_lon", "week_start", "measurement", "paper", "hour_cycle", "time_zones"];
