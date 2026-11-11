# The inputs

Everything `pnpm data` (`scripts/build-data.ts`) reads that is not an npm package is kept here, so that the
build never touches the network and makes the same data from the same files every time. `sources.json` lists
each file with the address it came from, the day it was read and its SHA-256; the build refuses a file whose
bytes are not the recorded ones.

| File | From | Read | Licence |
| --- | --- | --- | --- |
| `cldr/release-48-2/subdivisions-en.xml` | https://raw.githubusercontent.com/unicode-org/cldr/release-48-2/common/subdivisions/en.xml | 2026-10-09 | Unicode-3.0 |
| `cldr/release-48-2/subdivisions-ja.xml` | https://raw.githubusercontent.com/unicode-org/cldr/release-48-2/common/subdivisions/ja.xml | 2026-10-09 | Unicode-3.0 |
| `cldr/release-48-2/validity-subdivision.xml` | https://raw.githubusercontent.com/unicode-org/cldr/release-48-2/common/validity/subdivision.xml | 2026-10-09 | Unicode-3.0 |
| `iana/tzdb-2026e/zone.tab` | https://data.iana.org/time-zones/tzdb-2026e/zone.tab | 2026-10-09 | Public domain |
| `iana/tlds-alpha-by-domain.txt` | https://data.iana.org/TLD/tlds-alpha-by-domain.txt (version 2026100900) | 2026-10-09 | IANA, a list of facts |
| `wikidata-2026-10-09.json` | https://query.wikidata.org/sparql, the two queries written in the file | 2026-10-09 | CC0 |
| `wikidata-facts-2026-10-09.json` | https://query.wikidata.org/sparql, the queries written in the file | 2026-10-09 | CC0 |
| `wikidata-codes-2026-10-10.json` | https://query.wikidata.org/sparql, the queries written in the file | 2026-10-10 | CC0 |
| `wikidata-cities-<day>.json` | https://query.wikidata.org/sparql, the queries written in the file | the day it was read | CC0 |
| `wikidata-metros-<day>.json` | https://query.wikidata.org/sparql, the queries written in the file (`node scripts/fetch-metros.ts`) | the day it was read | CC0 |
| `wikidata-zones-<day>.json` | https://query.wikidata.org/sparql, the query written in the file (`node scripts/fetch-zones.ts`) | the day it was read | CC0 |
| `ghsl-ucdb-r2024a.json` | https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/, the GHSL Urban Centre Database R2024A V1-2, theme General Characteristics, cut to each centre's id, names, country, 2025 population and centroid in degrees (`node scripts/fetch-ghsl.ts`) | 2026-11-11 | CC BY 4.0, © European Union 1995-2026; the credit and the changes are in the file and in NOTICE.md |
| `urban-areas-<day>.json` | Statistics Canada Tables 17-10-0148-01 and 98-10-0003-01, the U.S. Census Bureau's `cbsa-est2024-alldata.csv`, and the OECD Data Explorer's `DSD_FUA_DEMO@DF_AGE_SEX`, cut to each area's code, name and latest population and Canada's municipalities by area (`node scripts/fetch-urban.ts`) | the day it was read | Statistics Canada Open Licence; public domain (U.S. government work); OECD Terms and Conditions, section 3: each credit is in the file and in NOTICE.md |
| `statcan-cma-2021.json` | https://www150.statcan.gc.ca/n1/tbl/csv/98100005-eng.zip, Statistics Canada Table 98-10-0005-01, cut to name, province, DGUID, kind and 2021 population (`node scripts/fetch-statcan.ts`) | 2026-11-11 | Statistics Canada Open Licence; the credit is in the file and in NOTICE.md |
| `natural-earth-populated-places-5.1.2.json` | https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_populated_places.geojson, cut down to the columns the build uses | the day it was read | Public domain |
| `city-ids.json`, `city-id-aliases.json` | `city-ids.json` is written by `pnpm data:record-ids`, at a release, and holds every id a release has had; `city-id-aliases.json` is written by hand: an id that is no longer a city's, with the id it was merged into, or null | | MIT |
| `expected-ja-gaps.json` | Written by `pnpm data:report --accept`: the subdivisions with no Japanese name | | MIT |

The CLDR files are from the release tag `release-48-2`, the same release as the `cldr-core` and
`cldr-localenames-full` packages (48.2.0) the build also reads. The time-zone table is from the tagged tzdb
release 2026e. The TLD list has no release: IANA keeps one current file, and its first line names its version.

## Refreshing them

```sh
pnpm data:fetch       # the CLDR and IANA files, again, and their lines in sources.json
pnpm data:wikidata    # a new Wikidata snapshot of the names, named for the day; the old one is removed
pnpm data:facts       # a new Wikidata snapshot of the facts, named for the day; the old one is removed
pnpm data:codes       # a new Wikidata snapshot of the IOC and withdrawn codes, named for the day; the old one is removed
pnpm data:cities      # a new Wikidata snapshot of the cities and Natural Earth's populated places, named for the day; one query at a time, by hand
pnpm data             # rebuild src/data/ from what is here
pnpm data:report      # the coverage, and docs/ja-gaps.md
```

A new CLDR release means changing `CLDR_TAG` in `scripts/fetch-sources.ts` and `scripts/build-data.ts` and the
two CLDR versions in `package.json` together.

## The Wikidata snapshot

`wikidata-<day>.json` holds the answer to two SPARQL queries over query.wikidata.org, grouped by code and
sorted so that two snapshots compare line by line:

- for every ISO 3166-2 code (P300, deprecated statements left out): the item, its Japanese label, its name in
  kana (P1814) and the classes it is an instance of (P31) with their English labels;
- for every ISO 3166-1 alpha-2 code (P297): the item, its Japanese label, its name in kana and its calling
  code (P474).

Wikidata's structured data is CC0 (https://www.wikidata.org/wiki/Wikidata:Licensing).

## The Wikidata codes snapshot

`wikidata-codes-<day>.json` (`scripts/fetch-wikidata-codes.ts`) holds the answers to the four queries written in it:

- for every ISO 3166-1 alpha-2 code (P297, deprecated statements left out): the International Olympic Committee country code (P984);
- for every item with an ISO 3166-3 code (P773): its English and Japanese labels (used for the names), and, kept in the snapshot but not used to make records, when it began (P571) and ended (P576), every alpha-2 (P297), alpha-3 (P298) and numeric (P299) code it held with the rank, start and end of each statement, and the items that replaced it (P1366) or followed it (P156).

`scripts/withdrawn.ts` turns them into the `/withdrawn` entry and the `ioc` field and stops with every problem listed when a record cannot be stood behind; `scripts/withdrawn-config.ts` holds ISO 3166-3's table (the withdrawn countries' codes, years and successors, which are not Wikidata's) and the few name fixes, each with its reason, and `docs/withdrawn.md` lists them.

## The Wikidata facts snapshot

`wikidata-facts-<day>.json` (`scripts/fetch-wikidata-facts.ts`) holds the answers to the queries written in it,
grouped by code, one line a code, each row's columns named in its `columns`:

- for every ISO 3166-1 code: the items holding it and whether each was dissolved; the capital (P36) with its labels
  and coordinates; the best-ranked population (P1082) and area (P2046) with their dates and parts; the coordinates
  (P625); the driving side (P1622); the countries it shares a border with (P47); and its memberships (P463) of the
  bodies in `scripts/groupings-config.ts`, with their start, end and role;
- the capitals named by hand in `scripts/facts-config.ts`, with their labels and coordinates;
- for every ISO 3166-2 code: the capital with its labels, kana name and coordinates, the best-ranked population and
  area, and the coordinates.

It also needs the land outlines of `@johnmorrisdotca/chizu` (an npm development dependency, pinned to 1.0.2, read
from `node_modules` as CLDR is) to tell a land border from one at sea.

## The cities snapshot

`wikidata-cities-<day>.json` (`scripts/fetch-cities.ts`, `pnpm data:cities`) holds one line for each of the items the
cities are made from, and the queries written in it. Wikidata's endpoint stops a query at 60 seconds, so the join over
every item with a population is asked in steps, one query at a time with a pause between, never on a timer:

- the classes of human settlement (Q486972 and everything below it through P279);
- the items with a best-ranked population (P1082) of 15,000 or more and coordinates (P625), in bands of population;
- what each is an instance of (P31), in chunks, keeping those that are a settlement;
- the current capitals (P36) of every item with an ISO 3166-1 (P297) or ISO 3166-2 (P300) code;
- for every kept item, every capital and every Natural Earth place that names a Wikidata item, in chunks: the English
  and Japanese labels, the native name (the label in the country's official language, P37 with P424; the native label P1705, which often names a regional language, only where there is none),
  the coordinates, the country's alpha-2 code, the best-ranked populations with their dates (P585) and the ISO 3166-2
  codes (P300) of the item and the places it is in (P131, up to four steps up).

Items whose every settlement class is an area or a part of a city (a metropolitan or urban area, a municipal arrondissement, a ward of Japan, a city district, a neighbourhood, a metropolitan city of Italy, a district of Turkey, Moscow or Taiwan, and the others `AREAS` lists in `scripts/fetch-cities.ts`) are left out of the snapshot, unless they are a capital or Natural Earth names them; Tokyo's special wards are kept.

Each answer is kept in `.cities-cache/` (git-ignored), so a run that stops carries on; `--fresh` empties it. The
User-Agent names the package and its repository, and no person.

`natural-earth-populated-places-5.1.2.json` is Natural Earth's 10m Populated Places (public domain), read from its own
release, cut down to the name, English and Japanese names, point, population, class, country code and Natural Earth's
number; the SHA-256 of the whole file at the address is in `sources.json`. Places it marks "Historic place" are left out.
