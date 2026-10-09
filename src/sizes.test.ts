// What a page pays for each entry, measured on the built files (pnpm check builds before it tests). The main
// entry is the countries and their lookups; one country's subdivisions are a small file of their own.
import { existsSync, readdirSync, statSync } from "node:fs";

import { describe, expect, it } from "vitest";

const KB = 1024;
const size = (path: string): number => {
  if (!existsSync(path)) throw new Error(`${path} is not built: run pnpm build first (pnpm check does)`);

  return statSync(path).size;
};

describe("the built entries", () => {
  it("keep the main entry's ESM under 70 KB", () => {
    expect(size("dist/index.js")).toBeLessThan(70 * KB);
  });

  it("keep Japan's subdivisions under 3 KB, and every country's under 14 KB", () => {
    expect(size("dist/subdivisions/jp.js")).toBeLessThan(3 * KB);
    const files = readdirSync("dist/subdivisions").filter((file) => file.endsWith(".js"));
    expect(files).toHaveLength(200);
    for (const file of files) expect(size(`dist/subdivisions/${file}`), file).toBeLessThan(14 * KB);
  });

  it("keep the codes alone under 3 KB", () => {
    expect(size("dist/codes.js")).toBeLessThan(3 * KB);
  });

  it("leave each country's data out of /load, which imports it only when asked", () => {
    expect(size("dist/load.js")).toBeLessThan(16 * KB);
  });
});
