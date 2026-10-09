// The three panels: type in each and read the answer, press an example, pick a country, and read it in Japanese.
import { expect, test } from "@playwright/test";

import { at, open, tap, type } from "./demo.mjs";

const answer = (page, name) => page.locator(at(`${name}-answer`));
const call = (page, name) => page.locator(at(`${name}-call`));

test("find a country: a name in either language, in kana, an alias or a code finds it, and a non-country says so", async ({ page }) => {
  const errors = await open(page, "?lang=en");
  await expect(answer(page, "find")).toContainText("DE · DEU · 276");
  await expect(answer(page, "find")).toContainText("Germany");
  await expect(answer(page, "find")).toContainText("Deutschland");
  await expect(call(page, "find")).toContainText('countryByName("ドイツ")  // DE');
  await type(page, "find-input", "どいつ");
  await expect(answer(page, "find")).toContainText("DE · DEU");
  await type(page, "find-input", "Holland");
  await expect(answer(page, "find")).toContainText("オランダ");
  await type(page, "find-input", "米国");
  await expect(answer(page, "find")).toContainText("United States");
  await expect(answer(page, "find")).toContainText("+1");
  await type(page, "find-input", "japan");
  await expect(answer(page, "find")).toContainText("にほん");
  await expect(answer(page, "find")).toContainText("47 (prefecture)");
  await type(page, "find-input", "Atlantis");
  await expect(answer(page, "find")).toContainText("No country goes by that name");
  await expect(call(page, "find")).toContainText("null");
  expect(errors).toEqual([]);
});

test("the examples fill the box and are pressed while they are on show", async ({ page }, testInfo) => {
  const errors = await open(page, "?lang=en");
  const buttons = page.locator(at("find-examples")).locator("button");
  await tap(page, buttons.filter({ hasText: "UK" }), testInfo);
  await expect(page.locator(at("find-input"))).toHaveValue("UK");
  await expect(answer(page, "find")).toContainText("GB · GBR · 826");
  await expect(buttons.filter({ hasText: "UK" })).toHaveAttribute("aria-pressed", "true");
  await type(page, "find-input", "U");
  await expect(buttons.filter({ hasText: "UK" })).toHaveAttribute("aria-pressed", "false");
  expect(errors).toEqual([]);
});

test("subdivisions of a country: Japan's 47 load first, another country loads when picked, and a missing Japanese name says so", async ({ page }, testInfo) => {
  const errors = await open(page, "?lang=en");
  const rows = page.locator(at("list-rows")).locator("tr");
  await expect(rows).toHaveCount(47);
  await expect(rows.nth(12)).toContainText("JP-13");
  await expect(rows.nth(12)).toContainText("東京都");
  await expect(page.locator(at("list-summary"))).toContainText("47 subdivisions; the main kind is prefecture.");
  await expect(page.locator(at("list-summary"))).toContainText("Every one has a Japanese name");
  await expect(call(page, "list")).toContainText('loadSubdivisions("JP")');
  await page.locator(at("list-country")).selectOption("CA");
  await expect(rows).toHaveCount(13);
  await expect(page.locator(at("list-rows"))).toContainText("オンタリオ州");
  await tap(page, page.locator(at("list-examples")).locator("button").filter({ hasText: "SI" }), testInfo);
  await expect(rows).toHaveCount(212);
  await expect(page.locator(at("list-summary"))).toHaveAttribute("data-gaps", /^[1-9]/);
  await expect(page.locator(at("list-rows")).locator("td.missing").first()).toHaveText("none");
  await tap(page, page.locator(at("list-examples")).locator("button").filter({ hasText: "FR" }), testInfo);
  await expect(rows).toHaveCount(26);
  await tap(page, page.locator(at("list-level")).locator('[data-level="all"]'), testInfo);
  await expect(rows).not.toHaveCount(26);
  expect(await rows.count()).toBeGreaterThan(100);
  await page.locator(at("list-country")).selectOption("AQ");
  await expect(rows).toHaveCount(0);
  await expect(page.locator(at("list-summary"))).toContainText("no subdivisions");
  expect(errors).toEqual([]);
});

test("look up a code: a prefecture, a province, a department inside its region, a country's code, and a non-code", async ({ page }) => {
  const errors = await open(page, "?lang=en");
  await expect(answer(page, "code")).toContainText("JP-13 · 13");
  await expect(answer(page, "code")).toContainText("東京都");
  await expect(answer(page, "code")).toContainText("とうきょうと");
  await expect(answer(page, "code")).toContainText("metropolis");
  await type(page, "code-input", "ca-on");
  await expect(answer(page, "code")).toContainText("Ontario");
  await expect(answer(page, "code")).toContainText("オンタリオ州");
  await type(page, "code-input", "FR-75C");
  await expect(answer(page, "code")).toContainText("FR-IDF");
  await type(page, "code-input", "392");
  await expect(answer(page, "code")).toContainText("JP · JPN · 392");
  await type(page, "code-input", "XX-99");
  await expect(answer(page, "code")).toContainText("Not a code here");
  expect(errors).toEqual([]);
});

test("in Japanese: the page's words, the countries in Japanese order, and the kinds of place in Japanese", async ({ page }) => {
  const errors = await open(page, "?lang=ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("#find-title")).toHaveText(/国を探す/);
  await expect(answer(page, "find")).toContainText("ヨーロッパ");
  await expect(answer(page, "code")).toContainText("都");
  await expect(page.locator(at("list-summary"))).toContainText("47件");
  const first = await page.locator(at("list-country")).locator("option").first().textContent();
  expect(first).toContain("アイスランド");
  await expect(page.locator("#unreviewed")).toBeVisible();
  await page.locator('[data-lang="en"]').click();
  await expect(page.locator("#find-title")).toHaveText(/Find a country/);
  await expect(page.locator(at("list-country"))).toHaveValue("JP");
  expect(errors).toEqual([]);
});
