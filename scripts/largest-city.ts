// The few choices scripts/trivia.ts cannot make from /cities alone when it names each country's largest city by the
// people of the city itself (its city proper). Each is checked when the data is built: an entry whose figure Wikidata
// no longer gives, or whose city kuni no longer has, stops the build, so that it is looked at again.
//
//   - LARGEST_CITY_FIGURES: a city whose Wikidata figure (the one /cities holds) is not the people of the city itself
//     (a department's, a kingdom's, an estimate of the urban area around it), by its item. `population` is the city's
//     own figure from its country's census, with its day and source, or `null` where it is no city or no census
//     figure for it was found: it is then not ranked. `wikidata` is the figure it replaces. Only the figures are
//     taken: no table is copied.
//   - LARGEST_CITY_ELSEWHERE: a country whose largest place is not among kuni's cities of that code (it is placed
//     under another code, or below the 15,000 people every other city has), so that the first of the cities kuni has
//     would be a wrong answer: it has none. `id` is the place's item where kuni has it under another code.
//
// Checked against each country's Wikipedia infobox and the national statistics, 2026-11-17; docs/trivia.md lists
// where the city proper differs from the city an urban area would give.

interface CityFigure {
  /** The figure Wikidata gives, which this replaces; the build stops when Wikidata's changes. */
  wikidata: number;
  /** The city's own people, or `null` where it is no city, or no census figure for it was found. */
  population: number | null;
  date?: string;
  source?: string;
  why: string;
}

const GHANA_2021 = "Ghana Statistical Service, 2021 Population and Housing Census (27 June 2021), the metropolitan district";
const SUDAN_2008 = "Central Bureau of Statistics, Sudan, Fifth Population and Housing Census (22 April 2008), the city";
const ESWATINI_2017 = "Central Statistical Office, Eswatini, 2017 Population and Housing Census (11 May 2017), the town";

const LARGEST_CITY_FIGURES: Readonly<Record<string, CityFigure>> = {
  Q24697413: { wikidata: 4000000, population: null, why: "Dagbon, Ghana: a traditional kingdom of the north, and its 4,000,000 its people; not a city." },
  Q2486: { wikidata: 70090, population: null, why: "Tarawa, Kiribati: the atoll, North Tarawa with it; its town is South Tarawa (Q131233), the capital." },
  Q2200458: {
    wikidata: 867463,
    population: 246575,
    date: "2013-05-11",
    source: "INSAE, Benin, fourth General Census of Population and Housing (RGPH-4, 2013), the commune",
    why: "Banikoara, Benin: Wikidata's 867,463 is the census figure of the whole Alibori department.",
  },
  Q182059: { wikidata: 3903480, population: 443981, date: "2021-06-27", source: GHANA_2021, why: "Kumasi, Ghana: Wikidata's 3,903,480 (2024) is World Population Review's estimate of the urban area." },
  Q3761: { wikidata: 1782150, population: 284124, date: "2021-06-27", source: GHANA_2021, why: "Accra, Ghana: Wikidata's 1,782,150 is the census's urban population of the area round the city." },
  Q217040: { wikidata: 729768, population: 374744, date: "2021-06-27", source: GHANA_2021, why: "Tamale, Ghana: Wikidata's 729,768 (2023) is no census figure." },
  Q243293: { wikidata: 539548, population: 245382, date: "2021-06-27", source: GHANA_2021, why: "Sekondi-Takoradi, Ghana: Wikidata's 539,548 is the 2010 figure of the district before it was split." },
  Q1963: { wikidata: 5345000, population: 1410858, date: "2008-04-22", source: SUDAN_2008, why: "Khartoum, Sudan: Wikidata's 5,345,000 (2018) is Demographia's estimate of the urban area of the three cities, Omdurman and Khartoum North with it." },
  Q180921: { wikidata: 2805396, population: 1849659, date: "2008-04-22", source: SUDAN_2008, why: "Omdurman, Sudan: Wikidata's 2,805,396 (2012) has no source; the census figure, of the day Khartoum's is." },
  Q101418: { wikidata: 114585, population: null, why: "Lobamba, Eswatini: Wikidata's 114,585 (2025) is World Population Review's; Wikidata's own earlier figure is 5,800, and the 2017 census does not list it among the towns." },
  Q495730: { wikidata: 110508, population: 30248, date: "2017-05-11", source: ESWATINI_2017, why: "Manzini, Eswatini: Wikidata's 110,508 (2005) has no source and is more than three times the census's figure." },
  Q3904: { wikidata: 76218, population: 60691, date: "2017-05-11", source: ESWATINI_2017, why: "Mbabane, Eswatini: Wikidata's 76,218 (2025) is World Population Review's; the census figure, of the day Manzini's is." },
  Q3818: {
    wikidata: 297000,
    population: 257000,
    date: "2015-07-04",
    source: "the 2015 census of Equatorial Guinea, the city as citypopulation.de (Thomas Brinkhoff) calculates it",
    why: "Malabo, Equatorial Guinea: Wikidata's 297,000 is for 2018 and Bata's 290,000 for 2015; the same source and day give Malabo 257,000.",
  },
  Q3116994: { wikidata: 21660, population: null, why: "Gros Islet, Saint Lucia: Wikidata's 21,660 is the Gros Islet District's, not the town's; Castries' 20,000 is the city's." },
};

const LARGEST_CITY_ELSEWHERE: Readonly<Record<string, { place: string; id?: string; why: string }>> = {
  AS: { place: "Tafuna", why: "Tafuna had 7,988 people in 2020, Pago Pago 3,656 in 2010; kuni has only the capital, below 15,000." },
  BM: { place: "St. George's", why: "the Town of St. George is larger than the City of Hamilton; kuni has only the capital, below 15,000." },
  CC: { place: "Home Island", why: "most of the islands' 593 people live on Home Island, 147 on West Island; kuni has only the capital." },
  EH: { place: "Laayoune", id: "Q47837", why: "kuni's cities, as Wikidata does, give Laayoune the code MA." },
  FM: { place: "Weno", why: "Weno, in Chuuk, is larger than Palikir; kuni has neither it nor the other towns below 15,000." },
  GP: { place: "Les Abymes", why: "the largest commune; kuni has Basse-Terre, the capital, alone." },
  GU: { place: "Dededo", id: "Q1182147", why: "Dededo had 44,908 people in 2020, Hagåtña 943; kuni's cities, as Wikidata does, give Dededo the code US." },
  LI: { place: "Schaan", why: "Schaan had 5,998 people on 30 June 2019, Vaduz 5,668; kuni has only the capital, below 15,000." },
  MT: { place: "St. Paul's Bay", why: "the largest locality at the 2021 census; kuni does not have it." },
  NF: { place: "Burnt Pine", why: "the island's main settlement; kuni has only Kingston, the capital, with no figure." },
  NR: { place: "Denigomodu", why: "the district with the most people; kuni has only Yaren District, the seat of government." },
  PF: { place: "Faʼaʼā", why: "the most populous commune, larger than Papeete; kuni does not have it." },
  SH: { place: "Half Tree Hollow", why: "the settlement with the most people, larger than Jamestown; kuni has only the capital." },
  SM: { place: "Dogana", why: "Dogana, in Serravalle, had about 7,000 people, the City of San Marino 3,997; kuni has only the capital." },
  SX: { place: "Lower Prince's Quarter", why: "the largest district, larger than Philipsburg; kuni has only the capital." },
  TC: { place: "Providenciales", why: "the island town with most of the people, far larger than Cockburn Town; kuni does not have it." },
};

export { LARGEST_CITY_ELSEWHERE, LARGEST_CITY_FIGURES };
export type { CityFigure };
