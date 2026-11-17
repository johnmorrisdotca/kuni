# The trivia

Written by `pnpm data`; do not edit by hand. The rules are at the top of `scripts/trivia.ts`.

`@johnmorrisdotca/kuni/trivia` has, for each of the 250 countries: when it began, from Wikidata (CC0), the snapshot `data-sources/wikidata-trivia-2026-11-17.json`, read on 2026-11-17; its official languages, from Unicode CLDR's territoryInfo; and its largest city, by the people of the city itself, from kuni's own cities.

| Fact | Countries that have it |
| --- | --- |
| `inception` | 224 of 250, 145 to the day |
| `officialLanguages` | 246 of 250 |
| `largestCity` | 228 of 250 |

## What an inception is

Wikidata's inception (P571) is the day the country, as its item describes it, began. For many that is the day of independence (India, 1947-08-15; South Sudan, 2011-07-09). For others it is a constitution, a union or a republic: Japan's is 1947-05-03, the day its constitution came into force, the United Kingdom's 1921-12-06 and the United States' 1784-05-12. It is given as Wikidata has it and is not a date of independence.

## Not kept

- **A national day.** Wikidata's national days (instances of Q57598 that name a country) were read on 2026-11-17: 88 countries had one or more, mixed with observances of every kind, with nothing to tell the national day apart. No other open source was found, so there is no such field.
- **Former names.** Not read. `/withdrawn` has the names of the countries whose codes were withdrawn.
- **Wikidata's official languages (P37).** Read on 2026-11-17 and not used: CLDR's record is sounder.

## Several inceptions of the best rank, so none is kept, 12

AD (1278, 1715, 1993); AF (1709, 1747-06-19, 1823, 1926, 1973, 1978, 1992, 1996, 2002, 2004, 2021); BN (1368, 1888-09-17, 1984-01-01); ES (1516-03-24, 1715, 1812-03-19, 1931-12-09, 1978-12-29); LC (1967-03-01, 1979-02-22); MO (1557, 1999-12-20); MV (1965-07-26, 1968-11-11); NO (0900, 1814-05-17, 1905-06-07, 1905-10-26); PT (1128-07-01, 1139-08-01, 1179-05-30); RE (1946-03-21, 1973-03-08); TH (1238, 1768-12-28); VE (1811-07-05, 1845-03-30)

## No inception in Wikidata

AI Anguilla, AQ Antarctica, AX Åland Islands, BV Bouvet Island, EH Western Sahara, GL Greenland, GS South Georgia & South Sandwich Islands, HM Heard & McDonald Islands, IO British Indian Ocean Territory, KY Cayman Islands, NF Norfolk Island, SJ Svalbard & Jan Mayen, TK Tokelau, VG British Virgin Islands

## No official language in CLDR

AQ Antarctica, BV Bouvet Island, HM Heard & McDonald Islands, TF French Southern Territories

## The largest city

`largestCity` is the city with the most people in the city itself: its city proper, the municipality, commune or district that is the city, as its census or statistics office counts it. Not the urban or metropolitan area round it, which joins other towns to it. So Rome is Italy's, not Milan; Jerusalem is Israel's, not Tel Aviv; Quezon City is the Philippines', not Manila; New Taipei City is Taiwan's, not Taipei. Where a country counts a city only as a whole (Greater Sydney, Santiago's communes together, Lagos), that whole is the city.

The figure is the one `/cities` holds: Wikidata's latest best-ranked population (P1082), else Natural Earth's. Where Wikidata's figure is not the city's own (a department's, a kingdom's, an estimate of the urban area), `scripts/largest-city.ts` sets the census figure, below. A city with no figure comes after every city with one. China and India are ranked by their censuses, as `/cities` ranks them (`scripts/urban-facts.ts`), since Wikidata's figure there is a whole municipality or territory: China's urban population at the 2020 census (Shanghai; Chongqing's 32 million is its municipality's, mostly countryside), India's 2011 census (Mumbai; its cities proper also put Mumbai, 12,442,373, ahead of Delhi, 11,034,555).

By the urban area round it, the answer would be another city in 9 countries: Belgium, Brussels (the City of Brussels has 195,546; Antwerp 529,247); Cyprus, Nicosia (Limassol is the largest municipality, 108,105 at the 2021 census, Nicosia 56,848); Ghana, Accra (the Kumasi Metropolitan District had 443,981 at the 2021 census, Accra's 284,124); India, Delhi today; Israel, Tel Aviv; Italy, Milan; the Philippines, Manila; Sudan, Khartoum (at the 2008 census Omdurman had 1,849,659, Khartoum 1,410,858); Taiwan, Taipei.

### Figures set by hand, 14

| City | Wikidata's figure | Used | Day | Why |
| --- | --- | --- | --- | --- |
| Dagbon (Q24697413) | 4,000,000 | none |  | Dagbon, Ghana: a traditional kingdom of the north, and its 4,000,000 its people; not a city. |
| Tarawa (Q2486) | 70,090 | none |  | Tarawa, Kiribati: the atoll, North Tarawa with it; its town is South Tarawa (Q131233), the capital. |
| Banikoara (Q2200458) | 867,463 | 246,575 | 2013-05-11 | Banikoara, Benin: Wikidata's 867,463 is the census figure of the whole Alibori department. |
| Kumasi (Q182059) | 3,903,480 | 443,981 | 2021-06-27 | Kumasi, Ghana: Wikidata's 3,903,480 (2024) is World Population Review's estimate of the urban area. |
| Accra (Q3761) | 1,782,150 | 284,124 | 2021-06-27 | Accra, Ghana: Wikidata's 1,782,150 is the census's urban population of the area round the city. |
| Tamale (Q217040) | 729,768 | 374,744 | 2021-06-27 | Tamale, Ghana: Wikidata's 729,768 (2023) is no census figure. |
| Sekondi-Takoradi (Q243293) | 539,548 | 245,382 | 2021-06-27 | Sekondi-Takoradi, Ghana: Wikidata's 539,548 is the 2010 figure of the district before it was split. |
| Khartoum (Q1963) | 5,345,000 | 1,410,858 | 2008-04-22 | Khartoum, Sudan: Wikidata's 5,345,000 (2018) is Demographia's estimate of the urban area of the three cities, Omdurman and Khartoum North with it. |
| Omdurman (Q180921) | 2,805,396 | 1,849,659 | 2008-04-22 | Omdurman, Sudan: Wikidata's 2,805,396 (2012) has no source; the census figure, of the day Khartoum's is. |
| Lobamba (Q101418) | 114,585 | none |  | Lobamba, Eswatini: Wikidata's 114,585 (2025) is World Population Review's; Wikidata's own earlier figure is 5,800, and the 2017 census does not list it among the towns. |
| Manzini (Q495730) | 110,508 | 30,248 | 2017-05-11 | Manzini, Eswatini: Wikidata's 110,508 (2005) has no source and is more than three times the census's figure. |
| Mbabane (Q3904) | 76,218 | 60,691 | 2017-05-11 | Mbabane, Eswatini: Wikidata's 76,218 (2025) is World Population Review's; the census figure, of the day Manzini's is. |
| Malabo (Q3818) | 297,000 | 257,000 | 2015-07-04 | Malabo, Equatorial Guinea: Wikidata's 297,000 is for 2018 and Bata's 290,000 for 2015; the same source and day give Malabo 257,000. |
| Gros Islet (Q3116994) | 21,660 | none |  | Gros Islet, Saint Lucia: Wikidata's 21,660 is the Gros Islet District's, not the town's; Castries' 20,000 is the city's. |

Sources: INSAE, Benin, fourth General Census of Population and Housing (RGPH-4, 2013), the commune; Ghana Statistical Service, 2021 Population and Housing Census (27 June 2021), the metropolitan district; Central Bureau of Statistics, Sudan, Fifth Population and Housing Census (22 April 2008), the city; Central Statistical Office, Eswatini, 2017 Population and Housing Census (11 May 2017), the town; The 2015 census of Equatorial Guinea, the city as citypopulation.de (Thomas Brinkhoff) calculates it.

### The largest place is not among kuni's cities, 16

These have no `largestCity`, rather than the wrong one:

- AS American Samoa: Tafuna; Tafuna had 7,988 people in 2020, Pago Pago 3,656 in 2010; kuni has only the capital, below 15,000.
- BM Bermuda: St. George's; the Town of St. George is larger than the City of Hamilton; kuni has only the capital, below 15,000.
- CC Cocos (Keeling) Islands: Home Island; most of the islands' 593 people live on Home Island, 147 on West Island; kuni has only the capital.
- EH Western Sahara: Laayoune; kuni's cities, as Wikidata does, give Laayoune the code MA.
- FM Micronesia: Weno; Weno, in Chuuk, is larger than Palikir; kuni has neither it nor the other towns below 15,000.
- GP Guadeloupe: Les Abymes; the largest commune; kuni has Basse-Terre, the capital, alone.
- GU Guam: Dededo; Dededo had 44,908 people in 2020, Hagåtña 943; kuni's cities, as Wikidata does, give Dededo the code US.
- LI Liechtenstein: Schaan; Schaan had 5,998 people on 30 June 2019, Vaduz 5,668; kuni has only the capital, below 15,000.
- MT Malta: St. Paul's Bay; the largest locality at the 2021 census; kuni does not have it.
- NF Norfolk Island: Burnt Pine; the island's main settlement; kuni has only Kingston, the capital, with no figure.
- NR Nauru: Denigomodu; the district with the most people; kuni has only Yaren District, the seat of government.
- PF French Polynesia: Faʼaʼā; the most populous commune, larger than Papeete; kuni does not have it.
- SH St. Helena: Half Tree Hollow; the settlement with the most people, larger than Jamestown; kuni has only the capital.
- SM San Marino: Dogana; Dogana, in Serravalle, had about 7,000 people, the City of San Marino 3,997; kuni has only the capital.
- SX Sint Maarten: Lower Prince's Quarter; the largest district, larger than Philipsburg; kuni has only the capital.
- TC Turks & Caicos Islands: Providenciales; the island town with most of the people, far larger than Cockburn Town; kuni does not have it.

## No city of 15,000 people in kuni

AQ Antarctica, BV Bouvet Island, HM Heard & McDonald Islands, SJ Svalbard & Jan Mayen, TK Tokelau, UM U.S. Outlying Islands
