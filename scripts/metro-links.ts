// A city's metropolitan area set by name, where Wikidata has the area but links it to the city in none of the ways
// scripts/fetch-metros.ts asks: city item, area item, and the reason. scripts/fetch-metros.ts fetches these areas too, and
// scripts/cities.ts gives each city its area, as it would one Wikidata links.

const METRO_LINKS: Readonly<Record<string, { area: number; why: string }>> = {
  Q239: { area: 9005, why: "Brussels: the Brussels metropolitan area is linked to the Brussels-Capital Region, not to the City of Brussels." },
  Q1726: { area: 126281350, why: "Munich: the Munich metropolitan area (a functional urban area) is linked to no city." },
  Q2256: { area: 4916862, why: "Birmingham: the Birmingham metropolitan area is linked to no city; the West Midlands conurbation has no population." },
  // South Africa's metropolitan municipalities name their seat by P36 only; Ekurhuleni, whose seat is no city of note, is left out.
  Q34647: { area: 2346838, why: "Johannesburg: the City of Johannesburg Metropolitan Municipality, whose seat it is." },
  Q5465: { area: 1185115, why: "Cape Town: the City of Cape Town, the metropolitan municipality." },
  Q5468: { area: 311544, why: "Durban: the eThekwini Metropolitan Municipality, whose seat it is (Wikidata's Durban is the old city)." },
  Q3926: { area: 1094207, why: "Pretoria: the City of Tshwane Metropolitan Municipality, whose seat it is." },
  Q125434: { area: 1856565, why: "Gqeberha: the Nelson Mandela Bay Metropolitan Municipality, whose seat it is." },
  Q209537: { area: 1002006, why: "East London: the Buffalo City Metropolitan Municipality, whose seat it is." },
  Q37701: { area: 1159185, why: "Bloemfontein: the Mangaung Metropolitan Municipality, whose seat it is." },
};

// An OECD functional urban area whose name is no city's, and the city it is named for: OECD code, city item, reason.
const OECD_AREAS: Readonly<Record<string, { city: number; why: string }>> = {
  UK002F: { city: 2256, why: "West Midlands urban area: Birmingham's." },
  BE001F: { city: 239, why: "Bruxelles: the French name of Brussels." },
  EL001F: { city: 1524, why: "Athina: Athens, in Greek written in Latin letters." },
  DK002F: { city: 25319, why: "Århus: the older spelling of Aarhus." },
  MEX04F: { city: 125293, why: "Puebla: Wikidata's label is Heroica Puebla de Zaragoza." },
  MEX05F: { city: 209034, why: "Toluca: Wikidata's label is Toluca de Lerdo." },
  MEX07F: { city: 189128, why: "Leon: Wikidata's label is León de Los Aldama." },
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
  Q8972: { head: 1489, why: "Ecatepec de Morelos: in the Valley of Mexico, Mexico City's functional urban area." },
  Q210307: { head: 1489, why: "Ciudad Nezahualcóyotl: in the Valley of Mexico, Mexico City's functional urban area." },
  Q147402: { head: 9022, why: "Zapopan: in Guadalajara's functional urban area." },
  Q178725: { head: 8678, why: "Niterói: across the bay, in Rio de Janeiro's metropolitan region." },
  Q217426: { head: 34647, why: "Soweto: a part of the City of Johannesburg." },
  Q818106: { head: 34647, why: "Benoni: on the East Rand (Ekurhuleni), in Johannesburg's urban area." },
  Q761408: { head: 34647, why: "Springs: on the East Rand (Ekurhuleni), in Johannesburg's urban area." },
  Q1054450: { head: 3926, why: "Centurion: a part of the City of Tshwane, Pretoria's." },
  Q207749: { head: 1156, why: "Thane: in the Census of India's Greater Mumbai urban agglomeration." },
  Q61445: { head: 1156, why: "Navi Mumbai: in the Census of India's Greater Mumbai urban agglomeration." },
  Q581999: { head: 1156, why: "Kalyan-Dombivli: in the Census of India's Greater Mumbai urban agglomeration." },
  Q580876: { head: 1156, why: "Vasai-Virar: in the Census of India's Greater Mumbai urban agglomeration." },
  Q1006343: { head: 1156, why: "Mira-Bhayandar: in the Census of India's Greater Mumbai urban agglomeration." },
  Q119219: { head: 1538, why: "Pimpri-Chinchwad: in the Census of India's Pune urban agglomeration." },
  Q81788: { head: 85, why: "Giza: across the Nile, in Greater Cairo." },
  Q12191144: { head: 85, why: "New Cairo: in Greater Cairo." },
  Q269960: { head: 85, why: "Shubra El Kheima: in Greater Cairo." },
  Q10392: { head: 3630, why: "Bekasi: in Jabodetabek, Jakarta's metropolitan area." },
  Q10396: { head: 3630, why: "Depok: in Jabodetabek, Jakarta's metropolitan area." },
  Q10127: { head: 3630, why: "Tangerang: in Jabodetabek, Jakarta's metropolitan area." },
  Q10128: { head: 3630, why: "South Tangerang: in Jabodetabek, Jakarta's metropolitan area." },
  Q2460416: { head: 1354, why: "Gazipur: in Greater Dhaka." },
  Q5617890: { head: 8660, why: "Gulshan Town: a town of Karachi." },
  Q1580709: { head: 34647, why: "Thembisa: on the East Rand (Ekurhuleni), in Johannesburg's urban area." },
};

// A subdivision that is a city, every other city in it being one of its districts: subdivision, the city's item, reason.
const INSIDE_SUBDIVISIONS: Readonly<Record<string, { head: number; why: string }>> = {
  "TH-10": { head: 1861, why: "Bangkok: the province is the city, and Wikidata lists its districts (khet) as settlements of their own." },
};

export { INSIDE_AREAS, INSIDE_SUBDIVISIONS, METRO_LINKS, OECD_AREAS };
