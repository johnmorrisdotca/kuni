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
