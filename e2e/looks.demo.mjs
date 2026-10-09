// How the demo looks and holds still: finger-sized controls, light and dark, English and Japanese, and no sideways
// scroll, at a phone's width and a desk's.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, type } from "./demo.mjs";

for (const scheme of ["light", "dark"]) {
  for (const lang of ["en", "ja"]) {
    test(`fits the page without a sideways scroll, in ${scheme} and ${lang}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      const errors = await open(page, `?lang=${lang}`);
      await noSidewaysScroll(page);
      // The longest things the demo shows still fit: a long official name, a long list, a long code answer.
      await type(page, "find-input", "Saint Helena");
      await type(page, "code-input", "GB-ENG");
      await page.locator(at("list-country")).selectOption("GB");
      await expect(page.locator(at("list-rows")).locator("tr").first()).toBeVisible();
      await type(page, "find-input", "x".repeat(200));
      await noSidewaysScroll(page);
      const paper = await page.locator(".fam-panels").first().evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(paper).toBe(scheme === "dark" ? "rgb(29, 32, 30)" : "rgb(251, 248, 241)");
      expect(errors).toEqual([]);
    });
  }
}

test("every button and field is a finger tall", async ({ page }) => {
  await open(page);
  const small = await page.evaluate(() => [...document.querySelectorAll("main button, main input, main select, nav a, nav button")].filter((one) => one.offsetParent !== null).map((one) => ({ name: one.textContent.trim() || one.id || one.dataset.lang, ...one.getBoundingClientRect().toJSON() })).filter((one) => one.height < 43.5 || (one.width < 43.5 && one.name !== "")));
  expect(small).toEqual([]);
});

test("each panel keeps its answer's box while it is typed in or picked, so nothing below it moves", async ({ page }) => {
  await open(page);
  for (const [box, change] of [
    ["find-answer", () => type(page, "find-input", "Atlantis")],
    ["code-answer", () => type(page, "code-input", "FR-75C")],
    ["list-box", () => page.locator(at("list-country")).selectOption("SI")],
  ]) {
    const before = await page.locator(at(box)).boundingBox();
    await change();
    const after = await page.locator(at(box)).boundingBox();
    expect(Math.abs(after.height - before.height), box).toBeLessThan(0.5);
    expect(Math.abs(after.width - before.width), box).toBeLessThan(0.5);
  }
});

test("the fields are real fields: no zoom on a phone", async ({ page }) => {
  await open(page);
  const sizes = await page.evaluate(() => [...document.querySelectorAll("main input, main select")].map((one) => parseFloat(getComputedStyle(one).fontSize)));
  expect(sizes.length).toBeGreaterThanOrEqual(3);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16);
});
