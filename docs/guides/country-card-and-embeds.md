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

Per-place colors and the capital-marker switch are passed to the map loader; capital text fields stay separate. Use the builder to preview each choice and copy native element/module/framework/iframe code. The frame validates setup and uses no storage; it reports native load/error details. The complete [embed reference](../embeds.md) retains all attributes, callback contracts and examples.
