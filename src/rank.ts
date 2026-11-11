// The figure a city is ranked by, apart from the city tables so that the core of /cities carries none of them.

import type { City } from "./city-rows";

/** The figure a city is ranked by: its metropolitan area's people where it has one, else its own. */
// The countries whose cities are ranked by an urban figure only, because a city's own is its whole municipality
// (Chongqing's 32 million): a city with no urban figure there is ranked after every city with one.
const URBAN_FIGURE_ONLY: ReadonlySet<string> = new Set(["CN"]);

const rankingPopulation = (city: Pick<City, "population" | "metro" | "inMetroOf" | "country">): number =>
  (city.inMetroOf !== null && city.inMetroOf !== undefined) || (city.metro === null && URBAN_FIGURE_ONLY.has(city.country)) ? (city.population ?? 0) - 1e12 : (city.metro?.population ?? city.population ?? 0);

export { rankingPopulation, URBAN_FIGURE_ONLY };
