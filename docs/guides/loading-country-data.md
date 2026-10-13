---
title: Load one country at a time
section: how-to
order: 4
description: Use the original static paths or on-demand loaders.
---

## Use the native API

```ts
import { loadSubdivisions } from "@johnmorrisdotca/kuni/load";
import prefectures from "@johnmorrisdotca/kuni/subdivisions/jp";
console.log((await loadSubdivisions("JP"))?.length,prefectures.length,prefectures[0].code);
console.log(await loadSubdivisions("XX"));
```

A fixed country import points to the same existing built file as the retained wildcard path. Default and named SUBDIVISIONS exports refer to the same native list. On-demand loading uses one country module; a host bundler can make its own chunk. This is module loading, not a live geographic-data API. Unsupported codes return null; valid countries with no subdivisions return an empty list.

## Read subdivision facts separately

```ts
import { loadSubdivisionFacts } from "@johnmorrisdotca/kuni/subdivision-facts";
import facts from "@johnmorrisdotca/kuni/subdivision-facts/jp";
console.log((await loadSubdivisionFacts("JP"))?.length,facts[0].code);
```

Keep the subdivision name record distinct from its facts. The [catalogue](country-resources.md) names all 400 existing fixed resource paths. Wildcard imports remain available with their unchanged ESM/CommonJS targets.
