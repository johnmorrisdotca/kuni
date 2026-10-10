# Withdrawn countries and IOC codes

Written by `pnpm data`; do not edit by hand.

## What is here

`@johnmorrisdotca/kuni/withdrawn` has the 31 entries of ISO 3166-3, the list of country names that were removed from ISO 3166-1: the Soviet Union (SU), Yugoslavia (YU), Czechoslovakia (CS), East Germany (DD), Zaire (ZR), the Netherlands Antilles (AN) and the rest. They are in a list of their own, and no lookup in the main entry returns one, so a country picker never shows the USSR. A record has the four-letter ISO 3166-3 code, the alpha-2, alpha-3 and numeric codes the country held, its names in English and Japanese, the years the code was in force, and the current countries that came after it.

The IOC code of 209 of the 250 countries (`country(code).ioc`, "JPN", "GER", "SUI") is Wikidata's P984, the code of the country's National Olympic Committee. For the other 41, Wikidata gives none (territories and places with no committee of their own), and the field is absent, never guessed. Two choices:

- ES: ESP. Wikidata also lists SPA, the code Spain's Olympic committee used until 1992; ESP is the one in use.
- NL: NED. Wikidata holds NL on the Kingdom of the Netherlands (Q29999) and the IOC code NED on the Netherlands (Q55), the country that competes.

Both come from Wikidata (CC0), the snapshot `data-sources/wikidata-codes-2026-10-10.json`, read on 2026-10-10, with the choices in `scripts/withdrawn-config.ts`.

## How a record is made

- A record is one ISO 3166-3 code (Wikidata property P773). Its first two letters are the alpha-2 code that was withdrawn, as the standard defines them; where Wikidata has an alpha-2 code that ended, it must say the same, or the build stops.
- The years are those Wikidata gives the alpha-2 code's statement (start and end). Wikidata gives the first of January, so they are years ("1974"); a day that is not the first of January is kept whole. ISO 3166-1 began in 1974, which is the start where none is given.
- A code the successor still uses (Timor-Leste's numeric 626, the French Southern Lands' ATF) is not a withdrawn code and is left out.
- A successor is a current country that Wikidata says replaced or followed it, or one added by hand in `SUCCESSOR_FILLS` with the reason. Every record has at least one.
- `reusedBy` is set where the withdrawn alpha-2 code was later given to a current country, so that BY, AI, BQ, GE and SK mean a country today and the older one only through this entry.
- Japanese names are Wikidata's labels, with a trailing bracket taken off (ダホメ共和国 (西アフリカ) is ダホメ共和国); where Wikidata has none, the name is `null`, never an English name copied in.

## The records

| ISO 3166-3 | Alpha-2 | Alpha-3 | Numeric | English | Japanese | Since | Until | Successors | Reused by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AIDJ | AI | AFI | 262 | French Territory of the Afars and the Issas | フランス領アファル・イッサ | 1974 | 1977 | DJ | AI |
| ANHH | AN | ANT | 530 | Netherlands Antilles | オランダ領アンティル | 1974 | 2010 | AW BQ CW SX |  |
| BQAQ | BQ | ATB | 080 | British Antarctic Territory | イギリス領南極地域 | 1974 | 1979 | AQ | BQ |
| BUMM | BU | BUR |  | Burma | ビルマ | 1974 | 1989 | MM |  |
| BYAA | BY | BYS | 112 | Byelorussian Soviet Socialist Republic | 白ロシア・ソビエト社会主義共和国 | 1974 | 1992 | BY | BY |
| CSHH | CS | CSK | 200 | Czechoslovakia | チェコスロバキア | 1974 | 1993 | CZ SK |  |
| CSXX | CS | SCG | 891 | Serbia and Montenegro | セルビア・モンテネグロ | 2003 | 2006 | ME RS |  |
| CTKI | CT | CTE | 128 | Canton and Enderbury Islands | (none) | 1974 | 1984 | KI |  |
| DDDE | DD | DDR | 278 | East Germany | ドイツ民主共和国 | 1974 | 1990 | DE |  |
| DYBJ | DY | DHY | 204 | Republic of Dahomey | ダホメ共和国 | 1974 | 1977 | BJ |  |
| FQHH | FQ |  |  | French Southern and Antarctic Lands | フランス領南方・南極地域 | 1974 | 1979 | TF |  |
| FXFR | FX | FXX | 249 | Metropolitan France | フランス本土 | 1993 | 1997 | FR |  |
| GEHH | GE | GEL | 296 | Gilbert and Ellice Islands | ギルバートおよびエリス諸島 | 1974 | 1979 | KI TV | GE |
| HVBF | HV | HVO | 854 | Republic of Upper Volta | オートボルタ | 1974 | 1984 | BF |  |
| JTUM | JT | JTN | 396 | Johnston Atoll | ジョンストン島 | 1974 | 1986 | UM |  |
| MIUM | MI | MID | 488 | Midway Atoll | ミッドウェー島 | 1974 | 1986 | UM |  |
| NHVU | NH | NHB | 548 | New Hebrides | ニューヘブリディーズ諸島 | 1974 | 1980 | VU |  |
| NQAQ | NQ | ATN | 216 | Queen Maud Land | ドローニング・モード・ランド | 1974 | 1983 | AQ |  |
| NTHH | NT | NTZ | 536 | Saudi–Iraqi Neutral Zone | 中立地帯 | 1974 | 1993 | IQ SA |  |
| PCHH | PC | PCI | 582 | Trust Territory of the Pacific Islands | 太平洋諸島信託統治領 | 1974-12-15 | 1986-01-15 | FM MH MP PW |  |
| PUUM | PU | PUS | 849 | United States Miscellaneous Pacific Islands | (none) | 1974 | 1986 | UM |  |
| PZPA | PZ | PCZ | 594 | Panama Canal Zone | パナマ運河地帯 | 1974 | 1979-10-01 | PA |  |
| RHZW | RH | RHO |  | Southern Rhodesia | 南ローデシア | 1974 | 1980-04-18 | ZW |  |
| SKIN | SK | SKM |  | Kingdom of Sikkim | シッキム王国 | 1974 | 1975-05-16 | IN | SK |
| SUHH | SU | SUN | 810 | Soviet Union | ソビエト連邦 | 1974 | 1992 | AM AZ BY EE GE KG KZ LT LV MD RU TJ TM UA UZ |  |
| TPTL | TP | TMP |  | East Timor | 東ティモール | 1974 | 2002 | TL |  |
| VDVN | VD | VDR |  | North Vietnam | ベトナム民主共和国 | 1974 | 1976-07-02 | VN |  |
| WKUM | WK | WAK | 872 | Wake Island | ウェーク島 | 1974 | 1986 | UM |  |
| YDYE | YD | YMD | 720 | South Yemen | 南イエメン | 1974 | 1990-08-14 | YE |  |
| YUCS | YU | YUG | 891 | Yugoslavia | ユーゴスラビア | 1974 | 2003 | BA HR ME MK RS SI |  |
| ZRCD | ZR | ZAR | 180 | Zaire | ザイール | 1974 | 1997-05-16 | CD |  |

## Japanese names, for review

Wikidata's labels. A native reader of Japanese should look at these before they are relied on.

- AIDJ: French Territory of the Afars and the Issas / フランス領アファル・イッサ
- ANHH: Netherlands Antilles / オランダ領アンティル
- BQAQ: British Antarctic Territory / イギリス領南極地域
- BUMM: Burma / ビルマ
- BYAA: Byelorussian Soviet Socialist Republic / 白ロシア・ソビエト社会主義共和国
- CSHH: Czechoslovakia / チェコスロバキア
- CSXX: Serbia and Montenegro / セルビア・モンテネグロ
- CTKI: Canton and Enderbury Islands / (none)
- DDDE: East Germany / ドイツ民主共和国
- DYBJ: Republic of Dahomey / ダホメ共和国
- FQHH: French Southern and Antarctic Lands / フランス領南方・南極地域
- FXFR: Metropolitan France / フランス本土
- GEHH: Gilbert and Ellice Islands / ギルバートおよびエリス諸島
- HVBF: Republic of Upper Volta / オートボルタ
- JTUM: Johnston Atoll / ジョンストン島
- MIUM: Midway Atoll / ミッドウェー島
- NHVU: New Hebrides / ニューヘブリディーズ諸島
- NQAQ: Queen Maud Land / ドローニング・モード・ランド
- NTHH: Saudi–Iraqi Neutral Zone / 中立地帯
- PCHH: Trust Territory of the Pacific Islands / 太平洋諸島信託統治領
- PUUM: United States Miscellaneous Pacific Islands / (none)
- PZPA: Panama Canal Zone / パナマ運河地帯
- RHZW: Southern Rhodesia / 南ローデシア
- SKIN: Kingdom of Sikkim / シッキム王国
- SUHH: Soviet Union / ソビエト連邦
- TPTL: East Timor / 東ティモール
- VDVN: North Vietnam / ベトナム民主共和国
- WKUM: Wake Island / ウェーク島
- YDYE: South Yemen / 南イエメン
- YUCS: Yugoslavia / ユーゴスラビア
- ZRCD: Zaire / ザイール

## What was filled by hand

Every other part of every record is Wikidata's.

- **BQAQ** British Antarctic Territory
  - successors AQ (The British Antarctic Territory is a claim on Antarctica, AQ.)
- **BUMM** Burma
  - name (Wikidata's item is today's Myanmar, which holds the code MM; the withdrawn code BU named the country Burma.)
  - successors MM (Burma was renamed Myanmar; its code BU became MM.)
- **CSHH** Czechoslovakia
  - successors CZ SK (Czechoslovakia divided into Czechia and Slovakia on 1 January 1993.)
- **CTKI** Canton and Enderbury Islands
  - successors KI (The Canton and Enderbury Islands are part of Kiribati.)
- **DYBJ** Republic of Dahomey
  - name (Wikidata's label has a bracket telling it from a place of the same name; kuni takes such brackets off, as it does CLDR's (docs/name-rules.md).)
  - successors BJ (Dahomey was renamed Benin in 1975.)
- **FQHH** French Southern and Antarctic Lands
  - successors TF (The French Southern and Antarctic Territories are TF today.)
- **FXFR** Metropolitan France
  - name (Wikidata's label is in lower case.)
  - successors FR (Metropolitan France is part of France.)
- **GEHH** Gilbert and Ellice Islands
  - successors KI TV (The Gilbert and Ellice Islands became Kiribati and Tuvalu.)
- **JTUM** Johnston Atoll
  - successors UM (Johnston Atoll is one of the United States Minor Outlying Islands.)
- **MIUM** Midway Atoll
  - successors UM (Midway Atoll is one of the United States Minor Outlying Islands.)
- **NQAQ** Queen Maud Land
  - successors AQ (Queen Maud Land is a claim on Antarctica, AQ.)
- **NTHH** Saudi–Iraqi Neutral Zone
  - period (ISO 3166-3: the Saudi-Iraqi Neutral Zone's code was withdrawn in 1993; Wikidata dates the zone's end to 1991.)
  - codes (ISO 3166-3: the Neutral Zone's alpha-3 and numeric codes.)
  - successors IQ SA (The Neutral Zone was divided between Saudi Arabia and Iraq.)
- **PCHH** Trust Territory of the Pacific Islands
  - successors FM MH MP PW (The Trust Territory of the Pacific Islands became the Federated States of Micronesia, the Marshall Islands, the Northern Mariana Islands and Palau.)
- **PUUM** United States Miscellaneous Pacific Islands
  - period (ISO 3166-3: the code went when the US Minor Outlying Islands (UM) were given one code in 1986.)
  - codes (ISO 3166-3: US Miscellaneous Pacific Islands.)
  - successors UM (The islands became the United States Minor Outlying Islands.)
- **PZPA** Panama Canal Zone
  - codes (ISO 3166-3: the Panama Canal Zone.)
  - successors PA (The Canal Zone was returned to Panama.)
- **RHZW** Southern Rhodesia
  - codes (ISO 3166-3: Southern Rhodesia has an alpha-3 code and no numeric one.)
- **SKIN** Kingdom of Sikkim
  - codes (ISO 3166-3: Sikkim has an alpha-3 code and no numeric one.)
  - successors IN (Sikkim joined India in 1975.)
- **TPTL** East Timor
  - name (Wikidata's item is today's Timor-Leste, which holds the code TL; the withdrawn code TP named the country East Timor.)
  - successors TL (Portuguese Timor's code TP became TL when East Timor became independent.)
- **VDVN** North Vietnam
  - codes (ISO 3166-3: North Vietnam has an alpha-3 code and no numeric one.)
  - successors VN (North Vietnam united with the south as Vietnam in 1976.)
- **WKUM** Wake Island
  - period (ISO 3166-3: the code went when the US Minor Outlying Islands (UM) were given one code in 1986.)
  - codes (ISO 3166-3: Wake Island.)
  - successors UM (Wake Island is one of the United States Minor Outlying Islands.)
- **YUCS** Yugoslavia
  - name (Two Wikidata items share the code (the Socialist Federal Republic, 1945 to 1992, and the Federal Republic, 1992 to 2003); ISO 3166-3's entry is just Yugoslavia.)
  - successors ME RS (The Federal Republic of Yugoslavia became Serbia and Montenegro, then these two; Wikidata gives the Socialist Federal Republic's four but not these.)
- **ZRCD** Zaire
  - codes (ISO 3166-3: Zaire's alpha-3 code and its numeric code, 180, which the Democratic Republic of the Congo still uses.)
