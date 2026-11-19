// Vietnam's provincial rearrangement, read from the signed text of Resolution 202/2025/QH15
// (https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/6/202qh.signed.pdf, a scan of the signed pages).
// Article 1 names which current provinces form each unit. Article 2 clause 1 takes effect on the day the
// resolution was passed. Article 2 clause 2 says the new provincial governments officially operate from 1 July 2025.
// The current ISO 3166-2 codes are not changed: ISO has not published new ones. Japanese is kuni's existing
// name for the code whose name was kept, and is left empty when the resolution's name is not that current name.

/** One unit after a rearrangement, named by the law, made of current ISO 3166-2 codes.
 *
 * @example
 * ```ts
 * import type { SubdivisionReformUnit } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * const value: SubdivisionReformUnit = { name: "Tuyên Quang", nameJa: "トゥエンクアン省", clause: 1, kept: "VN-07", from: ["VN-03", "VN-07"] };
 * console.log(value.kept);
 * ```
 */
interface SubdivisionReformUnit {
  /** The name the law writes, in Vietnamese with its diacritics. */
  name: string;
  /** Japanese kuni already stores for `kept`, or null when the law's name is not that current name. */
  nameJa: string | null;
  /** The clause of the law's article that names this unit. */
  clause: number;
  /** The current ISO 3166-2 code whose name the law kept. It is one of `from`. */
  kept: string;
  /** The current ISO 3166-2 codes that form this unit, in the order the law names them. */
  from: readonly string[];
}

/** A dated note of one law that rearranges a country's current subdivisions. The codes themselves stay.
 *
 * @example
 * ```ts
 * import type { SubdivisionReform } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * const value: SubdivisionReform = {
 *   country: "VN", law: "Resolution 202/2025/QH15", article: "1",
 *   url: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/6/202qh.signed.pdf",
 *   passed: "2025-06-12", effective: "2025-06-12", operating: "2025-07-01",
 *   effectLine: "Nghị quyết này có hiệu lực thi hành từ ngày được thông qua.",
 *   passedLine: "thông qua ngày 12 tháng 6 năm 2025.",
 *   operatingLine: "chính thức hoạt động từ ngày 01 tháng 7 năm 2025.",
 *   units: [],
 * };
 * console.log(value.country);
 * ```
 */
interface SubdivisionReform {
  /** The ISO 3166-1 alpha-2 code of the country. */
  country: string;
  /** The law, by the short name it is cited under. */
  law: string;
  /** The article that lists which current units form which new one. */
  article: string;
  /** The signed text of the law. */
  url: string;
  /** The day the law was passed, as YYYY-MM-DD. */
  passed: string;
  /** The day the law takes effect, as YYYY-MM-DD. For this resolution, the day it was passed. */
  effective: string;
  /** The day the rearranged governments officially operate, as YYYY-MM-DD. */
  operating: string;
  /** The law's own sentence for when it takes effect. */
  effectLine: string;
  /** The law's own words for the day it was passed. */
  passedLine: string;
  /** The law's own words for the day the new governments operate. */
  operatingLine: string;
  /** The units the law names, in the order of its clauses. */
  units: readonly SubdivisionReformUnit[];
}

const code = (short: string): string => `VN-${short}`;

/** clause, the resolution's name, Japanese already stored for the kept code ("" when none), the kept short code, the short codes in the clause. */
const ROWS: readonly (readonly [number, string, string, string, readonly string[]])[] = [
  [1, "Tuyên Quang", "トゥエンクアン省", "07", ["03", "07"]],
  [2, "Lào Cai", "ラオカイ省", "02", ["06", "02"]],
  [3, "Thái Nguyên", "タイグエン省", "69", ["53", "69"]],
  [4, "Phú Thọ", "フート省", "68", ["70", "14", "68"]],
  [5, "Bắc Ninh", "バクニン省", "56", ["54", "56"]],
  [6, "Hưng Yên", "フンイエン省", "66", ["20", "66"]],
  [7, "Hải Phòng", "ハイフォン", "HP", ["HP", "61"]],
  [8, "Ninh Bình", "ニンビン省", "18", ["63", "67", "18"]],
  [9, "Quảng Trị", "クアンチ省", "25", ["24", "25"]],
  [10, "Đà Nẵng", "ダナン", "DN", ["DN", "27"]],
  [11, "Quảng Ngãi", "クアンガイ省", "29", ["28", "29"]],
  [12, "Gia Lai", "ザライ省", "30", ["31", "30"]],
  [13, "Khánh Hòa", "カインホア省", "34", ["36", "34"]],
  [14, "Lâm Đồng", "ラムドン省", "35", ["72", "40", "35"]],
  [15, "Đắk Lắk", "ダクラク省", "33", ["32", "33"]],
  [16, "Hồ Chí Minh", "ホーチミン市", "SG", ["SG", "43", "57"]],
  [17, "Đồng Nai", "ドンナイ省", "39", ["58", "39"]],
  [18, "Tây Ninh", "タイニン省", "37", ["41", "37"]],
  [19, "Cần Thơ", "カントー", "CT", ["CT", "73", "52"]],
  [20, "Vĩnh Long", "ヴィンロン省", "49", ["50", "51", "49"]],
  [21, "Đồng Tháp", "ドンタップ省", "45", ["46", "45"]],
  [22, "Cà Mau", "カマウ省", "59", ["55", "59"]],
  [23, "An Giang", "アンザン省", "44", ["47", "44"]],
  // Article 1 clause 24: not rearranged. The resolution calls the last of these Huế; the current code is still Thừa Thiên–Huế, so no Japanese is attached to that wording.
  [24, "Cao Bằng", "カオバン省", "04", ["04"]],
  [24, "Điện Biên", "ディエンビエン省", "71", ["71"]],
  [24, "Hà Tĩnh", "ハティン省", "23", ["23"]],
  [24, "Lai Châu", "ライチャウ省", "01", ["01"]],
  [24, "Lạng Sơn", "ランソン省", "09", ["09"]],
  [24, "Nghệ An", "ゲアン省", "22", ["22"]],
  [24, "Quảng Ninh", "クアンニン省", "13", ["13"]],
  [24, "Thanh Hóa", "タインホア省", "21", ["21"]],
  [24, "Sơn La", "ソンラ省", "05", ["05"]],
  [24, "Hà Nội", "ハノイ", "HN", ["HN"]],
  [24, "Huế", "", "26", ["26"]],
];

const units: readonly SubdivisionReformUnit[] = Object.freeze(
  ROWS.map(([clause, name, nameJa, kept, from]) =>
    Object.freeze({
      clause,
      name,
      nameJa: nameJa === "" ? null : nameJa,
      kept: code(kept),
      from: Object.freeze(from.map(code)),
    }),
  ),
);

const VN_REFORM: SubdivisionReform = Object.freeze({
  country: "VN",
  law: "Resolution 202/2025/QH15",
  article: "1",
  url: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/6/202qh.signed.pdf",
  passed: "2025-06-12",
  effective: "2025-06-12",
  operating: "2025-07-01",
  effectLine: "Nghị quyết này có hiệu lực thi hành từ ngày được thông qua.",
  passedLine: "thông qua ngày 12 tháng 6 năm 2025.",
  operatingLine: "chính thức hoạt động từ ngày 01 tháng 7 năm 2025.",
  units,
});

/**
 * The dated note of a country's subdivision rearrangement, or null when none is recorded.
 *
 * The current ISO codes stay as they are. `units` says which of those codes the law joins, and the name it writes.
 *
 * @param country - An ISO 3166-1 alpha-2 code, in any case.
 * @returns The rearrangement, or null when this package has none for that country.
 * @example
 * ```ts
 * import { subdivisionReforms, subdivisions } from "@johnmorrisdotca/kuni/subdivisions";
 *
 * console.log(subdivisions("VN")?.length); // 63
 * console.log(subdivisionReforms("VN")?.effective); // "2025-06-12"
 * console.log(subdivisionReforms("VN")?.operating); // "2025-07-01"
 * console.log(subdivisionReforms("VN")?.units.length); // 34
 * console.log(subdivisionReforms("vn")?.law); // "Resolution 202/2025/QH15"
 * console.log(subdivisionReforms("JP")); // null
 * ```
 */
const subdivisionReforms = (country: string): SubdivisionReform | null => {
  if (typeof country !== "string" || country.trim().toUpperCase() !== "VN") return null;
  return VN_REFORM;
};

export { subdivisionReforms };
export type { SubdivisionReform, SubdivisionReformUnit };
