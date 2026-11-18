// The demo page's own words, in the two languages it speaks. A `{name}` in a line is filled in when it is shown.
// docs/strings-ja.md lists these beside each other, and a test keeps that list true (`pnpm docs:make` rewrites it).
import { EN } from "./words-en.js";
import { JA } from "./words-ja.js";

export const WORDS = { en: EN, ja: JA };
