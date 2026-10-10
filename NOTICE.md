# Notice: the data's licences

The code of this package is under the MIT licence (see [LICENSE](LICENSE)). The data in `src/data/` (and
`dist/`) is made from other people's work under their terms, which travel with it. Each data file opens with
lines saying what it was made from, and `data-sources/sources.json` records every downloaded input with its
address, the day it was read and its SHA-256.

| What | Made from | Terms |
| --- | --- | --- |
| Country names in English and Japanese, their short and variant forms, alpha-3 and numeric codes, currencies, UN M49 continents and subregions | Unicode CLDR 48.2 (`cldr-localenames-full` and `cldr-core` 48.2.0 on npm) | Unicode-3.0, below |
| Subdivision codes, English and Japanese names, the levels they are at and what they are inside | Unicode CLDR 48.2 (`common/subdivisions/en.xml`, `ja.xml`, `common/validity/subdivision.xml` at the tag `release-48-2`, and `cldr-core`'s `subdivisionContainment.json` and `aliases.json`) | Unicode-3.0, below |
| Japanese names of the subdivisions CLDR has none for, the kana readings of Japan's prefectures, calling codes, and what kind of place each subdivision is | Wikidata, the snapshot `data-sources/wikidata-2026-10-09.json` | CC0, below |
| Each country's own name, capital and languages, and the calling code where Wikidata has none | countries-list 3.4.1 by Annexare Studio | MIT, below |
| Each country's capital in Japanese and its coordinates, population, area (with the year each is for), coordinates, driving side and the countries it shares a border with; each subdivision's capital, population, area and coordinates; the days members joined and left international bodies | Wikidata, the snapshot `data-sources/wikidata-facts-2026-10-09.json` | CC0, below |
| Which land borders are real (two outlines touch) | Natural Earth 5.1.2 admin-0 countries at 1:50m, as drawn by `@johnmorrisdotca/chizu` 1.0.2 (a development dependency of the build; the package does not depend on it) | Public domain (Natural Earth); MIT (Chizu), below |
| The first day of the week, the measurement system, the paper size and the clock; the UN M49 areas and their members; the members of the United Nations | Unicode CLDR 48.2 (`cldr-core` 48.2.0: weekData, measurementData, timeData, territoryContainment) | Unicode-3.0, below |
| The members of each international body as the body lists them, the informal groupings with their definitions, the regions inside a country, the readings of the groupings' Japanese names, and the choices in `scripts/facts-config.ts` and `scripts/groupings-config.ts` | Written for this package, from the sources named beside each, read on 2026-10-09 | MIT; lists of facts |
| The International Olympic Committee's country codes; the withdrawn ISO 3166-3 countries' four-letter codes, former alpha-2, alpha-3 and numeric codes, names in English and Japanese, the years each code was in force and the countries that replaced them | Wikidata, the snapshot `data-sources/wikidata-codes-2026-10-10.json` | CC0, below |
| The few years, codes, names and successors of withdrawn countries that Wikidata does not give, and the IOC code of the Netherlands | Written for this package, in `scripts/withdrawn-config.ts`, from the list ISO 3166-3 publishes (a list of facts), each with its reason | MIT; lists of facts |
| Time zones | IANA time zone database 2026e, `zone.tab` | Public domain |
| Country-code top-level domains | IANA's list of top-level domains (version 2026100900) | A list of facts, published by IANA |
| The aliases ("Holland", "UK", 米国), the readings of country names written in kanji, Hokkaido's and Fukuoka's readings, and the Japanese words for kinds of place the build looks for | Written for this package, in `scripts/data-config.ts` | MIT |

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

The facts snapshot (`data-sources/wikidata-facts-2026-10-09.json`) holds the answers to the queries written in it:
for every country and every subdivision, its capital with the capital's English and Japanese labels, kana name and
coordinates; its best-ranked population and area with the day each is for; its coordinates; and, for countries, the
side of the road it drives on, the countries it shares a border with and the international bodies it is a member
of. `scripts/facts.ts`, `scripts/subdivision-facts.ts` and `scripts/groupings.ts` say how each is chosen. Figures are
kept as Wikidata gives them, rounded only for coordinates (two decimal places).

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

`zone.tab` is from the IANA time zone database, which is in the public domain. The list of top-level domains is
published by IANA at https://data.iana.org/TLD/tlds-alpha-by-domain.txt; only which two-letter domains exist is
read from it.

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
