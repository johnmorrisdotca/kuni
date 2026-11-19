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

## Read a country's capitals and their roles

`country(code).capital` is one name. A few countries have more than one capital city, or a capital that is not the whole answer, and `capitalsOf` in the capitals entry gives each city with its role.

```ts
import { capitalsOf,CAPITALS_READ } from "@johnmorrisdotca/kuni/capitals";
console.log(capitalsOf("ZA")?.map((one)=>`${one.name.en} ${one.role}`));
console.log(capitalsOf("BI")?.[1]?.name.ja,CAPITALS_READ);
console.log(capitalsOf("JP"));
```

The roles are official, administrative, legislative, judicial, seat (of government), political and economic; a source's "commercial" capital is economic. Each is what the country's own government or law says, and the [capitals](../capitals.md) page names the page and the line for every entry. A country with no entry returns null, and its capital is the one `capital` names. The `capital` field itself has not changed. Israel and the Palestinian Territories have no entry, because a disputed capital is left to the maintainer.

## Preserve subdivision uncertainty

Subdivision facts can be null where Wikidata has none or conflicting values. Capital text and capital coordinates are separate; disabling the card’s capital marker does not discard capital text fields. The complete original [facts](../facts.md), [subdivision-facts](../subdivision-facts.md) and [licence notice](../../NOTICE.md) explain source scope. The distance helper takes latitude/longitude objects and returns kilometres, not a route or travel time.
