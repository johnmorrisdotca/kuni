// The API reference page: every entry point and export, and the family's header and footer around them.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

test("api.html lists every entry point with its exports, and fits a phone", async ({ page }) => {
  await serve(page);
  await page.goto("http://kuni.test/api.html?lang=en");
  for (const entry of ["@johnmorrisdotca/kuni", "@johnmorrisdotca/kuni/codes", "@johnmorrisdotca/kuni/subdivisions", "@johnmorrisdotca/kuni/load"]) {
    await expect(page.locator(".api-entry h2", { hasText: new RegExp(`^${entry.replace(/\//g, "\\/")}$`) })).toHaveCount(1);
  }
  await expect(page.locator("#main-countryByName")).toContainText("Holland");
  await expect(page.locator("#subdivisions-subdivisionByName")).toContainText("Punjab");
  await expect(page.locator("footer")).toContainText("npm install @johnmorrisdotca/kuni");
  await noSidewaysScroll(page);
});
