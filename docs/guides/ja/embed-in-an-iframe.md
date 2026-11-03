---
title: iframe で国のカードを埋め込む
section: how-to
order: 17
description: スクリプトを使えないページでも、デモの埋め込みページを iframe で載せて国のカードを表示します。
---

スクリプトを使えないサイトでも、デモの埋め込みページを iframe で載せれば国を表示できます。自分でコードを書く必要はありません。アドレスで、国 (`code`。州や県なら `JP-13` のような完全なコード)、カードに載せる項目 (`fields`。コンマか空白で区切る)、大きさ (`size`)、テーマ (`theme`)、言語 (`lang`) を選びます。キーは `<kuni-card>` の属性名と同じです。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kuni in an iframe</title>
  </head>
  <body>
    <iframe
      src="https://johnmorrisdotca.github.io/kuni/embed/?code=JP&fields=name,codes,capital"
      title="Japan: its name, codes and capital"
      width="320"
      height="220"
      loading="lazy"
      style="border: 0"
    ></iframe>
  </body>
</html>
```

このページはカードを1つ描くだけで、何も保存せず、カードが求める旗と地図のファイルのほかは何も読み込みません。カードを描き終えると、まわりのページに `postMessage({ type: "kuni-load", detail })` で知らせます。描けないときは `{ type: "kuni-error", detail }` です。どちらも、信用する前に `event.origin` を確かめてください。[ビルダー](https://johnmorrisdotca.github.io/kuni/builder.html) は、選んだカードについてこの iframe とほかの形式のコードを書いてくれます。
