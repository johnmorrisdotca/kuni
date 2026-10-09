// Every public export is documented where an editor shows it: a doc comment (/** */, which the built .d.ts keeps) on
// every function, constant and type, every field of every public interface, @param for each parameter and @returns
// on every function, and an @example on every function and constant. Then every @example is run, against the
// source, and each line written `expression; // value` is checked: the value after // is what the line gives.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { name: string; exports: Record<string, unknown> };

// Every entry in package.json, and one country for each wildcard entry: its source file and the name it is imported by.
const entries = Object.entries(pkg.exports)
  .filter(([key]) => key !== "./package.json")
  .map(([key, value]) => {
    const built = ((value as { import: { default: string } }).import.default as string).replace("*", "jp");
    const file = join(ROOT, built.replace("./dist/", "src/").replace(/\.js$/, ".ts").replace("src/subdivision-facts.ts", "src/subdivisionFacts.ts"));

    return { name: key === "." ? pkg.name : `${pkg.name}/${key.slice(2).replace("*", "jp")}`, file };
  });

const program = ts.createProgram(
  entries.map((entry) => entry.file),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, strict: true, noEmit: true },
);
const checker = program.getTypeChecker();

interface Documented {
  where: string;
  name: string;
  kind: "function" | "const" | "type" | "field";
  doc: string;
  tags: ts.JSDocTagInfo[];
  params: string[];
}

const found: Documented[] = [];
const examples: { where: string; code: string }[] = [];
const seen = new Set<ts.Symbol>();

for (const entry of entries) {
  const source = program.getSourceFile(entry.file);
  if (source === undefined) throw new Error(`no source for ${entry.name}: ${entry.file}`);
  const module = checker.getSymbolAtLocation(source)!;
  for (const exported of checker.getExportsOfModule(module)) {
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const declaration = symbol.declarations?.[0];
    if (declaration === undefined) continue;
    const where = `${entry.name} ${exported.name}`;
    const doc = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
    const tags = symbol.getJsDocTags(checker);
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const calls = type.getCallSignatures();
    const isType = (symbol.flags & (ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface)) !== 0;
    const kind = isType ? "type" : calls.length > 0 ? "function" : "const";
    const params = calls[0]?.getParameters().map((one) => one.name) ?? [];
    if (!seen.has(symbol)) {
      for (const tag of tags) if (tag.name === "example") examples.push({ where, code: ts.displayPartsToString(tag.text) });
    }
    seen.add(symbol);
    found.push({ where, name: exported.name, kind, doc, tags, params });
    // Every field of a public interface.
    if (symbol.flags & ts.SymbolFlags.Interface) {
      for (const member of checker.getDeclaredTypeOfSymbol(symbol).getProperties()) {
        found.push({ where: `${where}.${member.name}`, name: member.name, kind: "field", doc: ts.displayPartsToString(member.getDocumentationComment(checker)).trim(), tags: [], params: [] });
      }
    }
  }
}

describe("the public API's documentation", () => {
  it("finds the exports of every entry", () => {
    expect(found.filter((one) => one.kind === "function").length).toBeGreaterThan(25);
  });

  it("gives every export and every field of a public interface a doc comment", () => {
    expect(found.filter((one) => one.doc.length < 10).map((one) => one.where)).toEqual([]);
  });

  it("gives every function and constant an @example", () => {
    expect(found.filter((one) => one.kind !== "type" && one.kind !== "field" && !one.tags.some((tag) => tag.name === "example")).map((one) => one.where)).toEqual([]);
  });

  it("gives every function an @param for each parameter, and an @returns", () => {
    const missing: string[] = [];
    for (const one of found.filter((entry) => entry.kind === "function")) {
      const named = one.tags.filter((tag) => tag.name === "param").map((tag) => ts.displayPartsToString(tag.text).split(/\s/)[0]);
      for (const param of one.params) if (!named.includes(param)) missing.push(`${one.where} @param ${param}`);
      if (!one.tags.some((tag) => tag.name === "returns")) missing.push(`${one.where} @returns`);
    }
    expect(missing).toEqual([]);
  });
});

// ----- Running the examples ----------------------------------------------------------------------------------

// An entry's name to its source module, so an example runs against the code in this checkout.
const modules: Record<string, () => Promise<Record<string, unknown>>> = Object.fromEntries(entries.map((entry) => [entry.name, () => import(/* @vite-ignore */ entry.file)]));

// A line written `expression; // value`, where the value reads as JSON, is checked; any other line just runs.
const CHECKED = /^(\s*)(?!const |let |import |for |if |await loadSubdivisionFacts\("XX"\))(.+?);\s*\/\/\s*(.+?)\s*$/;

const asJs = (code: string): string => {
  // Only a line that starts a statement is checked: one after a line that ended one.
  let starts = true;
  const body = code
    .replace(/^```\w*\n?|```\s*$/gm, "")
    .split("\n")
    .map((line) => {
      const first = starts;
      starts = line.trim() === "" || /;\s*(\/\/.*)?$/.test(line) || /^import /.test(line);
      if (!first) return line;
      const imported = /^import \{([^}]+)\} from "([^"]+)";/.exec(line);
      if (imported !== null) return `const {${imported[1].replace(/\btype \w+,?/g, "")}} = await __import(${JSON.stringify(imported[2])});`;
      const fallback = /^import (\w+) from "([^"]+)";/.exec(line);
      if (fallback !== null) return `const ${fallback[1]} = (await __import(${JSON.stringify(fallback[2])})).default;`;
      const checked = CHECKED.exec(line);
      if (checked === null) return line;
      const value = checked[3].split(/[;,]\s|\s(?=[a-z(])/)[0];
      try {
        JSON.parse(value);
      } catch {
        return line;
      }

      return `${checked[1]}__check(${checked[2]}, ${value}, ${JSON.stringify(line.trim())});`;
    })
    .join("\n");

  return ts.transpileModule(body, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
};

describe("every @example", () => {
  it("has some lines that check a value", () => {
    expect(examples.filter((one) => asJs(one.code).includes("__check(")).length).toBeGreaterThan(20);
  });

  for (const example of examples) {
    it(`runs, and gives what it says: ${example.where}`, async () => {
      const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (...names: string[]) => (...values: unknown[]) => Promise<void>;
      const run = new AsyncFunction("__import", "__check", asJs(example.code));
      const failures: string[] = [];
      await run(
        async (name: string) => {
          const load = modules[name];
          if (load === undefined) throw new Error(`the example imports ${name}, which is not an entry`);

          return load();
        },
        (actual: unknown, wanted: unknown, line: string) => {
          if (JSON.stringify(actual) !== JSON.stringify(wanted)) failures.push(`${line}\n    gives ${JSON.stringify(actual)}`);
        },
      );
      expect(failures).toEqual([]);
    });
  }
});
