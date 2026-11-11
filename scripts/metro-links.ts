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
};

export { METRO_LINKS, OECD_AREAS };
