---
title: Plain HTML and CDNs
section: how-to
order: 13
description: Put a country card on a plain page with one script tag from jsDelivr or unpkg.
---

A page needs no build step. The `element/define` entry registers the `<kuni-card>` tag; a script tag from a CDN loads it, and the tag draws the card for the country named by its `code`. The country's data is part of the package, so nothing else is fetched unless the card is asked for a flag or a map.

## jsDelivr

jsDelivr serves the package's files as they are, so the address is the built file.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kuni from jsDelivr</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kuni@1/dist/element-define.js"></script>
  </head>
  <body>
    <kuni-card code="JP" fields="name codes capital"></kuni-card>
  </body>
</html>
```

## unpkg

unpkg serves the package's own files too; `?module` makes it rewrite the imports inside them for the browser.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kuni from unpkg</title>
    <script type="module" src="https://unpkg.com/@johnmorrisdotca/kuni@1/dist/element-define.js?module"></script>
  </head>
  <body>
    <kuni-card code="JP" fields="name codes capital"></kuni-card>
  </body>
</html>
```

## Notes

- Use `<script type="module">`. A classic script cannot `import`.
- Pin a major version in the address (`@johnmorrisdotca/kuni@1`) so the page stays as it is.
- The attributes are in [country cards and embeds](country-card-and-embeds.md). If nothing appears, see [troubleshooting](troubleshooting.md).
