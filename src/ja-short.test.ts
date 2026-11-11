import { describe, expect, it } from "vitest";

import { citiesOf } from "./cities";
import { jaShortOf } from "./ja-short";

describe("a city's short Japanese name", () => {
  it("drops 都, 市 or 区 for the common name a map labels it by", () => {
    expect(jaShortOf("東京都")).toBe("東京");
    expect(jaShortOf("大阪市")).toBe("大阪");
    expect(jaShortOf("横浜市")).toBe("横浜");
    expect(jaShortOf("札幌市")).toBe("札幌");
    expect(jaShortOf("京都市")).toBe("京都");
    expect(jaShortOf("那覇市")).toBe("那覇");
    expect(jaShortOf("新宿区")).toBe("新宿");
    expect(jaShortOf("ブルックリン区")).toBe("ブルックリン");
  });

  it("drops only the last 市 of a name that holds one already", () => {
    expect(jaShortOf("四日市市")).toBe("四日市");
    expect(jaShortOf("廿日市市")).toBe("廿日市");
    expect(jaShortOf("野々市市")).toBe("野々市");
    // Jinshi, China, is 津市.
    expect(jaShortOf("津市市")).toBe("津市");
  });

  it("drops 市 from a one-character city name, as maps print it", () => {
    for (const [full, short] of [["津市", "津"], ["堺市", "堺"], ["呉市", "呉"], ["萩市", "萩"], ["柏市", "柏"], ["旭市", "旭"], ["光市", "光"], ["関市", "関"], ["燕市", "燕"], ["蕨市", "蕨"]])
      expect(jaShortOf(full)).toBe(short);
  });

  it("drops Korea's special and metropolitan city suffixes whole", () => {
    expect(jaShortOf("ソウル特別市")).toBe("ソウル");
    expect(jaShortOf("釜山広域市")).toBe("釜山");
    expect(jaShortOf("世宗特別自治市")).toBe("世宗");
  });

  it("keeps a name whole where dropping would break or change it", () => {
    // One character left: a ward's 区 stays (中区 is "middle ward", 中 alone no name).
    expect(jaShortOf("中区")).toBe("中区");
    expect(jaShortOf("北区")).toBe("北区");
    // The country's name.
    expect(jaShortOf("クウェート市")).toBe("クウェート市");
    expect(jaShortOf("パナマ市")).toBe("パナマ市");
    // The 区 belongs to the name; 都 only for Tokyo; 町, 村 and 郡 are never dropped.
    expect(jaShortOf("ヤレン地区")).toBe("ヤレン地区");
    expect(jaShortOf("浦東新区")).toBe("浦東新区");
    expect(jaShortOf("イーリング・ロンドン特別区")).toBe("イーリング・ロンドン特別区");
    expect(jaShortOf("森の京都")).toBe("森の京都");
    expect(jaShortOf("大町")).toBe("大町");
    // A township is not its county; an autonomous region is not "autonomous".
    expect(jaShortOf("ワシントン郡区")).toBe("ワシントン郡区");
    expect(jaShortOf("クナ・ヤラ自治区")).toBe("クナ・ヤラ自治区");
    // A short form that would mean something else.
    expect(jaShortOf("中央市")).toBe("中央市");
    expect(jaShortOf("南九州市")).toBe("南九州市");
    expect(jaShortOf("雲南市")).toBe("雲南市");
    expect(jaShortOf("ケソン市")).toBe("ケソン市");
    // A short form that names something bigger: a region, mountains, a province, a sea, a prefecture.
    for (const name of ["東海市", "南アルプス市", "吉林市", "北海市", "山梨市", "栃木市", "沖縄市"]) expect(jaShortOf(name)).toBe(name);
  });

  it("keeps 都市 where it is the word for a city in a longer name, and drops 市 from a name ending 都", () => {
    expect(jaShortOf("関西文化学術研究都市")).toBe("関西文化学術研究都市");
    expect(jaShortOf("松島国際都市")).toBe("松島国際都市");
    expect(jaShortOf("ラアス・ラファーン工業都市")).toBe("ラアス・ラファーン工業都市");
    expect(jaShortOf("京都市")).toBe("京都");
    expect(jaShortOf("成都市")).toBe("成都");
    expect(jaShortOf("宜都市")).toBe("宜都");
    expect(jaShortOf("西都市")).toBe("西都");
  });

  it("is on every city that has a Japanese name, beside the full one", async () => {
    const japan = (await citiesOf("JP"))!;
    const tokyo = japan.find((city) => city.id === "Q1490")!;
    expect(tokyo.name).toMatchObject({ ja: "東京都", jaShort: "東京" });
    for (const city of japan) if (city.name.ja !== undefined) expect(city.name.jaShort, city.id).toBe(jaShortOf(city.name.ja));
    const nameless = japan.find((city) => city.name.ja === undefined);
    if (nameless !== undefined) expect(nameless.name.jaShort).toBeUndefined();
  });

  it("is absent where Wikidata's Japanese label names another place, dropped rather than made up", async () => {
    const { cityById } = await import("./cities");
    for (const id of ["Q983884", "Q766974", "Q1743479", "Q14279699"]) {
      const city = await cityById(id);
      expect(city?.name.ja, id).toBeUndefined();
      expect(city?.name.jaShort, id).toBeUndefined();
    }
  });
});
