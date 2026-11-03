---
title: React・Vue・Svelte・Angular で使う
section: how-to
order: 15
description: React、Vue、Svelte、Angular で国のカードの要素を使います。サーバーでの描画でも動く import の仕方も説明します。
---

`<kuni-card>` は Web コンポーネントなので、どのフレームワークでも使えます。共通のことが2つあります。

1. **タグを登録するエントリー** (`@johnmorrisdotca/kuni/element/define`) を import します。サーバーで import しても何も登録しないので安全です。カードはブラウザで描かれます。
2. **フレームワークにそのタグがあることを伝えます。** React は型、Vue はコンパイラーのオプション、Angular はスキーマが要ります。Svelte は何も要りません。

## React

`Country.tsx` です。React 19 は属性をそのままカスタム要素に渡します。

```tsx
import "@johnmorrisdotca/kuni/element/define";

export function Country({ code = "JP" }: { code?: string }) {
  return <kuni-card code={code} fields="name codes capital" />;
}
```

TypeScript では、React にそのタグがあることを教えます (`kuni-card.d.ts` のようなファイル)。

```ts no-run
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "kuni-card": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { code?: string; fields?: string; size?: string; lang?: string; theme?: string };
    }
  }
}
```

いつもどおりにマウントします。コンポーネントはサーバーでも文字列に描画できます (`renderToString`)。パッケージのテストで確かめています。タグは出力され、カードはブラウザで描かれます。

```tsx
import { createRoot } from "react-dom/client";
import { Country } from "./Country";

createRoot(document.getElementById("root")!).render(<Country />);
```

## Vue

```vue
<script setup lang="ts">
import "@johnmorrisdotca/kuni/element/define";

withDefaults(defineProps<{ code?: string }>(), { code: "JP" });
</script>

<template>
  <kuni-card :code="code" fields="name codes capital"></kuni-card>
</template>
```

Vue のコンパイラーに、`kuni-*` のタグはカスタム要素だと伝えます (`main.ts`)。

```ts no-check
import { createApp } from "vue";
import Country from "./Country.vue";

const app = createApp(Country);
app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith("kuni-");
app.mount("#app");
```

Vite では、同じオプションを `vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("kuni-") } } })` に書きます。

## Svelte

```svelte
<script lang="ts">
  import "@johnmorrisdotca/kuni/element/define";

  let { code = "JP" }: { code?: string } = $props();
</script>

<kuni-card {code} fields="name codes capital"></kuni-card>
```

```ts no-check
import { mount } from "svelte";
import Country from "./Country.svelte";

mount(Country, { target: document.getElementById("app")! });
```

## Angular

スタンドアロンで、テンプレートに未知のタグを書けるよう `CUSTOM_ELEMENTS_SCHEMA` を付けます。要素は属性を読むので、属性は `[attr.code]` で結びます。

```ts no-check
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import "@johnmorrisdotca/kuni/element/define";

@Component({
  selector: "app-country",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<kuni-card [attr.code]="code" fields="name codes capital"></kuni-card>`,
})
export class CountryComponent {
  @Input() code = "JP";
}
```

```ts no-check
import "@angular/compiler";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideZonelessChangeDetection } from "@angular/core";
import { CountryComponent } from "./country.component";

void bootstrapApplication(CountryComponent, { providers: [provideZonelessChangeDetection()] });
```

## Next.js, Nuxt, SvelteKit

どれも先にサーバーで描画しますが、上の import はサーバーでも安全なので、コンポーネントはそのまま動きます。Next.js の App Router では、コンポーネントのファイルの先頭に `"use client"` を書きます。
