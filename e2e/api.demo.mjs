// The API reference page: every entry point and export, and the family's header and footer around them.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

test("api.html lists every entry point with its exports, and fits a phone", async ({ page }) => {
  await serve(page);
  await page.goto("http://kuni.test/api.html?lang=en");
  for (const entry of ["@johnmorrisdotca/kuni", "@johnmorrisdotca/kuni/codes", "@johnmorrisdotca/kuni/subdivisions", "@johnmorrisdotca/kuni/load", "@johnmorrisdotca/kuni/facts", "@johnmorrisdotca/kuni/subdivision-facts", "@johnmorrisdotca/kuni/groupings"]) {
    await expect(page.locator(".api-entry h2", { hasText: new RegExp(`^${entry.replace(/\//g, "\\/")}$`) })).toHaveCount(1);
  }
  await expect(page.locator("#main-countryByName")).toContainText("Holland");
  await expect(page.locator("#subdivisions-subdivisionByName")).toContainText("Punjab");
  // Each function shows its parameters, what it returns and an example; each interface its fields.
  await expect(page.locator("#facts-facts .api-example")).toContainText("123802000");
  await expect(page.locator("#facts-facts .api-returns")).toContainText("null");
  await expect(page.locator("#groupings-Grouping .api-fields")).toContainText("asOf");
  await expect(page.locator("footer")).toContainText("npm install @johnmorrisdotca/kuni");
  await noSidewaysScroll(page);
});
