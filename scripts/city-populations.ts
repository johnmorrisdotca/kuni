// The people of a city where Wikidata has no figure for the city itself: its figure is a department's, an estimate a web
// site made of the urban area, or one with no source far from the census's. Each is the city's own figure from its
// country's census, with its day and source, typed by hand; only the figures are taken, no table is copied. Each entry
// names the figure it replaces (`wikidata`, the best-ranked figure in the cities snapshot): when Wikidata's changes, or the
// city is gone, scripts/build-data.ts stops, so that it is looked at again. A city whose figure the rules in
// scripts/cities.ts already put right (a site's estimate left out where Wikidata also has the census's: Mbabane) is not here.
//
// Checked against each country's census publication and Wikipedia's infobox of the city, 2026-11-17.

interface CityPopulation {
  /** The best-ranked figure in the Wikidata snapshot, which this replaces. */
  wikidata: number;
  /** The city's own people, at the census. */
  population: number;
  /** The census day. */
  date: string;
  source: string;
  why: string;
}

const GHANA_2021 = "Ghana Statistical Service, 2021 Population and Housing Census (27 June 2021), the metropolitan district";
const SUDAN_2008 = "Central Bureau of Statistics, Sudan, Fifth Population and Housing Census (22 April 2008), the city";

const CITY_POPULATIONS: Readonly<Record<string, CityPopulation>> = {
  Q2200458: {
    wikidata: 867463,
    population: 246575,
    date: "2013-05-11",
    source: "INSAE, Benin, fourth General Census of Population and Housing (RGPH-4, 2013), the commune",
    why: "Banikoara, Benin: Wikidata's 867,463 is the census figure of the whole Alibori department.",
  },
  Q182059: { wikidata: 3903480, population: 443981, date: "2021-06-27", source: GHANA_2021, why: "Kumasi, Ghana: Wikidata's 3,903,480 (2024) is World Population Review's estimate of the urban area." },
  Q3761: { wikidata: 1782150, population: 284124, date: "2021-06-27", source: GHANA_2021, why: "Accra, Ghana: Wikidata's 1,782,150 is the census's urban population of the area round the city." },
  Q217040: { wikidata: 729768, population: 374744, date: "2021-06-27", source: GHANA_2021, why: "Tamale, Ghana: Wikidata's 729,768 (2023) is World Population Review's; its other figures have no source." },
  Q243293: { wikidata: 539548, population: 245382, date: "2021-06-27", source: GHANA_2021, why: "Sekondi-Takoradi, Ghana: Wikidata's 539,548 is the 2010 figure of the district before it was split." },
  Q1963: { wikidata: 5345000, population: 1410858, date: "2008-04-22", source: SUDAN_2008, why: "Khartoum, Sudan: Wikidata's 5,345,000 (2018) is Demographia's estimate of the urban area of the three cities, Omdurman and Khartoum North with it." },
  Q180921: { wikidata: 2805396, population: 1849659, date: "2008-04-22", source: SUDAN_2008, why: "Omdurman, Sudan: Wikidata's 2,805,396 (2012) has no source; the census figure, of the day Khartoum's is." },
  Q495730: {
    wikidata: 110508,
    population: 30248,
    date: "2017-05-11",
    source: "Central Statistical Office, Eswatini, 2017 Population and Housing Census (11 May 2017), the town",
    why: "Manzini, Eswatini: Wikidata's 110,508 (2005) has no source and is more than three times the census's figure.",
  },
};

export { CITY_POPULATIONS };
export type { CityPopulation };
