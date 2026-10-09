// The documents and the demo, held to the source. Plain JavaScript, so that `pnpm docs:make` (scripts/docs.mjs)
// can run this file with leave to write docs/strings-ja.md.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

import { describe, expect, it } from "vitest";

import { WORDS } from "../demo/words.js";
import * as codes from "./codes.ts";
import * as main from "./index.ts";
import * as load from "./load.ts";
import * as subdivisions from "./subdivisions.ts";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const readme = readFileSync("README.md", "utf8");

// A README section's text, from its heading to the next heading of the same level.
const section = (heading, level = "##") => {
  const from = readme.indexOf(`\n${level} ${heading}\n`);
  if (from < 0) throw new Error(`no "${level} ${heading}" in the README`);
  const next = readme.indexOf(`\n${level} `, from + 5);
  return readme.slice(from, next < 0 ? undefined : next);
};

describe("the README", () => {
  it("names every entry package.json exports, and no other", () => {
    const exported = Object.keys(pkg.exports).filter((key) => key !== "." && key !== "./package.json").map((key) => `${pkg.name}/${key.slice(2).replace("*", "<code>")}`);
    for (const entry of exported) expect(readme, entry).toContain(`\`${entry}\``);
    // Any other entry the README names is one country's: /subdivisions/jp, /subdivisions/us.
    const named = [...readme.matchAll(/`(@johnmorrisdotca\/kuni\/[\w<>/-]+)`/g)].map((match) => match[1]);
    for (const entry of named) if (!exported.includes(entry)) expect(entry).toMatch(/^@johnmorrisdotca\/kuni\/subdivisions\/[a-z]{2}$/);
  });

  it("names in its API table every runtime export of every entry", () => {
    const table = section("API");
    const rowOf = (entry) => table.split("\n").find((line) => line.startsWith(`| \`${entry}\``)) ?? "";
    for (const [entry, module] of [[pkg.name, main], [`${pkg.name}/codes`, codes], [`${pkg.name}/subdivisions`, subdivisions], [`${pkg.name}/load`, load]]) {
      const row = rowOf(entry);
      for (const name of Object.keys(module)) expect(row, `${name} is not in the API table's row for ${entry}`).toContain(`\`${name}\``);
    }
  });

  it("names in its Architecture tree every hand-written source file, and nothing that is not one", () => {
    const tree = section("Architecture");
    const named = [...tree.matchAll(/[├└]── ([\w.-]+\.ts)\b/g)].map((match) => match[1]).sort();
    const files = readdirSync("src").filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts")).sort();
    expect(named).toEqual(files);
  });

  it("pins a CDN address to this package's major version", () => {
    const major = pkg.version.split(".")[0];
    for (const pin of readme.split(`${pkg.name}@`).slice(1).map((rest) => /^\d+/.exec(rest)?.[0]).filter(Boolean)) expect(pin).toBe(major);
  });

  it("says the Japanese has not been reviewed, and links the way to correct it", () => {
    expect(readme).toContain("not yet reviewed by a native reader");
    expect(readme).toContain("issues/new?template=fix-a-translation.md");
  });

  it("gives every picture alt text and a dark twin that exists", () => {
    const pictures = [...readme.matchAll(/<img src="https:\/\/raw\.githubusercontent\.com\/johnmorrisdotca\/kuni\/main\/(docs\/images\/[\w-]+\.webp)" alt="([^"]*)"/g)];
    expect(pictures.length).toBeGreaterThan(0);
    for (const [, file, alt] of pictures) {
      expect(alt.length, file).toBeGreaterThan(40);
      expect(existsSync(file), file).toBe(true);
      expect(existsSync(file.replace("-light.", "-dark.")), file).toBe(true);
    }
  });
});

describe("the other documents", () => {
  it("say the version package.json says, and keep it under Unreleased in the changelog until it is released", () => {
    expect(main.VERSION).toBe(pkg.version);
    const log = readFileSync("CHANGELOG.md", "utf8");
    expect(log).toContain("\n## [Unreleased]\n");
    expect(log).not.toMatch(/^## \d/m);
  });

  it("keep SECURITY.md and CODE_OF_CONDUCT.md equal to the family's master text, and CONTRIBUTING.md starting with it", () => {
    for (const file of ["SECURITY.md", "CODE_OF_CONDUCT.md"]) expect(readFileSync(file, "utf8"), file).toBe(readFileSync(`scripts/community/${file}`, "utf8"));
    const master = readFileSync("scripts/community/CONTRIBUTING.md", "utf8");
    expect(readFileSync("CONTRIBUTING.md", "utf8").startsWith(`${master}\n## Particular to Kuni\n`)).toBe(true);
  });

  it("have the files a visitor looks for", () => {
    for (const file of [".github/ISSUE_TEMPLATE/report-a-bug.md", ".github/ISSUE_TEMPLATE/suggest-a-feature.md", ".github/ISSUE_TEMPLATE/fix-a-translation.md", ".github/ISSUE_TEMPLATE/add-my-project.md", ".github/pull_request_template.md", "SECURITY.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "LICENSE", "NOTICE.md", "docs/PLAN.md", "docs/disagreements.md", "docs/ja-gaps.md", "data-sources/README.md"]) {
      expect(existsSync(file), file).toBe(true);
    }
  });

  it("carry the Unicode licence in NOTICE.md, which the package ships", () => {
    const notice = readFileSync("NOTICE.md", "utf8");
    expect(notice).toContain("UNICODE LICENSE V3");
    expect(notice).toContain("CC0");
    expect(notice).toContain("Annexare Studio");
    expect(pkg.files).toContain("NOTICE.md");
  });
});

describe("the demo's words", () => {
  it("are in both languages, the same keys in each", () => {
    expect(Object.keys(WORDS.ja).sort()).toEqual(Object.keys(WORDS.en).sort());
    for (const key of Object.keys(WORDS.ja)) expect(WORDS.ja[key], key).not.toBe("");
  });

  it("keep docs/strings-ja.md as the demo's words, English beside Japanese (pnpm docs:make rewrites it)", () => {
    const cell = (text) => String(text).replace(/\|/g, "\\|").replace(/\n/g, " ");
    const lines = [
      "# Kuni's demo words, in English and Japanese",
      "",
      "Made from `demo/words.js` by `pnpm docs:make`; a test fails if the two differ, so this list is never out of date.",
      "",
      "**The Japanese has not yet been reviewed by a native reader.** If a line reads wrongly or unnaturally, please",
      "open a *Fix a translation* issue with the string's name. `{name}` and the other braces are filled in when shown.",
      "",
      "| Name | English | Japanese |",
      "| --- | --- | --- |",
    ];
    for (const key of Object.keys(WORDS.en)) lines.push(`| \`${key}\` | ${cell(WORDS.en[key])} | ${cell(WORDS.ja[key] ?? "")} |`);
    const made = `${lines.join("\n")}\n`;
    if (process.env.UPDATE_DOCS === "1") writeFileSync("docs/strings-ja.md", made);
    expect(readFileSync("docs/strings-ja.md", "utf8")).toBe(made);
  });
});
