---
title: Read codes and names
section: how-to
order: 2
description: Keep exact validation distinct from forgiving lookup.
---

## Use the native API

```ts
import { isCountryCode,COUNTRY_CODES } from "@johnmorrisdotca/kuni/codes";
import { country,countryByName,fold } from "@johnmorrisdotca/kuni";
console.log(isCountryCode("JP"),isCountryCode("jp"),COUNTRY_CODES.length);
console.log(country("jp")?.numeric,countryByName("Holland")?.alpha2,fold("ＴＯＫＹＯ"));
```

`isCountryCode` requires the exact capital-letter alpha-2 spelling. `country` is forgiving about the documented code forms/case; `countryByName` uses stored names and aliases. Numeric codes remain strings so leading zeros survive. A name alias is not a new country or a subdivision. Do not use current-country validation to reinterpret a withdrawn code.

## Preserve language choices

Choose English or Japanese through the native name functions. Short forms exist only where the stored source gives them. Core ordering and folding do not depend on the host’s Intl locale. For subdivisions, a Japanese name can be null; keep the source’s absence rather than copying an English name into its place. See [missing results](troubleshooting.md) and the preserved [name rules](../name-rules.md).
