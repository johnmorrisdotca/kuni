// The data's quality, in the open: how many names and facts are known, which are missing and why, where CLDR and
// Wikidata disagree on a Japanese name, the names corrected by hand, and how the bodies' lists compare with
// Wikidata's. Read from quality.json, which the site's build makes from the documents in docs/.
import { allSubdivisions } from "../dist/subdivisions.js";
import { $, el, flagged, number, say } from "../shared.js";

const DOCS = "https://github.com/johnmorrisdotca/kuni/blob/main/docs/";
let loaded = null;

const table = (testid, heads, rows) =>
  el(
    "div",
    { class: "fam-table-box quality-box", tabindex: "0" },
    el("table", { "data-testid": testid }, el("thead", {}, el("tr", {}, heads.map((head) => el("th", { scope: "col" }, head)))), el("tbody", {}, rows.map((row) => el("tr", {}, row.map((cell) => el("td", {}, cell)))))),
  );

const section = (title, text, doc, ...body) => el("section", { class: "quality-section" }, el("h3", { class: "sub" }, title), el("p", { class: "fam-muted" }, text, " ", el("a", { href: `${DOCS}${doc}` }, doc)), ...body);

export async function render() {
  const root = $("view-quality");
  loaded ??= fetch("quality.json").then((answer) => answer.json());
  const data = await loaded;
  const all = allSubdivisions();
  const first = all.filter((one) => one.level === 1);
  const missing = all.filter((one) => one.name.ja === null);
  const byCountry = new Map();
  for (const one of missing) byCountry.set(one.country, (byCountry.get(one.country) ?? 0) + 1);

  root.replaceChildren(
    el(
      "div",
      { class: "fam-cards", "data-testid": "quality-cards" },
      el("div", { class: "fam-card" }, el("b", {}, `${number(first.filter((one) => one.name.ja !== null).length)}/${number(first.length)}`), el("span", {}, say("q_ja_first"))),
      el("div", { class: "fam-card" }, el("b", {}, number(data.disagreements.length)), el("span", {}, say("q_disagree"))),
      el("div", { class: "fam-card" }, el("b", {}, number(data.overrides.length)), el("span", {}, say("q_overrides"))),
      el("div", { class: "fam-card" }, el("b", {}, number(Object.entries(data.factGaps).filter(([field]) => field !== "borders").reduce((sum, [, gaps]) => sum + Object.keys(gaps).length, 0))), el("span", {}, say("q_fact_gaps"))),
    ),
    section(
      say("q_gaps_title"),
      say("q_gaps_text", { count: number(missing.length) }),
      "ja-gaps.md",
      table("quality-gaps", [say("col_country"), say("q_missing")], [...byCountry.entries()].sort((a, b) => b[1] - a[1]).map(([code, count]) => [flagged(code, { link: true }), number(count)])),
    ),
    section(say("q_disagree_title"), say("q_disagree_text"), "disagreements.md", table("quality-disagreements", [say("col_code"), say("col_en"), say("q_cldr"), say("q_wikidata")], data.disagreements.map((row) => [row.code, row.en, el("span", { lang: "ja" }, row.cldr), el("span", { lang: "ja" }, row.wikidata)]))),
    section(say("q_overrides_title"), say("q_overrides_text"), "disagreements.md", table("quality-overrides", [say("col_code"), say("q_kept"), say("q_why")], data.overrides.map((row) => [row.code, el("span", { lang: "ja" }, row.kept), row.why]))),
    section(say("q_questions_title"), say("q_questions_text"), "disagreements.md", el("ul", { class: "quality-list" }, data.questions.map((line) => el("li", {}, line)))),
    section(
      say("q_facts_title"),
      say("q_facts_text"),
      "facts.md",
      table(
        "quality-fact-gaps",
        [say("q_fact"), say("col_country"), say("q_why")],
        Object.entries(data.factGaps).filter(([field]) => field !== "borders").flatMap(([field, gaps]) => Object.entries(gaps).map(([code, why]) => [say(`q_field_${field}`), flagged(code, { link: true }), why])),
      ),
    ),
    el("p", { class: "fam-fine", "data-testid": "quality-islands" }, say("q_islands", { count: Object.keys(data.factGaps.borders).length })),
    section(say("q_subfacts_title"), say("q_subfacts_text"), "subdivision-facts.md", table("quality-subfacts", data.subdivisionFacts.head, data.subdivisionFacts.rows)),
    section(say("q_borders_title"), say("q_borders_text"), "facts.md", el("p", { class: "fam-fine mono", "data-testid": "quality-borders" }, data.bordersNotKept)),
    section(say("q_bodies_title"), say("q_bodies_text"), "groupings.md", table("quality-bodies", data.bodies.head, data.bodies.rows)),
  );
}
