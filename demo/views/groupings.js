// The groupings explorer: pick a grouping (a continent, a UN M49 area, a body, an informal grouping or the regions
// inside a country) and read its members with their flags and names, its definition, its source and its notes; for
// an international body, its members on any day since 1945. Downloads give the members on show.
import { country } from "../dist/index.js";
import { grouping, groupings, membersOf } from "../dist/groupings.js";
import { subdivision } from "../dist/subdivisions.js";
import { $, downloads, el, flagged, helpRow, lang, ruby, say } from "../shared.js";

let id = "eu";
let day = "";

const KINDS = ["membership", "informal", "continent", "m49", "subdivision"];

// A member's row: a country with its flag, or a subdivision with its names and its country.
function member(code) {
  if (code.includes("-")) {
    const place = subdivision(code);

    return { code, name: place === null ? code : (lang() === "ja" ? (place.name.ja ?? place.name.en) : place.name.en), country: code.slice(0, 2) };
  }

  return { code, name: country(code)?.name[lang()] ?? code, country: code };
}

export function render(asked) {
  if (asked !== undefined && grouping(asked) !== null) id = grouping(asked).id;
  const one = grouping(id);
  const root = $("view-groupings");
  const pick = el(
    "select",
    { id: "grouping-pick", class: "fam-field", "data-testid": "grouping-pick", onchange: () => (location.hash = `#/groupings/${pick.value}`) },
    KINDS.map((kind) => el("optgroup", { label: say(`kind_${kind}`) }, groupings({ kind }).map((group) => el("option", { value: group.id }, `${group.name[lang()]}${group.shortName?.en !== undefined && group.shortName.en !== group.name.en ? ` (${group.shortName.en})` : ""}`)))),
  );
  pick.value = id;
  const body = one.periods !== undefined;
  const dated = el("input", { id: "grouping-day", class: "fam-field", type: "date", "data-testid": "grouping-day", value: day, min: "1945-01-01", max: one.asOf, disabled: !body, onchange: () => ((day = dated.value), render()) });
  const members = (membersOf(id, day === "" ? {} : { on: day }) ?? []).map(member);
  const periods = new Map((one.periods ?? []).filter((period) => period.until === null).map((period) => [period.code, period.since]));
  const left = (one.periods ?? []).filter((period) => period.until !== null);

  const head = el(
    "div",
    { class: "grouping-head", "data-testid": "grouping-head" },
    el("h3", {}, lang() === "ja" ? ruby(one.name.ja, one.reading) : one.name.en, " ", el("span", { class: "fam-badge" }, say(`kindone_${one.kind}`)), one.informal ? el("span", { class: "fam-badge", "data-tone": "good" }, say("informal")) : ""),
    el("p", { class: "fam-muted" }, lang() === "ja" ? one.name.en : ruby(one.name.ja, one.reading), one.shortName === undefined ? "" : ` · ${[one.shortName.en, one.shortName.ja].filter(Boolean).join(" · ")}`),
    one.otherNames === undefined ? "" : el("p", { class: "fam-muted", "data-testid": "grouping-other-names" }, say("also_called"), " ", one.otherNames.map((name) => (lang() === "ja" ? `${name.ja}（${name.en}）` : `${name.en} (${name.ja})`)).join(", ")),
    el("p", {}, one.definition),
    one.note === undefined ? "" : el("p", { class: "note-box", "data-testid": "grouping-note" }, one.note),
    el("p", { class: "fam-fine" }, say("source"), ": ", el("a", { href: one.source.url, rel: "noopener" }, one.source.name), ` · ${one.source.licence} · ${say("as_of", { day: one.asOf })}`),
    one.parent === undefined ? "" : el("p", { class: "fam-fine" }, say("inside"), ": ", el("a", { href: `#/groupings/${one.parent}` }, grouping(one.parent)?.name[lang()] ?? one.parent)),
  );

  const table = el(
    "div",
    { class: "fam-table-box members-box" },
    el(
      "table",
      { "data-testid": "grouping-members" },
      el("thead", {}, el("tr", {}, el("th", { scope: "col" }, say(one.kind === "subdivision" ? "col_subdivision" : "col_country")), el("th", { scope: "col" }, say("col_code")), body ? el("th", { scope: "col" }, say("since")) : "")),
      el(
        "tbody",
        {},
        members.map((row) =>
          el(
            "tr",
            {},
            el("td", {}, row.code.includes("-") ? el("span", {}, row.name) : flagged(row.code, { link: true })),
            el("td", { class: "mono" }, row.code),
            body ? el("td", { class: "num" }, periods.get(row.code) ?? "–") : "",
          ),
        ),
      ),
    ),
  );

  const others = (one.others ?? []).length === 0 ? "" : el("div", { class: "others" }, el("h3", { class: "sub" }, say("others")), el("p", { class: "chips", "data-testid": "grouping-others" }, one.others.map((other) => el("span", { class: "fam-chip" }, flagged(other.code), ` · ${say(`status_${other.status}`)}`))));
  const former = left.length === 0 ? "" : el("div", {}, el("h3", { class: "sub" }, say("former")), el("ul", { class: "former", "data-testid": "grouping-former" }, left.map((period) => el("li", {}, flagged(period.code, { link: true }), ` ${period.since ?? "?"} – ${period.until}`))));

  root.replaceChildren(
    helpRow("grouping", el("label", { class: "fam-label", for: "grouping-pick" }, say("grouping")), pick),
    helpRow("grouping_day", el("label", { class: "fam-label", for: "grouping-day" }, say("on_day")), dated, el("button", { type: "button", class: "fam-button", disabled: day === "", onclick: () => ((day = ""), render()) }, say("today"))),
    head,
    el("p", { class: "summary", "data-testid": "grouping-count", "aria-live": "polite" }, say(day === "" ? "members_now" : "members_on", { count: members.length, day })),
    table,
    others,
    former,
    downloads(() => `kuni-${id}${day === "" ? "" : `-${day}`}`, () => members.map((row) => ({ grouping: id, code: row.code, name: row.name, since: periods.get(row.code) ?? null })), () => ["grouping", "code", "name", "since"], "grouping-downloads", "grouping_members"),
  );
}
