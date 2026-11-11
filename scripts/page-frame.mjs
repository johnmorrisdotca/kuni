// The words of the family's page frame on kuni's demo pages (kazoku-ui's page-frame), in one place: what each page is, in
// English and Japanese, and the data's credit line with the link to NOTICE.md. scripts/site.mjs writes them into the
// pages; the tests read the same table. The credit line names every source of the package's data, and carries word for
// word the credits Statistics Canada's and the OECD's terms ask for, read from NOTICE.md so the two cannot disagree.

import { readFileSync } from "node:fs";

/** Where every credit is written in full. */
export const NOTICE = "https://github.com/johnmorrisdotca/kuni/blob/main/NOTICE.md";

export const INDEX_DESCRIPTION =
  "Look up any country and its states, provinces and prefectures by ISO 3166 code or by name, in English or Japanese, in your browser. A typed, zero-dependency dataset from Unicode CLDR and Wikidata. Free and open source.";
export const BUILDER_DESCRIPTION = "Choose a country or subdivision, preview its card and copy the embed code.";

/** What each page is: its header line, its title and its description, in both languages. */
export const FRAME_TEXTS = {
  "index.html": {
    en: { name: "Kuni 国", what: "countries, their subdivisions and cities", description: INDEX_DESCRIPTION },
    ja: {
      name: "国 Kuni",
      what: "国と行政区画と都市",
      description:
        "世界の国と、その州・県・省などの行政区画を、ISO 3166のコードと英語・日本語の名前で、ブラウザーの中で調べられます。Unicode CLDRとWikidataから作った、型つきで依存のないデータです。無料のオープンソースです。",
    },
  },
  "builder.html": {
    en: { name: "Kuni 国", what: "country card builder", description: BUILDER_DESCRIPTION },
    ja: {
      name: "国 Kuni",
      what: "国のカードの埋め込みコードを作る",
      description: "国か行政区画を選んでカードをプレビューし、埋め込みのコードをコピーできます。",
    },
  },
};

/** NOTICE.md's quoted credits ("> " lines), each as one line, that begin with these words. */
const quoted = (start) => {
  const notice = readFileSync(new URL("../NOTICE.md", import.meta.url), "utf8");
  const found = [...notice.matchAll(/((?:^[ \t]*> .*\n)+)/gm)]
    .map((match) =>
      match[1]
        .trim()
        .split("\n")
        .map((line) => line.trim().replace(/^> /, ""))
        .join(" "),
    )
    .filter((text) => text.startsWith(start));
  if (found.length === 0) throw new Error(`NOTICE.md quotes no credit starting "${start}"`);
  return found;
};
/** The credits the urban areas' terms ask for, word for word as NOTICE.md gives them. */
const REQUIRED = [...quoted("Adapted from Statistics Canada"), ...quoted("OECD (2026)")].join(" ");

/** The data's credit line on every page. */
export const FRAME_CREDITS = {
  en: `Names and codes from Unicode CLDR; facts, cities and readings from Wikidata (CC0), Natural Earth (public domain) and Japan Post. Urban areas from the U.S. Census Bureau, the National Bureau of Statistics of China (2020 census) and the Census of India 2011, and: ${REQUIRED}`,
  ja: `国名とコードはUnicode CLDR、データ・都市・読みはWikidata（CC0）、Natural Earth（パブリックドメイン）、日本郵便のものです。都市圏は、アメリカ国勢調査局（U.S. Census Bureau）、中国国家統計局（2020年の国勢調査）、インドの国勢調査（2011年）と、次の出典（原文のまま）によります：${REQUIRED}`,
};

/** The small credit line in the corner of the embed page. */
export const EMBED_CREDITS = {
  en: "Data: Unicode CLDR, Wikidata and Natural Earth",
  ja: "データ：Unicode CLDR、Wikidata、Natural Earth",
};
