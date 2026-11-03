---
title: TypeScript and Node
section: how-to
order: 16
description: Use the package's types, and read the same data on a server with no DOM.
---

The package ships its own types, for each entry point. The data is plain objects, so the same call gives the same answer in Node, Deno, Bun, a worker and a browser. This file type-checks, then runs under Node 22.18 or later, which strips the types.

```ts
import { country, type Country } from "@johnmorrisdotca/kuni";
import { isCountryCode, type CountryCode } from "@johnmorrisdotca/kuni/codes";

const code: CountryCode = "JP";
const japan: Country | null = country(code);
console.log(japan?.name.en, isCountryCode("XX"));

// @ts-expect-error "XX" is not a country's code
const unknown: CountryCode = "XX";
console.log(unknown);
```

`@ts-expect-error` is there to show that `"XX"` is not a country's code; the compiler refuses it.

## On a server

A server reads the same data a browser does: no DOM, no network.

```mjs
import { country, countryByName } from "@johnmorrisdotca/kuni";

// A server reads the same data a browser does: pure, no DOM, no network.
const japan = country("JP");
console.log(japan?.name.ja, japan?.callingCode, countryByName("Holland")?.alpha2);
```

See [getting started](getting-started.md) for the first lookups and [loading country data](loading-country-data.md) for the rest.
