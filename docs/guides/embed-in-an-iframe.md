---
title: Embed a country card in an iframe
section: how-to
order: 17
description: Show a country card on a page that allows no scripts, with an iframe of the demo's embed page.
---

A site that allows no scripts can still show a country: an iframe of the demo's embed page needs no code of your own. The address chooses the country (`code`, or a subdivision's full code such as `JP-13`), the facts on the card (`fields`, a list separated by commas or spaces), its size (`size`), the theme (`theme`) and the language (`lang`). The keys are the attribute names of `<kuni-card>`.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kuni in an iframe</title>
  </head>
  <body>
    <iframe
      src="https://johnmorrisdotca.github.io/kuni/embed/?code=JP&fields=name,codes,capital"
      title="Japan: its name, codes and capital"
      width="320"
      height="220"
      loading="lazy"
      style="border: 0"
    ></iframe>
  </body>
</html>
```

The page draws one card and nothing else, stores nothing and loads nothing from anywhere else but the flag and map files a card asks for. When the card is drawn it tells the page around it with `postMessage({ type: "kuni-load", detail })`, or `{ type: "kuni-error", detail }` when it cannot; check `event.origin` before you trust either. The [builder](https://johnmorrisdotca.github.io/kuni/builder.html) writes this frame, and the other formats, for the card you choose.
