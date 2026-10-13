---
title: Use groupings and withdrawn codes
section: how-to
order: 6
description: Retain definitions, membership dates and historical code records.
---

## Use the native API

```ts
import { grouping,membersOf,groupingsOf } from "@johnmorrisdotca/kuni/groupings";
import { withdrawn } from "@johnmorrisdotca/kuni/withdrawn";
console.log(grouping("eu")?.asOf,membersOf("eu",{on:"2015-06-30"})?.includes("GB"),groupingsOf("JP").length);
console.log(withdrawn("SU").map(record=>record.code));
```

A grouping includes its kind, definition, source/licence and asOf date. Informal regions follow their stated definition, not a universal membership list. Dated international-body lookups use recorded membership periods; unknown start dates follow the documented from-the-start rule. Country and subdivision groupings use different code shapes.

## Preserve historical codes

Withdrawn-code lookup returns a list because one old code can identify multiple historical records. Keep ISO 3166-3 identifiers, active periods and successors; do not turn an old record into a guessed current country. IOC codes are an optional current-country field, separate from ISO alpha-2. See the original [groupings](../groupings.md) and [withdrawn-code reference](../withdrawn.md).
