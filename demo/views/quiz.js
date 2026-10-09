// Three quizzes on Kuni's data: a country's capital, the country a state, province or prefecture is in, and the
// country a calling code belongs to. Each round comes from a seed, so the link to it (#/quiz/<kind>/<seed>) gives
// anybody the same questions in the same order; the streak counts right answers in a row. Map quizzes are Chizu's.
import { countries, country } from "../dist/index.js";
import { allSubdivisions, subdivisionsByName } from "../dist/subdivisions.js";
import { $, copyButton, downloads, el, flagged, helpRow, lang, say } from "../shared.js";

const KINDS = ["capital", "subdivision", "calling"];
const CHOICES = 4;

const state = { kind: "capital", seed: 0, at: 0, streak: 0, answered: [], chosen: null };

// A small seeded generator (mulberry32): the same seed gives the same numbers in every browser.
function random(seed) {
  let value = seed >>> 0;

  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
const pickFrom = (list, next) => list[Math.floor(next() * list.length)];

// The pools, made once each: what can be asked, with the answer and the country it belongs to.
const pools = {};
function pool(kind) {
  if (pools[kind] !== undefined) return pools[kind];
  if (kind === "capital") pools[kind] = countries().filter((one) => one.capital !== undefined).map((one) => ({ code: one.alpha2, answer: one.alpha2 }));
  if (kind === "calling") {
    const counts = new Map();
    for (const one of countries()) if (one.callingCode !== undefined) counts.set(one.callingCode, (counts.get(one.callingCode) ?? 0) + 1);
    pools[kind] = countries().filter((one) => one.callingCode !== undefined && counts.get(one.callingCode) === 1).map((one) => ({ code: one.alpha2, answer: one.alpha2 }));
  }
  if (kind === "subdivision") {
    const countryNames = new Set(countries().flatMap((one) => [one.name.en, one.name.ja]));
    pools[kind] = allSubdivisions()
      .filter((one) => one.level === 1 && !countryNames.has(one.name.en) && one.name.ja !== null)
      .filter((one) => new Set(subdivisionsByName(one.name.en).map((found) => found.country)).size === 1)
      .map((one) => ({ code: one.country, answer: one.country, place: one }));
  }

  return pools[kind];
}

// Question `at` of a round: the same for the same kind, seed and number.
function question(kind, seed, at) {
  const next = random((seed * 2654435761) ^ (at * 40503) ^ KINDS.indexOf(kind));
  const asked = pickFrom(pool(kind), next);
  const home = country(asked.code);
  // Wrong answers: countries of the same continent first, so the choice is not given away.
  const near = countries().filter((one) => one.alpha2 !== asked.code && one.continent === home.continent && (kind !== "capital" || one.capital !== undefined) && (kind !== "calling" || one.callingCode !== undefined && one.callingCode !== home.callingCode));
  const far = countries().filter((one) => one.alpha2 !== asked.code && (kind !== "capital" || one.capital !== undefined) && (kind !== "calling" || one.callingCode !== undefined && one.callingCode !== home.callingCode));
  const choices = new Set([asked.code]);
  while (choices.size < CHOICES) choices.add(pickFrom(choices.size < 3 && near.length >= 3 ? near : far, next).alpha2);
  const order = [...choices].map((code) => ({ code, key: next() })).sort((a, b) => a.key - b.key).map((one) => one.code);

  return { ...asked, choices: order };
}

const prompt = (one) => {
  const home = country(one.code);
  if (state.kind === "capital") return say("quiz_capital_q", { name: home.name[lang()] });
  if (state.kind === "calling") return say("quiz_calling_q", { code: home.callingCode });

  return say("quiz_subdivision_q", { name: lang() === "ja" ? one.place.name.ja : one.place.name.en });
};
const label = (code) => (state.kind === "capital" ? country(code).capital[lang()] : null);

const BEST = "kuni.quiz.best";
const best = () => {
  try {
    return JSON.parse(localStorage.getItem(BEST) ?? "{}")[state.kind] ?? 0;
  } catch {
    return 0;
  }
};
const keepBest = (value) => {
  try {
    const all = JSON.parse(localStorage.getItem(BEST) ?? "{}");
    if ((all[state.kind] ?? 0) < value) localStorage.setItem(BEST, JSON.stringify({ ...all, [state.kind]: value }));
  } catch {
    /* A browser that keeps nothing still plays. */
  }
};

const newSeed = () => 10000 + Math.floor(Math.random() * 90000);

function answer(code) {
  if (state.chosen !== null) return;
  const one = question(state.kind, state.seed, state.at);
  state.chosen = code;
  const right = code === one.answer;
  state.streak = right ? state.streak + 1 : 0;
  keepBest(state.streak);
  state.answered.push({ number: state.at + 1, question: prompt(one), answer: label(one.answer) ?? country(one.answer).name[lang()], chosen: label(code) ?? country(code).name[lang()], right });
  draw();
}

function draw() {
  const one = question(state.kind, state.seed, state.at);
  const link = `${location.origin}${location.pathname}${location.search}#/quiz/${state.kind}/${state.seed}`;
  const right = state.answered.filter((entry) => entry.right).length;
  $("quiz-card").replaceChildren(
    el("p", { class: "fam-muted", "data-testid": "quiz-number" }, say("quiz_number", { number: state.at + 1, seed: state.seed })),
    el("p", { class: "quiz-question", "data-testid": "quiz-question", "data-answer": one.answer }, prompt(one)),
    el(
      "div",
      { class: "quiz-choices", role: "group", "aria-label": say("quiz_choices"), "data-testid": "quiz-choices" },
      one.choices.map((code) =>
        el(
          "button",
          {
            type: "button",
            class: "fam-button choice",
            "data-code": code,
            "data-state": state.chosen === null ? undefined : code === one.answer ? "right" : code === state.chosen ? "wrong" : undefined,
            disabled: state.chosen !== null,
            onclick: () => answer(code),
          },
          state.kind === "capital" ? el("span", {}, label(code)) : flagged(code, { short: true }),
        ),
      ),
    ),
    el("p", { class: "quiz-feedback", "data-testid": "quiz-feedback", "aria-live": "polite" }, state.chosen === null ? "" : state.chosen === one.answer ? say("quiz_right") : say("quiz_wrong", { name: label(one.answer) ?? country(one.answer).name[lang()] })),
    el("div", { class: "fam-actions" }, el("button", { type: "button", class: "fam-button", "data-primary": "true", "data-testid": "quiz-next", disabled: state.chosen === null, onclick: () => ((state.at += 1), (state.chosen = null), draw()) }, say("quiz_next"))),
  );
  $("quiz-score").replaceChildren(
    el("div", { class: "fam-card" }, el("b", { "data-testid": "quiz-streak" }, String(state.streak)), el("span", {}, say("quiz_streak"))),
    el("div", { class: "fam-card" }, el("b", { "data-testid": "quiz-best" }, String(Math.max(best(), state.streak))), el("span", {}, say("quiz_best"))),
    el("div", { class: "fam-card" }, el("b", { "data-testid": "quiz-right" }, `${right}/${state.answered.length}`), el("span", {}, say("quiz_right_count"))),
  );
  $("quiz-link").textContent = link;
}

export function render(asked) {
  const [kind, seed] = (asked ?? "").split("/");
  const fresh = KINDS.includes(kind) && Number.isInteger(Number(seed)) && Number(seed) > 0 && (kind !== state.kind || Number(seed) !== state.seed);
  if (fresh) Object.assign(state, { kind, seed: Number(seed), at: 0, streak: 0, answered: [], chosen: null });
  if (state.seed === 0) {
    state.seed = newSeed();
    history.replaceState(history.state, "", `#/quiz/${state.kind}/${state.seed}`);
  }
  const start = (kindNow, seedNow) => (location.hash = `#/quiz/${kindNow}/${seedNow}`);
  $("view-quiz").replaceChildren(
    helpRow(
      "quiz",
      el("span", { class: "fam-label" }, say("quiz_kind")),
      el("div", { class: "fam-seg", role: "group", "aria-label": say("quiz_kind"), "data-testid": "quiz-kinds" }, KINDS.map((one) => el("button", { type: "button", "data-kind": one, "aria-pressed": String(one === state.kind), onclick: () => start(one, state.seed) }, say(`quiz_${one}`)))),
    ),
    helpRow("quiz_seed", el("button", { type: "button", class: "fam-button", "data-testid": "quiz-new", onclick: () => start(state.kind, newSeed()) }, say("quiz_new")), copyButton(() => $("quiz-link").textContent, "quiz-share", "copy_link"), el("code", { id: "quiz-link", class: "quiz-link", "data-testid": "quiz-link" })),
    el("div", { class: "fam-cards quiz-score", id: "quiz-score" }),
    el("div", { class: "quiz-card fam-felt", id: "quiz-card", "data-testid": "quiz-card" }),
    el("p", { class: "fam-fine" }, say("quiz_note")),
    downloads(() => `kuni-quiz-${state.kind}-${state.seed}`, () => state.answered, () => ["number", "question", "answer", "chosen", "right"], "quiz-downloads", "quiz_answers"),
  );
  draw();
}
