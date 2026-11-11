import { citySet, citiesOf } from "@johnmorrisdotca/kuni/cities";
import { countriesOf, searchPlaces } from "@johnmorrisdotca/kuni/places";
import { capitalCities } from "@johnmorrisdotca/kuni/cities/capitals";
import { cities1m } from "@johnmorrisdotca/kuni/cities/1m";

// Two tiers joined into one set: every capital, and the other cities of a million people or more.
const world = citySet(capitalCities(), cities1m());
const here = world.nearest({ lat: 48.8566, lon: 2.3522 });
console.log(here.city.name.en, here.city.country, Math.round(here.km) < 5);

// One country's cities on their own, as a place picker loads them when a country is chosen.
const japan = await citiesOf("JP");
console.log(japan.length > 100, citySet(japan).byId("Q1490")?.country);

// What a chooser asks: the countries of a continent, and what somebody typed, in Japanese if they like.
const found = await searchPlaces("パリ", { lang: "ja" });
console.log(countriesOf("OC").length > 10, found[0].label);
