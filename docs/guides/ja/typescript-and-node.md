---
title: TypeScript と Node
section: how-to
order: 16
description: パッケージの型を使います。DOM のないサーバーでも、同じデータを読めます。
---

パッケージは、エントリーポイントごとに自分の型を持っています。データはただのオブジェクトなので、Node でも Deno でも Bun でもワーカーでもブラウザでも、同じ呼び出しは同じ答えを返します。このファイルは型を検査したあと、型を取り除いてくれる Node 22.18 以降でそのまま実行します。

```ts
import { country, type Country } from "@johnmorrisdotca/kuni";
import { isCountryCode, type CountryCode } from "@johnmorrisdotca/kuni/codes";

const code: CountryCode = "JP";
const japan: Country | null = country(code);
console.log(japan?.name.en, isCountryCode("XX"));

// @ts-expect-error "XX" is not a country's code
const unknown: CountryCode = "XX";
console.log(unknown);
```

`@ts-expect-error` は、`"XX"` が国のコードではなく、コンパイラが断ることを示すためのものです。

## サーバーで

サーバーでも、ブラウザと同じデータを読めます。DOM もネットワークも使いません。

```mjs
import { country, countryByName } from "@johnmorrisdotca/kuni";

// A server reads the same data a browser does: pure, no DOM, no network.
const japan = country("JP");
console.log(japan?.name.ja, japan?.callingCode, countryByName("Holland")?.alpha2);
```

最初の検索は [はじめに](getting-started.md)、そのほかは [国のデータの読み込み](loading-country-data.md) を見てください。
