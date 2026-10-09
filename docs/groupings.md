# Groupings: what each one follows

Written by `pnpm data` (scripts/build-data.ts); do not edit by hand. The lists written by hand are in
`scripts/groupings-config.ts`, each with its source.

107 groupings: 7 continents, 30 UN M49 areas, 23 international bodies, 16 informal groupings and 31 groupings of subdivisions inside a country. As of 2026-10-09.

## The continents

The seven-continent model of the `continent` field: the Americas as North and South America, with Central America and the Caribbean in North America; Antarctica as a continent, with the sub-Antarctic islands (Bouvet Island, South Georgia, Heard and McDonald, the French Southern Lands); Russia in Europe; Turkey, Cyprus and the Caucasus in Asia; Egypt in Africa.

## UN M49

The areas and their members are Unicode CLDR 48.2.0's copy of UN M49 (territoryContainment). CLDR places
Taiwan in Eastern Asia and Kosovo in Southern Europe, which UN M49 does not list; Antarctica is in no M49 area. The
intermediate areas Latin America and the Caribbean (419) and Sub-Saharan Africa (202) are given with their parents.

## International bodies

Each body's members are its own published list on the day above, written by hand; Wikidata's "member of" (P463)
gives the dates. The table is the cross-check: the members Wikidata does not list as current members, and the
countries Wikidata lists that the body does not (stale or wrong statements there; the body's list is kept).

| Body | Members | Not current in Wikidata | In Wikidata, not the body's list | With a start date |
| --- | --- | --- | --- | --- |
| EU | 27 | NL | – | 26 |
| Eurozone | 21 | AT BE BG CY EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK | – | 0 |
| Schengen Area | 29 | NL | – | 28 |
| EEA | 30 | AT BG CY CZ DK ES FI FR HR IE IT LT LV MT NL PL RO SE SI | – | 1 |
| NATO | 32 | DK NL | – | 30 |
| G7 | 7 | – | – | 6 |
| G20 | 19 | – | – | 6 |
| OECD | 38 | DK NL | – | 15 |
| ASEAN | 11 | – | AU | 11 |
| AU | 55 | EH | – | 10 |
| Arab League | 22 | – | – | 21 |
| GCC | 6 | AE KW QA | – | 2 |
| Commonwealth | 56 | GB | – | 55 |
| OPEC | 12 | – | AO | 12 |
| BRICS | 10 | – | – | 5 |
| Mercosur | 5 | – | MX | 0 |
| USMCA | 3 | CA US | – | 1 |
| APEC | 21 | – | – | 21 |
| CARICOM | 15 | – | – | 15 |
| PIF | 18 | CK FJ FM KI MH NC NR NU NZ PF PG PW SB TO TV VU WS | – | 0 |
| Nordic Council | 8 | – | – | 2 |
| Benelux | 3 | – | – | 0 |

Left out on purpose:

- **francophonie**: Organisation internationale de la Francophonie: its members come in three tiers (members, associates, observers), Burkina Faso, Mali and Niger announced their withdrawal in 2025, and the list could not be checked against the organisation's own on the day this was written. Left for a later version rather than shipped with a doubt.

## Informal groupings

- **Middle East** (middle-east): Western Asia as most English sources use it today, with Egypt and Iran, and without the Caucasus. No definition is agreed: some add Libya, Sudan or Afghanistan; some leave out Cyprus or Turkey. UN M49's Western Asia (145) includes Armenia, Azerbaijan and Georgia and leaves out Egypt and Iran.
- **Latin America and the Caribbean** (latin-america): UN M49's Latin America and the Caribbean (419): Central America, the Caribbean and South America. Latin America in its narrower sense, the countries speaking Spanish, Portuguese or French, leaves out the English- and Dutch-speaking Caribbean.
- **Caribbean** (caribbean): UN M49's Caribbean (029). Some definitions add the Caribbean coasts of Central and South America (Belize, Guyana, Suriname), which M49 puts in Central and South America.
- **Balkans** (balkans): The countries usually counted as the Balkans. Greece and the European part of Turkey are on the peninsula and are sometimes counted; Slovenia and Romania are sometimes not. See also the Western Balkans.
- **Western Balkans** (western-balkans): The European Union's usage: the Balkan countries that are not EU members.
- **Scandinavia** (scandinavia): Scandinavia in its strict sense: Denmark, Norway and Sweden. Often used loosely for the Nordic countries, adding Finland and Iceland, which is a different grouping (see the Nordic countries).
- **Nordic countries** (nordic-countries): The five Nordic states and the three autonomous territories, as Nordic Co-operation counts them.
- **Baltic states** (baltics): Estonia, Latvia and Lithuania.
- **Central Asia** (central-asia): UN M49's Central Asia (143): the five former Soviet republics. Wider definitions add Afghanistan, Mongolia or parts of China.
- **Southeast Asia** (southeast-asia): UN M49's South-eastern Asia (035), the same countries as ASEAN.
- **Maghreb** (maghreb): The members of the Arab Maghreb Union. The Maghreb in its narrow sense is Algeria, Morocco and Tunisia; Western Sahara is sometimes counted.
- **Horn of Africa** (horn-of-africa): The peninsula's four countries. Wider uses add Kenya, Sudan, South Sudan and Uganda (the members of IGAD).
- **Sahel** (sahel): The five countries of the former G5 Sahel. The Sahel is a belt of land, not a set of countries: wider uses add Senegal, The Gambia, Nigeria, Cameroon, Sudan and Eritrea, which it also crosses.
- **British Isles** (british-isles): The islands of Great Britain and Ireland and the islands near them: the United Kingdom, Ireland, the Isle of Man and the Channel Islands. The name is disliked in Ireland, and the Irish government does not use it.
- **Iberian Peninsula** (iberia): The countries on the peninsula: Spain, Portugal, Andorra and Gibraltar.
- **Asia-Pacific** (asia-pacific): UN M49's Asia (142) and Oceania (009) together. Uses differ widely: APEC adds the Pacific coast of the Americas, and the UN's ESCAP adds Russia and leaves out western Asia.

## Inside a country

- **Hokkaido region** (jp-hokkaido, sets jp-regions-8, jp-regions-9): The prefecture of Hokkaido.
- **Tohoku region** (jp-tohoku, sets jp-regions-8, jp-regions-9): Aomori, Iwate, Miyagi, Akita, Yamagata and Fukushima.
- **Kanto region** (jp-kanto, sets jp-regions-8, jp-regions-9): Ibaraki, Tochigi, Gunma, Saitama, Chiba, Tokyo and Kanagawa.
- **Chubu region** (jp-chubu, sets jp-regions-8, jp-regions-9): Niigata, Toyama, Ishikawa, Fukui, Yamanashi, Nagano, Gifu, Shizuoka and Aichi.
- **Kinki region** (jp-kinki, sets jp-regions-8, jp-regions-9): Mie, Shiga, Kyoto, Osaka, Hyogo, Nara and Wakayama; also called Kansai.
- **Chugoku region** (jp-chugoku, sets jp-regions-8, jp-regions-9): Tottori, Shimane, Okayama, Hiroshima and Yamaguchi.
- **Shikoku region** (jp-shikoku, sets jp-regions-8, jp-regions-9): Tokushima, Kagawa, Ehime and Kochi.
- **Kyushu region** (jp-kyushu, sets jp-regions-8): Fukuoka, Saga, Nagasaki, Kumamoto, Oita, Miyazaki, Kagoshima and Okinawa, as the eight-region division counts it.
- **Kyushu region (without Okinawa)** (jp-kyushu-without-okinawa, sets jp-regions-9): Kyushu's seven prefectures, where Okinawa is counted as a region of its own.
- **Okinawa region** (jp-okinawa, sets jp-regions-9): Okinawa, where it is counted apart from Kyushu (as in weather forecasts).
- **Northeast** (us-northeast, sets us-census-regions): Census Region 1.
- **Midwest** (us-midwest, sets us-census-regions): Census Region 2.
- **South** (us-south, sets us-census-regions): Census Region 3.
- **West** (us-west, sets us-census-regions): Census Region 4.
- **New England** (us-new-england, sets us-census-divisions): Census Division 1, in the Northeast.
- **Middle Atlantic** (us-middle-atlantic, sets us-census-divisions): Census Division 2, in the Northeast.
- **East North Central** (us-east-north-central, sets us-census-divisions): Census Division 3, in the Midwest.
- **West North Central** (us-west-north-central, sets us-census-divisions): Census Division 4, in the Midwest.
- **South Atlantic** (us-south-atlantic, sets us-census-divisions): Census Division 5, in the South.
- **East South Central** (us-east-south-central, sets us-census-divisions): Census Division 6, in the South.
- **West South Central** (us-west-south-central, sets us-census-divisions): Census Division 7, in the South.
- **Mountain** (us-mountain, sets us-census-divisions): Census Division 8, in the West.
- **Pacific** (us-pacific, sets us-census-divisions): Census Division 9, in the West.
- **Atlantic Canada** (ca-atlantic, sets ca-regions): The four Atlantic provinces.
- **Central Canada** (ca-central, sets ca-regions): Ontario and Quebec.
- **Prairie Provinces** (ca-prairies, sets ca-regions): Alberta, Saskatchewan and Manitoba.
- **West Coast** (ca-west-coast, sets ca-regions): British Columbia.
- **Northern Canada** (ca-north, sets ca-regions): The three territories.
- **The four nations of the United Kingdom** (gb-nations, sets gb-nations): England, Northern Ireland, Scotland and Wales, the first level of ISO 3166-2:GB.
- **States of Australia** (au-states, sets au-states-territories): The six states.
- **Mainland territories of Australia** (au-territories, sets au-states-territories): The Australian Capital Territory and the Northern Territory; the external territories (Christmas Island, the Cocos Islands, Norfolk Island and others) have codes of their own as countries.
