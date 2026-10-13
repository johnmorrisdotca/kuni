---
title: 国ごとに読み込む
section: how-to
order: 4
description: 元の固定のパスか、必要なときの読み込みを使います。
---

## 標準の API を使う

```ts
import { loadSubdivisions } from "@johnmorrisdotca/kuni/load";
import prefectures from "@johnmorrisdotca/kuni/subdivisions/jp";
console.log((await loadSubdivisions("JP"))?.length,prefectures.length,prefectures[0].code);
console.log(await loadSubdivisions("XX"));
```

固定の import は、残すワイルドカードのパスと同じ元のファイルを指します。既定の export と SUBDIVISIONS は同じ標準の一覧です。必要なときの読み込みは国ごとのモジュールで、表示側のビルドが国ごとの部分を作れます。これはモジュールの読み込みで、最新の地理データの API ではありません。未対応のコードは null、有効でも行政区画がない国は空の一覧です。

## 行政区画の情報を別に読む

```ts
import { loadSubdivisionFacts } from "@johnmorrisdotca/kuni/subdivision-facts";
import facts from "@johnmorrisdotca/kuni/subdivision-facts/jp";
console.log((await loadSubdivisionFacts("JP"))?.length,facts[0].code);
```

名前の記録と情報を区別します。[一覧](country-resources.md)に元の400の固定のパスがあります。ワイルドカードの import と元の ESM・CommonJS のファイルを保ちます。
