---
title: Upgrading and migration
section: upgrading
order: 11
description: Keep existing code/data contracts while adopting the documentation pages.
---

## Adopt the docs site

This branch retains the original public functions, country data, wildcard paths and ESM/CommonJS import targets. Named resources point to those same existing files. The API index preserves old anchors and links to individual examples; local search and llms files add ways to read the package. The full resource catalogue and paired guides do not require a hosted service. No version or release is cut here.

## Move from a flat country list

Choose the Kuni record shape instead of casting a country-list object. Keep alpha-2, alpha-3 and numeric codes distinct, explicit language choices and optional/null source values. A country name is not a subdivision id; use complete ISO 3166-2 codes. Load only the entries you need and retain facts’ dates/years and groupings’ definitions.

## Keep source review explicit

Dataset updates belong to the existing authoritative writer and checked snapshots. Run the native data, source, package and browser gates when behavior changes; this documentation-only refresh preserves data. The original [changelog](../../CHANGELOG.md), [plan](../PLAN.md) and [data-source notes](../../data-sources/README.md) remain available. Added Japanese needs review before release.
