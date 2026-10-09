// Checks on CLDR's English subdivision names, against each place's English label on Wikidata: the ways a name was
// found wrong in kuni 1.0.0, each a pattern a test and the build look for in every one of the 5,046.
//
//   - "cut short": Wikidata's label has a word that starts with the name and goes on (Peter / City of Peterborough,
//     Marl / Marlborough District);
//   - "adjective": the name is the people's word where the place's name is wanted (Chechen / Chechnya, Altai /
//     Altai Republic): Wikidata's label is "<other> Republic" or "Republic of <other>", or ends in -ia or -ya where
//     the name, starting with the same four letters, does not;
//   - "marks stripped": the same letters, with Wikidata's accents and tone marks gone (Can Tho / Cần Thơ);
//   - "swapped": the name is Wikidata's label of another subdivision of the same country (Chiayi County at the
//     city's code);
//   - "former place": the name is the label of an item Wikidata marks former or historical for the same code, and not
//     the current one's (Morocco's codes, given to new regions in 2019, with the old regions' names).
//
// A name the checks point at is put right in EN_NAME_OVERRIDES or kept, with the reason, in EN_NAME_ACCEPTED
// (scripts/data-config.ts). Old names (Compostela Valley for Davao de Oro) follow no pattern a check can see; they
// are in EN_NAME_OVERRIDES as they are found.

interface Suspect {
  code: string;
  pattern: "cut short" | "adjective" | "marks stripped" | "swapped" | "former place";
  en: string;
  wikidata: string;
}

const strip = (text: string): string => text.normalize("NFD").replace(/\p{M}/gu, "");
const key = (text: string): string => strip(text).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const words = (text: string): string[] => strip(text).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

const englishSuspects = (records: { code: string; country: string; en: string }[], labelOf: (code: string) => string | null, formerLabelsOf: (code: string) => string[] = () => []): Suspect[] => {
  const found: Suspect[] = [];
  const byCountry = new Map<string, { code: string; label: string | null }[]>();
  for (const record of records) byCountry.set(record.country, [...(byCountry.get(record.country) ?? []), { code: record.code, label: labelOf(record.code) }]);
  for (const record of records) {
    const label = labelOf(record.code);
    if (label === null) continue;
    const name = record.en;
    const add = (pattern: Suspect["pattern"]): void => {
      found.push({ code: record.code, pattern, en: name, wikidata: label });
    };
    if (key(name) !== key(label) && formerLabelsOf(record.code).some((former) => key(former) === key(name))) {
      add("former place");
      continue;
    }
    if (key(name) === key(label)) {
      if (strip(name) === name && strip(label) !== label) add("marks stripped");
      continue;
    }
    const nameWords = words(name);
    const last = nameWords[nameWords.length - 1];
    const labelWords = words(label);
    // Cut short: the name's last word is the start of a longer word of the label, and not a word of it itself.
    if (last !== undefined && !labelWords.includes(last) && labelWords.some((word) => word.length > last.length && word.startsWith(last)) && nameWords.slice(0, -1).every((word) => labelWords.includes(word))) {
      add("cut short");
      continue;
    }
    // An adjective: "<X> Republic", "Republic of <X>", or a label ending -ia/-ya that the name, with the same start, lacks.
    const republic = /^(.+) Republic$|^Republic of (.+)$/.exec(label);
    if ((republic !== null && key(republic[1] ?? republic[2]) === key(name)) || (/(ia|ya)$/.test(key(label)) && !/(ia|ya)$/.test(key(name)) && key(label).slice(0, 4) === key(name).slice(0, 4) && nameWords.length === labelWords.length)) {
      add("adjective");
      continue;
    }
    // Swapped: the name is another subdivision's label in the same country.
    if ((byCountry.get(record.country) ?? []).some((other) => other.code !== record.code && other.label !== null && key(other.label) === key(name))) add("swapped");
  }

  return found.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
};

export { englishSuspects };
export type { Suspect };
