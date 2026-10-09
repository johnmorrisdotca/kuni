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
| Each country's own name, capital, continent and languages, and the calling code where Wikidata has none | countries-list 3.4.1 by Annexare Studio | MIT, below |
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

From https://github.com/annexare/Countries, version 3.4.1 on npm. Its own name (`native`), capital, continent and
languages are used as they are; its calling code only where Wikidata has none.

## IANA

`zone.tab` is from the IANA time zone database, which is in the public domain. The list of top-level domains is
published by IANA at https://data.iana.org/TLD/tlds-alpha-by-domain.txt; only which two-letter domains exist is
read from it.

## Not carried

No geometry, population, area or other figure, so no database with a share-alike condition is carried: the
richer country datasets under ODbL (mledoze/countries, REST Countries) and the GPL `country-state-city` were
looked at and deliberately not used. GeoNames was not used either: its codes are not ISO 3166-2, and its licence
asks for attribution on every use.

## Made with

`scripts/build-data.ts` reads the inputs with Node alone. `cldr-core`, `cldr-localenames-full` and
`countries-list` are development dependencies of the build only: the package depends on nothing at run time.
