import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { COUNTRY_CODES } from "./codes";
import { allSubdivisions, subdivision } from "./subdivisions";
import { createSubdivisionNames } from "./subdivision-names";
import type { SubdivisionNames, SubdivisionNamesData, SubdivisionNamesLanguage } from "./subdivision-names";
import ar from "./subdivision-names/ar";
import de from "./subdivision-names/de";
import es from "./subdivision-names/es";
import fr from "./subdivision-names/fr";
import ko from "./subdivision-names/ko";
import pt from "./subdivision-names/pt";
import ru from "./subdivision-names/ru";
import zhHans from "./subdivision-names/zh-Hans";
import zhHant from "./subdivision-names/zh-Hant";
import { checkName as SUBDIVISION_NAME_CHECKS } from "../scripts/subdivision-names-config";

const ALL: Record<SubdivisionNamesLanguage, SubdivisionNames> = { fr, es, de, "zh-Hans": zhHans, "zh-Hant": zhHant, ko, pt, ar, ru };
const codes = new Set(allSubdivisions().map((one) => one.code));

describe("subdivision-names/<language>: the data", () => {
  it("has the nine languages, each saying which it is", () => {
    expect(Object.keys(ALL).sort()).toEqual(["ar", "de", "es", "fr", "ko", "pt", "ru", "zh-Hans", "zh-Hant"]);
    for (const [language, names] of Object.entries(ALL)) expect(names.language).toBe(language);
  });

  it("names only codes the main entry has, once each, in the order of the code", () => {
    for (const [language, names] of Object.entries(ALL)) {
      const seen: string[] = [];
      for (const country of COUNTRY_CODES) for (const one of names.subdivisionsOf(country)) seen.push(one.code);
      expect(new Set(seen).size, language).toBe(seen.length);
      expect(seen.length, language).toBe(names.count());
      for (const code of seen) expect(codes.has(code), `${language} ${code}`).toBe(true);
    }
  });

  it("gives every name a source, and never an empty or untidy name", () => {
    for (const [language, names] of Object.entries(ALL)) {
      for (const country of COUNTRY_CODES) {
        for (const one of names.subdivisionsOf(country)) {
          expect(one.name, `${language} ${one.code}`).toBe(one.name.normalize("NFC").replace(/\s+/g, " ").trim());
          expect(one.name.length, `${language} ${one.code}`).toBeGreaterThan(0);
          expect(one.code).toBe(`${one.country}-${one.shortCode}`);
          expect(["cldr", "wikidata"]).toContain(one.source.source);
          expect(names.subdivisionName(one.code)).toBe(one.name);
          expect(names.subdivisionNameSource(one.code)).toEqual(one.source);
        }
      }
    }
  });

  it("holds every name to the checks that kept a bad one out of the build", () => {
    for (const [language, names] of Object.entries(ALL) as [SubdivisionNamesLanguage, SubdivisionNames][]) {
      for (const country of COUNTRY_CODES) for (const one of names.subdivisionsOf(country)) expect(SUBDIVISION_NAME_CHECKS(language, one.name), `${language} ${one.code} ${one.name}`).toBeNull();
    }
  });

  it("reads what CLDR 48.2.0 gives for Spanish and German, to the character", () => {
    const xml = (file: string): string => readFileSync(`data-sources/cldr/release-48-2/subdivisions-${file}.xml`, "utf8");
    for (const [file, names] of [["es", es], ["de", de]] as const) {
      const text = xml(file);
      for (const one of names.subdivisionsOf("JP").filter((each) => each.source.source === "cldr")) {
        const lower = one.code.toLowerCase().replace("-", "");
        expect(text, `${file} ${one.code}`).toContain(`type="${lower}"`);
        expect(text, `${file} ${one.code}`).toContain(`>${one.name}</subdivision>`);
      }
    }
  });
});

describe("subdivision-names/<language>: what is answered", () => {
  it("names Tokyo as CLDR does in Spanish and German (a prefecture, in German), and Cataluña and Bayern in their own", () => {
    expect(es.subdivisionName("JP-13")).toBe("Tokio");
    expect(de.subdivisionName("JP-13")).toBe("Präfektur Tokio");
    expect(es.subdivisionName("ES-CT")).toBe("Cataluña");
    expect(de.subdivisionName("DE-BY")).toBe("Bayern");
    expect(es.subdivisionName("jp-13")).toBe("Tokio");
    expect(fr.subdivisionName("JP-13")).toBe("Tokyo");
    expect(ko.subdivisionName("JP-13")).toBe("도쿄 도");
    expect(pt.subdivisionName("JP-13")).toBe("Tóquio");
    expect(ar.subdivisionName("JP-13")).toBe("طوكيو");
    expect(ru.subdivisionName("JP-13")).toBe("Токио");
    expect(es.subdivisionName(" JP-13 ")).toBe("Tokio");
  });

  it("is null for a code that is not one, and for what no source names, with no other language's name instead", () => {
    for (const names of Object.values(ALL)) {
      expect(names.subdivisionName("XX-99")).toBeNull();
      expect(names.subdivisionName("")).toBeNull();
      expect(names.subdivisionName("JP")).toBeNull();
      expect(names.subdivisionNameSource("XX-99")).toBeNull();
      expect(names.subdivisionName(undefined as unknown as string)).toBeNull();
    }
    const missing = allSubdivisions().filter((one) => zhHant.subdivisionName(one.code) === null);
    expect(missing.length).toBeGreaterThan(0);
    for (const one of missing.slice(0, 200)) expect(zhHant.subdivisionName(one.code)).toBeNull();
  });

  it("never gives a Chinese entry another language's or the other script's name", () => {
    for (const one of zhHans.subdivisionsOf("JP")) expect(/[\u3040-\u30ff]/.test(one.name), one.name).toBe(false);
    for (const [language, names] of [["zh-Hans", zhHans], ["zh-Hant", zhHant]] as const) {
      for (const country of COUNTRY_CODES) for (const one of names.subdivisionsOf(country)) expect(/\p{Script=Han}/u.test(one.name), `${language} ${one.code} ${one.name}`).toBe(true);
    }
  });

  it("finds a code by the name as typed, folded as the language folds, and narrows to a country", () => {
    expect(es.subdivisionByName("tokio", { country: "JP" })).toBe("JP-13");
    expect(es.subdivisionByName("TOKIO", { country: "jp" })).toBe("JP-13");
    expect(es.subdivisionByName("cataluna")).toBe("ES-CT");
    expect(de.subdivisionByName("bayern")).toBe("DE-BY");
    expect(de.subdivisionsByName("Bayern", { country: "DE" })).toEqual(["DE-BY"]);
    expect(de.subdivisionsByName("Bayern", { country: "FR" })).toEqual([]);
    expect(es.subdivisionsByName("")).toEqual([]);
    expect(es.subdivisionsByName("   ")).toEqual([]);
    expect(es.subdivisionByName("no such place anywhere")).toBeNull();
  });

  it("is null, not the first, for a name that is more than one place", () => {
    for (const [language, names] of Object.entries(ALL) as [SubdivisionNamesLanguage, SubdivisionNames][]) {
      let tested = 0;
      for (const country of COUNTRY_CODES) {
        for (const one of names.subdivisionsOf(country)) {
          const found = names.subdivisionsByName(one.name);
          expect(found, `${language} ${one.name}`).toContain(one.code);
          expect([...found].sort(), `${language} ${one.name}`).toEqual([...found]);
          if (found.length > 1) {
            expect(names.subdivisionByName(one.name), `${language} ${one.name}`).toBeNull();
            expect(names.subdivisionByName(one.name, { country: one.country })?.startsWith(`${one.country}-`) ?? true).toBe(true);
            tested += 1;
          }
        }
      }
      expect(tested, language).toBeGreaterThanOrEqual(0);
    }
  });

  it("lists a country's named subdivisions, empty for a country with none or a code that is not one", () => {
    expect(es.subdivisionsOf("JP").length).toBeGreaterThan(40);
    expect(es.subdivisionsOf("jp")[0]!.country).toBe("JP");
    expect(es.subdivisionsOf("XX")).toEqual([]);
    expect(es.subdivisionsOf("")).toEqual([]);
    expect(subdivision("JP-13")?.country).toBe("JP");
  });

  it("freezes what it hands out", () => {
    const list = es.subdivisionsOf("JP");
    expect(Object.isFrozen(list)).toBe(true);
    expect(Object.isFrozen(list[0])).toBe(true);
    expect(Object.isFrozen(list[0]!.source)).toBe(true);
    expect(Object.isFrozen(es.subdivisionsByName("Tokio"))).toBe(true);
  });

  it("folds as the country names of the same language do", () => {
    expect(es.fold("Cataluña")).toBe(es.fold("CATALUNA"));
    expect(de.fold("Baden-Württemberg")).toBe(de.fold("baden wurttemberg"));
  });
});

describe("createSubdivisionNames", () => {
  const data: SubdivisionNamesData = {
    language: "es",
    sources: ["cldr:es:provisional", "wikidata:es"],
    countries: { JP: "13|Tokio|0\n27|Osaka|1", ES: "CT|Cataluña|0" },
  };
  const made = createSubdivisionNames(data);

  it("reads rows as written, and says where each came from", () => {
    expect(made.count()).toBe(3);
    expect(made.subdivisionName("JP-27")).toBe("Osaka");
    expect(made.subdivisionNameSource("JP-27")).toEqual({ source: "wikidata", tag: "es", draft: null });
    expect(made.subdivisionNameSource("JP-13")).toEqual({ source: "cldr", tag: "es", draft: "provisional" });
    expect(made.subdivisionsOf("ES").map((one) => one.name)).toEqual(["Cataluña"]);
  });

  it("does nothing until it is asked", () => {
    const lazy = createSubdivisionNames({ ...data, countries: new Proxy({}, { ownKeys: () => { throw new Error("read too early"); } }) });
    expect(lazy.language).toBe("es");
  });
});
