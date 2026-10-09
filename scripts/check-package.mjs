// Packs the package the way it is published (`npm pack`, npm and not pnpm), installs the tarball into an
// empty project, and uses it as somebody who installed it would: every entry in `exports` imported by ESM and
// loaded by `require`, one country's subdivisions by their own subpath, /load's dynamic import in both
// module systems, and the types checked by TypeScript under Node's own resolution for both. A package whose
// `exports` name a file that is not in the tarball fails here, before it can be published.
// `pnpm test:package` builds first.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const windows = process.platform === "win32";
const scratch = mkdtempSync(join(tmpdir(), "kuni-package-"));

// Run a command and hand back what it printed. On Windows, npm is a .cmd file, which only a shell runs.
function run(command, args, cwd, viaShell = false) {
  const shell = viaShell && windows;
  const ran = spawnSync(shell && /[\\/]/.test(command) ? `"${command}"` : command, args, { cwd, encoding: "utf8", shell });
  if (ran.status !== 0) {
    console.error(`FAIL ${command} ${args.join(" ")}\n${ran.stdout}\n${ran.stderr}`);
    process.exit(1);
  }

  return ran.stdout;
}

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

// 1. Pack, with npm.
const packed = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", scratch], root, true));
const tarball = join(scratch, packed[0].filename);
const inTarball = new Set(packed[0].files.map((file) => file.path));
console.log(`ok   npm pack: ${packed[0].filename}, ${packed[0].files.length} files, ${Math.round(packed[0].size / 1024)} KB packed`);
const shipped = [...inTarball].filter((file) => file.startsWith("docs/") || file.startsWith("data-sources/") || /\.(webp|png|jpe?g|gif)$/.test(file));
if (shipped.length > 0) fail(`the tarball holds pictures, docs or data sources: ${shipped.join(", ")}`);
console.log("ok   no picture, nothing from docs/ and nothing from data-sources/ is in the tarball");

// 2. Everything package.json points at is in the tarball; a wildcard is checked through Japan's file.
const targets = (entry) => (typeof entry === "string" ? [entry] : Object.values(entry).flatMap(targets));
const pointed = [pkg.main, pkg.module, pkg.types, ...Object.values(pkg.exports).flatMap(targets)].map((file) => file.replace("*", "jp"));
for (const file of new Set(pointed)) if (!inTarball.has(file.replace(/^\.\//, ""))) fail(`package.json points at ${file}, which is not in the tarball`);
console.log(`ok   every file package.json points at is in the tarball (${new Set(pointed).size})`);
for (const named of pkg.files) {
  if (![...inTarball].some((file) => file === named || file.startsWith(`${named}/`))) fail(`package.json's files names ${named}, which is not in the tarball`);
}
const countryFiles = [...inTarball].filter((file) => /^dist\/subdivisions\/[a-z]{2}\.js$/.test(file));
if (countryFiles.length !== 200) fail(`the tarball has ${countryFiles.length} country files, not 200`);
console.log(`ok   everything in package.json's files is in the tarball, and the 200 countries' files`);

// 3. Install it into an empty project.
const project = join(scratch, "project");
mkdirSync(project);
writeFileSync(join(project, "package.json"), JSON.stringify({ name: "scratch", private: true, version: "0.0.0" }));
run("npm", ["install", "--no-audit", "--no-fund", "--silent", tarball], project, true);
console.log("ok   npm install of the tarball");

// What the built package in this checkout answers: the installed one must answer the same.
const local = await import(new URL("../dist/index.js", import.meta.url).href);
const localSubdivisions = await import(new URL("../dist/subdivisions.js", import.meta.url).href);
const expected = {
  japan: local.country("JP")?.name.ja,
  germany: local.countryByName("ドイツ")?.alpha2,
  holland: local.countryByName("Holland")?.alpha2,
  ontario: localSubdivisions.subdivisionByName("オンタリオ州", { country: "CA" })?.code,
  tokyo: localSubdivisions.subdivision("JP-13")?.reading,
};

// 4. Every entry in `exports`, by ESM and by require, and the subpaths a page would use.
const entries = Object.keys(pkg.exports)
  .filter((key) => key !== "./package.json")
  .map((key) => (key === "." ? pkg.name : `${pkg.name}/${key.slice(2).replace("*", "jp")}`));
const probe = `
const answers = (m, s) => ({
  japan: m.country("JP")?.name.ja,
  germany: m.countryByName("ドイツ")?.alpha2,
  holland: m.countryByName("Holland")?.alpha2,
  ontario: s.subdivisionByName("オンタリオ州", { country: "CA" })?.code,
  tokyo: s.subdivision("JP-13")?.reading,
});
const wanted = ${JSON.stringify(JSON.stringify(expected))};`;
writeFileSync(
  join(project, "esm.mjs"),
  `${entries.map((entry, at) => `import * as m${at} from ${JSON.stringify(entry)};`).join("\n")}
import japan from "${pkg.name}/subdivisions/jp";
import { loadSubdivisions } from "${pkg.name}/load";
${probe}
const all = [${entries.map((_, at) => `m${at}`).join(", ")}];
const names = ${JSON.stringify(entries)};
all.forEach((m, at) => { if (Object.keys(m).length === 0) throw new Error(names[at] + " exports nothing"); });
if (JSON.stringify(answers(m0, m${entries.indexOf(`${pkg.name}/subdivisions`)})) !== wanted) throw new Error("the installed package answered " + JSON.stringify(answers(m0, m2)));
if (m0.VERSION !== ${JSON.stringify(pkg.version)}) throw new Error("VERSION is " + m0.VERSION);
if (japan.length !== 47 || japan[12].code !== "JP-13") throw new Error("subdivisions/jp gave " + japan.length);
const canada = await loadSubdivisions("CA");
if (canada.length !== 13) throw new Error("loadSubdivisions(CA) gave " + canada?.length);
console.log(names.join(" "));
`,
);
writeFileSync(
  join(project, "cjs.cjs"),
  `const names = ${JSON.stringify(entries)};
${probe}
for (const name of names) { const m = require(name); if (Object.keys(m).length === 0) throw new Error(name + " exports nothing"); }
if (JSON.stringify(answers(require(${JSON.stringify(pkg.name)}), require("${pkg.name}/subdivisions"))) !== wanted) throw new Error("the package answered differently by require");
const { SUBDIVISIONS } = require("${pkg.name}/subdivisions/jp");
if (SUBDIVISIONS.length !== 47) throw new Error("subdivisions/jp by require gave " + SUBDIVISIONS.length);
require("${pkg.name}/load").loadSubdivisions("JP").then((list) => {
  if (list.length !== 47) throw new Error("loadSubdivisions by require gave " + list.length);
  console.log(names.join(" "));
});
`,
);
console.log(`ok   import:  ${run(process.execPath, ["esm.mjs"], project).trim()}`);
console.log(`ok   require: ${run(process.execPath, ["cjs.cjs"], project).trim()}`);

// 5. The types, as TypeScript finds them through `exports` under Node's resolution, from ESM and from CommonJS.
const typed = `import { country, countryByName, type Country } from "${pkg.name}";
import { COUNTRY_CODES, isCountryCode, type CountryCode } from "${pkg.name}/codes";
import { subdivision, subdivisionByName, type Subdivision } from "${pkg.name}/subdivisions";
import japan from "${pkg.name}/subdivisions/jp";
import { loadSubdivisions } from "${pkg.name}/load";

const one: Country | null = country("JP");
const code: CountryCode = COUNTRY_CODES[0];
const known: boolean = isCountryCode("JP");
const place: Subdivision | null = subdivision("JP-13") ?? subdivisionByName("Ontario");
const first: Subdivision | undefined = japan[0];
const later: Promise<readonly Subdivision[] | null> = loadSubdivisions("CA");
export { code, first, known, later, one, place, countryByName };
`;
writeFileSync(join(project, "types.mts"), typed);
writeFileSync(join(project, "types.cts"), typed.replace(/^import (\w+) from/m, "import $1 from"));
writeFileSync(
  join(project, "tsconfig.json"),
  JSON.stringify({ compilerOptions: { module: "nodenext", moduleResolution: "nodenext", target: "es2022", strict: true, noEmit: true, types: [], skipLibCheck: false }, files: ["types.mts", "types.cts"] }),
);
run(process.execPath, [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", project], project);
console.log("ok   types: every entry resolves and checks under nodenext, from ESM (.mts) and CommonJS (.cts)");

rmSync(scratch, { recursive: true, force: true });
console.log("the package installs and runs as published, on", process.platform, process.version);
