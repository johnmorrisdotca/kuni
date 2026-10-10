# Withdrawn countries and IOC codes

Written by `pnpm data`; do not edit by hand.

## What is here

`@johnmorrisdotca/kuni/withdrawn` has the 31 entries of ISO 3166-3, the list of country names that were removed from ISO 3166-1: the Soviet Union (SU), Yugoslavia (YU), Czechoslovakia (CS), East Germany (DD), Zaire (ZR), the Netherlands Antilles (AN) and the rest. They are in a list of their own, and no lookup in the main entry returns one, so a country picker never shows the USSR. A record has the four-letter ISO 3166-3 code, the alpha-2, alpha-3 and numeric codes the country held, its names in English and Japanese, the years the code was in force, and the current countries that came after it.

The IOC code of 209 of the 250 countries (`country(code).ioc`, "JPN", "GER", "SUI") is Wikidata's P984, the code of the country's National Olympic Committee. For the other 41, Wikidata gives none (territories and places with no committee of their own), and the field is absent, never guessed. Two choices:

- ES: ESP. Wikidata also lists SPA, the code Spain's Olympic committee used until 1992; ESP is the one in use.
- NL: NED. Wikidata holds NL on the Kingdom of the Netherlands (Q29999) and the IOC code NED on the Netherlands (Q55), the country that competes.

Both come from Wikidata (CC0), the snapshot `data-sources/wikidata-codes-2026-10-10.json`, read on 2026-10-10, with the choices in `scripts/withdrawn-config.ts`.

## How a record is made

- **ISO 3166-3 is the authority** for a withdrawn country's codes, years and successors. `WITHDRAWN_TABLE` in `scripts/withdrawn-config.ts` is that list transcribed once, as ISO's Online Browsing Platform and the published ISO 3166-3 list give it, and `src/withdrawn.test.ts` pins the whole table, so a rebuild cannot drift from it. The first two letters of a four-letter code are the alpha-2 code that was withdrawn; the alpha-3 and numeric codes are the ones it held (none, where ISO lists none); `since` and `until` are the years the code was in force.
- **Wikidata is used for the names** in English and Japanese only (property P773 finds the item), with the few fixes in `NAME_FILLS`. The build stops if the Wikidata snapshot and ISO's table do not name the same 31 codes.
- **A successor is exactly the new code ISO lists.** It may itself be withdrawn: Yugoslavia (`YUCS`) is replaced by `CS`, which names Serbia and Montenegro (`CSXX`, 2003 to 2006) and, before it, Czechoslovakia (`CSHH`, 1974 to 1993). `withdrawn("CS")` answers both, `CSXX` first, the one withdrawn last, so following the chain from `YUCS` leads to Serbia and Montenegro, and from there to `ME` and `RS`.
- `reusedBy` is set where the withdrawn alpha-2 code was later given to a current country, so that BY, AI, BQ, GE and SK mean a country today and the older one only through this entry.
- Japanese names are Wikidata's labels, with a trailing bracket taken off (ダホメ共和国 (西アフリカ) is ダホメ共和国); where Wikidata has none, the name is `null`, never an English name copied in.

## The records

| ISO 3166-3 | Alpha-2 | Alpha-3 | Numeric | English | Japanese | Since | Until | Successors | Reused by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AIDJ | AI | AFI | 262 | French Territory of the Afars and the Issas | フランス領アファル・イッサ | 1974 | 1977 | DJ | AI |
| ANHH | AN | ANT | 530 | Netherlands Antilles | オランダ領アンティル | 1974 | 2010 | BQ CW SX |  |
| BQAQ | BQ | ATB |  | British Antarctic Territory | イギリス領南極地域 | 1974 | 1979 | AQ | BQ |
| BUMM | BU | BUR | 104 | Burma | ビルマ | 1974 | 1989 | MM |  |
| BYAA | BY | BYS | 112 | Byelorussian Soviet Socialist Republic | 白ロシア・ソビエト社会主義共和国 | 1974 | 1992 | BY | BY |
| CSHH | CS | CSK | 200 | Czechoslovakia | チェコスロバキア | 1974 | 1993 | CZ SK |  |
| CSXX | CS | SCG | 891 | Serbia and Montenegro | セルビア・モンテネグロ | 2003 | 2006 | ME RS |  |
| CTKI | CT | CTE | 128 | Canton and Enderbury Islands | (none) | 1974 | 1984 | KI |  |
| DDDE | DD | DDR | 278 | East Germany | ドイツ民主共和国 | 1974 | 1990 | DE |  |
| DYBJ | DY | DHY | 204 | Republic of Dahomey | ダホメ共和国 | 1974 | 1977 | BJ |  |
| FQHH | FQ | ATF |  | French Southern and Antarctic Lands | フランス領南方・南極地域 | 1974 | 1979 | AQ TF |  |
| FXFR | FX | FXX | 249 | Metropolitan France | フランス本土 | 1993 | 1997 | FR |  |
| GEHH | GE | GEL |  | Gilbert and Ellice Islands | ギルバートおよびエリス諸島 | 1974 | 1979 | KI | GE |
| HVBF | HV | HVO | 854 | Republic of Upper Volta | オートボルタ | 1974 | 1984 | BF |  |
| JTUM | JT | JTN | 396 | Johnston Atoll | ジョンストン島 | 1974 | 1986 | UM |  |
| MIUM | MI | MID | 488 | Midway Atoll | ミッドウェー島 | 1974 | 1986 | UM |  |
| NHVU | NH | NHB |  | New Hebrides | ニューヘブリディーズ諸島 | 1974 | 1980 | VU |  |
| NQAQ | NQ | ATN | 216 | Queen Maud Land | ドローニング・モード・ランド | 1974 | 1983 | AQ |  |
| NTHH | NT | NTZ | 536 | Saudi–Iraqi Neutral Zone | 中立地帯 | 1974 | 1993 | IQ SA |  |
| PCHH | PC | PCI | 582 | Trust Territory of the Pacific Islands | 太平洋諸島信託統治領 | 1974 | 1986 | FM MH MP PW |  |
| PUUM | PU | PUS | 849 | United States Miscellaneous Pacific Islands | (none) | 1974 | 1986 | UM |  |
| PZPA | PZ | PCZ |  | Panama Canal Zone | パナマ運河地帯 | 1974 | 1980 | PA |  |
| RHZW | RH | RHO |  | Southern Rhodesia | 南ローデシア | 1974 | 1980 | ZW |  |
| SKIN | SK | SKM |  | Kingdom of Sikkim | シッキム王国 | 1974 | 1975 | IN | SK |
| SUHH | SU | SUN | 810 | Soviet Union | ソビエト連邦 | 1974 | 1992 | AM AZ EE GE KZ KG LV LT MD RU TJ TM UZ |  |
| TPTL | TP | TMP | 626 | East Timor | 東ティモール | 1974 | 2002 | TL |  |
| VDVN | VD | VDR |  | North Vietnam | ベトナム民主共和国 | 1974 | 1977 | VN |  |
| WKUM | WK | WAK | 872 | Wake Island | ウェーク島 | 1974 | 1986 | UM |  |
| YDYE | YD | YMD | 720 | South Yemen | 南イエメン | 1974 | 1990 | YE |  |
| YUCS | YU | YUG | 891 | Yugoslavia | ユーゴスラビア | 1974 | 2003 | CS |  |
| ZRCD | ZR | ZAR | 180 | Zaire | ザイール | 1974 | 1997 | CD |  |

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

## Names written by hand

Every other name is Wikidata's.

- **BUMM** Burma
  - name (Wikidata's item is today's Myanmar, which holds the code MM; the withdrawn code BU named the country Burma.)
- **DYBJ** Republic of Dahomey
  - name (Wikidata's label has a bracket telling it from a place of the same name; kuni takes such brackets off, as it does CLDR's (docs/name-rules.md).)
- **FXFR** Metropolitan France
  - name (Wikidata's label is in lower case.)
- **TPTL** East Timor
  - name (Wikidata's item is today's Timor-Leste, which holds the code TL; the withdrawn code TP named the country East Timor.)
- **YUCS** Yugoslavia
  - name (Two Wikidata items share the code (the Socialist Federal Republic, 1945 to 1992, and the Federal Republic, 1992 to 2003); ISO 3166-3's entry is just Yugoslavia.)
