---
title: コードと名前を読む
section: how-to
order: 2
description: 正確な確認と、表記の違いを扱う検索を区別します。
---

## 標準のAPIを使う

```ts
import { isCountryCode,COUNTRY_CODES } from "@johnmorrisdotca/kuni/codes";
import { country,countryByName,fold } from "@johnmorrisdotca/kuni";
console.log(isCountryCode("JP"),isCountryCode("jp"),COUNTRY_CODES.length);
console.log(country("jp")?.numeric,countryByName("Holland")?.alpha2,fold("ＴＯＫＹＯ"));
```

`isCountryCode`は大文字のalpha-2を正確に確認します。`country`は説明したコードや大小文字の違いを扱い、`countryByName`は保存した名前と別名を使います。数値のコードも文字列にして、先頭の0を保ちます。別名は新しい国や行政区画ではありません。廃止されたコードを、現在の確認で読み替えません。

## 言語の選択を保つ

標準の名前の関数で英語か日本語を選びます。短い表記は資料にある場合だけです。並び順と表記をそろえる処理は、表示側のIntlの言語設定に依存しません。行政区画の日本語名はnullの場合があり、英語をコピーして置き換えません。[値がない場合](troubleshooting.md)と元の[名前の規則](../../name-rules.md)を読めます。
