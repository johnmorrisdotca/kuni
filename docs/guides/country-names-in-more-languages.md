---
title: Country names in more languages
section: how-to
order: 19
description: Load one language's country names, from CLDR, and search them the way that language is typed.
---

## Load one language

Each language is its own entry, so a page pays for the one it shows (about 4 kB gzip) and for none of the others. The languages are French (`fr`), Spanish (`es`), German (`de`), Simplified Chinese (`zh-Hans`), Traditional Chinese (`zh-Hant`), Korean (`ko`), Portuguese (`pt`), Arabic (`ar`) and Russian (`ru`). English and Japanese stay in the main entry.

```ts
import names from "@johnmorrisdotca/kuni/names/fr";

console.log(names.countryName("JP"));                 // "Japon"
console.log(names.countryName("GB", { short: true }));  // "R.-U."
console.log(names.countryVariants("CZ"));             // ["République tchèque"]
console.log(names.countryByName("la France"));        // "FR"
```

`countryName(code, { short })` takes any alpha-2 code in any case and answers `null` for a code that is not a country. `short: true` gives the short form where CLDR has one and the full name otherwise. `countryByName` answers a code, not a country object, because the entry carries names only; ask the main entry's `country(code)` for the rest. `countries({ order })` lists all 250 with `code`, `name`, `shortName` and `variants`; `order: "name"` sorts by the name folded for the language in plain code-unit order, which is stable everywhere but is not a locale's collation.

## What the search ignores

The same folding as the main entry (case, width, accents and marks, punctuation, apostrophes) applies in every language, and each language adds what its readers type alike:

- **French, Spanish, Portuguese and German:** a leading article is dropped when the whole text finds nothing (`la France`, `l'Espagne`, `el Perú`, `o Brasil`, `die Schweiz`). German also knows `Oesterreich` for Österreich.
- **Arabic:** the vowel marks and hamza forms are set aside, and the alef wasla, the alef maqsura (ى to ي), the ta marbuta (ة to ه) and the tatweel are made alike.
- **Russian:** ё and й are typed as е and и.
- **Chinese and Korean:** full-width letters are made ordinary. Simplified and Traditional Chinese are two languages: `美国` finds the United States in `zh-Hans` and not in `zh-Hant`.

`names.fold(text)` gives a page the same folding for its own comparisons. A name from another language finds nothing: `Japan` is not found in the French entry. Two letters are taken as an alpha-2 code after the names have been tried.

## Where the names come from

Every name, short form and variant is Unicode CLDR 48.2's (`cldr-localenames-full`, Unicode License v3), nothing more. There is no machine translation: a name CLDR does not have in the language is `null`, never the English name, and the same for a short form. In CLDR 48.2 all 250 countries have a name in each of the nine languages, so no name is `null` today; the rule matters for the next CLDR. Fields that exist in Japanese only, such as the kana reading, are not in these entries.

| Language | Names | Null | Short forms | Countries with variants |
| --- | --- | --- | --- | --- |
| French | 250 | 0 | 5 | 10 |
| Spanish | 250 | 0 | 5 | 9 |
| German | 250 | 0 | 5 | 9 |
| Simplified Chinese | 250 | 0 | 3 | 6 |
| Traditional Chinese | 250 | 0 | 3 | 6 |
| Korean | 250 | 0 | 4 | 8 |
| Portuguese | 250 | 0 | 4 | 9 |
| Arabic | 250 | 0 | 3 | 8 |
| Russian | 250 | 0 | 5 | 8 |

## Countries here, subdivisions in their own entry

These entries cover countries only. A language's subdivision names (states, provinces, prefectures) are in a second entry beside them, `subdivision-names/<language>`, so that a page that needs only the countries pays nothing for the 5,000 subdivisions. See [Subdivision names in more languages](subdivision-names-in-more-languages.md).
