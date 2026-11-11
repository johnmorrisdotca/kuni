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
import { METRO_LINKS } from "./metro-links.ts";
import { URBAN_FACTS } from "./urban-facts.ts";

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
  /** The cities that have a metropolitan area (CityRow's metro columns). */
  withMetro: number;
  /** Cities inside another city's urban area (Mississauga, in Toronto's), ranked after every city that heads one. */
  inMetroOf: number;
  /** Cities of China and India with no census urban figure, ranked after those with one. */
  withoutUrbanFigure: number;
  /** The urban areas of an official source that name no city kuni has. */
  areasUnmatched: string[];
  /** Each civil township and each unit or part of a city left out (step 1c), by its id, and the city its id answers with (null for none). */
  townshipCities: Record<string, string | null>;
  /** Units Natural Earth names with no city apart, kept as the town Natural Earth has (Yishui County as Yishui). */
  unitTowns: number;
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
// Japanese labels Wikidata gives a city that name another, larger place, each with its reason: dropped, so the city has
// no Japanese name until a right one is found, never one made up here.
const JA_WRONG: Readonly<Record<string, string>> = {
  Q983884: "Várzea Grande, Brazil: labelled マットグロッソ州, the state of Mato Grosso.",
  Q766974: "Qods, Iran: labelled テヘラン州, Tehran province.",
  Q1743479: "Kiryat Tiv'on, Israel: labelled ハイファ地区, the Haifa District.",
  Q14279699: "Jinhe Town, China: labelled 金平ミャオ族ヤオ族タイ族自治県, the Jinping Miao, Yao and Dai Autonomous County.",
  Q2026633: "East Meadow, New York: labelled ニューヨーク市, New York City.",
  Q11060772: "Pingdiquan Town, China: labelled 済寧, Jining.",
  Q10884943: "Ih Toli Gol, China: labelled 玉林, Yulin.",
  Q771214: "Hidalgo del Parral, Mexico: labelled チワワ州, the state of Chihuahua.",
  Q148849: "Żary, Poland: labelled ルブシュ県, the Lubusz Voivodeship.",
  Q105360: "Bor, Russia: labelled ニジニ・ノヴゴロド州, Nizhny Novgorod Oblast.",
  Q1117969: "Laranjal do Jari, Brazil: labelled アマパー州, the state of Amapá.",
  Q288287: "Al-Awamiyah, Saudi Arabia: labelled 東部州, the Eastern Province.",
  Q6315043: "Jurf Al Sakhar, Iraq: labelled バービル県, Babil Governorate.",
  Q1002638: "Rubio, Venezuela: labelled ベネズエラ, the country.",
  Q54154: "Revere, Massachusetts: labelled リビア, Libya.",
  Q482822: "Murray, Utah: labelled マリ, Mali.",
};
// Wikidata's human settlements include the areas around cities and the units that hold them. An item that no capital and
// no Natural Earth place stands behind, and whose English label names one of those, is not a city.
const AREA_WORDS = /\b(metropolitan (area|region|municipality|statistical area)|urban (area|agglomeration|region)|agglomeration|conurbation|built-up area|micropolitan)\b/i;
const AREA_UNIT = /\b(Province|County|Prefecture|Governorate|District|district|Regency|Oblast|Department|Municipality)$|^(County|Province|District|Municipality|City) of |^Greater (?!Sudbury$|Napanee$|Noida$)|\s(#|No\. )?\d{1,3}(, \d+)?$/;
// Regions, urban corridors, planned zones and the units round a city under a name of their own: "Metropolitan Toronto",
// "Metro Manila", "Metropolis of Lyon", "Øresund Region", "Kurdistan Region of Iraq", "North East State of Somalia",
// "Podgorica Capital City", "Commune Mutimbuzi", "Sectorul Botanica" (Chișinău), "Front Range Urban Corridor", "Binhai New Area". A name with a comma is a town told
// apart by the region it is in ("Paxtaobod, Andijan Region") and stays.
const AREA_REGION = /^(Metropolitan|Metro) |^(Euro)?[Mm]etropolis of |^Métropole |\sMétropole$|^Canton of |^Commune( of)? |^Sectorul |\bRegional Municipality\b|\bRegion( of [^,]+)?$|\bState of \b|\bCapital City$|\bUrban Corridor$|\bNew Area$/;
// The units below a district in South Asia, Russia, China, Kenya and West Africa, and a few above: "Gazipur Sadar Upazila",
// "Pattan Tehsil", "Porokhovye Municipal Okrug", "Tengyue Subdistrict", "Kangemi Ward", "Bangabari Union", "Yeumbeul
// Arrondissement", "Wrexham County Borough", "Shomron Regional Council". A word alone ("Union", New Jersey) is a town's
// name and stays. Townships are not here: in much of the United States a township is the municipality people live in.
const AREA_SUBUNIT = /\S\s(Upazila|Upazilla|Thana|Tehsil|Tahsil|Taluka|Taluk|Municipal Okrug|Subdistrict|Sub-district|Ward|Union|Arrondissement|County Borough|Regional Council|Commune)$/;
const AREA_NAME = { test: (name: string): boolean => AREA_WORDS.test(name) || AREA_UNIT.test(name) || (!name.includes(",") && (AREA_REGION.test(name) || AREA_SUBUNIT.test(name))) };
// The words that make a name a unit, not a town: at its end, after the name ("Yishui County", "Qatif governorate").
const UNIT_WORD = /\s(County|Subdistrict|Sub-district|Microdistrict|microdistrict|Raion|raion|Governorate|governorate|Territory|Region|region|Area|District|Municipality|municipality|Borough)$/;
// The states where a township is a civil unit of its county with cities inside it, rather than a municipality.
const CIVIL_TOWNSHIP_STATES: ReadonlySet<string> = new Set(["US-IA", "US-IL", "US-IN", "US-KS", "US-MO", "US-ND", "US-NE", "US-SD"]);
// Items that are no city though nothing in their name says so, each with its reason; left out like an area.
// A city's common English name where Wikidata's label is its formal one, with the reason.
const ENGLISH_NAMES: Readonly<Record<string, { en: string; why: string }>> = {
  Q125293: { en: "Puebla", why: "Heroica Puebla de Zaragoza is the formal name; Puebla is the name in English." },
  Q189128: { en: "León", why: "León de Los Aldama is the formal name; León is the name in English." },
  Q209034: { en: "Toluca", why: "Toluca de Lerdo is the formal name; Toluca is the name in English." },
};
// A population statement of Wikidata's that is wrong, left out: the item, the figure, and the reason.
const WRONG_POPULATIONS: Readonly<Record<string, { value: number; why: string }>> = {
  Q165995: { value: 750, why: "Malatya, Turkey: a figure of 750 for 2020, the city's being some 400,000; the 2012 figure is used." },
  Q2579193: { value: 450000, why: "Sirajganj, Bangladesh: a round 450,000 for 2020, the district town's; the town has some 170,000 people." },
};
const SEPARATE_CODES: Readonly<Record<string, string>> = { "CN-HK": "HK", "CN-MO": "MO", "CN-TW": "TW" };
const NOT_CITIES: Readonly<Record<string, string>> = {
  Q103927888: "Moro, Papua New Guinea: Wikidata gives it 6,310,129 people, most of the country's; no city there is near that size.",
  Q23157: "Somerset, England: the county (975,782 people), not a town; its county town is Taunton.",
  Q391980: "The Free Territory of Trieste: a state of 1947 to 1954, not a city; Trieste is Q546.",
  Q36576: "Kiên Giang, Vietnam: the province (キエンザン省), not a town; its capital is Rạch Giá.",
  Q33396: "Quảng Ninh, Vietnam: the province (クアンニン省), not a town; its capital is Hạ Long.",
  Q36903: "Ninh Thuận, Vietnam: the province (ニントゥアン省), not a town; its capital is Phan Rang – Tháp Chàm.",
  Q16632172: "Ennedi-Ouest, Chad: the province (西エネディ州), not a town; its capital is Fada.",
  Q32664319: "München, Germany: a second item for Munich (Q1726), with the 1987 census figure.",
  Q116170766: "Madrid city, Spain: a second item for Madrid (Q2807).",
  Q55893348: "Seville city, Spain: a second item for Seville (Q8717).",
  Q116450968: "Málaga City, Spain: a second item for Málaga (Q8851).",
  Q15897817: "Chongqing Shi, China: a second item for Chongqing (Q11725).",
  Q1480013: "Minneapolis–Saint Paul: the metropolitan area of the two cities, not a city.",
  Q20148959: "San Pedro Zacachimalpa, Mexico: Wikidata gives the village 4,712,999 people, the Puebla area's.",
  Q7568013: "South Mumbai: a part of Mumbai (Q1156), not a city of its own.",
  Q31925679: "Valladolid city, Spain: a second item for Valladolid (Q8356).",
  Q24843784: "Kota Semarang, Indonesia: a second item for Semarang (Q11025).",
  Q11080: "Jember, Indonesia: the regency, 2.4 million people, most of them outside the town.",
  Q12478970: "Cilacap, Indonesia: the regency, not the town.",
  Q33271: "Đồng Nai, Vietnam: the province (4.4 million people); its city is Biên Hòa (Q19316).",
  Q33408: "Bắc Ninh, Vietnam: the province (3.5 million people); the city is Q33381.",
  Q5998871: "Sinnuris, Egypt: a markaz, a district of the Faiyum governorate, not a town.",
  Q951804: "Dairut, Egypt: a markaz, a district of the Asyut governorate, not a town.",
  Q38249350: "Kutupalong, Bangladesh: a refugee camp, not a city.",
  Q3349044: "Rony, Bangladesh: an upazila (a subdistrict) of Rangpur Division, not a town.",
  Q1022918: "Kowloon Walled City, Hong Kong: demolished in 1993-94; its 1990 figure is a place that no longer stands.",
  Q113131921: "Cheok Ka Village, Macau: a village of Macau, not a city.",
  Q207218: "London Borough of Ealing: a borough of London; Ealing, the town (Q83726), is the borough's seat.",
  Q5351808: "El Paso–Juárez: the area across the border, not a city; El Paso is Q16562.",
  "ne:1159148743": "Natal, Brazil: Natural Earth's second Natal, placed in Amazonas with 980,588 people; the city is Q131620.",
  "ne:1159148899": "Vila Velha, Brazil: Natural Earth's place for the Vitória area, placed in Amapá; the city of Vila Velha is Q334197.",
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

// The metropolitan areas round the cities: data-sources/wikidata-metros-<day>.json (scripts/fetch-metros.ts).
interface MetrosSnapshot {
  read: string;
  links: [number, number, string][];
  areas: [number, string | null, [number, string | null][]][];
}

// Statistics Canada's census metropolitan areas and agglomerations: data-sources/statcan-cma-2021.json (scripts/fetch-statcan.ts).
interface StatcanSnapshot {
  read: string;
  places: [string, string, string, "CMA" | "CA", number][];
}
// The official urban areas: data-sources/urban-areas-<day>.json (scripts/fetch-urban.ts).
interface UrbanSnapshot {
  read: string;
  statcan: { estimatesFor: string; estimates: [string, number][]; members: [string, string, string][] };
  census: { areas: [string, string, "MSA" | "μSA", number][] };
  oecd: { areas: [string, string, string, number, number][] };
}
// A census subdivision's DGUID holds its province's number: 2021A0005 35 21005 is in Ontario.
const PROVINCE_NUMBERS: Readonly<Record<string, string>> = { "10": "CA-NL", "11": "CA-PE", "12": "CA-NS", "13": "CA-NB", "24": "CA-QC", "35": "CA-ON", "46": "CA-MB", "47": "CA-SK", "48": "CA-AB", "59": "CA-BC", "60": "CA-YT", "61": "CA-NT", "62": "CA-NU" };
const PROVINCES: Readonly<Record<string, string>> = {
  "Newfoundland and Labrador": "CA-NL", "Prince Edward Island": "CA-PE", "Nova Scotia": "CA-NS", "New Brunswick": "CA-NB", Quebec: "CA-QC", Ontario: "CA-ON", Manitoba: "CA-MB",
  Saskatchewan: "CA-SK", Alberta: "CA-AB", "British Columbia": "CA-BC", Yukon: "CA-YT", "Northwest Territories": "CA-NT", Nunavut: "CA-NU",
};

// The figure a row is ranked by (its metro's people where it has one, else its own), most first, then its id.
// A city inside another's urban area (a row of 15 columns) comes after every city that heads one.
// So does a city of China or India below their census lists (bit 32), by its metro's figure where it has one.
const rankOf = (row: CityRow): number => {
  if (row.length === 15) return (row[3] ?? 0) - 1e12;
  const figure = row.length > 15 ? (row[16] as number) : (row[3] ?? 0);

  return row[13] & 32 ? figure - 1e12 : figure;
};
const byRank = (a: CityRow, b: CityRow): number => rankOf(b) - rankOf(a) || String(a[0]).localeCompare(String(b[0]), "en", { numeric: true });

// A city's metropolitan area: an area Wikidata links to it (scripts/fetch-metros.ts says how) whose English name holds the
// city's ("Metro Vancouver", "Paris metropolitan area", "Atlanta-Sandy Springs-Roswell metropolitan area"), or that is named
// after it (P138). An area that holds the names of several of its cities belongs to the one named first ("Dallas–Fort
// Worth" to Dallas). A statistical area (P8138) comes first, else the most populous; it must have more people than the
// city itself. Rhine-Ruhr names no city of its own, so it is nobody's metro.
type Metro = { id: number | string; en: string; population: number; date: number | string | null };
const metroChooser = (
  metros: MetrosSnapshot | undefined,
  snapshot: CitiesSnapshot,
  statcan: StatcanSnapshot | undefined,
): ((city: number, population: number | null, en: string, country: string, subdivision: string | null) => Metro | null) => {
  const fromWikidata = wikidataMetros(metros, snapshot);
  // A Canadian city takes its census metropolitan area, else its census agglomeration, by Statistics Canada: the first
  // name of one ("Ottawa - Gatineau" is Ottawa's) the city's, in its province. Wikidata has no figure for Toronto's.
  const census = new Map<string, Metro>();
  for (const [name, province, dguid, kind, people] of statcan?.places ?? []) {
    const key = `${PROVINCES[province] ?? ""} ${simple(name.split(" - ")[0]!)}`;
    if (census.has(key) && kind === "CA") continue;
    census.set(key, { id: `statcan:${dguid}`, en: `${name} ${kind === "CMA" ? "census metropolitan area" : "census agglomeration"}`, population: people, date: "2021-05-11" });
  }

  return (city, population, en, country, subdivision) => {
    if (country === "CA" && subdivision !== null) {
      const found = census.get(`${subdivision} ${simple(en)}`);
      if (found !== undefined && found.population > (population ?? 0)) return found;
    }

    return fromWikidata(city, population);
  };
};

// Which figure a country's cities are ranked by: one definition for each country, an official one where there is one.
// Canada: Statistics Canada's census metropolitan areas and agglomerations; the United States: the Census Bureau's
// metropolitan and micropolitan statistical areas; the other members of the OECD: its functional urban areas; China and
// India: the urban figures of their own censuses for their first cities (URBAN_FACTS in scripts/urban-facts.ts);
// every other country: each city's own figure, an estimate.
type AreaSource = "statcan" | "census" | "oecd" | "facts" | "wikidata";
const areaSourceOf = (country: string, urban: UrbanSnapshot | undefined): AreaSource => {
  if (urban === undefined) return "wikidata";
  if (country === "CA") return "statcan";
  if (country === "US") return "census";
  if (urban.oecd.areas.some((area) => area[2] === country)) return "oecd";

  return URBAN_FACTS[country] === undefined ? "wikidata" : "facts";
};

// The names a city is known by, for matching an area's: "New York City" is the New York of the Census Bureau's
// "New York-Newark-Jersey City"; "Washington, D.C." its Washington; München Munich's native name.
const nameKeys = (one: { en: string; native: string | null }): Set<string> =>
  new Set([one.en, one.en.replace(/ City$/, ""), one.en.replace(/-shi$/, ""), one.en.split(",")[0]!, ...(one.native === null ? [] : [one.native])].map(simple).filter((key) => key !== ""));
// The names an area's title may stand for, longest first: "Winston-Salem" before "Winston", each of "Alicante/Alacant",
// and the name without its brackets or "D.C." ("Oldenburg (Oldenburg)", "Bogotá D.C."); the first a city has is used.
const areaNames = (title: string): string[] => {
  const plain = title.replace(/\s*\([^)]*\)/g, "").replace(/ D\.C\.$/, "").replace(/ City$/, "").replace(/^Urban /, "").trim();
  return plain.split("/").flatMap((part) => {
    const pieces = part.trim().split(/\s*-+\s*/);
    return pieces.map((_, at) => pieces.slice(0, pieces.length - at).join("-"));
  });
};

interface UrbanCity {
  number: number | string;
  en: string;
  native: string | null;
  country: string;
  subdivision: string | null;
  population: number | null;
  point: [number, number];
}

// The urban area each city heads, by its country's source (areaSourceOf), and the cities the source itself names inside
// another city's area (the Census Bureau's "Dallas-Fort Worth-Arlington" holds Fort Worth).
// An area belongs to the city its name names first, in its province or state, the most populous where two share the
// name; OECD_AREAS sets those whose name is no city's.
const urbanAreas = <T extends UrbanCity>(
  cities: readonly T[],
  urban: UrbanSnapshot,
  statcan: StatcanSnapshot | undefined,
  oecdNames: Readonly<Record<string, number>>,
): { heads: Map<T, Metro>; named: Map<T, T>; unmatched: string[] } => {
  const heads = new Map<T, Metro>();
  const named = new Map<T, T>();
  const unmatched: string[] = [];
  const byKey = new Map<string, T[]>();
  for (const city of cities) for (const key of nameKeys(city)) byKey.set(`${city.country} ${key}`, [...(byKey.get(`${city.country} ${key}`) ?? []), city]);
  const pick = (country: string, title: string, near: (city: T) => boolean): T | undefined => {
    for (const name of areaNames(title)) {
      const found = (byKey.get(`${country} ${simple(name)}`) ?? []).filter(near).sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
      if (found !== undefined) return found;
    }

    return undefined;
  };
  const inSubdivision = (subdivision: string | null) => (city: T) => subdivision === null || city.subdivision === subdivision;
  const give = (city: T | undefined, metro: Metro, label: string): void => {
    if (city === undefined) unmatched.push(label);
    else if (!heads.has(city) || heads.get(city)!.population < metro.population) heads.set(city, metro);
  };
  const byNumber = new Map(cities.map((city) => [city.number, city]));
  // Canada: the estimate of 1 July of the latest year where there is one, else the 2021 Census.
  const estimates = new Map(urban.statcan.estimates);
  for (const [name, province, dguid, , people] of statcan?.places ?? []) {
    const first = name.split(" - ")[0]!.split(" / ")[0]!;
    const estimate = estimates.get(dguid);
    give(pick("CA", first, inSubdivision(PROVINCES[province] ?? null)), { id: `statcan:${dguid}`, en: name, population: estimate ?? people, date: estimate === undefined ? "2021-05-11" : urban.statcan.estimatesFor }, `CA ${name}`);
  }
  // The United States: "New York-Newark-Jersey City, NY-NJ" is New York City's, in New York; Newark and Jersey City are in it.
  for (const [code, title, , people] of urban.census.areas) {
    const [places, states] = title.split(", ");
    const head = pick("US", places!, inSubdivision(`US-${states!.split("-")[0]}`));
    give(head, { id: `census:${code}`, en: title, population: people, date: "2024-07-01" }, `US ${title}`);
    const stateCodes = new Set(states!.split("-").map((state) => `US-${state}`));
    for (const other of places!.split(/-+/).slice(1)) {
      const city = pick("US", other, (one) => one.subdivision !== null && stateCodes.has(one.subdivision));
      if (head !== undefined && city !== undefined && city !== head) named.set(city, head);
    }
  }
  // The OECD's functional urban areas, in its other members: "Greater Sydney", "New York (Greater)", "Köln".
  for (const [code, name, country, year, people] of urban.oecd.areas) {
    if (areaSourceOf(country, urban) !== "oecd") continue;
    const set = oecdNames[code];
    const city = set !== undefined ? byNumber.get(set) : pick(country, name.replace(/ \(Greater\)$/, "").replace(/^Greater /, ""), () => true);
    give(city, { id: `oecd:${code}`, en: name.replace(/ urban area$/, ""), population: people, date: year }, `${country} ${code} ${name}`);
  }
  // China and India: their censuses' urban figures for their first cities, set by the city's name.
  for (const [country, set] of Object.entries(URBAN_FACTS)) {
    if (areaSourceOf(country, urban) !== "facts") continue;
    for (const fact of set.facts) give(pick(country, fact.city, () => true), { id: `${set.prefix}:${fact.area}`, en: fact.area, population: fact.population, date: set.date }, `${country} ${fact.area}`);
  }

  return { heads, named, unmatched };
};

const wikidataMetros = (metros: MetrosSnapshot | undefined, snapshot: CitiesSnapshot): ((city: number, population: number | null) => Metro | null) => {
  if (metros === undefined) return () => null;
  const label = new Map(snapshot.items.map((item) => [item[0], item[1]]));
  const areas = new Map(metros.areas.map(([id, en, pops]) => [id, { en, people: populationOf(pops) }]));
  // Where a city's name stands in an area's, as whole words (dashes, slashes and commas read as spaces); -1 where it does not.
  const words = (text: string): string => ` ${text.toLowerCase().replace(/[-–—/,()]/g, " ").replace(/\s+/g, " ").trim()} `;
  const position = (area: string, city: string): number => words(area).indexOf(words(city));
  // An area's name without the words that come before its city's: "Metro Vancouver", "Greater Tokyo Area".
  const joined = (area: string): boolean => /[-–—/]/.test(lead(area).split(/ (metropolitan|urban|metro|area|region|agglomeration)/i)[0] ?? "");
  const lead = (area: string): string => area.replace(/^(the |greater |metro |metropolitan |metropolis of |eurometropolis of |agglomeration of |urban agglomeration of )+/i, "");
  // Which of an area's linked cities it belongs to: the one whose name comes first in the area's name.
  const citiesOfArea = new Map<number, Set<number>>();
  for (const [city, area] of metros.links) citiesOfArea.set(area, (citiesOfArea.get(area) ?? new Set()).add(city));
  const owner = new Map<number, number>();
  for (const [area, cities] of citiesOfArea) {
    const en = areas.get(area)?.en;
    if (en === null || en === undefined) continue;
    let best: { city: number; at: number } | null = null;
    for (const city of cities) {
      const name = label.get(city);
      if (name === null || name === undefined) continue;
      // "New York City" is the New York of "New York metropolitan area". The city must be the first place the area's name
      // names, after a word such as Greater or Metro: Milan's metro is not Como's.
      const at = [name, name.replace(/ City$/, "")].map((one) => position(lead(en), one)).filter((one) => one === 0)[0] ?? -1;
      if (at >= 0 && (best === null || at < best.at)) best = { city, at };
    }
    if (best !== null) owner.set(area, best.city);
  }
  const namedAfter = new Map<number, number>();
  for (const [, area, how] of metros.links) if (how === "P138") namedAfter.set(area, (namedAfter.get(area) ?? 0) + 1);
  const byCity = new Map<number, { area: number; how: string }[]>();
  for (const [city, area, how] of metros.links) byCity.set(city, [...(byCity.get(city) ?? []), { area, how }]);
  // The links set by name (scripts/metro-links.ts): the area is the city's own.
  for (const [city, { area }] of Object.entries(METRO_LINKS)) {
    const number = Number(city.slice(1));
    byCity.set(number, [...(byCity.get(number) ?? []), { area, how: "kuni" }]);
    owner.set(area, number);
  }

  return (city, population) => {
    // Named after the city alone: Keihanshin is named after Kyoto, Osaka and Kobe, and belongs to none of them.
    const choices = (byCity.get(city) ?? []).filter(({ area, how }) => owner.get(area) === city || (how === "P138" && !owner.has(area) && (namedAfter.get(area) ?? 0) === 1));
    const best = choices
      .map(({ area, how }) => ({ area, how, en: areas.get(area)?.en ?? null, people: areas.get(area)?.people ?? null }))
      .filter((one): one is { area: number; how: string; en: string; people: { value: number; day: string | null } } => one.en !== null && one.people !== null && one.people.value > (population ?? 0))
      // A statistical area first (Atlanta-Sandy Springs-Roswell); then one named for this city alone, not joined to
      // another (Katowice's own, before Katowice-Ostrava); then the most populous.
      .sort((a, b) => Number(b.how === "P8138") - Number(a.how === "P8138") || Number(joined(a.en)) - Number(joined(b.en)) || b.people.value - a.people.value || a.area - b.area)[0];

    return best === undefined ? null : { id: best.area, en: best.en, population: best.people.value, date: dateOf(best.people.day) };
  };
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

const buildCities = (input: { snapshot: CitiesSnapshot; naturalEarth: NaturalEarthFile; levels: ReadonlyMap<string, number>; countries: ReadonlySet<string>; subdivisions?: ReadonlySet<string>; capitalNames?: ReadonlyMap<string, string>; metros?: MetrosSnapshot; statcan?: StatcanSnapshot; urban?: UrbanSnapshot; oecdNames?: Readonly<Record<string, number>>; insideAreas?: Readonly<Record<string, number>>; insideSubdivisions?: Readonly<Record<string, number>> }): { rows: CityRow[]; tiers: Record<TierName, CityRow[]>; report: Report } => {
  const { snapshot, naturalEarth, levels, countries } = input;
  // Statistics Canada's areas come from urbanAreas where the official areas are given; the chooser is Wikidata's alone then.
  const metroOf = metroChooser(input.metros, snapshot, input.urban === undefined ? input.statcan : undefined);
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
    unitTowns: 0,
    withMetro: 0,
    inMetroOf: 0,
    withoutUrbanFigure: 0,
    areasUnmatched: [],
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
    const en = ENGLISH_NAMES[`Q${number}`]?.en ?? enLabel ?? place?.[2] ?? place?.[1] ?? null;
    if (en === null) {
      report.leftOut.noName += 1;
      continue;
    }
    const point = wikidataPoint ?? (place === undefined ? null : ([place[4], place[5]] as [number, number]));
    if (point === null) {
      report.leftOut.noPoint += 1;
      continue;
    }
    // Hong Kong, Macau and Taiwan have codes of their own (HK, MO, TW): a place Wikidata puts in China but whose ISO
    // 3166-2 code is CN-HK, CN-MO or CN-TW is in that country.
    const ownCode = subs.map((code) => SEPARATE_CODES[code]).find((alpha2) => alpha2 !== undefined && countries.has(alpha2));
    const country = ownCode ?? wikidataCountry ?? (place?.[8] != null && countries.has(place[8]) ? place[8] : null);
    if (country === null || !countries.has(country)) {
      report.leftOut.noCountry += 1;
      continue;
    }
    // An item named for an area or a unit, with no capital or Natural Earth place behind it, is not a city.
    if ((place === undefined && capitalCodes.length === 0 && AREA_NAME.test(en)) || NOT_CITIES[`Q${number}`] !== undefined) {
      report.leftOut.area += 1;
      continue;
    }
    const wrong = WRONG_POPULATIONS[`Q${number}`];
    const wikidataPopulation = populationOf(wrong === undefined ? pops : pops.filter(([value]) => value !== wrong.value));
    const population = wikidataPopulation?.value ?? place?.[6] ?? null;
    // Natural Earth's Japanese name is used only where it is not hiragana for a place outside Japan (うーんルワバ for Umm Ruwaba): a sign of a machine's guess.
    const neJa = place?.[3] != null && (country === "JP" || !/\p{Script=Hiragana}/u.test(place[3])) ? place[3] : null;
    const written = JA_NAMES[`Q${number}`]?.ja ?? null;
    // A Japanese label that names another place is dropped, not replaced by a name of kuni's own (JA_WRONG).
    const ja = JA_WRONG[`Q${number}`] !== undefined ? null : (written ?? jaLabel ?? neJa);
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
    if (NOT_CITIES[`ne:${neId}`] !== undefined) {
      report.leftOut.area += 1;
      continue;
    }
    candidates.push({ number: `ne:${neId}`, en: nameEn ?? name, ja: nameJa, native: null, nativeLanguage: null, point: [lat, lon], country: iso, population: pop, populationDate: null, subdivision: null, codes: [], neKind: kind, sources: (nameJa === null ? 0 : 1) | (pop === null ? 0 : 2) | 4, viaPlace: true });
  }

  // 1b. A civil township is no city of its own. In the states where townships are units of a county with cities inside
  // them (CIVIL_TOWNSHIP_STATES), every township is left out: Kaw Township is round Kansas City, Thornton Township holds
  // South Holland, Harvey and more. Its id answers with the city of its own name in its state where there is one
  // (Liberty Township, Liberty; Lawrence Township, Lawrence), else the nearest city in its state within 15 km of a
  // quarter of its people or more, else with none. Elsewhere a township is the municipality people live in (Toms River,
  // New Jersey; Clinton Township, Michigan) and stays.
  const idOf = (one: Candidate): string => (typeof one.number === "number" ? `Q${one.number}` : one.number);
  const townships = candidates.filter((one) => one.country === "US" && one.codes.length === 0 && / Township$/.test(one.en) && one.subdivision !== null && CIVIL_TOWNSHIP_STATES.has(one.subdivision));
  const gone = new Set<Candidate>(townships);
  for (const township of townships) {
    const people = township.population ?? 0;
    const inState = candidates.filter((one) => !gone.has(one) && one.subdivision === township.subdivision && !/ Township$/.test(one.en));
    const base = simple(township.en.replace(/ (City )?Township$/, ""));
    const named = inState.filter((one) => simple(one.en) === base).sort((a, b) => km(a.point, township.point) - km(b.point, township.point))[0];
    const near = inState.filter((one) => (one.population ?? 0) >= people * 0.25 && km(one.point, township.point) < 15).sort((a, b) => km(a.point, township.point) - km(b.point, township.point))[0];
    const city = named ?? near;
    report.townshipCities[idOf(township)] = city === undefined ? null : idOf(city);
  }
  report.leftOut.township = gone.size;
  // 1c. Units and parts of a city that are no city of their own (not a capital): a county, a subdistrict, a microdistrict,
  // a raion, a governorate, a territory, a region, an area, a district; a part of a city ("seventh sector of Marseille",
  // "Zone 7 of Milan", "Municipality 4 of Naples", "North borough of Brescia"); and a municipality where a town of its
  // own name stands within 25 km (Kodad municipality beside Kodad). A municipality with no town apart is the place
  // people live (Bærum, Ilam) and stays. A unit named only in brackets is a town's ("Mengcun Town (Mengcun County)").
  // Its id answers with the town of its own name, else the city it is a part of, else a city within 3 km (Jiaojiang
  // District, Taizhou), else the biggest within 15 km of twice its people (Xətai raion, Baku), else none (Arkansas
  // Territory). A capital, a place Natural Earth names and a town told apart by a comma ("Paxtaobod, Andijan Region") stay.
  const unitGone = new Set<Candidate>();
  for (const one of candidates) {
    if (gone.has(one) || one.codes.length > 0 || one.en.includes(",")) continue;
    const plain = one.en.replace(/\s*\([^)]*\)\s*/g, " ").trim();
    const partOf = /^(?:(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth) sector|Zone \d+|Municipality \d+|(?:North|South|East|West|Central) borough) of (.+)$/i.exec(plain)?.[1] ?? null;
    // "London Borough of Ealing" is a unit of London, as "Ealing Borough" would be.
    const unit = UNIT_WORD.test(plain) || /^(London|Royal) Borough of /.test(plain);
    const municipality = /\sMunicipality$/i.test(plain);
    if (partOf === null && !unit && !municipality) continue;
    const base = simple(plain.replace(UNIT_WORD, "").replace(/\sMunicipality$/i, "").trim());
    const near = candidates.filter((other) => other !== one && other.country === one.country && !gone.has(other) && !unitGone.has(other) && !UNIT_WORD.test(other.en));
    const named = near.filter((other) => simple(other.en) === base && km(other.point, one.point) < 25).sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
    if (municipality && !unit && partOf === null && named === undefined) continue;
    const whole = partOf === null ? undefined : near.filter((other) => simple(other.en) === simple(partOf) && km(other.point, one.point) < 40).sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
    const beside = near.filter((other) => km(other.point, one.point) < 3).sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
    // A district of a great city: the city that holds it, the biggest within 15 km of twice its people (Xətai raion, Baku).
    const around = near.filter((other) => km(other.point, one.point) < 15 && (other.population ?? 0) >= 2 * (one.population ?? 0)).sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
    const city = named ?? whole ?? beside ?? around;
    // A unit Natural Earth names, with no city apart, is its town as Natural Earth has it (Yishui County is Yishui): the
    // town's name, point and people, and Natural Earth's Japanese name of the town where it has one.
    if (city === undefined && one.neKind !== null) {
      const place = typeof one.number === "number" ? ne.get(`Q${one.number}`) : naturalEarth.places.find((other) => `ne:${other[9]}` === one.number);
      const town = place === undefined ? undefined : [place[2], place[1]].find((name) => name !== null && !UNIT_WORD.test(name) && !/\sMunicipality$/i.test(name));
      if (place !== undefined && town !== undefined && town !== null) {
        // Natural Earth's Japanese name of the unit (沂水県, フラルキ区) is not the town's: none then.
        const ja = place[3] !== null && !/[県区郡州省]$/.test(place[3]) && (one.country === "JP" || !/\p{Script=Hiragana}/u.test(place[3])) ? place[3] : null;
        Object.assign(one, { en: town, ja, native: null, nativeLanguage: null, point: [place[4], place[5]], population: place[6] ?? one.population, populationDate: place[6] === null ? one.populationDate : null, sources: (one.sources & 8) | (ja === null ? 0 : 1) | (place[6] === null ? one.sources & 2 : 2) | 4 });
        report.unitTowns += 1;
        continue;
      }
      // Natural Earth's own name is the unit's too: it is kept as Natural Earth names it.
      if (place !== undefined) continue;
    }
    unitGone.add(one);
    report.townshipCities[idOf(one)] = city === undefined ? null : idOf(city);
  }
  report.leftOut.area += unitGone.size;
  for (let at = candidates.length - 1; at >= 0; at -= 1) if (unitGone.has(candidates[at]!)) candidates.splice(at, 1);
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
  // The urban area each city heads, where its country has an official source (areaSourceOf).
  const urban = input.urban;
  const owned = urban === undefined ? { heads: new Map<Candidate, Metro>(), named: new Map<Candidate, Candidate>(), unmatched: [] } : urbanAreas(kept, urban, input.statcan, input.oecdNames ?? {});
  report.areasUnmatched = owned.unmatched;
  const rowOf = new Map<Candidate, CityRow>();
  const officialIn = new Map<string, [Candidate, Metro][]>();
  for (const [one, metro] of owned.heads) officialIn.set(one.country, [...(officialIn.get(one.country) ?? []), [one, metro]]);
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
    // The urban area the city heads, by its country's source; where it heads none in a country with official areas,
    // Wikidata's metro where it is bigger than the city (an estimate); in a country with none, the city's own figure,
    // an estimate too (bit 16).
    const source = areaSourceOf(country, urban);
    const official = owned.heads.get(one);
    let metro = official ?? (typeof one.number === "number" ? metroOf(one.number, population, one.en, country, subdivisionOf) : null);
    // Wikidata's metro of a city near a bigger official area is mostly inside it (Kyoto's and Kobe's, in Osaka's): the
    // people would be counted twice, so the city ranks by its own figure.
    if (official === undefined && metro !== null && (source === "statcan" || source === "census" || source === "oecd")) {
      const point = one.point;
      if ((officialIn.get(country) ?? []).some(([other, area]) => area.population > metro!.population && km(other.point, point) <= 60)) metro = null;
    }
    // Bit 16: the figure the city ranks by is an estimate (its own, or Wikidata's metro, in a country with no official
    // areas for it). Bit 32: in China and India, a city below the census list, ranked after it.
    const ownEstimate = official === undefined && urban !== undefined && (source === "wikidata" || source === "facts") ? 16 : 0;
    const afterList = official === undefined && urban !== undefined && source === "facts" ? 32 : 0;
    const row: CityRow = [one.number, rounded(one.point[0]), rounded(one.point[1]), population, one.populationDate, country, subdivisionOf, one.en, one.ja, one.native, one.native === null ? null : one.nativeLanguage, capital, capitalOf.length === 0 ? null : [...new Set(capitalOf)].sort().join(" "), one.sources | ownEstimate | afterList];
    const full: CityRow = metro === null ? row : ([...row, metro.id, metro.en, metro.population, metro.date] as CityRow);
    if (metro !== null) report.withMetro += 1;
    rows.push(full);
    rowOf.set(one, full);
  }
  // A city that heads no area of its own but lies inside another city's is ranked after every city that heads one. It is
  // inside: where INSIDE_AREAS sets it (Ecatepec in Mexico City's, Niterói in Rio de Janeiro's, Thane in Mumbai's);
  // where the Census Bureau names it in that city's area (Fort Worth in Dallas-Fort Worth-Arlington); in Canada, where
  // Statistics Canada lists it among the area's municipalities (Mississauga, Brampton); else where it lies within 10 km
  // plus 5 km for each square root of a million people of the nearest city whose area holds three times its own people
  // or more (Newark, 15 km from New York City), or, in a country with no areas, whose own figure of a million or more
  // does (Bangkok's districts). A city of a million people or more is
  // never put inside another's for being near it (Yokohama, Kobe, Kyoto rank by their own). Its row holds that city's id.
  // In China and India, a city with no census urban figure ranks after the cities that have one (bit 32 of its sources).
  if (urban !== undefined) {
    const headOfArea = new Map<string, Candidate>();
    for (const [one, metro] of owned.heads) headOfArea.set(String(metro.id), one);
    const memberOf = new Map<string, string>();
    for (const [name, dguid, area] of urban.statcan.members) memberOf.set(`${PROVINCE_NUMBERS[dguid.slice(9, 11)] ?? ""} ${simple(name)}`, `statcan:${area}`);
    const headsIn = new Map<string, [Candidate, Metro][]>();
    for (const [one, metro] of owned.heads) if (rowOf.has(one)) headsIn.set(one.country, [...(headsIn.get(one.country) ?? []), [one, metro]]);
    const byNumber = new Map(kept.map((one) => [one.number, one]));
    const indexOf = new Map(rows.map((row, at) => [row, at]));
    // In a country with no areas, the cities of a million people or more by their own figure.
    const bigIn = new Map<string, [Candidate, number][]>();
    for (const [one, row] of rowOf) if ((row[3] ?? 0) >= 1e6) bigIn.set(one.country, [...(bigIn.get(one.country) ?? []), [one, row[3]!]]);
    for (const [one, row] of rowOf) {
      if (owned.heads.has(one)) continue;
      const source = areaSourceOf(row[5], urban);
      const own = row[3] ?? 0;
      const set = input.insideAreas?.[idOf(one)] ?? (row[6] === null ? undefined : input.insideSubdivisions?.[row[6]]);
      let head: Candidate | undefined = set === undefined ? undefined : byNumber.get(set);
      if (head === undefined) head = owned.named.get(one);
      if (head === undefined && row[5] === "CA") {
        const area = [...nameKeys(one)].map((key) => memberOf.get(`${row[6] ?? ""} ${key}`)).find((found) => found !== undefined);
        head = area === undefined ? undefined : headOfArea.get(area);
      }
      if (head === undefined && own < 1e6) {
        // The nearest city whose figure (its area's, or in a country with none its own of a million or more) is three
        // times this one's, within 10 km plus 5 km for each square root of a million of it.
        const pool = source === "wikidata" ? (bigIn.get(one.country) ?? []) : (headsIn.get(one.country) ?? []).map(([other, metro]): [Candidate, number] => [other, metro.population]);
        head = pool
          .filter(([other, figure]) => other !== one && figure >= 3 * own && km(other.point, one.point) <= 10 + 5 * Math.sqrt(figure / 1e6))
          .sort((a, b) => km(a[0].point, one.point) - km(b[0].point, one.point))[0]?.[0];
      }
      if (head === undefined || head === one || !rowOf.has(head)) {
        if (row[13] & 32) report.withoutUrbanFigure += 1;
        continue;
      }
      rows[indexOf.get(row)!] = [...row.slice(0, 14), head.number] as unknown as CityRow;
      report.inMetroOf += 1;
    }
  }
  report.naturalEarthOnly = rows.filter((row) => typeof row[0] === "string").length;
  rows.sort(byRank);

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
    `- **Areas**: Wikidata's human settlements include areas of several cities and the units that hold them. An item that is only a metropolitan area, an urban area, a conurbation, an urban agglomeration or a built-up area (by its class) is left out when the snapshot is made, and so is one whose English name ends in Province, County, Prefecture, Governorate, District, Regency, Oblast or Department, or names an area (metropolitan area, urban area, agglomeration, conurbation), or starts 'County of', 'Province of', 'District of', 'Municipality of', 'City of' or 'Greater' (Greater Sudbury, Greater Napanee and Greater Noida are cities and stay), or ends in a number (Prague 5, Sector 3, Municipio 2: a numbered district), or starts 'Metropolitan', 'Metro', 'Metropolis of', 'Commune' or 'Sectorul' (Metropolitan Toronto, Metro Manila, the Metropolis of Lyon, Burundi's communes, Chișinău's sectors), or names a regional municipality or a 'State of' (North East State of Somalia), or ends in 'Region' or 'Region of …' (Øresund Region, Kurdistan Region of Iraq; a name with a comma, a town told apart by its region, stays), 'Capital City' (Podgorica Capital City, the unit round the city), 'Urban Corridor' or 'New Area' (Binhai New Area), or ends in a unit below a district (Upazila, Thana, Tehsil, Taluka, Municipal Okrug, Subdistrict, Ward, Union, Arrondissement, County Borough, Regional Council or Commune: Gazipur Sadar Upazila; the word alone, Union in New Jersey, is a town's name and stays), unless it is a capital or Natural Earth names it. A few items are left out by name, each with its reason (NOT_CITIES in scripts/cities.ts: Moro, Papua New Guinea, at 6.3 million people). In Iowa, Illinois, Indiana, Kansas, Missouri, Nebraska and the Dakotas a township is a civil unit of its county with cities inside it: every township is left out (${n(report.leftOut.township)}; Kaw Township, round Kansas City), each id answering with the city of its own name, else the nearest within 15 km of a quarter of its people or more; elsewhere a township is the municipality people live in (Toms River, New Jersey; Clinton Township, Michigan) and stays. Some cities with such a name are lost; a city that Natural Earth names is kept. Then a unit or a part of a city that Wikidata names as a settlement is left out: a name ending in County, District, Subdistrict, Microdistrict, Raion, Governorate, Territory, Region or Area (a capital, a name with a comma, and a name in brackets stay), a numbered or named part ("Zone 7 of Milan", "third sector of Marseille"), and a municipality with a town of its own name within 25 km (Kodad municipality); its id answers with that town, else the city it is part of, else a city within 3 km, else the biggest within 15 km of twice its people (Xətai raion, Baku), else none (${n(Object.values(report.townshipCities).length)} ids in all with the townships). Where Natural Earth names such a unit and no city stands apart, it is the town Natural Earth has (${n(report.unitTowns)}: Yishui County is Yishui), with the town's point and people, not the county's.`,
    `- **Capitals**: a country has exactly one national capital (Natural Earth's "Admin-0 capital" among the items that are a capital of it, else the most populous Wikidata names): ${n(report.capitals.national)} cities are one. Another seat of government (Cape Town, Kyoto) is an \`alternate\` (${n(report.capitals.alternate)}); the capital of a subdivision needs an ISO 3166-2 code kuni lists (${n(report.capitals.subdivision)}), and Natural Earth's subdivision capitals with none (${n(report.capitals.droppedWithoutCode)}) are not capitals here. Every capital says what it is the capital of in \`capitalOf\`.`,
    "- **One city once**: two items with one name in one country within 15 km, one of them of 100,000 people or more, are one city; the one with a capital behind it, else Natural Earth's, else the more populous, is kept.",
    `- **Urban area** (\`metro\`, ${n(report.withMetro)} cities): the urban area a city heads, one source for each country. Canada: Statistics Canada's census metropolitan areas and census agglomerations, the estimate of 1 July 2025 (Table 17-10-0148-01), else the 2021 Census (Table 98-10-0005-01). The United States: the Census Bureau's metropolitan and micropolitan statistical areas on 1 July 2024. The other members of the OECD: its functional urban areas, the latest year it gives. China and India, whose own figure for a city is its whole municipality: their censuses' urban figures for their first cities, typed as facts with their source and date (\`scripts/urban-facts.ts\`: the urban resident population of China's twenty-one megacities in 2020; India's twenty largest urban agglomerations in 2011, on which Mumbai ranks ahead of Delhi, the larger today); their other cities rank after these, by Wikidata's metro where bigger, else their own figure. An area belongs to the city its name names first ("Ottawa - Gatineau" to Ottawa, "Dallas-Fort Worth-Arlington" to Dallas), in its province or state, the most populous where two share the name; an area whose name is no city's is set by id in \`scripts/metro-links.ts\`, with the reason. ${n(report.areasUnmatched.length)} areas name no city kuni has (most are small Canadian agglomerations named for a region). The area's figure ranks a city even where it is below the city's own (Ulsan). Where a city heads none, Wikidata's metropolitan area where it is bigger than the city, an estimate (\`metro.estimated\`, \`rankEstimated\`), unless a bigger official area lies within 60 km, which holds it (Kyoto and Kobe, in Osaka's): then, and where there is none, the city's own figure (an estimate too in a country with no official areas). South Africa's metropolitan municipalities are set on their seats by name in \`scripts/metro-links.ts\` (eThekwini on Durban). Hong Kong, Macau and Taiwan are under their own codes, whatever Wikidata's country.`,
    `- **Inside another city's area** (\`inMetroOf\`, ${n(report.inMetroOf)} cities): a city that heads no area but lies inside another city's, ranked after every city that heads one. Set by id in \`scripts/metro-links.ts\` with the reason (Ecatepec in Mexico City's, Thane in Mumbai's, Giza in Cairo's, New York City's boroughs, every district of Bangkok); named in the Census Bureau's area (Fort Worth in Dallas-Fort Worth-Arlington); in Canada, a municipality of Statistics Canada's list of the municipalities of each area (Table 98-10-0003-01: Mississauga and Brampton are in Toronto's); else a city within 10 km plus 5 km for each square root of a million people of the nearest city whose area holds three times its own people or more, or in a country with no areas whose own figure of a million or more does. A city of a million people or more is never put inside another's for being near it (Yokohama, Kobe and Kyoto rank by their own). In China and India a city below the census list is ranked after it (\`urbanAreaUnknown\`, ${n(report.withoutUrbanFigure)} cities).`,
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

  // Written small, as the core of /cities carries it: "Q2415" is "1v3" (the number in base 36), anything else ("ne:12")
  // is written as it is after a "!"; pairs are old=new, with commas between (an "ne:" id has a colon of its own).
  const short = (id: string): string => (/^Q\d+$/.test(id) ? Number(id.slice(1)).toString(36) : `!${id}`);

  return `// Generated by scripts/build-data.ts. Do not edit by hand: the aliases are in data-sources/city-id-aliases.json.
// The ids that were a city's in an earlier release and now answer with another city (merged), so that an id a page stored keeps working.
// Written small: each pair is old=new, an item number in base 36 ("1v3" is Q2415) or "!" and the id as it is.

const PAIRS: string = ${JSON.stringify(pairs.map(([old, target]) => `${short(old)}=${short(target as string)}`).join(","))};
const long = (text: string): string => (text.startsWith("!") ? text.slice(1) : \`Q\${Number.parseInt(text, 36)}\`);

const CITY_ALIASES: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(PAIRS === "" ? [] : PAIRS.split(",").map((pair) => pair.split("=").map(long) as [string, string])),
);

export { CITY_ALIASES };
`;
};

export { buildCities, byRank, cityAliases, cityIndex, unresolvedIds, citiesDoc, cityFiles, cityLoaders, countryCityFiles, TIER_FILES };
export type { MetrosSnapshot, StatcanSnapshot, CitiesSnapshot, NaturalEarthFile, Report, TierName, UrbanSnapshot };
