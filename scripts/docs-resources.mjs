import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function writeResourceCatalogue(root) {
  const pkg = JSON.parse(readFileSync(join(root,"package.json"),"utf8"));
  const site = JSON.parse(readFileSync(join(root,"docs/site.json"),"utf8"));
  const resources = Object.keys(pkg.exports).filter(key=>/^\.\/(subdivisions|subdivision-facts)\/[a-z]{2}$/.test(key));
  for(const language of ["en","ja"]){
    const title = language === "en" ? "Country resource catalogue" : "国ごとのデータ一覧";
    const description = language === "en" ? "Every existing fixed subdivision and subdivision-fact import." : "既存の行政区画と行政区画の情報の、固定importの一覧です。";
    const lines=["---",`title: ${title}`,"section: explanation","order: 12",`description: ${description}`,"---","",language === "en" ? "## Fixed country resources" : "## 国ごとの固定のデータ","",language === "en" ? "These names point to the same files as the retained wildcard imports. Both default and named exports keep their existing native lists. Countries without stored subdivisions have no fixed resource; use the loader for dynamic country selection, including empty-list and null results." : "この名前は、残すワイルドカードと同じファイルを指します。既定と名前付きのexportは元の一覧です。行政区画を収録していない国には固定のデータがありません。動的に選ぶ国には読み込みを使い、空の一覧とnullを区別します。","",language === "en" ? "| Import | Resource |" : "| Import | データ |","| --- | --- |"];
    for(const key of resources) lines.push(`| \`${pkg.name}/${key.slice(2)}\` | [${site.entries[key][language]}](entry:${key.slice(2).replaceAll("/","-")}) |`);
    lines.push("",language === "en" ? "See [loading one country](loading-country-data.md) and [subdivision facts](../subdivision-facts.md)." : "[国ごとの読み込み](loading-country-data.md)と[行政区画の情報](../../subdivision-facts.md)も読めます。","");
    const directory = join(root,"docs/guides",language === "ja" ? "ja" : "");mkdirSync(directory,{recursive:true});writeFileSync(join(directory,"country-resources.md"),lines.join("\n"));
  }
  console.log(`Country resource catalogue: ${resources.length} existing fixed paths.`);
}

writeResourceCatalogue(process.cwd());
