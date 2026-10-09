// Folding: what two ways of typing a name have in common, so that "cote d'ivoire" finds Côte d'Ivoire,
// "ＵＳＡ" finds the United States and どいつ finds ドイツ. Pure and locale-free: the same answer in every
// engine, on a server and in a browser, which is the reason it does not use Intl.

const KATAKANA_FIRST = 0x30a1;
const KATAKANA_LAST = 0x30f6;
const KANA_OFFSET = 0x60;
const VOICED_MARK = "\u3099";
const SEMI_VOICED_MARK = "\u309a";

// Width (NFKC: full-width letters to ASCII, half-width katakana to full), case, accents (the marks NFD
// splits off, except the two that make が and ぱ), katakana to hiragana, apostrophes dropped, and every
// other run of punctuation or space to one space.
const fold = (text: string): string =>
  String(text)
    .normalize("NFKC")
    .toLowerCase()
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
