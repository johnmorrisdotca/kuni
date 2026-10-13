---
title: Read dated facts
section: how-to
order: 5
description: Keep measurements, source dates and missing values together.
---

## Use the native API

```ts
import { facts,FACTS_READ,distanceKm } from "@johnmorrisdotca/kuni/facts";
const japan=facts("JP");
console.log(FACTS_READ,japan?.population,japan?.populationYear,japan?.areaOf);
console.log(Math.round(distanceKm({lat:35.68,lon:139.76},{lat:51.5,lon:-0.12})));
```

FACTS_READ identifies the stored Wikidata snapshot. Population and area retain their own years, and areaOf distinguishes whole area from land-only figures. Coordinates are source representative points, not calculated centroids. Null means a source did not supply a usable value; zero is a value and must not be treated as missing. Borders are stored country codes; an island can have an empty list.

## Preserve subdivision uncertainty

Subdivision facts can be null where Wikidata has none or conflicting values. Capital text and capital coordinates are separate; disabling the card’s capital marker does not discard capital text fields. The complete original [facts](../facts.md), [subdivision-facts](../subdivision-facts.md) and [licence notice](../../NOTICE.md) explain source scope. The distance helper takes latitude/longitude objects and returns kilometres, not a route or travel time.
