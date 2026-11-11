// The urban populations of the first cities (China's twenty-one megacities, India's twenty largest urban agglomerations) of the countries whose own figure for a city is a whole
// administrative area (Chongqing's 32 million is its municipality's, most of it countryside), typed here as facts from
// the national statistics, each with its source and date. Only the city, the figure and its day are taken: no table is
// copied. scripts/cities.ts ranks these cities by them, and every other city of the country after them.

interface UrbanFact {
  /** The city's English name, as kuni has it. */
  city: string;
  /** The area's name, as its source writes it. */
  area: string;
  population: number;
}

interface UrbanFacts {
  /** The id prefix of the areas: "<prefix>:<area>". */
  prefix: string;
  /** The day the figures are for. */
  date: string;
  source: string;
  facts: UrbanFact[];
}

const URBAN_FACTS: Readonly<Record<string, UrbanFacts>> = {
  // China: the urban resident population (城区常住人口) at the 2020 census, which the National Bureau of Statistics
  // gave for its 21 megacities on 22 September 2021 (第七次全国人口普查超大、特大城市人口基本情况) and in full in
  // 中国人口普查分县资料：2020 (China Statistics Press, 2022). In 10,000s there, as 1,987.31 for Shanghai.
  CN: {
    prefix: "cn-census-2020",
    date: "2020-11-01",
    source: "National Bureau of Statistics of China, Seventh National Population Census (2020), urban resident population (城区常住人口)",
    facts: [
      { city: "Shanghai", area: "上海市城区", population: 19873100 },
      { city: "Beijing", area: "北京市城区", population: 17751700 },
      { city: "Shenzhen", area: "深圳市城区", population: 17438300 },
      { city: "Chongqing", area: "重庆市城区", population: 16344000 },
      { city: "Guangzhou", area: "广州市城区", population: 14878400 },
      { city: "Chengdu", area: "成都市城区", population: 13340300 },
      { city: "Tianjin", area: "天津市城区", population: 10933100 },
      { city: "Wuhan", area: "武汉市城区", population: 9953000 },
      { city: "Dongguan", area: "东莞市城区", population: 9557600 },
      { city: "Xi'an", area: "西安市城区", population: 9283700 },
      { city: "Hangzhou", area: "杭州市城区", population: 8741700 },
      { city: "Foshan", area: "佛山市城区", population: 8538900 },
      { city: "Nanjing", area: "南京市城区", population: 7914600 },
      { city: "Shenyang", area: "沈阳市城区", population: 7067200 },
      { city: "Qingdao", area: "青岛市城区", population: 6007700 },
      { city: "Jinan", area: "济南市城区", population: 5878000 },
      { city: "Changsha", area: "长沙市城区", population: 5546400 },
      { city: "Harbin", area: "哈尔滨市城区", population: 5499300 },
      { city: "Zhengzhou", area: "郑州市城区", population: 5344800 },
      { city: "Kunming", area: "昆明市城区", population: 5340900 },
      { city: "Dalian", area: "大连市城区", population: 5208300 },
    ],
  },
  // India: the urban agglomerations of the 2011 census (Office of the Registrar General & Census Commissioner, India,
  // table A-04, towns and urban agglomerations by population size class).
  IN: {
    prefix: "in-census-2011",
    date: "2011-03-01",
    source: "Census of India 2011, Office of the Registrar General & Census Commissioner, table A-04 (urban agglomerations)",
    facts: [
      { city: "Mumbai", area: "Greater Mumbai UA", population: 18394912 },
      { city: "Delhi", area: "Delhi UA", population: 16349831 },
      { city: "Kolkata", area: "Kolkata UA", population: 14057991 },
      { city: "Chennai", area: "Chennai UA", population: 8653521 },
      { city: "Bengaluru", area: "Bangalore UA", population: 8520435 },
      { city: "Hyderabad", area: "Hyderabad UA", population: 7677018 },
      { city: "Ahmedabad", area: "Ahmadabad UA", population: 6357693 },
      { city: "Pune", area: "Pune UA", population: 5057709 },
      { city: "Surat", area: "Surat UA", population: 4591246 },
      { city: "Jaipur", area: "Jaipur", population: 3046163 },
      { city: "Kanpur", area: "Kanpur UA", population: 2920496 },
      { city: "Lucknow", area: "Lucknow UA", population: 2902920 },
      { city: "Nagpur", area: "Nagpur UA", population: 2497870 },
      { city: "Ghaziabad", area: "Ghaziabad UA", population: 2375820 },
      { city: "Indore", area: "Indore UA", population: 2170295 },
      { city: "Coimbatore", area: "Coimbatore UA", population: 2136916 },
      { city: "Kochi", area: "Kochi UA", population: 2119724 },
      { city: "Patna", area: "Patna UA", population: 2049156 },
      { city: "Kozhikode", area: "Kozhikode UA", population: 2028399 },
      { city: "Bhopal", area: "Bhopal UA", population: 1886100 },
    ],
  },
};

export { URBAN_FACTS };
export type { UrbanFacts };
