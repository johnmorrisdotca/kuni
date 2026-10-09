# Plan: @johnmorrisdotca/kuni (国)

This is the plan the package was built from, written on 2026-10-09 after a survey of the data sources. The
survey of the author's own projects that would use it is left out. Where the package as built differs from the
plan, the list below says so.

## As built: what changed from the plan

- **The three open decisions** were taken: deeper levels are included, behind `level` (5,046 subdivisions, 1,456
  of them below the first level); local-script names of subdivisions wait for a later version (a country's own
  name is in `name.local`); and the country alias list is in v1, seeded from itsutsu.com's.
- **An unknown kind of place is `null`**, not `"region"`: the plan's own rule that an unknown value is `null`,
  never a plausible filler, wins over the field's comment.
- **Kinds of place** are read from the English labels of Wikidata's P31 classes; Japan's four (都, 道, 府, 県)
  from the last character of the name. `subdivisionTypeLabel` gives the Japanese word only where every name of
  that kind in that country ends in the same one.
- **Readings.** Japan's prefectures take theirs from Wikidata's P1814 rather than from Geolonia; the two it lacks
  or gives twice (Hokkaido, Fukuoka) and the 53 country names written with kanji are written by hand, for review.
- **Codes CLDR retires as "overlong"** (US-PR beside PR, CN-TW, FI-01, NL-AW and the French overseas codes) are
  kept, as ISO 3166-2 keeps them, so the United States has its 57.
- **Rows are compact text** in the generated files, which keeps Japan's entry at 2.9 KB built.
- **Node 24** is required to build (`engines.node >=24`); the built package itself runs anywhere.

---

## 0. Recommendation and the name

Name: **kuni**, published as `@johnmorrisdotca/kuni` (MIT, zero runtime dependencies, TypeScript).

Checked with `npm view`:

| Name | Unscoped on npm | `@johnmorrisdotca/<name>` |
| --- | --- | --- |
| kuni | TAKEN: `kuni@0.1.5`, licence "Proprietary", maintainer s-you, last change 2022-06 | free (404) |
| sekai | TAKEN: `sekai@0.2.51`, "World right in your command line" | free |
| chiiki | free | free |

Why kuni: (1) every package in the family is scoped (`@johnmorrisdotca/chizu`, `hikidashi`, `narabe`), so the taken unscoped name does not matter; (2) the GitHub repository `johnmorrisdotca/kuni` already exists (empty, public, created today 09:22Z), so the choice has been made once; (3) 国 is the one word for "country" and for "home region", which covers both halves of the data; (4) short, romaji, kebab-safe, and reads next to chizu (地図) and tane/kazu/kotoba. Not sekai (世界 says "world", which reads as chizu's world map, and the unscoped name is a CLI). Not chiiki (地域 is "area", too vague for a list of countries, and long to type). Caveat to say in the README: the unscoped `kuni` on npm is someone else's; always install the scoped name.

## 2. What chizu already provides

`@johnmorrisdotca/chizu@1.0.0` (MIT, ESM only, tsc build, zero dependencies, Natural Earth 5.1.2, public domain):

- `@johnmorrisdotca/chizu/names` (38 KB): `CHIZU_COUNTRIES`, 238 rows `{ code, iso3, name, nameJa, nameShortJa?, reading?, group (continent), onWorld, hasDivisions }`, plus `countryByCode`, `countriesFromText`. Names are English and Japanese (Natural Earth, from Wikidata, CC0), and the short names (アメリカ) and kana readings were written by hand (23 hand readings in `scripts/data-config.mjs`).
- Drawn geometry for 238 countries and the world, and **31 countries' regions** as outlines: Argentina, Australia, Austria, Belgium, Brazil, Canada, Chile, China, Colombia, France, Germany, Ireland, Italy, Malaysia, Mexico, the Netherlands, New Zealand, Norway, Peru, the Philippines, Poland, Russia, South Korea, Spain, Sweden, Switzerland, Taiwan, Thailand, the United Kingdom, the United States and Vietnam. Region records are `{ code, name, nameJa, reading, group, path, bbox, centroid, neighbors }`.
- Not provided: ISO numeric, calling codes, currencies, flags, TLDs, aliases, subdivision types, and **no Japan prefectures** (Japan is not among the 31). Region codes are Natural Earth's, not ISO 3166-2, and are at inconsistent levels: France is 96 departments (`01`...), the UK is 232 council areas (`ABD`), Ireland counties, the US postal code (`AK`). Places with no ISO alpha-2 code use Natural Earth's own three letters.

So chizu is geometry plus a quiz engine with names attached; kuni is identity and naming with no geometry. They do not overlap except in the name tables, which is the duplication to remove.

Can chizu depend on kuni? Yes, and it should, in two steps, without breaking its zero-dependency claim for runtime users: chizu keeps its generated data but its `build-data.mjs` reads kuni to (a) take `name`/`nameJa`/`nameShortJa`/`reading` and the ISO alpha-3 from kuni instead of Natural Earth's `NAME_JA`, and (b) map each region to an ISO 3166-2 `iso` field (new optional field on `ChizuRegion`, resolved through kuni, with the department/council level recorded as `level: 2`). At runtime chizu would still not import kuni; the app joins them by code (`kuni.subdivision("DE-BY")` and chizu region `BY`). A later major could make `@johnmorrisdotca/chizu/names` a re-export of kuni, but that is not needed.

## 3. Data sources and licences

Target: complete, correctly licensed EN and JA names for 249 ISO countries plus Kosovo (XK), and the ISO 3166-2 subdivisions. Measured on 2026-10-09 against CLDR 48:

| Source | Licence | Gives | Verdict |
| --- | --- | --- | --- |
| Unicode CLDR 48, `cldr-localenames-full@48.2.0` on npm (JSON, 25.5 MB unpacked, 766 locales) | Unicode-3.0 (permissive, notice must travel with the data) | territory names in en and ja (264 two-letter keys incl. 249 ISO ones, each with `-alt-short`, e.g. US = アメリカ合衆国 and アメリカ); **no subdivision names in the npm JSON** | primary for countries |
| CLDR XML `common/subdivisions/{en,ja}.xml` (raw.githubusercontent, 339 KB and 392 KB), plus `cldr-core@48` `supplemental/subdivisionContainment.json`, `codeMappings.json` (alpha2/3/numeric), `currencyData.json`, `territoryContainment.json` (UN M49 continents) | Unicode-3.0 | 5,429 English and 4,725 Japanese subdivision names; the containment file lists 5,046 subdivisions of 200 countries, 3,590 of them first-level; ids are lower-case `jp13`, `usny`, `caon` (country + ISO suffix, so `JP-13`, `US-NY`, `CA-ON` is a clean split after two letters) | primary for subdivisions |
| Wikidata (SPARQL, `P300` ISO 3166-2, labels, `P1814` kana name, `P474` calling code, `P31` type) | CC0 | 5,351 hyphenated ISO 3166-2 codes; Japanese labels for JP 47/47, US 56/56, DE 16/16, CA 13/13, FR 137/140, GB 255/269 | gap filler, and the cross-check |
| `countries-list@3.4.1` (npm, 452 KB) | MIT | native name, phone, continent, capital, currency, languages for 252 entries | calling code, native name, capital, currency; MIT so it can be derived from |
| `i18n-iso-countries@7.14.0` (MIT, one dependency `diacritics`) | MIT | alpha2/3/numeric and ja names for 250 | cross-check only |
| IANA tzdata `zone.tab` / `tlds-alpha-by-domain.txt` | public domain / IANA | country to zone list, ccTLDs | `zones`, `tld` (TLD is the lower-case alpha-2 except GB = uk; the script holds a 5-line exception table) |
| GeoNames `admin1CodesASCII.txt` (151 KB) and alternateNames | CC BY 4.0 (attribution) | admin1 codes, mostly not ISO 3166-2 | do not use; the licence adds attribution burden and the codes do not match |
| Natural Earth admin-1 | public domain | what chizu uses; names are Wikidata's | not needed by kuni |
| `world-countries@5.1.0` / REST Countries data (mledoze/countries) | ODbL-1.0 (share-alike on the database) | rich country fields | **do not derive from**; ODbL would taint an MIT dataset |
| `country-state-city@3.2.1` | GPL-3.0 on npm | | **do not derive from** |
| `iso-3166-2@1.0.0` (MIT) | MIT | lookup of subdivisions, English only | not needed |

Chosen combination: **CLDR 48 (countries, subdivisions, codes, currency, continent) + Wikidata CC0 (gap filling, kana reading, calling code, subdivision type) + countries-list MIT (calling code, native name, capital cross-check) + IANA (zones, TLD)**. One NOTICE.md carries the Unicode-3.0 text and the CC0 note, as chizu's NOTICE.md does for Natural Earth.

Measured coverage and the gaps:

- Countries: all 249 ISO countries have a CLDR ja name; Kosovo (XK) is a CLDR territory too (added by hand as "user-assigned" in `kind`). Ready.
- First-level subdivisions: English 3,590 of 3,590 (100%). Japanese 3,409 of 3,590 (95%) from CLDR; 181 first-level are missing, by country: SI 23, FR 14, HR 14, MK 11, DO 10 (all), MC 9, GY 8, MA 8, ME 8, US 6, DE 6, TT 4, GE 4, QA 4, and a tail. Wikidata is queried for these (JP 47/47, US 56/56, CA 13/13 are already complete in CLDR). Anything still missing stays `ja: null`, never an English string copied in, never a transliteration made up. A `pnpm data:report` lists the nulls per country.
- Quality caveat to state in the README: CLDR marks 4,722 of its 4,725 Japanese subdivision names `draft="provisional"`. Cross-check against Wikidata agreed exactly for JP (47/47) and US (51/51), mostly for CA (12/13: PEI as プリンスエドワードアイランド州 vs プリンスエドワード島), DE (8/10: バイエルン自由州 vs バイエルン), FR (67/70), GB (209/228). Rule: CLDR wins, disagreements are written to a `docs/disagreements.md` list for review. John does not read Japanese, so every hand-written string (short names, readings) goes through the japanese-reviewer pass before release, as with chizu ("Japanese: included; not yet reviewed by a native reader").
- Total counts to put in the README: ISO 3166-2 has 5,046 subdivisions in all levels (3,590 first-level in CLDR's containment, because CLDR files département-style and municipality levels below their region for some countries, e.g. France 26 first-level vs 124 with departments, Slovenia lists its 212 municipalities as first-level). The task's "about 5,000 first-level" is the all-levels figure; first-level proper is about 3,600.
- Not covered by any source: Japanese names of counties, cities, postal data (out of scope); kana readings for subdivisions outside Japan (not wanted); local-script names for every subdivision (Wikidata `P1705` covers most; phase 2).

## 4. Data model and package shape

```ts
interface Country {
  alpha2: string;             // "JP"
  alpha3: string;             // "JPN"
  numeric: string;            // "392"
  kind: "iso" | "user";       // XK is "user"
  name: { en: string; ja: string; local?: string };
  shortName?: { en?: string; ja?: string };   // "United States" / アメリカ (CLDR alt-short)
  reading?: string;           // kana, Wikidata P1814, only where it differs from ja
  flag: string;               // derived from alpha2 at build time, so no runtime code
  continent: "AF" | "AN" | "AS" | "EU" | "NA" | "OC" | "SA";
  subregion?: string;         // UN M49, "030" Eastern Asia
  callingCode?: string;       // "+81"
  currency?: string[];        // ["JPY"], CLDR current currency
  tld?: string;               // "jp"
  capital?: { en: string };
  zones?: string[];           // IANA, phase 2
  subdivisionType: "state" | "province" | "prefecture" | "region" | "county" | "department" | "canton" | "district" | ...;
  aliases?: string[];         // "uk", "holland", "burma"
}
interface Subdivision {
  code: string;               // "JP-13", "CA-ON", "US-NY"  (ISO 3166-2, always the full form)
  country: string;            // "JP"
  shortCode: string;          // "13", "ON", "NY"
  type: string;               // Wikidata P31 mapped to a small enum, "region" when unknown
  level: 1 | 2 | 3;           // CLDR containment depth
  parent?: string;            // "FR-ARA" for "FR-01" (levels below 1 only)
  name: { en: string; ja: string | null; local?: string };
  reading?: string;           // JP prefectures only, from Geolonia (MIT) already used by address-plus
}
```

Rule from John's AGENTS: an unknown value is `null` or absent, never a plausible filler (`ja: null`, not `""` or the English name).

Lookups (all pure, no side effects, deterministic on server and browser):

- `country("JP")`, `countries()`, `countryByName("ドイツ")` (folded: case, accents, width, kana/kanji, aliases), `countryName(code, "ja")`, `flag("JP")`.
- `subdivisions("CA")`, `subdivision("CA-ON")`, `subdivisionByName("Ontario" | "オンタリオ州", { country: "CA" })`, `shortCode`-to-code (`subdivisionByShortCode("CA", "ON")`), `subdivisionTypeLabel("JP", "ja")` (県, 都, 道, 府).
- `fold(text)` exported (itsutsu's `fold` in `countries.ts` is the model).

Size, measured from the real CLDR data (minified JSON, `[short, en, ja]` tuples):

| Part | Raw | gzip |
| --- | --- | --- |
| 249 countries, minimal (alpha2/3, numeric, en, ja) | 18.8 KB | 6.2 KB |
| 250 countries, full record above (estimate) | 55-65 KB | 18-22 KB |
| First-level subdivisions, all 200 countries | 147 KB | 55 KB |
| All 5,046 subdivisions, all levels | 219 KB | 78 KB |
| Largest single country (Slovenia 212) | 8.9 KB | about 3 KB |
| Typical (Japan 47, US 57, Canada 13) | 1.4 KB, 2.2 KB, 0.7 KB | |

Shape: **do not ship one blob.** Entry points, as chizu and `date-fns/locale/*` do (one file per locale plus an index) and as `@faker-js/faker/locale/<x>` does (pre-composed locale bundle, tree-shakeable):

- `@johnmorrisdotca/kuni` (about 60 KB raw, about 20 KB gz): the country table and the lookups. A page that lists or looks up countries pays this and nothing more.
- `@johnmorrisdotca/kuni/codes` (about 2 KB): the 250 codes and `isCountryCode` for forms and validation.
- `@johnmorrisdotca/kuni/subdivisions/<cc>` (200 files, lower-case alpha-2, wildcard export `./subdivisions/*`): one country's subdivisions, default export a typed array, 0.3 to 9 KB.
- `@johnmorrisdotca/kuni/load`: `loadSubdivisions(cc)`, one dynamic `import()` per country (as chizu's `load`), so a bundler makes a chunk of each.
- `@johnmorrisdotca/kuni/subdivisions` (all): for servers that want everything, 147 KB or 219 KB with deeper levels.
- Later: `@johnmorrisdotca/kuni/names/<locale>` (about 10 KB per locale: territory names only) for the 13 other locales REST in Pieces uses.

Build: TypeScript, tsup for ESM plus CJS with `types` (address-plus already does this; the rest of the family is ESM-only with plain tsc, so say in the README that CJS is there because address-plus and Node scripts want it). `sideEffects: false`, `engines.node >= 22`, `files: ["dist","README.md","LICENSE","NOTICE.md","CHANGELOG.md"]`. Generation: `scripts/build-data.ts` reads `node_modules` copies of CLDR (devDependencies `cldr-core`, `cldr-localenames-full`, `countries-list`) plus a pinned download of the two CLDR XML files and a committed Wikidata result file (`data-sources/wikidata-YYYY-MM-DD.json`), then writes `src/data/*.ts`, so the shipped package has no runtime fetch and no dependency (the same way address-plus's `scripts/jp/update-jp-data.ts` works). `pnpm data` twice leaves the tree unchanged; each generated file opens with source, version and date. Tests: every ISO 3166-1 code present; every `subdivision.country` exists; every first-level has `name.en`; ja nulls match `data-sources/expected-ja-gaps.json`; Japanese quote marks and full-width forms normalised; round-trip of `fold`.

## 6. Description and next steps

README description (English, two sentences): "Kuni 国 is a typed, zero-dependency dataset of every country and its first-level subdivisions (states, provinces, prefectures, regions) with ISO 3166 codes and names in English and Japanese, built from Unicode CLDR and Wikidata. Look up a country or a region by code or by what somebody typed, in either language, and load only the countries you need."

Japanese one-liner: 世界の国と、州・県・省などの行政区画を、ISO 3166のコードと英語・日本語の名前で収めた、依存パッケージのないTypeScriptデータセット。 (English rendering: "A dependency-free TypeScript dataset of the world's countries and their states, prefectures and provinces, with ISO 3166 codes and names in English and Japanese.")

Order of work (a day or two each): 1) scaffold repo from hikidashi's layout and the family README template; 2) `build-data` for countries plus CLDR subdivisions, with the coverage report; 3) Wikidata query for the 181 Japanese gaps and for kana, calling code and type; 4) lookups, tests, `check-package.mjs`; 5) japanese-reviewer pass on the hand-written strings; 6) first publish after John's go, then the consuming projects switch over in separate pull requests (one concern each). Open decisions for John: whether v1 includes deeper-than-first levels (219 KB total, recommended: yes, behind `level`), whether `local` names ship in v1 (recommended: phase 2), and whether to give kuni the country alias list now.
