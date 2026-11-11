---
title: Use the cities
section: how-to
order: 18
description: Load the world's cities in tiers, look one up by id, list a country's, and find the city nearest to a point.
---

The cities come in tiers, so a page pays only for what it uses. `capitals` holds every capital of any size; `1m` (a million people or more), `100k` (100,000 or more) and `15k` (15,000 or more) hold every city of that many people, capitals too, so a capital can be in two tiers; `citySet` keeps a city once. A country has exactly one national capital; another seat of government (Cape Town, Kyoto) is `"alternate"`, and the capital of a subdivision is `"subdivision"`. `docs/cities.md` counts what is in each tier and what is missing, and the README's entry table gives each size.

| Import | Holds |
| --- | --- |
| `@johnmorrisdotca/kuni/cities/capitals` | every capital, of a country or of a subdivision |
| `@johnmorrisdotca/kuni/cities/1m` | the cities of a million people or more |
| `@johnmorrisdotca/kuni/cities/100k` | the cities of 100,000 or more |
| `loadCities("15k")` | the cities of 15,000 or more, made from the countries' own files (all of them are fetched) |
| `@johnmorrisdotca/kuni/cities/<code>` | one country's cities, every tier together (`/cities/jp`) |
| `@johnmorrisdotca/kuni/cities` | the lookups: `citySet`, `loadCities`, `citiesOf`, `cityById` |
| `@johnmorrisdotca/kuni/places` | `continents()`, `countriesOf(continent)` and `searchPlaces(text)`, for a chooser |

## Join tiers and look things up

```js
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
```

`citySet` takes any lists of cities and builds the lookups once: `byId`, `inCountry`, `inSubdivision`, `nearest(point)` and `within(point, km)`. A point is any `{ lat, lon }`, a city included. `nearest` answers the city and how far it is, in kilometres on a sphere of the earth's mean radius; `maxKm`, `minPopulation` and `country` narrow it. For a "you are here" marker, give `nearest` the position and a `minPopulation`, so a village does not win over the town beside it.

`cityById("Q90")` finds one city by its id, loading the tiers one at a time, the capitals first, until it is found. `loadCities("capitals", "1m")` imports the tiers when they are asked for and joins them, so a map can show the capitals first and fetch the great cities when it is zoomed in. `citiesOf(code)` imports one country's cities, every tier together, and nothing of any other country.

## What a chooser asks

`continents()` lists the seven continents with their names in English and Japanese, and `countriesOf("AS")` the countries of one, both from kuni's groupings. `searchPlaces(text, { lang, limit })` finds countries and cities by what somebody typed, in English, Japanese or the place's own language, with case, accents and kana folded, ranked by the whole name, the start of it, the start of a word, then anywhere, and by population among equals. By default it looks in the capitals and the cities of 100,000 or more; `tiers` names others (`"15k"` fetches every country's file) and `country` searches one country's cities, every tier, on their own. `lang` is the language of each hit's `label`. Kuni draws nothing: a page builds its own chooser on these.

## What a city holds

```ts
import type { City } from "@johnmorrisdotca/kuni/cities";
```

- `id`: the Wikidata item (`"Q90"` for Paris), or `"ne:<number>"` for a place only Natural Earth has. It never changes between releases; an id that was merged into another city still answers, with that city.
- `name`: `en`, and `ja` and `native` where a source has them. A missing one is absent, never an English name copied in. `jaShort` is the short Japanese name for a map label (東京 for 東京都, 大阪 for 大阪市), wherever `ja` is. `nativeLanguage` is the code of `native`.
- `continent` (`"AS"`, `"EU"`, ...), `country` (ISO 3166-1 alpha-2, two capital letters), `lat`, `lon`, and `subdivision` (the ISO 3166-2 code of its first-level subdivision, or `null`).
- `population` and `populationDate` (a year, or a day), `null` where no source has a figure.
- `capital` (`"national"`, `"alternate"`, `"subdivision"` or `null`) and `capitalOf`, the codes it is the capital of (never empty for a capital).
- `metro`: the urban area the city heads, `{ id, name, population, populationDate, estimated }`, or `null`. One source for each country: Statistics Canada's census metropolitan areas in Canada (1 July 2025), the Census Bureau's statistical areas in the United States (1 July 2024), the OECD's functional urban areas in its other members, Natural Earth's urban population in China, and Wikidata's metropolitan areas elsewhere (`estimated: true`, as Natural Earth's). Every list ranks a city by this figure where it has one, else by its own `population`.
- `inMetroOf`: the id of the city whose area this one lies inside, where it heads none (Mississauga and Brampton are in Toronto's), else `null`. Such a city comes after every city that heads an area, so the first ten or twenty of a country are its major cities.
- `source`: which input each of the point, the population and the Japanese name came from, `"wikidata"`, `"natural-earth"` or, for the few Japanese names written for this package, `"kuni"`. Wikidata's Japanese name is always preferred; Natural Earth's fills only where Wikidata has none.

`id`, `name`, `continent`, `country`, `lat`, `lon`, `population` and `capital` are the fields a page needs to keep a place; everything else is there to draw it well.

## Where it comes from

Wikidata (CC0) is the first source, asked by hand with `pnpm data:cities` and never on a timer; the day it was read is `CITIES_READ` in every tier. Natural Earth's populated places (public domain) fill a Japanese name, a population or a point Wikidata has not got, and give the cities Wikidata has no item for. Neither asks for credit; both are credited in `NOTICE.md`. No Wikipedia text is used, and no share-alike data.
