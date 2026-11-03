---
title: In React, Vue, Svelte and Angular
section: how-to
order: 15
description: Use the country card element in React, Vue, Svelte and Angular, with the import that keeps a server render working.
---

`<kuni-card>` is a web component, so every framework can use it. Two things apply everywhere:

1. **Import the entry that registers the tag** (`@johnmorrisdotca/kuni/element/define`). It is safe to import on a server, where it registers nothing; the card is drawn in the browser.
2. **Tell the framework the tag exists.** React needs a type for it, Vue a compiler option, Angular a schema. Svelte needs nothing.

## React

`Country.tsx`; React 19 passes attributes through to a custom element.

```tsx
import "@johnmorrisdotca/kuni/element/define";

export function Country({ code = "JP" }: { code?: string }) {
  return <kuni-card code={code} fields="name codes capital" />;
}
```

With TypeScript, tell React the tag exists (a file such as `kuni-card.d.ts`):

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

Mount it as usual. The component renders to a string on a server (`renderToString`), as the package's tests check: the tag is there, the card is drawn in the browser.

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

Tell Vue's compiler that `kuni-*` tags are custom elements, in `main.ts`:

```ts no-check
import { createApp } from "vue";
import Country from "./Country.vue";

const app = createApp(Country);
app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith("kuni-");
app.mount("#app");
```

With Vite, the same option goes in `vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("kuni-") } } })`.

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

Standalone, with `CUSTOM_ELEMENTS_SCHEMA` so the template may hold an unknown tag. Bind an attribute with `[attr.code]`, since the element reads attributes:

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

They render on a server first, and the import above is safe there, so the components work unchanged. In Next.js's App Router the component file starts with `"use client"`.
