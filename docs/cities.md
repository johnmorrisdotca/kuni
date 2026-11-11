# The cities: what is known

Written by `scripts/build-data.ts` from `scripts/cities.ts`; do not edit it by hand. Every figure here is counted
from the two inputs: the Wikidata snapshot of 2026-11-11 (CC0) and Natural Earth 5.1.2's 10m Populated Places (public domain).

## The tiers

`capitals` holds every capital of any size; `1m`, `100k` and `15k` hold every city of that many people, capitals included, so a city can be in `capitals` and in one of the others. `citySet` keeps a city once.

| Tier | Entry | Holds | Cities | With a Japanese name | Japanese name from Natural Earth | Population from Natural Earth |
|---|---|---|---:|---:|---:|---:|
| `capitals` | `@johnmorrisdotca/kuni/cities/capitals` | every capital, of a country or of a subdivision, of any size | 4,278 | 3,984 (93.1%) | 34 | 183 |
| `1m` | `@johnmorrisdotca/kuni/cities/1m` | the cities of a million people or more (capitals too) | 694 | 682 (98.3%) | 6 | 8 |
| `100k` | `@johnmorrisdotca/kuni/cities/100k` | the cities of 100,000 to a million people (capitals too) | 5,414 | 4,484 (82.8%) | 50 | 159 |
| `15k` | `loadCities("15k")` | the cities of 15,000 to 100,000 people (capitals too); from the countries' own files, not a file of its own | 23,334 | 14,616 (62.6%) | 387 | 306 |
| every city once | | | 30,616 | 20,710 (67.6%) | 448 | 538 |

## How a city is chosen

- **Wikidata**: the items that are an instance of a human settlement (Q486972 and every class below it through P279), have coordinates (P625) and a best-ranked population (P1082) of 15,000 or more: 82,364 items with that population and coordinates, of which 25,250 are a city, town or other settlement (4,612 more are only a metropolitan area, urban area or conurbation, and are left out; the rest are districts, counties and the like); every item that is the current capital (P36) of a country or a subdivision; and every item Natural Earth's places name. The queries are written in the snapshot file itself.
- **Natural Earth**: 7,336 places ("Historic place" left out). 7,159 name a Wikidata item (WIKIDATAID) that the snapshot holds; 27 name an item that is an area or a unit (Jamalpur naming Jamalpur District) and are matched again as if they named none; 31 more were matched by position (within 15 km, same country, same name); the 51 left have no Wikidata item here: 51 are cities of their own, with an id `ne:<Natural Earth's number>` (a capital, or 15,000 people or more); the others have no country, or are small and no capital, and are left out.
- **Which source wins**: Wikidata's label, point and population are kept where it has them. Natural Earth fills a Japanese name, a population or a point Wikidata does not have, and a capital where Wikidata names none; each city says which in its `source` field.
- **Population**: the best-ranked statement of the latest day (P585); of statements with no day, the largest. Natural Earth's `POP_MAX` has no day.
- **Subdivision**: the ISO 3166-2 code, from Wikidata's P300 on the city or the places it is in (P131), restricted to the first-level subdivisions kuni lists for its country; where there are several, the first in code order.
- **Areas**: Wikidata's human settlements include areas of several cities and the units that hold them. An item that is only a metropolitan area, an urban area, a conurbation, an urban agglomeration or a built-up area (by its class) is left out when the snapshot is made, and so is one whose English name ends in Province, County, Prefecture, Governorate, District, Regency, Oblast or Department, or names an area (metropolitan area, urban area, agglomeration, conurbation), or starts 'County of', 'Province of', 'District of', 'Municipality of', 'City of' or 'Greater' (Greater Sudbury, Greater Napanee and Greater Noida are cities and stay), or ends in a number (Prague 5, Sector 3, Municipio 2: a numbered district), or starts 'Metropolitan', 'Metro', 'Metropolis of', 'Commune' or 'Sectorul' (Metropolitan Toronto, Metro Manila, the Metropolis of Lyon, Burundi's communes, Chișinău's sectors), or names a regional municipality or a 'State of' (North East State of Somalia), or ends in 'Region' or 'Region of …' (Øresund Region, Kurdistan Region of Iraq; a name with a comma, a town told apart by its region, stays), 'Capital City' (Podgorica Capital City, the unit round the city), 'Urban Corridor' or 'New Area' (Binhai New Area), unless it is a capital or Natural Earth names it. A few items are left out by name, each with its reason (NOT_CITIES in scripts/cities.ts: Moro, Papua New Guinea, at 6.3 million people). Some cities with such a name are lost; a city that Natural Earth names is kept.
- **Capitals**: a country has exactly one national capital (Natural Earth's "Admin-0 capital" among the items that are a capital of it, else the most populous Wikidata names): 242 cities are one. Another seat of government (Cape Town, Kyoto) is an `alternate` (11); the capital of a subdivision needs an ISO 3166-2 code kuni lists (4,025), and Natural Earth's subdivision capitals with none (295) are not capitals here. Every capital says what it is the capital of in `capitalOf`.
- **One city once**: two items with one name in one country within 15 km, one of them of 100,000 people or more, are one city; the one with a capital behind it, else Natural Earth's, else the more populous, is kept.
- **Names**: English is Wikidata's label, else Natural Earth's; a city with neither is left out. Japanese is Wikidata's label (always preferred: it is curated by people), else Natural Earth's (not where it is written in hiragana for a place outside Japan, which marks a machine's guess), else `null`: never an English name copied in, and never made up; the few written for this package (`JA_NAMES` in `scripts/cities.ts`, each with its reason: East Jerusalem is 東エルサレム, not the whole city's エルサレム) say `kuni` as their source. The native name is the label in the country's official language (P37, language code P424; the first in code order that has a label, English left out), and Wikidata's native label (P1705, which often names a regional language: Kölle for Köln) only where there is none; it is `null` where it is the English name.

## What was left out

Of the 33,692 items in the snapshot: 693 had no English name (in Wikidata or Natural Earth), 9 no coordinates, 211 no country, 8 no population and were no capital, 634 had an English name of an area or an administrative unit (a metropolitan area, an urban area, a province, a county, a district) and no capital or Natural Earth place behind them, 111 were the same city as another item (Tokyo is two), and 1,556 fell below 15,000 people by the figure used (they were in because another statement was above it, or Natural Earth names them).

## What is missing

- **Japanese name**: 9,906 of 30,616 cities have none, in either source; the field is `null`.
- **Native name**: 15,814 cities have none or it is the English name; the field is `null`.
- **Subdivision**: 1,267 cities have none (Wikidata does not place them in a first-level subdivision kuni lists).

Natural Earth release 5.1.2; Wikidata read 2026-11-11.
