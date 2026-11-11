// Folding: what two ways of typing a name have in common, so that "cote d'ivoire" finds Côte d'Ivoire,
// "ＵＳＡ" finds the United States and どいつ finds ドイツ. Pure and locale-free: the same answer in every
// engine, on a server and in a browser, which is the reason it does not use Intl.

const KATAKANA_FIRST = 0x30a1;
const KATAKANA_LAST = 0x30f6;
const KANA_OFFSET = 0x60;
const VOICED_MARK = "\u3099";
const SEMI_VOICED_MARK = "\u309a";
// Letters that do not decompose into a base letter and a mark, so that taking the marks off leaves them as they are: each is
// written as the letters it stands for, so that "Lodz" finds Łódź and "Strasse" finds Straße.
const PLAIN_LETTERS: Readonly<Record<string, string>> = { "\u0142": "l", "\u00df": "ss", "\u00f8": "o", "\u0111": "d", "\u0131": "i", "\u00e6": "ae", "\u0153": "oe", "\u00f0": "d", "\u00fe": "th" };
const PLAIN_LETTER = /[\u0142\u00df\u00f8\u0111\u0131\u00e6\u0153\u00f0\u00fe]/g;

/**
 * What two ways of typing a name have in common: width (full-width letters to ASCII, half-width katakana to full),
 * case, accents (except the two marks that make が and ぱ; and ł, ß, ø, đ, ı, æ, œ, ð and þ, which are written as l, ss, o, d, i, ae, oe, d and th), katakana to hiragana, apostrophes dropped, and every
 * other run of punctuation or space to one space. The lookups compare names folded, and so can a page.
 *
 * @param text - Any text.
 * @returns The text folded; "" for text that is only punctuation or space.
 * @example
 * ```ts
 * import { fold } from "@johnmorrisdotca/kuni";
 *
 * console.log(fold("Côte d'Ivoire"));   // "cote divoire"
 * console.log(fold("ＵＳＡ"));           // "usa"
 * console.log(fold("ドイツ"));           // "どいつ"
 * console.log(fold("Łódź"));           // "lodz"
 * console.log(fold("Straße"));         // "strasse"
 * ```
 */
const fold = (text: string): string =>
  String(text)
    .normalize("NFKC")
    .toLowerCase()
    .replace(PLAIN_LETTER, (letter: string) => PLAIN_LETTERS[letter]!)
    .normalize("NFD")
    .replace(/\p{M}/gu, (mark: string) => (mark === VOICED_MARK || mark === SEMI_VOICED_MARK ? mark : ""))
    .normalize("NFC")
    .replace(/[\u30a1-\u30f6]/g, (katakana: string) => {
      const code = katakana.charCodeAt(0);

      return code >= KATAKANA_FIRST && code <= KATAKANA_LAST ? String.fromCharCode(code - KANA_OFFSET) : katakana;
    })
    .replace(/['\u2018\u2019`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

// The key a lookup compares: the fold with its spaces taken out too, so "Viet Nam" and "Vietnam" meet.
const foldKey = (text: string): string => fold(text).replace(/ /g, "");

export { fold, foldKey };
