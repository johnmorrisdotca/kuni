# Notice: the data's licences

The code of this package is under the MIT licence (see [LICENSE](LICENSE)). The data in `src/data/` (and
`dist/`) is made from other people's work under their terms, which travel with it. Each data file opens with
lines saying what it was made from, and `data-sources/sources.json` records every downloaded input with its
address, the day it was read and its SHA-256.

| What | Made from | Terms |
| --- | --- | --- |
| Country names in English and Japanese, their short and variant forms, alpha-3 and numeric codes, currencies, UN M49 continents and subregions | Unicode CLDR 48.2 (`cldr-localenames-full` and `cldr-core` 48.2.0 on npm) | Unicode-3.0, below |
| Country names in French, Spanish, German, Simplified and Traditional Chinese, Korean, Portuguese, Arabic and Russian, with their short and variant forms (`/names/<language>`) | Unicode CLDR 48.2 (`cldr-localenames-full` 48.2.0 on npm, `main/<language>/territories.json`); a few search aliases are written by hand in `scripts/names-config.ts` | Unicode-3.0, below |
| Subdivision codes, the codes CLDR has retired for them (`subdivisionAlias`), English and Japanese names, the levels they are at and what they are inside | Unicode CLDR 48.2 (`common/subdivisions/en.xml`, `ja.xml`, `common/validity/subdivision.xml` at the tag `release-48-2`, and `cldr-core`'s `subdivisionContainment.json` and `aliases.json`) | Unicode-3.0, below |
| Japanese names of the subdivisions CLDR has none for, the kana readings of Japan's prefectures, calling codes, and what kind of place each subdivision is | Wikidata, the snapshot `data-sources/wikidata-2026-10-09.json` | CC0, below |
| Which calling code a country has where Wikidata's item gives several (`CALLING_CODE_OVERRIDES` in `scripts/data-config.ts`: Türkiye, Saint Helena) | The ITU's "List of Recommendation ITU-T E.164 assigned country codes", Annex to ITU Operational Bulletin No. 1114 (15 December 2016), read; the list is not copied or shipped | ITU, below |
| Each country's own name, capital and languages, and the calling code where Wikidata has none | countries-list 3.4.1 by Annexare Studio | MIT, below |
| Each country's population, one year for every country but four (2025) | World Bank, Population, total (SP.POP.TOTL), `data-sources/world-bank-sp-pop-totl-2025.json` | CC BY 4.0, below |
| Each country's capital in Japanese and its coordinates, population where the World Bank has none, area (with the year each is for), coordinates, driving side and the countries it shares a border with; each subdivision's capital, population, area and coordinates; the days members joined and left international bodies | Wikidata, the JSON dump of 2026-11-17 (`data-sources/wikidata-facts-2026-11-17.json`, from `latest-all.json.bz2`) | CC0, below |
| Which land borders are real (two outlines touch) | Natural Earth 5.1.2 admin-0 countries at 1:50m, as drawn by `@johnmorrisdotca/chizu` 1.0.2 (a development dependency of the build; the package does not depend on it) | Public domain (Natural Earth); MIT (Chizu), below |
| The first day of the week, the measurement system, the paper size and the clock; the UN M49 areas and their members; the members of the United Nations | Unicode CLDR 48.2 (`cldr-core` 48.2.0: weekData, measurementData, timeData, territoryContainment) | Unicode-3.0, below |
| The members of each international body as the body lists them, the informal groupings with their definitions, the regions inside a country, the readings of the groupings' Japanese names, and the choices in `scripts/facts-config.ts` and `scripts/groupings-config.ts` | Written for this package, from the sources named beside each, read on 2026-10-09 | MIT; lists of facts |
| What each country code is (a member of the United Nations, an observer, a territory, a special region, disputed or uninhabited), the state a territory belongs to and its kind in English and Japanese | The members of the United Nations as Unicode CLDR 48.2 lists them; the United Nations' list of non-member observer states (https://www.un.org/en/about-us/non-member-states, read 2026-11-17); Wikidata, the snapshot `data-sources/wikidata-status-2026-11-17.json` (P31, P17); the choices in `scripts/status-config.ts`, each with its reason | Unicode-3.0; a list of facts; CC0; MIT |
| The places outside ISO 3166-1 (`/reserved`): which two-letter codes are reserved for a place | IANA Language Subtag Registry, File-Date 2026-09-17 (https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry), cut down to its two-letter region subtags in `data-sources/iana/language-subtag-regions.json`; RFC 5646, section 2.2.4, says they are the codes ISO 3166-1 reserves exceptionally | A registry of facts, published by IANA for use |
| The places outside ISO 3166-1: the reserved codes' names and three-letter codes; the other places' names, the state each is in or is claimed by, their ISO 3166-2 codes, populations and the year one was dissolved | Unicode CLDR 48.2; Wikidata, the snapshot `data-sources/wikidata-reserved-2026-11-17.json` | Unicode-3.0; CC0, below |
| The places outside ISO 3166-1: that XA, XC and XO are in use for Abkhazia, Northern Cyprus and South Ossetia | The README of country-flag-icons 1.6.20 (https://unpkg.com/country-flag-icons@1.6.20/README.md, read 2026-11-17); only the three assignments are taken, no file of the package | MIT; facts |
| The trivia (`/trivia`): when each country began (P571); the languages official in each; its largest city | Wikidata, the snapshot `data-sources/wikidata-trivia-2026-11-17.json`; Unicode CLDR 48.2 (`cldr-core`: territoryInfo, the languages with the status official or de_facto_official); the cities of `/cities`, whose sources are listed above, and for fourteen cities the census figures typed in `scripts/largest-city.ts`, each with its source (the national censuses of Benin, Ghana, Sudan, Eswatini and Equatorial Guinea) | CC0, below; Unicode-3.0 |
| The International Olympic Committee's country codes; the names in English and Japanese of the countries ISO 3166-3 lists as withdrawn | Wikidata, the snapshot `data-sources/wikidata-codes-2026-10-10.json` | CC0, below |
| The withdrawn countries' four-letter codes, alpha-3 and numeric codes, the years each code was in force and the codes that replaced them | ISO 3166-3's published list (ISO's Online Browsing Platform), transcribed once in `scripts/withdrawn-config.ts` and pinned whole by `src/withdrawn.test.ts` | A list of facts |
| The IOC code of the Netherlands, and a few of the withdrawn countries' names | Written for this package, in `scripts/withdrawn-config.ts`, each with its reason | MIT |
| Time zones | IANA time zone database 2026e, `zone.tab` | Public domain |
| Each city's time zone | IANA time zone database 2026e, `zone.tab` (the zones of a country and the point of each zone's principal city), and Wikidata's zones of the subdivisions as `/zones` has them; a few cities set by id in `scripts/city-facts.ts`, each with its reason | Public domain (IANA); CC0 (Wikidata); not Natural Earth's TIMEZONE column, which kuni does not use (below) |
| Each city's elevation | Wikidata, the snapshot `data-sources/wikidata-city-elevations-2026-11-13.json` (P2044) | CC0, below |
| What each city's population figure rests on (its rank, day, method and reference sites), and which items are islands or atolls | Wikidata, the snapshot `data-sources/wikidata-city-populations-2026-11-17.json` (P1082, P31) | CC0, below |
| The census population of eight cities Wikidata has no figure of their own for (Kumasi, Accra, Tamale, Sekondi-Takoradi, Khartoum, Omdurman, Banikoara, Manzini) | The national censuses of Ghana (2021), Sudan (2008), Benin (2013) and Eswatini (2017), each named in `scripts/city-populations.ts`; only the figures and their days are typed, no table is copied | Facts |
| Country-code top-level domains | IANA's list of top-level domains (version 2026100900) | A list of facts, published by IANA |
| The capitals with a role (`capitalsOf`, `docs/capitals.md`): which cities are a country's capitals, and the role each has | The country's own government or law, page by page, each address and the line quoted in `scripts/capitals-config.ts` and `docs/capitals.md`: South Africa's government (gov.za), Sri Lanka's Ministry of Foreign Affairs and its embassy in Lebanon, Bolivia's Ministry of Foreign Affairs and Ministry of Education, Burundi's Ministry of Foreign Affairs, Côte d'Ivoire's Presidency, Benin's government (gouv.bj), Malaysia's Dewan Bandaraya Kuala Lumpur and Perbadanan Putrajaya, the Netherlands' overheid.nl and the Grondwet, Tanzania's embassy in Vienna; read on 2026-11-18. The Japanese names are kuni's own | MIT; lists of facts; the lines are quoted, not copied |
| The aliases ("Holland", "UK", 米国), the readings of country names written in kanji, Hokkaido's and Fukuoka's readings, the readings of twenty new towns and neighbourhoods of Japan that neither Wikidata nor Japan Post reads, and the Japanese words for kinds of place the build looks for | Written for this package, in `scripts/data-config.ts` | MIT |
| Vietnam's 2025 provincial rearrangement (`subdivisionReforms`) | Resolution 202/2025/QH15, the signed text, Article 1 (which current provinces form which unit) and Article 2 (in effect on the day it was passed, 12 June 2025; the new governments officially operate from 1 July 2025). Recorded in `src/subdivision-reforms.ts` as the current ISO 3166-2 codes. The resolution's prose is not copied; three short sentences of Article 2 and the closing line are quoted | A list of facts |

## Unicode CLDR

The country and subdivision names, codes and regions are from the Unicode Common Locale Data Repository
(https://cldr.unicode.org/). Its licence (https://www.unicode.org/license.txt, read on 2026-10-09) asks that
this notice appear with all copies of the data or in its documentation:

```text
UNICODE LICENSE V3

COPYRIGHT AND PERMISSION NOTICE

Copyright © 2004-2026 Unicode, Inc.

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.

IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.

SPDX-License-Identifier: Unicode-3.0
```

**What was changed.** Names are kept as CLDR writes them, made NFC with full-width Latin letters and digits made
ordinary and spaces tidied, and with the superscript digit CLDR adds to tell two places of the same name apart
(Île-de-France²) taken off. Codes CLDR retires because the place has a country code of its own (US-PR beside PR)
are kept, as ISO 3166-2 keeps them, with the country's names. Where CLDR's Japanese name and Wikidata's differ,
CLDR's is kept; [docs/disagreements.md](docs/disagreements.md) lists them.

## Wikidata

Wikidata's structured data is released under the Creative Commons CC0 License
(https://www.wikidata.org/wiki/Wikidata:Licensing, read on 2026-10-09): no permission is needed and no credit is
required. It is credited here anyway. The two queries are written in the snapshot file itself. A Japanese label
is used only when CLDR has no Japanese name, when every current item for the code agrees on it, and when it is
written in Japanese with no bracketed explanation; a reading only when Wikidata gives exactly one for the same
name. Kinds of place are read from the English labels of the classes an item is an instance of.

The facts snapshot (`data-sources/wikidata-facts-2026-11-17.json`), read from the Wikidata JSON dump `latest-all.json.bz2` on 2026-11-17 and not from the query service, holds the answers to the queries written in it:
for every country and every subdivision, its capital with the capital's English and Japanese labels, kana name and
coordinates; its best-ranked population and area with the day each is for; its coordinates; and, for countries, the
side of the road it drives on, the countries it shares a border with and the international bodies it is a member
of. `scripts/facts.ts`, `scripts/subdivision-facts.ts` and `scripts/groupings.ts` say how each is chosen. Figures are
kept as Wikidata gives them, rounded only for coordinates (two decimal places).

## World Bank, for the populations

The populations in `/facts` are the World Bank's "Population, total" (indicator SP.POP.TOTL,
https://data.worldbank.org/indicator/SP.POP.TOTL), for 2025, as its API v2 answered to the request
`https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?date=2025&format=json&per_page=20000` on 2026-11-19.
The API names the source as World Development Indicators (source id 2).

**The licence.** The World Development Indicators dataset page
(https://datacatalog.worldbank.org/search/dataset/0037712/world-development-indicators, read on 2026-11-23) lists
Population, total as series SP.POP.TOTL and says "License: Creative Commons Attribution 4.0" and "This dataset is
licensed under Creative Commons Attribution 4.0". That licence link is
https://datacatalog.worldbank.org/public-licenses?fragment=cc, which (read the same day) says CC BY 4.0 lets a user
copy, modify and distribute the data for any purpose, including commercial use, and asks only for credit and a note
of changes. It is not the Open Database Licence. The credit:

> World Bank, World Development Indicators, Population, total (SP.POP.TOTL), CC BY 4.0, read 2026-11-23.
> https://datacatalog.worldbank.org/search/dataset/0037712/world-development-indicators
> https://creativecommons.org/licenses/by/4.0/

**What was changed.** The file is kept as the API gave it. The build takes the rows whose ISO 3 code is a country in
this package and leaves out the World Bank's aggregates (regions, income groups, the world) and the Channel Islands,
which ISO 3166-1 has no code for. Kosovo (XK), the Palestinian Territories (PS), Taiwan (TW) and Western Sahara (EH)
keep Wikidata's population and year: those rows are not taken from this series. A country the series does not give
keeps Wikidata's figure, marked as Wikidata's on its row. No endorsement by the World Bank is implied.

## Wikidata, for the cities

The cities (`/cities`) are made from a second Wikidata snapshot (`data-sources/wikidata-cities-<day>.json`), CC0 on the
terms quoted above (read on 2026-11-11), asked for by `scripts/fetch-cities.ts`: the items that are an instance of a
human settlement, have coordinates and a best-ranked population of 15,000 or more, every current capital of a country
or a subdivision, and the items Natural Earth's places name. For each, the English and Japanese labels, the native
label, the coordinates, the country, the populations with their dates and the ISO 3166-2 codes of the places it is in.
No Wikipedia text is used. A supplement on the same terms (`data-sources/wikidata-cities-extra-<day>.json`, read on
2026-11-11, asked for by `scripts/fetch-cities-extra.ts`) adds the cities whose only class in Wikidata is no kind of
settlement: the municipalities of the Netherlands, as Nijmegen is. A city's reading in hiragana (`name.jaReading`) is
Wikidata's name in kana (P1814) where its Japanese name is Wikidata's label, from a fourth snapshot on the same terms
(`data-sources/wikidata-city-readings-<day>.json`, read on 2026-11-11, asked for by `scripts/fetch-readings.ts`).

## Japan Post, for the readings of Japan's municipalities

Where Wikidata gives a city of Japan no reading, its reading is that of the municipality of the same name in its
prefecture in Japan Post's postal-code data (`utf_ken_all.zip`), kept in
`data-sources/japan-post-municipalities-<day>.json` (each municipality's local government code, prefecture, name and
reading in katakana, nothing else) by `scripts/fetch-japan-post.ts`, and written in hiragana by the build. Japan Post's
terms (https://www.post.japanpost.jp/service/search/zipcode/download/readme.html, read on 2026-11-11) say:

> 郵便番号データに限っては日本郵便株式会社は著作権を主張しません。自由に配布していただいて結構です。
>
> (For the postal-code data alone, Japan Post Co., Ltd. claims no copyright; you are free to distribute it.)

A city's metropolitan area (`metro` on each city) comes from a third Wikidata snapshot
(`data-sources/wikidata-metros-<day>.json`), CC0 on the same terms (read on 2026-11-11), asked for by
`scripts/fetch-metros.ts`: the items that are a metropolitan or urban area, the links between them and the cities, their
English labels and their populations with dates. Brussels, Munich and Birmingham are linked to their areas by name in
`scripts/metro-links.ts`, from the same CC0 snapshot.

A Canadian city's metropolitan area is Statistics Canada's census metropolitan area or census agglomeration, its 2021
population from Table 98-10-0005-01, kept in `data-sources/statcan-cma-2021.json` by `scripts/fetch-statcan.ts`, under the
Statistics Canada Open Licence (https://www.statcan.gc.ca/en/reference/licence, read on 2026-11-11):

> Adapted from Statistics Canada, Table 98-10-0005-01, Population and dwelling counts: Canada, provinces and territories,
> census metropolitan areas and census agglomerations, 2021 Census, reference date 2021-05-11. This does not constitute
> an endorsement by Statistics Canada of this product.

A city is ranked by the urban area it heads, with one source for each country, kept in
`data-sources/urban-areas-<day>.json` by `scripts/fetch-urban.ts` (read on 2026-11-11), each section with its own terms:

- Canada: the population of each census metropolitan area and census agglomeration on 1 July 2025 (Table 17-10-0148-01)
  and the municipalities each holds (Table 98-10-0003-01, 2021 Census), under the Statistics Canada Open Licence:

  > Adapted from Statistics Canada, Table 17-10-0148-01, Population estimates, July 1, by census metropolitan area and
  > census agglomeration, 2021 boundary, and Table 98-10-0003-01, Population and dwelling counts: Census metropolitan
  > areas, census agglomerations and census subdivisions (municipalities), 2021 Census. This does not constitute an
  > endorsement by Statistics Canada of this product.

- The United States: the population of each metropolitan and micropolitan statistical area on 1 July 2024, a work of
  the United States government and in the public domain (17 U.S.C. 105). Source: U.S. Census Bureau, Population
  Division, Annual Resident Population Estimates for Metropolitan and Micropolitan Statistical Areas, Vintage 2024.
- The other members of the OECD: the population of each functional urban area, the latest year the OECD gives (2019 to
  2025 by country). These are not under a Creative Commons licence: the OECD Terms and Conditions, section 3, Data
  (https://www.oecd.org/en/about/terms-conditions.html, last updated 1 July 2024, read on 2026-11-11), let anyone
  "extract from, download, copy, adapt, print, distribute, share and embed Data for any purpose, even for commercial
  use", with the credit in the form "OECD (year), (dataset name),(data source) DOI or URL (accessed on (date))", and
  ask that any sub-licence carry the same requirement. The credit:

  > OECD (2026), Functional urban areas: population by age and sex, OECD Data Explorer,
  > https://sdmx.oecd.org/public/rest/data/OECD.CFE.EDS,DSD_FUA_DEMO@DF_AGE_SEX (accessed on 2026-11-11).

  Changes made: only the total population is kept, the latest year of each area; the area is joined to a city by its
  name, or by id where the name is no city's (`OECD_AREAS` in `scripts/metro-links.ts`). Anyone who takes the figures
  from this package must give the same credit.
- China: the urban resident population (城区常住人口) of its twenty-one megacities at the Seventh National Population
  Census, 1 November 2020, by the National Bureau of Statistics of China (its release of 22 September 2021, and
  中国人口普查分县资料：2020, China Statistics Press, 2022). Only facts are taken, each city's figure and its day, typed
  in `scripts/urban-facts.ts` with the source; no table is copied.
- India: the population of its twenty largest urban agglomerations at the Census of India 2011, table A-04, by the
  Office of the Registrar General & Census Commissioner, India. Only facts are taken, each figure and its day, typed in
  `scripts/urban-facts.ts` with the source; no table is copied. These are 2011's figures: on them Mumbai ranks ahead of
  Delhi, which is the larger today.
- In a country with official areas, where a city heads none: the metropolitan areas of the Wikidata snapshot above
  (CC0), where bigger than the city, marked as estimates. In every other country a city is ranked by its own figure
  from that snapshot, marked as an estimate.

An area whose name is no city's ("West Midlands urban area") is set to its city by id in `scripts/metro-links.ts`, with
the reason. Natural Earth (below) still gives the population of a city Wikidata has none for (Pietermaritzburg, Welkom),
and that figure ranks the city.

The largest city of `/trivia` is ranked by the city's own figure. For fourteen cities whose Wikidata figure is not the
city's own, the figure of the city at its national census is typed in `scripts/largest-city.ts`, each with its source
and day: INSAE's 2013 census of Benin, the Ghana Statistical Service's 2021 census, Sudan's 2008 census (Central Bureau
of Statistics), Eswatini's 2017 census (Central Statistical Office), and the 2015 census of Equatorial Guinea as
citypopulation.de (Thomas Brinkhoff) calculates the city's figure from it. Only facts are taken, each city's figure and
its day; no table is copied. They were checked against each country's Wikipedia infobox on 2026-11-17, and nothing
from Wikipedia is carried.

The time zones (`/zones`, and `capitalZone` in `/facts`) are from IANA's tzdb zone.tab (public domain, below) and a
fourth Wikidata snapshot (`data-sources/wikidata-zones-<day>.json`, CC0 on the same terms, read on 2026-11-11), asked for
by `scripts/fetch-zones.ts`: the IANA ids (P6687) of the zones each first-level subdivision is in (P421).

Each city's elevation (`elevation`) is from a fifth Wikidata snapshot (`data-sources/wikidata-city-elevations-<day>.json`,
CC0 on the same terms, read on 2026-11-13, when Wikidata's licensing page (https://www.wikidata.org/wiki/Wikidata:Licensing)
was read again: "All structured data ... is released into the public domain under Creative Commons Zero"), asked for by
`scripts/fetch-city-elevations.ts`: the best-ranked P2044 values of each city item, in metres as Wikidata normalises
them. Kuni keeps the middle of several values only where they lie within 50 m of each other, and none where they differ
more or lie outside what land has (`scripts/city-facts.ts`). No elevation model and no other source is used, and none
is made up. A time zone was asked for in the same way (P421 with the IANA id, P6687) and left out: a city's zone in
Wikidata is the "Pacific Time Zone" item, which names no IANA zone (4 of the first 4,500 items had an id).

What each city's population figure rests on is from a sixth Wikidata snapshot (`data-sources/wikidata-city-populations-<day>.json`,
CC0 on the same terms, read on 2026-11-17), asked for by `scripts/fetch-city-populations.ts`: every population statement
(P1082) of each city item that is not deprecated, with its rank, day (P585), method (P459) and the hosts of its reference
URLs (P854), and the items that are an island, an atoll, a reef island or an archipelago (P31). Kuni uses it to leave out a
figure that is not a count of the city's own (`scripts/cities.ts`); the hosts are only compared with a list of sites that
publish estimates, and nothing is read from those sites.

## Natural Earth's populated places

Natural Earth's 10m Populated Places, version 5.1.2 (https://www.naturalearthdata.com/, public domain: "No permission
is needed to use Natural Earth. Crediting the authors is unnecessary."), read from its own release on GitHub
(nvkelso/natural-earth-vector, tag v5.1.2) on 2026-11-11, are the second input of the cities. They fill a Japanese name,
a population or a point Wikidata has not got, add a capital where Wikidata names none, and give the cities Wikidata has
no item for (ids that start `ne:`). Places it marks "Historic place" are left out. Each city's `source` field says which
input a fact came from. It is credited here anyway.

Natural Earth's terms (https://www.naturalearthdata.com/about/terms-of-use/, read again on 2026-11-13) say its populated
places are in the public domain, which is why the places and their populations above are used. They also say its time zone
data came from International Mapping Associates for the sole purpose of creating a world base map, and they do not say
where the populated places' own TIMEZONE column comes from. Kuni therefore does **not** use that column, as of
2026-11-13: no city's time zone is read from Natural Earth, and `scripts/fetch-city-zones.ts` and its snapshot were
removed.

## Natural Earth, through Chizu

Natural Earth (https://www.naturalearthdata.com/) is in the public domain: "No permission is needed to use Natural
Earth. Crediting the authors is unnecessary." It is credited here anyway. Kuni ships no geometry. The build reads
which countries' outlines touch from the country maps of `@johnmorrisdotca/chizu` 1.0.2 (MIT, © John Morris), drawn
from Natural Earth 5.1.2 admin-0 countries at 1:50m, and keeps a border Wikidata states only where the outlines touch
(or where `BORDERS_ADDED` in `scripts/facts-config.ts` says why it is a border on land). Chizu is a development
dependency of the build and the demo; the published package depends on nothing.

## countries-list

```text
The MIT License (MIT)

Copyright (c) 2014 Annexare Studio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.```

From https://github.com/annexare/Countries, version 3.4.1 on npm. Its own name (`native`), capital and languages
are used as they are (from 1.1.0 the continent is UN M49's, from CLDR); its calling code only where Wikidata has none.

## IANA

`zone.tab` is from the IANA time zone database (version 2026e), which is in the public domain. Each city's time zone is chosen from
it: a country's one zone, the zone of the zone.tab city the city is at or nearest, or the zone of its subdivision (`/zones`). The list of top-level domains is
published by IANA at https://data.iana.org/TLD/tlds-alpha-by-domain.txt; only which two-letter domains exist is
read from it.

## ITU

The calling codes kuni chooses by hand, where Wikidata's item for a country gives several that differ (Türkiye: +36 and +90; Saint Helena:
+247, +27 and +290), are the ones the ITU assigns, read in the "List of Recommendation ITU-T E.164 assigned country codes" (Annex to ITU
Operational Bulletin No. 1114, 15 December 2016; https://www.itu.int/pub/T-SP-E.164D). Only which code is assigned to whom is used, as a
fact; the list itself is not copied into the package. Each choice has its reason beside it in `scripts/data-config.ts`, and the calling codes
that more than one country has are listed, each with the ITU's line, in `src/calling-codes.test.ts`.

## Not carried

No geometry, and no database with a share-alike condition: the richer country datasets under ODbL
(mledoze/countries, REST Countries) and the GPL `country-state-city` were looked at and deliberately not used; the
figures in `/facts` and `/subdivision-facts` are Wikidata's (CC0), and the land borders are checked against Natural
Earth (public domain). GeoNames was not used either: its codes are not ISO 3166-2, and its licence
asks for attribution on every use.

## Made with

`scripts/build-data.ts` reads the inputs with Node alone. `cldr-core`, `cldr-localenames-full`, `countries-list`
and `@johnmorrisdotca/chizu` are development dependencies of the build (and Chizu of the demo) only: the package
depends on nothing at run time.
