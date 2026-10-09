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
| `expected-ja-gaps.json` | Written by `pnpm data:report --accept`: the subdivisions with no Japanese name | | MIT |

The CLDR files are from the release tag `release-48-2`, the same release as the `cldr-core` and
`cldr-localenames-full` packages (48.2.0) the build also reads. The time-zone table is from the tagged tzdb
release 2026e. The TLD list has no release: IANA keeps one current file, and its first line names its version.

## Refreshing them

```sh
pnpm data:fetch       # the CLDR and IANA files, again, and their lines in sources.json
pnpm data:wikidata    # a new Wikidata snapshot, named for the day; the old one is removed
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
