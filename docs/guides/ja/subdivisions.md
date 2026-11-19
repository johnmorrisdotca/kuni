---
title: 行政区画を探す
section: how-to
order: 3
description: 完全なコード、階層、曖昧さの解決を選びます。
---

## 標準のAPIを使う

```ts
import { subdivisions,subdivision,subdivisionsByName,subdivisionByName } from "@johnmorrisdotca/kuni/subdivisions";
console.log(subdivisions("JP",{level:1})?.length,subdivision("JP-13")?.name.en);
console.log(subdivisionsByName("Punjab").map(place=>place.code),subdivisionByName("Punjab",{country:"IN"})?.code);
```

行政区画には完全なISO 3166-2、国のalpha-2、短いコード、種類、階層、任意の親があります。国には複数の階層があり、階層1をどこでも州と呼ぶとは限りません。一覧は固定され、標準のコード順です。有効でも行政区画がない国は空の一覧、無効な国はnullです。

## 曖昧な名前を扱う

複数の検索は一致を全部返します。1つの検索は一意に選べないとnullで、国や階層を指定して区別できます。短いコードや名前は別の場所でも使うため、選択は完全なコードで保ちます。元の[行政区画の情報](../../subdivision-facts.md)と[データ一覧](country-resources.md)を読めます。

## 2025年以降のベトナムの省

`subdivisions("VN")`は今のISO 3166-2の63のコードのままです。決議202/2025/QH15がそれらを再編し、`subdivisionReforms("VN")`はその法律の日付のある注記です。決議が書く名前ごとに、今のコードのどれが一つの単位になるかを示します。コードの追加や削除はありません。第2条第1項は、決議が可決された2025年6月12日から効力を持ちます。第2条第2項は、再編後の省の政府が2025年7月1日から正式に業務を始めると定めています。日本語は、名前を残したコードにkuniが既に持っている場合だけ入ります。

```ts
import { subdivisionReforms, subdivisions } from "@johnmorrisdotca/kuni/subdivisions";
console.log(subdivisions("VN")?.length);
console.log(subdivisionReforms("VN")?.operating);
console.log(subdivisionReforms("VN")?.units.length);
```
