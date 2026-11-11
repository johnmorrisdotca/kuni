---
title: Architecture and source data
section: explanation
order: 9
description: Read the complete original source tree and generation boundaries.
---

## Original architecture

```text
src/
├── element.ts             country and subdivision cards
├── element-define.ts      register the card element
├── index.ts            the main entry: the countries and their lookups
├── codes.ts            the "/codes" entry: the codes alone
├── subdivisions.ts     the "/subdivisions" entry: every subdivision and its lookups
├── load.ts             the "/load" entry: one country's subdivisions by dynamic import
├── facts.ts            the "/facts" entry: population, area, coordinates, borders and conventions
├── zones.ts            the "/zones" entry: a subdivision's time zone, and the zone at a point
├── subdivision-facts.ts  the "/subdivision-facts" entry: one country's subdivision facts by dynamic import
├── groupings.ts        the "/groupings" entry: continents, UN M49, bodies, informal groupings, regions
├── withdrawn.ts        the "/withdrawn" entry: the countries ISO 3166-3 lists as withdrawn, and the codes they held
├── cities.ts           the "/cities" entry: joining tiers of cities, and finding one by id, country or nearness
├── city-rows.ts        turning a city's compact row into a City
├── rank.ts             the figure a city is ranked by: its urban area's people, else its own; after the others inside another's area
├── ja-short.ts         a city's short Japanese name for a map label: 東京, not 東京都
├── ja-reading.ts       a Japanese name read in hiragana where its words are kana: ゴヤ (アルゼンチン), ごや
├── city-start.ts       which part of a split tier holds a city: the first letter of a word of a name
├── places.ts           the "/places" entry: the countries of a continent, and a search over countries and cities
├── fold.ts             folding what somebody typed: case, accents, width, kana
├── rows.ts             turning the data's compact rows into objects
├── types.ts            the shapes of a country and a subdivision, and the kinds of place
├── version.ts          the package's version
├── data/               written by scripts/build-data.ts: countries, codes, facts, groupings, and files per country
├── subdivisions/       written by scripts/build-data.ts: the "/subdivisions/<code>" entries
├── subdivision-facts/  written by scripts/build-data.ts: the "/subdivision-facts/<code>" entries
└── cities/             written by scripts/build-data.ts: the "/cities/<tier>", "/cities/<code>", "/cities/names-<code>" and "/cities/<tier>-<key>" entries
```

`scripts/build-data.ts` (`pnpm data`) makes `src/data/` from the inputs in `data-sources/` and three npm packages, with no network, and checks every input's SHA-256 first; run twice, it leaves the tree as it was. `scripts/data-config.ts`, `scripts/facts-config.ts`, `scripts/groupings-config.ts` and `scripts/withdrawn-config.ts` hold the few things written by hand, each with its reason; `scripts/facts.ts`, `scripts/subdivision-facts.ts`, `scripts/groupings.ts` and `scripts/withdrawn.ts` apply the rules written at their tops. Tests sit beside the code (`*.test.ts`). `scripts/` also builds the demo and its API page and checks the package as npm packs it; `demo/` is the page and `e2e/` its browser tests.


## Documentation generation

The shared generator indexes the explicit public resources and checks imported examples. The data writer also owns their comments; its --docs-only path refreshes examples offline without changing source snapshots or data values. The original import/require condition branches and their distinct ESM/CommonJS types stay intact. Existing wildcard resources receive explicit names pointing to the same files; the linked catalogue is generated from those names.
