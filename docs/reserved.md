# Places outside ISO 3166-1

Written by `pnpm data`; do not edit by hand. The rules are at the top of `scripts/reserved-config.ts`.

`@johnmorrisdotca/kuni/reserved` has 14 places that have a code or a flag in common use and are no country of ISO 3166-1: 7 with a code ISO 3166-1 reserves exceptionally, 3 with a code of its user-assigned range, and 4 with no code. They are never in `countries()`.

Read from IANA's Language Subtag Registry (File-Date 2026-09-17, read 2026-11-17; `data-sources/iana/language-subtag-regions.json`), Unicode CLDR (the names of the reserved codes) and Wikidata on 2026-11-17 (`data-sources/wikidata-reserved-2026-11-17.json`, CC0).

| Id | Code | Kind | Name | In Japanese | Status | Parent | Subdivisions | Until |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| abkhazia | XA | `user-assigned` | Republic of Abkhazia | アブハジア共和国 | `disputed` | GE |  |  |
| artsakh |  | `de-facto` | Republic of Artsakh | アルツァフ共和国 | `disputed` |  |  | 2023 |
| ascension-island | AC | `iso-reserved` | Ascension Island | アセンション島 | `territory` | GB | SH-AC |  |
| canary-islands | IC | `iso-reserved` | Canary Islands | カナリア諸島 | `territory` | ES | ES-CN |  |
| ceuta-and-melilla | EA | `iso-reserved` | Ceuta & Melilla | セウタ・メリリャ | `territory` | ES | ES-CE, ES-ML |  |
| clipperton-island | CP | `iso-reserved` | Clipperton Island | クリッパートン島 | `uninhabited` | FR | FR-CP |  |
| diego-garcia | DG | `iso-reserved` | Diego Garcia | ディエゴガルシア島 | `territory` | GB |  |  |
| northern-cyprus | XC | `user-assigned` | Northern Cyprus | 北キプロス・トルコ共和国 | `disputed` | CY |  |  |
| sahrawi-republic |  | `de-facto` | Sahrawi Arab Democratic Republic | サハラ・アラブ民主共和国 | `disputed` |  |  |  |
| sark | CQ | `iso-reserved` | Sark | サーク島 | `territory` | GB |  |  |
| somaliland |  | `de-facto` | Somaliland | ソマリランド | `disputed` | SO |  |  |
| south-ossetia | XO | `user-assigned` | South Ossetia | 南オセチア | `disputed` | GE |  |  |
| transnistria |  | `de-facto` | Transnistria | 沿ドニエストル共和国 | `disputed` | MD |  |  |
| tristan-da-cunha | TA | `iso-reserved` | Tristan da Cunha | トリスタン・ダ・クーニャ | `territory` | GB | SH-TA |  |

## Choices

- **EU** is a region subtag of the registry and is not here: The European Union, the grouping `eu`.
- **EZ** is a region subtag of the registry and is not here: The euro area, the grouping `eurozone`.
- **UN** is a region subtag of the registry and is not here: The United Nations, the grouping `un`.
- **XA** as country-flag-icons 1.6.20 (MIT), its README has it (read 2026-11-17): "`XA` — Abkhazia". Unicode CLDR uses XA for a testing locale; no standard gives these codes to anyone.
- **XC** as country-flag-icons 1.6.20 (MIT), its README has it (read 2026-11-17): "`XC` — Northern Cyprus". Unicode CLDR uses XA for a testing locale; no standard gives these codes to anyone.
- **XO** as country-flag-icons 1.6.20 (MIT), its README has it (read 2026-11-17): "`XO` — South Ossetia". Unicode CLDR uses XA for a testing locale; no standard gives these codes to anyone.
- A country item Q124653007 is read as **GB**: The realm of the United Kingdom: the United Kingdom with its Crown Dependencies and overseas territories, the state whose ISO 3166-1 code is GB.
- **northern-cyprus**: Wikidata names no state it is in (P17); the parent CY is the one state it records as claiming it (P1336).
- **artsakh**: no parent. Wikidata names no member of the United Nations it is in (P17) and none as claiming it (P1336).
- **sahrawi-republic**: no parent. Wikidata names no member of the United Nations it is in (P17) and none as claiming it (P1336).
- A parent of a `user-assigned` or `de-facto` place is what Wikidata records, and says nothing about who governs it.
