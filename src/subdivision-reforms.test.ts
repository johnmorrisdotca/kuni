import { describe, expect, it } from "vitest";

import { subdivisionReforms } from "./subdivision-reforms";
import { subdivision, subdivisions } from "./subdivisions";

describe("Resolution 202/2025/QH15", () => {
  const reform = subdivisionReforms("VN");

  it("leaves the current 63 ISO codes in place", () => {
    expect(subdivisions("VN")).toHaveLength(63);
    expect(subdivision("VN-26")?.code).toBe("VN-26");
    expect(subdivisionReforms("VN")?.units.some((unit) => unit.from.some((code) => subdivision(code) === null))).toBe(false);
  });

  it("takes the dates from Article 2 and the day the resolution was passed", () => {
    expect(reform).toMatchObject({
      country: "VN",
      law: "Resolution 202/2025/QH15",
      article: "1",
      url: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/6/202qh.signed.pdf",
      passed: "2025-06-12",
      effective: "2025-06-12",
      operating: "2025-07-01",
    });
    expect(reform?.effectLine).toBe("Nghị quyết này có hiệu lực thi hành từ ngày được thông qua.");
    expect(reform?.passedLine).toContain("12 tháng 6 năm 2025");
    expect(reform?.operatingLine).toContain("01 tháng 7 năm 2025");
  });

  it("partitions the 63 current codes and adds none", () => {
    const current = subdivisions("VN")!.map((one) => one.code).sort();
    const named = reform!.units.flatMap((unit) => [...unit.from]).sort();
    expect(named).toEqual(current);
    expect(new Set(named).size).toBe(63);
    for (const unit of reform!.units) expect(unit.from).toContain(unit.kept);
  });

  it("uses Japanese only where kuni already stores it for the kept code", () => {
    const without = reform!.units.filter((unit) => unit.nameJa === null);
    expect(without.map((unit) => unit.name)).toEqual(["Huế"]);
    expect(subdivision("VN-26")?.name.en).not.toBe("Huế");
    for (const unit of reform!.units) {
      if (unit.nameJa === null) continue;
      expect(unit.nameJa).toBe(subdivision(unit.kept)?.name.ja);
    }
  });

  it("follows Article 1, including a city named first and the eleven left unchanged", () => {
    expect(reform!.units[0]).toMatchObject({ clause: 1, name: "Tuyên Quang", kept: "VN-07", from: ["VN-03", "VN-07"] });
    expect(reform!.units.find((unit) => unit.clause === 7)).toMatchObject({ name: "Hải Phòng", kept: "VN-HP", from: ["VN-HP", "VN-61"] });
    expect(reform!.units.find((unit) => unit.clause === 16)).toMatchObject({
      name: "Hồ Chí Minh",
      kept: "VN-SG",
      from: ["VN-SG", "VN-43", "VN-57"],
    });
    const unchanged = reform!.units.filter((unit) => unit.clause === 24);
    expect(reform!.units.filter((unit) => unit.clause !== 24)).toHaveLength(23);
    expect(unchanged.map((unit) => unit.name)).toEqual([
      "Cao Bằng",
      "Điện Biên",
      "Hà Tĩnh",
      "Lai Châu",
      "Lạng Sơn",
      "Nghệ An",
      "Quảng Ninh",
      "Thanh Hóa",
      "Sơn La",
      "Hà Nội",
      "Huế",
    ]);
  });

  it("records nothing for another country", () => {
    expect(subdivisionReforms("JP")).toBeNull();
    expect(subdivisionReforms("xx")).toBeNull();
    expect(subdivisionReforms(" vn " )?.country).toBe("VN");
  });
});
