import { VERSION } from "./dist/index.js";
import { KuniCard, KUNI_CARD_FIELDS, KUNI_CARD_OPTION_KEYS, readCardColors } from "./dist/element.js";
import "./dist/element-define.js";
import { familyEmbedBuilder, FAMILY_EMBED_BUILDER_WORDS } from "./family-embed-builder.js";
const words = {
  en: {
    ...FAMILY_EMBED_BUILDER_WORDS.en,
    pitch: "Choose a country or subdivision and its fields, preview the card, and copy the code for your page.",
    name: "Kuni means country in Japanese.",
    nameLink: "About the name",
    foot: "The setup is in the link. No personal data is stored.",
    toGallery: "The country tables",
    makerCard: "A country card",
    makerCardSays: "Names and dated facts from Kuni, flags from Hata, maps from Chizu.",
    copyLink: "Copy a link to this card"
  },
  ja: {
    ...FAMILY_EMBED_BUILDER_WORDS.ja,
    pitch: "国や行政区画と表示する項目を選び、カードを確認して、ページに埋め込むコードをコピーできます。",
    name: "「国」は英語の country に当たる日本語です。",
    nameLink: "名前について",
    foot: "設定はリンクに入ります。個人情報は保存しません。",
    toGallery: "国の一覧",
    makerCard: "国のカード",
    makerCardSays: "国名、年つきの統計値、Hataの旗、Chizuの地図を表示します。",
    copyLink: "このカードへのリンクをコピー"
  },
};
const row = (id, kind, en, ja, extra = {}) => ({ id, kind, group: "card", names: { card: id }, say: { en: { label: en[0], help: en[1] }, ja: { label: ja[0], help: ja[1] } }, ...extra });
const defaultFields = "name codes flag map capital population area currency";
const options = [
  row("code", "text", ["Code", "Country code (JP, JPN or 392), or an ISO subdivision code such as JP-13."], ["国コード", "国のコード（JP、JPN、392など）、またはJP-13などの行政区画のISOコードです。"], { default: "JP" }),
  row("fields", "text", ["Fields", `Names separated by spaces, in the order to show them: ${KUNI_CARD_FIELDS.join(", ")}.`], ["表示する項目", `項目名を表示する順に、空白で区切ります：${KUNI_CARD_FIELDS.join("、")}。`], { default: defaultFields }),
  row("colors", "text", ["Colours per place", "Comma-separated code:hex-colour pairs, for example JP:#2f6b4f or JP-13:#8a3b3b. Unlisted places keep the theme colour."], ["場所ごとの色", "JP:#2f6b4f、JP-13:#8a3b3bのように、地域コードと16進数の色をカンマで区切ります。指定のない場所は配色の色を使います。"]),
  row("capital", "boolean", ["Show capitals", "Show the map's capital markers. The capital text field remains available."], ["首都を表示", "地図に首都の点を表示します。首都の文字の項目はそのまま表示できます。"], { default: true }),
  row("size", "choice", ["Display size", "Small, medium or large cards."], ["表示の大きさ", "小・中・大のカードを選びます。"], { default: "medium", choices: ["small", "medium", "large"] }),
  row("width", "number", ["Width", "The card's width in pixels, fitting a narrower parent."], ["幅", "カードの幅をピクセルで指定します。狭い表示枠にも収まります。"], { range: { min: 100, max: 2000, step: 10 } }),
  row("theme", "choice", ["Theme", "Light, dark or the device's preference."], ["配色", "明るい配色・暗い配色、または端末の設定に合わせます。"], { default: "auto", choices: ["auto", "light", "dark"] }),
  row("lang", "choice", ["Language", "The language of the names and field labels."], ["言語", "名前と項目名の言語です。"], { choices: ["en", "ja"] }),
  row("label", "text", ["Spoken label", "An optional label for a screen reader."], ["読み上げる名前", "スクリーンリーダー用の名前です。指定は任意です。"]),
];
const heights = {};
const key = (settings) => JSON.stringify(settings);
let mounted;
const page = globalThis.familyLanguage({ id: "kuni", words, onChange: () => mounted?.draw() });
const builder = familyEmbedBuilder({ id: "kuni", packageName: "@johnmorrisdotca/kuni", major: VERSION.split(".")[0], site: "https://johnmorrisdotca.github.io/kuni/", title: "Kuni · country card", titleJa: "国のカードの埋め込み", options, groups: { card: { en: "The card", ja: "カードの設定" } }, leftOut: { "options.colors": "The colours control writes colors.", "options.capital": "The capital switch writes capital.", "options.flag": "Host SVG loaders belong to host code; the builder uses Hata on jsDelivr.", "options.map": "Host SVG loaders belong to host code; the builder uses Chizu on jsDelivr." }, makers: { card: { names: "card", element: "card", tag: "kuni-card", embed: "embed/", required: ["code"], description: "makerCardSays", formats: ["element", "iframe", "module", "react", "vue", "svelte", "angular", "html", "url"], width: 600, height: (settings) => heights[key(settings)] ?? ({ small: 700, medium: 800, large: 900 }[settings.size] ?? 800) } }, code: ({ maker, format, settings }) => {
  if (readCardColors(settings.colors ?? null) === null) return null;
  if (String(settings.fields ?? defaultFields).split(/[\s,]+/).filter(Boolean).some((field) => !KUNI_CARD_FIELDS.includes(field))) return null;
  if ((format === "iframe" || format === "url") && settings.lang === undefined) return builder.codeFor(maker, format, options, { ...settings, lang: page.lang });
  return undefined;
} });
builder.validateCoverage({ card: KuniCard.observedAttributes, options: KUNI_CARD_OPTION_KEYS });
mounted = builder.mount({ words, language: () => page, initial: { card: { code: "JP", lang: page.lang } }, renderPreview: ({ stage, attrs, settings }) => {
  const card = globalThis.document.createElement("kuni-card");
  for (const [name, value] of attrs) card.setAttribute(name, value);
  card.addEventListener("kuni-load", () => { heights[key(settings)] = Math.ceil(card.getBoundingClientRect().height) + 24; mounted?.refreshCode(); });
  stage.append(card);
  return { destroy() { card.remove(); } };
} });
