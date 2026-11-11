// A city's metropolitan area set by name, where Wikidata has the area but links it to the city in none of the ways
// scripts/fetch-metros.ts asks: city item, area item, and the reason. scripts/fetch-metros.ts fetches these areas too, and
// scripts/cities.ts gives each city its area, as it would one Wikidata links.

const METRO_LINKS: Readonly<Record<string, { area: number; why: string }>> = {
  Q239: { area: 9005, why: "Brussels: the Brussels metropolitan area is linked to the Brussels-Capital Region, not to the City of Brussels." },
  Q1726: { area: 126281350, why: "Munich: the Munich metropolitan area (a functional urban area) is linked to no city." },
  Q2256: { area: 4916862, why: "Birmingham: the Birmingham metropolitan area is linked to no city; the West Midlands conurbation has no population." },
};

// An OECD functional urban area whose name is no city's, and the city it is named for: OECD code, city item, reason.
const OECD_AREAS: Readonly<Record<string, { city: number; why: string }>> = {
  UK002F: { city: 2256, why: "West Midlands urban area: Birmingham's." },
  BE001F: { city: 239, why: "Bruxelles: the French name of Brussels." },
  EL001F: { city: 1524, why: "Athina: Athens, in Greek written in Latin letters." },
  DK002F: { city: 25319, why: "Århus: the older spelling of Aarhus." },
  MEX04F: { city: 125293, why: "Puebla: Heroica Puebla de Zaragoza." },
  MEX05F: { city: 209034, why: "Toluca: Toluca de Lerdo." },
  MEX07F: { city: 189128, why: "Leon: León de Los Aldama." },
  MEX08F: { city: 173121, why: "Queretaro: Santiago de Querétaro." },
  ISR17F: { city: 1218, why: "Jerusalem: Wikidata gives the city no single country, so it is set by its item." },
  MEX10F: { city: 26590, why: "Juarez: Ciudad Juárez." },
  MEX28F: { city: 8969, why: "Benito Juarez: the municipality of Cancún, not Ciudad Benito Juárez in Nuevo León." },
  MEX43F: { city: 139242, why: "Guadalupe: the Zacatecas-Guadalupe area, named for Zacatecas, the state's capital; not Guadalupe in Nuevo León." },
  ES008F: { city: 11974, why: "Las Palmas: Las Palmas de Gran Canaria." },
};

// A city inside another city's urban area that neither the source's list nor nearness finds: city item, the head's item, reason.
const INSIDE_AREAS: Readonly<Record<string, { head: number; why: string }>> = {
  Q1009253: { head: 34932, why: "Ipswich, Queensland: in Greater Brisbane (the ABS's Greater Capital City Statistical Area), 35 km from the centre." },
  Q2944411: { head: 3130, why: "Central Coast, New South Wales: in Greater Sydney (the ABS's Greater Capital City Statistical Area)." },
  Q18419: { head: 60, why: "Brooklyn: a borough of New York City." },
  Q18424: { head: 60, why: "Queens: a borough of New York City." },
  Q11299: { head: 60, why: "Manhattan: a borough of New York City." },
  Q18426: { head: 60, why: "The Bronx: a borough of New York City." },
  Q18432: { head: 60, why: "Staten Island: a borough of New York City." },
};

// A country's name as GHSL writes it (the UN's) where it is none of kuni's names for the country.
// Three are written as GHSL's file has them, its UTF-8 read as Latin-1 ("CÃ´te d'Ivoire").
const GHSL_COUNTRY_NAMES: Readonly<Record<string, string>> = {
  "United States of America": "US",
  "Russian Federation": "RU",
  "Democratic Republic of the Congo": "CD",
  "Iran (Islamic Republic of)": "IR",
  "Republic of Korea": "KR",
  "China, Taiwan Province of China": "TW",
  "Venezuela (Bolivarian Republic of)": "VE",
  "United Republic of Tanzania": "TZ",
  "Dem. People's Republic of Korea": "KP",
  "Syrian Arab Republic": "SY",
  "CÃ´te d'Ivoire": "CI",
  "Bolivia (Plurinational State of)": "BO",
  "State of Palestine": "PS",
  "Republic of Moldova": "MD",
  "Kosovo (under UNSC res. 1244)": "XK",
  "Bosnia and Herzegovina": "BA",
  "RÃ©union": "RE",
  "Lao People's Democratic Republic": "LA",
  "CuraÃ§ao": "CW",
  "Sao Tome and Principe": "ST",
  "Brunei Darussalam": "BN",
};

// A GHSL urban centre whose first name a city has is not that city's: centre id, city item, reason.
const GHSL_CENTRES: Readonly<Record<number, { city: number; why: string }>> = {
  7963: { city: 1353, why: "Delhi's centre: GHSL names it New Delhi, the district; the city is Delhi." },
};

export { GHSL_CENTRES, GHSL_COUNTRY_NAMES, INSIDE_AREAS, METRO_LINKS, OECD_AREAS };
