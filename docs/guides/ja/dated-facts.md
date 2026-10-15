---
title: 日付のある情報を読む
section: how-to
order: 5
description: 数値、資料の日付、値がない場合を一緒に保ちます。
---

## 標準のAPIを使う

```ts
import { facts,FACTS_READ,distanceKm } from "@johnmorrisdotca/kuni/facts";
const japan=facts("JP");
console.log(FACTS_READ,japan?.population,japan?.populationYear,japan?.areaOf);
console.log(Math.round(distanceKm({lat:35.68,lon:139.76},{lat:51.5,lon:-0.12})));
```

FACTS_READは保存したWikidataの資料の日付です。人口と面積にはそれぞれの年があり、areaOfは全体か陸地だけかを区別します。座標は資料の代表の位置で、計算した中心ではありません。nullは使える値が資料になかった意味です。0は値で、欠けたものとはしません。国境は国のコードで、島には空の一覧もあります。

## 行政区画の不確かさを保つ

行政区画の情報は、資料にない場合や食い違う場合にnullです。首都の文章と座標は別で、カードの首都の印を無効にしても文章の項目は消しません。元の[国の情報](../../facts.md)、[行政区画の情報](../../subdivision-facts.md)、[ライセンス](../../../NOTICE.md)で範囲を読めます。距離の関数は緯度と経度を取り、キロメートルを返します。道順や移動時間ではありません。
