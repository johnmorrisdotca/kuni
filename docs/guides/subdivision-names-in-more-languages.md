---
title: Subdivision names in more languages
section: how-to
order: 20
description: Load the names of states, provinces and prefectures in Spanish, German or Chinese, with where each name came from.
---

## Load one language

Each language is its own entry, apart from the country names and from the main entry, so a page pays for the one language it shows and for nothing else. The languages are Spanish (`es`), German (`de`), Simplified Chinese (`zh-Hans`) and Traditional Chinese (`zh-Hant`). English and Japanese subdivision names stay in the main entry.

```ts
import names from "@johnmorrisdotca/kuni/subdivision-names/es";

console.log(names.subdivisionName("JP-13"));                          // "Tokio"
console.log(names.subdivisionNameSource("JP-13")?.source);            // "cldr"
console.log(names.subdivisionByName("cataluna"));                     // "ES-CT"
console.log(names.subdivisionsOf("ES").length > 15);                  // true
```

`subdivisionName(code)` takes an ISO 3166-2 code in any case and answers `null` for a code that is not a subdivision and for one the language has no name for. `subdivisionsOf(country)` lists the country's named subdivisions in code order, each with `code`, `country`, `shortCode`, `name` and `source`. What a subdivision is (its kind, its parent, its level) is asked of the main entry's `subdivision(code)`; this entry holds names only.

## Searching by name

`subdivisionsByName(text, { country })` answers every code a typed name could be, and `subdivisionByName` the one code, or `null` when the name is more than one place (name the country to settle it). The comparison folds the text as the same language's country names do, so `cataluna` finds Cataluña. A name from another language finds nothing.

## Where each name came from

Every name carries its source, `subdivisionNameSource(code)`: `{ source, tag, draft }`. The source is Unicode CLDR 48.2 (Unicode License v3) or a Wikidata label (CC0). CLDR 48.2 marks nearly all of its subdivision names `provisional`, and `draft` says so; a page that wants only approved names can filter on it. A name neither source has is `null`: never another language's name, never a machine translation, and never Simplified turned into Traditional or the other way. The two Chinese entries are separate on purpose. A name goes in `zh-Hans` only if it is written in Simplified characters, and a name CLDR's Simplified file gives in Traditional characters is left out of it.

| Language | Subdivisions named | Of 5,050 |
| --- | --- | --- |
| Spanish | 4,794 | 95% |
| German | 4,895 | 97% |
| Simplified Chinese | 2,671 | 53% |
| Traditional Chinese | 3 | 0% |

These are the figures for the CLDR names alone. `docs/subdivision-names.md` in the repository holds the live figures, every name that was left out and why, and a list for a native reader to check. Spanish and German are CLDR's names as CLDR writes them, so German names Tokyo "Präfektur Tokio" and Spanish "Tokio".
