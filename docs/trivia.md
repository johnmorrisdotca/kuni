# The trivia

Written by `pnpm data`; do not edit by hand. The rules are at the top of `scripts/trivia.ts`.

`@johnmorrisdotca/kuni/trivia` has, for each of the 250 countries: when it began, from Wikidata (CC0), the snapshot `data-sources/wikidata-trivia-2026-11-17.json`, read on 2026-11-17; its official languages, from Unicode CLDR's territoryInfo; and its largest city, the first of kuni's own cities there.

| Fact | Countries that have it |
| --- | --- |
| `inception` | 224 of 250, 145 to the day |
| `officialLanguages` | 246 of 250 |
| `largestCity` | 244 of 250 |

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

## No city of 15,000 people in kuni

AQ Antarctica, BV Bouvet Island, HM Heard & McDonald Islands, SJ Svalbard & Jan Mayen, TK Tokelau, UM U.S. Outlying Islands
