---
title: Getting started
section: tutorial
order: 1
description: Find a country without loading its subdivisions.
---

## Use the native API

```ts
import { country,countryByName,countryName } from "@johnmorrisdotca/kuni";
console.log(country("JP")?.alpha3,countryByName("ドイツ")?.alpha2,countryName("US","ja",{short:true}));
```

The root carries 250 current country codes: the 249 ISO alpha-2 codes and XK for Kosovo. Countries have English/Japanese names, optional local names, codes and basic fields. The root does not load every subdivision table. Core lookups are pure, locale-free and use the stored data without a hosted lookup service.

## Choose an entry

`/codes` provides exact code checks without names. `/subdivisions` supplies synchronous subdivision lookups; `/load` loads one country on demand. Facts, subdivision facts, groupings and withdrawn codes have their own entries. The optional card uses the data in a browser. Continue with [code handling](codes-and-names.md), [subdivisions](subdivisions.md) or [the full resource catalogue](country-resources.md).
