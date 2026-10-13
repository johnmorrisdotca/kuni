---
title: Save local tables
section: how-to
order: 8
description: Keep native values, nulls and code strings in local exports.
---

## Use the native API

```ts
import { countries } from "@johnmorrisdotca/kuni";
const rows=countries({order:"code"}).map(place=>({code:place.alpha2,numeric:place.numeric,en:place.name.en,ja:place.name.ja}));
console.log(rows.length,rows[0].code,typeof rows[0].numeric);
```

The demo’s country table has local CSV/JSON/Markdown/SQL downloads. Keep numeric ISO codes and leading zeros as strings. Null remains absence, not zero or a made-up name. Shared Markdown writers escape pipes/backslashes and preserve line breaks; SQL preserves missing values as NULL and textual codes as TEXT. Existing SQLite execution and round-trip checks stay in the browser suite.

## Share intentionally

Compare and table views keep selection/options in their documented URLs. A file is created when you choose to save it; no hosted data service is added. PostgreSQL/MySQL notes, including the required MySQL SQL mode, stay in the SQL file’s own compatibility note and the [native features](../../README.md#features). Imported fixed country resources and source datasets retain their native order and values.
