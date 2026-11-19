import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { COUNTRY_CODES } from "./codes";
import { createNames } from "./names";
import type { NamesData, NamesLanguage } from "./names";
import ar from "./names/ar";
import de from "./names/de";
import es from "./names/es";
import fr from "./names/fr";
import ko from "./names/ko";
import pt from "./names/pt";
import ru from "./names/ru";
import zhHans from "./names/zh-Hans";
import zhHant from "./names/zh-Hant";
import type { Names } from "./names";

const ALL: Record<NamesLanguage, Names> = { fr, es, de, "zh-Hans": zhHans, "zh-Hant": zhHant, ko, pt, ar, ru };

// What CLDR 48.2.0 gives, counted when the entries were first made: [names, nulls, short forms, countries with variants].
const COUNTS: Record<NamesLanguage, [number, number, number, number]> = {
  fr: [250, 0, 5, 10],
  es: [250, 0, 5, 9],
  de: [250, 0, 5, 9],
  "zh-Hans": [250, 0, 3, 6],
  "zh-Hant": [250, 0, 3, 6],
  ko: [250, 0, 4, 8],
  pt: [250, 0, 4, 9],
  ar: [250, 0, 3, 8],
  ru: [250, 0, 5, 8],
};

const tidy = (text: string): string => text.normalize("NFC").replace(/[\u3000\s]+/g, " ").trim();
const cldr = (language: string): Record<string, string> =>
  JSON.parse(readFileSync(join("node_modules/cldr-localenames-full/main", language, "territories.json"), "utf8")).main[language].localeDisplayNames.territories;

describe("names/<language>: the data", () => {
  it("has the nine languages, each answering for the 250 countries", () => {
    expect(Object.keys(ALL).sort()).toEqual(["ar", "de", "es", "fr", "ko", "pt", "ru", "zh-Hans", "zh-Hant"]);
    for (const [language, names] of Object.entries(ALL)) {
      expect(names.language).toBe(language);
      expect(names.countries().map((one) => one.code)).toEqual([...COUNTRY_CODES]);
    }
  });

  it("counts the names, the nulls, the short forms and the variants CLDR gives", () => {
    for (const [language, names] of Object.entries(ALL) as [NamesLanguage, Names][]) {
      const list = names.countries();
      expect([list.filter((one) => one.name !== null).length, list.filter((one) => one.name === null).length, list.filter((one) => one.shortName !== null).length, list.filter((one) => one.variants.length > 0).length], language).toEqual(
        COUNTS[language],
      );
    }
  });

  it("is CLDR's own text: every name, short form and variant is what territories.json says", () => {
    for (const [language, names] of Object.entries(ALL)) {
      const territories = cldr(language);
      for (const one of names.countries()) {
        expect(one.name, `${language} ${one.code}`).toBe(territories[one.code] === undefined ? null : tidy(territories[one.code]!));
        expect(one.shortName, `${language} ${one.code} short`).toBe(territories[`${one.code}-alt-short`] === undefined ? null : tidy(territories[`${one.code}-alt-short`]!));
        const variants = Object.keys(territories).filter((key) => key.startsWith(`${one.code}-alt-`) && !key.endsWith("-alt-short")).map((key) => tidy(territories[key]!));
        expect([...one.variants], `${language} ${one.code} variants`).toEqual(variants);
      }
    }
  });

  it("gives the names CLDR spells in each language", () => {
    expect(fr.countryName("JP")).toBe("Japon");
    expect(fr.countryName("GB", { short: true })).toBe("R.-U.");
    expect(fr.countryName("GB")).toBe("Royaume-Uni");
    expect(es.countryName("DE")).toBe("Alemania");
    expect(de.countryName("JP")).toBe("Japan");
    expect(de.countryName("DE")).toBe("Deutschland");
    expect(zhHans.countryName("JP")).toBe("日本");
    expect(zhHans.countryName("US")).toBe("美国");
    expect(zhHant.countryName("US")).toBe("美國");
    expect(ko.countryName("JP")).toBe("일본");
    expect(pt.countryName("JP")).toBe("Japão");
    expect(ar.countryName("JP")).toBe("اليابان");
    expect(ru.countryName("JP")).toBe("Япония");
    expect(fr.countryVariants("CZ")).toEqual(["République tchèque"]);
    expect(fr.countryVariants("JP")).toEqual([]);
  });

  it("answers null for what is not a country, and with a short form falls back to the name", () => {
    expect(fr.countryName("XX")).toBeNull();
    expect(fr.countryName("")).toBeNull();
    expect(fr.countryName(5 as unknown as string)).toBeNull();
    expect(fr.countryVariants("XX")).toEqual([]);
    expect(fr.countryName("jp", { short: true })).toBe("Japon");
  });

  it("freezes what it hands out", () => {
    expect(Object.isFrozen(fr)).toBe(true);
    expect(Object.isFrozen(fr.countries())).toBe(true);
    expect(Object.isFrozen(fr.countries()[0])).toBe(true);
    expect(Object.isFrozen(fr.countryVariants("CZ"))).toBe(true);
    expect(Object.isFrozen(fr.countries({ order: "name" }))).toBe(true);
  });
});

describe("names/<language>: a name CLDR lacks is null", () => {
  const data: NamesData = {
    language: "fr",
    countries: { JP: ["Japon", null, "", ""], AD: [null, null, "", ""], AE: ["Émirats", null, "", ""], AF: ["Afghanistan", null, "", ""] },
  };
  const small = createNames(data);

  it("answers null, not a name from another language and not the code", () => {
    expect(small.countryName("AD")).toBeNull();
    expect(small.countryName("AD", { short: true })).toBeNull();
    expect(small.countries().find((one) => one.code === "AD")).toEqual({ code: "AD", name: null, shortName: null, variants: [] });
  });

  it("is found by nothing of its own, and still by its code", () => {
    expect(small.countryByName("Andorre")).toBeNull();
    expect(small.countryByName("ad")).toBe("AD");
  });

  it("lists the countries with no name last when sorted by name", () => {
    expect(small.countries({ order: "name" }).map((one) => one.code)).toEqual(["AF", "AE", "JP", "AD"]);
  });
});

describe("names/<language>: search", () => {
  it("finds every name, short form, variant and alias of every country, and never another country", () => {
    for (const [language, names] of Object.entries(ALL)) {
      for (const one of names.countries()) {
        for (const text of [one.name, one.shortName, ...one.variants]) if (text !== null) expect(names.countryByName(text), `${language} ${one.code} ${text}`).toBe(one.code);
      }
    }
  });

  it("gives no two countries the same name once folded", () => {
    for (const [language, names] of Object.entries(ALL)) {
      const seen = new Map<string, string>();
      for (const one of names.countries()) {
        for (const text of [one.name, one.shortName, ...one.variants]) {
          if (text === null) continue;
          const key = names.fold(text).replace(/ /g, "");
          expect(seen.get(key) ?? one.code, `${language}: ${text}`).toBe(one.code);
          seen.set(key, one.code);
        }
      }
    }
  });

  it("answers null for a name nobody has, an empty text, only punctuation, or something that is not text", () => {
    for (const names of Object.values(ALL)) {
      expect(names.countryByName("Narnia")).toBeNull();
      expect(names.countryByName("")).toBeNull();
      expect(names.countryByName("  - ")).toBeNull();
      expect(names.countryByName(null as unknown as string)).toBeNull();
    }
  });

  it("takes an alpha-2 code in any case, after the names", () => {
    expect(fr.countryByName("jp")).toBe("JP");
    expect(fr.countryByName("JP")).toBe("JP");
    expect(fr.countryByName("japon")).toBe("JP");
  });

  it("French: case, accents, apostrophes, hyphens, the article and the short form", () => {
    expect(fr.countryByName("COTE D'IVOIRE")).toBe("CI");
    expect(fr.countryByName("Côte d’Ivoire")).toBe("CI");
    expect(fr.countryByName("etats unis")).toBe("US");
    expect(fr.countryByName("États-Unis")).toBe("US");
    expect(fr.countryByName("la France")).toBe("FR");
    expect(fr.countryByName("l'Espagne")).toBe("ES");
    expect(fr.countryByName("Les Pays-Bas")).toBe("NL");
    expect(fr.countryByName("R.-U.")).toBe("GB");
    expect(fr.countryByName("République tchèque")).toBe("CZ");
    expect(fr.countryByName("tchequie")).toBe("CZ");
  });

  it("Spanish: the article, the tilde and the accent", () => {
    expect(es.countryByName("el Perú")).toBe("PE");
    expect(es.countryByName("PERU")).toBe("PE");
    expect(es.countryByName("españa")).toBe("ES");
    expect(es.countryByName("Espana")).toBe("ES");
    expect(es.countryByName("México")).toBe("MX");
  });

  it("German: umlauts, ß, the article and the spelled-out umlaut alias", () => {
    expect(de.countryByName("Österreich")).toBe("AT");
    expect(de.countryByName("osterreich")).toBe("AT");
    expect(de.countryByName("Oesterreich")).toBe("AT");
    expect(de.countryByName("die Schweiz")).toBe("CH");
    expect(de.countryByName("DEUTSCHLAND")).toBe("DE");
    expect(de.countryByName("Oesterreich")).not.toBeNull();
    expect(de.countryName("AT")).toBe("Österreich");
    expect(de.countryVariants("AT")).toEqual([]);
  });

  it("Portuguese: the cedilla, the tilde and the article", () => {
    expect(pt.countryByName("Japão")).toBe("JP");
    expect(pt.countryByName("JAPAO")).toBe("JP");
    expect(pt.countryByName("o Brasil")).toBe("BR");
    expect(pt.countryByName("Países Baixos")).toBe("NL");
  });

  it("Russian: case, and ё and й set aside", () => {
    expect(ru.countryByName("ЯПОНИЯ")).toBe("JP");
    expect(ru.countryByName("россия")).toBe("RU");
    expect(ru.countryByName("Чехия")).toBe("CZ");
    expect(ru.fold("Ёж")).toBe(ru.fold("еж"));
    expect(ru.fold("Израиль")).toBe(ru.fold("Изра́иль"));
  });

  it("Arabic: the vowel marks, the hamza forms, the alef wasla, the ya, the ta marbuta and the tatweel", () => {
    expect(ar.countryByName("اليابان")).toBe("JP");
    expect(ar.countryByName("أذربيجان")).toBe("AZ");
    expect(ar.countryByName("اذربيجان")).toBe("AZ");
    expect(ar.fold("ٱلسعودية")).toBe(ar.fold("السعودية"));
    expect(ar.fold("مصـــر")).toBe(ar.fold("مصر"));
    expect(ar.fold("السعودية")).toBe(ar.fold("السعوديه"));
    expect(ar.fold("مَصْر")).toBe(ar.fold("مصر"));
    expect(ar.fold("ى")).toBe(ar.fold("ي"));
    expect(ar.countryByName("المملكة العربية السعوديه")).toBe("SA");
  });

  it("Chinese: width and the middle dot; Simplified and Traditional are separate languages", () => {
    expect(zhHans.countryByName("日本")).toBe("JP");
    expect(zhHans.countryByName("美国")).toBe("US");
    expect(zhHant.countryByName("美國")).toBe("US");
    expect(zhHans.countryByName("美國")).toBeNull();
    expect(zhHant.countryByName("美国")).toBeNull();
    expect(zhHans.countryByName("ＵＳ")).toBe("US");
  });

  it("Korean: Hangul as it is typed, and width", () => {
    expect(ko.countryByName("일본")).toBe("JP");
    expect(ko.countryByName("대한민국")).toBe("KR");
    expect(ko.fold("ＵＳ")).toBe("us");
  });

  it("does not look in another language", () => {
    expect(fr.countryByName("Japan")).toBeNull();
    expect(de.countryByName("Japon")).toBeNull();
    expect(ru.countryByName("Japan")).toBeNull();
  });
});

describe("names/<language>: what the entries are", () => {
  it("are the same shape in every language, with no Japanese-only field and room for subdivisions beside them", () => {
    for (const names of Object.values(ALL)) {
      expect(Object.keys(names).sort()).toEqual(["countries", "countryByName", "countryName", "countryVariants", "fold", "language"]);
      expect(Object.keys(names.countries()[0]!).sort()).toEqual(["code", "name", "shortName", "variants"]);
    }
  });

  it("asks Intl for nothing, and has the nine entries and their rows", () => {
    const files = ["names.ts", ...readdirSync("src/names").map((file) => join("names", file)), ...readdirSync("src/data/names").map((file) => join("data/names", file))];
    expect(files).toHaveLength(1 + 9 + 9);
    for (const file of files) expect(readFileSync(join("src", file), "utf8"), file).not.toMatch(/\bIntl\b|localeCompare\(|toLocale\w*\(/);
  });

  it("sorts by name in plain code-unit order of the folded name, not by a locale", () => {
    const names = fr.countries({ order: "name" }).map((one) => fr.fold(one.name!));
    expect(names).toEqual([...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    expect(fr.countries({ order: "name" })).toHaveLength(250);
    expect(fr.countries({ order: "name" })).toBe(fr.countries({ order: "name" }));
    expect(fr.countries({ order: "code" })).toBe(fr.countries());
  });
});
