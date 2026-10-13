---
title: 国のカードと埋め込みを使う
section: how-to
order: 7
description: 型付きのデータの選択と、任意の旗・地図の素材を区別します。
---

## 標準のカードを表示する

```ts no-run
import { KuniCard,defineCard } from "@johnmorrisdotca/kuni/element";
defineCard();
const card=new KuniCard();
card.setAttribute("code","JP");
card.options={colors:{"JP-13":"#2f5d4a"},capital:false};
document.body.append(card);
console.log(card.getAttribute("code"));
```

任意の要素は、説明したコード、言語、テーマ、大きさ、表示項目を属性で保ちます。国のデータに任意の Hata の旗と Chizu の地図を組み合わせます。基本のデータの検索は外部のサービスを使いませんが、カードの既定の SVG の読み込みは素材を取得します。表示側は options で旗・地図の読み込みを渡せます。行政区画の完全なコードと、国のコードを区別します。

## 描画の設定を保つ

場所ごとの colors と首都の印の選択を、地図の読み込みに渡します。首都の文章の項目は別です。作成画面で選択を確認し、要素、モジュール、フレームワーク、iframe のコードをコピーできます。フレームは設定を確認し、保存機能を使わず、標準の読み込みやエラーを伝えます。元の[埋め込みの説明](../../embeds.md)で、すべての属性やコールバック、例を読めます。
