# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Each country's capital in Japanese**: `country(code).capital` is now `{ en, ja }` (東京都, キーウ), from Wikidata, for all 245 countries that have a capital.
- **`@johnmorrisdotca/kuni/facts`**, a new entry so the main one stays small: for every country its population and area with the year each is for, the coordinates of the country and of its capital, the countries it shares a land border with (`[]` for an island), the side of the road it drives on, and CLDR's first day of the week, measurement system, paper size and clock. `facts(code)`, `allFacts()`, `distanceKm(from, to)` and `FACTS_READ`, the day Wikidata was read. Plain numbers and codes, for a build script to read as they are.
- **`@johnmorrisdotca/kuni/subdivision-facts`** and **`/subdivision-facts/<code>`**: each subdivision's capital (in English and Japanese, with a reading in kana for Japan's prefectural capitals), population, area and coordinates, one country at a time, with `loadSubdivisionFacts(code)`. Complete for Japan's 47 prefectures.
- **`@johnmorrisdotca/kuni/groupings`**: 107 groupings, each named in English and Japanese with its members, definition, source, licence and the day it was true. The seven continents; the 30 UN M49 areas; 23 international bodies (the UN, the EU with its candidates, the euro area, Schengen, the EEA, NATO, the G7 and G20, the OECD, ASEAN, the African Union, the Arab League, the GCC, the Commonwealth, OPEC, BRICS, Mercosur, the USMCA, APEC, CARICOM, the Pacific Islands Forum, the Nordic Council and Benelux) with the days members joined and left; 16 informal groupings (the Middle East, Latin America, the Caribbean, the Balkans, the Western Balkans, Scandinavia, the Nordic countries, the Baltic states, Central and Southeast Asia, the Maghreb, the Horn of Africa, the Sahel, the British Isles, Iberia, Asia-Pacific); and regions inside a country (Japan's eight 地方 and the nine-region variant, the US Census regions and divisions, Canada's five regions, the UK's four nations, Australia's states and territories). `groupings`, `grouping`, `groupingsOf` and `membersOf`, with `on` for a body's members on a past day.
- Every public export has a doc comment, kept in the built `.d.ts` so an editor shows it, with `@param`, `@returns` and an example; the tests run every example. The API page shows each function's parameters, what it returns and its example, and each interface's fields.
- `docs/facts.md`, `docs/subdivision-facts.md` and `docs/groupings.md` say what was decided, how much is known, and why the rest is `null`.

### Changed

- Equatorial Guinea's capital is Ciudad de la Paz (シウダ・デ・ラ・パス), where it moved in January 2026; it was Malabo.

## [1.0.0] - 2026-10-09

The first version: every country and its subdivisions, with ISO 3166 codes and names in English and Japanese.

### Added

- **`@johnmorrisdotca/kuni`**: the 250 countries (the 249 ISO 3166-1 codes and Kosovo, XK, as a user-assigned code), each with alpha-2, alpha-3 and numeric codes, its name in English and Japanese from Unicode CLDR 48.2, CLDR's short and variant forms, its own name, a reading in hiragana for a Japanese name written in kanji, its flag, continent and UN M49 subregion, calling code, currencies, top-level domain, capital, IANA time zones, languages and the kind of place its subdivisions are. Lookups: `country` (alpha-2 in either case, alpha-3 or numeric), `countries` (in code, English or Japanese order), `countryByName` (a name in either language, a short name, the country's own name or an alias such as Holland, UK, Burma or 米国), `countryName`, `flag`, `continentName`, `subregionName`, `fold` and `isCountryCode`.
- **`/codes`**: the 250 codes alone, `COUNTRY_CODES`, `isCountryCode` and the `CountryCode` type, about 2 KB.
- **`/subdivisions/<code>`**: one country's subdivisions as a list, one entry for each of the 200 countries that have them (Japan's 47 prefectures are under 3 KB).
- **`/subdivisions`**: all 5,046 ISO 3166-2 subdivisions (3,590 at the first level, the rest below it, such as France's departments inside its regions), each with its code, short code, level, parent, kind of place, English name, Japanese name or `null`, and for Japan's prefectures a reading. Lookups: `subdivisions` (by level), `allSubdivisions`, `subdivision`, `subdivisionByShortCode`, `subdivisionByName` and `subdivisionsByName` (English or Japanese, with or without the word for its kind, オンタリオ for オンタリオ州), and `subdivisionTypeLabel` (都, 道, 府 and 県 for Japan; 州 for Canada's provinces).
- **`/load`**: `loadSubdivisions(code)`, one dynamic import for each country, so a page loads only the countries somebody picks.
- Japanese names for 3,523 of the 3,590 first-level subdivisions (3,387 from CLDR, 41 written by hand where CLDR's is wrong or out of date, 95 from Wikidata where CLDR has none) and 4,747 of all 5,046; the rest are `null`, never an English name copied in. CLDR's trailing brackets that tell a place from one of the same name elsewhere (セント・ポール (ドミニカ国), バリンゴ (カウンティ), 江原道 (北)) are taken off, 115 of them, and listed in `docs/name-rules.md`. The 46 hand-written names (`JA_NAME_OVERRIDES`: parishes as 教区, Ukraine's Japanese forms of 2022, places renamed since, Latvian spellings and others) are listed with their reasons in `docs/disagreements.md`, with the questions left for a native reader of Japanese. `docs/ja-gaps.md` lists the gaps.
- ESM and CommonJS builds with types for both, `sideEffects: false`, no runtime dependencies, and no use of `Intl`, so a server and a browser give the same names.
- `pnpm data` builds the data from inputs committed under `data-sources/` (CLDR's subdivision files, IANA's zone.tab and TLD list, a Wikidata snapshot), checked by SHA-256, with no network; `pnpm data:fetch` and `pnpm data:wikidata` refresh them.
- A demo with three panels (find a country, the subdivisions of a country, look up a code) in English and Japanese, an API reference page, browser tests at a phone's width and a desk's, and the README's pictures taken from it.
