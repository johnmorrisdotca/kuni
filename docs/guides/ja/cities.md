---
title: 都市を使う
section: how-to
order: 18
description: 世界の都市を段階ごとに読み込み、IDで引き、国別に一覧にし、ある地点に最も近い都市を探します。
---

都市は段階（ティア）に分かれていて、ページは使うものの分だけを読み込みます。`capitals` は大きさにかかわらずすべての首都を、`1m`（100万人以上）、`100k`（10万人以上）、`15k`（1万5千人以上）はその人口のすべての都市を、首都も含めて収めます。そのため首都は2つの段階に入ることがあり、`citySet` は1つの都市を一度だけ保ちます。1つの国の国の首都（`"national"`）は1つだけです。ほかの政府の所在地（ケープタウン、京都）は `"alternate"`、行政区画の首都は `"subdivision"` です。各段階の件数と欠けている都市は `docs/cities.md` に、大きさは README のエントリー表にあります。

| import 先 | 内容 |
| --- | --- |
| `@johnmorrisdotca/kuni/cities/capitals` | 国の首都と行政区画の首都のすべて |
| `@johnmorrisdotca/kuni/cities/1m` | 人口100万人以上の都市 |
| `@johnmorrisdotca/kuni/cities/100k` | 人口10万人以上の都市 |
| `loadCities("15k")` | 人口1万5千人以上の都市。各国のファイルから作られます（すべての国のファイルを取得します） |
| `@johnmorrisdotca/kuni/cities/<code>` | 1つの国の都市を、すべての段階まとめて（`/cities/jp`） |
| `@johnmorrisdotca/kuni/cities` | 検索用の関数：`citySet`、`loadCities`、`citiesOf`、`cityById` |
| `@johnmorrisdotca/kuni/places` | 場所の選択用：`continents()`、`countriesOf(continent)`、`searchPlaces(text)` |

## 段階を組み合わせて検索する

```js
import { citySet, citiesOf } from "@johnmorrisdotca/kuni/cities";
import { countriesOf, searchPlaces } from "@johnmorrisdotca/kuni/places";
import { capitalCities } from "@johnmorrisdotca/kuni/cities/capitals";
import { cities1m } from "@johnmorrisdotca/kuni/cities/1m";

// Two tiers joined into one set: every capital, and the other cities of a million people or more.
const world = citySet(capitalCities(), cities1m());
const here = world.nearest({ lat: 48.8566, lon: 2.3522 });
console.log(here.city.name.en, here.city.country, Math.round(here.km) < 5);

// One country's cities on their own, as a place picker loads them when a country is chosen.
const japan = await citiesOf("JP");
console.log(japan.length > 100, citySet(japan).byId("Q1490")?.country);

// What a chooser asks: the countries of a continent, and what somebody typed, in Japanese if they like.
const found = await searchPlaces("パリ", { lang: "ja" });
console.log(countriesOf("OC").length > 10, found[0].label);
```

`citySet` は都市のリストをいくつでも受け取り、検索の仕組みを一度だけ作ります。`byId`、`inCountry`、`inSubdivision`、`nearest(point)`、`within(point, km)` が使えます。地点は `{ lat, lon }` であればよく、都市そのものも地点として渡せます。`nearest` は最も近い都市と、そこまでの距離（キロメートル、地球の平均半径の球面上）を返します。`maxKm`、`minPopulation`、`country` で絞り込めます。「現在地」の印には、`nearest` に位置と `minPopulation` を渡すと、すぐ隣の町ではなく小さな村が選ばれてしまうのを防げます。

`cityById("Q90")` は、IDから1つの都市を探します。見つかるまで、首都から順に段階を1つずつ読み込みます。`loadCities("capitals", "1m")` は、指定された段階を必要なときに読み込んでまとめます。地図なら、最初は首都だけを表示し、拡大したときに大都市を読み込めます。`citiesOf(code)` は、1つの国の都市をすべての段階まとめて読み込み、ほかの国のものは読み込みません。

## 場所を選ぶ画面で使うもの

`continents()` は7つの大陸を英語名と日本語名つきで返し、`countriesOf("AS")` はある大陸の国を一覧にします。どちらも kuni の分類に基づきます。`searchPlaces(text, { lang, limit })` は、入力された文字から国と都市を探します。英語名、日本語名、現地語名が対象で、大文字小文字、アクセント、ひらがなとカタカナの違いは無視します。並び順は、名前全体の一致、名前の先頭、単語の先頭、名前の途中の順で、同順位なら人口の多い順です。標準では首都と人口10万人以上の都市を探します。`tiers` で段階を指定でき（`"15k"` はすべての国のファイルを取得します）、`country` を指定すると、その国の都市だけを、すべての段階から探します。`lang` は、各結果の `label` に使う言語です。kuni は何も描画しません。選択画面は、ページ側でこれらを使って作ります。

## 都市が持つもの

```ts
import type { City } from "@johnmorrisdotca/kuni/cities";
```

- `id`：Wikidata の項目（パリは `"Q90"`）。Natural Earth にしかない場所は `"ne:<番号>"`。リリースをまたいでも変わりません。ほかの都市に統合されたIDは、その都市を返し続けます。
- `name`：`en`、そして元データにあれば `ja` と `native`。ない言語は省かれ、英語名が代わりに入ることはありません。`nativeLanguage` は `native` の言語コードです。
- `continent`（`"AS"`、`"EU"` など）、`country`（ISO 3166-1 alpha-2、大文字2文字）、`lat`、`lon`、`subdivision`（第1階層の行政区画のISO 3166-2コード。なければ `null`）。
- `population` と `populationDate`（年または日付）。どの出どころにも数値がなければ `null`。
- `capital`（`"national"`、`"alternate"`、`"subdivision"`、`null`）と `capitalOf`（その都市が首都である国や行政区画のコード。首都なら空ではありません）。
- `metro`：その都市が中心となる都市圏（urban area）`{ id, name, population, populationDate, estimated }`、なければ `null`。出どころは国ごとに一つです。カナダはカナダ統計局（Statistics Canada）の国勢調査都市圏（2025年7月1日）、アメリカは国勢調査局（Census Bureau）の統計地域（2024年7月1日）、そのほかの OECD 加盟国は OECD の機能的都市圏（functional urban area）、中国とインドは上位の都市について自国の国勢調査の都市部人口（2020年と2011年。インドの2011年の値ではムンバイがデリーより上ですが、現在はデリーの方が大きい都市です）です。公式の都市圏がある国で、中心となる都市圏がない都市は、都市より大きければ Wikidata の都市圏を使い、推計値とします（`estimated: true`）。どの一覧でも、都市圏があればその人口で、なければ都市自身の `population` で並べます。その数値が推計値なら `rankEstimated` は true です（公式の都市圏がない国では常に true）。
- `inMetroOf`：自分の都市圏を持たず、ほかの都市の都市圏の中にある都市なら、その都市の id（ミシサガとブランプトンはトロントの都市圏、フォートワースはダラスの都市圏、ターネーはムンバイの都市圏）。それ以外は `null`。人口100万人以上の都市は、近いという理由だけでほかの都市圏に入れません（横浜）。こうした都市は都市圏の中心となる都市すべての後に並ぶので、国ごとの上位10〜20都市が主要都市になります。`urbanAreaUnknown` は、中国とインドで国勢調査の都市部人口の一覧に入らない都市で true です。その都市自身の人口は行政区域全体の値なので、一覧の都市の後に並びます。
- `source`：地点、人口、日本語名のそれぞれの出どころ。`"wikidata"`、`"natural-earth"`、またはこのパッケージのために書いた少数の日本語名では `"kuni"`。日本語名はWikidataのものが常に優先され、Natural EarthのものはWikidataにない場合にだけ使われます。

場所を保存するのに必要なのは `id`、`name`、`continent`、`country`、`lat`、`lon`、`population`、`capital` です。そのほかは、きれいに表示するためにあります。

## データの出どころ

第一の出どころは Wikidata（CC0）です。`pnpm data:cities` で手作業で取得し、タイマーでの自動実行はしません。取得した日は、各段階の `CITIES_READ` にあります。Natural Earth の Populated Places（パブリックドメイン）は、Wikidata にない日本語名・人口・位置を補い、Wikidata に項目がない都市を加えます。どちらもクレジットの表記は求められていませんが、`NOTICE.md` に記しています。Wikipedia の文章や、継承条件つきのデータは使っていません。
