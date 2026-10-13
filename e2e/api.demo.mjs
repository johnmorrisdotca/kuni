// The preserved API anchors lead to native examples, return meanings and interface fields.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

test("API anchors retain entry coverage and link to examples and fields", async ({ page }) => {
  await serve(page);
  const index = "http://kuni.test/api.html";
  await page.goto(index);
  for (const entry of ["@johnmorrisdotca/kuni", "@johnmorrisdotca/kuni/codes", "@johnmorrisdotca/kuni/subdivisions", "@johnmorrisdotca/kuni/load", "@johnmorrisdotca/kuni/facts", "@johnmorrisdotca/kuni/subdivision-facts", "@johnmorrisdotca/kuni/groupings"]) {
    await expect(page.locator("main").getByRole("heading", { name: entry, exact: true })).toHaveCount(1);
  }
  for (const [anchor, text] of [["main-countryByName", "Holland"], ["subdivisions-subdivisionByName", "Punjab"]]) {
    await page.locator(`#${anchor} h3 a`).click();
    await expect(page.locator("main pre[data-lang=ts]")).toContainText(text);
    await page.goto(index);
  }
  await page.locator("#facts-facts h3 a").click();
  await expect(page.locator("main .docs-output")).toContainText("123802000");
  await expect(page.locator("main")).toContainText("null");
  await page.goto(index);
  await page.locator("#groupings-Grouping h3 a").click();
  await expect(page.locator("main")).toContainText("asOf");
  await expect(page.locator("footer")).toContainText("Kuni");
  await noSidewaysScroll(page);
  await page.goto("http://kuni.test/docs/index.html");
  await expect(page.locator("main")).toContainText("npm install @johnmorrisdotca/kuni");
});
