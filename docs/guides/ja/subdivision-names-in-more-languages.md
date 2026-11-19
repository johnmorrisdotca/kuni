---
title: ほかの言語の行政区画名
section: how-to
order: 20
description: 州、省、県の名前をスペイン語、ドイツ語、中国語で読み込み、それぞれの名前の出どころも確かめます。
---

## 1 つの言語を読み込む

言語ごとに、国名とも、メインのエントリとも別のエントリなので、ページが払うのは表示する 1 言語の分だけです。言語は、スペイン語（`es`）、ドイツ語（`de`）、簡体字中国語（`zh-Hans`）、繁体字中国語（`zh-Hant`）です。英語と日本語の行政区画名は、これまでどおりメインのエントリにあります。

```ts
import names from "@johnmorrisdotca/kuni/subdivision-names/es";

console.log(names.subdivisionName("JP-13"));                          // "Tokio"
console.log(names.subdivisionNameSource("JP-13")?.source);            // "cldr"
console.log(names.subdivisionByName("cataluna"));                     // "ES-CT"
console.log(names.subdivisionsOf("ES").length > 15);                  // true
```

`subdivisionName(code)` は、大文字小文字を問わない ISO 3166-2 コードを受け取り、行政区画でないコードと、その言語に名前がないコードには `null` を返します。`subdivisionsOf(country)` は、その国の名前のある行政区画を、コード順に `code`、`country`、`shortCode`、`name`、`source` つきで返します。行政区画が何であるか（種別、親、階層）は、メインのエントリの `subdivision(code)` で引いてください。このエントリは名前だけを持ちます。

## 名前で探す

`subdivisionsByName(text, { country })` は、入力された名前がなりうるコードをすべて返し、`subdivisionByName` は 1 つのコードを返します。名前が複数の場所に当たるときは `null` で、国を指定すれば決まります。比較では、同じ言語の国名と同じ折りたたみをかけるので、`cataluna` で Cataluña が見つかります。別の言語の名前は見つかりません。

## それぞれの名前の出どころ

どの名前にも、`subdivisionNameSource(code)` で出どころが付いています（`{ source, tag, draft }`）。出どころは Unicode CLDR 48.2（Unicode License v3）か、Wikidata のラベル（CC0）です。CLDR 48.2 は、行政区画名のほとんどを `provisional`（暫定）とし、`draft` がそれを示します。承認済みの名前だけが欲しいページは、これで絞れます。どちらの出どころにもない名前は `null` です。別の言語の名前を入れることも、機械翻訳をすることも、簡体字を繁体字に（またはその逆に）変換することもありません。2 つの中国語エントリは、意図して別々にしています。`zh-Hans` に入るのは簡体字で書かれた名前だけで、CLDR の簡体字ファイルが繁体字で書いている名前は、そこから外してあります。

| 言語 | 名前のある行政区画 | 5,050 のうち |
| --- | --- | --- |
| スペイン語 | 4,830 | 95.6% |
| ドイツ語 | 4,923 | 97.5% |
| 簡体字中国語 | 4,356 | 86.3% |
| 繁体字中国語 | 3,155 | 62.5% |

検査を通った CLDR の名前がある行政区画は、その CLDR の名前を数えています。ない行政区画は、Wikidata のラベルを数えています。リポジトリの `docs/subdivision-names.md` に、最新の数字、外した名前とその理由、Wikidata だけから採った名前があり、母語話者が確認するための一覧です。スペイン語とドイツ語は、CLDR に名前があるところでは CLDR が書いたままです。そのため、ドイツ語では東京都が「Präfektur Tokio」、スペイン語では「Tokio」になります。
