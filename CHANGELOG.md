# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.17.1] - 2026-11-23

### Changed

- Credits the World Bank for the 2025 populations.

## [1.17.0] - 2026-11-23

### Changed

- `/facts` populations are one comparable year (MODULES-1626): the World Bank's SP.POP.TOTL (Population, total, CC BY 4.0) for 2025, in place of Wikidata's figures of many years. The most populous country is India, ahead of China. `populationSource` on each country says where the figure is from. Kosovo, the Palestinian Territories, Taiwan and Western Sahara keep Wikidata's population and year. Area is unchanged and still Wikidata's. The input is `data-sources/world-bank-sp-pop-totl-2025.json`.

## [1.16.1] - 2026-11-20

### Changed

- Country, subdivision and city figures, ranks, elevations and capital coordinates come from the Wikidata JSON dump of 17 November 2026 (MODULES-1599). The five subdivision items that pointed at a city, a park or a mountain now point at the subdivision. Ten English county towns stay on the ISO 3166-2 item, because the dump records them on the ceremonial county. Disputed-place rows and the Soviet Union's alpha-2 end stay as they were.

## [1.16.0] - 2026-11-19

### Added

- `subdivisionReforms("VN")` records Resolution 202/2025/QH15: which of the current 63 ISO 3166-2 codes form each unit the resolution names (MODULES-1629). The codes themselves are unchanged. Article 2 clause 1 takes effect on the day it was passed, 12 June 2025. Article 2 clause 2: the new provincial governments officially operate from 1 July 2025. Japanese is kuni's existing name for a kept code, and is empty where the resolution's name is not that current name (Huế; the current code is still Thừa Thiên–Huế). It is its own entry, `@johnmorrisdotca/kuni/subdivision-reforms`, so `/subdivisions` does not carry the note.
### Changed

- OPEC's earlier periods for Ecuador and Gabon come from the membership table on Wikipedia's OPEC article (MODULES-1644). The table gives years and no day: Ecuador 1973-1992 and 2007-2020, Gabon 1975-1995 and since 2016. A year stays a year, so the days inside it are unknown. These periods are to be checked against Wikidata's P463 (member of) start and end qualifiers for OPEC when that extract lands. Gabon stays a current member. The current ISO codes are unchanged.

## [1.15.0] - 2026-11-19

- **One subdivision row carries retired codes, former names and aliases together.** The three new fields of this release share the row a country's subdivisions are written in (`shortCode|en|ja|type|parent|reading|former|formerNames|aliases`), and Japan's entry, with the code that reads them, is now about 3 KB (3,130 bytes; the guard moves from 3 KB to 3.25 KB).

### Fixed

- Cubatão and Itanhaém have the same 2022 census figure, 112,476, confirmed on IBGE's pages (MODULES-1687); 1.14.0 had held them to their estimates. A figure two cities are known to share is listed with its sources in `SAME_CENSUS_CONFIRMED`, and the build stops if an entry no longer matches the data.
### Added

- Retired subdivision codes (MODULES-1628). A subdivision that has had codes retired for it has `formerCodes`, in code order: `subdivision("FR-GES")?.formerCodes` is `["FR-A", "FR-G", "FR-M"]`. `subdivisionsByFormerCode(code)` in `/subdivisions` gives the subdivisions a retired code stands for, several where it was split (`LU-D` is five), and `subdivisionByFormerCode(code)` the one, `null` for a split. Both answer nothing for a code that is not retired. From the `deprecated` aliases of CLDR 48.2's `subdivisionAlias` (already in `cldr-core`, so nothing new is downloaded): 109 retired codes, 136 pairs, for 12 countries (CN, CZ, FR, LA, LU, MR, NO, NZ, OM, PL, TT, TW). The 27 `overlong` aliases are left out, as kuni keeps those codes (`US-PR`) as subdivisions. 11 deprecated aliases are left out because their successor is not a subdivision here (`FORMER_NOT_KEPT` in `scripts/data-config.ts`, with the reasons), and CLDR's `cnmn` for `CN-15` is read as `CN-NM`. The three Norwegian counties kuni's own `CODE_CHANGES` records as divided again in 2024 are in too (112 retired codes in all, 143 pairs), by hand (`FORMER_FROM_CODE_CHANGES`, checked against its rows): `NO-30` (Viken) is `NO-31`, `NO-32` and `NO-33`, `NO-38` is `NO-39` and `NO-40`, `NO-54` is `NO-55` and `NO-56`. Those successors have `formerNames`, the old county's name from `CODE_CHANGES` and CLDR's English and Japanese names for the code, and `subdivisionsByName("Viken")` finds them. No CLDR alias has a name in the data, so no other old names are searchable. The 2020 mergers (`NO-04` Hedmark to `NO-34`, and the rest) are in neither CLDR's aliases nor `CODE_CHANGES`, so they have no answer.
### Changed

- Three of India's names lose CLDR's macrons (MODULES-1674): "Chhattisgarh" (IN-CG), "Telangana" (IN-TS) and "Dadra and Nagar Haveli and Daman and Diu" (IN-DH), as the governments' own sites write them (cgstate.gov.in, telangana.gov.in, dnh.gov.in). The macron forms stay searchable through `Subdivision.aliases`. Uttarakhand (IN-UK) keeps CLDR's "Uttarākhand" until an official English page is read for it.
- Ukraine's oblasts have plain English names (MODULES-1632): "Vinnytsia Oblast", "Kharkiv Oblast", "Ivano-Frankivsk Oblast", not CLDR's colloquial "Vinnychchyna", "Kharkivshchyna", "Prykarpattia". The names are Wikidata's English labels, read from the pinned snapshot `data-sources/wikidata-facts-2026-10-09.json` (each item is cited in `EN_NAME_OVERRIDES`). Kyiv and Sevastopol are unchanged; Crimea is "Autonomous Republic of Crimea". The Japanese names and the codes are unchanged.

### Added

- `Subdivision.aliases`: other English names a subdivision is found by in `subdivisionsByName` and `subdivisionByName`, not shown as its name. Ukraine's 24 changed names keep CLDR's old forms there, so "Kyivshchyna" and "Vinnychchyna" still find their oblasts. Absent for every other subdivision.
### Added

- Subdivision names in Spanish, German, Simplified Chinese and Traditional Chinese, as `/subdivision-names/<language>`, from Unicode CLDR 48.2 and Wikidata labels read from Wikimedia's truthy dump (MODULES-1594). A name neither source gives, or that fails a check (the wrong Chinese script, a Japanese character form, a stray quotation mark), is left out. `docs/subdivision-names.md` lists the coverage and what a native reader should look at.

## [1.14.0] - 2026-11-19

### Fixed

- A city that has no Wikidata figure left no longer takes Natural Earth's `POP_MAX` where it is above the people of a subdivision the city lies in, of any figure's age (MODULES-1670). Before, Damascus kept Natural Earth's 2,466,000 against Damascus Governorate's 1,754,000; it now has no figure and stays a capital. Jamame and Arak keep theirs, their subdivision codes being stray ones (`NOT_INSIDE`).
- Brazil's cities take IBGE's 2022 census where Wikidata prefers IBGE's older estimate (MODULES-1671). Before, Guarulhos was the estimate of 1,324,781 for 2015 and Campinas 1,213,792 for 2020; they are the census's 1,291,771 and 1,139,047 for 2022. Only a census statement whose references are all IBGE's, newer than the estimate and alone on its day is taken, and the build stops if it is not within 80% to 125% of the estimate. Cubatão's and Itanhaém's identical census figure of 112,476 is left out for both, as one is a copy error, so they keep their estimates. A census figure of 100,000 or more that two cities 25 km or more apart of one country share is refused for the city that does not keep it, which takes its next figure, the city whose own earlier statement is within 1.5 times of it keeping it (the build log names the group, and all are refused where none or several keep it): Cotabato City keeps the 383,383 and Buldon is its census of 2020, 39,684. Other countries are unchanged.
- Commonwealth leftovers (MODULES-1645), from the members' pages on thecommonwealth.org: Eswatini is `"1968"` (its page is at /kingdom-eswatini: "1968, following independence from Britain"); the earlier periods that were 1 January placeholders are years: Nigeria `"1960"` to `"1995"` ("membership suspended 1995-99"), Nauru `"1968"` to `"1999"` ("as an associate member ...; full member since 1999"), Pakistan `"1947"` to `"1972"` ("left in 1972, rejoined in 1989"), and the start of Fiji's first period `"1970"`. A suspension is a gap between two periods, as before. Not changed: Nigeria's return (1999-01-01; the page gives only "1995-99") and Fiji's suspensions, which the page gives to the month and the data already has. The build can now name an earlier period of a member in `JOINED` (`match`) and fails if the match is not exactly one.

## [1.13.0] - 2026-11-19

### Fixed

- Pacific Islands Forum: all 18 members have a joining day, from the Forum's own timeline (forumsec.org/timeline-major-forum-events): the year for 16 ("Original members were Australia, Cook Islands, Fiji, Nauru, New Zealand, Tonga and Western Samoa", 1971; Papua New Guinea 1974; Niue 1975; Kiribati 1977; Solomon Islands and Tuvalu 1978; Vanuatu 1980; Micronesia and the Marshall Islands 1987; Palau 1995) and the day for New Caledonia and French Polynesia, 2016-09-07 ("admitted as Full Forum Members"). EEA: Liechtenstein, `"1995"` (efta.int, "Liechtenstein becomes a full participant in the EEA, together with Iceland and Norway"). The Benelux page names two starts, a customs agreement in 1944 and the treaty of the Economic Union in 1958, and no rule says which is joining, so the three stay unknown, with a note on the body. Still unknown, as these sites were blocked again (403, or no answer) and give nothing else: the UN (Denmark), the G20, the OECD, Mercosur, the Nordic Council, the GCC, the Arab League and BRICS (Indonesia); efta.int gives no per-state EEA days beyond Liechtenstein. 87 current members in 12 bodies are unknown now, 107 before.
- Ids that leave the tier lists (merged into another city, or removed) stay in the alias table, so look them up through `cityById` or `loadCities().byId`, not a plain search of a tier array. A test pins the merged ones (Mactan with Cebu City, Tarawa, Saint Thomas and the rest) and the removed ones (Dagbon, Mampong, Gros Islet).
- A city's population is no longer a figure above the people of a subdivision it lies in, of any level (MODULES-1669). Before, only a figure close to a first-level subdivision's was left out, so Santiago de los Caballeros (1,343,423, above Santiago Province's 1,000,087) and Beirut (2,421,354, above Beirut Governorate's 433,249) kept the figures of larger areas. A city that is the subdivision's capital or has its name may be 15% above it. The subdivision's figure must be no older than the city's own. Where Wikidata has no other figure, the city has none and a capital stays without one. Santiago de los Caballeros is 691,262 (the 2010 census), the unsourced 1,142,947 of 2017 being left out as well, so the Dominican Republic's largest city is Santo Domingo again. Eight cities change (Santiago de los Caballeros, Beirut, Havana, Sabaneta, Portsmouth, Gulu City, and Plav and Charlestown, which keep no figure); Karki and Palorinya Refugee Settlement, whose only figure was above its subdivision's, are no longer cities. Arua, Mbale City and Mbarara City keep their 2024 census figures from UBOS, which count a larger area than the subdivision figures kuni holds. Gulu City is 150,306 (2014), the 2020 estimate and the 2024 figure being above Gulu City's 135,373.

## [1.12.0] - 2026-11-18

### Added

- `capitalsOf(code)` in a new `/capitals` entry gives the capitals of a country that has more than one capital city, or a capital that `capital` does not name alone, each with its role: `{ name: { en, ja }, role, note? }`, the role one of `official`, `administrative`, `legislative`, `judicial`, `seat`, `political` or `economic` (MODULES-1627). Benin, Bolivia, Burundi (Gitega political, Bujumbura economic), Côte d'Ivoire, Malaysia, the Netherlands, South Africa (Pretoria administrative, Cape Town legislative, Bloemfontein judicial), Sri Lanka and Tanzania have an entry; every other country answers `null`. Each role is what the country's own government or law says, with the page and the quoted line in `docs/capitals.md`. The types `CapitalRole` and `CountryCapital`, and `CAPITALS_READ`, are exported from `/capitals`. The entry is separate because `/facts` is within 200 bytes of its size limit. `capital` is unchanged for every country. Israel and the Palestinian Territories have no entry: a disputed capital is left to the maintainer. Eswatini is not in yet: no official page in reach settles it. A role is given only where an official page says it: a source's "commercial" capital is `economic` (Colombo, Dar es Salaam), the Côte d'Ivoire Presidency's "economic capital" is Abidjan, and Benin's government calls Cotonou the capitale économique. The Hague is not listed for the Netherlands, nor Cotonou as a seat, because no page read says "seat of government" for them; La Paz is `seat` from the Ministry of Education's "la Sede de Gobierno es la ciudad de La Paz".

### Fixed

- Membership history (MODULES-1630):
  - Commonwealth: 41 joining dates that were Wikidata's 1 January placeholders are now the year the member's own page on thecommonwealth.org gives, as a year alone (`"1981"`; Australia, Canada and New Zealand 1931, Ghana 1957, Sri Lanka 1948 and the rest), each with its page and the line under "Joined the Commonwealth" in `JOINED`. No page gives a day. Jamaica was dated 1978 and its page says 1962. Cameroon's date is unknown (`since: null`), not 1960: its page on thecommonwealth.org reads "Joined the Commonwealth: 1960, following independence from Britain", which looks like the site's template wording, since Cameroon became independent from France in 1960 and its Commonwealth date is commonly given as 1995, but no official page read says so. Neither year is stored; the reasoning is in `JOINED` and `docs/groupings.md`. Pakistan (rejoined 1989) and Nauru (full member since 1999) are the years of their return. Not changed: Eswatini (its page could not be read), Nigeria's return in 1999 (the page gives only "suspended 1995-99") and the earlier periods of Fiji, Nigeria, Nauru and Pakistan.
  - Schengen: Bulgaria and Romania follow one rule. Both pages on europa.eu say "Schengen: member since 31 March 2024", so Romania, which was 1 January 2025, is 2024-03-31 like Bulgaria. The Commission's Schengen page says the two were "the last countries to join on 1 January 2025", the day checks at their land borders ended; the body's note says so.
  - OPEC: Ecuador's and Gabon's earlier periods are still missing. opec.org answers 402 (Payment Required) and no other site is used.
- EU founders (MODULES-1642): Belgium, France, Italy and Luxembourg were dated 1957-03-25 (the signing of the Treaties of Rome) and Germany and the Netherlands 1958-01-01. All six europa.eu country pages (european-union.europa.eu/principles-countries-history/eu-countries/<country>_en) say "EU Member State: since 1 January 1958", so all six are 1958-01-01, each with its page and line in `JOINED`; the body's note says Wikidata had dated four of them from the signing. Romania's page ("since 1 January 2007") agrees with its date. europa.eu has no page for the United Kingdom, so its 1973-01-01 is unchanged. `membersOf("eu", { on: "1957-12-31" })` is now empty and `{ on: "1958-01-01" }` has the six.
- The demo's groupings page lists, when a day is chosen, the members whose membership on that day is unknown (`unknownMembersOf`) in a list of their own, "Joining day unknown on this date (N)" (「この日の加盟は不明（N）」), beside the members. Before, they were left out of the members without a word since `membersOf(id, { on })` stopped counting a member with no joining day (MODULES-1641). With no day chosen the page is unchanged.
- Four calling codes carried an area written after the country's code (MODULES-1640). Curaçao's was `+5999`, an area inside `+599`; it is `+599`, which it shares with Bonaire, Sint Eustatius and Saba. Cocos (Keeling) Islands' was `+61891`; it is `+61`, as Christmas Island's is. Norfolk Island's was `+6723`; it is `+672`, as the Antarctic's is. Svalbard and Jan Mayen's was `+4779`; it is `+47`, Norway's, as the ITU lists no code of its own for it. The source is the ITU's "List of Recommendation ITU-T E.164 assigned country codes" (Operational Bulletin No. 1114): note c for +599, note i for +61, note g for +672. Each is set in `CALLING_CODE_OVERRIDES` with its reason, the build stops on any code longer than three digits that has no entry, and the shared-code test lists the four codes that are now shared.

## [1.11.0] - 2026-11-18

### Changed

- `membersOf(id, { on })` and `groupingsOf(code, { on })` no longer count a member with no joining day as a member on every date (MODULES-1625). Before, `membersOf("brics", { on: "2015-01-01" })` included AE, EG, ET, ID and IR, which joined in 2024 and 2025, and `membersOf("nato", { on: "1940-01-01" })` included DK and NL. A member whose `since` is `null` is now unknown on that date, not a member. The answer to a call with a day can therefore differ from before; a call with no `on` is unchanged. `GroupingMember.since` says so in its type documentation.
- New `unknownMembersOf(id, { on })` lists the members whose membership on that day is unknown (those with a `null` `since`), so a gap is visible and not read as a non-member. It answers `[]` with no day and for a grouping that is not a body, and `null` for an id that is not a grouping.

- A joining or leaving year without a day is now allowed in `GroupingMember.since` and `until` (`"1975"`), used only where the body's own page gives the year and no more. A joining year counts from the end of that year: `membersOf(id, { on })` counts the member on 31 December and not on earlier days of the year, which `unknownMembersOf` reports as unknown; a leaving year counts the member up to the end of the year before, and its days are unknown. `groupingsOf(code, { on })` follows the same rules. Full days work as before.

### Fixed

- Türkiye's calling code was `+36` (Hungary's); it is `+90`. Saint Helena's was `+247` (Ascension's); it is `+290` (MODULES-1624). Source: the ITU's "List of Recommendation ITU-T E.164 assigned country codes" (Operational Bulletin No. 1114): +36 Hungary, +90 Turkey, and its note a gives Ascension +247 and Saint Helena and Tristan da Cunha +290. Wikidata's items list several codes for both, and the build took the first. The snapshot carries no statement ranks, so the choice is set by country in `CALLING_CODE_OVERRIDES` with its reason, and the build now stops on any country whose item lists several differing codes and has no entry.
- A test holds the calling codes that more than one country has to a written list (`+1`, `+7`, `+44`, `+47`, `+61`, `+64`, `+212`, `+262`, `+358`, `+500`, `+590`), each with the ITU's line, so a second country with Türkiye's code fails it by name.
- Wikidata states some memberships twice with the same days (Taiwan's seat at the UN); `periods` now holds each once.
- Joining days read from each body's own page, where Wikidata had none (`JOINED` in `scripts/groupings-config.ts`, each with its page and the line it rests on; the list is in `docs/groupings.md`):
  - NATO: Denmark and the Netherlands, 4 April 1949 (nato.int, "NATO was created by 12 countries ... on 4 April 1949", with the founders named).
  - BRICS: the United Arab Emirates, Egypt, Ethiopia and Iran, 1 January 2024 (the South African Presidency's statement of the 2023 chair, "The membership will take effect from 1 January 2024"). Indonesia has no day on a page that could be read, and stays unknown.
  - African Union: 42 members that had none, and Guinea's, from the AU's member-states list ("date of joining the AU or its predecessor the OAU", au.int); Guinea's placeholder 1963-01-01 becomes 25 May 1963. Morocco ("1963/31 January 2017") gives no single day and stays unknown.
  - Euro area: 21 members, each from its own page on european-union.europa.eu ("Euro area: member since ..."); the EU and Schengen days of the Netherlands from the same page.
  - USMCA: Canada and the United States, 1 July 2020 (ustr.gov, "entered into force on July 1, 2020").
  - G7: the 1977-01-01 Wikidata gave six members is not a day any page gives. The Italian presidency's page (g7italy.it) says the first summit in 1975 included France, the United States, the United Kingdom, Germany, Japan and Italy, and "In 1976, with the admission of Canada, the G7 took its current configuration": the years `"1975"` (DE, FR, GB, IT, JP, US) and `"1976"` (CA). So `membersOf("g7", { on: "2020-01-01" })` has all seven, and on 1975-06-01 the six are unknown.
  - Year only, from pages already read: the United Kingdom in the Commonwealth, `"1926"` (thecommonwealth.org, "1926, on founding the British Commonwealth of Nations"); Mauritius, `"1968"` ("August 1968"), and Namibia, `"1990"` ("June 1990"), in the African Union (au.int).
- Still unknown, because no official page that could be read gives a day or a year: 105 current members of 12 bodies, listed in `docs/groupings.md` (the EEA, G20, OECD, Pacific Islands Forum, Nordic Council, Mercosur, GCC, Benelux, Arab League, Denmark in the UN, Morocco in the AU, Indonesia in BRICS and the rest).

## [1.10.0] - 2026-11-17

### Added

- Country names in nine more languages (MODULES-1435), each its own entry so a page pays for one (about 4 kB gzip): `@johnmorrisdotca/kuni/names/fr`, `/es`, `/de`, `/zh-Hans`, `/zh-Hant`, `/ko`, `/pt`, `/ar` and `/ru`. Each exports `names` (also the default) with `countryName(code, { short })`, `countryVariants(code)`, `countryByName(text)`, `countries({ order })` and `fold(text)`. The names, short forms and variants are Unicode CLDR 48.2's, from `cldr-localenames-full` already in the build, so nothing is downloaded; all 250 countries have a name in each language, and a name CLDR does not have would be `null`, never copied in or machine-translated. Search folds as each language is typed: the leading article in French, Spanish, Portuguese and German, the marks, hamza forms, ya, ta marbuta and tatweel in Arabic, plus `Oesterreich` for German. Countries only for now; the entries are shaped to take subdivisions later without a change to these functions. The guide "Country names in more languages" is in English and Japanese. `pnpm data:names` rebuilds them (`pnpm data` runs it too).

### Changed

- `/cities` holds each city's own figure and a territory's towns under the territory's code (MODULES-1464). The list held a kingdom, region-sized and estimated figures, and territories' towns under the parent country's code.
  - **Territories.** A town whose ISO 3166-2 code is a territory's own (US-GU, US-PR, FR-971 to FR-976, FR-PF, NO-21, FI-01 and the rest) is under that territory's code, and a town of MA-11 or MA-12 south of 27°40′ N is in Western Sahara: 39 cities moved (Dededo to GU, Bayamón and 17 more to PR, Laayoune and 5 more to EH, Saint-Paul to RE).
  - **Classes.** The extra snapshot also asks for communes of France and of French Polynesia, local councils of Malta and districts of the Turks and Caicos: 516 cities added (Les Abymes, Faʻaʻā, St. Paul's Bay, Providenciales; 483 communes of France).
  - **Figures.** A new snapshot (`pnpm data:populations`) holds what each figure rests on. A figure whose every reference is a site's own estimate (World Population Review, Demographia, ...) is left out for the next one (56 cities: Lobamba, Mbabane, Kuala Lumpur), and so is one above its country's or about its subdivision's, of a town that is neither. Census figures are set by hand where Wikidata has none for the city itself (`scripts/city-populations.ts`, 8: Kumasi, Khartoum, Banikoara), with the source "kuni".
  - **Not cities.** Dagbon; an atoll, and an island with a capital or a town of its name on it (11: Tarawa, Saint Thomas), each id answering with the town; Gros Islet's figure is its quarter's.
  - **Tests.** They pin the examples and that no city outnumbers its country.

## [1.9.0] - 2026-11-13

### Added

- **Each city has a time zone and an elevation, for a city card.** `City.timeZone` is the IANA zone the city keeps (`"Asia/Tokyo"`), to give a date formatter so a page shows the time there, and `City.timeZoneEstimated` says whether it is an estimate. It comes from IANA's zone.tab (public domain, tzdb 2026e) and Wikidata's zones of the subdivisions (CC0), and from no other source: a country's one zone (14,536 cities); else the zone Wikidata names for the city's subdivision alone (1,377); else the zone of the zone.tab city it is within 15 km of or is (503), or set by id with its reason (3); else, as an estimate, the zone kuni chose for its subdivision (13,251, of which 1,200 in a subdivision split between zones) or the nearest zone.tab city's (312, cities with no subdivision). Natural Earth's TIMEZONE column is not used (its source is not stated; `NOTICE.md`). `City.elevation` is the height above sea level in whole metres from Wikidata (CC0), left out where Wikidata has none, has several values more than 50 m apart, or has one that stands out from the cities round it (20 single bad values, and 5 known-wrong ones by id); 17,183 of 29,982 cities have one. All three are optional, so a `City` made by hand still compiles; they are columns of the same files, so no new entry or request: the gzipped country files grow by about 1 percent for Japan, 6 for Canada and 7 for the United States, `/cities/capitals` and `/cities/100k` by about 8 percent. A city's languages need nothing new: `country(city.country).languages` has them. New input: `data-sources/wikidata-city-elevations-2026-11-13.json` (`pnpm data:elevations`), with its licence in `NOTICE.md`. An addition: a minor version.

### Changed

- The must-have check is kazoku-ui's check-standard 2026-11-11b (`scripts/check-standard.mjs`, copied unchanged, its new hash recorded in `src/standard.test.js`). Its new item, `playwright-image`, holds CI's Playwright image to the version `pnpm-lock.yaml` pins for `@playwright/test`; here both are 1.64.0.
- **Every demo page says what it is and credits its data** (kazoku-ui's page frame, check-standard 2026-11-11). The demo and the card builder each have a header line ("Kuni 国: country card builder", with a way home) and a credit line above the footer, in English and Japanese, with a title of their own made from the same words. The credit line names every source and carries the credits Statistics Canada's and the OECD's terms ask for wherever their urban-area figures are shown, with a link to `NOTICE.md`; the embed page has a small credit line in its corner.

## [1.8.0] - 2026-11-11

### Added

- **Readings of Japanese names in hiragana.** `name.jaReading` reads a city's `ja` in hiragana, so a list sorts in Japanese order with a Japanese collation. A name in kana is read from itself (ゴヤ (アルゼンチン), ごや; コザン県, こざんけん). A name in kanji is read only from a source: Wikidata's reading in kana in any country (香港, ほんこん), Japan Post's for a municipality of Japan where Wikidata has none (山口市, やまぐちし), or, for twenty new towns and neighbourhoods neither reads, one written in `scripts/data-config.ts`. Every Japanese name of a place in Japan has one. A name in Chinese characters of China, Taiwan or Korea has none: no source with clear terms gives one, and none is made up. `searchPlaces` and the start parts find a city by its reading (とうきょう finds 東京都). `continentReading` reads the seven continents (南極, なんきょく). Five areas of Japan that are not towns (Woodland Kyoto, Kansai Science City, Otokuni, the castle town of Kagoshima, a group of Fukuoka's city blocks) are no longer cities; their ids are in `city-id-aliases.json` as removed.

### Changed

- **The builder's code is in the family's embed panel** (kazoku-ui 0.38, family template 2026-11-11). The nine tabs, Copy, "Copy a link to this card" and "Start again" are all kept, and the panel adds a link that opens the embed page with the choices, the card guide in the page's language, and the credit for the names (Unicode CLDR) and the facts (Wikidata). The tab chosen stays in the address.

### Fixed

- **Kami-Mizo** (上溝, Sagamihara) is spelled as it is read, かみみぞ; Wikidata's English label had Kami-Mizu.

## [1.7.1] - 2026-11-11

### Added

- **A lighter download for a city picker.** `searchPlaces(text, { match: "start" })` finds a name from its start or the start of a word, and fetches only the part of the capitals and of the 100k tier that holds such names: each tier is also written in 53 parts, `/cities/capitals-<key>` and `/cities/100k-<key>` (a to z, a digit, a kana row, sixteen groups for other scripts). A first search fetches about 50 kB gzipped at the median and 120 kB at most, against 472 kB for the whole capitals, 1m and 100k tiers. `cityNamesOf(code)` in /places, and `/cities/names-<code>`, give a country's light list first: ids, names and `major` (the capital and the first twenty), about half the full file (United States 52 kB, not 115 kB; China 87 kB, not 147 kB). The default search, and every other call, answers as before.

### Changed

- **Smaller city files, the same data.** Each tier and country file is written in columns (one array or string for each field, integer coordinates, shared tables of subdivisions and languages) rather than an array for each city. Gzipped as built, before and after: the capitals 207 kB to 173 kB, the 1m tier 35 kB to 32 kB, the 100k tier 230 kB to 194 kB, the United States 138 kB to 115 kB, China 188 kB to 147 kB, Japan 39 kB to 32 kB. Every city is as before.

### Fixed

- **The Netherlands' cities.** Wikidata gives most Dutch municipalities no country, and some of them (Nijmegen, Amersfoort, Haarlemmermeer) no class that is a kind of settlement, so the list held 14 cities. A city now takes its country from its ISO 3166-2 code where Wikidata names none, and a supplement of the municipalities of the Netherlands (`scripts/fetch-cities-extra.ts`) adds the rest: Tilburg, Almere, Breda, Nijmegen, Amersfoort and every other of 100,000 or more are listed once, the districts of The Hague, Rotterdam and Groningen inside their city. Dissolved municipalities, those with no figure since 2015, and the merged ones named for a region rather than a town (Haarlemmermeer, Westland, Súdwest-Fryslân) are left out; Kralendijk and The Bottom are in the Caribbean Netherlands (BQ), not the Netherlands, as the most specific code says.
- **Somalia's cities by their codes.** Hargeisa, Erigavo and Maydh had no country in Wikidata; they now join Somalia by their ISO 3166-2 codes, which makes Hargeisa Somalia's second city. A place given a country only by its code, whose figures are all dated over 30 years ago (a district of Szczecin counted in 1961), is left out.
- **Rothera** is no longer a city of the Caribbean Netherlands. Wikidata gives the Antarctic research station the British Antarctic Territory's code BQ of 1974 to 1979, the code the Caribbean Netherlands has now; its id `Q1635867` is in `city-id-aliases.json` as removed.
- **Sunshine Coast** is a city of Australia again, under that name: Wikidata's only item for it is the council area (Sunshine Coast Region), as the City of Gold Coast is Gold Coast's.

## [1.7.0] - 2026-11-11

### Changed

- **Cities rank by urban areas, one source for each country.** `metro` is now the urban area a city heads, by name as its source writes it: Statistics Canada's census metropolitan areas and agglomerations in Canada (the estimate of 1 July 2025, Table 17-10-0148-01), the Census Bureau's metropolitan and micropolitan statistical areas in the United States (1 July 2024), the OECD's functional urban areas in its other members, and for the first cities of China and India their censuses' urban figures (China's twenty-one megacities, by urban resident population in 2020: Chongqing 16.3 million, not its municipality's 32; India's twenty largest urban agglomerations of 2011, on which Mumbai ranks ahead of Delhi, the larger today). Where a city heads none, Wikidata's metropolitan area where it is bigger than the city, marked `metro.estimated` and `rankEstimated`, unless a bigger official area within 60 km holds it (Kyoto and Kobe, in Osaka's); else its own figure. South Africa's metropolitan municipalities are set on their seats (Durban is eThekwini's: Johannesburg, Cape Town, Durban, Pretoria, Gqeberha). Hong Kong and Macau are listed under their own codes, not China's. The area's figure ranks a city even below its own (Ulsan). Canada's first five are Toronto, Montreal, Vancouver, Calgary and Ottawa; the United States' New York City, Los Angeles, Chicago, Dallas and Houston; China's Shanghai, Beijing, Shenzhen, Chongqing and Guangzhou; India's Mumbai, Delhi, Kolkata, Chennai and Bengaluru. The sources and their terms are in NOTICE.md.

### Added

- **`inMetroOf`**, **`urbanAreaUnknown`** and **`rankEstimated`** on every city. `inMetroOf` is the id of the city whose urban area it lies inside, where it heads none of its own: Mississauga and Brampton in Toronto's (Statistics Canada's list of each area's municipalities), Fort Worth, Long Beach and Anaheim in Dallas's and Los Angeles's (named in the Census Bureau's titles), Ecatepec in Mexico City's, Niterói in Rio de Janeiro's, Thane in Mumbai's, Giza in Cairo's, Bangkok's districts and New York City's boroughs (set by id with their reasons), or a city near another whose area, or own figure of a million or more, holds three times its people; a city of a million or more is never put inside another's for being near it (Yokohama, Kobe, Kyoto, Incheon). Such a city comes after every city that heads an area, so a country's first ten or twenty are its major cities. `urbanAreaUnknown` marks a city of China or India below the census list, ranked after it. `rankEstimated` marks a city ranked by an estimate.
- **Districts and other units out of the cities.** An item Wikidata counts as a settlement but whose name is a county, district, subdistrict, raion, governorate, territory or region (Yishui County, Xətai raion, Bisha governorate), a part of a city ("Zone 7 of Milan", Marseille's sectors) or a municipality beside a town of its name is no longer a city; its id answers with the town or the city it belongs to (`cityById("Q2076557")` is Baku), or with none. Where Natural Earth names the unit and no city stands apart, it becomes that town, with the town's point and people (Yishui, 94,115, not the county's 967,570). Four Vietnamese and Chadian provinces and the Free Territory of Trieste are left out by name.
- **Nine more wrong Japanese names dropped**: a city carried the label of its state, province or country (Hidalgo del Parral as チワワ州, Bor as ニジニ・ノヴゴロド州, Revere as リビア, Murray as マリ); a test now finds any city named in Japanese as a subdivision it is not the capital of, or as another country.
- **Duplicate items left out**: München (a second item for Munich), Madrid city, Seville city, Málaga City, Valladolid city and Chongqing Shi, each a second item for its city; Minneapolis–Saint Paul and El Paso–Juárez, areas; South Mumbai and the London Borough of Ealing, parts of a city; Natural Earth's second Natal and its Vila Velha (the Vitória area); Kota Semarang, a second item for Semarang; Jember and Cilacap (regencies), Đồng Nai and Bắc Ninh (provinces), Sinnuris and Dairut (districts of Egypt), Rony (an upazila), the Kutupalong refugee camp, Kowloon Walled City (demolished in 1993) and Cheok Ka Village; San Pedro Zacachimalpa, given the Puebla area's 4.7 million people. Puebla, León and Toluca are named so in English, not by their formal names; Malatya's figure of 750 and Sirajganj's round 450,000 are left out. Each id answers with its city. A name ending in Municipality or Borough is a unit now, like District and County.

## [1.6.3] - 2026-11-11

### Added

- **Short Japanese city names for map labels**: `name.jaShort` beside `name.ja` on every city with a Japanese name: 東京 for 東京都, 大阪 for 大阪市, 新宿 for 新宿区, ソウル for ソウル特別市. A one-character name drops its 市 as maps print it (津市, 津); a name is kept whole where 区 would leave one character (中区), where the result would be a country's name (クウェート市) or would mean something else (中央市, 南九州市, 雲南市, ケソン市) or something bigger (東海市, 吉林市, 北海市, 山梨市), where 都市 is the word for a city in a longer name (関西文化学術研究都市; 京都市 is 京都), or where the 区 belongs to the name (浦東新区, ワシントン郡区); 町, 村 and 郡 are never dropped.
- **Seven wrong Japanese names dropped**: Várzea Grande, Qods, Kiryat Tiv'on and one Jinhe Town carried Wikidata's Japanese label of a larger place (a state, a province, a district, a county), and East Meadow, Pingdiquan Town and Ih Toli Gol that of another city (ニューヨーク市, 済寧, 玉林); they now have none, until a right one is found.
- **Brussels, Munich and Birmingham** rank by their metropolitan areas (3.35, 3.02 and 3.12 million): Wikidata has the areas but links them to no city, so `scripts/metro-links.ts` sets each by name with its reason. Somerset, a county, is no longer listed as a city.

## [1.6.2] - 2026-11-11

### Added

- **Cities ranked by their metropolitan area.** Each city has `metro`: the metropolitan area round it where one is named for it (`{ id, name, population, populationDate }`, else `null`): a Canadian city's census metropolitan area or agglomeration by Statistics Canada (2021 Census, id `statcan:<DGUID>`), any other's from Wikidata (CC0). The tiers, each country's file and `searchPlaces` rank a city by its metro's people where it has one, else by its own: Canada's first three are Toronto, Montreal and Vancouver, the United States' New York City, France's Paris, the Philippines' Manila. A tier still holds a city by its own `population`.
- **`@johnmorrisdotca/kuni/zones`**: `subdivisionTimeZone(code)`, the IANA zone of a first-level subdivision (Wikidata's where it names one of the country's zones alone, else estimated and said so), and `timeZoneAt(country, point)`, the zone at a point (the country's one zone, or the zone of the subdivision whose capital is nearest, estimated). kuni has no boundaries, so a point near the edge of a zone can be given its neighbour's.
- **`capitalZone`** in `/facts`: the IANA zone each capital keeps (245 countries; Astana's Asia/Almaty and Kosovo's Europe/Belgrade set by name, with the reason in docs/facts.md).

### Fixed

- **Units below a district are not cities**: upazilas, thanas, tehsils, talukas, municipal okrugs, subdistricts, wards, unions, arrondissements, county boroughs, regional councils, communes, the French métropoles and the Swiss cantons are left out (532 + 5 ids). Bangladesh's cities are now its 101 towns.
- **Civil townships round a city are not cities**: in Iowa, Illinois, Indiana, Kansas, Missouri, Nebraska and the Dakotas, where a township is a civil unit of its county with cities inside it, every township is left out (Kaw Township, round Kansas City; Thornton Township, round South Holland and Harvey); elsewhere a township is the municipality people live in (Toms River, New Jersey; Clinton Township, Michigan) and stays.
- Every id that leaves answers through `cityById` and `byId` with the city it belongs to, or with `null`. The alias table is written small, so the core of `/cities` stays under 24 KB.

## [1.6.1] - 2026-11-11

### Fixed

- **Areas left out of the cities.** Metropolitan Toronto was Canada's first city. Names that start Metropolitan, Metro, Metropolis of, Commune or Sectorul, name a regional municipality or a "State of", or end in Region, Region of …, Capital City, Urban Corridor or New Area are areas and units, not cities, and are left out (a name with a comma, a town told apart by its region, stays). A Natural Earth place whose Wikidata item is an area while the city of its name stands beside it now joins the city (Jamalpur, not Jamalpur District; Kristiansand, not Kristiansand Municipality). Moro, Papua New Guinea, given 6.3 million people, is left out by name. 30,616 cities (from 30,668). Ids never change: the 52 ids of 1.6.0 that are no city now answer through `cityById` and `byId` with the city they became (Metropolitan Toronto with Toronto, Metro Manila with Manila, Chișinău's sectors with Chișinău), or with `null` for a region that is no city.

### Changed

- **`cityById` fetches one country for a town.** A city that is in no tier file (no capital, under 100,000 people) is found through a small index of which country each is in, so only that country's file is fetched, not all 243.

## [1.6.0] - 2026-11-11

- **`/cities`**: the world's cities, in tiers, so that a page pays only for what it uses. `@johnmorrisdotca/kuni/cities/capitals` (every capital of a country or a subdivision, of any size), `/cities/1m` and `/cities/100k` (every city of a million people or more, and of 100,000 or more, capitals included), `loadCities("15k")` (15,000 or more, made from the countries' own files), `@johnmorrisdotca/kuni/cities/<code>` (one country's cities, every tier together) and `@johnmorrisdotca/kuni/cities`, the core: `citySet` (by id, by country, by subdivision, `nearest` and `within`), `loadCities(...tiers)`, `citiesOf(code)` and `cityById(id)`. **`@johnmorrisdotca/kuni/places`**, a new entry for what a place chooser asks: `continents()`, `countriesOf(continent)` and `searchPlaces(text, { lang, limit })` over English, Japanese and native names, with accents and kana folded, ranked by population. Kuni draws no chooser: a page builds its own. A city has its Wikidata id (or `ne:<number>` where only Natural Earth has it), its name in English, Japanese and in the official language of its country, continent, country, latitude and longitude, population with its date, first-level subdivision, capital flags (`national`, one for each country; `alternate`, for another seat of government such as Cape Town or Kyoto; `subdivision`) with the codes it is the capital of, and the source of each fact. Ids never change between releases: a merged id answers with the city it became. The data is Wikidata's (CC0) with Natural Earth's populated places (public domain) filling what Wikidata lacks; areas, wards, arrondissements and duplicate items are left out; `pnpm data:cities` takes a new snapshot by hand. docs/cities.md counts what is in each tier and what is missing; the new guide is "Use the cities".
- `fold` writes ł, ß, ø, đ, ı, æ, œ, ð and þ as l, ss, o, d, i, ae, oe, d and th, so that "Lodz" finds Łódź and "Strasse" finds Straße in every lookup.
- Kuni's local ports are 8600 to 8699 (AGENTS.md).
- The README opens with the package's thumbnail, and the demo carries it as its link preview (og:image) and publishes the card, a dark card and an icon on Pages at `thumbnail.png`, `thumbnail-dark.png` and `icon.png`.

## [1.5.0] - 2026-11-03

The demo, the docs and the release tooling follow the family's must-have list. No change to the package's code beyond its version.

### Added

- **Every way to use it, tested.** `examples/` holds a script tag from jsDelivr and from unpkg, Vite, webpack, React (with a server render), Vue, Svelte, Angular, an iframe of the embed page, TypeScript and Node. `pnpm test:usage` builds, type-checks or runs each against the package as npm packs it, opens the ones with a page in a browser, and checks that the guides hold the same text word for word. CI runs it.
- **Five guides, English and Japanese:** plain HTML and CDNs, Vite and webpack, React, Vue, Svelte and Angular, an iframe, and TypeScript and Node. The README links them ("Use it anywhere").
- **`scripts/check-standard.mjs`**, the family's must-have list as a check (kazoku-ui's, copied unchanged), run by `pnpm test`.

### Changed

- **The demo's header** has the family's language picker and theme switch (kazoku-ui), and the page is `demo/index.html`. The README's pictures are new screenshots of it.
- **The Release workflow** calls kazoku-ui's shared release workflow, and refuses a commit CI has not passed.

## [1.4.0] - 2026-10-14

A country and subdivision card with a shared embed builder joins the demo and the package, tables download as Markdown and SQL, and the package has an English and Japanese documentation site with a checked example for every export. The country data, the codes and the lookups are unchanged.

### Added

- Add the bilingual documentation site, checked public examples, full country-resource catalogue, local search and machine-readable pages.
- Add a country and subdivision card, embed builder and validated storage-free iframe.
- Add per-place colours and a capital-marker switch to country cards and their builder/frame links. Hosts can receive drawing options in map loaders; capital text fields stay separate.
- Share a package-independent embed builder for option controls, preview adapters, code tabs and shareable links.

### Changed

- The tests allow thirty seconds each (`vitest.config.js`), because the shared test that measures each entry point's size builds the country data and took longer than five seconds on a slow runner.
- The API link in the header reads "API" in English, so that the header takes the same number of rows in English and in Japanese on a phone, as the demo's test of a language change asks.
- Synchronize documentation tooling for repository layouts, generated type references, Node entry points and repository-specific README links.
- Keep complete resource catalogues on the documentation entry index and the active resource beside core navigation; render valid default imports in HTML and Markdown.
- Reconcile cards with the released IOC/withdrawn APIs; append optional ioc display while keeping current-country pickers and default fields unchanged.
- Compose optional Hata flags and Chizu maps, retain dated facts and land-area scope, and expose reflected properties and native load/error events.
- Group the package family by kind, alphabetize each group, and include the geography packages and REST in Pieces in the shared footer and README.
- Update the shared family description for addresses in all seven supported countries, including France and Germany.

## [1.3.0] - 2026-10-09

### Added

- **`country(code).ioc`**, the International Olympic Committee's three-letter country code (`"JPN"`, `"GER"` for Germany, `"SUI"` for Switzerland, `"TPE"` for Taiwan, `"KOS"` for Kosovo), for the 209 countries Wikidata (P984, CC0) gives one. A country with none has no `ioc` field. It is one more column in the main entry's table: the entry grew by 1.7 KB (0.8 KB gzipped).
- **`@johnmorrisdotca/kuni/withdrawn`**, a new entry: the 31 countries ISO 3166-3 lists as withdrawn from ISO 3166-1, with `withdrawnCountries()` and `withdrawn(code)`. A record has the four-letter code (`SUHH`), the alpha-2 (`SU`), alpha-3 (`SUN`) and numeric (`810`) codes it held, its name in English and Japanese, `since` and `until` (the years the code was in force), the `successors` (the new codes ISO 3166-3 lists, in ISO's order; every record has at least one, and one may itself be withdrawn: Yugoslavia's is `CS`, which `withdrawn("CS")` resolves to Serbia and Montenegro first and Czechoslovakia after) and `reusedBy` where a current country holds the alpha-2 code now (BY, AI, BQ, GE, SK). The lookup takes any of the four codes in either case and answers every country that held it, the last one first (`withdrawn("CS")` is Serbia and Montenegro, then Czechoslovakia), and an empty list for anything else. The Soviet Union, Yugoslavia, Czechoslovakia, East Germany, Zaire, East Timor, the Netherlands Antilles and Burma are among them. The main entry is unchanged: `countries()` and `country()` never return one, so no country picker shows the USSR. It is 8 KB (2.4 KB gzipped).
- **ISO 3166-3 is the authority for the withdrawn countries' codes, years and successors**: `WITHDRAWN_TABLE` in `scripts/withdrawn-config.ts` is the published list transcribed once (alpha-3, numeric, the years the code was in force, ISO's new codes), and `src/withdrawn.test.ts` pins the whole table, so a rebuild cannot drift from it. **Wikidata is used for their names** (English and Japanese) and for the IOC codes: a new snapshot, `data-sources/wikidata-codes-2026-10-10.json`, read by `pnpm data:codes` (CC0), turned into records by `scripts/withdrawn.ts`, which stops if the snapshot and ISO's table do not name the same 31 codes. `docs/withdrawn.md` lists every record and the Japanese names for review. The names, facts and groupings snapshots are unchanged.
- NOTICE.md, data-sources/README.md and the README's data table say where the new data comes from and its terms.

### Changed

- `Country` has a new optional field, `ioc`. The table the main entry reads has one more column before the user-assigned marker; nothing that reads `country()` changes.

## [1.2.0] - 2026-10-09

### Added

- **The demo's Compare view colours each country on its own**: a colour picker for each outline (the family's green and red at first, never the same), and a "Show capitals" switch for the dot on each capital. Both are kept in the address (`#/compare/JP/GB?colours=2f5d4a,b5452c&capitals=off`), so a shared link shows what its sender saw, and swapping the countries takes each one's colour with it.
- **The demo's tables and lists also download as a Markdown table and as SQL**, beside CSV, JSON and text. The Markdown is a GitHub table (a `|` in a cell is escaped, a line break is `<br>`); the SQL is a `CREATE TABLE` and an `INSERT` a row, with double-quoted names, single-quoted text and NULL for what is missing, and runs in SQLite, PostgreSQL and MySQL (MySQL needs `ANSI_QUOTES` and `NO_BACKSLASH_ESCAPES`, which the file's second line says). The writers are `demo/downloads.js`, the same file in kuni, chizu and hata, held to one hash and tested by loading the SQL into SQLite.

### Fixed

- On a phone, Compare's table no longer squeezes a long label into one character a line or cuts off the second country: each fact is a block, its name above the two countries' values and the difference under them.

## [1.1.0] - 2026-10-09

### Added

- **Each country's capital in Japanese**: `country(code).capital` is now `{ en, ja }` (東京, キーウ), from Wikidata, for all 245 countries that have a capital.
- **`@johnmorrisdotca/kuni/facts`**, a new entry so the main one stays small: for every country its population and area with the year each is for, the coordinates of the country and of its capital, the countries it shares a land border with (`[]` for an island), the side of the road it drives on, and CLDR's first day of the week, measurement system, paper size and clock. `facts(code)`, `allFacts()`, `distanceKm(from, to)` and `FACTS_READ`, the day Wikidata was read. Plain numbers and codes, for a build script to read as they are.
- **`@johnmorrisdotca/kuni/subdivision-facts`** and **`/subdivision-facts/<code>`**: each subdivision's capital (in English and Japanese, with a reading in kana for Japan's prefectural capitals), population, area and coordinates, one country at a time, with `loadSubdivisionFacts(code)`. Complete for Japan's 47 prefectures.
- **`@johnmorrisdotca/kuni/groupings`**: 107 groupings, each named in English and Japanese with its members, definition, source, licence and the day it was true. The seven continents; the 30 UN M49 areas; 23 international bodies (the UN, the EU with its candidates, the euro area, Schengen, the EEA, NATO, the G7 and G20, the OECD, ASEAN, the African Union, the Arab League, the GCC, the Commonwealth, OPEC, BRICS, Mercosur, the USMCA, APEC, CARICOM, the Pacific Islands Forum, the Nordic Council and Benelux) with the days members joined and left; 16 informal groupings (the Middle East, Latin America, the Caribbean, the Balkans, the Western Balkans, Scandinavia, the Nordic countries, the Baltic states, Central and Southeast Asia, the Maghreb, the Horn of Africa, the Sahel, the British Isles, Iberia, Asia-Pacific); and regions inside a country (Japan's eight 地方 and the nine-region variant, the US Census regions and divisions, Canada's five regions, the UK's four nations, Australia's states and territories). `groupings`, `grouping`, `groupingsOf` and `membersOf`, with `on` for a body's members on a past day.
- Every public export has a doc comment, kept in the built `.d.ts` so an editor shows it, with `@param`, `@returns` and an example; the tests run every example. The API page shows each function's parameters, what it returns and its example, and each interface's fields.
- Japan's Kinki region carries Kansai (関西地方) as its other name: `Grouping.otherNames`.
- `docs/facts.md`, `docs/subdivision-facts.md` and `docs/groupings.md` say what was decided, how much is known, and why the rest is `null`.
- The demo has views of its own, each at its own address: a page for each country (its outline from Chizu with the capital marked, its facts with their years, neighbours and groupings as links, furigana, the time now in each of its zones), two countries compared, every country in a table to filter, sort and narrow by grouping, a groupings explorer with a body's members on any day, three seeded quizzes (capitals, which country a region is in, calling codes) whose link gives the same questions, a country and region form widget in English or Japanese with its code to copy, search by calling code, currency or domain, and the data's quality in the open. Tables and lists download as CSV, JSON or text. Chizu is a development dependency for the demo's outlines only.

### Changed

- Equatorial Guinea's capital is Ciudad de la Paz (シウダ・デ・ラ・パス), where it moved in January 2026; it was Malabo.
- **Continents follow UN M49** (from CLDR): Russia is in Europe, Cyprus in Asia, Timor-Leste in Asia, Christmas Island and the Cocos Islands in Oceania, the British Indian Ocean Territory in Africa, and the sub-Antarctic islands where M49 puts them (Bouvet Island and South Georgia in South America, Heard and McDonald in Oceania, the French Southern Lands in Africa). Antarctica is the one continent named by hand. 1.0.0 took the continent from countries-list.
- **Norway's counties are those of 2024**, when Viken, Vestfold og Telemark and Troms og Finnmark were divided again: NO-31 Østfold, NO-32 Akershus, NO-33 Buskerud, NO-39 Vestfold, NO-40 Telemark, NO-55 Troms and NO-56 Finnmark are added and NO-30, NO-38 and NO-54 are gone, as in ISO 3166-2, which CLDR 48.2 has not caught up with. There are now 5,050 subdivisions.
- Short names where CLDR's full name reads badly in a narrow space: DR Congo (コンゴ民主共和国) and Congo (コンゴ共和国) for "Congo - Kinshasa" and "Congo - Brazzaville", ミャンマー for ミャンマー (ビルマ), ココス諸島. Hong Kong, Macao and Myanmar already had CLDR's.
- Each capital's Japanese name is the usual one (東京, 北京, ソウル), not a municipality's formal name, after a review.

### Fixed

- English subdivision names that were wrong in 1.0.0: Peterborough and Marlborough were cut short ("Peter", "Marl"); Chiayi City and Chiayi County were swapped, in Japanese too (嘉義市, 嘉義県); Bogotá was "Capital District"; Davao de Oro (ダバオ・デ・オロ州), Csongrád-Csanád and Nicaragua's two Caribbean Coast regions had their old names; Russia's republics Buryatia, Chechnya, Chuvashia, Kabardino-Balkaria, Karachay-Cherkessia and Udmurtia were adjectives, and Altai Republic and Komi Republic are told from their neighbours; Cần Thơ had lost its marks; Barisal Division and Barisal District had each other's names; and Morocco's twelve regions carried the names of the regions that held their codes before 2019 (MA-04 is Rabat-Salé-Kénitra, not Oriental), in Japanese too, where MA-11's came from a Wikidata label that was not a name. Every English name is now checked for each of these faults against Wikidata's English label, and the build stops on one nobody has decided (`docs/disagreements.md`).

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
