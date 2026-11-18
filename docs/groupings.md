# Groupings: what each one follows

Written by `pnpm data` (scripts/build-data.ts); do not edit by hand. The lists written by hand are in
`scripts/groupings-config.ts`, each with its source.

107 groupings: 7 continents, 30 UN M49 areas, 23 international bodies, 16 informal groupings and 31 groupings of subdivisions inside a country. As of 2026-10-09.

## The continents

Seven continents read from UN M49: Africa (002), Asia (142), Europe (150) and Oceania (009) as M49 has them, and the Americas (019) as South America (005) and North America (the rest: Northern America, Central America and the Caribbean). Antarctica, in no M49 region, is the seventh. So Russia is in Europe, Cyprus and Turkey in Asia, Timor-Leste in Asia, and the sub-Antarctic islands where M49 puts them (Bouvet Island and South Georgia in South America, Heard and McDonald in Oceania, the French Southern Lands in Africa).

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
| EU | 27 | NL | – | 27 |
| Eurozone | 21 | AT BE BG CY EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK | – | 21 |
| Schengen Area | 29 | NL | – | 29 |
| EEA | 30 | AT BG CY CZ DK ES FI FR HR IE IT LT LV MT NL PL RO SE SI | – | 1 |
| NATO | 32 | DK NL | – | 32 |
| G7 | 7 | – | – | 0 |
| G20 | 19 | – | – | 6 |
| OECD | 38 | DK NL | – | 15 |
| ASEAN | 11 | – | AU | 11 |
| AU | 55 | EH | – | 52 |
| Arab League | 22 | – | – | 21 |
| GCC | 6 | AE KW QA | – | 2 |
| Commonwealth | 56 | GB | – | 55 |
| OPEC | 12 | – | AO | 12 |
| BRICS | 10 | – | – | 9 |
| Mercosur | 5 | – | MX | 0 |
| USMCA | 3 | CA US | – | 3 |
| APEC | 21 | – | – | 21 |
| CARICOM | 15 | – | – | 15 |
| PIF | 18 | CK FJ FM KI MH NC NR NU NZ PF PG PW SB TO TV VU WS | – | 0 |
| Nordic Council | 8 | – | – | 2 |
| Benelux | 3 | – | – | 0 |

### Days read from the body's own page

Where Wikidata gives a member no day, or a day that is a placeholder, the body's own page is read (on 2026-11-18, each page by itself); the day and the line it rests on are in `scripts/groupings-config.ts` (`JOINED`).

- **EU** NL: 1958-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/netherlands_en: "EU Member State: since 1 January 1958"
- **Eurozone** AT: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/austria_en: "Euro area: member since 1 January 1999"
- **Eurozone** BE: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/belgium_en: "Euro area: member since 1 January 1999"
- **Eurozone** DE: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/germany_en: "Euro area: member since 1 January 1999"
- **Eurozone** ES: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/spain_en: "Euro area: member since 1 January 1999"
- **Eurozone** FI: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/finland_en: "Euro area: member since 1 January 1999"
- **Eurozone** FR: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/france_en: "Euro area: member since 1 January 1999"
- **Eurozone** IE: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/ireland_en: "Euro area: member since 1 January 1999"
- **Eurozone** IT: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/italy_en: "Euro area: member since 1 January 1999"
- **Eurozone** LU: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/luxembourg_en: "Euro area: member since 1 January 1999"
- **Eurozone** NL: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/netherlands_en: "Euro area: member since 1 January 1999"
- **Eurozone** PT: 1999-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/portugal_en: "Euro area: member since 1 January 1999"
- **Eurozone** GR: 2001-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/greece_en: "Euro area: member since 1 January 2001"
- **Eurozone** SI: 2007-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/slovenia_en: "Euro area: member since 1 January 2007"
- **Eurozone** CY: 2008-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/cyprus_en: "Euro area: member since 1 January 2008"
- **Eurozone** MT: 2008-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/malta_en: "Euro area: member since 1 January 2008"
- **Eurozone** SK: 2009-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/slovakia_en: "Euro area: member since 1 January 2009"
- **Eurozone** EE: 2011-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/estonia_en: "Euro area: member since 1 January 2011"
- **Eurozone** LV: 2014-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/latvia_en: "Euro area: member since 1 January 2014"
- **Eurozone** LT: 2015-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/lithuania_en: "Euro area: member since 1 January 2015"
- **Eurozone** HR: 2023-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/croatia_en: "Euro area: member since 1 January 2023"
- **Eurozone** BG: 2026-01-01: https://european-union.europa.eu/principles-countries-history/eu-countries/bulgaria_en: "Euro area: member since 1 January 2026"
- **Schengen Area** NL: 1995-03-26: https://european-union.europa.eu/principles-countries-history/eu-countries/netherlands_en: "Schengen: member since 26 March 1995"
- **NATO** DK: 1949-04-04: https://www.nato.int/cps/en/natohq/topics_52044.htm: "NATO was created by 12 countries from Europe and North America on 4 April 1949. NATO's founding member countries were: Belgium, Canada, Denmark, France, Iceland, Italy, Luxembourg, the Netherlands, Norway, Portugal, the United Kingdom and the United States."
- **NATO** NL: 1949-04-04: https://www.nato.int/cps/en/natohq/topics_52044.htm: "NATO was created by 12 countries from Europe and North America on 4 April 1949. NATO's founding member countries were: Belgium, Canada, Denmark, France, Iceland, Italy, Luxembourg, the Netherlands, Norway, Portugal, the United Kingdom and the United States."
- **G7** CA: no day (the page gives a year only): https://www.g7germany.de/g7-en/g7-summit/g7-history: "The first World Economic Summit was hosted by French President Giscard d'Estaing and Federal Chancellor Schmidt in 1975. Canada was invited to join in 1976."
- **G7** DE: no day (the page gives a year only): https://www.g7germany.de/g7-en/g7-summit/g7-history: "The first World Economic Summit was hosted by French President Giscard d'Estaing and Federal Chancellor Schmidt in 1975. Canada was invited to join in 1976."
- **G7** FR: no day (the page gives a year only): https://www.g7germany.de/g7-en/g7-summit/g7-history: "The first World Economic Summit was hosted by French President Giscard d'Estaing and Federal Chancellor Schmidt in 1975. Canada was invited to join in 1976."
- **G7** GB: no day (the page gives a year only): https://www.g7germany.de/g7-en/g7-summit/g7-history: "The first World Economic Summit was hosted by French President Giscard d'Estaing and Federal Chancellor Schmidt in 1975. Canada was invited to join in 1976."
- **G7** IT: no day (the page gives a year only): https://www.g7germany.de/g7-en/g7-summit/g7-history: "The first World Economic Summit was hosted by French President Giscard d'Estaing and Federal Chancellor Schmidt in 1975. Canada was invited to join in 1976."
- **G7** JP: no day (the page gives a year only): https://www.g7germany.de/g7-en/g7-summit/g7-history: "The first World Economic Summit was hosted by French President Giscard d'Estaing and Federal Chancellor Schmidt in 1975. Canada was invited to join in 1976."
- **AU** BF: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Burkina Faso: 25 May 1963"
- **AU** BJ: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Benin: 25 May 1963"
- **AU** CD: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Democratic Republic of Congo: 25 May 1963"
- **AU** CF: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Central African Republic: 25 May 1963"
- **AU** CG: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of the Congo: 25 May 1963"
- **AU** CI: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Côte d'Ivoire: 25 May 1963"
- **AU** CM: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Cameroon: 25 May 1963"
- **AU** CV: 1975-07-18: https://au.int/en/member_states/countryprofiles2: "Republic of Cabo Verde: 18 July 1975"
- **AU** DJ: 1977-06-27: https://au.int/en/member_states/countryprofiles2: "Republic of Djibouti: 27 June 1977"
- **AU** EH: 1982-02-22: https://au.int/en/member_states/countryprofiles2: "Sahrawi Arab Democratic Republic: 22 February 1982"
- **AU** ER: 1993-05-24: https://au.int/en/member_states/countryprofiles2: "State of Eritrea: 24 May 1993"
- **AU** ET: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Federal Democratic Republic of Ethiopia: 25 May 1963"
- **AU** GA: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Gabonese Republic: 25 May 1963"
- **AU** GH: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Ghana: 25 May 1963"
- **AU** GM: 1965-03-09: https://au.int/en/member_states/countryprofiles2: "Republic of the Gambia: 9 March 1965"
- **AU** GN: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Guinea: 25 May 1963"
- **AU** GQ: 1968-10-12: https://au.int/en/member_states/countryprofiles2: "Republic of Equatorial Guinea: 12 October 1968"
- **AU** GW: 1973-11-19: https://au.int/en/member_states/countryprofiles2: "Republic of Guinea-Bissau: 19 November 1973"
- **AU** KM: 1975-07-18: https://au.int/en/member_states/countryprofiles2: "Union of the Comoros: 18 July 1975"
- **AU** LR: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Liberia: 25 May 1963"
- **AU** LS: 1966-10-31: https://au.int/en/member_states/countryprofiles2: "Kingdom of Lesotho: 31 October 1966"
- **AU** LY: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Libya: 25 May 1963"
- **AU** MG: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Madagascar: 25 May 1963"
- **AU** ML: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Mali: 25 May 1963"
- **AU** MW: 1964-07-13: https://au.int/en/member_states/countryprofiles2: "Republic of Malawi: 13 July 1964"
- **AU** MZ: 1975-07-18: https://au.int/en/member_states/countryprofiles2: "Republic of Mozambique: 18 July 1975"
- **AU** NE: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Niger: 25 May 1963"
- **AU** NG: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Federal Republic of Nigeria: 25 May 1963"
- **AU** RW: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Rwanda: 25 May 1963"
- **AU** SC: 1976-06-29: https://au.int/en/member_states/countryprofiles2: "Republic of Seychelles: 29 June 1976"
- **AU** SD: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of the Sudan: 25 May 1963"
- **AU** SL: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Sierra Leone: 25 May 1963"
- **AU** SN: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Senegal: 25 May 1963"
- **AU** SO: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Federal Republic of Somalia: 25 May 1963"
- **AU** SS: 2011-07-27: https://au.int/en/member_states/countryprofiles2: "Republic of South Sudan: 27 July 2011"
- **AU** ST: 1975-07-18: https://au.int/en/member_states/countryprofiles2: "Democratic Republic of São Tomé and Príncipe: 18 July 1975"
- **AU** SZ: 1968-09-24: https://au.int/en/member_states/countryprofiles2: "Kingdom of Eswatini: 24 September 1968"
- **AU** TD: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Chad: 25 May 1963"
- **AU** TG: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Togolese Republic: 25 May 1963"
- **AU** TN: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Tunisia: 25 May 1963"
- **AU** UG: 1963-05-25: https://au.int/en/member_states/countryprofiles2: "Republic of Uganda: 25 May 1963"
- **AU** ZM: 1964-12-16: https://au.int/en/member_states/countryprofiles2: "Republic of Zambia: 16 December 1964"
- **AU** ZW: 1980-06-18: https://au.int/en/member_states/countryprofiles2: "Republic of Zimbabwe: 18 June 1980"
- **BRICS** AE: 2024-01-01: https://thepresidency.gov.za/media-briefing-remarks-brics-chair-president-cyril-ramaphosa-announcing-outcomes-xv-brics-summit: "We have decided to invite the Argentine Republic, the Arab Republic of Egypt, the Federal Democratic Republic of Ethiopia, the Islamic Republic of Iran, the Kingdom of Saudi Arabia and the United Arab Emirates to become full members of BRICS. The membership will take effect from 1 January 2024."
- **BRICS** EG: 2024-01-01: https://thepresidency.gov.za/media-briefing-remarks-brics-chair-president-cyril-ramaphosa-announcing-outcomes-xv-brics-summit: "We have decided to invite the Argentine Republic, the Arab Republic of Egypt, the Federal Democratic Republic of Ethiopia, the Islamic Republic of Iran, the Kingdom of Saudi Arabia and the United Arab Emirates to become full members of BRICS. The membership will take effect from 1 January 2024."
- **BRICS** ET: 2024-01-01: https://thepresidency.gov.za/media-briefing-remarks-brics-chair-president-cyril-ramaphosa-announcing-outcomes-xv-brics-summit: "We have decided to invite the Argentine Republic, the Arab Republic of Egypt, the Federal Democratic Republic of Ethiopia, the Islamic Republic of Iran, the Kingdom of Saudi Arabia and the United Arab Emirates to become full members of BRICS. The membership will take effect from 1 January 2024."
- **BRICS** IR: 2024-01-01: https://thepresidency.gov.za/media-briefing-remarks-brics-chair-president-cyril-ramaphosa-announcing-outcomes-xv-brics-summit: "We have decided to invite the Argentine Republic, the Arab Republic of Egypt, the Federal Democratic Republic of Ethiopia, the Islamic Republic of Iran, the Kingdom of Saudi Arabia and the United Arab Emirates to become full members of BRICS. The membership will take effect from 1 January 2024."
- **USMCA** CA: 2020-07-01: https://www.ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement: "The United States-Mexico-Canada Agreement (USMCA) entered into force on July 1, 2020."
- **USMCA** US: 2020-07-01: https://www.ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement: "The United States-Mexico-Canada Agreement (USMCA) entered into force on July 1, 2020."

### Members with no day

No source gives these a day, so a call for a day (`membersOf(id, { on })`) does not count them; `unknownMembersOf` lists them.

- **UN** (1): DK
- **EU** (0): none
- **Eurozone** (0): none
- **Schengen Area** (0): none
- **EEA** (29): AT BE BG CY CZ DE DK EE ES FI FR GR HR HU IE IT LI LT LU LV MT NL NO PL PT RO SE SI SK
- **NATO** (0): none
- **G7** (7): CA DE FR GB IT JP US
- **G20** (13): AR AU BR CA CN ID IN IT JP KR MX US ZA
- **OECD** (23): AT AU BE CA CH CL CZ DK EE ES IE IS JP LU MX NL NO NZ SE SI SK TR US
- **ASEAN** (0): none
- **AU** (3): MA MU NA
- **Arab League** (1): PS
- **GCC** (4): AE BH KW QA
- **Commonwealth** (1): GB
- **OPEC** (0): none
- **BRICS** (1): ID
- **Mercosur** (5): AR BO BR PY UY
- **USMCA** (0): none
- **APEC** (0): none
- **CARICOM** (0): none
- **PIF** (18): AU CK FJ FM KI MH NC NR NU NZ PF PG PW SB TO TV VU WS
- **Nordic Council** (6): AX DK FO GL IS NO
- **Benelux** (3): BE LU NL

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
- **Kinki region** (jp-kinki, sets jp-regions-8, jp-regions-9): Mie, Shiga, Kyoto, Osaka, Hyogo, Nara and Wakayama. Kinki (近畿) is the name official divisions use; Kansai (関西) is the everyday name, and its limits are looser: Mie is often left out.
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
