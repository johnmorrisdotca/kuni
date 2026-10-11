import { describe, expect, it } from "vitest";
import { readCardColors } from "./element";

describe("card colour attributes", () => {
  it("accepts country and subdivision hex colours without losing leading zeros", () => {
    expect(readCardColors("JP:#02f,JP-13:#8a3b3b,GB:#1234,CA:#12345678")).toEqual({ JP: "#02f", "JP-13": "#8a3b3b", GB: "#1234", CA: "#12345678" });
  });
  it("rejects malformed lengths, markup and CSS fragments", () => {
    for (const value of ["JP:#12", "JP:#12345", "JP:#1234567", "JP:url(evil)", "JP:red;fill:red", "JP:#fff,", "<img>:#fff", "JP:" + "f".repeat(16001)]) expect(readCardColors(value)).toBeNull();
    expect(readCardColors(null)).toEqual({});
  });
});
