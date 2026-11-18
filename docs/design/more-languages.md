# Subdivision names in more languages (MODULES-1594)

## What is asked

Spanish, German and Chinese (Simplified and Traditional) names for the subdivisions, beside the English and Japanese ones. The country names for these languages were already in `/names/<language>` from CLDR 48.2, so this is the subdivisions only.

## Decisions

- **A second entry, not more functions on `/names/<language>`.** A page that needs only a country's name must not carry 5,000 subdivision names. `/subdivision-names/<language>` is its own entry, built by its own script, with its own size budget (`src/sizes.test.ts`). The country-names guide used to promise "the same entry"; it now points at the new one.
- **The main entry does not change.** It keeps English and Japanese. What a subdivision is (kind, parent, level) is asked of the main entry's `subdivision(code)`; the new entry holds names and their sources.
- **Two sources, in this order.** Unicode CLDR 48.2 (`subdivisions-<locale>.xml`, Unicode License v3), then Wikidata labels (CC0) for the items kuni already holds for each code (`data-sources/wikidata-<day>.json`). A name found in both that differs is kept from CLDR and written to the review document as a disagreement.
- **Every name carries its source** (`cldr` or `wikidata`, the locale or tag, CLDR's draft status). CLDR 48.2 marks nearly all of its subdivision names provisional; the entry says so rather than hiding it.
- **Absent means `null`.** No machine translation, no copying another language's name in, no Simplified turned into Traditional. `zh-Hans` and `zh-Hant` are two languages, each with its own CLDR locale (`zh`, `zh_Hant`) and Wikidata tags (`zh-hans`, `zh-cn`, `zh-sg`, `zh-my`; `zh-hant`, `zh-tw`, `zh-hk`, `zh-mo`). A bare `zh` label counts for Simplified only when it passes the script check.
- **A name must pass `checkName`** (`scripts/subdivision-names-config.ts`): no unbalanced brackets or quotes, at least one Han ideograph for Chinese, and no character that belongs only to the other script or to the Japanese form of a character (県, 関, 広, 沢). A name that fails is left out and listed in the review document with the reason. CLDR's own `zh` file gives 2,199 names in Traditional characters, and these are left out of `zh-Hans`, not converted.
- **Search folds as the language's country names do** (`foldFor` from `names.ts`), with spaces removed so `baden wurttemberg` finds `Baden-Württemberg`.

## How the data is fetched

- CLDR: four raw files from `unicode-org/cldr` at `release-48-2`, fetched by `scripts/fetch-more-languages.ts` with a pause of at least 1.2 seconds between requests, robots.txt read first, a descriptive User-Agent, the files cached outside the repository (`~/.cache/kuni-data`), their SHA-256 in `data-sources/sources.json`, and every request in `data-sources/requests-<day>.log`.
- Wikidata: `query.wikidata.org/robots.txt` disallows `/sparql` and `www.wikidata.org/robots.txt` disallows `/w/` and `/api/`, so neither is called. The truthy dump (`dumps.wikimedia.org`, one file, no robots disallow) is about 40 GB compressed, so it is never stored: `scripts/extract-dump-subset.ts` streams it (curl, with a Range request to resume) through `bzip2 -dc` into a filter that keeps every triple of the 11,550 items kuni already holds, in `~/.cache/kuni-data/dump-subset-<day>.nt`. `scripts/extract-wikidata-labels.ts` then reads the es, de and zh labels from that subset. The same subset is what MODULES-1599 rebuilds the 2026-10 snapshots from, so the dump is read once for both.

## What a native reader should check

`docs/subdivision-names.md` lists the figures, every name left out with its reason, and the Wikidata-only names (a human has not seen them). Japanese is not involved: John does not read Spanish, German or Chinese either, so the review is for a native reader, and the entries say so in the guide.

## Not done

- A Wikidata pass for languages beyond these four.
- Subdivision names inside `/load` or the card.
