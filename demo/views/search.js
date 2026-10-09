// Search by calling code, currency or domain: every country that answers to +44, EUR or .uk, which no name lookup
// finds, since one code can be many countries (+1 is the whole North American plan).
import { countries } from "../dist/index.js";
import { $, el, flagged, say } from "../shared.js";

const BY = {
  calling: { read: (text) => `+${text.replace(/[^\d]/g, "")}`, has: (one, wanted) => one.callingCode === wanted, example: ["+81", "+1", "+44", "+7"] },
  currency: { read: (text) => text.trim().toUpperCase(), has: (one, wanted) => (one.currency ?? []).includes(wanted), example: ["EUR", "USD", "XOF", "JPY"] },
  tld: { read: (text) => text.trim().toLowerCase().replace(/^\./, ""), has: (one, wanted) => one.tld === wanted, example: [".jp", ".uk", ".io", ".tv"] },
};

let by = "calling";

export function search() {
  const text = $("search-input").value;
  const wanted = BY[by].read(text);
  const found = text.trim() === "" ? [] : countries({ order: document.documentElement.lang === "ja" ? "ja" : "en" }).filter((one) => BY[by].has(one, wanted));
  $("search-call").textContent = `countries().filter(…${by === "calling" ? "callingCode" : by === "currency" ? "currency" : "tld"} ${JSON.stringify(wanted)})  // ${found.length}`;
  $("search-answer").replaceChildren(
    found.length === 0
      ? el("p", { class: "note fam-muted" }, say("search_none"))
      : el("div", {}, el("p", { class: "fam-muted" }, say("search_count", { count: found.length })), el("ul", { class: "search-list", "data-testid": "search-list" }, found.map((one) => el("li", {}, flagged(one.alpha2, { link: true }), ` ${one.alpha2}`)))),
  );
  for (const button of $("search-by").querySelectorAll("button")) button.setAttribute("aria-pressed", String(button.dataset.by === by));
  $("search-examples").replaceChildren(
    ...BY[by].example.map((example) =>
      el("button", { type: "button", "data-value": example, "aria-pressed": String(example === text), onclick: () => (($("search-input").value = example), search()) }, example),
    ),
  );
}

export function setUp() {
  $("search-input").addEventListener("input", search);
  for (const button of $("search-by").querySelectorAll("button")) {
    button.addEventListener("click", () => {
      by = button.dataset.by;
      $("search-input").value = BY[by].example[0];
      search();
    });
  }
}
