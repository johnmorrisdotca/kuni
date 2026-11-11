// The words of the family's page frame on kuni's demo pages (kazoku-ui's page-frame), in one place: what each page is, in
// English and Japanese, and the data's credit line with the link to NOTICE.md. scripts/site.mjs writes them into the
// pages; the tests read the same table. The credit carries the two credits their terms ask for wherever the figures are
// shown: Statistics Canada's ("Adapted from …", no endorsement) and the OECD's.

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

/** The data's credit line on every page, with the credits Statistics Canada's and the OECD's terms ask for. */
export const FRAME_CREDITS = {
  en: "Names and codes from Unicode CLDR; facts, cities and readings from Wikidata (CC0), Natural Earth (public domain) and Japan Post. Urban areas: adapted from Statistics Canada (not an endorsement by Statistics Canada), the U.S. Census Bureau, and OECD (2026), Functional urban areas: population by age and sex, OECD Data Explorer.",
  ja: "国名とコードはUnicode CLDR、データ・都市・読みはWikidata（CC0）、Natural Earth（パブリックドメイン）、日本郵便のものです。都市圏は、カナダ統計局（Statistics Canada）のデータを加工したもの（同局の承認を受けたものではありません）、アメリカ国勢調査局（U.S. Census Bureau）のもの、OECD (2026), Functional urban areas: population by age and sex, OECD Data Explorerによります。",
};

/** The small credit line in the corner of the embed page. */
export const EMBED_CREDITS = {
  en: "Data: Unicode CLDR, Wikidata and Natural Earth",
  ja: "データ：Unicode CLDR、Wikidata、Natural Earth",
};
