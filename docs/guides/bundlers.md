---
title: Vite and webpack
section: how-to
order: 14
description: Install the package and import the country card element in a Vite or webpack project.
---

Install it.

```sh
npm install @johnmorrisdotca/kuni
# or: pnpm add @johnmorrisdotca/kuni
# or: yarn add @johnmorrisdotca/kuni
```

Everything is an ES module with its own entry point, so a bundler keeps only what you import: `@johnmorrisdotca/kuni` (the countries), `/subdivisions/<country>` (one country's states, provinces or prefectures), `/load`, `/facts`, `/groupings`, `/codes`, `/element` and `/element/define`, which registers `<kuni-card>` once.

## Vite

The page.

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

The script. Vite builds this entry with no configuration.

```ts no-run
import "@johnmorrisdotca/kuni/element/define";

const card = document.querySelector("kuni-card")!;
card.addEventListener("kuni-load", (event) => console.log((event as CustomEvent<{ code: string }>).detail.code));
```

## webpack

The entry.

```js no-run
import "@johnmorrisdotca/kuni/element/define";

const card = document.createElement("kuni-card");
card.setAttribute("code", "JP");
card.setAttribute("fields", "name codes capital");
document.body.append(card);
```

`webpack.config.mjs`. webpack 5 needs nothing special for a package with `exports`.

```mjs no-run
import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  entry: "./src/index.js",
  output: { path: fileURLToPath(new URL("./dist", import.meta.url)), filename: "main.js" },
};
```

Run `npx webpack` and load the `dist/main.js` it makes from a page.

## Other tools

Anything that reads `exports` in `package.json` works the same way: Rollup, esbuild, Parcel, Bun, Deno (`npm:@johnmorrisdotca/kuni/element/define`). The package says `sideEffects: false`, so tree shaking removes whatever you do not import.
