---
title: まとまりと廃止コードを使う
section: how-to
order: 6
description: 定義、加盟の日付、過去のコードの記録を保ちます。
---

## 標準のAPIを使う

```ts
import { grouping,membersOf,groupingsOf } from "@johnmorrisdotca/kuni/groupings";
import { withdrawn } from "@johnmorrisdotca/kuni/withdrawn";
console.log(grouping("eu")?.asOf,membersOf("eu",{on:"2015-06-30"})?.includes("GB"),groupingsOf("JP").length);
console.log(withdrawn("SU").map(record=>record.code));
```

まとまりには、種類、定義、資料とライセンス、asOfの日付があります。非公式の地域は説明した定義に従い、全世界で同じ加盟の一覧ではありません。国際機関の日付の検索は記録した期間を使い、開始の日付が不明な場合は、説明した最初からの規則に従います。国と行政区画のまとまりでは、コードの形が異なります。

## 過去のコードを保つ

廃止コードは、1つが複数の過去の記録を示すことがあるため、一覧を返します。ISO 3166-3、使っていた期間、後継を保ち、推測した現在の国に置き換えません。IOCは現在の国の任意の項目で、ISOのalpha-2とは別です。元の[まとまり](../../groupings.md)と[廃止コード](../../withdrawn.md)を読めます。
