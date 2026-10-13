---
title: はじめに
section: tutorial
order: 1
description: 行政区画を読み込まずに国を探します。
---

## 標準の API を使う

```ts
import { country,countryByName,countryName } from "@johnmorrisdotca/kuni";
console.log(country("JP")?.alpha3,countryByName("ドイツ")?.alpha2,countryName("US","ja",{short:true}));
```

主な入口は、現在の250のコードを持ちます。ISO の249の alpha-2 と、コソボの XK です。国には英語・日本語の名前、任意の現地の名前、コード、基本の項目があります。主な入口では行政区画の表を全部読み込みません。基本の検索は、端末の言語設定や外部の検索に頼らず、保存したデータを使います。

## 入口を選ぶ

`/codes` は名前なしの正確なコードの確認、`/subdivisions` は同期の行政区画の検索、`/load` は必要な国だけの読み込みです。国の情報、行政区画の情報、まとまり、廃止コードには別の入口があります。任意のカードはブラウザーでデータを使います。[コード](codes-and-names.md)、[行政区画](subdivisions.md)、[全体の一覧](country-resources.md)へ進めます。
