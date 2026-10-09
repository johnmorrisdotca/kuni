# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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
