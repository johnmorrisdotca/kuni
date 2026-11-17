// Fourteen quizzes on Kuni's data: a country's capital and the country of a capital, the country a state, province
// or prefecture is in, a state's own capital, calling codes, internet domains, currencies, official languages,
// largest cities, neighbours, continents, the side of the road, and which of two countries has more people or more
// land. Each round comes from a seed, so the link to it (#/quiz/<kind>/<seed>) gives anybody the same questions in
// the same order; the streak counts right answers in a row. Map quizzes are Chizu's.
import { CONTINENTS, continentName, countries, country } from "../dist/index.js";
import { facts } from "../dist/facts.js";
import { loadSubdivisionFacts } from "../dist/subdivision-facts.js";
import { allSubdivisions, subdivision, subdivisionsByName } from "../dist/subdivisions.js";
import { trivia } from "../dist/trivia.js";
import { $, copyButton, downloads, el, flagged, helpRow, lang, say } from "../shared.js";

// The first three keep their places: a kind's number is part of what a seed makes of a question.
const KINDS = ["capital", "subdivision", "calling", "country", "state-capital", "domain", "currency", "language", "largest-city", "borders", "continent", "driving", "population", "area"];
const CHOICES = 4;
// The countries whose states' capitals are asked.
const STATE_COUNTRIES = ["US", "CA", "JP", "AU"];

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

// What two kinds load before they can ask: the capitals of four countries' states, and the cities of a million.
const loaded = { stateCapitals: new Map(), cities: new Map(), cityNames: new Map() };
async function prepare(kind) {
  if (kind === "state-capital" && loaded.stateCapitals.size === 0) {
    for (const code of STATE_COUNTRIES) for (const one of (await loadSubdivisionFacts(code)) ?? []) if (one.capital !== null && subdivision(one.code)?.level === 1) loaded.stateCapitals.set(one.code, one.capital);
  }
  if (kind === "largest-city" && loaded.cities.size === 0) {
    const { cities1m } = await import("../dist/cities/1m.js");
    for (const one of cities1m()) {
      loaded.cities.set(one.country, [...(loaded.cities.get(one.country) ?? []), one.id]);
      loaded.cityNames.set(one.id, { en: one.name.en, ja: one.name.ja ?? one.name.en });
    }
    for (const one of countries()) {
      const largest = trivia(one.alpha2)?.largestCity;
      if (largest !== null && largest !== undefined) loaded.cityNames.set(largest.id, { en: largest.name.en, ja: largest.name.ja ?? largest.name.en });
    }
  }
}

const named = (type, code) => {
  try {
    return new Intl.DisplayNames([lang()], { type }).of(code) ?? code;
  } catch {
    return code;
  }
};
const people = (code) => facts(code)?.population ?? null;
const land = (code) => facts(code)?.areaKm2 ?? null;
const figure = (value) => value.toLocaleString(lang() === "ja" ? "ja-JP" : "en-CA");

// The pools, made once each: what can be asked, with the answer and the country it belongs to.
const pools = {};
function pool(kind) {
  if (pools[kind] !== undefined) return pools[kind];
  const all = countries();
  const own = (test) => all.filter(test).map((one) => ({ code: one.alpha2, answer: one.alpha2 }));
  if (kind === "capital") pools[kind] = own((one) => one.capital !== undefined);
  if (kind === "country") {
    const counts = new Map();
    for (const one of all) if (one.capital !== undefined) counts.set(one.capital.en, (counts.get(one.capital.en) ?? 0) + 1);
    pools[kind] = own((one) => one.capital !== undefined && counts.get(one.capital.en) === 1);
  }
  if (kind === "calling") {
    const counts = new Map();
    for (const one of all) if (one.callingCode !== undefined) counts.set(one.callingCode, (counts.get(one.callingCode) ?? 0) + 1);
    pools[kind] = own((one) => one.callingCode !== undefined && counts.get(one.callingCode) === 1);
  }
  if (kind === "subdivision") {
    const countryNames = new Set(all.flatMap((one) => [one.name.en, one.name.ja]));
    pools[kind] = allSubdivisions()
      .filter((one) => one.level === 1 && !countryNames.has(one.name.en) && one.name.ja !== null)
      .filter((one) => new Set(subdivisionsByName(one.name.en).map((found) => found.country)).size === 1)
      .map((one) => ({ code: one.country, answer: one.country, place: one }));
  }
  if (kind === "state-capital") pools[kind] = [...loaded.stateCapitals.keys()].map((code) => ({ code: code.slice(0, 2), answer: code, place: subdivision(code) }));
  if (kind === "domain") pools[kind] = own((one) => one.tld !== undefined);
  if (kind === "currency") pools[kind] = all.filter((one) => one.currency?.length === 1).map((one) => ({ code: one.alpha2, answer: one.currency[0] }));
  if (kind === "language") pools[kind] = all.filter((one) => (trivia(one.alpha2)?.officialLanguages.length ?? 0) > 0).map((one) => ({ code: one.alpha2, answer: trivia(one.alpha2).officialLanguages[0] }));
  if (kind === "largest-city") pools[kind] = all.filter((one) => trivia(one.alpha2)?.largestCity != null).map((one) => ({ code: one.alpha2, answer: trivia(one.alpha2).largestCity.id }));
  if (kind === "borders") pools[kind] = own((one) => (facts(one.alpha2)?.borders.length ?? 0) > 0);
  if (kind === "continent") pools[kind] = all.map((one) => ({ code: one.alpha2, answer: one.continent }));
  if (kind === "driving") pools[kind] = all.filter((one) => facts(one.alpha2)?.drivingSide != null).map((one) => ({ code: one.alpha2, answer: facts(one.alpha2).drivingSide }));
  if (kind === "population") pools[kind] = own((one) => (people(one.alpha2) ?? 0) > 0);
  if (kind === "area") pools[kind] = own((one) => (land(one.alpha2) ?? 0) > 0);

  return pools[kind];
}

// The wrong answers a question may draw on: `near` first (so the choice is not given away), then `far`.
function wrong(kind, asked) {
  const home = country(asked.code);
  const others = countries().filter((one) => one.alpha2 !== asked.code);
  const split = (list, key) => ({ near: list.filter((one) => one.continent === home.continent).map(key), far: list.map(key) });
  const code = (one) => one.alpha2;
  if (kind === "capital" || kind === "country") return split(others.filter((one) => one.capital !== undefined), code);
  if (kind === "calling") return split(others.filter((one) => one.callingCode !== undefined && one.callingCode !== home.callingCode), code);
  if (kind === "subdivision") return split(others, code);
  if (kind === "domain") return split(others.filter((one) => one.tld !== undefined), code);
  if (kind === "borders") return split(others.filter((one) => one.alpha2 !== asked.answer && !facts(asked.code).borders.includes(one.alpha2)), code);
  if (kind === "currency") return split(others.filter((one) => one.currency?.length === 1 && one.currency[0] !== asked.answer), (one) => one.currency[0]);
  if (kind === "language") {
    const known = new Set([...trivia(asked.code).officialLanguages, ...(home.languages ?? [])]);
    const list = others.flatMap((one) => (trivia(one.alpha2)?.officialLanguages ?? []).filter((language) => !known.has(language)).map((language) => ({ continent: one.continent, language })));

    return split(list, (one) => one.language);
  }
  if (kind === "largest-city") {
    const same = (loaded.cities.get(asked.code) ?? []).filter((id) => id !== asked.answer);
    const abroad = others.filter((one) => one.continent === home.continent && trivia(one.alpha2)?.largestCity != null).map((one) => trivia(one.alpha2).largestCity.id);

    return { near: same, far: [...same, ...abroad] };
  }
  if (kind === "state-capital") {
    const capital = loaded.stateCapitals.get(asked.answer).en;
    const same = [...loaded.stateCapitals.keys()].filter((one) => one.slice(0, 2) === asked.code && loaded.stateCapitals.get(one).en !== capital);

    return { near: same, far: same };
  }
  if (kind === "continent") return { near: [], far: CONTINENTS.filter((one) => one !== asked.answer) };
  if (kind === "driving") return { near: [], far: [asked.answer === "left" ? "right" : "left"] };

  return { near: [], far: [asked.other] };
}

// Which of two: a second country at least a fifth smaller, so the answer is not a coin toss.
function pair(kind, next) {
  const size = kind === "population" ? people : land;
  const first = pickFrom(pool(kind), next).code;
  let second = first;
  for (let tries = 0; tries < 40; tries += 1) {
    second = pickFrom(pool(kind), next).code;
    const [more, less] = size(first) >= size(second) ? [first, second] : [second, first];
    if (second !== first && size(less) <= size(more) * 0.8) return { code: more, answer: more, other: less };
  }

  return size(first) >= size(second) ? { code: first, answer: first, other: second } : { code: second, answer: second, other: first };
}

// Question `at` of a round: the same for the same kind, seed and number.
function question(kind, seed, at) {
  const next = random((seed * 2654435761) ^ (at * 40503) ^ KINDS.indexOf(kind));
  let asked;
  if (kind === "population" || kind === "area") asked = pair(kind, next);
  else {
    asked = pickFrom(pool(kind), next);
    // A neighbour to find: one of the country's own.
    if (kind === "borders") asked = { code: asked.code, answer: pickFrom(facts(asked.code).borders, next) };
  }
  const { near, far } = wrong(kind, asked);
  const wanted = Math.min(CHOICES, 1 + new Set(far).size);
  const choices = new Set([asked.answer]);
  while (choices.size < wanted) choices.add(pickFrom(choices.size < 3 && new Set(near).size >= 3 ? near : far, next));
  const order = [...choices].map((code) => ({ code, key: next() })).sort((a, b) => a.key - b.key).map((one) => one.code);

  return { ...asked, choices: order };
}

const prompt = (one) => {
  const home = country(one.code);
  const name = home.name[lang()];
  if (state.kind === "calling") return say("quiz_calling_q", { code: home.callingCode });
  if (state.kind === "subdivision") return say("quiz_subdivision_q", { name: lang() === "ja" ? one.place.name.ja : one.place.name.en });
  if (state.kind === "country") return say("quiz_country_q", { name: home.capital[lang()] });
  if (state.kind === "state-capital") return say("quiz_state_capital_q", { name: (lang() === "ja" ? one.place.name.ja : null) ?? one.place.name.en, country: name });
  if (state.kind === "domain") return say("quiz_domain_q", { code: `.${home.tld}` });
  if (state.kind === "population" || state.kind === "area") return say(`quiz_${state.kind}_q`);

  return say(`quiz_${state.kind.replace("-", "_")}_q`, { name });
};

// What a choice says, as words: a country's name for the kinds that choose between countries.
const COUNTRY_CHOICES = ["subdivision", "calling", "country", "domain", "borders", "population", "area"];
const label = (code) => {
  if (state.kind === "capital") return country(code).capital[lang()];
  if (state.kind === "state-capital") return (lang() === "ja" ? loaded.stateCapitals.get(code).ja : null) ?? loaded.stateCapitals.get(code).en;
  if (state.kind === "currency") return named("currency", code) === code ? code : `${code} · ${named("currency", code)}`;
  if (state.kind === "language") return named("language", code);
  if (state.kind === "largest-city") return loaded.cityNames.get(code)?.[lang()] ?? code;
  if (state.kind === "continent") return continentName(code, lang());
  if (state.kind === "driving") return say(code === "left" ? "quiz_left" : "quiz_right_side");

  return country(code).name[lang()];
};
// The figures behind a which-of-two question, shown once it is answered.
const figures = (one) => {
  if (state.kind !== "population" && state.kind !== "area") return "";
  const size = state.kind === "population" ? people : land;

  return ` ${one.choices.map((code) => `${country(code).name[lang()]} ${figure(size(code))}${state.kind === "area" ? " km²" : ""}`).join(" · ")}`;
};

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
  state.answered.push({ number: state.at + 1, question: prompt(one), answer: label(one.answer), chosen: label(code), right });
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
          COUNTRY_CHOICES.includes(state.kind) ? flagged(code, { short: true }) : el("span", {}, label(code)),
        ),
      ),
    ),
    el("p", { class: "quiz-feedback", "data-testid": "quiz-feedback", "aria-live": "polite" }, state.chosen === null ? "" : `${state.chosen === one.answer ? say("quiz_right") : say("quiz_wrong", { name: label(one.answer) })}${figures(one)}`),
    el("div", { class: "fam-actions" }, el("button", { type: "button", class: "fam-button", "data-primary": "true", "data-testid": "quiz-next", disabled: state.chosen === null, onclick: () => ((state.at += 1), (state.chosen = null), draw()) }, say("quiz_next"))),
  );
  $("quiz-score").replaceChildren(
    el("div", { class: "fam-card" }, el("b", { "data-testid": "quiz-streak" }, String(state.streak)), el("span", {}, say("quiz_streak"))),
    el("div", { class: "fam-card" }, el("b", { "data-testid": "quiz-best" }, String(Math.max(best(), state.streak))), el("span", {}, say("quiz_best"))),
    el("div", { class: "fam-card" }, el("b", { "data-testid": "quiz-right" }, `${right}/${state.answered.length}`), el("span", {}, say("quiz_right_count"))),
  );
  $("quiz-link").textContent = link;
}

export async function render(asked) {
  const [kind, seed] = (asked ?? "").split("/");
  const fresh = KINDS.includes(kind) && Number.isInteger(Number(seed)) && Number(seed) > 0 && (kind !== state.kind || Number(seed) !== state.seed);
  if (fresh) Object.assign(state, { kind, seed: Number(seed), at: 0, streak: 0, answered: [], chosen: null });
  if (state.seed === 0) {
    state.seed = newSeed();
    history.replaceState(history.state, "", `#/quiz/${state.kind}/${state.seed}`);
  }
  await prepare(state.kind);
  const start = (kindNow, seedNow) => (location.hash = `#/quiz/${kindNow}/${seedNow}`);
  $("view-quiz").replaceChildren(
    helpRow(
      "quiz",
      el("span", { class: "fam-label" }, say("quiz_kind")),
      el("div", { class: "fam-seg", role: "group", "aria-label": say("quiz_kind"), "data-testid": "quiz-kinds" }, KINDS.map((one) => el("button", { type: "button", "data-kind": one, "aria-pressed": String(one === state.kind), onclick: () => start(one, state.seed) }, say(`quiz_${one.replace("-", "_")}`)))),
    ),
    helpRow("quiz_seed", el("button", { type: "button", class: "fam-button", "data-testid": "quiz-new", onclick: () => start(state.kind, newSeed()) }, say("quiz_new")), copyButton(() => $("quiz-link").textContent, "quiz-share", "copy_link"), el("code", { id: "quiz-link", class: "quiz-link", "data-testid": "quiz-link" })),
    el("div", { class: "fam-cards quiz-score", id: "quiz-score" }),
    el("div", { class: "quiz-card fam-felt", id: "quiz-card", "data-testid": "quiz-card" }),
    el("p", { class: "fam-fine" }, say("quiz_note")),
    downloads(() => `kuni-quiz-${state.kind}-${state.seed}`, () => state.answered, () => ["number", "question", "answer", "chosen", "right"], "quiz-downloads", "quiz_answers"),
  );
  draw();
}
