// Makes the four tiers of /cities from the two inputs data-sources/ holds: the Wikidata snapshot
// (wikidata-cities-<day>.json, scripts/fetch-cities.ts) and Natural Earth's populated places
// (natural-earth-populated-places-<version>.json). The choices:
//
//   - A city is a Wikidata item. A Natural Earth place joins it through the place's WIKIDATAID; one with none is
//     matched to a Wikidata item of its country within 15 km that has the same name, and is otherwise left out.
//   - Wikidata's fact is kept where it has one. Natural Earth fills the Japanese name, the population and the point
//     where Wikidata has none, and says so in the row's source bits. Natural Earth's capital class adds a capital
//     where Wikidata names none.
//   - The population is the best-ranked statement of the latest day; of statements with no day, the largest.
//   - The subdivision is the first-level one (kuni's own list of ISO 3166-2 codes) among the codes of the places the
//     city is in; the others, and codes kuni does not list, are not kept.
//   - Capitals: a country has exactly one national capital (Natural Earth's "Admin-0 capital" among the items that are a
//     capital of it, else the most populous Wikidata names); the others, and Natural Earth's "Admin-0 capital alt", are
//     alternates. A capital of a subdivision needs an ISO 3166-2 code kuni lists. Every capital says what it is the capital of.
//   - One city once: two items of one name within 15 km, one of them of 100,000 people or more, are one city.
//   - Tiers: `capitals` holds every capital of any size; `1m`, `100k` and `15k` hold every city (capitals too) of that
//     many people. A city with no population that is not a capital is left out.
//   - Names: English is Wikidata's label, else Natural Earth's English name. A city with neither is left out.
//   - The native name is the label in the country's official language (P37), with Wikidata's native label (P1705) only
//     as the fallback (scripts/fetch-cities.ts chooses it); it is `null` where it is the English name.

import type { CityRow } from "../src/city-rows.ts";

type TierName = "capitals" | "1m" | "100k" | "15k";

// [item number, en, ja, native, native language, point, country, populations, subdivision codes, capital codes]
type WikidataItem = [number, string | null, string | null, string | null, string | null, [number, number] | null, string | null, [number, string | null][], string[], string[]];
interface CitiesSnapshot {
  read: string;
  floor: number;
  counts: Record<string, number>;
  items: WikidataItem[];
}
// [item, NAME, NAME_EN, NAME_JA, latitude, longitude, POP_MAX, FEATURECLA, ISO_A2, NE_ID]
type NePlace = [string | null, string, string | null, string | null, number, number, number | null, string, string | null, number | null];
interface NaturalEarthFile {
  release: string;
  places: NePlace[];
}

interface Report {
  read: string;
  neRelease: string;
  tiers: Record<TierName, { cities: number; ja: number; jaFromNaturalEarth: number; populationFromNaturalEarth: number }>;
  total: number;
  wikidataItems: number;
  naturalEarthPlaces: number;
  naturalEarthJoined: number;
  naturalEarthToArea: number;
  naturalEarthMatchedByPlace: number;
  naturalEarthOnly: number;
  naturalEarthLeftOut: { noItemNoMatch: number; noCountry: number; belowFloor: number };
  leftOut: { noName: number; noPoint: number; noCountry: number; noPopulation: number; belowFloor: number; area: number; duplicate: number; township: number };
  /** Each civil township left out, by its id, and the city that holds most of its people, which its id answers with. */
  townshipCities: Record<string, string>;
  capitals: { national: number; alternate: number; subdivision: number; droppedWithoutCode: number };
  jaFromNaturalEarth: number;
  populationFromNaturalEarth: number;
  withoutJa: number;
  withoutNative: number;
  withoutSubdivision: number;
}

const FLOOR = 15000;
// Japanese names written for this package, each with its reason: a Wikidata label that names another place than the item is.
// A city with one is marked in its row (source bit 8), so that its `source.ja` says "kuni".
const JA_NAMES: Readonly<Record<string, { ja: string; why: string }>> = {
  Q212938: { ja: "東エルサレム", why: "East Jerusalem: Wikidata's Japanese label is エルサレム, which names the whole city; the standard Japanese for the eastern part is 東エルサレム." },
};
// Wikidata's human settlements include the areas around cities and the units that hold them. An item that no capital and
// no Natural Earth place stands behind, and whose English label names one of those, is not a city.
const AREA_WORDS = /\b(metropolitan (area|region|municipality|statistical area)|urban (area|agglomeration|region)|agglomeration|conurbation|built-up area|micropolitan)\b/i;
const AREA_UNIT = /\b(Province|County|Prefecture|Governorate|District|district|Regency|Oblast|Department|Municipality)$|^(County|Province|District|Municipality|City) of |^Greater (?!Sudbury$|Napanee$|Noida$)|\s(#|No\. )?\d{1,3}(, \d+)?$/;
// Regions, urban corridors, planned zones and the units round a city under a name of their own: "Metropolitan Toronto",
// "Metro Manila", "Metropolis of Lyon", "Øresund Region", "Kurdistan Region of Iraq", "North East State of Somalia",
// "Podgorica Capital City", "Commune Mutimbuzi", "Sectorul Botanica" (Chișinău), "Front Range Urban Corridor", "Binhai New Area". A name with a comma is a town told
// apart by the region it is in ("Paxtaobod, Andijan Region") and stays.
const AREA_REGION = /^(Metropolitan|Metro) |^Metropolis of |^Commune( of)? |^Sectorul |\bRegional Municipality\b|\bRegion( of [^,]+)?$|\bState of \b|\bCapital City$|\bUrban Corridor$|\bNew Area$/;
// The units below a district in South Asia, Russia, China, Kenya and West Africa, and a few above: "Gazipur Sadar Upazila",
// "Pattan Tehsil", "Porokhovye Municipal Okrug", "Tengyue Subdistrict", "Kangemi Ward", "Bangabari Union", "Yeumbeul
// Arrondissement", "Wrexham County Borough", "Shomron Regional Council". A word alone ("Union", New Jersey) is a town's
// name and stays. Townships are not here: in much of the United States a township is the municipality people live in.
const AREA_SUBUNIT = /\S\s(Upazila|Upazilla|Thana|Tehsil|Tahsil|Taluka|Taluk|Municipal Okrug|Subdistrict|Sub-district|Ward|Union|Arrondissement|County Borough|Regional Council|Commune)$/;
const AREA_NAME = { test: (name: string): boolean => AREA_WORDS.test(name) || AREA_UNIT.test(name) || (!name.includes(",") && (AREA_REGION.test(name) || AREA_SUBUNIT.test(name))) };
// The states where a township is a civil unit of its county with cities inside it, rather than a municipality.
const CIVIL_TOWNSHIP_STATES: ReadonlySet<string> = new Set(["US-IA", "US-IL", "US-IN", "US-KS", "US-MO", "US-ND", "US-NE", "US-SD"]);
// Items that are no city though nothing in their name says so, each with its reason; left out like an area.
const NOT_CITIES: Readonly<Record<string, string>> = {
  Q103927888: "Moro, Papua New Guinea: Wikidata gives it 6,310,129 people, most of the country's; no city there is near that size.",
};
const RADIANS = Math.PI / 180;
const km = (a: [number, number], b: [number, number]): number => {
  const half = Math.sin(((b[0] - a[0]) * RADIANS) / 2) ** 2 + Math.cos(a[0] * RADIANS) * Math.cos(b[0] * RADIANS) * Math.sin(((b[1] - a[1]) * RADIANS) / 2) ** 2;

  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(half)));
};
const simple = (text: string): string => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const rounded = (value: number): number => Math.round(value * 10000) / 10000;

// The population Wikidata gives: the latest day's, else the largest of those with no day.
const populationOf = (pops: [number, string | null][]): { value: number; day: string | null } | null => {
  if (pops.length === 0) return null;
  const dated = pops.filter(([, day]) => day !== null).sort((a, b) => (a[1]! < b[1]! ? 1 : a[1]! > b[1]! ? -1 : b[0] - a[0]));
  const pick = dated[0] ?? [...pops].sort((a, b) => b[0] - a[0])[0]!;

  return { value: pick[0], day: pick[1] };
};

// "2020-01-01" is kept as the year 2020; any other day as it is. Years before 1000 and days of no use are dropped.
const dateOf = (day: string | null): number | string | null => {
  if (day === null || !/^\d{4}-\d\d-\d\d$/.test(day)) return null;

  return day.endsWith("-01-01") ? Number(day.slice(0, 4)) : day;
};

interface Candidate {
  number: number | string;
  en: string;
  ja: string | null;
  native: string | null;
  nativeLanguage: string | null;
  point: [number, number];
  country: string;
  population: number | null;
  populationDate: number | string | null;
  subdivision: string | null;
  codes: string[];
  neKind: string | null;
  sources: number;
  viaPlace: boolean;
}

const buildCities = (input: { snapshot: CitiesSnapshot; naturalEarth: NaturalEarthFile; levels: ReadonlyMap<string, number>; countries: ReadonlySet<string>; subdivisions?: ReadonlySet<string>; capitalNames?: ReadonlyMap<string, string> }): { rows: CityRow[]; tiers: Record<TierName, CityRow[]>; report: Report } => {
  const { snapshot, naturalEarth, levels, countries } = input;
  // Every ISO 3166-2 code kuni lists, at any level, for the codes a capital is the capital of.
  const known = input.subdivisions ?? new Set(levels.keys());
  const emptyStats = () => ({ cities: 0, ja: 0, jaFromNaturalEarth: 0, populationFromNaturalEarth: 0 });
  const report: Report = {
    read: snapshot.read,
    neRelease: naturalEarth.release,
    tiers: { capitals: emptyStats(), "1m": emptyStats(), "100k": emptyStats(), "15k": emptyStats() },
    total: 0,
    wikidataItems: snapshot.items.length,
    naturalEarthPlaces: naturalEarth.places.length,
    naturalEarthJoined: 0,
    naturalEarthToArea: 0,
    naturalEarthMatchedByPlace: 0,
    naturalEarthOnly: 0,
    naturalEarthLeftOut: { noItemNoMatch: 0, noCountry: 0, belowFloor: 0 },
    leftOut: { noName: 0, noPoint: 0, noCountry: 0, noPopulation: 0, belowFloor: 0, area: 0, duplicate: 0, township: 0 },
    townshipCities: {},
    capitals: { national: 0, alternate: 0, subdivision: 0, droppedWithoutCode: 0 },
    jaFromNaturalEarth: 0,
    populationFromNaturalEarth: 0,
    withoutJa: 0,
    withoutNative: 0,
    withoutSubdivision: 0,
  };

  const wikidata = new Map<string, WikidataItem>(snapshot.items.map((item) => [`Q${item[0]}`, item]));
  const ne = new Map<string, NePlace>();
  const unmatched: NePlace[] = [];
  // The items of each country, and the one of them a place names by its own name within 15 km (not an area or a unit).
  const byCountry = new Map<string, WikidataItem[]>();
  for (const item of snapshot.items) if (item[6] !== null) byCountry.set(item[6], [...(byCountry.get(item[6]) ?? []), item]);
  const sameCity = (place: NePlace, cityOnly: boolean): WikidataItem | undefined => {
    const names = [place[1], place[2]].flatMap((name) => (name === null ? [] : [simple(name)]));

    return (place[8] === null ? [] : (byCountry.get(place[8]) ?? [])).find(
      (item) => item[5] !== null && km(item[5], [place[4], place[5]]) < 15 && [item[1], item[2]].some((name) => name !== null && names.includes(simple(name))) && !(cityOnly && item[1] !== null && AREA_NAME.test(item[1])),
    );
  };
  for (const place of naturalEarth.places) {
    const item = place[0] === null ? undefined : wikidata.get(place[0]);
    // A place whose item is an area or a unit (Jamalpur pointing at Jamalpur District) while the snapshot also holds the
    // city of that name beside it is matched to the city, and the area is left out. Where there is no such city (Kristiansand
    // Municipality is the only item for Kristiansand) the place keeps its item.
    if (item !== undefined && item[9].length === 0 && item[1] !== null && AREA_NAME.test(item[1])) {
      const city = sameCity(place, true);
      if (city !== undefined && city !== item) {
        unmatched.push(place);
        report.naturalEarthToArea += 1;
        continue;
      }
    }
    if (place[0] !== null && wikidata.has(place[0])) {
      // Two places naming one item: the more populous is kept.
      const other = ne.get(place[0]);
      if (other === undefined || (place[6] ?? 0) > (other[6] ?? 0)) ne.set(place[0], place);
      report.naturalEarthJoined += 1;
    } else unmatched.push(place);
  }
  // The places with no item of Wikidata's: matched to a city of the same country, near and of the same name.
  const only: NePlace[] = [];
  for (const place of unmatched) {
    const found = sameCity(place, false);
    if (found === undefined) only.push(place);
    else if (!ne.has(`Q${found[0]}`)) {
      ne.set(`Q${found[0]}`, place);
      report.naturalEarthMatchedByPlace += 1;
    }
  }

  // 1. Every item that could be a city, with what the tiers and the capitals are decided from.
  const candidates: Candidate[] = [];
  for (const item of snapshot.items) {
    const [number, enLabel, jaLabel, nativeLabel, nativeLanguage, wikidataPoint, wikidataCountry, pops, subs, capitalCodes] = item;
    const place = ne.get(`Q${number}`);
    const en = enLabel ?? place?.[2] ?? place?.[1] ?? null;
    if (en === null) {
      report.leftOut.noName += 1;
      continue;
    }
    const point = wikidataPoint ?? (place === undefined ? null : ([place[4], place[5]] as [number, number]));
    if (point === null) {
      report.leftOut.noPoint += 1;
      continue;
    }
    const country = wikidataCountry ?? (place?.[8] != null && countries.has(place[8]) ? place[8] : null);
    if (country === null || !countries.has(country)) {
      report.leftOut.noCountry += 1;
      continue;
    }
    // An item named for an area or a unit, with no capital or Natural Earth place behind it, is not a city.
    if ((place === undefined && capitalCodes.length === 0 && AREA_NAME.test(en)) || NOT_CITIES[`Q${number}`] !== undefined) {
      report.leftOut.area += 1;
      continue;
    }
    const wikidataPopulation = populationOf(pops);
    const population = wikidataPopulation?.value ?? place?.[6] ?? null;
    // Natural Earth's Japanese name is used only where it is not hiragana for a place outside Japan (うーんルワバ for Umm Ruwaba): a sign of a machine's guess.
    const neJa = place?.[3] != null && (country === "JP" || !/\p{Script=Hiragana}/u.test(place[3])) ? place[3] : null;
    const written = JA_NAMES[`Q${number}`]?.ja ?? null;
    const ja = written ?? jaLabel ?? neJa;
    const native = nativeLabel !== null && nativeLabel !== en ? nativeLabel : null;
    const subdivision = [...new Set(subs)].filter((code) => code.startsWith(`${country}-`) && levels.has(code)).sort((a, b) => levels.get(a)! - levels.get(b)! || (a < b ? -1 : 1))[0] ?? null;
    // Bit 1: the Japanese name is Natural Earth's; 2: the population is; 4: the point is; 8: the Japanese name is written for this package (JA_NAMES).
    const sources = (written !== null ? 8 : jaLabel === null && ja !== null ? 1 : 0) | (wikidataPopulation === null && population !== null ? 2 : 0) | (wikidataPoint === null ? 4 : 0);
    candidates.push({
      number,
      en,
      ja,
      native,
      nativeLanguage: native === null ? null : nativeLanguage,
      point,
      country,
      population,
      populationDate: wikidataPopulation === null ? null : dateOf(wikidataPopulation.day),
      subdivision,
      codes: capitalCodes.filter((code) => (code.includes("-") ? known.has(code) : countries.has(code))),
      neKind: place?.[7] ?? null,
      sources,
      viaPlace: place !== undefined,
    });
  }
  // The places only Natural Earth has: a city of its own, with an id that starts "ne:" and Natural Earth's own number.
  for (const place of only) {
    const [, name, nameEn, nameJa, lat, lon, pop, kind, iso, neId] = place;
    if (iso === null || !countries.has(iso) || neId === null) {
      report.naturalEarthLeftOut.noCountry += 1;
      continue;
    }
    candidates.push({ number: `ne:${neId}`, en: nameEn ?? name, ja: nameJa, native: null, nativeLanguage: null, point: [lat, lon], country: iso, population: pop, populationDate: null, subdivision: null, codes: [], neKind: kind, sources: (nameJa === null ? 0 : 1) | (pop === null ? 0 : 2) | 4, viaPlace: true });
  }

  // 1b. A civil township round a city is no city of its own. In the states where townships are units of a county that
  // incorporated cities lie inside (CIVIL_TOWNSHIP_STATES), a township is left out when a city that is not a township holds
  // at least half its people within 15 km: Kaw Township (Missouri), round Kansas City. Its id answers with that city, the
  // one of its own name where there is one (Rockford Township, Rockford), else the nearest in its state. Elsewhere a
  // township is the municipality people live in (Toms River, New Jersey; Clinton Township, Michigan) and stays.
  const idOf = (one: Candidate): string => (typeof one.number === "number" ? `Q${one.number}` : one.number);
  const townships = candidates.filter((one) => one.country === "US" && one.codes.length === 0 && / Township$/.test(one.en) && one.subdivision !== null && CIVIL_TOWNSHIP_STATES.has(one.subdivision));
  const gone = new Set<Candidate>();
  for (const township of townships) {
    const people = township.population ?? 0;
    const near = candidates.filter((one) => one !== township && one.subdivision === township.subdivision && !/ Township$/.test(one.en) && (one.population ?? 0) >= people * 0.5 && km(one.point, township.point) < 15);
    if (near.length === 0) continue;
    const base = simple(township.en.replace(/ (City )?Township$/, ""));
    const city = near.find((one) => simple(one.en) === base) ?? near.sort((a, b) => km(a.point, township.point) - km(b.point, township.point))[0]!;
    gone.add(township);
    report.townshipCities[idOf(township)] = idOf(city);
  }
  report.leftOut.township = gone.size;
  for (let at = candidates.length - 1; at >= 0; at -= 1) if (gone.has(candidates[at]!)) candidates.splice(at, 1);

  // 2. The same city under two items (Tokyo is Q1490 and Q7473516): one name, one country, within 15 km, one of them big. The
  // one kept is the one with a capital behind it, else Natural Earth's, else the most populous, else the lowest number.
  const rank = (one: Candidate): number[] => [one.codes.some((code) => !code.includes("-")) || one.neKind === "Admin-0 capital" ? 0 : 1, one.viaPlace ? 0 : 1, -(one.population ?? 0), typeof one.number === "number" ? one.number : Infinity];
  const better = (a: Candidate, b: Candidate): boolean => {
    const x = rank(a);
    const y = rank(b);
    for (let at = 0; at < x.length; at += 1) if (x[at] !== y[at]) return x[at]! < y[at]!;

    return false;
  };
  const dropped = new Set<Candidate>();
  const groups = new Map<string, Candidate[]>();
  for (const one of candidates) {
    const key = `${one.country}|${simple(one.en)}`;
    groups.set(key, [...(groups.get(key) ?? []), one]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const one of group) {
      for (const other of group) {
        if (one === other || dropped.has(one) || dropped.has(other) || km(one.point, other.point) >= 15 || Math.max(one.population ?? 0, other.population ?? 0) < 100000) continue;
        dropped.add(better(one, other) ? other : one);
      }
    }
  }
  report.leftOut.duplicate = dropped.size;
  const kept = candidates.filter((one) => !dropped.has(one));

  // 3. The capitals. A country has one national capital. The items Wikidata names as its capital (P36 of the country) are the
  // candidates, but not an item that is the capital of its own country (Djibouti is not the capital of Anguilla, though a
  // former country that held the code AI said so); only where Wikidata names none are Natural Earth's capitals of the country
  // the candidates. Among them the one is chosen that kuni's own list of countries names as the capital, else Natural Earth's
  // "Admin-0 capital", else the most populous. The other candidates are alternates. A capital of a subdivision needs the code of
  // one kuni lists. Every capital says what it is the capital of.
  const viaWikidata = new Map<string, Candidate[]>();
  const viaNaturalEarth = new Map<string, Candidate[]>();
  for (const one of kept) {
    for (const code of new Set(one.codes.filter((code) => !code.includes("-")))) viaWikidata.set(code, [...(viaWikidata.get(code) ?? []), one]);
    if (one.neKind === "Admin-0 capital" || one.neKind === "Admin-0 capital alt") viaNaturalEarth.set(one.country, [...(viaNaturalEarth.get(one.country) ?? []), one]);
  }
  const ownCapital = (one: Candidate): boolean => (viaWikidata.get(one.country) ?? []).includes(one);
  const nationalOf = new Map<string, Candidate>();
  const alternates = new Map<Candidate, Set<string>>();
  for (const code of new Set([...viaWikidata.keys(), ...viaNaturalEarth.keys()])) {
    let list = (viaWikidata.get(code) ?? []).filter((one) => one.country === code || !ownCapital(one));
    if (list.length === 0) list = viaNaturalEarth.get(code) ?? [];
    if (list.length === 0) continue;
    const name = input.capitalNames?.get(code);
    const named = name === undefined ? [] : list.filter((one) => simple(one.en) === simple(name));
    const main = list.filter((one) => one.neKind === "Admin-0 capital");
    const pool = named.length > 0 ? named : main.length > 0 ? main : list;
    const chosen = [...pool].sort((a, b) => (b.population ?? 0) - (a.population ?? 0) || (typeof a.number === "number" ? a.number : Infinity) - (typeof b.number === "number" ? b.number : Infinity))[0]!;
    nationalOf.set(code, chosen);
    for (const one of list) if (one !== chosen) alternates.set(one, new Set([...(alternates.get(one) ?? []), code]));
  }

  const rows: CityRow[] = [];
  for (const one of kept) {
    const national = [...nationalOf].filter(([, chosen]) => chosen === one).map(([code]) => code);
    const alternate = [...(alternates.get(one) ?? [])].filter((code) => nationalOf.get(code) !== one);
    const subdivisionCodes = one.codes.filter((code) => code.includes("-"));
    const subdivisionCapital = subdivisionCodes.length > 0 ? subdivisionCodes : [];
    let capital: 0 | 1 | 2 | 3 = 0;
    let capitalOf: string[] = [];
    if (national.length > 0) {
      capital = 1;
      capitalOf = national;
      report.capitals.national += 1;
    } else if (alternate.length > 0) {
      capital = 3;
      capitalOf = [...alternate, ...subdivisionCapital];
      report.capitals.alternate += 1;
    } else if (subdivisionCapital.length > 0) {
      capital = 2;
      capitalOf = subdivisionCapital;
      report.capitals.subdivision += 1;
    } else if (one.neKind !== null && /^Admin-1 (region )?capital$|^Admin-0 region capital$/.test(one.neKind)) {
      // Natural Earth calls it the capital of a subdivision but names none kuni lists: not a capital here.
      report.capitals.droppedWithoutCode += 1;
    }
    const population = one.population;
    if (capital === 0 && (population === null || population < FLOOR)) {
      if (population === null) report.leftOut.noPopulation += 1;
      else report.leftOut.belowFloor += 1;
      continue;
    }
    // The national capital of a territory with a code of its own (Gibraltar, GI) is in that country, whatever Wikidata's P17 says (GB).
    const country = capital === 1 && !national.includes(one.country) ? national[0]! : one.country;
    const subdivisionOf = country === one.country ? one.subdivision : null;
    rows.push([one.number, rounded(one.point[0]), rounded(one.point[1]), population, one.populationDate, country, subdivisionOf, one.en, one.ja, one.native, one.native === null ? null : one.nativeLanguage, capital, capitalOf.length === 0 ? null : [...new Set(capitalOf)].sort().join(" "), one.sources]);
  }
  report.naturalEarthOnly = rows.filter((row) => typeof row[0] === "string").length;
  rows.sort((a, b) => (b[3] ?? 0) - (a[3] ?? 0) || String(a[0]).localeCompare(String(b[0]), "en", { numeric: true }));

  // 4. The tiers: every capital of any size; and by population, every city (capitals included) in the range.
  const tiers: Record<TierName, CityRow[]> = { capitals: [], "1m": [], "100k": [], "15k": [] };
  for (const row of rows) {
    const population = row[3] ?? 0;
    const names: TierName[] = [...(row[11] !== 0 ? (["capitals"] as const) : []), ...(population >= 1000000 ? (["1m"] as const) : population >= 100000 ? (["100k"] as const) : population >= FLOOR ? (["15k"] as const) : [])];
    for (const name of names) {
      tiers[name].push(row);
      const stats = report.tiers[name];
      stats.cities += 1;
      if (row[8] !== null) stats.ja += 1;
      if (row[13] & 1) stats.jaFromNaturalEarth += 1;
      if (row[13] & 2) stats.populationFromNaturalEarth += 1;
    }
    report.total += 1;
    if (row[13] & 1) report.jaFromNaturalEarth += 1;
    if (row[13] & 2) report.populationFromNaturalEarth += 1;
    if (row[8] === null) report.withoutJa += 1;
    if (row[9] === null) report.withoutNative += 1;
    if (row[6] === null) report.withoutSubdivision += 1;
  }

  return { rows, tiers, report };
};

// ----- Writing -----------------------------------------------------------------------------------------

const TIER_FILES: Record<TierName, { fn: string; constant: string; what: string; file: boolean }> = {
  capitals: { fn: "capitalCities", constant: "CAPITAL_CITY_ROWS", what: "every capital, of a country or of a subdivision, of any size", file: true },
  "1m": { fn: "cities1m", constant: "CITY_1M_ROWS", what: "the cities of a million people or more (capitals too)", file: true },
  "100k": { fn: "cities100k", constant: "CITY_100K_ROWS", what: "the cities of 100,000 to a million people (capitals too)", file: true },
  "15k": { fn: "cities15k", constant: "CITY_15K_ROWS", what: "the cities of 15,000 to 100,000 people (capitals too); from the countries' own files, not a file of its own", file: false },
};

// The files of one tier: the data (src/data/cities-<tier>.data.ts) and the entry (src/cities/<tier>.ts).
const cityFiles = (tier: TierName, rows: CityRow[], read: string, neRelease: string): { data: string; entry: string } => {
  const { fn, constant, what } = TIER_FILES[tier];
  const first = rows[0]!;
  const data = `// Generated by scripts/build-data.ts. Do not edit by hand: change the script or its inputs and run pnpm data.
// The ${rows.length.toLocaleString("en-US")} cities of the tier ${tier}: ${what}. src/city-rows.ts says what the columns are.
// Source: Wikidata (CC0), the snapshot data-sources/wikidata-cities-${read}.json
// Source: Natural Earth ${neRelease} 10m Populated Places (public domain), data-sources/natural-earth-populated-places-${neRelease}.json: what Wikidata lacks, and the capital class

import type { CityRow } from "../city-rows";

const ${constant}: readonly CityRow[] = [
${rows.map((row) => `  ${JSON.stringify(row)},`).join("\n")}
];

export { ${constant} };
`;
  const name = first[7];
  const entry = `// The entry @johnmorrisdotca/kuni/cities/${tier}: ${what}. Written by scripts/build-data.ts. The core,
// @johnmorrisdotca/kuni/cities, joins this tier with the others and answers the lookups.

import { expandCities } from "../city-rows";
import type { City } from "../city-rows";
import { ${constant} } from "../data/cities-${tier}.data";

let table: readonly City[] | null = null;

/**
 * The cities of the tier \`${tier}\`: ${what}. ${rows.length.toLocaleString("en-US")} of them, the most populous first, each a frozen object; the list is made on the first call and shared.
 *
 * @returns The list. Join it with other tiers through \`citySet\` in @johnmorrisdotca/kuni/cities.
 * @example
 * \`\`\`ts
 * import { ${fn} } from "@johnmorrisdotca/kuni/cities/${tier}";
 *
 * console.log(${fn}().length > 0);          // true
 * console.log(${fn}()[0].name.en);          // ${JSON.stringify(name)}
 * console.log(${fn}()[0].id);               // ${JSON.stringify(`Q${first[0]}`)}
 * console.log(${fn}()[0].country);          // ${JSON.stringify(first[5])}
 * \`\`\`
 */
const ${fn} = (): readonly City[] => {
  if (table === null) table = expandCities(${constant});

  return table;
};

/**
 * The day the Wikidata snapshot of the cities was read: every name and figure in the cities is as Wikidata gave it on this day (Natural Earth's, ${neRelease}, are as that release has them).
 *
 * @example
 * \`\`\`ts
 * import { CITIES_READ } from "@johnmorrisdotca/kuni/cities/${tier}";
 *
 * console.log(CITIES_READ);  // ${JSON.stringify(read)}
 * \`\`\`
 */
const CITIES_READ = ${JSON.stringify(read)};

export { CITIES_READ, ${fn} };
export type { City };
`;

  return { data, entry };
};

// One country's cities, every tier together, the most populous first: src/data/cities-by-country/<code>.data.ts and the
// entry src/cities/<code>.ts, which the picker (and anything that wants one country) loads on its own.
const countryCityFiles = (alpha2: string, rows: CityRow[], englishName: string): { data: string; entry: string } => {
  const code = alpha2.toLowerCase();
  const data = `// Generated by scripts/build-data.ts. Do not edit by hand: change the script or its inputs and run pnpm data.
// The ${rows.length.toLocaleString("en-US")} cities of ${englishName} (${alpha2}), every tier together, the most populous first. src/city-rows.ts says what the columns are.
// Source: Wikidata (CC0) and Natural Earth (public domain), as src/data/cities-capitals.data.ts says

import type { CityRow } from "../../city-rows";

const ${alpha2}: readonly CityRow[] = [
${rows.map((row) => `  ${JSON.stringify(row)},`).join("\n")}
];

export { ${alpha2} };
`;
  const entry = `// Generated by scripts/build-data.ts. Do not edit by hand.
// The entry @johnmorrisdotca/kuni/cities/${code}: the ${rows.length.toLocaleString("en-US")} cities of ${englishName}, every tier together, as a list.

import { ${alpha2} } from "../data/cities-by-country/${code}.data";
import { expandCities } from "../city-rows";
import type { City } from "../city-rows";

/**
 * The cities of ${englishName} in every tier (the capitals and the cities of 15,000 people or more): ${rows.length.toLocaleString("en-US")}, the most populous first. Also the default export.
 *
 * @example
 * \`\`\`ts
 * import cities from "@johnmorrisdotca/kuni/cities/${code}";
 *
 * console.log(cities.length);      // ${rows.length}
 * console.log(cities[0].name.en);  // ${JSON.stringify(rows[0]![7])}
 * console.log(cities[0].country);  // ${JSON.stringify(alpha2)}
 * \`\`\`
 */
const CITIES: readonly City[] = expandCities(${alpha2});

export default CITIES;
export { CITIES };
`;

  return { data, entry };
};

// The loaders: one dynamic import for each country that has cities, so a bundler makes a chunk of each.
const cityLoaders = (codes: string[]): string => `// Generated by scripts/build-data.ts. Do not edit by hand: change the script or its inputs and run pnpm data.
// One dynamic import for each of the ${codes.length} countries with cities, so a bundler makes a chunk of each.

import type { City } from "../city-rows";

type Loader = () => Promise<{ CITIES: readonly City[] }>;

const CITY_LOADERS: Readonly<Record<string, Loader>> = {
${codes.map((code) => `  ${code}: () => import("../cities/${code}.js"),`).join("\n")}
};

export { CITY_LOADERS };
`;

// src/data/city-index.data.ts: the country of each city that no tier file holds (no capital, under 100,000 people), so that
// cityById fetches that one country's file instead of every one. Each country's Wikidata numbers, sorted, written as the
// gap from the one before in base 36 with commas between; an "ne:<number>" id is written "~" and its number in base 36.
const cityIndex = (rows: readonly CityRow[]): string => {
  const byCountry = new Map<string, { items: number[]; ne: number[] }>();
  for (const row of rows) {
    if (row[11] !== 0 || (row[3] ?? 0) >= 100000) continue;
    const entry = byCountry.get(row[5]) ?? { items: [], ne: [] };
    if (typeof row[0] === "number") entry.items.push(row[0]);
    else entry.ne.push(Number(String(row[0]).slice(3)));
    byCountry.set(row[5], entry);
  }
  const lines = [...byCountry.keys()].sort().map((code) => {
    const { items, ne } = byCountry.get(code)!;
    const sorted = [...items].sort((a, b) => a - b);
    const gaps = sorted.map((value, at) => (value - (at === 0 ? 0 : sorted[at - 1]!)).toString(36));

    return `  ${code.toLowerCase()}: ${JSON.stringify([...gaps, ...ne.sort((a, b) => a - b).map((value) => `~${value.toString(36)}`)].join(","))},`;
  });

  return `// Generated by scripts/build-data.ts. Do not edit by hand: change the script or its inputs and run pnpm data.
// The country of each city no tier file holds, for cityById: per country, its Wikidata numbers sorted and written as the
// gap from the one before in base 36, commas between; "~" and a number in base 36 for an id "ne:<number>".

const CITY_INDEX: Readonly<Record<string, string>> = {
${lines.join("\n")}
};

export { CITY_INDEX };
`;
};

// docs/cities.md: what the tiers hold, where each fact came from, and what is missing.
const citiesDoc = (report: Report, snapshot: CitiesSnapshot, naturalEarth: NaturalEarthFile): string[] => {
  const percent = (part: number, whole: number): string => (whole === 0 ? "0%" : `${((part / whole) * 100).toFixed(1)}%`);
  const n = (value: number): string => value.toLocaleString("en-US");
  const names = Object.keys(report.tiers) as TierName[];
  const lines = [
    "# The cities: what is known",
    "",
    "Written by `scripts/build-data.ts` from `scripts/cities.ts`; do not edit it by hand. Every figure here is counted",
    `from the two inputs: the Wikidata snapshot of ${report.read} (CC0) and Natural Earth ${report.neRelease}'s 10m Populated Places (public domain).`,
    "",
    "## The tiers",
    "",
    "`capitals` holds every capital of any size; `1m`, `100k` and `15k` hold every city of that many people, capitals included, so a city can be in `capitals` and in one of the others. `citySet` keeps a city once.",
    "",
    "| Tier | Entry | Holds | Cities | With a Japanese name | Japanese name from Natural Earth | Population from Natural Earth |",
    "|---|---|---|---:|---:|---:|---:|",
    ...names.map((name) => {
      const stats = report.tiers[name];

      return `| \`${name}\` | ${TIER_FILES[name].file ? `\`@johnmorrisdotca/kuni/cities/${name}\`` : "`loadCities(\"15k\")`"} | ${TIER_FILES[name].what} | ${n(stats.cities)} | ${n(stats.ja)} (${percent(stats.ja, stats.cities)}) | ${n(stats.jaFromNaturalEarth)} | ${n(stats.populationFromNaturalEarth)} |`;
    }),
    `| every city once | | | ${n(report.total)} | ${n(report.total - report.withoutJa)} (${percent(report.total - report.withoutJa, report.total)}) | ${n(report.jaFromNaturalEarth)} | ${n(report.populationFromNaturalEarth)} |`,
    "",
    "## How a city is chosen",
    "",
    `- **Wikidata**: the items that are an instance of a human settlement (Q486972 and every class below it through P279), have coordinates (P625) and a best-ranked population (P1082) of ${n(snapshot.floor)} or more: ${n(snapshot.counts.candidates ?? 0)} items with that population and coordinates, of which ${n(snapshot.counts.settlements ?? 0)} are a city, town or other settlement (${n(snapshot.counts.areas ?? 0)} more are only a metropolitan area, urban area or conurbation, and are left out; the rest are districts, counties and the like); every item that is the current capital (P36) of a country or a subdivision; and every item Natural Earth's places name. The queries are written in the snapshot file itself.`,
    `- **Natural Earth**: ${n(report.naturalEarthPlaces)} places ("Historic place" left out). ${n(report.naturalEarthJoined)} name a Wikidata item (WIKIDATAID) that the snapshot holds; ${n(report.naturalEarthToArea)} name an item that is an area or a unit (Jamalpur naming Jamalpur District) and are matched again as if they named none; ${n(report.naturalEarthMatchedByPlace)} more were matched by position (within 15 km, same country, same name); the ${n(report.naturalEarthOnly + report.naturalEarthLeftOut.noCountry + report.naturalEarthLeftOut.belowFloor)} left have no Wikidata item here: ${n(report.naturalEarthOnly)} are cities of their own, with an id \`ne:<Natural Earth's number>\` (a capital, or 15,000 people or more); the others have no country, or are small and no capital, and are left out.`,
    "- **Which source wins**: Wikidata's label, point and population are kept where it has them. Natural Earth fills a Japanese name, a population or a point Wikidata does not have, and a capital where Wikidata names none; each city says which in its `source` field.",
    "- **Population**: the best-ranked statement of the latest day (P585); of statements with no day, the largest. Natural Earth's `POP_MAX` has no day.",
    "- **Subdivision**: the ISO 3166-2 code, from Wikidata's P300 on the city or the places it is in (P131), restricted to the first-level subdivisions kuni lists for its country; where there are several, the first in code order.",
    `- **Areas**: Wikidata's human settlements include areas of several cities and the units that hold them. An item that is only a metropolitan area, an urban area, a conurbation, an urban agglomeration or a built-up area (by its class) is left out when the snapshot is made, and so is one whose English name ends in Province, County, Prefecture, Governorate, District, Regency, Oblast or Department, or names an area (metropolitan area, urban area, agglomeration, conurbation), or starts 'County of', 'Province of', 'District of', 'Municipality of', 'City of' or 'Greater' (Greater Sudbury, Greater Napanee and Greater Noida are cities and stay), or ends in a number (Prague 5, Sector 3, Municipio 2: a numbered district), or starts 'Metropolitan', 'Metro', 'Metropolis of', 'Commune' or 'Sectorul' (Metropolitan Toronto, Metro Manila, the Metropolis of Lyon, Burundi's communes, Chișinău's sectors), or names a regional municipality or a 'State of' (North East State of Somalia), or ends in 'Region' or 'Region of …' (Øresund Region, Kurdistan Region of Iraq; a name with a comma, a town told apart by its region, stays), 'Capital City' (Podgorica Capital City, the unit round the city), 'Urban Corridor' or 'New Area' (Binhai New Area), or ends in a unit below a district (Upazila, Thana, Tehsil, Taluka, Municipal Okrug, Subdistrict, Ward, Union, Arrondissement, County Borough, Regional Council or Commune: Gazipur Sadar Upazila; the word alone, Union in New Jersey, is a town's name and stays), unless it is a capital or Natural Earth names it. A few items are left out by name, each with its reason (NOT_CITIES in scripts/cities.ts: Moro, Papua New Guinea, at 6.3 million people). In Iowa, Illinois, Indiana, Kansas, Missouri, Nebraska and the Dakotas a township is a civil unit of its county with cities inside it: one is left out where a city that is not a township holds at least half its people within 15 km (Kaw Township, round Kansas City), ${n(report.leftOut.township)} of them, each id answering with that city; elsewhere a township is the municipality people live in (Toms River, New Jersey; Clinton Township, Michigan) and stays. Some cities with such a name are lost; a city that Natural Earth names is kept.`,
    `- **Capitals**: a country has exactly one national capital (Natural Earth's "Admin-0 capital" among the items that are a capital of it, else the most populous Wikidata names): ${n(report.capitals.national)} cities are one. Another seat of government (Cape Town, Kyoto) is an \`alternate\` (${n(report.capitals.alternate)}); the capital of a subdivision needs an ISO 3166-2 code kuni lists (${n(report.capitals.subdivision)}), and Natural Earth's subdivision capitals with none (${n(report.capitals.droppedWithoutCode)}) are not capitals here. Every capital says what it is the capital of in \`capitalOf\`.`,
    "- **One city once**: two items with one name in one country within 15 km, one of them of 100,000 people or more, are one city; the one with a capital behind it, else Natural Earth's, else the more populous, is kept.",
    "- **Names**: English is Wikidata's label, else Natural Earth's; a city with neither is left out. Japanese is Wikidata's label (always preferred: it is curated by people), else Natural Earth's (not where it is written in hiragana for a place outside Japan, which marks a machine's guess), else `null`: never an English name copied in, and never made up; the few written for this package (`JA_NAMES` in `scripts/cities.ts`, each with its reason: East Jerusalem is 東エルサレム, not the whole city's エルサレム) say `kuni` as their source. The native name is the label in the country's official language (P37, language code P424; the first in code order that has a label, English left out), and Wikidata's native label (P1705, which often names a regional language: Kölle for Köln) only where there is none; it is `null` where it is the English name.",
    "",
    "## What was left out",
    "",
    `Of the ${n(report.wikidataItems)} items in the snapshot: ${n(report.leftOut.noName)} had no English name (in Wikidata or Natural Earth), ${n(report.leftOut.noPoint)} no coordinates, ${n(report.leftOut.noCountry)} no country, ${n(report.leftOut.noPopulation)} no population and were no capital, ${n(report.leftOut.area)} had an English name of an area or an administrative unit (a metropolitan area, an urban area, a province, a county, a district) and no capital or Natural Earth place behind them, ${n(report.leftOut.duplicate)} were the same city as another item (Tokyo is two), and ${n(report.leftOut.belowFloor)} fell below ${n(snapshot.floor)} people by the figure used (they were in because another statement was above it, or Natural Earth names them).`,
    "",
    "## What is missing",
    "",
    `- **Japanese name**: ${n(report.withoutJa)} of ${n(report.total)} cities have none, in either source; the field is \`null\`.`,
    `- **Native name**: ${n(report.withoutNative)} cities have none or it is the English name; the field is \`null\`.`,
    `- **Subdivision**: ${n(report.withoutSubdivision)} cities have none (Wikidata does not place them in a first-level subdivision kuni lists).`,
    "",
    `Natural Earth release ${naturalEarth.release}; Wikidata read ${snapshot.read}.`,
    "",
  ];

  return lines;
};

// The ids of cities never change: an id a past release had that this one does not must be in data-sources/city-id-aliases.json,
// either as the id of the city it was merged into or as null (removed, and answering nothing). Returns what is not.
const unresolvedIds = (released: readonly (number | string)[], current: ReadonlySet<string>, aliases: Record<string, string | null>): string[] => {
  const idOf = (id: number | string): string => (typeof id === "number" ? `Q${id}` : id);

  return released.map(idOf).filter((id) => !current.has(id) && !(id in aliases));
};

// src/data/city-aliases.data.ts: the old ids and the ids they answer with.
const cityAliases = (aliases: Record<string, string | null>, current: ReadonlySet<string>): string => {
  const pairs = Object.entries(aliases).filter(([, target]) => target !== null && current.has(target)).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }));

  return `// Generated by scripts/build-data.ts. Do not edit by hand: the aliases are in data-sources/city-id-aliases.json.
// The ids that were a city's in an earlier release and now answer with another city (merged), so that an id a page stored keeps working.

const CITY_ALIASES: Readonly<Record<string, string>> = {
${pairs.map(([old, target]) => `  ${JSON.stringify(old)}: ${JSON.stringify(target)},`).join("\n")}
};

export { CITY_ALIASES };
`;
};

export { buildCities, cityAliases, cityIndex, unresolvedIds, citiesDoc, cityFiles, cityLoaders, countryCityFiles, TIER_FILES };
export type { CitiesSnapshot, NaturalEarthFile, Report, TierName };
