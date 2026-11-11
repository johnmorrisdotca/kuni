// A city's metropolitan area set by name, where Wikidata has the area but links it to the city in none of the ways
// scripts/fetch-metros.ts asks: city item, area item, and the reason. scripts/fetch-metros.ts fetches these areas too, and
// scripts/cities.ts gives each city its area, as it would one Wikidata links.

const METRO_LINKS: Readonly<Record<string, { area: number; why: string }>> = {
  Q239: { area: 9005, why: "Brussels: the Brussels metropolitan area is linked to the Brussels-Capital Region, not to the City of Brussels." },
  Q1726: { area: 126281350, why: "Munich: the Munich metropolitan area (a functional urban area) is linked to no city." },
  Q2256: { area: 4916862, why: "Birmingham: the Birmingham metropolitan area is linked to no city; the West Midlands conurbation has no population." },
};

export { METRO_LINKS };
