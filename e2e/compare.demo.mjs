// Compare's look: a colour for each outline and the capitals' dots, both kept in the address, so a link shows what
// the person who sent it saw.
import { Buffer } from "node:buffer";

import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open } from "./demo.mjs";

/** Open Compare at an address and wait for both outlines to be drawn. */
async function compare(page, address = "compare/JP/GB") {
  const errors = await open(page, `?lang=en&help=off#/${address}`);
  await page.waitForSelector('main[data-view-ready="true"]');
  for (const side of [0, 1]) await expect(page.locator(at(`compare-outline-${side}`)).locator("svg")).toBeAttached();
  return errors;
}

/** What colour an outline is filled with, as the browser computes it. */
const fill = (page, side) => page.locator(at(`compare-outline-${side}`)).locator("path").first().evaluate((path) => getComputedStyle(path).fill);

test("the two outlines are different colours at first, each with a dot on its capital", async ({ page }) => {
  const errors = await compare(page);
  expect(await fill(page, 0)).not.toBe(await fill(page, 1));
  await expect(page.locator(at("compare-colour-0"))).toHaveValue("#2f5d4a");
  await expect(page.locator(at("compare-colour-1"))).toHaveValue("#b5452c");
  for (const side of [0, 1]) await expect(page.locator(at(`compare-outline-${side}`)).locator(".capital-dot")).toHaveCount(1);
  await expect(page.locator(at("compare-capitals"))).toHaveAttribute("aria-pressed", "true");
  expect(page.url()).not.toContain("colours=");
  expect(errors).toEqual([]);
});

test("a colour is picked for each country on its own, the outline follows, and the address says so", async ({ page }) => {
  const errors = await compare(page);
  const before = await fill(page, 1);
  await page.locator(at("compare-colour-0")).fill("#3366cc");
  await expect.poll(() => fill(page, 0)).toBe("rgb(51, 102, 204)");
  expect(await fill(page, 1)).toBe(before);
  await expect(page).toHaveURL(/#\/compare\/JP\/GB\?colours=3366cc,b5452c$/);
  await page.locator(at("compare-colour-1")).fill("#e0a800");
  await expect.poll(() => fill(page, 1)).toBe("rgb(224, 168, 0)");
  await expect(page).toHaveURL(/\?colours=3366cc,e0a800$/);
  expect(errors).toEqual([]);
});

test("capitals off removes both dots, and on puts them back", async ({ page }) => {
  const errors = await compare(page);
  const dots = page.locator(".compare-pictures .capital-dot");
  await expect(dots).toHaveCount(2);
  await page.locator(at("compare-capitals")).click();
  await expect(page.locator(at("compare-capitals"))).toHaveAttribute("aria-pressed", "false");
  await expect(dots).toHaveCount(0);
  await expect(page).toHaveURL(/\?capitals=off$/);
  // The outlines are still there, and still two colours.
  for (const side of [0, 1]) await expect(page.locator(at(`compare-outline-${side}`)).locator("svg")).toBeAttached();
  await page.locator(at("compare-capitals")).click();
  await expect(dots).toHaveCount(2);
  expect(page.url()).not.toContain("capitals=");
  expect(errors).toEqual([]);
});

test("a shared link, and a reload of it, shows the same colours and the same dots", async ({ page, browser }) => {
  await compare(page, "compare/FR/DE?colours=336699,cc6600&capitals=off");
  await expect(page.locator(at("compare-colour-0"))).toHaveValue("#336699");
  await expect(page.locator(at("compare-colour-1"))).toHaveValue("#cc6600");
  await expect(page.locator(at("compare-capitals"))).toHaveAttribute("aria-pressed", "false");
  expect(await fill(page, 0)).toBe("rgb(51, 102, 153)");
  expect(await fill(page, 1)).toBe("rgb(204, 102, 0)");
  await expect(page.locator(".compare-pictures .capital-dot")).toHaveCount(0);
  // A reload of the link is the same page again.
  await page.reload();
  await page.waitForSelector('main[data-view-ready="true"]');
  await expect(page.locator(at("compare-outline-1")).locator("svg")).toBeAttached();
  await expect(page.locator(at("compare-colour-0"))).toHaveValue("#336699");
  await expect(page.locator(at("compare-capitals"))).toHaveAttribute("aria-pressed", "false");
  expect(await fill(page, 0)).toBe("rgb(51, 102, 153)");
  await expect(page.locator(".compare-pictures .capital-dot")).toHaveCount(0);
  // And another person's browser, given the same link, sees it too.
  const other = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  const second = await other.newPage();
  await compare(second, "compare/FR/DE?colours=336699,cc6600&capitals=off");
  await expect(second.locator(at("compare-colour-1"))).toHaveValue("#cc6600");
  await other.close();
});

test("swapping the countries takes each one's colour with it, and a bad colour in a link falls back", async ({ page }) => {
  await compare(page, "compare/JP/GB?colours=336699,nonsense");
  await expect(page.locator(at("compare-colour-1"))).toHaveValue("#b5452c");
  await page.locator(at("compare-swap")).click();
  await expect(page).toHaveURL(/#\/compare\/GB\/JP\?colours=b5452c,336699$/);
  await expect(page.locator(at("compare-colour-0"))).toHaveValue("#b5452c");
  await expect(page.locator(at("compare-colour-1"))).toHaveValue("#336699");
  await noSidewaysScroll(page);
});

test("the Markdown and SQL downloads of a compared pair hold both countries", async ({ page }) => {
  await compare(page);
  const take = async (kind) => {
    const [file] = await Promise.all([page.waitForEvent("download"), page.locator(at("compare-downloads")).locator(`[data-kind="${kind}"]`).click()]);
    const chunks = [];
    for await (const chunk of await file.createReadStream()) chunks.push(chunk);
    return { name: file.suggestedFilename(), text: Buffer.concat(chunks).toString("utf8") };
  };
  const md = await take("md");
  expect(md.name).toBe("kuni-jp-gb.md");
  expect(md.text).toContain("日本");
  expect(md.text.trim().split("\n")).toHaveLength(4);
  const sql = await take("sql");
  expect(sql.name).toBe("kuni-jp-gb.sql");
  expect(sql.text).toContain("'日本'");
  expect(sql.text.match(/^INSERT INTO "countries"/gm)).toHaveLength(2);
});
