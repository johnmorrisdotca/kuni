// The figure a city is ranked by, apart from the city tables so that the core of /cities carries none of them.

import type { City } from "./city-rows";

/** The figure a city is ranked by: its metropolitan area's people where it has one, else its own. */
const rankingPopulation = (city: Pick<City, "population" | "metro">): number => city.metro?.population ?? city.population ?? 0;

export { rankingPopulation };
