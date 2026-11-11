# The cities: what is known

Written by `scripts/build-data.ts` from `scripts/cities.ts`; do not edit it by hand. Every figure here is counted
from the two inputs: the Wikidata snapshot of 2026-11-11 (CC0) and Natural Earth 5.1.2's 10m Populated Places (public domain).

## The tiers

A city is in one tier only: a capital of any size is in `capitals`; every other city is in the tier its population names.

| Tier | Entry | Holds | Cities | With a Japanese name | Japanese name from Natural Earth | Population from Natural Earth |
|---|---|---|---:|---:|---:|---:|
| `capitals` | `@johnmorrisdotca/kuni/cities/capitals` | every capital, of a country or of a subdivision, of any size | 4,766 | 4,395 (92.2%) | 62 | 239 |
| `1m` | `@johnmorrisdotca/kuni/cities/1m` | the cities of a million people or more that are not capitals | 441 | 410 (93.0%) | 6 | 8 |
| `100k` | `@johnmorrisdotca/kuni/cities/100k` | the cities of 100,000 to a million people that are not capitals | 4,332 | 3,216 (74.2%) | 51 | 114 |
| `15k` | `@johnmorrisdotca/kuni/cities/15k` | the cities of 15,000 to 100,000 people that are not capitals | 23,968 | 13,766 (57.4%) | 339 | 203 |
| all | | | 33,507 | 21,787 (65.0%) | 458 | 564 |

## How a city is chosen

- **Wikidata**: the items that are an instance of a human settlement (Q486972 and every class below it through P279), have coordinates (P625) and a best-ranked population (P1082) of 15,000 or more: 82,364 items with that population and coordinates, of which 29,712 are a city, town or other settlement (150 more are only a metropolitan area, urban area or conurbation, and are left out; the rest are districts, counties and the like); every item that is the current capital (P36) of a country or a subdivision; and every item Natural Earth's places name. The queries are written in the snapshot file itself.
- **Natural Earth**: 7,336 places ("Historic place" left out). 7,186 name a Wikidata item (WIKIDATAID) that the snapshot holds; 4 more were matched by position (within 15 km, same country, same name); the 146 left have no Wikidata item here: 55 are cities of their own, with an id `ne:<Natural Earth's number>` (a capital, or 15,000 people or more); the others have no country, or are small and no capital, and are left out.
- **Which source wins**: Wikidata's label, point and population are kept where it has them. Natural Earth fills a Japanese name, a population or a point Wikidata does not have, and a capital where Wikidata names none; each city says which in its `source` field.
- **Population**: the best-ranked statement of the latest day (P585); of statements with no day, the largest. Natural Earth's `POP_MAX` has no day.
- **Subdivision**: the ISO 3166-2 code, from Wikidata's P300 on the city or the places it is in (P131), restricted to the first-level subdivisions kuni lists for its country; where there are several, the first in code order.
- **Areas**: Wikidata's human settlements include areas of several cities and the units that hold them. An item that is only a metropolitan area, an urban area, a conurbation, an urban agglomeration or a built-up area (by its class) is left out when the snapshot is made, and so is one whose English name ends in Province, County, Prefecture, Governorate, District, Regency, Oblast or Department, or names an area (metropolitan area, urban area, agglomeration, conurbation), or starts 'County of', 'Province of', 'District of', 'Municipality of' or 'City of', unless it is a capital or Natural Earth names it. Some cities with such a name are lost; a city that Natural Earth names is kept.
- **Names**: English is Wikidata's label, else Natural Earth's; a city with neither is left out. Japanese is Wikidata's label, else Natural Earth's, else `null`: never an English name copied in, and never made up. The native name is Wikidata's native label (P1705), else its label in the country's official language (P37, language code P424), and `null` where it is the English name.

## What was left out

Of the 38,134 items in the snapshot: 757 had no English name (in Wikidata or Natural Earth), 9 no coordinates, 221 no country, 1 no population and were no capital, 2,319 had an English name of an area or an administrative unit (a metropolitan area, an urban area, a province, a county, a district) and no capital or Natural Earth place behind them, and 1,375 fell below 15,000 people by the figure used (they were in because another statement was above it, or Natural Earth names them).

## What is missing

- **Japanese name**: 11,720 of 33,507 cities have none, in either source; the field is `null`.
- **Native name**: 17,439 cities have none or it is the English name; the field is `null`.
- **Subdivision**: 1,376 cities have none (Wikidata does not place them in a first-level subdivision kuni lists).

Natural Earth release 5.1.2; Wikidata read 2026-11-11.
