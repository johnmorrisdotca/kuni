// The form widget: a country select that feeds a state, province or prefecture select, in English or Japanese,
// with a box that turns what somebody typed ("UK", どいつ) into the country. What it would submit is shown as it
// changes; "Copy the code" gives the same widget as a page of its own, and the lists download as CSV, JSON or text.
import { countries, country, countryByName } from "../dist/index.js";
import { loadSubdivisions } from "../dist/load.js";
import { subdivisionTypeLabel } from "../dist/subdivisions.js";
import { $, copyButton, downloads, el, helpRow, say } from "../shared.js";

const state = { country: "JP", region: "JP-13", lang: "en", list: [] };
let asking = 0;

// The widget's own words, in its own language (which need not be the page's).
const WIDGET = {
  en: { country: "Country", region: "Region", choose: "Choose…", none: "No regions" },
  ja: { country: "国", region: "地域", choose: "選択してください", none: "地域なし" },
};

const regionWord = () => {
  // Japan's prefectures are of four kinds (都, 道, 府, 県), named together 都道府県.
  if (state.country === "JP") return state.lang === "ja" ? "都道府県" : "Prefecture";
  const kind = subdivisionTypeLabel(state.country, state.lang);
  if (kind === null) return WIDGET[state.lang].region;

  if (state.lang === "ja") return kind === WIDGET.ja.region ? kind : `${WIDGET.ja.region}（${kind}）`;

  return kind.charAt(0).toUpperCase() + kind.slice(1);
};

/** The widget as a page of its own: plain HTML and a module script reading Kuni from a CDN. */
export const snippet = (lang) => `<label>${WIDGET[lang].country} <select id="country"></select></label>
<label>${WIDGET[lang].region} <select id="region"></select></label>

<script type="module">
  import { countries } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kuni@1/dist/index.js";
  import { loadSubdivisions } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kuni@1/dist/load.js";

  const lang = "${lang}";
  const country = document.getElementById("country");
  const region = document.getElementById("region");
  // The flag is an emoji, which Windows shows as two letters, so the name is always beside it.
  country.append(...countries({ order: lang }).map((one) => new Option(\`\${one.flag} \${one.name[lang]}\`, one.alpha2)));
  country.value = "${state.country}";

  async function fillRegions() {
    const list = ((await loadSubdivisions(country.value)) ?? []).filter((one) => one.level === 1);
    // A Japanese name no source has is null: fall back to English, in the open.
    region.replaceChildren(...list.map((one) => new Option(one.name[lang] ?? one.name.en, one.code)));
    region.disabled = list.length === 0;
  }
  country.addEventListener("change", fillRegions);
  await fillRegions();
</script>
`;

async function fillRegions() {
  const ask = (asking += 1);
  const list = ((await loadSubdivisions(state.country)) ?? []).filter((one) => one.level === 1);
  if (ask !== asking) return;
  state.list = list;
  if (!list.some((one) => one.code === state.region)) state.region = list[0]?.code ?? "";
  const select = $("form-region");
  select.replaceChildren(...(list.length === 0 ? [el("option", { value: "" }, WIDGET[state.lang].none)] : list.map((one) => el("option", { value: one.code }, one.name[state.lang] ?? one.name.en))));
  select.value = state.region;
  select.disabled = list.length === 0;
  $("form-region-label").textContent = regionWord();
  show();
}

function show() {
  const named = state.list.find((one) => one.code === state.region);
  $("form-output").textContent = JSON.stringify({ country: state.country, region: state.region || null, countryName: country(state.country).name[state.lang], regionName: named === undefined ? null : (named.name[state.lang] ?? named.name.en) }, null, 2);
  $("form-snippet").textContent = snippet(state.lang);
}

export function render(asked) {
  if (asked !== undefined && country(asked) !== null) state.country = country(asked).alpha2;
  const typed = el("input", {
    id: "form-typed",
    class: "fam-field",
    type: "text",
    autocomplete: "off",
    spellcheck: "false",
    "data-testid": "form-typed",
    oninput: () => {
      const found = countryByName(typed.value);
      $("form-typed-answer").textContent = typed.value.trim() === "" ? "" : found === null ? say("form_typed_none") : say("form_typed_found", { name: found.name[state.lang], code: found.alpha2 });
      if (found !== null && found.alpha2 !== state.country) {
        state.country = found.alpha2;
        $("form-country").value = found.alpha2;
        fillRegions();
      }
    },
  });
  const pickCountry = el(
    "select",
    { id: "form-country", class: "fam-field", "data-testid": "form-country", onchange: () => ((state.country = pickCountry.value), fillRegions()) },
    countries({ order: state.lang }).map((one) => el("option", { value: one.alpha2 }, `${one.flag} ${one.name[state.lang]}`)),
  );
  pickCountry.value = state.country;
  const pickRegion = el("select", { id: "form-region", class: "fam-field", "data-testid": "form-region", onchange: () => ((state.region = pickRegion.value), show()) });
  const languages = el(
    "div",
    { class: "fam-seg", role: "group", "aria-label": say("form_lang"), "data-testid": "form-lang" },
    ["en", "ja"].map((one) => el("button", { type: "button", "data-lang-widget": one, "aria-pressed": String(state.lang === one), onclick: () => ((state.lang = one), render()) }, one === "en" ? "English" : "日本語")),
  );

  $("view-form").replaceChildren(
    helpRow("form_lang", el("span", { class: "fam-label" }, say("form_lang")), languages),
    helpRow("form_typed", el("label", { class: "fam-label", for: "form-typed" }, say("form_typed")), typed),
    el("p", { class: "fam-fine", id: "form-typed-answer", "data-testid": "form-typed-answer", "aria-live": "polite" }),
    el(
      "div",
      { class: "widget fam-felt", "data-testid": "form-widget", lang: state.lang },
      el("div", { class: "widget-field" }, el("label", { for: "form-country" }, WIDGET[state.lang].country), pickCountry),
      el("div", { class: "widget-field" }, el("label", { for: "form-region", id: "form-region-label" }, WIDGET[state.lang].region), pickRegion),
    ),
    el("h3", { class: "sub" }, say("form_submits")),
    el("pre", { id: "form-output", "data-testid": "form-output", "aria-live": "polite" }),
    el("div", { class: "fam-actions" }, el("h3", { class: "sub" }, say("form_code")), copyButton(() => $("form-snippet").textContent, "form-copy", "copy_code")),
    el("pre", { id: "form-snippet", class: "snippet", "data-testid": "form-snippet" }),
    el("h3", { class: "sub" }, say("form_lists")),
    el("p", { class: "fam-fine" }, say("form_lists_countries")),
    downloads("kuni-countries-names", () => countries({ order: state.lang }).map((one) => ({ code: one.alpha2, en: one.name.en, ja: one.name.ja })), () => ["code", "en", "ja"], "form-downloads-countries"),
    el("p", { class: "fam-fine" }, say("form_lists_regions")),
    downloads(() => `kuni-${state.country.toLowerCase()}-regions`, () => state.list.map((one) => ({ code: one.code, en: one.name.en, ja: one.name.ja, type: one.type })), () => ["code", "en", "ja", "type"], "form-downloads-regions"),
  );
  fillRegions();
}
