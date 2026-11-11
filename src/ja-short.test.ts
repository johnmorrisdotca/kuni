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

  it("drops Korea's special and metropolitan city suffixes whole", () => {
    expect(jaShortOf("ソウル特別市")).toBe("ソウル");
    expect(jaShortOf("釜山広域市")).toBe("釜山");
    expect(jaShortOf("世宗特別自治市")).toBe("世宗");
  });

  it("keeps a name whole where dropping would break or change it", () => {
    // One character left.
    expect(jaShortOf("津市")).toBe("津市");
    expect(jaShortOf("堺市")).toBe("堺市");
    expect(jaShortOf("中区")).toBe("中区");
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
  });

  it("is on every city that has a Japanese name, beside the full one", async () => {
    const japan = (await citiesOf("JP"))!;
    const tokyo = japan.find((city) => city.id === "Q1490")!;
    expect(tokyo.name).toMatchObject({ ja: "東京都", jaShort: "東京" });
    for (const city of japan) if (city.name.ja !== undefined) expect(city.name.jaShort, city.id).toBe(jaShortOf(city.name.ja));
    const nameless = japan.find((city) => city.name.ja === undefined);
    if (nameless !== undefined) expect(nameless.name.jaShort).toBeUndefined();
  });
});
