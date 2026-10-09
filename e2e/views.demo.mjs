// The views beside "Look up": the country page, compare, every country, groupings, the quiz, the form widget, search
// by code and data quality. Each is opened by its address and by its tab, played as a person would, and held to
// the page's rules: no sideways scroll at a phone's width, finger-sized controls, light and dark.
import { Buffer } from "node:buffer";

import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, tap, type } from "./demo.mjs";

const VIEWS = ["country/JP", "compare/JP/GB", "table", "groupings/eu", "quiz/capital/4242", "form/JP", "quality"];

/** Open a view by its address and wait for it to be drawn. */
async function view(page, address, lang = "en") {
  const errors = await open(page, `?lang=${lang}&help=off#/${address}`);
  await page.waitForSelector('main[data-view-ready="true"]');
  return errors;
}

/** Press a download button and read what the browser was handed. */
async function download(page, box, kind) {
  const [file] = await Promise.all([page.waitForEvent("download"), page.locator(at(box)).locator(`[data-kind="${kind}"]`).click()]);
  const stream = await file.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return { name: file.suggestedFilename(), text: Buffer.concat(chunks).toString("utf8") };
}

test("the tabs open each view at its own address, and the address opens the view", async ({ page }, testInfo) => {
  const errors = await open(page, "?lang=en");
  await expect(page.locator(at("view-lookup"))).toBeVisible();
  for (const name of ["country", "compare", "table", "groupings", "quiz", "form", "quality", "lookup"]) {
    await tap(page, `[data-view-link="${name}"]`, testInfo);
    await expect(page).toHaveURL(new RegExp(`#/${name}`));
    await expect(page.locator(at(`view-${name}`))).toBeVisible();
    await expect(page.locator(`[data-view-link="${name}"]`)).toHaveAttribute("aria-current", "page");
  }
  await expect(page.locator(at("view-quiz"))).toBeHidden();
  expect(errors).toEqual([]);
});

for (const scheme of ["light", "dark"]) {
  test(`every view fits the page without a sideways scroll, in ${scheme}, and its controls are a finger tall`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    for (const address of VIEWS) {
      const errors = await view(page, address, scheme === "dark" ? "ja" : "en");
      await noSidewaysScroll(page);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll("main .view-body button, main .view-body input, main .view-body select, nav.views a")]
          .filter((one) => one.offsetParent !== null)
          .map((one) => ({ name: one.textContent.trim() || one.id, ...one.getBoundingClientRect().toJSON() }))
          .filter((one) => one.height < 43.5 || one.width < 43.5),
      );
      expect(small, address).toEqual([]);
      expect(errors, address).toEqual([]);
    }
  });
}

test("the country page: names, outline with the capital, facts, neighbours that lead on, the time there, and a download", async ({ page }) => {
  const errors = await view(page, "country/FR");
  await expect(page.locator(at("country-title"))).toContainText("France");
  await expect(page.locator(at("country-title"))).toContainText("フランス");
  await expect(page.locator(at("country-outline")).locator("svg path").first()).toBeAttached();
  await expect(page.locator(at("country-outline")).locator("circle.capital-dot")).toHaveCount(1);
  await expect(page.locator(at("country-facts"))).toContainText("Paris");
  await expect(page.locator(at("country-facts"))).toContainText("Monday");
  await expect(page.locator(at("country-groupings"))).toContainText("EU");
  await expect(page.locator(at("country-zones")).locator("td").nth(1)).toHaveText(/\d\d:\d\d:\d\d/);
  const file = await download(page, "country-downloads", "json");
  expect(file.name).toBe("kuni-fr.json");
  expect(JSON.parse(file.text)[0]).toMatchObject({ alpha2: "FR", capital_ja: "パリ", driving_side: "right" });
  await page.locator(at("country-borders")).locator("a", { hasText: "Spain" }).click();
  await expect(page).toHaveURL(/#\/country\/ES$/);
  await expect(page.locator(at("country-title"))).toContainText("Spain");
  await page.goto("http://kuni.test/?lang=en#/country/JP");
  await page.waitForSelector('main[data-view-ready="true"]');
  await expect(page.locator(at("country-facts"))).toContainText("none: an island");
  expect(errors).toEqual([]);
});

test("in Japanese, a name written in kanji carries its reading as furigana", async ({ page }) => {
  const errors = await view(page, "country/JP", "ja");
  await expect(page.locator(at("country-title")).locator("ruby rt").first()).toHaveText("にほん");
  await expect(page.locator(at("country-facts"))).toContainText("左側通行");
  expect(errors).toEqual([]);
});

test("compare: two countries side by side, the distance between capitals, and swapping them", async ({ page }) => {
  const errors = await view(page, "compare/JP/GB");
  await expect(page.locator(at("compare-table"))).toContainText("km apart");
  await expect(page.locator(at("compare-table"))).toContainText("Tokyo");
  await expect(page.locator(at("compare-outline-0")).locator("svg")).toBeAttached();
  await page.locator(at("compare-swap")).click();
  await expect(page).toHaveURL(/#\/compare\/GB\/JP$/);
  await expect(page.locator(at("compare-a"))).toHaveValue("GB");
  await page.locator(at("compare-b")).selectOption("KR");
  await expect(page).toHaveURL(/#\/compare\/GB\/KR$/);
  expect(errors).toEqual([]);
});

test("every country: filter in either language, narrow by grouping, sort, and download the rows on show", async ({ page }) => {
  const errors = await view(page, "table");
  const rows = page.locator(at("table-rows")).locator("tr");
  await expect(rows).toHaveCount(250);
  await type(page, "table-filter", "ドイツ");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Germany");
  await type(page, "table-filter", "");
  await page.locator(at("table-grouping")).selectOption("eu");
  await expect(rows).toHaveCount(27);
  await expect(page.locator(at("table-count"))).toContainText("27");
  await page.locator('#table button[data-sort="population"]').click();
  await expect(rows.first()).toContainText("Germany");
  await page.locator('#table button[data-sort="population"]').click();
  await expect(rows.first()).toContainText("Malta");
  const csv = await download(page, "table-downloads", "csv");
  expect(csv.name).toBe("kuni-countries.csv");
  expect(csv.text.trim().split("\n")).toHaveLength(28);
  const text = await download(page, "table-downloads", "txt");
  expect(text.text).toContain("Malta");
  expect(errors).toEqual([]);
});

test("groupings: a body's members now and on a day in the past, the candidates apart, and the regions inside a country", async ({ page }) => {
  const errors = await view(page, "groupings/eu");
  const members = page.locator(at("grouping-members")).locator("tbody tr");
  await expect(members).toHaveCount(27);
  await expect(page.locator(at("grouping-others"))).toContainText("Ukraine");
  await page.locator(at("grouping-day")).fill("2019-06-30");
  await page.locator(at("grouping-day")).dispatchEvent("change");
  await expect(page.locator(at("grouping-members")).locator("tbody tr")).toHaveCount(28);
  await expect(page.locator(at("grouping-members"))).toContainText("GB");
  await page.locator(at("grouping-pick")).selectOption("middle-east");
  await expect(page).toHaveURL(/#\/groupings\/middle-east$/);
  await expect(page.locator(at("grouping-note"))).toContainText("No definition is agreed");
  const file = await download(page, "grouping-downloads", "json");
  expect(JSON.parse(file.text).map((one) => one.code)).toContain("EG");
  await page.goto("http://kuni.test/?lang=ja#/groupings/jp-kanto");
  await page.waitForSelector('main[data-view-ready="true"]');
  await expect(page.locator(at("grouping-members"))).toContainText("東京都");
  await expect(page.locator(at("grouping-head"))).toContainText("関東地方");
  expect(errors).toEqual([]);
});

test("the quiz: a seed gives the same questions, a right answer adds to the streak and a wrong one ends it", async ({ page }) => {
  const errors = await view(page, "quiz/capital/4242");
  const question = page.locator(at("quiz-question"));
  const first = await question.textContent();
  const answer = await question.getAttribute("data-answer");
  await page.locator(at("quiz-choices")).locator(`[data-code="${answer}"]`).click();
  await expect(page.locator(at("quiz-feedback"))).toHaveText("Right!");
  await expect(page.locator(at("quiz-streak"))).toHaveText("1");
  await page.locator(at("quiz-next")).click();
  await expect(page.locator(at("quiz-number"))).toContainText("Question 2");
  const second = await question.getAttribute("data-answer");
  await page.locator(at("quiz-choices")).locator(`button:not([data-code="${second}"])`).first().click();
  await expect(page.locator(at("quiz-streak"))).toHaveText("0");
  await expect(page.locator(at("quiz-right"))).toHaveText("1/2");
  await expect(page.locator(at("quiz-link"))).toContainText("#/quiz/capital/4242");
  const results = await download(page, "quiz-downloads", "csv");
  expect(results.text.trim().split("\n")).toHaveLength(3);
  // The same link, opened again, asks the same first question.
  await page.reload();
  await page.waitForSelector('main[data-view-ready="true"]');
  await expect(question).toHaveText(first);
  for (const kind of ["subdivision", "calling"]) {
    await page.locator(at("quiz-kinds")).locator(`[data-kind="${kind}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#/quiz/${kind}/\\d+$`));
    await expect(page.locator(at("quiz-choices")).locator("button")).toHaveCount(4);
  }
  expect(errors).toEqual([]);
});

test("the form widget: a country feeds its regions, in either language, a typed name picks the country, and the code is there to copy", async ({ page }) => {
  const errors = await view(page, "form/JP");
  await expect(page.locator(at("form-region")).locator("option")).toHaveCount(47);
  await page.locator(at("form-country")).selectOption("CA");
  await expect(page.locator(at("form-region")).locator("option")).toHaveCount(13);
  await page.locator(at("form-region")).selectOption("CA-ON");
  await expect(page.locator(at("form-output"))).toContainText('"region": "CA-ON"');
  await page.locator(at("form-lang")).locator('[data-lang-widget="ja"]').click();
  await expect(page.locator(at("form-region"))).toContainText("オンタリオ州");
  await expect(page.locator(at("form-output"))).toContainText("カナダ");
  await type(page, "form-typed", "Holland");
  await expect(page.locator(at("form-country"))).toHaveValue("NL");
  await expect(page.locator(at("form-typed-answer"))).toContainText("NL");
  await expect(page.locator(at("form-snippet"))).toContainText("cdn.jsdelivr.net/npm/@johnmorrisdotca/kuni@1");
  await expect(page.locator(at("form-snippet"))).toContainText('const lang = "ja"');
  const regions = await download(page, "form-downloads-regions", "csv");
  expect(regions.name).toBe("kuni-nl-regions.csv");
  expect(regions.text).toContain("NL-");
  expect(errors).toEqual([]);
});

test("search by calling code, currency and domain lists every country that uses it", async ({ page }) => {
  const errors = await open(page, "?lang=en");
  await type(page, "search-input", "+1");
  expect(await page.locator(at("search-list")).locator("li").count()).toBeGreaterThan(20);
  await page.locator(at("search-by")).locator('[data-by="currency"]').click();
  await type(page, "search-input", "eur");
  await expect(page.locator(at("search-list"))).toContainText("Germany");
  await page.locator(at("search-by")).locator('[data-by="tld"]').click();
  await type(page, "search-input", ".uk");
  await expect(page.locator(at("search-list")).locator("li")).toHaveCount(1);
  await expect(page.locator(at("search-list"))).toContainText("UK");
  await type(page, "search-input", ".zz");
  await expect(page.locator(at("search-answer"))).toContainText("No country uses that");
  expect(errors).toEqual([]);
});

test("data quality: the counts, the gaps by country, the disagreements and the facts no source gives", async ({ page }) => {
  const errors = await view(page, "quality");
  await expect(page.locator(at("quality-cards"))).toContainText("3,527/3,594");
  await expect(page.locator(at("quality-gaps"))).toContainText("Estonia");
  expect(await page.locator(at("quality-disagreements")).locator("tbody tr").count()).toBeGreaterThan(100);
  await expect(page.locator(at("quality-fact-gaps"))).toContainText("Antarctica");
  await expect(page.locator(at("quality-bodies"))).toContainText("NATO");
  expect(errors).toEqual([]);
});
