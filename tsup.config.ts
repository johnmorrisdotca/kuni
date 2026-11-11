import { readdirSync } from "node:fs";
import { basename } from "node:path";

import type { Plugin } from "esbuild";
import { defineConfig } from "tsup";

// Two entries for each country with subdivisions (src/subdivisions/<code>.ts and src/subdivision-facts/<code>.ts,
// written by scripts/build-data.ts), beside the entries written by hand.
const countryEntries: Record<string, string> = Object.fromEntries(
  ["subdivisions", "subdivision-facts", "cities"].flatMap((folder) =>
    readdirSync(`src/${folder}`)
      // A country's file; in /cities also its light list (names-<code>) and the parts of the split tiers (100k-<key>).
      .filter((file) => /^[a-z]{2}\.ts$/.test(file) || (folder === "cities" && /^(names-[a-z]{2}|(capitals|100k)-[a-z0-9-]+)\.ts$/.test(file)))
      .map((file) => [`${folder}/${basename(file, ".ts")}`, `src/${folder}/${file}`]),
  ),
);

// /load imports each country's entry when it is asked for. Left as an import of the built entry file, so the
// data is not copied into load.js, and a page's own bundler makes a chunk of each country.
const countryImports: Plugin = {
  name: "kuni-country-imports",
  setup(build) {
    const extension = build.initialOptions.format === "cjs" ? "cjs" : "js";
    build.onResolve({ filter: /^\.\/element\.js$/ }, () => ({ path: `./element.${extension}`, external: true }));
    build.onResolve({ filter: /^\.\/cities\/(capitals|1m|100k|15k|where)\.js$/ }, (args) => ({ path: `${args.path.slice(0, -3)}.${extension}`, external: true }));
    build.onResolve({ filter: /^\.\.\/(subdivisions|subdivision-facts|cities)\/([a-z]{2}|names-[a-z]{2}|(capitals|100k)-[a-z0-9-]+)\.js$/ }, (args) => ({
      path: `./${args.path.split("/")[1]}/${basename(args.path, ".js")}.${extension}`,
      external: true,
    }));
  },
};

const shared = {
  format: ["esm", "cjs"] as ("esm" | "cjs")[],
  dts: true,
  // Each entry stands alone, so that one country's file carries only its own data and the small helper.
  splitting: false,
  sourcemap: false,
  minify: false,
  target: "es2022",
  outDir: "dist",
  esbuildPlugins: [countryImports],
};

export default defineConfig([
  {
    ...shared,
entry: { element: "src/element.ts", "element-define": "src/element-define.ts", index: "src/index.ts", codes: "src/codes.ts", subdivisions: "src/subdivisions.ts", load: "src/load.ts", facts: "src/facts.ts", zones: "src/zones.ts", "subdivision-facts": "src/subdivision-facts.ts", groupings: "src/groupings.ts", withdrawn: "src/withdrawn.ts", cities: "src/cities.ts", "cities/capitals": "src/cities/capitals.ts", "cities/1m": "src/cities/1m.ts", "cities/100k": "src/cities/100k.ts", "cities/where": "src/cities/where.ts", places: "src/places.ts" },
    // Japanese names stay as they are, rather than as \u escapes three times their size.
    esbuildOptions(options) {
      options.charset = "utf8";
    },
  },
  {
    ...shared,
    entry: countryEntries,
    // A country's entry is data and the few lines that read it: without the indentation, Japan's is under 3 KB.
    esbuildOptions(options) {
      options.charset = "utf8";
      options.minifyWhitespace = true;
    },
  },
]);
