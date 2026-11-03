---
title: Vite と webpack
section: how-to
order: 14
description: パッケージをインストールし、Vite や webpack のプロジェクトで国のカードの要素を import します。
---

インストールします。

```sh
npm install @johnmorrisdotca/kuni
# or: pnpm add @johnmorrisdotca/kuni
# or: yarn add @johnmorrisdotca/kuni
```

どれも ES モジュールで、エントリーポイントごとに分かれているので、バンドラーは import したものだけを残します。`@johnmorrisdotca/kuni` (国のデータ)、`/subdivisions/<country>` (1つの国の州・県など)、`/load`、`/facts`、`/groupings`、`/codes`、`/element`、そして `<kuni-card>` を一度だけ登録する `/element/define` があります。

## Vite

ページです。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kuni with Vite</title>
  </head>
  <body>
    <kuni-card code="JP" fields="name codes capital"></kuni-card>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

スクリプトです。Vite は設定なしでこのエントリーをビルドします。

```ts no-run
import "@johnmorrisdotca/kuni/element/define";

const card = document.querySelector("kuni-card")!;
card.addEventListener("kuni-load", (event) => console.log((event as CustomEvent<{ code: string }>).detail.code));
```

## webpack

エントリーです。

```js no-run
import "@johnmorrisdotca/kuni/element/define";

const card = document.createElement("kuni-card");
card.setAttribute("code", "JP");
card.setAttribute("fields", "name codes capital");
document.body.append(card);
```

`webpack.config.mjs` です。`exports` を持つパッケージに、webpack 5 は特別な設定を要りません。

```mjs no-run
import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  entry: "./src/index.js",
  output: { path: fileURLToPath(new URL("./dist", import.meta.url)), filename: "main.js" },
};
```

`npx webpack` を実行し、できた `dist/main.js` をページから読み込みます。

## ほかのツール

`package.json` の `exports` を読むツールなら同じように使えます。Rollup、esbuild、Parcel、Bun、Deno (`npm:@johnmorrisdotca/kuni/element/define`) などです。パッケージは `sideEffects: false` と宣言しているので、ツリーシェイキングが import していないものを取り除きます。
