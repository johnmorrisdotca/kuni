// The capitals of the countries that have more than one capital city, or a capital that is not the one `capital` names,
// for scripts/build-data.ts (src/data/capitals.data.ts, docs/capitals.md) and `capitalsOf` in the /capitals entry.
// Written for kuni, MIT. Every entry says what its country's own government or law says, with the address of the
// page and the line quoted from it, read on the day in CAPITALS_READ. No name or role here comes from memory or from
// a reference work: a country no official page in reach settles is left out (docs/capitals.md lists them).
//
// `role` is the nearest of the five words kuni has to the word the source uses; the source's own word stays in the
// quote and, where it differs, in `note`. A city the source calls the commercial or economic capital, and nothing
// else, is in a `note`, not in the list: kuni has no role for it.
//
// Every Japanese name is the one kuni already has for that city (the country's `capital.ja`, or the city's name in
// /cities); scripts/build-data.ts fails if one of them is not.
//
// Israel and the Palestinian Territories are not here: a disputed capital is a decision for the maintainer, not this table.

type CapitalRole = "official" | "administrative" | "legislative" | "judicial" | "seat";

interface CapitalSource {
  /** Who published the page. */
  by: string;
  /** The page's title, as it reads. */
  title: string;
  url: string;
  /** The line, as the page prints it. */
  quote: string;
}

interface CapitalEntry {
  en: string;
  ja: string;
  role: CapitalRole;
  /** What the role word is read from, where the source's word is not one of the five; shipped. */
  note?: string;
  sources: CapitalSource[];
}

const CAPITALS_READ = "2026-11-18";

const ZA_SOURCE: CapitalSource = {
  by: "South African Government",
  title: "South Africa at a glance",
  url: "https://www.gov.za/about-sa/south-africa-glance",
  quote: "Pretoria (administrative); Cape Town (legislative); Bloemfontein Judicial). The Constitutional Court is in Johannesburg.",
};

const CAPITALS: Record<string, CapitalEntry[]> = {
  BJ: [
    {
      en: "Porto-Novo",
      ja: "ポルトノボ",
      role: "official",
      sources: [{ by: "Gouvernement de la République du Bénin", title: "Allons, Ensemble , à la découverte des communes du Bénin", url: "https://www.gouv.bj/article/935/allons--ensemble-decouverte-communes-benin/", quote: "Porto-Novo est sa capitale bien que Cotonou soit la principale métropole." }],
    },
    {
      en: "Cotonou",
      ja: "コトヌー",
      role: "seat",
      note: "The government's page does not call Cotonou a capital; it says the city houses the Presidency.",
      sources: [{ by: "Gouvernement de la République du Bénin", title: "Destination Bénin : Cotonou, poumon économique, pôle cosmopolite et vitrine du Bénin", url: "https://www.gouv.bj/article/1066/destination-benin---cotonou--poumon-economique--pole-cosmopolite-vitrine-benin/", quote: "Cette mégalopole abrite la tête du pouvoir politique, la Présidence de la République" }],
    },
  ],
  BO: [
    {
      en: "Sucre",
      ja: "スクレ",
      role: "official",
      note: "The Ministry of Foreign Affairs calls it the capital constitucional (the constitutional capital).",
      sources: [{ by: "Ministerio de Relaciones Exteriores de Bolivia", title: "Más de un centenar de autoridades y representantes internacionales acompañan a Bolivia en la conmemoración del Bicentenario de su Independencia", url: "https://cancilleria.gob.bo/mre/2025/08/06/22320/", quote: "La ciudad de Sucre, capital constitucional del Estado Plurinacional de Bolivia y cuna de la libertad americana" }],
    },
    {
      en: "La Paz",
      ja: "ラパス",
      role: "seat",
      note: "The Ministry of Productive Development's page says this of the department of La Paz: sede del Gobierno central (the seat of the central government).",
      sources: [{ by: "Ministerio de Desarrollo Productivo y Economía Plural de Bolivia", title: "La Paz Ciudad de Progreso y Modernidad", url: "https://siip.produccion.gob.bo/repSIIP2/documento.php?n=1817", quote: "La paz es uno de los nueve departamentos que conforman el Estado Plurinacional de Bolivia, sede del Gobierno central." }],
    },
  ],
  CI: [
    {
      en: "Yamoussoukro",
      ja: "ヤムスクロ",
      role: "administrative",
      note: "The Presidency calls it the political and administrative capital; Abidjan remains the economic capital.",
      sources: [{ by: "Presidency of the Ivory Coast", title: "Our heritage", url: "https://www.presidence.ci/en/our-heritage/", quote: "The political and administrative capital of Côte d’Ivoire is Yamoussoukro (Abidjan remains the economic capital)" }],
    },
  ],
  LK: [
    {
      en: "Sri Jayawardenepura Kotte",
      ja: "スリジャヤワルダナプラコッテ",
      role: "administrative",
      note: "Colombo, the largest city, is called the commercial capital.",
      sources: [
        { by: "Ministry of Foreign Affairs, Foreign Employment & Tourism, Sri Lanka", title: "National Profile & Geography", url: "https://www.mfa.gov.lk/en/national-profile-and-geography", quote: "Capital: Sri Jayawardenepura Kotte (administrative); Largest city: Colombo." },
        { by: "Embassy of Sri Lanka in Lebanon", title: "Why Visit Sri Lanka", url: "https://www.emb-beirut.gov.lk/en/why-visit-sri-lanka", quote: "Sri Jayawardenepura Kotte is the administrative capital; Colombo is the commercial capital." },
      ],
    },
  ],
  MY: [
    {
      en: "Kuala Lumpur",
      ja: "クアラルンプール",
      role: "official",
      sources: [{ by: "Dewan Bandaraya Kuala Lumpur", title: "Portal Rasmi Dewan Bandaraya Kuala Lumpur - DBKL | Latar Belakang", url: "https://www.dbkl.gov.my/en/latar-belakang", quote: "From a small town, Kuala Lumpur has grown into the nation's capital and the largest city in Malaysia." }],
    },
    {
      en: "Putrajaya",
      ja: "プトラジャヤ",
      role: "administrative",
      note: "Perbadanan Putrajaya calls it the Federal Government Administrative Center.",
      sources: [{ by: "Perbadanan Putrajaya", title: "Background of Putrajaya", url: "https://blog.ppj.gov.my/2014/05/background-of-putrajaya.html", quote: "a new city to serve as the Federal Government Administrative Center of Malaysia" }],
    },
  ],
  NL: [
    {
      en: "Amsterdam",
      ja: "アムステルダム",
      role: "official",
      note: "The Constitution (Grondwet, article 32) calls it the hoofdstad, the capital.",
      sources: [{ by: "Overheid.nl", title: "Grondwet, artikel 32", url: "https://wetten.overheid.nl/BWBR0001840/2023-02-22", quote: "wordt hij zodra mogelijk beëdigd en ingehuldigd in de hoofdstad Amsterdam" }],
    },
    {
      en: "The Hague",
      ja: "デン・ハーグ",
      role: "seat",
      note: "The government's page says central government is concentrated in and around The Hague; it does not use the words seat of government.",
      sources: [{ by: "Overheid.nl", title: "Central government", url: "https://www.overheid.nl/english/about-the-dutch-government/what-government-consists-of/central-government", quote: "Central government is concentrated in and around The Hague." }],
    },
  ],
  TZ: [
    {
      en: "Dodoma",
      ja: "ドドマ",
      role: "official",
      note: "Dar es Salaam is called the commercial capital and major seaport for Tanzania Mainland.",
      sources: [{ by: "Embassy of Tanzania in Vienna", title: "About Tanzania", url: "https://www.at.tzembassy.go.tz/tanzania/about-tanzania", quote: "Dodoma is the capital city" }],
    },
  ],
  ZA: [
    { en: "Pretoria", ja: "プレトリア", role: "administrative", sources: [ZA_SOURCE] },
    { en: "Cape Town", ja: "ケープタウン", role: "legislative", sources: [ZA_SOURCE] },
    { en: "Bloemfontein", ja: "ブルームフォンテーン", role: "judicial", note: "The Constitutional Court is in Johannesburg.", sources: [ZA_SOURCE] },
  ],
};

export { CAPITALS, CAPITALS_READ };
export type { CapitalEntry, CapitalRole, CapitalSource };
