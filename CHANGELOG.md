# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- **The builder's code is in the family's embed panel** (kazoku-ui 0.38, family template 2026-11-11). The nine tabs, Copy, "Copy a link to this card" and "Start again" are all kept, and the panel adds a link that opens the embed page with the choices, the card guide in the page's language, and the credit for the names (Unicode CLDR) and the facts (Wikidata). The tab chosen stays in the address.

## [1.7.1] - 2026-11-11

### Added

- **A lighter download for a city picker.** `searchPlaces(text, { match: "start" })` finds a name from its start or the start of a word, and fetches only the part of the capitals and of the 100k tier that holds such names: each tier is also written in 53 parts, `/cities/capitals-<key>` and `/cities/100k-<key>` (a to z, a digit, a kana row, sixteen groups for other scripts). A first search fetches about 50 kB gzipped at the median and 120 kB at most, against 472 kB for the whole capitals, 1m and 100k tiers. `cityNamesOf(code)` in /places, and `/cities/names-<code>`, give a country's light list first: ids, names and `major` (the capital and the first twenty), about half the full file (United States 52 kB, not 115 kB; China 87 kB, not 147 kB). The default search, and every other call, answers as before.

### Changed

- **Smaller city files, the same data.** Each tier and country file is written in columns (one array or string for each field, integer coordinates, shared tables of subdivisions and languages) rather than an array for each city. Gzipped as built, before and after: the capitals 207 kB to 173 kB, the 1m tier 35 kB to 32 kB, the 100k tier 230 kB to 194 kB, the United States 138 kB to 115 kB, China 188 kB to 147 kB, Japan 39 kB to 32 kB. Every city is as before.

### Fixed

- **The Netherlands' cities.** Wikidata gives most Dutch municipalities no country, and some of them (Nijmegen, Amersfoort, Haarlemmermeer) no class that is a kind of settlement, so the list held 14 cities. A city now takes its country from its ISO 3166-2 code where Wikidata names none, and a supplement of the municipalities of the Netherlands (`scripts/fetch-cities-extra.ts`) adds the rest: Tilburg, Almere, Breda, Nijmegen, Amersfoort and every other of 100,000 or more are listed once, the districts of The Hague, Rotterdam and Groningen inside their city. Dissolved municipalities, those with no figure since 2015, and the merged ones named for a region rather than a town (Haarlemmermeer, Westland, Súdwest-Fryslân) are left out; Kralendijk and The Bottom are in the Caribbean Netherlands (BQ), not the Netherlands, as the most specific code says.
- **Somalia's cities by their codes.** Hargeisa, Erigavo and Maydh had no country in Wikidata; they now join Somalia by their ISO 3166-2 codes, which makes Hargeisa Somalia's second city. A place given a country only by its code, whose figures are all dated over 30 years ago (a district of Szczecin counted in 1961), is left out.
- **Rothera** is no longer a city of the Caribbean Netherlands. Wikidata gives the Antarctic research station the British Antarctic Territory's code BQ of 1974 to 1979, the code the Caribbean Netherlands has now; its id `Q1635867` is in `city-id-aliases.json` as removed.
- **Sunshine Coast** is a city of Australia again, under that name: Wikidata's only item for it is the council area (Sunshine Coast Region), as the City of Gold Coast is Gold Coast's.

## [1.7.0] - 2026-11-11

### Changed

- **Cities rank by urban areas, one source for each country.** `metro` is now the urban area a city heads, by name as its source writes it: Statistics Canada's census metropolitan areas and agglomerations in Canada (the estimate of 1 July 2025, Table 17-10-0148-01), the Census Bureau's metropolitan and micropolitan statistical areas in the United States (1 July 2024), the OECD's functional urban areas in its other members, and for the first cities of China and India their censuses' urban figures (China's twenty-one megacities, by urban resident population in 2020: Chongqing 16.3 million, not its municipality's 32; India's twenty largest urban agglomerations of 2011, on which Mumbai ranks ahead of Delhi, the larger today). Where a city heads none, Wikidata's metropolitan area where it is bigger than the city, marked `metro.estimated` and `rankEstimated`, unless a bigger official area within 60 km holds it (Kyoto and Kobe, in Osaka's); else its own figure. South Africa's metropolitan municipalities are set on their seats (Durban is eThekwini's: Johannesburg, Cape Town, Durban, Pretoria, Gqeberha). Hong Kong and Macau are listed under their own codes, not China's. The area's figure ranks a city even below its own (Ulsan). Canada's first five are Toronto, Montreal, Vancouver, Calgary and Ottawa; the United States' New York City, Los Angeles, Chicago, Dallas and Houston; China's Shanghai, Beijing, Shenzhen, Chongqing and Guangzhou; India's Mumbai, Delhi, Kolkata, Chennai and Bengaluru. The sources and their terms are in NOTICE.md.

### Added

- **`inMetroOf`**, **`urbanAreaUnknown`** and **`rankEstimated`** on every city. `inMetroOf` is the id of the city whose urban area it lies inside, where it heads none of its own: Mississauga and Brampton in Toronto's (Statistics Canada's list of each area's municipalities), Fort Worth, Long Beach and Anaheim in Dallas's and Los Angeles's (named in the Census Bureau's titles), Ecatepec in Mexico City's, Niterói in Rio de Janeiro's, Thane in Mumbai's, Giza in Cairo's, Bangkok's districts and New York City's boroughs (set by id with their reasons), or a city near another whose area, or own figure of a million or more, holds three times its people; a city of a million or more is never put inside another's for being near it (Yokohama, Kobe, Kyoto, Incheon). Such a city comes after every city that heads an area, so a country's first ten or twenty are its major cities. `urbanAreaUnknown` marks a city of China or India below the census list, ranked after it. `rankEstimated` marks a city ranked by an estimate.
- **Districts and other units out of the cities.** An item Wikidata counts as a settlement but whose name is a county, district, subdistrict, raion, governorate, territory or region (Yishui County, Xətai raion, Bisha governorate), a part of a city ("Zone 7 of Milan", Marseille's sectors) or a municipality beside a town of its name is no longer a city; its id answers with the town or the city it belongs to (`cityById("Q2076557")` is Baku), or with none. Where Natural Earth names the unit and no city stands apart, it becomes that town, with the town's point and people (Yishui, 94,115, not the county's 967,570). Four Vietnamese and Chadian provinces and the Free Territory of Trieste are left out by name.
- **Nine more wrong Japanese names dropped**: a city carried the label of its state, province or country (Hidalgo del Parral as チワワ州, Bor as ニジニ・ノヴゴロド州, Revere as リビア, Murray as マリ); a test now finds any city named in Japanese as a subdivision it is not the capital of, or as another country.
- **Duplicate items left out**: München (a second item for Munich), Madrid city, Seville city, Málaga City, Valladolid city and Chongqing Shi, each a second item for its city; Minneapolis–Saint Paul and El Paso–Juárez, areas; South Mumbai and the London Borough of Ealing, parts of a city; Natural Earth's second Natal and its Vila Velha (the Vitória area); Kota Semarang, a second item for Semarang; Jember and Cilacap (regencies), Đồng Nai and Bắc Ninh (provinces), Sinnuris and Dairut (districts of Egypt), Rony (an upazila), the Kutupalong refugee camp, Kowloon Walled City (demolished in 1993) and Cheok Ka Village; San Pedro Zacachimalpa, given the Puebla area's 4.7 million people. Puebla, León and Toluca are named so in English, not by their formal names; Malatya's figure of 750 and Sirajganj's round 450,000 are left out. Each id answers with its city. A name ending in Municipality or Borough is a unit now, like District and County.

## [1.6.3] - 2026-11-11

### Added

- **Short Japanese city names for map labels**: `name.jaShort` beside `name.ja` on every city with a Japanese name: 東京 for 東京都, 大阪 for 大阪市, 新宿 for 新宿区, ソウル for ソウル特別市. A one-character name drops its 市 as maps print it (津市, 津); a name is kept whole where 区 would leave one character (中区), where the result would be a country's name (クウェート市) or would mean something else (中央市, 南九州市, 雲南市, ケソン市) or something bigger (東海市, 吉林市, 北海市, 山梨市), where 都市 is the word for a city in a longer name (関西文化学術研究都市; 京都市 is 京都), or where the 区 belongs to the name (浦東新区, ワシントン郡区); 町, 村 and 郡 are never dropped.
- **Seven wrong Japanese names dropped**: Várzea Grande, Qods, Kiryat Tiv'on and one Jinhe Town carried Wikidata's Japanese label of a larger place (a state, a province, a district, a county), and East Meadow, Pingdiquan Town and Ih Toli Gol that of another city (ニューヨーク市, 済寧, 玉林); they now have none, until a right one is found.
- **Brussels, Munich and Birmingham** rank by their metropolitan areas (3.35, 3.02 and 3.12 million): Wikidata has the areas but links them to no city, so `scripts/metro-links.ts` sets each by name with its reason. Somerset, a county, is no longer listed as a city.

## [1.6.2] - 2026-11-11

### Added

- **Cities ranked by their metropolitan area.** Each city has `metro`: the metropolitan area round it where one is named for it (`{ id, name, population, populationDate }`, else `null`): a Canadian city's census metropolitan area or agglomeration by Statistics Canada (2021 Census, id `statcan:<DGUID>`), any other's from Wikidata (CC0). The tiers, each country's file and `searchPlaces` rank a city by its metro's people where it has one, else by its own: Canada's first three are Toronto, Montreal and Vancouver, the United States' New York City, France's Paris, the Philippines' Manila. A tier still holds a city by its own `population`.
- **`@johnmorrisdotca/kuni/zones`**: `subdivisionTimeZone(code)`, the IANA zone of a first-level subdivision (Wikidata's where it names one of the country's zones alone, else estimated and said so), and `timeZoneAt(country, point)`, the zone at a point (the country's one zone, or the zone of the subdivision whose capital is nearest, estimated). kuni has no boundaries, so a point near the edge of a zone can be given its neighbour's.
- **`capitalZone`** in `/facts`: the IANA zone each capital keeps (245 countries; Astana's Asia/Almaty and Kosovo's Europe/Belgrade set by name, with the reason in docs/facts.md).

### Fixed

- **Units below a district are not cities**: upazilas, thanas, tehsils, talukas, municipal okrugs, subdistricts, wards, unions, arrondissements, county boroughs, regional councils, communes, the French métropoles and the Swiss cantons are left out (532 + 5 ids). Bangladesh's cities are now its 101 towns.
- **Civil townships round a city are not cities**: in Iowa, Illinois, Indiana, Kansas, Missouri, Nebraska and the Dakotas, where a township is a civil unit of its county with cities inside it, every township is left out (Kaw Township, round Kansas City; Thornton Township, round South Holland and Harvey); elsewhere a township is the municipality people live in (Toms River, New Jersey; Clinton Township, Michigan) and stays.
- Every id that leaves answers through `cityById` and `byId` with the city it belongs to, or with `null`. The alias table is written small, so the core of `/cities` stays under 24 KB.


## [1.6.1] - 2026-11-11

### Fixed

- **Areas left out of the cities.** Metropolitan Toronto was Canada's first city. Names that start Metropolitan, Metro, Metropolis of, Commune or Sectorul, name a regional municipality or a "State of", or end in Region, Region of …, Capital City, Urban Corridor or New Area are areas and units, not cities, and are left out (a name with a comma, a town told apart by its region, stays). A Natural Earth place whose Wikidata item is an area while the city of its name stands beside it now joins the city (Jamalpur, not Jamalpur District; Kristiansand, not Kristiansand Municipality). Moro, Papua New Guinea, given 6.3 million people, is left out by name. 30,616 cities (from 30,668). Ids never change: the 52 ids of 1.6.0 that are no city now answer through `cityById` and `byId` with the city they became (Metropolitan Toronto with Toronto, Metro Manila with Manila, Chișinău's sectors with Chișinău), or with `null` for a region that is no city.

### Changed

- **`cityById` fetches one country for a town.** A city that is in no tier file (no capital, under 100,000 people) is found through a small index of which country each is in, so only that country's file is fetched, not all 243.

## [1.6.0] - 2026-11-11

- **`/cities`**: the world's cities, in tiers, so that a page pays only for what it uses. `@johnmorrisdotca/kuni/cities/capitals` (every capital of a country or a subdivision, of any size), `/cities/1m` and `/cities/100k` (every city of a million people or more, and of 100,000 or more, capitals included), `loadCities("15k")` (15,000 or more, made from the countries' own files), `@johnmorrisdotca/kuni/cities/<code>` (one country's cities, every tier together) and `@johnmorrisdotca/kuni/cities`, the core: `citySet` (by id, by country, by subdivision, `nearest` and `within`), `loadCities(...tiers)`, `citiesOf(code)` and `cityById(id)`. **`@johnmorrisdotca/kuni/places`**, a new entry for what a place chooser asks: `continents()`, `countriesOf(continent)` and `searchPlaces(text, { lang, limit })` over English, Japanese and native names, with accents and kana folded, ranked by population. Kuni draws no chooser: a page builds its own. A city has its Wikidata id (or `ne:<number>` where only Natural Earth has it), its name in English, Japanese and in the official language of its country, continent, country, latitude and longitude, population with its date, first-level subdivision, capital flags (`national`, one for each country; `alternate`, for another seat of government such as Cape Town or Kyoto; `subdivision`) with the codes it is the capital of, and the source of each fact. Ids never change between releases: a merged id answers with the city it became. The data is Wikidata's (CC0) with Natural Earth's populated places (public domain) filling what Wikidata lacks; areas, wards, arrondissements and duplicate items are left out; `pnpm data:cities` takes a new snapshot by hand. docs/cities.md counts what is in each tier and what is missing; the new guide is "Use the cities".
- `fold` writes ł, ß, ø, đ, ı, æ, œ, ð and þ as l, ss, o, d, i, ae, oe, d and th, so that "Lodz" finds Łódź and "Strasse" finds Straße in every lookup.
- Kuni's local ports are 8600 to 8699 (AGENTS.md).
- The README opens with the package's thumbnail, and the demo carries it as its link preview (og:image) and publishes the card, a dark card and an icon on Pages at `thumbnail.png`, `thumbnail-dark.png` and `icon.png`.

## [1.5.0] - 2026-11-03

The demo, the docs and the release tooling follow the family's must-have list. No change to the package's code beyond its version.

### Added

- **Every way to use it, tested.** `examples/` holds a script tag from jsDelivr and from unpkg, Vite, webpack, React (with a server render), Vue, Svelte, Angular, an iframe of the embed page, TypeScript and Node. `pnpm test:usage` builds, type-checks or runs each against the package as npm packs it, opens the ones with a page in a browser, and checks that the guides hold the same text word for word. CI runs it.
- **Five guides, English and Japanese:** plain HTML and CDNs, Vite and webpack, React, Vue, Svelte and Angular, an iframe, and TypeScript and Node. The README links them ("Use it anywhere").
- **`scripts/check-standard.mjs`**, the family's must-have list as a check (kazoku-ui's, copied unchanged), run by `pnpm test`.

### Changed

- **The demo's header** has the family's language picker and theme switch (kazoku-ui), and the page is `demo/index.html`. The README's pictures are new screenshots of it.
- **The Release workflow** calls kazoku-ui's shared release workflow, and refuses a commit CI has not passed.

## [1.4.0] - 2026-10-14

A country and subdivision card with a shared embed builder joins the demo and the package, tables download as Markdown and SQL, and the package has an English and Japanese documentation site with a checked example for every export. The country data, the codes and the lookups are unchanged.

### Added

- Add the bilingual documentation site, checked public examples, full country-resource catalogue, local search and machine-readable pages.
- Add a country and subdivision card, embed builder and validated storage-free iframe.
- Add per-place colours and a capital-marker switch to country cards and their builder/frame links. Hosts can receive drawing options in map loaders; capital text fields stay separate.
- Share a package-independent embed builder for option controls, preview adapters, code tabs and shareable links.

### Changed

- The tests allow thirty seconds each (`vitest.config.js`), because the shared test that measures each entry point's size builds the country data and took longer than five seconds on a slow runner.
- The API link in the header reads "API" in English, so that the header takes the same number of rows in English and in Japanese on a phone, as the demo's test of a language change asks.
- Synchronize documentation tooling for repository layouts, generated type references, Node entry points and repository-specific README links.
- Keep complete resource catalogues on the documentation entry index and the active resource beside core navigation; render valid default imports in HTML and Markdown.
- Reconcile cards with the released IOC/withdrawn APIs; append optional ioc display while keeping current-country pickers and default fields unchanged.
- Compose optional Hata flags and Chizu maps, retain dated facts and land-area scope, and expose reflected properties and native load/error events.
- Group the package family by kind, alphabetize each group, and include the geography packages and REST in Pieces in the shared footer and README.
- Update the shared family description for addresses in all seven supported countries, including France and Germany.

## [1.3.0] - 2026-10-09

### Added

- **`country(code).ioc`**, the International Olympic Committee's three-letter country code (`"JPN"`, `"GER"` for Germany, `"SUI"` for Switzerland, `"TPE"` for Taiwan, `"KOS"` for Kosovo), for the 209 countries Wikidata (P984, CC0) gives one. A country with none has no `ioc` field. It is one more column in the main entry's table: the entry grew by 1.7 KB (0.8 KB gzipped).
- **`@johnmorrisdotca/kuni/withdrawn`**, a new entry: the 31 countries ISO 3166-3 lists as withdrawn from ISO 3166-1, with `withdrawnCountries()` and `withdrawn(code)`. A record has the four-letter code (`SUHH`), the alpha-2 (`SU`), alpha-3 (`SUN`) and numeric (`810`) codes it held, its name in English and Japanese, `since` and `until` (the years the code was in force), the `successors` (the new codes ISO 3166-3 lists, in ISO's order; every record has at least one, and one may itself be withdrawn: Yugoslavia's is `CS`, which `withdrawn("CS")` resolves to Serbia and Montenegro first and Czechoslovakia after) and `reusedBy` where a current country holds the alpha-2 code now (BY, AI, BQ, GE, SK). The lookup takes any of the four codes in either case and answers every country that held it, the last one first (`withdrawn("CS")` is Serbia and Montenegro, then Czechoslovakia), and an empty list for anything else. The Soviet Union, Yugoslavia, Czechoslovakia, East Germany, Zaire, East Timor, the Netherlands Antilles and Burma are among them. The main entry is unchanged: `countries()` and `country()` never return one, so no country picker shows the USSR. It is 8 KB (2.4 KB gzipped).
- **ISO 3166-3 is the authority for the withdrawn countries' codes, years and successors**: `WITHDRAWN_TABLE` in `scripts/withdrawn-config.ts` is the published list transcribed once (alpha-3, numeric, the years the code was in force, ISO's new codes), and `src/withdrawn.test.ts` pins the whole table, so a rebuild cannot drift from it. **Wikidata is used for their names** (English and Japanese) and for the IOC codes: a new snapshot, `data-sources/wikidata-codes-2026-10-10.json`, read by `pnpm data:codes` (CC0), turned into records by `scripts/withdrawn.ts`, which stops if the snapshot and ISO's table do not name the same 31 codes. `docs/withdrawn.md` lists every record and the Japanese names for review. The names, facts and groupings snapshots are unchanged.
- NOTICE.md, data-sources/README.md and the README's data table say where the new data comes from and its terms.

### Changed

- `Country` has a new optional field, `ioc`. The table the main entry reads has one more column before the user-assigned marker; nothing that reads `country()` changes.

## [1.2.0] - 2026-10-09

### Added

- **The demo's Compare view colours each country on its own**: a colour picker for each outline (the family's green and red at first, never the same), and a "Show capitals" switch for the dot on each capital. Both are kept in the address (`#/compare/JP/GB?colours=2f5d4a,b5452c&capitals=off`), so a shared link shows what its sender saw, and swapping the countries takes each one's colour with it.
- **The demo's tables and lists also download as a Markdown table and as SQL**, beside CSV, JSON and text. The Markdown is a GitHub table (a `|` in a cell is escaped, a line break is `<br>`); the SQL is a `CREATE TABLE` and an `INSERT` a row, with double-quoted names, single-quoted text and NULL for what is missing, and runs in SQLite, PostgreSQL and MySQL (MySQL needs `ANSI_QUOTES` and `NO_BACKSLASH_ESCAPES`, which the file's second line says). The writers are `demo/downloads.js`, the same file in kuni, chizu and hata, held to one hash and tested by loading the SQL into SQLite.

### Fixed

- On a phone, Compare's table no longer squeezes a long label into one character a line or cuts off the second country: each fact is a block, its name above the two countries' values and the difference under them.

## [1.1.0] - 2026-10-09

### Added

- **Each country's capital in Japanese**: `country(code).capital` is now `{ en, ja }` (東京, キーウ), from Wikidata, for all 245 countries that have a capital.
- **`@johnmorrisdotca/kuni/facts`**, a new entry so the main one stays small: for every country its population and area with the year each is for, the coordinates of the country and of its capital, the countries it shares a land border with (`[]` for an island), the side of the road it drives on, and CLDR's first day of the week, measurement system, paper size and clock. `facts(code)`, `allFacts()`, `distanceKm(from, to)` and `FACTS_READ`, the day Wikidata was read. Plain numbers and codes, for a build script to read as they are.
- **`@johnmorrisdotca/kuni/subdivision-facts`** and **`/subdivision-facts/<code>`**: each subdivision's capital (in English and Japanese, with a reading in kana for Japan's prefectural capitals), population, area and coordinates, one country at a time, with `loadSubdivisionFacts(code)`. Complete for Japan's 47 prefectures.
- **`@johnmorrisdotca/kuni/groupings`**: 107 groupings, each named in English and Japanese with its members, definition, source, licence and the day it was true. The seven continents; the 30 UN M49 areas; 23 international bodies (the UN, the EU with its candidates, the euro area, Schengen, the EEA, NATO, the G7 and G20, the OECD, ASEAN, the African Union, the Arab League, the GCC, the Commonwealth, OPEC, BRICS, Mercosur, the USMCA, APEC, CARICOM, the Pacific Islands Forum, the Nordic Council and Benelux) with the days members joined and left; 16 informal groupings (the Middle East, Latin America, the Caribbean, the Balkans, the Western Balkans, Scandinavia, the Nordic countries, the Baltic states, Central and Southeast Asia, the Maghreb, the Horn of Africa, the Sahel, the British Isles, Iberia, Asia-Pacific); and regions inside a country (Japan's eight 地方 and the nine-region variant, the US Census regions and divisions, Canada's five regions, the UK's four nations, Australia's states and territories). `groupings`, `grouping`, `groupingsOf` and `membersOf`, with `on` for a body's members on a past day.
- Every public export has a doc comment, kept in the built `.d.ts` so an editor shows it, with `@param`, `@returns` and an example; the tests run every example. The API page shows each function's parameters, what it returns and its example, and each interface's fields.
- Japan's Kinki region carries Kansai (関西地方) as its other name: `Grouping.otherNames`.
- `docs/facts.md`, `docs/subdivision-facts.md` and `docs/groupings.md` say what was decided, how much is known, and why the rest is `null`.
- The demo has views of its own, each at its own address: a page for each country (its outline from Chizu with the capital marked, its facts with their years, neighbours and groupings as links, furigana, the time now in each of its zones), two countries compared, every country in a table to filter, sort and narrow by grouping, a groupings explorer with a body's members on any day, three seeded quizzes (capitals, which country a region is in, calling codes) whose link gives the same questions, a country and region form widget in English or Japanese with its code to copy, search by calling code, currency or domain, and the data's quality in the open. Tables and lists download as CSV, JSON or text. Chizu is a development dependency for the demo's outlines only.

### Changed

- Equatorial Guinea's capital is Ciudad de la Paz (シウダ・デ・ラ・パス), where it moved in January 2026; it was Malabo.
- **Continents follow UN M49** (from CLDR): Russia is in Europe, Cyprus in Asia, Timor-Leste in Asia, Christmas Island and the Cocos Islands in Oceania, the British Indian Ocean Territory in Africa, and the sub-Antarctic islands where M49 puts them (Bouvet Island and South Georgia in South America, Heard and McDonald in Oceania, the French Southern Lands in Africa). Antarctica is the one continent named by hand. 1.0.0 took the continent from countries-list.
- **Norway's counties are those of 2024**, when Viken, Vestfold og Telemark and Troms og Finnmark were divided again: NO-31 Østfold, NO-32 Akershus, NO-33 Buskerud, NO-39 Vestfold, NO-40 Telemark, NO-55 Troms and NO-56 Finnmark are added and NO-30, NO-38 and NO-54 are gone, as in ISO 3166-2, which CLDR 48.2 has not caught up with. There are now 5,050 subdivisions.
- Short names where CLDR's full name reads badly in a narrow space: DR Congo (コンゴ民主共和国) and Congo (コンゴ共和国) for "Congo - Kinshasa" and "Congo - Brazzaville", ミャンマー for ミャンマー (ビルマ), ココス諸島. Hong Kong, Macao and Myanmar already had CLDR's.
- Each capital's Japanese name is the usual one (東京, 北京, ソウル), not a municipality's formal name, after a review.

### Fixed

- English subdivision names that were wrong in 1.0.0: Peterborough and Marlborough were cut short ("Peter", "Marl"); Chiayi City and Chiayi County were swapped, in Japanese too (嘉義市, 嘉義県); Bogotá was "Capital District"; Davao de Oro (ダバオ・デ・オロ州), Csongrád-Csanád and Nicaragua's two Caribbean Coast regions had their old names; Russia's republics Buryatia, Chechnya, Chuvashia, Kabardino-Balkaria, Karachay-Cherkessia and Udmurtia were adjectives, and Altai Republic and Komi Republic are told from their neighbours; Cần Thơ had lost its marks; Barisal Division and Barisal District had each other's names; and Morocco's twelve regions carried the names of the regions that held their codes before 2019 (MA-04 is Rabat-Salé-Kénitra, not Oriental), in Japanese too, where MA-11's came from a Wikidata label that was not a name. Every English name is now checked for each of these faults against Wikidata's English label, and the build stops on one nobody has decided (`docs/disagreements.md`).

## [1.0.0] - 2026-10-09

The first version: every country and its subdivisions, with ISO 3166 codes and names in English and Japanese.

### Added

- **`@johnmorrisdotca/kuni`**: the 250 countries (the 249 ISO 3166-1 codes and Kosovo, XK, as a user-assigned code), each with alpha-2, alpha-3 and numeric codes, its name in English and Japanese from Unicode CLDR 48.2, CLDR's short and variant forms, its own name, a reading in hiragana for a Japanese name written in kanji, its flag, continent and UN M49 subregion, calling code, currencies, top-level domain, capital, IANA time zones, languages and the kind of place its subdivisions are. Lookups: `country` (alpha-2 in either case, alpha-3 or numeric), `countries` (in code, English or Japanese order), `countryByName` (a name in either language, a short name, the country's own name or an alias such as Holland, UK, Burma or 米国), `countryName`, `flag`, `continentName`, `subregionName`, `fold` and `isCountryCode`.
- **`/codes`**: the 250 codes alone, `COUNTRY_CODES`, `isCountryCode` and the `CountryCode` type, about 2 KB.
- **`/subdivisions/<code>`**: one country's subdivisions as a list, one entry for each of the 200 countries that have them (Japan's 47 prefectures are under 3 KB).
- **`/subdivisions`**: all 5,046 ISO 3166-2 subdivisions (3,590 at the first level, the rest below it, such as France's departments inside its regions), each with its code, short code, level, parent, kind of place, English name, Japanese name or `null`, and for Japan's prefectures a reading. Lookups: `subdivisions` (by level), `allSubdivisions`, `subdivision`, `subdivisionByShortCode`, `subdivisionByName` and `subdivisionsByName` (English or Japanese, with or without the word for its kind, オンタリオ for オンタリオ州), and `subdivisionTypeLabel` (都, 道, 府 and 県 for Japan; 州 for Canada's provinces).
- **`/load`**: `loadSubdivisions(code)`, one dynamic import for each country, so a page loads only the countries somebody picks.
- Japanese names for 3,523 of the 3,590 first-level subdivisions (3,387 from CLDR, 41 written by hand where CLDR's is wrong or out of date, 95 from Wikidata where CLDR has none) and 4,747 of all 5,046; the rest are `null`, never an English name copied in. CLDR's trailing brackets that tell a place from one of the same name elsewhere (セント・ポール (ドミニカ国), バリンゴ (カウンティ), 江原道 (北)) are taken off, 115 of them, and listed in `docs/name-rules.md`. The 46 hand-written names (`JA_NAME_OVERRIDES`: parishes as 教区, Ukraine's Japanese forms of 2022, places renamed since, Latvian spellings and others) are listed with their reasons in `docs/disagreements.md`, with the questions left for a native reader of Japanese. `docs/ja-gaps.md` lists the gaps.
- ESM and CommonJS builds with types for both, `sideEffects: false`, no runtime dependencies, and no use of `Intl`, so a server and a browser give the same names.
- `pnpm data` builds the data from inputs committed under `data-sources/` (CLDR's subdivision files, IANA's zone.tab and TLD list, a Wikidata snapshot), checked by SHA-256, with no network; `pnpm data:fetch` and `pnpm data:wikidata` refresh them.
- A demo with three panels (find a country, the subdivisions of a country, look up a code) in English and Japanese, an API reference page, browser tests at a phone's width and a desk's, and the README's pictures taken from it.
