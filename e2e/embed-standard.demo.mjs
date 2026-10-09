import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { serve } from "./demo.mjs";

async function artwork(page) {
  const requests = [];
  await page.route("https://cdn.jsdelivr.net/npm/**", (route) => {
    const match = /@johnmorrisdotca\/(hata|chizu)@1\/dist\/(.*)$/.exec(new URL(route.request().url()).pathname);
    requests.push(route.request().url());
    if (!match) return route.fulfill({ status: 404, body: "" });
    const root = dirname(fileURLToPath(import.meta.url));
    const file = match[1] === "hata" ? join(root, "fixtures", `hata-${match[2].split("/").at(-1)}`) : join(root, "..", "node_modules", "@johnmorrisdotca", "chizu", "dist", match[2]);
    return route.fulfill({ status: existsSync(file) ? 200 : 404, contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body: existsSync(file) ? readFileSync(file) : "" });
  });
  return requests;
}

test("the shared card builder composes Hata and Chizu and writes every host format", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await serve(page); const requests = await artwork(page);
  await page.goto("http://kuni.test/builder.html?lang=en");
  const card = page.locator("#bld-stage kuni-card");
  await expect(card).toHaveAttribute("data-ready", "true");
  await expect(card.locator('[data-field="name"]')).toHaveText("Japan");
  await expect(card.locator(".flag svg")).toBeVisible();
  await expect(card.locator(".map svg")).toBeVisible();
  for (const format of ["element", "iframe", "module", "react", "vue", "svelte", "angular", "html", "url"]) {
    await page.locator(`#bld-formats [data-format="${format}"]`).click();
    await expect(page.locator("#bld-code")).not.toHaveText("");
  }
  expect(requests.some((url) => url.includes("hata@1"))).toBe(true);
  expect(requests.some((url) => url.includes("chizu@1"))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("subdivision cards use their own dated facts and map while marking country fields", async ({ page }) => {
  await serve(page); await artwork(page);
  await page.goto("http://kuni.test/embed/?code=JP-13&fields=name+codes+flag+map+capital+population+currency&lang=ja&theme=dark");
  const card = page.locator("kuni-card");
  await expect(card).toHaveAttribute("data-ready", "true");
  await expect(card.locator('[data-field="name"]')).toHaveText("東京都");
  await expect(card.locator('[data-field="codes"] dd')).toHaveText("JP-13");
  await expect(card.locator('[data-field="population"] dd')).toContainText("2022");
  await expect(card.locator('[data-field="currency"] dt')).toHaveText("通貨（国）");
  await expect(card.locator('.map .cz-region[data-code="13"]').first()).toHaveAttribute("data-tone", "selected");
  expect(await card.evaluate((element) => element.style.colorScheme)).toBe("dark");
});

test("plain facts need no artwork request, query values are validated and labels remain text", async ({ page }) => {
  await serve(page); const requests = await artwork(page);
  const label = '<img src=x onerror="bad">';
  await page.goto(`http://kuni.test/embed/?code=JPN&fields=name+codes+capital&theme=invalid&width=Infinity&label=${encodeURIComponent(label)}`);
  const card = page.locator("kuni-card"); await expect(card).toHaveAttribute("data-ready", "true");
  await expect(card.locator("article")).toHaveAttribute("aria-label", label);
  await expect(card.locator('[data-field="codes"] dd')).toHaveText("JP · JPN · 392");
  expect(requests).toEqual([]); expect(await page.locator("img").count()).toBe(0);
  await expect(card).not.toHaveAttribute("width", /.*/); await expect(card).not.toHaveAttribute("theme", /.*/);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await card.evaluate(async (element) => {
    const { KuniCard, defineCard } = await import("../dist/element.js");
    defineCard("article-card"); defineCard("article-card");
    window.sameClass = element instanceof KuniCard;
    element.code = "CA"; element.fields = ["name", "codes"]; element.width = 240;
  });
  await expect(card.locator('[data-field="name"]')).toHaveText("Canada");
  expect(await page.evaluate(() => window.sameClass)).toBe(true);
});

test("load events forward the same JSON-safe detail and unavailable artwork preserves facts", async ({ page }) => {
  await serve(page);
  await page.route("https://cdn.jsdelivr.net/npm/**", (route) => route.fulfill({ status: 404, body: "" }));
  await page.route("http://host.test/", (route) => route.fulfill({ contentType: "text/html", body: '<script>window.messages=[];addEventListener("message",event=>{if(event.origin==="http://kuni.test")messages.push(event.data);});</script><iframe src="http://kuni.test/embed/?code=JP&fields=name+flag+capital" width="360" height="500"></iframe>' }));
  await page.goto("http://host.test/");
  const card = page.frameLocator("iframe").locator("kuni-card");
  await expect(card).toHaveAttribute("data-ready", "true");
  await expect(card.locator('.flag')).toContainText("Unavailable");
  await expect(card.locator('[data-field="capital"] dd')).toHaveText("Tokyo");
  await expect.poll(() => page.evaluate(() => window.messages.some((message) => message.type === "kuni-load"))).toBe(true);
  const message = await page.evaluate(() => window.messages.find((made) => made.type === "kuni-load"));
  expect(message.detail).toEqual({ code: "JP", country: "JP", fields: ["name", "flag", "capital"] });
  expect(JSON.parse(JSON.stringify(message))).toEqual(message);
});

test("a late artwork response cannot replace a new card, and host SVGs discard active content", async ({ page }) => {
  await serve(page);
  await page.goto("http://kuni.test/embed/?fields=name+codes");
  const card = page.locator("kuni-card"); await expect(card).toHaveAttribute("data-ready", "true");
  await card.evaluate((element) => {
    element.options = { flag: (code) => code === "JP" ? new Promise((resolve) => { window.finishOldFlag = resolve; }) : Promise.resolve('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="bad"><script>bad</script><rect width="10" height="10"/></svg>') };
    element.fields = "name flag";
  });
  await expect.poll(() => page.evaluate(() => typeof window.finishOldFlag)).toBe("function");
  await card.evaluate((element) => { element.code = "CA"; });
  await expect(card).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => window.finishOldFlag('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle r="2"/></svg>'));
  await expect(card.locator('[data-field="name"]')).toHaveText("Canada");
  await expect(card.locator(".flag rect")).toHaveCount(1);
  await expect(card.locator(".flag circle,.flag script")).toHaveCount(0);
  await expect(card.locator(".flag svg")).not.toHaveAttribute("onload", /.*/);
});


test("copied iframe code fits a narrow article without inner scrolling", async ({ page }) => {
  await serve(page); await artwork(page);
  await page.goto("http://kuni.test/builder.html?lang=en");
  await expect(page.locator("#bld-stage kuni-card")).toHaveAttribute("data-ready", "true");
  await page.locator('#bld-formats [data-format="iframe"]').click();
  const code = (await page.locator("#bld-code").textContent()).replaceAll("https://johnmorrisdotca.github.io/kuni/", "http://kuni.test/").replace('loading="lazy"', '');
  await page.route("http://article.test/", (route) => route.fulfill({ contentType: "text/html", body: `<style>body{margin:0;width:320px}</style>${code}` }));
  await page.goto("http://article.test/");
  await expect(page.frameLocator("iframe").locator("kuni-card")).toHaveAttribute("data-ready", "true");
  const child = page.frames().find((frame) => frame.url().startsWith("http://kuni.test/embed/"));
  expect(await child.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
