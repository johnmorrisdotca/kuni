---
title: 端末で表を保存する
section: how-to
order: 8
description: 標準の値、null、コードの文字列を保存に保ちます。
---

## 標準のAPIを使う

```ts
import { countries } from "@johnmorrisdotca/kuni";
const rows=countries({order:"code"}).map(place=>({code:place.alpha2,numeric:place.numeric,en:place.name.en,ja:place.name.ja}));
console.log(rows.length,rows[0].code,typeof rows[0].numeric);
```

デモの国の表は、CSV・JSON・Markdown・SQLを端末で保存できます。数値のISOコードや先頭の0も文字列にします。nullを0や作った名前にしません。共通のMarkdownは縦線とバックスラッシュをエスケープし、改行を保ちます。SQLは値がない項目をNULL、文字列のコードをTEXTにします。元のSQLiteの実行と往復の確認をブラウザーのテストで保ちます。

## 意図して共有する

比較と表の画面は、説明したURLに選択と設定を保ちます。保存を選ぶとファイルを作り、外部のデータサービスは加えません。MySQLの必要なSQLモードなどの説明はSQLファイル自身の互換性の説明と[元の機能](../../../README.md#features)にあります。固定の国のデータと資料の値や並び順を保ちます。
