---
title: 端末で表を保存する
section: how-to
order: 8
description: 標準の値、null、コードの文字列を保存に保ちます。
---

## 標準の API を使う

```ts
import { countries } from "@johnmorrisdotca/kuni";
const rows=countries({order:"code"}).map(place=>({code:place.alpha2,numeric:place.numeric,en:place.name.en,ja:place.name.ja}));
console.log(rows.length,rows[0].code,typeof rows[0].numeric);
```

デモの国の表は、CSV・JSON・Markdown・SQL を端末で保存できます。数値の ISO コードや先頭の0も文字列にします。null を0や作った名前にしません。共通の Markdown は縦線とバックスラッシュをエスケープし、改行を保ちます。SQL は値がない項目を NULL、文字列のコードを TEXT にします。元の SQLite の実行と往復の確認をブラウザーのテストで保ちます。

## 意図して共有する

比較と表の画面は、説明した URL に選択と設定を保ちます。保存を選ぶとファイルを作り、外部のデータサービスは加えません。MySQL の必要な SQL モードなどの説明はSQLファイル自身の互換性の説明と[元の機能](../../../README.md#features)にあります。固定の国のデータと資料の値や並び順を保ちます。
