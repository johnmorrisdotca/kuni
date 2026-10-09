# The facts: what was decided

Written by `pnpm data` (scripts/build-data.ts); do not edit by hand. The rules are at the top of
`scripts/facts-config.ts`, and every exception below is listed there with its reason.

## Coverage

- Capitals: 245 of 250, every one named in Japanese (13 found by hand, 1 Japanese name written by hand)
- Capitals' coordinates: 245 of 250
- Population: 249 of 250, 247 with the year it is for
- Area: 250 of 250 (4 for the whole, 244 with no part named, 2 for the land only: UM, VI), 16 with a year
- Coordinates: 250 of 250
- Land borders: 327 pairs; 166 countries have one or more, 84 have none
- Driving side: 247 of 250 (76 left, 171 right)
- First day of the week, measurement system, paper size and clock: all 250, from CLDR (every region has one, by CLDR's own rule of falling back to the area that holds it)

## Gaps

### population, 1

- **AQ**: No permanent population; Wikidata's figure of 5,000 is the summer's research stations.

### capital, 5

- **AQ**: Antarctica has no capital.
- **BV**: Bouvet Island is uninhabited.
- **HM**: Heard Island and McDonald Islands are uninhabited.
- **MO**: Macao is a city; countries-list names no capital.
- **UM**: The United States Minor Outlying Islands have no capital.

### capitalPoint, 5

- **AQ**: Antarctica has no capital.
- **BV**: Bouvet Island is uninhabited.
- **HM**: Heard Island and McDonald Islands are uninhabited.
- **MO**: Macao is a city; countries-list names no capital.
- **UM**: The United States Minor Outlying Islands have no capital.

### drivingSide, 3

- **AQ**: Antarctica has no public roads; Wikidata gives no driving side.
- **BV**: Bouvet Island is uninhabited and has no roads.
- **HM**: Heard Island and McDonald Islands are uninhabited and have no roads.

### No land border, 84

AG (an island or islands, with no land border), AI (an island or islands, with no land border), AS (an island or islands, with no land border), AU (an island or islands, with no land border), AW (an island or islands, with no land border), AX (an island or islands, with no land border), BB (an island or islands, with no land border), BH (an island or islands, with no land border), BL (an island or islands, with no land border), BM (an island or islands, with no land border), BQ (an island or islands, with no land border), BS (an island or islands, with no land border), BV (an island or islands, with no land border), CC (an island or islands, with no land border), CK (an island or islands, with no land border), CU (an island or islands, with no land border), CV (an island or islands, with no land border), CW (an island or islands, with no land border), CX (an island or islands, with no land border), DM (an island or islands, with no land border), FJ (an island or islands, with no land border), FK (an island or islands, with no land border), FM (an island or islands, with no land border), FO (an island or islands, with no land border), GD (an island or islands, with no land border), GG (an island or islands, with no land border), GP (an island or islands, with no land border), GS (an island or islands, with no land border), GU (an island or islands, with no land border), HM (an island or islands, with no land border), IM (an island or islands, with no land border), IO (an island or islands, with no land border), IS (an island or islands, with no land border), JE (an island or islands, with no land border), JM (an island or islands, with no land border), JP (an island or islands, with no land border), KI (an island or islands, with no land border), KM (an island or islands, with no land border), KN (an island or islands, with no land border), KY (an island or islands, with no land border), LC (an island or islands, with no land border), LK (an island or islands, with no land border), MG (an island or islands, with no land border), MH (an island or islands, with no land border), MP (an island or islands, with no land border), MQ (an island or islands, with no land border), MS (an island or islands, with no land border), MT (an island or islands, with no land border), MU (an island or islands, with no land border), MV (an island or islands, with no land border), NC (an island or islands, with no land border), NF (an island or islands, with no land border), NR (an island or islands, with no land border), NU (an island or islands, with no land border), NZ (an island or islands, with no land border), PF (an island or islands, with no land border), PH (an island or islands, with no land border), PM (an island or islands, with no land border), PN (an island or islands, with no land border), PR (an island or islands, with no land border), PW (an island or islands, with no land border), RE (an island or islands, with no land border), SB (an island or islands, with no land border), SC (an island or islands, with no land border), SG (an island or islands, with no land border), SH (an island or islands, with no land border), SJ (an island or islands, with no land border), ST (an island or islands, with no land border), TC (an island or islands, with no land border), TF (an island or islands, with no land border), TK (an island or islands, with no land border), TO (an island or islands, with no land border), TT (an island or islands, with no land border), TV (an island or islands, with no land border), TW (an island or islands, with no land border), UM (an island or islands, with no land border), VC (an island or islands, with no land border), VG (an island or islands, with no land border), VI (an island or islands, with no land border), VU (an island or islands, with no land border), WF (an island or islands, with no land border), WS (an island or islands, with no land border), YT (an island or islands, with no land border), AQ (Antarctica, a continent of no country)

## Land borders

Wikidata's "shares border with" (P47) does not say whether a border is on land or at sea, so a border is kept
only when the outlines of Natural Earth 5.1.2 at 1:50m (as chizu 1.0.2 draws them) touch too, and the borders
below are added by hand.

### Added by hand

- **BR–GF**: French Guiana borders Brazil; Natural Earth draws French Guiana as part of France.
- **GF–SR**: French Guiana borders Suriname; Natural Earth draws French Guiana as part of France.
- **ES–GI**: Gibraltar borders Spain across the isthmus; Natural Earth does not draw Gibraltar on its own at 1:50m.
- **ES–MA**: Ceuta and Melilla, Spanish cities in Africa, border Morocco; too small for Natural Earth's 1:50m.
- **CN–HK**: Hong Kong borders mainland China at Shenzhen; Wikidata states it on neither side.
- **CN–MO**: Macao borders mainland China at Zhuhai; Wikidata states it on neither side.
- **CA–GL**: Hans Island, divided between Canada and Greenland by the treaty of 2022; Wikidata states it.
- **CY–GB**: The British Sovereign Base Areas of Akrotiri and Dhekelia border the Republic of Cyprus; Wikidata states it.

### Stated by Wikidata, not kept, 135

Most are borders at sea; a few are claims (Afghanistan and India through Kashmir). A pair that is a land border
belongs in `BORDERS_ADDED`.

AE–IR, AF–IN, AG–GB, AL–RS, AO–GA, AR–GB, AU–ID, AU–NC, AU–NZ, AU–PG, AU–SB, AU–TL, AU–VU, BE–GB, BH–IR, BH–SA, BS–GB, BS–TC, BS–US, CA–PM, CD–CM, CD–SD, CN–JP, CN–KR, CN–PH, CN–TW, CO–NI, CU–GB, CU–US, CY–IL, CY–TR, DE–GB, DE–SE, DJ–SO, DK–GB, DK–NO, DK–SE, DM–VE, DO–TC, DO–US, DO–VE, DZ–ES, DZ–IT, EE–SE, EG–SA, ES–GB, ES–MR, FJ–SB, FM–GU, FM–MH, FM–PG, FM–PW, FM–US, FO–IS, FR–GB, FR–KI, FR–KM, FR–MG, FR–MU, FR–NL, FR–SB, FR–SC, FR–SX, FR–VE, GA–ST, GB–JM, GB–KN, GB–MV, GB–NO, GB–VE, GD–VE, GL–IS, GL–NO, GQ–ST, GU–MP, HT–TC, HT–US, ID–IN, ID–PH, ID–PW, ID–SG, ID–TH, ID–VN, IN–LK, IR–KW, IR–OM, IR–QA, IR–SA, IT–MT, JP–KR, JP–PH, JP–RU, JP–TW, JP–US, KE–SD, KI–MH, KI–US, KM–MG, KM–MZ, KM–SC, KM–TZ, KM–YT, KN–VE, LC–VE, LT–SE, LV–SE, MG–MZ, MG–SC, MG–YT, MH–NR, MH–US, MU–MV, MU–SC, MY–PH, MY–SG, NG–ST, NL–VE, PA–US, PG–SB, PH–PW, PH–TW, PL–SE, PR–VI, RU–SE, RU–US, SB–VU, SC–TZ, SD–UG, TO–US, TR–UA, TT–VE, US–VE, US–WS, VC–VE, VG–VI

### Touching in Natural Earth, not stated by Wikidata, not kept, 1

NA–ZW

## Choices

- **AQ**, Wikidata item Q51: Antarctica the continent, not the Antarctic Treaty area (Q10372207).
- **CY**, Wikidata item Q229: The Republic of Cyprus, not the island (Q644636).
- **AG** capital, Q36262: Saint John's: Wikidata has no English label on the item.
- **BQ** capital, Q331584: Kralendijk: Wikidata's item for the Caribbean Netherlands names no capital.
- **EH** capital, Q47837: El Aaiún (Laayoune): Wikidata's item for Western Sahara names no capital.
- **GG** capital, Q174262: St. Peter Port: Wikidata spells it Saint Peter Port.
- **GQ** capital, Q1140136 (Ciudad de la Paz): Equatorial Guinea moved its capital from Malabo to Ciudad de la Paz in January 2026 (Wikidata, P36 from 2026-01-03); countries-list 3.4.1 still has Malabo.
- **HK** capital, Q963152: City of Victoria: Wikidata's item for Hong Kong names no capital.
- **MN** capital, Q23430: Ulan Bator: Wikidata spells it Ulaanbaatar.
- **MP** capital, Q9332790: Saipan: Wikidata's capital item (Q49755159) has no Japanese label; its municipality has.
- **NR** capital, Q31026: Yaren: Nauru has no official capital; Wikidata names Yaren District, the seat of government.
- **SJ** capital, Q25923: Longyearbyen: Wikidata's item for Svalbard and Jan Mayen names no capital.
- **SM** capital, Q1848: City of San Marino: Wikidata labels it San Marino.
- **TK** capital, Q650847: Fakaofo: Tokelau has no capital; its seat rotates. Wikidata's item for the atoll.
- **TO** capital, Q38834: Nuku'alofa: Wikidata writes the ʻokina, which does not fold to an apostrophe.
- **GQ** capital in Japanese, シウダ・デ・ラ・パス: Wikidata's label ラパス is the name of Bolivia's La Paz; シウダ・デ・ラ・パス is the title of the Japanese Wikipedia article.
- **HK** area, 2,755.03 km²: Land and sea within its boundary together, the figure Hong Kong's government gives as its total; Wikidata labels it the land and also has the land alone, 1,105.69.
- **MX** area, 1,964,375 km²: INEGI's figure, the one Mexico publishes; Wikidata also has 1,972,550.
- **SD** area, 1,886,068 km²: Sudan since South Sudan's independence in 2011, the figure most sources give; Wikidata also has 1,840,687.
- A population for the part Q33112019 stands for the whole: suburb and locality: an Australian census area that is the whole of Christmas Island and of Norfolk Island
