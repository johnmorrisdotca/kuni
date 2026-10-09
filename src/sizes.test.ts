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

  it("leave each country's data out of /load and /subdivision-facts, which import it only when asked", () => {
    expect(size("dist/load.js")).toBeLessThan(16 * KB);
    expect(size("dist/subdivision-facts.js")).toBeLessThan(16 * KB);
  });

  it("keep the groupings under 100 KB, out of the main entry", () => {
    expect(size("dist/groupings.js")).toBeLessThan(100 * KB);
  });

  it("keep the facts about every country under 30 KB, out of the main entry", () => {
    expect(size("dist/facts.js")).toBeLessThan(30 * KB);
  });

  it("keep Japan's subdivision facts under 6 KB, and every country's under 20 KB", () => {
    expect(size("dist/subdivision-facts/jp.js")).toBeLessThan(6 * KB);
    const files = readdirSync("dist/subdivision-facts").filter((file) => file.endsWith(".js"));
    expect(files).toHaveLength(200);
    for (const file of files) expect(size(`dist/subdivision-facts/${file}`), file).toBeLessThan(20 * KB);
  });
});
