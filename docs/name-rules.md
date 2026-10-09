# Japanese names: the bracket rule

Written by `pnpm data` (scripts/build-data.ts); do not edit by hand.

Unicode CLDR 48.2.0 ends 115 of its Japanese subdivision names in a bracket that tells the place
from one of the same name elsewhere: a country (セント・ポール (ドミニカ国)), a direction (江原道 (北)) or a generic word for a
kind of place (バリンゴ (カウンティ)). In one country's list the bracket is noise, so the build takes it off when the
bracket holds a country's Japanese name, a word in `JA_BRACKET_WORDS` or a spelling in `JA_BRACKET_COUNTRY_NAMES`
(`scripts/data-config.ts`). A bracket holding anything else stays, and a test fails while any shipped name ends in one.
A name that is then overridden shows the override in the last column.

| Code | English | CLDR | Without the bracket | Shipped |
| --- | --- | --- | --- | --- |
| AG-06 | Saint Paul | セント・ポール (ドミニカ国) | セント・ポール | セント・ポール教区 |
| AG-07 | Saint Peter | セント・ピーター (ドミニカ国) | セント・ピーター | セント・ピーター教区 |
| AZ-SR | Shirvan | シルヴァン (市) | シルヴァン | シルヴァン |
| BB-01 | Christ Church | クライスト・チャーチ (バルバドス) | クライスト・チャーチ | クライスト・チャーチ |
| BB-02 | Saint Andrew | セント・アンドリュー (バルバドス) | セント・アンドリュー | セント・アンドリュー |
| BB-03 | Saint George | セント・ジョージ (バルバドス) | セント・ジョージ | セント・ジョージ |
| BB-04 | Saint James | セント・ジェームズ (バルバドス) | セント・ジェームズ | セント・ジェームズ |
| BB-05 | Saint John | セント・ジョン (バルバドス) | セント・ジョン | セント・ジョン |
| BB-06 | Saint Joseph | セント・ジョセフ (バルバドス) | セント・ジョセフ | セント・ジョセフ |
| BB-07 | Saint Lucy | セント・ルーシー (バルバドス) | セント・ルーシー | セント・ルーシー |
| BB-09 | Saint Peter | セント・ペーター (バルバドス) | セント・ペーター | セント・ペーター |
| BB-10 | Saint Philip | セント・フィリップ (バルバドス) | セント・フィリップ | セント・フィリップ |
| BB-11 | Saint Thomas | セント・トーマス (バルバドス) | セント・トーマス | セント・トーマス |
| BF-03 | Centre | 中部地方 (ブルキナファソ) | 中部地方 | 中部地方 |
| BF-04 | Centre-Est | 中東部地方 (ブルキナファソ) | 中東部地方 | 中東部地方 |
| BF-05 | Centre-Nord | 中北部地方 (ブルキナファソ) | 中北部地方 | 中北部地方 |
| BF-06 | Centre-Ouest | 中西部地方 (ブルキナファソ) | 中西部地方 | 中西部地方 |
| BF-07 | Centre-Sud | 中南部地方 (ブルキナファソ) | 中南部地方 | 中南部地方 |
| BF-08 | Est | 東部地方 (ブルキナファソ) | 東部地方 | 東部地方 |
| BF-10 | Nord | 北部地方 (ブルキナファソ) | 北部地方 | 北部地方 |
| BF-13 | Sud-Ouest | 南西地方 (ブルキナファソ) | 南西地方 | 南西地方 |
| BG-12 | Montana | モンタナ州 (ブルガリア) | モンタナ州 | モンタナ州 |
| BH-17 | Northern | 北部県 (バーレーン) | 北部県 | 北部県 |
| CV-BR | Brava | ブラヴァ (カーボベルデ) | ブラヴァ | ブラヴァ |
| CV-BV | Boa Vista | ボア・ヴィスタ (カーボベルデ) | ボア・ヴィスタ | ボア・ヴィスタ |
| CV-CR | Santa Cruz | サンタ・クルス (カーボベルデ) | サンタ・クルス | サンタ・クルス |
| CV-MA | Maio | マイオ (カーボベルデ) | マイオ | マイオ |
| CV-PA | Paul | パウル (カーボベルデ) | パウル | パウル |
| CV-PN | Porto Novo | ポルト・ノボ (カーボベルデ) | ポルト・ノボ | ポルト・ノボ |
| CV-RS | Ribeira Grande de Santiago | リベイラ・グランデ・デ・サンティアゴ (カーボベルデ) | リベイラ・グランデ・デ・サンティアゴ | リベイラ・グランデ・デ・サンティアゴ |
| CV-SL | Sal | サル (カーボベルデ) | サル | サル |
| DM-02 | Saint Andrew | セント・アンドルー (ドミニカ国) | セント・アンドルー | セント・アンドリュー教区 |
| DM-03 | Saint David | セント・デイヴィッド郡 (ドミニカ国) | セント・デイヴィッド郡 | セント・デイヴィッド教区 |
| DM-04 | Saint George | セント・ジョージ (ドミニカ国) | セント・ジョージ | セント・ジョージ教区 |
| DM-05 | Saint John | セント・ジョン郡 (ドミニカ国) | セント・ジョン郡 | セント・ジョン教区 |
| DM-06 | Saint Joseph | セント・ジョゼフ教区 (ドミニカ国) | セント・ジョゼフ教区 | セント・ジョゼフ教区 |
| DM-07 | Saint Luke | セント・ルーク (ドミニカ国) | セント・ルーク | セント・ルーク教区 |
| DM-08 | Saint Mark | セント・マーク (ドミニカ国) | セント・マーク | セント・マーク教区 |
| DM-09 | Saint Patrick | セント・パトリック (ドミニカ国) | セント・パトリック | セント・パトリック教区 |
| DM-10 | Saint Paul | セント・ポール (ドミニカ国) | セント・ポール | セント・ポール教区 |
| DM-11 | Saint Peter | セント・ピーター (ドミニカ国) | セント・ピーター | セント・ピーター教区 |
| DO-22 | San Juan | サン・フアン州 (ドミニカ共和国) | サン・フアン州 | サン・フアン州 |
| FJ-C | Central | 中央地域 (フィジー) | 中央地域 | 中央地域 |
| FJ-E | Eastern | 東部地域 (フィジー) | 東部地域 | 東部地域 |
| FJ-N | Northern | 北部地域 (フィジー) | 北部地域 | 北部地域 |
| FJ-W | Western | 西部地域 (フィジー) | 西部地域 | 西部地域 |
| GB-BDF | Bedford | ベッドフォード (バラ) | ベッドフォード | ベッドフォード |
| GB-SHN | Saint Helens | セントヘレンズ (マージーサイド) | セントヘレンズ | セントヘレンズ |
| GD-02 | Saint David | セント・デイヴィッド郡 (ドミニカ国) | セント・デイヴィッド郡 | セント・デイヴィッド教区 |
| GD-03 | Saint George | セント・ジョージ郡 (グレナダ) | セント・ジョージ郡 | セント・ジョージ教区 |
| GD-04 | Saint John | セント・ジョン郡 (ドミニカ国) | セント・ジョン郡 | セント・ジョン教区 |
| GD-05 | Saint Mark | セント・マーク (ドミニカ国) | セント・マーク | セント・マーク教区 |
| GD-06 | Saint Patrick | セント・パトリック郡 (グレナダ) | セント・パトリック郡 | セント・パトリック教区 |
| GQ-I | Insular | 島嶼地方 (赤道ギニア) | 島嶼地方 | 島嶼地方 |
| KE-01 | Baringo | バリンゴ (カウンティ) | バリンゴ | バリンゴ |
| KE-02 | Bomet | ボメット (カウンティ) | ボメット | ボメット |
| KE-03 | Bungoma | ブンゴマ (カウンティ) | ブンゴマ | ブンゴマ |
| KE-04 | Busia | ブシア (カウンティ) | ブシア | ブシア |
| KE-06 | Embu | エンブ (カウンティ) | エンブ | エンブ |
| KE-07 | Garissa | ガリッサ (カウンティ) | ガリッサ | ガリッサ |
| KE-08 | Homa Bay | ホマ・ベイ (カウンティ) | ホマ・ベイ | ホマ・ベイ |
| KE-09 | Isiolo | イシオロ (カウンティ) | イシオロ | イシオロ |
| KE-10 | Kajiado | カジアド (カウンティ) | カジアド | カジアド |
| KE-11 | Kakamega | カカメガ (カウンティ) | カカメガ | カカメガ |
| KE-12 | Kericho | ケリチョ (カウンティ) | ケリチョ | ケリチョ |
| KE-13 | Kiambu | キアンブ (カウンティ) | キアンブ | キアンブ |
| KE-14 | Kilifi | キリフィ (カウンティ) | キリフィ | キリフィ |
| KE-15 | Kirinyaga | キリーニャガ (カウンティ) | キリーニャガ | キリーニャガ |
| KE-17 | Kisumu | キスム (カウンティ) | キスム | キスム |
| KE-18 | Kitui | キツイ (カウンティ) | キツイ | キツイ |
| KE-19 | Kwale | クワレ (カウンティ) | クワレ | クワレ |
| KE-20 | Laikipia | ライキピア (カウンティ) | ライキピア | ライキピア |
| KE-21 | Lamu | ラム (カウンティ) | ラム | ラム |
| KE-22 | Machakos | マチャコス (カウンティ) | マチャコス | マチャコス |
| KE-23 | Makueni | マクエニ (カウンティ) | マクエニ | マクエニ |
| KE-24 | Mandera | マンデラ (カウンティ) | マンデラ | マンデラ |
| KE-25 | Marsabit | マルサビット (カウンティ) | マルサビット | マルサビット |
| KE-26 | Meru | メルー (カウンティ) | メルー | メルー |
| KE-27 | Migori | ミゴリ (カウンティ) | ミゴリ | ミゴリ |
| KE-28 | Mombasa | モンバサ (カウンティ) | モンバサ | モンバサ |
| KE-29 | Murang’a | ムランガ (カウンティ) | ムランガ | ムランガ |
| KE-30 | Nairobi County | ナイロビ (カウンティ) | ナイロビ | ナイロビ |
| KE-31 | Nakuru | ナクル (カウンティ) | ナクル | ナクル |
| KE-32 | Nandi | ナンディ (カウンティ) | ナンディ | ナンディ |
| KE-33 | Narok | ナロク (カウンティ) | ナロク | ナロク |
| KE-35 | Nyandarua | ニャンダルア (カウンティ) | ニャンダルア | ニャンダルア |
| KE-36 | Nyeri | ニエリ (カウンティ) | ニエリ | ニエリ |
| KE-37 | Samburu | サンブル (カウンティ) | サンブル | サンブル |
| KE-40 | Tana River | タナ・リバー (カウンティ) | タナ・リバー | タナ・リバー |
| KE-42 | Trans Nzoia | トランス・ンゾイア (カウンティ) | トランス・ンゾイア | トランス・ンゾイア |
| KE-43 | Turkana | トゥルカナ (カウンティ) | トゥルカナ | トゥルカナ |
| KE-44 | Uasin Gishu | ウアシン・ギシュ (カウンティ) | ウアシン・ギシュ | ウアシン・ギシュ |
| KE-45 | Vihiga | ヴィヒガ (カウンティ) | ヴィヒガ | ヴィヒガ |
| KE-46 | Wajir | ワジール (カウンティ) | ワジール | ワジール |
| KE-47 | West Pokot | ウェスト・ポコット (カウンティ) | ウェスト・ポコット | ウェスト・ポコット |
| KP-07 | Kangwon | 江原道 (北) | 江原道 | 江原道 |
| KR-42 | Gangwon | 江原道 (南) | 江原道 | 江原特別自治道 |
| LC-10 | Soufrière | スフレ (セントルシア) | スフレ | スフレ |
| LC-12 | Canaries | カナリアス (セントルシア) | カナリアス | カナリアス |
| LU-LU | Luxembourg | ルクセンブルク (カントン) | ルクセンブルク | ルクセンブルク郡 |
| MD-CL | Călărași | カララシ県 (モルドヴァ) | カララシ県 | カララシ県 |
| MK-201 | Berovo | ベロヴォ (マケドニア) | ベロヴォ | ベロヴォ |
| SG-02 | North East | 北東地区 (シンガポール) | 北東地区 | 北東地区 |
| SG-03 | North West | 北西地区 (シンガポール) | 北西地区 | 北西地区 |
| SG-05 | South West | 南西地区 (シンガポール) | 南西地区 | 南西地区 |
| SI-127 | Štore | シュトレ (スロベニア) | シュトレ | シュトレ |
| SV-LI | La Libertad | ラリベルタ県 (エルサルバドル) | ラリベルタ県 | ラリベルタ県 |
| SV-PA | La Paz | ラ・パス県 (エル・サルバドル) | ラ・パス県 | ラ・パス県 |
| UG-229 | Luuka | ルッカ県 (ウガンダ) | ルッカ県 | ルッカ県 |
| VC-03 | Saint David | セント・デイヴィッド郡 (ドミニカ国) | セント・デイヴィッド郡 | セント・デイヴィッド教区 |
| ZM-01 | Western | 西部州 (ザンビア) | 西部州 | 西部州 |
| ZM-02 | Central | 中央州 (ザンビア) | 中央州 | 中央州 |
| ZM-03 | Eastern | 東部州 (ザンビア) | 東部州 | 東部州 |
| ZM-05 | Northern | 北部州 (ザンビア) | 北部州 | 北部州 |
| ZM-07 | Southern | 南部州 (ザンビア) | 南部州 | 南部州 |
