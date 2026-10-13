<h1 align="center">Kuni <sub>国</sub> — Countries, states and provinces</h1>

<p align="center"><strong>Kuni 国: every country and its states, provinces and prefectures, with ISO 3166 codes and names in English and Japanese.</strong><br>
A typed, zero-dependency dataset from Unicode CLDR and Wikidata, loaded one country at a time, for JavaScript and TypeScript. Look up a country or a region by code or by what somebody typed, in either language, and load only the countries you need.</p>

<p align="center" lang="ja">世界の国と、州・県・省などの行政区画を、ISO 3166のコードと英語・日本語の名前で収めた、依存パッケージのないTypeScriptデータセット。</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/kuni/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/kuni/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/kuni"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/kuni?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
  <img alt="TypeScript" src="https://img.shields.io/badge/types-TypeScript-3178c6">
  <a href="https://johnmorrisdotca.github.io/kuni/docs/api/main/index.html"><img alt="21.4 kB minified and gzipped" src="https://img.shields.io/badge/min%2Bgzip-21.4%20kB-2f5d4a"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/kuni#provenance"><img alt="Published with npm provenance" src="https://img.shields.io/badge/npm-provenance-2f5d4a"></a>
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/kuni/"><strong>Try it →</strong></a> · <a href="https://johnmorrisdotca.github.io/kuni/docs/">Documentation</a> · <a href="https://johnmorrisdotca.github.io/kuni/docs/guides/getting-started.html">Getting started</a> · <a href="https://johnmorrisdotca.github.io/kuni/api.html">API reference</a></p>

<table align="center">
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/hero-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/hero-desk-light.webp" alt="The demo on a desk, in English: the header with its language chooser, the Docs and API reference links, five cloth patches and the Help switch, then a row of views (Look up, Country, Compare, All countries, Groupings, Quiz, Form widget, Data quality) and the Look up view's panels. Find a country shows ドイツ typed in and its answer: the German flag, DE, DEU and 276, Germany, ドイツ, Deutschland, Europe, Berlin, +49, EUR, .de, two time zones, and 16 states. Subdivisions of a country shows Japan picked and a table of its prefectures with code, English and Japanese name, from JP-01 Hokkaidō 北海道, and the line 47 subdivisions; the main kind is prefecture. Look up a code begins below with JP-13 typed in." width="600">
</picture>
<br><em>The demo on a desk: a country found by its Japanese name, and Japan's prefectures loaded on demand.</em>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/hero-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/hero-phone-light.webp" alt="The demo on a phone, in Japanese: the header, its language chooser, patches and buttons, then the first panel, 国を探す, with ドイツ typed in below the view choices and the Docs/API navigation" width="190">
</picture>
<br><em>On a phone, in Japanese, in the device's light or dark.</em>
</td>
</tr>
</table>

Kuni is the country list every site ends up keeping for itself, kept once, with what a form, a profile page or a map quiz asks of it: the 250 countries with their ISO 3166-1 codes, and their 5,050 ISO 3166-2 subdivisions (Japan's prefectures, the American states, Canada's provinces and territories, France's regions and departments), each named in English and in Japanese. Beside the names, in entries of their own so a page that only names countries does not carry them: each country's capital, population and area with the year each is for, coordinates, land borders, driving side and calendar conventions; each subdivision's capital, population and area; and 107 groupings, from the continents and the EU to Japan's eight regions; and, in a list of its own so no country picker shows them, the 31 countries that were withdrawn from ISO 3166-1 (the Soviet Union, Yugoslavia, Czechoslovakia, East Germany, Zaire) with the codes they held and what came after. The names are Unicode CLDR's, with Wikidata filling the gaps, so they are the same on a server and in a browser, which `Intl.DisplayNames` is not. It looks a country up by what somebody typed (Holland, ＵＳＡ, にほん, 米国) and a region by its code or its name. It works in [the demo](https://johnmorrisdotca.github.io/kuni/) with nothing to install.

## In 30 seconds

```sh
npm install @johnmorrisdotca/kuni
```

```ts
import { country, countryByName, countryName } from "@johnmorrisdotca/kuni";

countryByName("ドイツ")?.alpha2;          // "DE"; "Germany" and "Deutschland" find it too
countryByName("Holland")?.name.ja;        // "オランダ"
countryName("US", "ja", { short: true }); // "アメリカ"
country("JP")?.callingCode;               // "+81"
```

The figures and the groupings are entries of their own:

```ts
import { facts } from "@johnmorrisdotca/kuni/facts";
import { membersOf } from "@johnmorrisdotca/kuni/groupings";

facts("JP")?.population;                 // 123802000, for 2024
facts("FR")?.borders;                    // ["AD", "BE", "BR", "CH", "DE", "ES", "IT", "LU", "MC", "SR"]
membersOf("eu", { on: "2019-06-30" });   // the 28, the United Kingdom among them
```

One country's subdivisions are an entry of their own, so a page that needs Japan's prefectures carries Japan's and no other:

```ts
import prefectures from "@johnmorrisdotca/kuni/subdivisions/jp";

prefectures.length;   // 47
prefectures[12];      // { code: "JP-13", name: { en: "Tokyo", ja: "東京都" }, reading: "とうきょうと", type: "metropolis", ... }
```

Install the scoped name: the unscoped `kuni` on npm is somebody else's package.

## Who it is for

- **Forms and profiles** that ask where somebody lives: a country select in either language, a state or prefecture select under it, and a free-text box whose "UK" or "Holland" still resolves to a code.
- **Sites rendered on a server and hydrated in a browser**, where `Intl.DisplayNames` spells some countries differently in Node and in Chromium and the page does not match itself.
- **Japanese-language pages** that need アメリカ合衆国 and オンタリオ州, the four kinds of Japanese prefecture (都道府県), and prefecture readings in kana.
- **Maps, quizzes and data pipelines** that join their own figures to a country or a region by its ISO code, or want the capital, the population, the neighbours and the groupings a quiz asks about.
- **Old records**: a table that still says SU, YU, CS, DD or ZR, or an export from before 1993, which `withdrawn(code)` names and points to the countries that came after.
- **Build scripts** in sister packages (a map that draws any grouping, a site with a page per prefecture) that read plain numbers, stable codes and as-of dates.

## Features

### What's in it

- **Every country.** The 249 ISO 3166-1 codes and Kosovo (XK, user-assigned), each with alpha-2, alpha-3 and numeric codes, its flag, continent, UN M49 subregion, calling code, currencies, top-level domain, capital, time zones and languages.
- **Every subdivision.** 5,050 ISO 3166-2 codes in 200 countries: 3,594 at the first level and 1,456 below it (France's departments in its regions, England's councils in England), each with its level and parent.
- **English and Japanese names** from Unicode CLDR 48.2, with CLDR's short forms (UK, アメリカ) and variants (Ivory Coast, 象牙海岸). Japanese names for 3,527 of the 3,594 first-level subdivisions, and `null` for the rest, never a guess.
- **Found by what somebody typed.** Case, accents, full-width letters, half-width kana and hiragana or katakana are folded away, and the aliases people use (Holland, UK, Burma, 米国) are known.
- **Kinds of place**: prefecture, state, province, region and some thirty more, read from Wikidata, with the Japanese word for each (県, 州, 省) where a country's names agree on one.
- **Capitals in both languages.** Every country's capital in English and Japanese (東京, キーウ), and every subdivision's capital Wikidata names (3,968 of 5,050), with readings in kana for Japan's prefectural capitals (さっぽろし).
- **Facts with their dates** (`/facts`): population and area with the year each is for, coordinates of the country and its capital, land borders (confirmed by Natural Earth's outlines, so islands have none), the side of the road it drives on, and CLDR's first day of the week, measurement system, paper size and clock. `distanceKm` between two points.
- **Facts about subdivisions** (`/subdivision-facts`): each one's capital, population, area and coordinates, one country at a time; complete for Japan's 47 prefectures.
- **Withdrawn countries** (`/withdrawn`): the 31 entries of ISO 3166-3 (SU, YU, CS, DD, ZR, TP, AN, BU and the rest), each with the four-letter code, the alpha-2, alpha-3 and numeric codes it held, its name in English and Japanese, the years the code was in force and the codes ISO lists for what came after it. They are never in `countries()`, so a picker does not offer the Soviet Union; a lookup by an old code says what it was.
- **Olympic codes**: `country(code).ioc` is the International Olympic Committee's three-letter code ("JPN", "GER" for Germany, "SUI" for Switzerland) for the 209 countries that have one.
- **Groupings** (`/groupings`): the seven continents, the 30 UN M49 areas, 23 international bodies (the UN, the EU, the euro area, Schengen, NATO, the G7 and G20, ASEAN and more) with the days members joined and left, 16 informal groupings (the Middle East, the Balkans, Scandinavia, the Sahel) each with the definition it follows, and regions inside a country (Japan's 地方, the US Census regions, Canada's regions).
- **Small where it matters.** The countries and lookups are 21.4 kB minified and gzipped; one country's subdivisions are their own entry (Japan's 47, measured separately) or a dynamic import.
- **Typed, frozen, pure and the same everywhere.** ESM and CommonJS, types for both, no dependencies, no network and no `Intl`. Every export carries a doc comment with a runnable example, which an editor shows on hover and the tests run.
- **A demo to use, not just to read.** A page for each country, two countries compared, every country in a sortable table, the groupings explorer, three seeded quizzes, a country and region form widget with its code to copy, and the data's quality in the open, each at an address of its own and downloadable as CSV, JSON, text, a Markdown table or SQL: [the demo](https://johnmorrisdotca.github.io/kuni/).
- **Never a guess.** A value no source gives is `null`, with the reason written down (`docs/facts.md`, `docs/subdivision-facts.md`, `docs/ja-gaps.md`), never a plausible filler.

[Build a country or subdivision card](https://johnmorrisdotca.github.io/kuni/builder.html). The [embed guide](docs/embeds.md) covers its fields, properties and messages. Cards support per-place `colors` and `capital="off"` for the native Chizu map; capital text stays separate. [Map colours and markers](docs/embeds.md#map-colours-and-markers).

## Use it in your project

### Install under another name

```sh
npm install countries@npm:@johnmorrisdotca/kuni
```

```ts no-check
import { country } from "countries";
console.log(country("JP")?.name.en);
```

### Install

```sh
npm install @johnmorrisdotca/kuni
# or: pnpm add @johnmorrisdotca/kuni
# or: yarn add @johnmorrisdotca/kuni
```

It ships ES modules and CommonJS, with types for both and `sideEffects: false`. CommonJS is there because Node scripts and some packages that will read it (an address parser among them) want `require`; the rest of the family is ES modules only.

### The entry points

| Entry | What it carries | Size (minified + gzip) |
| --- | --- | --- |
| `@johnmorrisdotca/kuni` | The 250 countries and the country lookups | 21.4 kB min+gzip |
| `@johnmorrisdotca/kuni/element` | `KuniCard`, `defineCard`, `KUNI_CARD_FIELDS`, `KUNI_CARD_OPTION_KEYS`, `readCardColors`; `KuniCardOptions` | 290.5 kB min+gzip |
| `@johnmorrisdotca/kuni/element/define` | registers the tag and re-exports the element API | 290.5 kB min+gzip |
| `@johnmorrisdotca/kuni/codes` | The 250 codes and `isCountryCode`, nothing else | 0.6 kB min+gzip |
| `@johnmorrisdotca/kuni/subdivisions/<code>` | One country's subdivisions, every level (`/subdivisions/jp`, `/subdivisions/us`, lower case) | 0.4–5.0 kB; Japan 1.5 kB |
| `@johnmorrisdotca/kuni/load` | `loadSubdivisions(code)`, one dynamic import per country | 97.6 kB min+gzip |
| `@johnmorrisdotca/kuni/subdivisions` | All 5,050 subdivisions and the subdivision lookups | 88.4 kB min+gzip |
| `@johnmorrisdotca/kuni/facts` | Every country's population, area, coordinates, borders, driving side and conventions | 8.6 kB min+gzip |
| `@johnmorrisdotca/kuni/subdivision-facts` | `loadSubdivisionFacts(code)`, one dynamic import per country | 161.1 kB min+gzip |
| `@johnmorrisdotca/kuni/subdivision-facts/<code>` | One country's subdivision facts (`/subdivision-facts/jp`) | 0.4–7.3 kB; Japan 2.4 kB |
| `@johnmorrisdotca/kuni/groupings` | The 107 groupings and their lookups | 15.9 kB min+gzip |
| `@johnmorrisdotca/kuni/withdrawn` | The 31 withdrawn countries (ISO 3166-3) and `withdrawn(code)` | 2.1 kB min+gzip |

### 1. The countries

```ts
import { countries, country, countryByName } from "@johnmorrisdotca/kuni";

country("jp");                      // alpha-2 in either case, "JPN" or "392" too
countryByName("cote d'ivoire");     // Côte d'Ivoire, CI
countries({ order: "ja" });         // in Japanese order, by reading where a name is in kanji
country("DE")?.ioc;                 // "GER", the Olympic committee's code (absent where Wikidata gives none)
```

### 2. One country's subdivisions

```ts
import states from "@johnmorrisdotca/kuni/subdivisions/us";
// const { SUBDIVISIONS } = require("@johnmorrisdotca/kuni/subdivisions/us");

states.filter((one) => one.type === "state").length;   // 50; DC and the six outlying areas make 57
```

### 3. Loaded when they are wanted

```ts
import { loadSubdivisions } from "@johnmorrisdotca/kuni/load";

const regions = await loadSubdivisions(form.country);   // [] for a country with none, null for a code that is not one
```

### 4. Every subdivision, on a server

```ts
import { subdivision, subdivisionByName, subdivisions, subdivisionTypeLabel } from "@johnmorrisdotca/kuni/subdivisions";

subdivisionByName("オンタリオ州", { country: "CA" })?.code;   // "CA-ON"
subdivisions("FR")?.length;                                  // 26 regions and overseas parts
subdivisions("FR", { level: "all" })?.length;                // 124, with the departments
subdivisionTypeLabel("JP-13", "ja");                         // "都"
```

### 5. The facts about a country

```ts
import { allFacts, distanceKm, facts, FACTS_READ } from "@johnmorrisdotca/kuni/facts";

const japan = facts("JP")!;
japan.population;     // 123802000
japan.populationYear; // 2024
japan.areaKm2;        // 377973.68
japan.capitalPoint;   // { lat: 35.69, lon: 139.69 }
japan.borders;        // [], an island
japan.drivingSide;    // "left"
japan.weekStart;      // "sun"
Math.round(distanceKm(japan.capitalPoint!, facts("GB")!.capitalPoint!)); // 9558
FACTS_READ;           // "2026-10-09", the day Wikidata was read
```

Every figure is Wikidata's, as it stood on the day in `FACTS_READ`. A country with no permanent population (Antarctica) has `population: null`, and an island `borders: []`; `docs/facts.md` lists every gap with its reason.

### 6. The facts about subdivisions

```ts
import { loadSubdivisionFacts } from "@johnmorrisdotca/kuni/subdivision-facts";
import prefectures from "@johnmorrisdotca/kuni/subdivision-facts/jp";

prefectures[0].capital;     // { en: "Sapporo", ja: "札幌市", reading: "さっぽろし" }
prefectures[12].population; // 14264798, for 2022
(await loadSubdivisionFacts("US"))?.find((one) => one.code === "US-CA")?.capital?.en; // "Sacramento"
```

### 7. Groupings

```ts
import { grouping, groupings, groupingsOf, membersOf } from "@johnmorrisdotca/kuni/groupings";

grouping("eu")?.name.ja;                                  // "欧州連合"
grouping("eu")?.others?.filter((one) => one.status === "candidate").length; // 9
membersOf("eu", { on: "2019-06-30" })?.includes("GB");     // true
groupingsOf("NO", { kind: "membership" }).map((one) => one.id); // ["un", "schengen", "eea", "nato", "oecd", "nordic-council"]
membersOf("jp-kanto");                                    // ["JP-08", ..., "JP-14"]
groupings({ kind: "informal" }).map((one) => one.id);     // ["middle-east", "latin-america", ...]
```

Each grouping has `definition`, `source` (name, address and licence) and `asOf`; an informal one has `informal: true` and, where definitions disagree, a `note`. `docs/groupings.md` cross-checks the bodies' lists against Wikidata and says what each grouping follows.

### 8. Withdrawn countries

```ts
import { withdrawn, withdrawnCountries } from "@johnmorrisdotca/kuni/withdrawn";

withdrawn("SU")[0].name.en;          // "Soviet Union" (also by "SUHH", "SUN" or "810")
withdrawn("SU")[0].until;            // "1992"
withdrawn("YU")[0].successors;       // ["CS"]: ISO's new code, itself withdrawn (below)
withdrawn("CS").map((one) => one.code); // ["CSXX", "CSHH"]: Serbia and Montenegro, then Czechoslovakia
withdrawn("BY")[0].reusedBy;         // "BY": the Byelorussian SSR's code is Belarus's now
withdrawnCountries().length;         // 31
```

The 31 are the entries of ISO 3166-3, whose codes, years and successors are the published list's, transcribed once and pinned whole by a test; their names in English and Japanese are Wikidata's (property P773). A successor is exactly the new code ISO lists, and may itself be withdrawn: Yugoslavia's is `CS`, which `withdrawn("CS")` answers as Serbia and Montenegro first and Czechoslovakia after. [docs/withdrawn.md](./docs/withdrawn.md) says how, and lists their Japanese names for review. They are a list of their own: `country("SU")` is still `null`, `isCountryCode("SU")` is still `false` and `countries()` never holds them. A lookup by a code answers every withdrawn country that held it, the last one first, and an empty list for anything else; a record whose alpha-2 code a current country holds now (`BY`, `AI`, `BQ`, `GE`, `SK`) says so in `reusedBy`.

### In a page, with no bundler

```html
<script type="module">
  import { countryByName } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kuni@1/dist/index.js";
  console.log(countryByName("Holland")?.name.ja);   // オランダ
</script>
```

### A card in a framework

React 19:

```jsx
import "@johnmorrisdotca/kuni/element/define";
export function Japan() { return <kuni-card code="JP" fields="name flag map capital" />; }
```

Configure Vue's template compiler with `isCustomElement: tag => tag.startsWith("kuni-")`:

```vue
<script setup>
import "@johnmorrisdotca/kuni/element/define";
</script>
<template><kuni-card code="JP" /></template>
```

```svelte
<script>
  import "@johnmorrisdotca/kuni/element/define";
</script>
<kuni-card code="JP" fields="name codes capital"></kuni-card>
```

The `@johnmorrisdotca/kuni/element` entry exports the class and `defineCard(tag?)`; `@johnmorrisdotca/kuni/element/define` registers the tag. Both are safe to import on a server. The builder also supplies plain HTML, Vue, Svelte, Angular and iframe examples.

## Examples

### A country select, in either language

```ts
import { countries } from "@johnmorrisdotca/kuni";

const options = (lang: "en" | "ja") =>
  countries({ order: lang }).map((one) => ({ value: one.alpha2, label: `${one.flag} ${one.name[lang]}` }));
```

### A state or prefecture select that follows it

```ts
import { loadSubdivisions } from "@johnmorrisdotca/kuni/load";

async function regionOptions(countryCode: string, lang: "en" | "ja") {
  const list = (await loadSubdivisions(countryCode)) ?? [];
  return list.filter((one) => one.level === 1).map((one) => ({ value: one.code, label: one.name[lang] ?? one.name.en }));
}
```

The Japanese name is `null` where no source has one, so the fallback to English is the page's choice, made in the open.

### What somebody typed into a free-text country box

```ts
import { countryByName } from "@johnmorrisdotca/kuni";

for (const typed of ["UK", "the Netherlands", "ＵＳＡ", "にほん", "Burma", "Narnia"]) {
  console.log(typed, countryByName(typed)?.alpha2 ?? "(keep their words, no flag)");
}
// UK GB · the Netherlands NL · ＵＳＡ US · にほん JP · Burma MM · Narnia (keep their words, no flag)
```

### A name that is two places

```ts
import { subdivisionByName, subdivisionsByName } from "@johnmorrisdotca/kuni/subdivisions";

subdivisionByName("Punjab");                       // null: it is in India and in Pakistan
subdivisionsByName("Punjab").map((one) => one.code); // ["IN-PB", "PK-PB"]
subdivisionByName("Punjab", { country: "PK" })?.code; // "PK-PB"
```


<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/find-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/find-desk-light.webp" alt="The find panel showing a country found by its Japanese name and its native codes and fields" width="600">
</picture>
<br><em>The find panel shows a country found by its Japanese name and its native codes and fields.</em>

<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/list-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/list-desk-light.webp" alt="The list panel showing Japan’s prefectures loaded as a native subdivision table" width="600">
</picture>
<br><em>The list panel shows Japan’s prefectures loaded as a native subdivision table.</em>

<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/code-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/code-desk-light.webp" alt="The code panel showing a full subdivision code resolved to its native record" width="600">
</picture>
<br><em>The code panel shows a full subdivision code resolved to its native record.</em>

<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/search-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kuni/main/docs/images/search-desk-light.webp" alt="The search panel showing all countries using the typed calling code, currency or domain" width="600">
</picture>
<br><em>The search panel shows all countries using the typed calling code, currency or domain.</em>

### Validate an exact country code

```ts
import { isCountryCode } from "@johnmorrisdotca/kuni/codes";
console.log(isCountryCode("JP"),isCountryCode("jp"));
```

### Read a dated country figure

```ts
import { facts,FACTS_READ } from "@johnmorrisdotca/kuni/facts";
const japan=facts("JP");
console.log(FACTS_READ,japan?.population,japan?.populationYear);
```

## API

The [documentation](https://johnmorrisdotca.github.io/kuni/docs/) provides paired guides, local search and checked examples. The [complete country-resource catalogue](docs/guides/country-resources.md) names every existing per-country import, including subdivisions and their facts.

The [API reference](https://johnmorrisdotca.github.io/kuni/api.html) lists every export of every entry point with its signature and its comment. `pnpm docs:site` retains the index anchors and builds individual reference pages from source, so the documentation stays with the code.

| Entry | Exports |
| --- | --- |
| `@johnmorrisdotca/kuni` | `country`, `countries`, `countryByName`, `countryName`, `flag`, `continentName`, `subregionName`, `fold`, `isCountryCode`, `COUNTRY_CODES`, `CONTINENTS`, `LANGUAGES`, `VERSION`, and the types `Country`, `CountryCode`, `Continent`, `Language`, `CountriesOptions`, `CountryOrder`, `CountryNameOptions`, `Subdivision` and `SubdivisionType` |
| `@johnmorrisdotca/kuni/codes` | `COUNTRY_CODES`, `isCountryCode` and the type `CountryCode` |
| `@johnmorrisdotca/kuni/subdivisions` | `subdivisions`, `allSubdivisions`, `subdivision`, `subdivisionByShortCode`, `subdivisionByName`, `subdivisionsByName`, `subdivisionTypeLabel`, `SUBDIVISION_TYPES`, and the types `Subdivision`, `SubdivisionType`, `Level`, `SubdivisionsOptions` and `SubdivisionByNameOptions` |
| `@johnmorrisdotca/kuni/subdivisions/<code>` | the country's list as the default export and as `SUBDIVISIONS` |
| `@johnmorrisdotca/kuni/load` | `loadSubdivisions` and the type `Subdivision` |
| `@johnmorrisdotca/kuni/facts` | `facts`, `allFacts`, `distanceKm`, `FACTS_READ`, and the types `CountryFacts`, `LatLon`, `DrivingSide`, `WeekStart`, `MeasurementSystem`, `PaperSize` and `HourCycle` |
| `@johnmorrisdotca/kuni/subdivision-facts` | `loadSubdivisionFacts`, and the types `SubdivisionFacts` and `LatLon` |
| `@johnmorrisdotca/kuni/subdivision-facts/<code>` | the country's subdivision facts as the default export and as `SUBDIVISION_FACTS` |
| `@johnmorrisdotca/kuni/withdrawn` | `withdrawn`, `withdrawnCountries`, `WITHDRAWN_READ` and the type `WithdrawnCountry` |
| `@johnmorrisdotca/kuni/groupings` | `groupings`, `grouping`, `groupingsOf`, `membersOf`, `GROUPING_KINDS`, and the types `Grouping`, `GroupingKind`, `GroupingMember`, `GroupingName`, `GroupingOther`, `GroupingSource`, `GroupingStatus`, `GroupingsOptions` and `GroupingDateOptions` |

A country:

```ts
interface Country {
  alpha2: string;                 // "JP"
  alpha3: string;                 // "JPN"
  numeric: string;                // "392"
  kind: "iso" | "user";           // "user" for Kosovo, XK
  name: { en: string; ja: string; local?: string };   // local: its own name, "Deutschland"
  shortName?: { en?: string; ja?: string };           // "UK", アメリカ
  reading?: string;               // hiragana, where the Japanese name is in kanji: "にほん"
  flag: string;                   // the flag emoji
  continent: "AF" | "AN" | "AS" | "EU" | "NA" | "OC" | "SA";   // from UN M49; Antarctica by hand
  subregion?: string;             // UN M49: "030", Eastern Asia
  callingCode?: string;           // "+81"; "+1" for every member of the North American plan
  currency?: string[];            // ["JPY"]
  tld?: string;                   // "jp"; "uk" for GB
  capital?: { en: string; ja: string };   // "Tokyo", 東京
  zones?: string[];               // ["Asia/Tokyo"]
  languages?: string[];           // ["ja"]
  subdivisionType?: SubdivisionType;   // "prefecture"
  aliases?: string[];             // other names it goes by
}
```

A subdivision:

```ts
interface Subdivision {
  code: string;                   // "JP-13", always the full ISO 3166-2 code
  country: string;                // "JP"
  shortCode: string;              // "13"
  type: SubdivisionType | null;   // "metropolis"; null where no source says
  level: 1 | 2 | 3;
  parent?: string;                // "FR-IDF" for FR-75C, below the first level
  name: { en: string; ja: string | null };
  reading?: string;               // Japan's prefectures: "とうきょうと"
}
```

The facts about a country:

```ts
interface CountryFacts {
  alpha2: string;                 // "JP"
  population: number | null;      // 123802000; null with no permanent population
  populationYear: number | null;  // 2024
  areaKm2: number | null;         // 377973.68
  areaYear: number | null;        // where Wikidata gives one
  areaOf: "whole" | "land" | null;
  point: { lat: number; lon: number } | null;         // Wikidata's point for the country, not a computed centroid
  capitalPoint: { lat: number; lon: number } | null;
  borders: readonly string[];     // land borders, alpha-2; [] for an island
  drivingSide: "left" | "right" | null;
  weekStart: "mon" | "sun" | "sat" | "fri";
  measurement: "metric" | "US" | "UK";
  paper: "A4" | "US-Letter";
  hourCycle: "h12" | "h23";
}
```

A grouping:

```ts
interface Grouping {
  id: string;                     // "eu", "m49-030", "continent-as", "middle-east", "jp-kanto"
  kind: "continent" | "m49" | "membership" | "informal" | "subdivision";
  name: { en: string; ja: string };
  shortName?: { en?: string; ja?: string };   // "EU"
  reading?: string;               // "おうしゅうれんごう"
  otherNames?: readonly { en: string; ja: string; reading?: string }[];   // Kansai (関西地方) for the Kinki region
  informal: boolean;
  country?: string;               // for regions inside a country: "JP"
  parent?: string;                // for UN M49: "m49-142"
  sets?: readonly string[];       // for regions inside a country: the divisions it is part of
  members: readonly string[];     // alpha-2 codes, or ISO 3166-2 inside a country
  periods?: readonly { code: string; since: string | null; until: string | null }[];   // bodies only
  others?: readonly { code: string; status: "candidate" | "associate" | "observer" | "suspended" }[];
  definition: string;
  note?: string;
  source: { name: string; url: string; licence: string };
  asOf: string;                   // "2026-10-09"
}
```

Every function is pure and every object it hands out is frozen. A code or a name that is not one gives `null` (or an empty list), never a near miss.

## Theming

None, on purpose: Kuni is data and lookups, with no colours, markup or styles, so a page built on it looks however the page looks. The demo is the worked example: its panels are drawn by [`demo/demo.js`](./demo/demo.js) and [`demo/kuni.css`](./demo/kuni.css), over the family's shared stylesheet.

## Limits

| Limit | Value | Where |
| --- | --- | --- |
| Countries | 250: the 249 ISO 3166-1 codes and XK | `COUNTRY_CODES` |
| Subdivisions | 5,050 in 200 countries; 3,594 at level 1, 1,456 at level 2, none at level 3 | `allSubdivisions` |
| Japanese names of subdivisions | 3,527 of 3,594 at level 1 (3,376 from CLDR, 50 written by hand, 101 from Wikidata); 4,751 of all 5,050 | `name.ja`, [docs/ja-gaps.md](./docs/ja-gaps.md) |
| Kinds of place | known for 4,745 of 5,050; the rest are `null` | `type` |
| Readings in kana | Japan's 47 prefectures, and the 53 country names written with kanji | `reading` |
| Capitals | 245 of 250 countries, each in English and Japanese; 3,968 of 5,050 subdivisions (2,856 of 3,594 at the first level), Japan's 47 with readings | `capital`, `SubdivisionFacts.capital` |
| Population | 249 of 250 countries, with the year; 4,244 of 5,050 subdivisions | `/facts`, `/subdivision-facts` |
| Area | 250 of 250 countries; 4,371 of 5,050 subdivisions | `areaKm2` |
| Coordinates | 250 of 250 countries, 245 capitals; 4,780 of 5,050 subdivisions | `point`, `capitalPoint` |
| Land borders | 327 pairs; 166 countries have one or more, 84 (islands, and Antarctica) none | `borders` |
| Olympic codes | 209 of 250 countries | `ioc` |
| Withdrawn countries | the 31 of ISO 3166-3, each with a successor | `/withdrawn` |
| Groupings | 7 continents, 30 UN M49 areas, 23 bodies, 16 informal, 31 inside a country | `/groupings` |
| Languages | English and Japanese | `LANGUAGES` |

Not here: cities, postal codes, outlines, and names in other languages. CLDR marks nearly all of its Japanese subdivision names "provisional"; where Wikidata names a place differently, CLDR's name is kept and the difference listed in [docs/disagreements.md](./docs/disagreements.md) (226 of 4,313 compared) for review. CLDR's trailing brackets (セント・ポール (ドミニカ国), バリンゴ (カウンティ)) are taken off by a rule listed in [docs/name-rules.md](./docs/name-rules.md), and 56 Japanese names a reviewer found wrong or out of date are written by hand, with their reasons, in [docs/disagreements.md](./docs/disagreements.md). Every English name is checked against Wikidata's English label for the patterns that were found wrong in 1.0.0 (a name cut short, an adjective for a name, marks stripped, a name swapped with a neighbour's, an old place's name on a reused code); 32 are corrected by hand, with their reasons, in the same file. Where ISO 3166-2 has changed since CLDR's release (Norway's counties of 2024), the codes follow ISO.

## Accessibility

Kuni draws nothing: it gives a page names, codes and readings, so what it can do for accessibility is give names a screen reader can say and a person can find by typing.

- **Names in the reader's language.** Every country and nearly every first-level subdivision has a Japanese name, and Japan's prefectures and the kanji country names have readings in hiragana, for furigana or for a screen reader.
- **Forgiving search.** A person who types in kana, in full-width letters or without accents still finds the place.
- **Flags are never the only label.** A flag is an emoji that many screen readers say only as two letters; the demo always writes the name beside it.
- **In the demo's views**, the country page's outline has a label naming the country, every table has column headers (the table of every country sorts from its headers, which are buttons and say which way they sort), a quiz's answer is said in words as well as colour, and the time in each zone is text, not a moving picture.
- **In the demo**, every panel is a labelled region, each box has a label, the answers are `aria-live`, the list of subdivisions is a real table with column headers, every control is at least 44 pixels square, and the page fits a phone at 390 pixels.
- **Not yet.** The demo's colours have not been measured against WCAG contrast ratios, and its Japanese has not been read by a native reader (see [Languages](#languages)).

## Browser and runtime support

The package is data and plain functions, so it runs anywhere JavaScript does: any browser with ES2022 and Unicode property escapes in regular expressions, and Node. Building it from source and running its data scripts needs Node 24 or later, which runs TypeScript as it is; CI tests on Node 24 on Linux, macOS and Windows. The demo is played in a real Chromium at a phone's width (with touch) and a desk's, and in WebKit at a phone's width.

## Languages

Every name is in English and Japanese. The country names, the subdivision names and the kinds of place in Japanese come from Unicode CLDR and Wikidata. A few strings are written for this package: the aliases (米国, 英国, 豪州), the readings of the 53 country names written with kanji and of two prefectures, the Japanese type words the build looks for, and the demo's own words. The subdivision names have been read through by a strong, but not a native, reader of Japanese, who corrected 46 of them (listed in [docs/disagreements.md](./docs/disagreements.md), with six questions left open). **Japanese: included; not yet reviewed by a native reader. Corrections welcome.** Every line of the demo is listed beside its English in [docs/strings-ja.md](./docs/strings-ja.md), and there is an [issue template](https://github.com/johnmorrisdotca/kuni/issues/new?template=fix-a-translation.md) for fixing a name or a line.

## Roadmap

Not here yet, and each welcome as an [issue](https://github.com/johnmorrisdotca/kuni/issues):

- Names in other languages, from CLDR, as an entry per language (`/names/<locale>`).
- Each subdivision's name in its own language and script (Wikidata P1705).
- The Japanese names CLDR and Wikidata both lack (listed in [docs/ja-gaps.md](./docs/ja-gaps.md)), when a source has them.

- Flags as pictures. `flag` is an emoji, which Windows draws as two letters; a flags package of the family (Hata, 旗) is being made, and a page can swap the emoji for its picture by the same alpha-2 code.
- La Francophonie among the groupings, once its tiers and its 2025 withdrawals can be checked against its own list.

Left out on purpose: geometry (see [Chizu](https://github.com/johnmorrisdotca/chizu), which draws the outlines), and any data under a share-alike or GPL licence.

## Architecture

The [architecture guide](docs/guides/architecture.md) retains the complete original source tree and explanation of data generation, lazy loading and public boundaries. Each native country resource keeps its existing file and runtime data.

## Data and licences

| What | From | Licence |
| --- | --- | --- |
| Country names, short and variant forms, codes, currencies, continents (UN M49) and subregions | Unicode CLDR 48.2 (`cldr-core`, `cldr-localenames-full`) | Unicode-3.0 |
| Subdivision codes, names, levels and parents | Unicode CLDR 48.2 (`common/subdivisions`, validity and containment) | Unicode-3.0 |
| Japanese names CLDR lacks, prefecture readings, calling codes, kinds of place | Wikidata, a snapshot of 2026-10-09 | CC0 |
| Own names, capitals, languages | countries-list 3.4.1 | MIT |
| Time zones and top-level domains | IANA tzdb 2026e `zone.tab`, IANA's TLD list | Public domain; a list of facts |
| Capitals in Japanese, coordinates, population, area, driving side, borders, subdivisions' capitals and figures, and the dates members joined bodies | Wikidata, a snapshot of 2026-10-09 (`data-sources/wikidata-facts-2026-10-09.json`) | CC0 |
| Land borders, confirmed | Natural Earth 5.1.2 admin-0 at 1:50m, as drawn by Chizu 1.0.2 (a development dependency of the build, never of the package) | Public domain (Natural Earth); MIT (Chizu) |
| First day of the week, measurement system, paper size, clock; UN M49; the UN's members | Unicode CLDR 48.2 (`cldr-core`) | Unicode-3.0 |
| The bodies' members, the informal groupings and the regions inside a country | written for this package from each body's own list, on 2026-10-09 (`scripts/groupings-config.ts`) | MIT; lists of facts |
| IOC codes, and the withdrawn countries' names | Wikidata, a snapshot of 2026-10-10 (`data-sources/wikidata-codes-2026-10-10.json`) | CC0 |
| The withdrawn countries' codes, years and successors | ISO 3166-3's published list, transcribed once (`scripts/withdrawn-config.ts`) | A list of facts |
| Aliases, a few readings and 46 corrected Japanese subdivision names | written for this package | MIT |

[NOTICE.md](./NOTICE.md) carries the Unicode licence text and says what was changed, and [data-sources/README.md](./data-sources/README.md) says where every input came from and how to refresh it. Nothing under ODbL, CC BY-SA or the GPL is used, so the dataset is shipped under MIT with those notices.

## The name

*Kuni* (国) is Japanese for "country": a nation, as in 国境 (*kokkyō*, a border) and 外国 (*gaikoku*, abroad). It is also the old word for a province, the 国 of Japan's former provinces (武蔵国, *Musashi no kuni*), and, in お国はどちらですか, "where are you from?", the place somebody calls home. The one word covers both halves of the data: the countries, and the regions inside them. ([Wiktionary: 国](https://en.wiktionary.org/wiki/国), which gives "country, nation" and "province".)

## Where it comes from, and where it is used

Kuni was written because several sites by the same author each kept their own country list: codes typed out by hand, names from `Intl.DisplayNames` that differed between the server and the browser, a few dozen aliases, and three separate tables of Japan's prefectures. It is the one list they can share.

### Used by

- **[REST in Pieces](https://github.com/spxis/rest-in-pieces)**, a fake-data REST service, serves Kuni's countries (with their Olympic codes and withdrawn codes), subdivisions and groupings as an API, so a form or a test can fetch real country and region data without installing anything.

Using Kuni in something else? Open an *Add my project* issue and we will add you.

### The family

<!-- family:start (made by scripts/family-readme.mjs from scripts/family-template.mjs; change those, not this) -->
Kuni is one of twenty-eight packages, each made for the same site, each at
[github.com/johnmorrisdotca](https://github.com/johnmorrisdotca) or [github.com/spxis](https://github.com/spxis). The code of every one is MIT.

**Games — board**

- [Domino](https://github.com/johnmorrisdotca/domino) (ドミノ): dominoes and Mexican Train. [Demo](https://johnmorrisdotca.github.io/domino/).
- [Gunjin](https://github.com/johnmorrisdotca/gunjin) (軍人): five hidden-rank strategy games with pass-the-device play. [Demo](https://johnmorrisdotca.github.io/gunjin/).
- [Narabe](https://github.com/johnmorrisdotca/narabe) (並べ): one rules engine for abstract board games, from gomoku and Reversi to Go and checkers. [Demo](https://johnmorrisdotca.github.io/narabe/).
- [Sugoroku](https://github.com/johnmorrisdotca/sugoroku) (双六): backgammon and its variants, with the doubling cube and match play. [Demo](https://johnmorrisdotca.github.io/sugoroku/).
- [Tenka](https://github.com/johnmorrisdotca/tenka) (天下): world conquest for two to six, on a map of the real world. [Demo](https://johnmorrisdotca.github.io/tenka/).

**Games — cards & tiles**

- [Hitotsu](https://github.com/johnmorrisdotca/hitotsu) (一つ): a colour-card shedding game for two to eight, with the house rules people play. [Demo](https://johnmorrisdotca.github.io/hitotsu/).
- [Jarajara](https://github.com/johnmorrisdotca/jarajara) (ジャラジャラ): mahjong tiles drawn as SVG, stacked layouts, and the matching solitaire Awase. [Demo](https://johnmorrisdotca.github.io/jarajara/).
- [Kumimoji](https://github.com/johnmorrisdotca/kumimoji) (組み文字): a crossword tile race, in English and Japanese kana. [Demo](https://johnmorrisdotca.github.io/kumimoji/).
- [Toranpu](https://github.com/johnmorrisdotca/toranpu) (トランプ): a deck of playing cards, card games with computer players, and solitaires. [Demo](https://johnmorrisdotca.github.io/toranpu/).

**Games — puzzles**

- [Houseki](https://github.com/johnmorrisdotca/houseki) (宝石): gem and stone matching puzzles: falling triplets, stone collapse, colour chains and gem swap. [Demo](https://johnmorrisdotca.github.io/houseki/).
- [Jirai](https://github.com/johnmorrisdotca/jirai) (地雷): minesweeper on shaped grids with verified no-guess boards. [Demo](https://johnmorrisdotca.github.io/jirai/).
- [Karakuri](https://github.com/johnmorrisdotca/karakuri) (からくり): eight hyper-casual puzzle games, some of them physics: draw a shield, pull pins, cut ropes, slide blocks, pour tubes. [Demo](https://johnmorrisdotca.github.io/karakuri/).
- [Kazu](https://github.com/johnmorrisdotca/kazu) (数): grid number puzzles: Sudoku and its variants, Futoshiki and Skyscrapers. [Demo](https://johnmorrisdotca.github.io/kazu/).
- [Kyuubu](https://github.com/johnmorrisdotca/kyuubu) (キューブ): a turning cube for the browser, 2×2 to 7×7, with record solves to replay. [Demo](https://johnmorrisdotca.github.io/kyuubu/).
- [Meikyuu](https://github.com/johnmorrisdotca/meikyuu) (迷宮): mazes on squares, hexagons, triangles and circles, made from a seed and drawn through with a finger or the mouse. [Demo](https://johnmorrisdotca.github.io/meikyuu/).
- [Suido](https://github.com/johnmorrisdotca/suido) (水道): a pipe puzzle: turn the pieces until the water reaches every drain. [Demo](https://johnmorrisdotca.github.io/suido/).
- [Tobiishi](https://github.com/johnmorrisdotca/tobiishi) (飛び石): peg solitaire with nine boards and seeded solvable challenges. [Demo](https://johnmorrisdotca.github.io/tobiishi/).
- [Tsunagi](https://github.com/johnmorrisdotca/tsunagi) (繋ぎ): a line-joining logic puzzle whose every level has exactly one answer. [Demo](https://johnmorrisdotca.github.io/tsunagi/).

**Games — dice & random**

- [Korokoro](https://github.com/johnmorrisdotca/korokoro) (コロコロ): dice, with notation, exact odds, real sounds and the dice of many games. [Demo](https://johnmorrisdotca.github.io/korokoro/).
- [Tane](https://github.com/johnmorrisdotca/tane) (種): seeded random numbers and daily seeds, the same in every browser and on every server. [Demo](https://johnmorrisdotca.github.io/tane/).

**Language**

- [Bushu](https://github.com/johnmorrisdotca/bushu) (部首): find a kanji by the parts it is made of. [Demo](https://johnmorrisdotca.github.io/bushu/).
- [Hikidashi](https://github.com/johnmorrisdotca/hikidashi) (引き出し): a drawer of small Japanese text tools: era dates, kanji numerals, readings and sentence difficulty. [Demo](https://johnmorrisdotca.github.io/hikidashi/).
- [Kotoba](https://github.com/johnmorrisdotca/kotoba) (言葉): word lists and word-game rules in English, French, German and Japanese. [Demo](https://johnmorrisdotca.github.io/kotoba/).

**Geography & data**

- [address-plus](https://github.com/johnmorrisdotca/address-plus) (アドレスプラス): parse and format addresses in the United States, Canada, Japan, Australia, France, Germany and the United Kingdom. [Demo](https://johnmorrisdotca.github.io/address-plus/).
- [Chizu](https://github.com/johnmorrisdotca/chizu) (地図): maps of the world and of countries' regions, in English and Japanese, with a quiz and callouts. [Demo](https://johnmorrisdotca.github.io/chizu/).
- [Hata](https://github.com/johnmorrisdotca/hata) (旗): country and regional flags as SVG, at their true proportions and keyed by ISO code. [Demo](https://johnmorrisdotca.github.io/hata/).
- [Kuni](https://github.com/johnmorrisdotca/kuni) (国): countries and their regions, with ISO codes and names in English and Japanese. [Demo](https://johnmorrisdotca.github.io/kuni/).

**Developer tools**

- [REST in Pieces](https://github.com/spxis/rest-in-pieces) (レスト・イン・ピーシーズ): seeded test data and REST APIs for frontend development, with latency and error drills. [Demo](https://spxis.github.io/rest-in-pieces/).


**This package is Kuni.** The demos of all twenty-eight share one header and footer, so each links the rest.
<!-- family:end -->

## Development

```sh
pnpm docs:site
pnpm docs:check
pnpm size --write
```

The shared generator checks real imports and guide examples. `pnpm docs:make` also refreshes the country-resource catalogue and the original language reference. `node scripts/build-data.ts --docs-only` refreshes stored generated examples without fetching or changing source data.

```sh
pnpm install
pnpm check                # lint, types, build, every test (sizes included), and the packed package
pnpm test:package         # pack, install and import it as somebody who installed it would
pnpm test:demo            # build the demo and play it in a real browser, at a phone's width and a desk's
pnpm site                 # build the demo into site/, as the Pages workflow publishes it
pnpm screenshots:readme   # take the README's pictures from the built demo, in light and dark
pnpm data                 # rebuild src/data/ from data-sources/ (no network)
pnpm data:facts           # a new Wikidata snapshot of the facts and the dates (network)
pnpm data:report          # the coverage, and docs/ja-gaps.md
pnpm docs:make            # rewrite docs/strings-ja.md after changing a word of the demo
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md); the commands are under [Development](#development), and the rules for the data are in its own section. Please follow the [code of conduct](./CODE_OF_CONDUCT.md). A security concern is for the [security policy](./SECURITY.md), not a public issue.

## Changes

See [CHANGELOG.md](./CHANGELOG.md). The latest release, 1.3.0, adds each country's IOC code and the 31 withdrawn countries of ISO 3166-3 (Yugoslavia, the Soviet Union, Zaire and the rest) in a list of their own, with their years and the codes that replaced them.

## Licence

MIT, © John Morris. The data is made from Unicode CLDR (Unicode-3.0), Wikidata (CC0), countries-list (MIT), IANA (public domain) and, for confirming land borders, Natural Earth (public domain), credited with their terms in [NOTICE.md](./NOTICE.md), which ships with the package.
