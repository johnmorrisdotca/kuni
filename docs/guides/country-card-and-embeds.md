---
title: Use country cards and embeds
section: how-to
order: 7
description: Keep typed data choices separate from optional flag/map assets.
---

## Mount a native card

```ts no-run
import { KuniCard,defineCard } from "@johnmorrisdotca/kuni/element";
defineCard();
const card=new KuniCard();
card.setAttribute("code","JP");
card.options={colors:{"JP-13":"#2f5d4a"},capital:false};
document.body.append(card);
console.log(card.getAttribute("code"));
```

The optional element reflects its documented code, language, theme, size and field choices. It composes Kuni data with optional Hata flags and Chizu maps. Core data lookups use no remote service; the card’s default SVG loaders fetch those assets, and hosts can provide flag/map loaders through options. A subdivision’s full code remains distinct from its country code.

## Preserve drawing options

Per-place colors and the capital-marker switch are passed to the map loader; capital text fields stay separate. Use the builder to preview each choice and copy native element/module/framework/iframe code. Its code is in the family's embed panel: a tab for each way to put the card in a page (custom element, iframe, ES module, React 19, Vue, Svelte, Angular, plain HTML and the iframe address), Copy, a link that opens the embed page with your choices, this guide and the credit for the names and facts; only the choices that differ from the defaults are in the code, "Copy a link to this card" and "Start again" sit beside Copy, and the tab you chose is kept in the address. The frame validates setup and uses no storage; it reports native load/error details. The complete [embed reference](../embeds.md) retains all attributes, callback contracts and examples.
