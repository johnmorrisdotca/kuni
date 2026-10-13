import { expect,test } from "@playwright/test";
import { artwork } from "./artwork.mjs";
import { serve } from "./demo.mjs";
for(const file of ["index.html","builder.html"]){
 test(`Docs follows initial and live language on ${file}`,async({page})=>{
  await serve(page);await artwork(page);await page.goto(`http://kuni.test/${file}?lang=ja`);
  const docs=page.locator('[data-say="pageDocs"]');
  await expect(docs).toHaveText("ドキュメント");await expect(docs).toHaveAttribute("href","docs/ja/index.html");
  await page.locator('button[data-lang="en"]').click();await expect(docs).toHaveAttribute("href","docs/index.html");
  await page.locator('button[data-lang="ja"]').click();await docs.click();
  await expect(page).toHaveURL("http://kuni.test/docs/ja/index.html");
  await expect(page.locator("html")).toHaveAttribute("lang","ja");
 });
}
