import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const EXAMPLE = /( \* ```ts(?: no-run)?\n)([\s\S]*?)(\n \* ```)/g;
const PREFIX = /^ \* ?/;
const CODE_TYPE = "/** One of the 250 country codes, as a type: \"JP\" | \"US\" | ... */";
const CODE_TYPE_DOC = `/** One of the 250 country codes, as a type: "JP" | "US" | ...
 * @example
 * \`\`\`ts
 * import type { CountryCode } from "@johnmorrisdotca/kuni/codes";
 * const code: CountryCode = "JP";
 * console.log(code);
 * \`\`\`
 */`;

export function documentDataSource(source: string): string {
  return source.replace(CODE_TYPE, CODE_TYPE_DOC).replace(EXAMPLE, (_all: string, begin: string, content: string, end: string) => {
    let code = content.split("\n").map((line) => line.replace(PREFIX, "")).join("\n");
    const parsed = ts.createSourceFile("example.ts", code, ts.ScriptTarget.Latest, true);
    const edits: {start: number; end: number; value: string}[] = [];
    for (const statement of parsed.statements) {
      if (!ts.isExpressionStatement(statement)) continue;
      const expression = statement.expression;
      if (ts.isCallExpression(expression) && expression.expression.getText(parsed) === "console.log") continue;
      if (ts.isBinaryExpression(expression) || ts.isPostfixUnaryExpression(expression)) continue;
      edits.push({start: expression.getStart(parsed), end: expression.end, value: `console.log(${expression.getText(parsed)})`});
    }
    for (const edit of edits.sort((left, right) => right.start-left.start)) code = code.slice(0,edit.start)+edit.value+code.slice(edit.end);
    return begin+code.split("\n").map((line) => ` *${line ? " "+line : ""}`).join("\n")+end;
  });
}

export function writeDocumentedFile(file: string, source: string): void {
  writeFileSync(file, file.endsWith(".ts") ? documentDataSource(source) : source);
}

export function refreshDataDocs(): void {
  let changed = 0;
  for (const directory of ["src/data", "src/subdivisions", "src/subdivision-facts"]) {
    for (const name of readdirSync(directory, {recursive:true})) {
      if (typeof name !== "string" || !name.endsWith(".ts")) continue;
      const file = join(directory,name), before = readFileSync(file,"utf8"), after = documentDataSource(before);
      if (before !== after) {writeFileSync(file,after);changed++;}
    }
  }
  console.log(`Refreshed examples in ${changed} generated files; stored data and metadata retained.`);
}
