// The record of what the data is made from: data-sources/sources.json lists every downloaded input with its
// address, the day it was read and its SHA-256. The fetch scripts write it; scripts/build-data.ts reads each
// file through `readSource`, which refuses a file whose bytes are not the recorded ones.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCES_DIR = join(ROOT, "data-sources");
const MANIFEST_PATH = join(SOURCES_DIR, "sources.json");
const USER_AGENT = "kuni-data/0.1 (https://github.com/johnmorrisdotca/kuni; john@johnmorris.ca)";

interface SourceFile {
  path: string; // Relative to data-sources/
  url: string;
  read: string; // The day it was downloaded, YYYY-MM-DD
  sha256: string;
  note: string;
}

interface Manifest {
  files: SourceFile[];
}

const sha256 = (bytes: Buffer | string): string => createHash("sha256").update(bytes).digest("hex");

const readManifest = (): Manifest => {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  } catch {
    return { files: [] };
  }
};

const writeManifest = (manifest: Manifest): void => {
  const files = [...manifest.files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  writeFileSync(MANIFEST_PATH, `${JSON.stringify({ files }, null, 2)}\n`);
};

// Replaces the entry for the same path, so a second download of a file leaves one line for it.
const recordFile = (manifest: Manifest, entry: SourceFile): Manifest => ({
  files: [...manifest.files.filter((file) => file.path !== entry.path), entry],
});

// A recorded file's text, after checking its bytes against the manifest. A file that changed on disk, or one
// the manifest does not know, stops the build rather than quietly making different data.
const readSource = (manifest: Manifest, path: string): { text: string; entry: SourceFile } => {
  const entry = manifest.files.find((file) => file.path === path);
  if (entry === undefined) throw new Error(`data-sources/${path} is not in data-sources/sources.json: run pnpm data:fetch`);
  const bytes = readFileSync(join(SOURCES_DIR, path));
  const found = sha256(bytes);
  if (found !== entry.sha256) throw new Error(`data-sources/${path} has SHA-256 ${found}; sources.json records ${entry.sha256}`);

  return { text: bytes.toString("utf8"), entry };
};

export { MANIFEST_PATH, readManifest, readSource, recordFile, ROOT, sha256, SOURCES_DIR, USER_AGENT, writeManifest };
export type { Manifest, SourceFile };
