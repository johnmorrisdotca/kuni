// The country page: one country with everything Kuni knows of it. Its names with furigana, its outline from Chizu
// with the capital marked, its facts, its neighbours (each a link to its own page), the groupings it belongs to, its
// time zones with the time there now (the device's own clock; nothing is fetched), and its record to download.
import { continentName, countries, country, subregionName } from "../dist/index.js";
import { facts } from "../dist/facts.js";
import { groupingsOf } from "../dist/groupings.js";
import { subdivisions, subdivisionTypeLabel } from "../dist/subdivisions.js";
import { $, countryRow, countrySelect, downloads, el, flagged, helpRow, lang, number, outline, ROW_COLUMNS, ruby, say } from "../shared.js";

let code = "JP";
let clock = null;
let drawn = 0;

const DAYS = { mon: "day_mon", sun: "day_sun", sat: "day_sat", fri: "day_fri" };

/** The time now in each of a country's zones, written into the cells marked for it; the device's clock only. */
function tick() {
  for (const cell of document.querySelectorAll("[data-zone]")) {
    try {
      cell.textContent = new Date().toLocaleTimeString(lang() === "ja" ? "ja-JP" : "en-GB", { timeZone: cell.dataset.zone, weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      cell.textContent = "–";
    }
  }
}

function startClock() {
  stopClock();
  tick();
  clock = setInterval(() => {
    if (document.visibilityState === "visible") tick();
  }, 1000);
}

export function stopClock() {
  if (clock !== null) clearInterval(clock);
  clock = null;
}

const pair = (label, ...value) => [el("dt", {}, label), el("dd", {}, ...value)];

export async function render(asked) {
  if (asked !== undefined && country(asked) !== null) code = country(asked).alpha2;
  const one = country(code);
  const fact = facts(code);
  const turn = (drawn += 1);
  const root = $("view-country");
  const pick = countrySelect("country-pick", code, (value) => (location.hash = `#/country/${value}`), { countries });
  const kind = subdivisionTypeLabel(code, lang());
  const count = subdivisions(code)?.length ?? 0;
  const density = fact.population !== null && fact.areaKm2 ? fact.population / fact.areaKm2 : null;
  const memberships = groupingsOf(code, { kind: "membership" });
  const informal = groupingsOf(code, { kind: "informal" });
  const zones = one.zones ?? [];

  const title = el(
    "div",
    { class: "country-title", "data-testid": "country-title" },
    el("span", { class: "big-flag", "aria-hidden": "true" }, one.flag),
    el("div", {}, el("h3", {}, lang() === "ja" ? ruby(one.name.ja, one.reading) : one.name.en), el("p", { class: "fam-muted" }, lang() === "ja" ? one.name.en : ruby(one.name.ja, one.reading), one.name.local === undefined || one.name.local === one.name.ja || one.name.local === one.name.en ? "" : ` · ${one.name.local}`, ` · ${one.alpha2} · ${one.alpha3} · ${one.numeric}`)),
  );
  const picture = el("div", { class: "outline-box", "data-testid": "country-outline" }, el("p", { class: "fam-muted" }, say("outline_loading")));

  const list = el("dl", { class: "facts", "data-testid": "country-facts" });
  const rows = [
    pair(say("find_capital"), one.capital === undefined ? say("none_capital") : lang() === "ja" ? `${one.capital.ja}（${one.capital.en}）` : `${one.capital.en} (${one.capital.ja})`),
    pair(say("fact_population"), fact.population === null ? say("none_population") : `${number(fact.population)}${fact.populationYear === null ? "" : say("as_of_year", { year: fact.populationYear })}`),
    pair(say("fact_area"), `${number(fact.areaKm2, 1)} km²${fact.areaOf === "land" ? say("land_only") : ""}${fact.areaYear === null ? "" : say("as_of_year", { year: fact.areaYear })}`),
    pair(say("fact_density"), density === null ? "–" : say("per_km2", { value: number(density, 1) })),
    pair(say("find_continent"), `${continentName(one.continent, lang())}${one.subregion === undefined ? "" : ` · ${subregionName(one.subregion, lang())}`}`),
    pair(
      say("fact_borders"),
      fact.borders.length === 0 ? say("no_borders") : el("span", { class: "chips", "data-testid": "country-borders" }, fact.borders.map((other) => flagged(other, { link: true }))),
    ),
    pair(say("fact_driving"), fact.drivingSide === null ? say("none_roads") : say(`drives_${fact.drivingSide}`)),
    pair(say("fact_week"), say(DAYS[fact.weekStart])),
    pair(say("fact_units"), `${say(`measure_${fact.measurement}`)} · ${fact.paper} · ${say(fact.hourCycle === "h12" ? "clock_12" : "clock_24")}`),
    pair(say("find_calling"), one.callingCode ?? "–"),
    pair(say("find_currency"), one.currency?.join(", ") ?? "–"),
    pair(say("find_tld"), one.tld === undefined ? "–" : `.${one.tld}`),
    pair(say("fact_point"), fact.point === null ? "–" : `${fact.point.lat}, ${fact.point.lon}`),
    pair(say("find_divisions"), count === 0 ? say("list_none") : el("a", { href: `#/form/${code}` }, kind === null ? String(count) : `${count} (${kind})`)),
    pair(
      say("fact_groupings"),
      memberships.length + informal.length === 0
        ? "–"
        : el("span", { class: "chips", "data-testid": "country-groupings" }, [...memberships, ...informal].map((group) => el("a", { class: "fam-chip", href: `#/groupings/${group.id}` }, group.shortName?.[lang()] ?? group.shortName?.en ?? group.name[lang()]))),
    ),
  ];
  for (const [term, detail] of rows) list.append(term, detail);

  const time = el(
    "div",
    { class: "zones fam-table-box", "data-testid": "country-zones" },
    el("table", {}, el("thead", {}, el("tr", {}, el("th", { scope: "col" }, say("zone")), el("th", { scope: "col" }, say("zone_now")))), el("tbody", {}, zones.map((zone) => el("tr", {}, el("td", {}, zone), el("td", { "data-zone": zone, class: "num" }, "–"))))),
  );

  root.replaceChildren(
    helpRow("country", el("label", { class: "fam-label", for: "country-pick" }, say("list_country")), pick),
    el("div", { class: "country-grid" }, el("div", {}, title, picture), el("div", {}, list)),
    el("h3", { class: "sub" }, say("zones_title", { count: zones.length })),
    el("p", { class: "fam-fine" }, say("zones_note")),
    time,
    downloads(() => `kuni-${code.toLowerCase()}`, () => [countryRow(one, facts)], () => ROW_COLUMNS, "country-downloads", "countries"),
  );
  startClock();
  const svg = await outline(code, say("outline_of", { name: one.name[lang()] }), fact.capitalPoint ?? undefined);
  if (turn !== drawn) return;
  picture.replaceChildren(svg ?? el("p", { class: "fam-muted" }, say("outline_none")));
  if (svg !== null) picture.append(el("p", { class: "fam-fine" }, say("outline_credit")));
}
