---
title: Troubleshooting and FAQ
section: troubleshooting
order: 10
description: Interpret unknown, ambiguous and missing source data.
---

## Distinguish the empty results

A country/code lookup returns null for an unknown code or name. A singular subdivision-name lookup also returns null for ambiguity; use the plural result or country/level restriction. Valid countries with no subdivisions give an empty list, while unsupported country codes give null. Facts preserve null for unavailable/conflicting source values. A missing optional country field is undefined; a Japanese subdivision name can be null. None of these values asks a host to fabricate data.

## Choose the right import

`/codes` has code checks, not country names. The root has current countries; withdrawn records live in `/withdrawn`. A fixed country resource exists only for a country with stored subdivisions; use the loader when the code is selected dynamically. Await on-demand calls. Treat rejected module loading as a host asset/bundling issue rather than silently replacing data. The [catalogue](country-resources.md) names supported fixed paths.

## Diagnose a card

Use full country/subdivision codes and the native field names. Flag/map assets are optional and can fail independently of country data. Hosts may supply loaders, drawing colors and capital options. Keep area scope and measurement years when presenting facts. Existing [Japanese gaps](../ja-gaps.md) and [source disagreements](../disagreements.md) remain explicit review material.
