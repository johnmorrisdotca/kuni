# Japanese names: where CLDR and Wikidata disagree

Written by `pnpm data` (scripts/build-data.ts); do not edit by hand.

For 4322 subdivisions both Unicode CLDR 48.2.0 and Wikidata (snapshot `wikidata-2026-10-09.json`) have a Japanese
name. For 234 of them the two are not the same name once case, width, kana and punctuation are folded away. The
package keeps CLDR's name (after the bracket rule in [name-rules.md](name-rules.md)), except for the overridden names
under Resolved. This list is for a reader of Japanese to judge which is right; most of the differences are a
type word one source adds (州, 県, 地域圏) or a different spelling of a foreign name in katakana.

## Resolved by an override, 46

A reviewer found these CLDR names wrong, out of date or naming another place. `JA_NAME_OVERRIDES` in
`scripts/data-config.ts` replaces them, and the reason is beside each. They are no longer disagreements.

| Code | English | CLDR | Wikidata | Kept | Why |
| --- | --- | --- | --- | --- | --- |
| AG-06 | Saint Paul | セント・ポール (ドミニカ国) | セント・ポール教区 | セント・ポール教区 | A parish (教区), as Wikidata names it; CLDR's bracket names Dominica, not Antigua. |
| AG-07 | Saint Peter | セント・ピーター (ドミニカ国) | セント・ピーター教区 | セント・ピーター教区 | A parish (教区), as Wikidata names it; CLDR's bracket names Dominica, not Antigua. |
| AZ-LA | Lankaran | レンキャラン県 | ランカラン | ランカラン | CLDR swaps the city and the district: ISO's AZ-LA is the city of Lankaran. |
| AZ-LAN | Lankaran District | ランカラン | レンキャラン県 | ランカラン県 | CLDR swaps the city and the district: ISO's AZ-LAN is Lankaran District. |
| DM-02 | Saint Andrew | セント・アンドルー (ドミニカ国) | セント・アンドリュー教区 | セント・アンドリュー教区 | A parish (教区), as Wikidata names it; CLDR adds a country bracket. |
| DM-03 | Saint David | セント・デイヴィッド郡 (ドミニカ国) | セント・デイヴィッド教区 | セント・デイヴィッド教区 | A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county). |
| DM-04 | Saint George | セント・ジョージ (ドミニカ国) | セント・ジョージ教区 | セント・ジョージ教区 | A parish (教区), as Wikidata names it; CLDR adds a country bracket. |
| DM-05 | Saint John | セント・ジョン郡 (ドミニカ国) | セント・ジョン教区 | セント・ジョン教区 | A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county). |
| DM-06 | Saint Joseph | セント・ジョゼフ教区 (ドミニカ国) | セント・ジョゼフ教区 | セント・ジョゼフ教区 | A parish (教区), as Wikidata names it; CLDR adds a country bracket. |
| DM-07 | Saint Luke | セント・ルーク (ドミニカ国) | セント・ルーク教区 | セント・ルーク教区 | A parish (教区), as Wikidata names it; CLDR adds a country bracket. |
| DM-08 | Saint Mark | セント・マーク (ドミニカ国) | セント・マーク教区 | セント・マーク教区 | A parish (教区), as Wikidata names it; CLDR adds a country bracket. |
| DM-09 | Saint Patrick | セント・パトリック (ドミニカ国) | セント・パトリック教区 | セント・パトリック教区 | A parish (教区), as Wikidata names it; CLDR adds a country bracket. |
| DM-10 | Saint Paul | セント・ポール (ドミニカ国) | セント・ポール教区 | セント・ポール教区 | A parish (教区), as Wikidata names it; CLDR adds a country bracket. |
| DM-11 | Saint Peter | セント・ピーター (ドミニカ国) | セント・ピーター教区 | セント・ピーター教区 | A parish (教区), as Wikidata names it; CLDR adds a country bracket. |
| DO-25 | Santiago | サンティアゴ県 | サンティアゴ州 | サンティアゴ州 | The Dominican Republic's divisions are 州 (provinces), as Wikidata has it; CLDR has 県. |
| FR-CVL | Centre-Val de Loire | サントル地域圏 | サントル＝ヴァル・ド・ロワール地域圏 | サントル＝ヴァル・ド・ロワール地域圏 | Renamed in 2015 from Centre; the full name, with its hyphens as ＝. |
| GD-01 | Saint Andrew | セント・アンドリューズ | セント・アンドリュー教区 | セント・アンドリュー教区 | A parish (教区); CLDR's セント・アンドリューズ is not the form used for the other Eastern Caribbean parishes. |
| GD-02 | Saint David | セント・デイヴィッド郡 (ドミニカ国) | セント・デイヴィッド教区 | セント・デイヴィッド教区 | A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county) and its bracket names Dominica, not Grenada. |
| GD-03 | Saint George | セント・ジョージ郡 (グレナダ) | セント・ジョージ教区 | セント・ジョージ教区 | A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county). |
| GD-04 | Saint John | セント・ジョン郡 (ドミニカ国) | セント・ジョン教区 | セント・ジョン教区 | A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county) and its bracket names Dominica, not Grenada. |
| GD-05 | Saint Mark | セント・マーク (ドミニカ国) | セント・マーク教区 | セント・マーク教区 | A parish (教区), as Wikidata names it; CLDR leaves the word off and its bracket names Dominica, not Grenada. |
| GD-06 | Saint Patrick | セント・パトリック郡 (グレナダ) | セント・パトリック教区 | セント・パトリック教区 | A parish (教区), as Wikidata names it; CLDR calls it a 郡 (county). |
| IE-LS | Laois | ラオース州 | リーシュ県 | リーシュ州 | Laois is リーシュ in Japanese, as Wikidata also has it; Ireland's counties are written 州. |
| IN-JK | Jammu and Kashmir | ジャンムー・カシミール州 | ジャンムー・カシミール連邦直轄領 | ジャンムー・カシミール連邦直轄領 | Not a state since 2019: a union territory (連邦直轄領). |
| KP-07 | Kangwon | 江原道 (北) | 江原道 | 江原道 | North Korea's Kangwon is 江原道; CLDR's bracket (北) is not part of the name. |
| KR-42 | Gangwon | 江原道 (南) | 江原特別自治道 | 江原特別自治道 | Renamed in 2023: Gangwon State became Gangwon Special Self-Governing Province. |
| KR-45 | North Jeolla | 全羅北道 | 全北特別自治道 | 全北特別自治道 | Renamed in 2024: North Jeolla became Jeonbuk Special Self-Governing Province. |
| LU-LU | Luxembourg | ルクセンブルク (カントン) | ルクセンブルク | ルクセンブルク郡 | Without CLDR's bracket the name would be the country's own; 郡 marks the canton. |
| LV-041 | Jelgava Municipality | ヤルガワ | イェルガヴァ市 | イェルガヴァ | Spelled after the Latvian name, as Wikidata does for its city of the same name; CLDR's spelling reads the English. |
| LV-042 | Jēkabpils Municipality | ヤーカブピルス | イェーカブピルス市 | イェーカブピルス | Spelled after the Latvian name, as Wikidata does for its city of the same name; CLDR's spelling reads the English. |
| LV-058 | Ludza | ルヅァ | ルッザ市 | ルザ | Spelled after the Latvian name, as Wikidata does for its city of the same name; CLDR's spelling reads the English. |
| LV-059 | Madona | マドゥアナ | マドナ市 | マドナ | Spelled after the Latvian name, as Wikidata does for its city of the same name; CLDR's spelling reads the English. |
| LV-067 | Ogre | ウアグレ | オグレ市 | オグレ | Spelled after the Latvian name, as Wikidata does for its city of the same name; CLDR's spelling reads the English. |
| MA-MOH | Mohammedia | フェドハラ（モハメディア） | モハメディア県 | モハメディア | CLDR names the city with its old name in brackets (Fedhala); the city's name today is Mohammedia. |
| MK-201 | Berovo | ベロヴォ (マケドニア) | ベロヴォ | ベロヴォ | The country in the bracket is no longer called Macedonia; the bracket is not part of the name. |
| MT-06 | Cospicua | ボルムラ | コスピクア | コスピクア | CLDR gives the Maltese name, Bormla; Japanese uses the English-derived コスピクア. |
| MT-20 | Senglea | イシーラ | セングレア | セングレア | CLDR gives the Maltese name, L-Isla; Japanese uses the English-derived セングレア. |
| MT-45 | Victoria | ラバット | ラバト | ヴィクトリア | The name of the town on Gozo; CLDR gives the Maltese Rabat. |
| NG-LA | Lagos | レゴス州 | ラゴス州 | ラゴス州 | Lagos is ラゴス in Japanese, as Wikidata also has it, not CLDR's レゴス. |
| PH-DAV | Davao del Norte | ダバオ州 | 北ダバオ | 北ダバオ州 | Davao del Norte is North Davao: 北ダバオ州. |
| PH-DIN | Dinagat Islands | ディナガット・アイランズ州 | ディナガット諸島 | ディナガット諸島州 | CLDR leaves the English word Islands in katakana; 諸島 is the Japanese word. |
| UA-30 | Kyiv | キエフ | キーウ | キーウ | Japan's government adopted the Ukrainian form Kyiv (キーウ) in 2022. |
| UA-32 | Kyivshchyna | キエフ州 | キーウ州 | キーウ州 | Japan's government adopted the Ukrainian form Kyiv (キーウ) in 2022. |
| UA-51 | Odeshchyna | オデッサ州 | オデーサ州 | オデーサ州 | Japan's government adopted the Ukrainian form Odesa (オデーサ) in 2022. |
| VC-02 | Saint Andrew | セント・アンドリューズ | セント・アンドリューズ | セント・アンドリュー教区 | A parish (教区), as the neighbouring islands' parishes are written; CLDR has セント・アンドリューズ. |
| VC-03 | Saint David | セント・デイヴィッド郡 (ドミニカ国) | セント・デイヴィッド郡 | セント・デイヴィッド教区 | A parish (教区), as the neighbouring islands' parishes are written; CLDR calls it a 郡 (county). |

## For a native reader, 7

The names below were reviewed by a strong reader of Japanese, not a native one, who left these as open questions.

- **HU-CS** Csongrád, kept as チョングラード県: CLDR's チョングラード県 or Wikidata's チョングラード・チャナード県: the county is Csongrád-Csanád since 2020.
- **NI-AS** Atlántico Sur, kept as 南アトランティコ自治地域: CLDR's 南アトランティコ自治地域 or Wikidata's 南カリブ海岸自治地域: which is the usual Japanese name of this autonomous region.
- **PH-COM** Compostela Valley, kept as コンポステラ・バレー州: Compostela Valley is Davao de Oro since 2019: コンポステラ・バレー州 (CLDR) or ダバオ・デ・オロ (Wikidata)?
- **VN-39** Đồng Nai, kept as ドンナイ省: ドンナイ省 (CLDR) or ドンナイ市 (Wikidata): a province, and Wikidata's 市 may come from its city.
- **KP-01** Pyongyang, kept as 平壌: 平壌 (CLDR) or 平壌市 (Wikidata): whether the city's name wants 市 here, as 東京都 and 大阪市 do.
- **LV-041** Jelgava Municipality, kept as イェルガヴァ: イェルガヴァ is also the name given to the city of Jelgava (LV-JEL), so a search for it finds two places: should the municipality carry a kind word?
- **BB-09** Saint Peter, kept as セント・ペーター: セント・ペーター, while the same saint is セント・ピーター in AG-07 and DM-11: should Barbados match?

## United Arab Emirates (AE), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| AE-AZ | Abu Dhabi | アブダビ | アブダビ首長国 |

## Armenia (AM), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| AM-ER | Yerevan | エレバン | イェレヴァン |

## Barbados (BB), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| BB-01 | Christ Church | クライスト・チャーチ | クライスト・チャーチ教区 |

## Brazil (BR), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| BR-SE | Sergipe | セルジッペ州 | セルジペ州 |

## Canada (CA), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| CA-PE | Prince Edward Island | プリンスエドワードアイランド州 | プリンスエドワード島 |

## Côte d’Ivoire (CI), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| CI-ZZ | Zanzan | ザンザン州 | ザンザン地方 |

## Cuba (CU), 4

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| CU-03 | Havana | ハバナ | ラ・アバーナ州 |
| CU-06 | Cienfuegos | シエンフエーゴス州 | シエンフエゴス州 |
| CU-13 | Santiago de Cuba | サンティアーゴ・デ・クーバ州 | サンティアゴ・デ・クーバ州 |
| CU-14 | Guantánamo | グァンタナモ州 | グアンタナモ州 |

## Czechia (CZ), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| CZ-714 | Přerov | プルジェロフ郡 | プシェロフ郡 |

## Germany (DE), 2

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| DE-BY | Bavaria | バイエルン自由州 | バイエルン |
| DE-NI | Lower Saxony | ニーダーザクセン州 | 下ザクセン州 |

## Spain (ES), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| ES-CS | Castellón | カステリョン県 | カステリョン |

## Fiji (FJ), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| FJ-R | Rotuma | ロツマ島 | ロツマ |

## France (FR), 5

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| FR-73 | Savoie | サヴォワ県 | サヴォワ |
| FR-BL | St. Barthélemy | サン・バルテルミー | サン・バルテルミー島 |
| FR-OCC | Occitanie | オクシタニー地域圏 | オクシタニア地域圏 |
| FR-PF | French Polynesia | 仏領ポリネシア | フランス領ポリネシア |
| FR-TF | French Southern Territories | 仏領極南諸島 | フランス領南方・南極地域 |

## United Kingdom (GB), 11

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| GB-BST | Bristol | ブリストル | シティ・オヴ・ブリストル |
| GB-DND | Dundee | ダンディー | ダンディー市 |
| GB-DUR | Durham | ダラム | カウンティ・ダラム |
| GB-GLS | Gloucestershire | グロスタシャー | グロスターシャー |
| GB-LCE | Leicester | レスター | シティ・オヴ・レスター |
| GB-NGM | Nottingham | ノッティンガム | シティ・オヴ・ノッティンガム |
| GB-PLY | Plymouth | プリマス | シティ・オヴ・プリマス |
| GB-STE | Stoke-on-Trent | ストーク・オン・トレント | シティ・オヴ・ストーク＝オン＝トレント |
| GB-STH | Southampton | サウサンプトン | シティ・オヴ・サウサンプトン |
| GB-WRT | Warrington | ウォリントン | ワリントン |
| GB-YOR | York | ヨーク | シティ・オヴ・ヨーク |

## Georgia (GE), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| GE-AB | Abkhazia | アブハジア | アブハジア自治共和国 |

## Greece (GR), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| GR-69 | Mount Athos | アトス山 | アトス自治修道士共和国 |

## Haiti (HT), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| HT-OU | Ouest | 西県 | ウエスト県 |

## Hungary (HU), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| HU-CS | Csongrád | チョングラード県 | チョングラード・チャナード県 |

## Ireland (IE), 24

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| IE-CE | Clare | クレア州 | クレア県 |
| IE-CN | Cavan | キャバン州 | キャバン県 |
| IE-CO | Cork | コーク州 | コーク県 |
| IE-CW | Carlow | カーロウ州 | カーロウ県 |
| IE-DL | Donegal | ドニゴール州 | ドニゴール県 |
| IE-G | Galway | ゴールウェイ州 | ゴールウェイ県 |
| IE-KE | Kildare | キルデア州 | キルデア県 |
| IE-KK | Kilkenny | キルケニー州 | キルケニー県 |
| IE-KY | Kerry | ケリー州 | ケリー県 |
| IE-LD | Longford | ロングフォード州 | ロングフォード県 |
| IE-LH | Louth | ラウス州 | ラウス県 |
| IE-LK | Limerick | リムリック州 | リムリック県 |
| IE-LM | Leitrim | リートリム州 | リートリム県 |
| IE-MH | Meath | ミース州 | ミーズ県 |
| IE-MN | Monaghan | モナハン州 | モナハン県 |
| IE-MO | Mayo | メイヨー州 | メイヨー県 |
| IE-OY | Offaly | オファリー州 | オファリー県 |
| IE-RN | Roscommon | ロスコモン州 | ロスコモン県 |
| IE-SO | Sligo | スライゴ州 | スライゴ県 |
| IE-TA | Tipperary | ティペラリー州 | ティペラリー県 |
| IE-WD | Waterford | ウォーターフォード州 | ウォーターフォード県 |
| IE-WH | Westmeath | ウェストミース州 | ウェストミーズ県 |
| IE-WW | Wicklow | ウィックロー州 | ウィックロー県 |
| IE-WX | Wexford | ウェックスフォード州 | ウェックスフォード県 |

## Iran (IR), 4

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| IR-07 | Tehran | テヘラン州 | ファールス州 |
| IR-14 | Fars | ファールス州 | チャハール＝マハール・バフティヤーリー州 |
| IR-22 | Markazi | マルキャズィー州 | ホルモズガーン州 |
| IR-23 | Hormozgan | ホルモズガーン州 | テヘラン州 |

## Italy (IT), 7

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| IT-88 | Sardinia | サルデーニャ州 | サルデーニャ |
| IT-BA | Bari | バーリ県 | バーリ |
| IT-BO | Bologna | ボローニャ県 | ボローニャ広域市 |
| IT-BS | Brescia | ブレシア県 | ブレーシャ県 |
| IT-CT | Catania | カターニア県 | カターニア大都市圏 |
| IT-MI | Milan | ミラノ県 | ミラノメトロポリタンシティ |
| IT-TN | Trentino | トレント自治県 | トレン |

## Kyrgyzstan (KG), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| KG-N | Naryn | ナルイン州 | ナルン州 |

## Cambodia (KH), 2

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| KH-13 | Preah Vihear | プレアヴィヒア州 | プリアヴィヒア州 |
| KH-22 | Oddar Meanchey | ウドンメンチェイ州 | ウドーミアンチェイ州 |

## North Korea (KP), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| KP-01 | Pyongyang | 平壌 | 平壌市 |

## Lithuania (LT), 15

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| LT-03 | Alytus | アリートゥス郡 | アリートゥス地区自治体 |
| LT-05 | Birštonas | ビルシュトナス郡 | ビルシュトナス自治体 |
| LT-10 | Jonava | ヨナヴァ郡 | ヨナヴァ地区自治体 |
| LT-22 | Kretinga | クレチンガ | クレティンガ地区自治体 |
| LT-54 | Utena | ウテナ地方 | ウテナ地区自治体 |
| LT-AL | Alytus County | アリートゥス県 | アリートゥス郡 |
| LT-KL | Klaipėda County | クライペダ県 | クライペダ郡 |
| LT-KU | Kaunas County | カウナス県 | カウナス郡 |
| LT-MR | Marijampolė County | マリヤーンポレ県 | マリヤンポレ郡 |
| LT-PN | Panevėžys County | パネヴェジース県 | パネヴェジース郡 |
| LT-SA | Šiauliai County | シャウレイ県 | シャウレイ郡 |
| LT-TA | Tauragė County | タウラゲ県 | タウラゲ郡 |
| LT-TE | Telšiai County | テルシェイ県 | テルシェイ郡 |
| LT-UT | Utena County | ウテナ県 | ウテナ郡 |
| LT-VL | Vilnius County | ヴィリニュス県 | ヴィルニュス郡 |

## Latvia (LV), 18

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| LV-002 | Aizkraukle | アイズクラウクレ | アイズクラウクレ市 |
| LV-011 | Ādaži | アーダジ | アーダジ市 |
| LV-015 | Balvi | バルヴィ | バルヴィ市 |
| LV-016 | Bauska | バウスカ | バウスカ市 |
| LV-022 | Cēsis | ツェースィス | ツェーシス市 |
| LV-026 | Dobele | ドベレ | ドベレ市 |
| LV-047 | Krāslava | クラスラヴァ | クラースラヴァ市 |
| LV-050 | Kuldīga | クルディーガ | クルディーガ市 |
| LV-052 | Ķekava | キェカワ | キェッカヴァ市 |
| LV-054 | Limbaži | リンバジ | リンバジ市 |
| LV-073 | Preiļi | プレイリ | プレイリ市 |
| LV-077 | Rēzekne Municipality | レーゼクネ | レーゼクネ市 |
| LV-088 | Saldus | サルドゥス | サルドゥス市 |
| LV-089 | Saulkrasti | サウルクラスチ | サウルクラスティ市 |
| LV-091 | Sigulda | スィグルダ | スィグルダ市 |
| LV-094 | Smiltene | スミルテネ | スミルテネ市 |
| LV-097 | Talsi | タルスィ | タルスィ市 |
| LV-099 | Tukums | トゥクムス | トゥクムス市 |

## Morocco (MA), 6

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| MA-04 | Oriental | オリアンタル地方 | ラバト＝サレ＝ケニトラ地方 |
| MA-05 | Fès-Boulemane | フェズ・ブルマーヌ地方 | ベニ・メラル＝ヘニフラ地方 |
| MA-08 | Grand Casablanca | グラン・カサブランカ地方 | ドラア＝タフィラルト地方 |
| MA-AGD | Agadir-Ida Ou Tanane | アガディール | アガディール＝イダ＝オ＝タナネ県 |
| MA-MEK | Meknès | メクネス | メクネス県 |
| MA-RAB | Rabat | ラバト | ラバト県 |

## Monaco (MC), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| MC-MO | Monaco-Ville | モナコ・ヴィル | モナコ市 |

## Myanmar (Burma) (MM), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| MM-05 | Tanintharyi | タニンダーリ管区 | タニンダーイー管区 |

## Malta (MT), 2

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| MT-02 | Balzan | バルツァーン | バルザン |
| MT-56 | Sliema | スリマ | スリーマ |

## Malawi (MW), 26

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| MW-BA | Balaka | バラカ | バラカ県 |
| MW-BL | Blantyre | ブランタイヤ | ブランタイヤ県 |
| MW-CK | Chikwawa | チクワワ | チクワワ県 |
| MW-CR | Chiradzulu | チラズル | チラズル県 |
| MW-CT | Chitipa | チティパ | チティパ県 |
| MW-DE | Dedza | デッザ | デッザ県 |
| MW-DO | Dowa | ドーワ | ドーワ県 |
| MW-KR | Karonga | カロンガ | カロンガ県 |
| MW-KS | Kasungu | カスング | カスング県 |
| MW-LK | Likoma | リコマ | リコマ県 |
| MW-MC | Mchinji | ムチンジ | ムチンジ県 |
| MW-MG | Mangochi | マンゴチ | マンゴチ県 |
| MW-MH | Machinga | マチンガ | マチンガ県 |
| MW-MU | Mulanje | ムランジェ | ムランジェ県 |
| MW-MW | Mwanza | ムワンザ | ムワンザ県 |
| MW-MZ | Mzimba | ムジンバ | ムジンバ県 |
| MW-NB | Nkhata Bay | カタベイ | カタベイ県 |
| MW-NE | Neno | ネノ | ネノ県 |
| MW-NI | Ntchisi | ンチシ | ンチシ県 |
| MW-NK | Nkhotakota | コタコタ | コタコタ県 |
| MW-NS | Nsanje | ンサンジェ | ンサンジェ県 |
| MW-NU | Ntcheu | ンチェウ | ンチェウ県 |
| MW-PH | Phalombe | パロンベ | パロンベ県 |
| MW-RU | Rumphi | ルンピ | ルンピ県 |
| MW-SA | Salima | サリマ | サリマ県 |
| MW-TH | Thyolo | チョロ | チョロ県 |

## Mozambique (MZ), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| MZ-L | Maputo Province | マプト州 | マプート州 |

## Nicaragua (NI), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| NI-AS | Atlántico Sur | 南アトランティコ自治地域 | 南カリブ海岸自治地域 |

## Norway (NO), 2

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| NO-42 | Agder | アグデル | アグデル県 |
| NO-50 | Trøndelag | トロンデラーグ | トロンデラーグ県 |

## New Zealand (NZ), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| NZ-BOP | Bay of Plenty | ベイ・オブ・プレンティ地方 | ベイ・オブ・プレンティ |

## Philippines (PH), 74

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| PH-ABR | Abra | アブラ州 | アブラ |
| PH-AGN | Agusan del Norte | 北アグサン州 | 北アグサン |
| PH-AGS | Agusan del Sur | 南アグサン州 | 南アグサン |
| PH-AKL | Aklan | アクラン州 | アクラン |
| PH-ALB | Albay | アルバイ州 | アルバイ |
| PH-ANT | Antique | アンティーケ州 | アンティーケ |
| PH-APA | Apayao | アパヤオ州 | アパヤオ |
| PH-AUR | Aurora | アウロラ州 | アウロラ |
| PH-BAN | Bataan | バターン州 | バターン |
| PH-BAS | Basilan | バシラン州 | バシラン |
| PH-BEN | Benguet | ベンゲット州 | ベンゲット |
| PH-BIL | Biliran | ビリラン州 | ビリラン |
| PH-BOH | Bohol | ボホール州 | ボホール |
| PH-BTG | Batangas | バタンガス州 | バタンガス |
| PH-BTN | Batanes | バタネス州 | バタネス |
| PH-BUK | Bukidnon | ブキドノン州 | ブキドノン |
| PH-BUL | Bulacan | ブラカン州 | ブラカン |
| PH-CAG | Cagayan | カガヤン州 | カガヤン |
| PH-CAM | Camiguin | カミギン州 | カミギン |
| PH-CAN | Camarines Norte | 北カマリネス州 | 北カマリネス |
| PH-CAP | Capiz | カピス州 | カピス |
| PH-CAS | Camarines Sur | 南カマリネス州 | 南カマリネス |
| PH-CAT | Catanduanes | カタンドゥアネス州 | カタンドゥアネス |
| PH-CAV | Cavite | カヴィテ州 | カヴィテ |
| PH-COM | Compostela Valley | コンポステラ・バレー州 | ダバオ・デ・オロ |
| PH-DAO | Davao Oriental | 東ダバオ州 | 東ダバオ |
| PH-DAS | Davao del Sur | 南ダバオ州 | 南ダバオ |
| PH-EAS | Eastern Samar | 東サマル州 | 東サマル |
| PH-GUI | Guimaras | ギマラス州 | ギマラス |
| PH-IFU | Ifugao | イフガオ州 | イフガオ |
| PH-ILI | Iloilo | イロイロ州 | イロイロ |
| PH-ILN | Ilocos Norte | 北イロコス州 | 北イロコス |
| PH-ILS | Ilocos Sur | 南イロコス州 | 南イロコス |
| PH-ISA | Isabela | イサベラ州 | イサベラ |
| PH-KAL | Kalinga | カリンガ州 | カリンガ |
| PH-LAG | Laguna | ラグナ州 | ラグナ |
| PH-LAN | Lanao del Norte | 北ラナオ州 | 北ラナオ |
| PH-LAS | Lanao del Sur | 南ラナオ州 | 南ラナオ |
| PH-LEY | Leyte | レイテ州 | レイテ |
| PH-LUN | La Union | ラウニオン州 | ラウニオン |
| PH-MAD | Marinduque | マリンドゥケ州 | マリンドゥケ |
| PH-MAS | Masbate | マスバテ州 | マスバテ |
| PH-MDC | Occidental Mindoro | 西ミンドロ州 | 西ミンドロ |
| PH-MDR | Oriental Mindoro | 東ミンドロ州 | 東ミンドロ |
| PH-MSC | Misamis Occidental | 西ミサミス州 | 西ミサミス |
| PH-MSR | Misamis Oriental | 東ミサミス州 | 東ミサミス |
| PH-NEC | Negros Occidental | 西ネグロス州 | 西ネグロス |
| PH-NER | Negros Oriental | 東ネグロス州 | 東ネグロス |
| PH-NSA | Northern Samar | 北サマル州 | 北サマル |
| PH-NUE | Nueva Ecija | ヌエヴァ・エシハ州 | ヌエヴァ・エシハ |
| PH-NUV | Nueva Vizcaya | ヌエヴァ・ヴィスカヤ州 | ヌエヴァ・ヴィスカヤ |
| PH-PAM | Pampanga | パンパンガ州 | パンパンガ |
| PH-PAN | Pangasinan | パンガシナン州 | パンガシナン |
| PH-PLW | Palawan | パラワン州 | パラワン |
| PH-QUE | Quezon | ケソン州 | ケソン |
| PH-QUI | Quirino | キリノ州 | キリノ |
| PH-RIZ | Rizal | リサール州 | リサール |
| PH-ROM | Romblon | ロンブロン州 | ロンブロン |
| PH-SAR | Sarangani | サランガニ州 | サランガニ |
| PH-SCO | South Cotabato | 南コタバト州 | 南コタバト |
| PH-SIG | Siquijor | シキホル州 | シキホル |
| PH-SLE | Southern Leyte | 南レイテ州 | 南レイテ |
| PH-SLU | Sulu | スールー州 | スールー |
| PH-SOR | Sorsogon | ソルソゴン州 | ソルソゴン |
| PH-SUK | Sultan Kudarat | スルタン・クダラット州 | スルタン・クダラット |
| PH-SUN | Surigao del Norte | 北スリガオ州 | 北スリガオ |
| PH-SUR | Surigao del Sur | 南スリガオ州 | 南スリガオ |
| PH-TAR | Tarlac | タルラック州 | タルラック |
| PH-TAW | Tawi-Tawi | タウイタウイ州 | タウイタウイ |
| PH-WSA | Samar | サマル州 | サマル |
| PH-ZAN | Zamboanga del Norte | 北サンボアンガ州 | 北サンボアンガ |
| PH-ZAS | Zamboanga del Sur | 南サンボアンガ州 | 南サンボアンガ |
| PH-ZMB | Zambales | サンバレス州 | サンバレス |
| PH-ZSI | Zamboanga Sibugay | サンボアンガ・シブガイ州 | サンボアンガ・シブガイ |

## Poland (PL), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| PL-16 | Opole | オポーレ県 | オポレ県 |

## Palestinian Territories (PS), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| PS-TKM | Tulkarm | トゥールカリム | トゥールカリム県 |

## Seychelles (SC), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| SC-15 | La Digue | ラ・ディーグ島 | ラ・ディーグ島およびインナー諸島 |

## Slovenia (SI), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| SI-193 | Žužemberk | ジュジェンベルク | ジュジュンベルク市 |

## Suriname (SR), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| SR-SA | Saramacca | サラマッカ | サラマッカ地方 |

## Taiwan (TW), 2

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| TW-CYI | Chiayi County | 嘉義県 | 嘉義市 |
| TW-CYQ | Chiayi | 嘉義市 | 嘉義県 |

## United States (US), 2

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| US-AS | American Samoa | 米領サモア | アメリカ領サモア |
| US-VI | U.S. Virgin Islands | 米領ヴァージン諸島 | アメリカ領ヴァージン諸島 |

## Venezuela (VE), 1

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| VE-W | Federal Dependencies | ベネズエラ連邦保護領 | 連邦保護領 |

## Vietnam (VN), 2

| Code | English | CLDR (kept) | Wikidata |
| --- | --- | --- | --- |
| VN-39 | Đồng Nai | ドンナイ省 | ドンナイ市 |
| VN-56 | Bắc Ninh | バクニン省 | バクニン |
