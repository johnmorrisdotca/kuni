---
title: Find subdivisions
section: how-to
order: 3
description: Choose full codes, levels and explicit disambiguation.
---

## Use the native API

```ts
import { subdivisions,subdivision,subdivisionsByName,subdivisionByName } from "@johnmorrisdotca/kuni/subdivisions";
console.log(subdivisions("JP",{level:1})?.length,subdivision("JP-13")?.name.en);
console.log(subdivisionsByName("Punjab").map(place=>place.code),subdivisionByName("Punjab",{country:"IN"})?.code);
```

Subdivision records use full ISO 3166-2 codes, a country alpha-2, short code, type, level and optional parent. A country can have multiple levels; level 1 is not a promise that every country calls it a state. Lists are frozen, in native code order. A valid country without subdivisions gives an empty list; an invalid country gives null.

## Handle ambiguous names

The plural name lookup returns all matches. The singular lookup returns null when it cannot choose one unique place; restrict country/level to disambiguate. Keep full codes when storing a choice because a short code or name can be reused elsewhere. The original [subdivision facts](../subdivision-facts.md) and [resource catalogue](country-resources.md) remain available.

## Vietnam's provinces after 2025

`subdivisions("VN")` is still the 63 current ISO 3166-2 codes. Resolution 202/2025/QH15 rearranges them, and `subdivisionReforms("VN")` is a dated note of that law: which current codes form each unit, under the name the resolution writes. It does not add or remove a code. The note is its own entry, `@johnmorrisdotca/kuni/subdivision-reforms`, so a page that only lists subdivisions does not carry it. Article 2 clause 1 takes effect on the day the resolution was passed, 12 June 2025. Article 2 clause 2 says the new provincial governments officially operate from 1 July 2025. Japanese is filled only when kuni already stores it for the code whose name was kept.

```ts
import { subdivisions } from "@johnmorrisdotca/kuni/subdivisions";
import { subdivisionReforms } from "@johnmorrisdotca/kuni/subdivision-reforms";
console.log(subdivisions("VN")?.length);
console.log(subdivisionReforms("VN")?.operating);
console.log(subdivisionReforms("VN")?.units.length);
```
