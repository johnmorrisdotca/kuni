---
title: 通常の HTML と CDN
section: how-to
order: 13
description: jsDelivr や unpkg の script タグ1つで、通常のページに国のカードを載せます。
---

ビルドは要りません。`element/define` を読み込むと `<kuni-card>` のタグが登録されます。CDN の script タグで読み込めば、タグが `code` で指定した国のカードを自分で描きます。国のデータはパッケージに入っているので、カードに旗や地図を求めない限り、ほかに読み込むものはありません。

## jsDelivr

jsDelivr はパッケージのファイルをそのまま配るので、アドレスはビルド済みのファイルです。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kuni from jsDelivr</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kuni@1/dist/element-define.js"></script>
  </head>
  <body>
    <kuni-card code="JP" fields="name codes capital"></kuni-card>
  </body>
</html>
```

## unpkg

unpkg もパッケージのファイルをそのまま配ります。`?module` を付けると、ファイルの中の import をブラウザ用に書き換えてくれます。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kuni from unpkg</title>
    <script type="module" src="https://unpkg.com/@johnmorrisdotca/kuni@1/dist/element-define.js?module"></script>
  </head>
  <body>
    <kuni-card code="JP" fields="name codes capital"></kuni-card>
  </body>
</html>
```

## 注意

- `<script type="module">` を使います。普通の script では `import` できません。
- ページを変えたくないときは、アドレスにメジャーバージョンを書きます (`@johnmorrisdotca/kuni@1`)。
- 属性は [国のカードと埋め込み](country-card-and-embeds.md) にあります。何も表示されないときは、[困ったとき](troubleshooting.md) を見てください。
