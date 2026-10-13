/** Browser country and subdivision cards, with optional Hata flags and Chizu maps. Safe to import without a DOM. */
import { country, continentName, subregionName } from "./index";
import { facts } from "./facts";
import { loadSubdivisions } from "./load";
import { loadSubdivisionFacts } from "./subdivision-facts";

const ElementBase: typeof HTMLElement = typeof HTMLElement === "undefined" ? class {} as unknown as typeof HTMLElement : HTMLElement;

/**
 * The fields a card can show, in any order; facts retain their recorded year.
 * @example
 * ```ts
 * import { KUNI_CARD_FIELDS } from "@johnmorrisdotca/kuni/element";
 * console.log(KUNI_CARD_FIELDS.includes("population")); // true
 * ```
 */
export const KUNI_CARD_FIELDS = ["name", "codes", "flag", "map", "capital", "population", "area", "continent", "subregion", "currency", "languages", "calling-code", "tld", "zones", "ioc"] as const;

/** Host SVG loaders and native map appearance; attributes override drawing defaults.
 * @example
 * ```ts
 * import { type KuniCardOptions, KUNI_CARD_OPTION_KEYS } from "@johnmorrisdotca/kuni/element";
 * const options: KuniCardOptions = {};
 * console.log(Object.keys(options).length); // 0
 * console.log(KUNI_CARD_OPTION_KEYS.length); // 4
 * ```
 */
export interface KuniCardOptions {
  /** Load a Hata flag or an equivalent SVG for the ISO code; null means unavailable. */
  flag?: (code: string) => Promise<string | null>;
  /** Load trusted SVG for the ISO code/language, honouring optional drawing settings; null means unavailable. */
  map?: (code: string, language: "en" | "ja", drawing?: Pick<KuniCardOptions, "colors" | "capital">) => Promise<string | null>;
  /** Per-region CSS colours for the native drawing; code:hex-colour attribute pairs override this map. */
  colors?: Readonly<Record<string, string>>;
  /** Show the capital markers on the map, true by default. This does not remove the capital text field. */
  capital?: boolean;
}

/**
 * Host option keys, kept complete by TypeScript and checked by the builder.
 * @example
 * ```ts
 * import { KUNI_CARD_OPTION_KEYS } from "@johnmorrisdotca/kuni/element";
 * console.log(KUNI_CARD_OPTION_KEYS.length); // 4
 * ```
 */
export const KUNI_CARD_OPTION_KEYS = Object.keys({ flag: true, map: true, colors: true, capital: true } satisfies Record<keyof KuniCardOptions, boolean>);
/** Read the card's bounded code:hex-colour attribute without accepting CSS or markup fragments.
 * @param text - Comma-separated pairs; null or empty means the theme colour.
 * @returns Validated colour pairs, or null when any pair is malformed.
 * @example
 * ```ts
 * import { readCardColors } from "@johnmorrisdotca/kuni/element";
 * console.log(readCardColors("JP:#2f6b4f")?.JP); // "#2f6b4f"
 * console.log(readCardColors("JP:url(evil)")); // null
 * ```
 */
export function readCardColors(text: string | null): Record<string, string> | null {
  if (text === null || text.trim() === "") return {};
  if (text.length > 16000) return null;
  const pairs = text.split(",");
  if (pairs.length > 1500) return null;
  const entries: [string, string][] = [];
  for (const pair of pairs) {
    const match = /^\s*([\w-]{1,40})\s*:\s*(#[0-9a-f]{3}(?:[0-9a-f]|[0-9a-f]{3}|[0-9a-f]{5})?)\s*$/i.exec(pair);
    if (!match) return null;
    entries.push([match[1]!, match[2]!]);
  }
  return Object.fromEntries(entries);
}
const DEFAULT_FIELDS = "name codes flag map capital population area currency";
const labels = {
  en: { name: "Name", codes: "Codes", ioc: "IOC code", flag: "Flag", map: "Map", capital: "Capital or seat", population: "Population", area: "Area", continent: "Continent", subregion: "Subregion", currency: "Currency", languages: "Languages", "calling-code": "Calling code", tld: "Domain", zones: "Time zones" },
  ja: { name: "名前", codes: "国コード", ioc: "IOCコード", flag: "旗", map: "地図", capital: "首都・行政の中心地", population: "人口", area: "面積", continent: "大陸", subregion: "地域", currency: "通貨", languages: "言語", "calling-code": "国番号", tld: "国別ドメイン", zones: "タイムゾーン" },
};
const write = (element: Element, name: string, value: unknown): void => {
  if (value === null || value === undefined) element.removeAttribute(name);
  else element.setAttribute(name, Array.isArray(value) ? value.join(" ") : String(value));
};
const flagSvg = async (code: string): Promise<string | null> => {
  const address = `https://cdn.jsdelivr.net/npm/@johnmorrisdotca/hata@1/dist/flags/${code.toLowerCase()}.js`;
  return (await import(/* @vite-ignore */ address)).default ?? null;
};
const mapSvg = async (code: string, language: "en" | "ja", drawing: Pick<KuniCardOptions, "colors" | "capital"> = {}): Promise<string | null> => {
  const base = "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/chizu@1/dist/";
  const { loadCountry, loadDivisions, loadFeatures } = await import(/* @vite-ignore */ `${base}load-entry.js`);
  const { drawChizu } = await import(/* @vite-ignore */ `${base}draw-entry.js`);
  const map = code.includes("-") ? await loadDivisions(code.split("-")[0]) : await loadCountry(code);
  if (!map) return null;
  let tones = {};
  let box;
  if (code.includes("-")) {
    const region = map.regions.find((region: { iso?: string }) => region.iso === code);
    if (!region) return null;
    const { focusBox } = await import(/* @vite-ignore */ `${base}index.js`);
    box = focusBox(map, [region.code]); tones = { [region.code]: "selected" };
  }
  const colors = Object.fromEntries(Object.entries(drawing.colors ?? {}).map(([key, colour]) => [map.regions.find((region: { code: string; iso?: string }) => region.code === key || region.iso === key)?.code ?? key, colour]));
  const featureLayer = drawing.capital === false ? null : await loadFeatures(map.id);
  return drawChizu(map, { language, tones, colors, box, style: true, featureLayer, features: drawing.capital === false ? [] : ["capitals"] });
};

/**
 * `<kuni-card code="JP" fields="name flag map capital population">`, a country or ISO subdivision without stored state.
 * @example
 * ```ts
 * import { KuniCard, defineCard } from "@johnmorrisdotca/kuni/element";
 * console.log(typeof KuniCard); // "function"
 * if (typeof document !== "undefined") {
 *   defineCard();
 *   const card = document.createElement("kuni-card");
 *   card.setAttribute("code", "JP");
 *   card.setAttribute("colors", "JP:#2f6b4f");
 *   card.setAttribute("capital", "off");
 *   document.body.append(card);
 * }
 * ```
 */
export class KuniCard extends ElementBase {
  static get observedAttributes(): readonly string[] { return ["code", "fields", "lang", "theme", "size", "width", "label", "colors", "capital"]; }
  /** The country or subdivision code. */
  get code(): string { return this.getAttribute("code") ?? "JP"; }
  set code(value: string | null | undefined) { write(this, "code", value); }
  /** The field names, reflected as their space-separated attribute. */
  get fields(): string { return this.getAttribute("fields") ?? DEFAULT_FIELDS; }
  set fields(value: string | readonly string[] | null | undefined) { write(this, "fields", value); }
  /** Light, dark or auto. */
  get theme(): string { return this.getAttribute("theme") ?? "auto"; }
  set theme(value: string | null | undefined) { write(this, "theme", value); }
  /** Small, medium or large. */
  get size(): string { return this.getAttribute("size") ?? "medium"; }
  set size(value: string | null | undefined) { write(this, "size", value); }
  /** Width in pixels, fitting the parent. */
  get width(): string | null { return this.getAttribute("width"); }
  set width(value: string | number | null | undefined) { write(this, "width", value); }
  /** Optional spoken label. */
  get label(): string | null { return this.getAttribute("label"); }
  set label(value: string | null | undefined) { write(this, "label", value); }
  /** Per-region hex colours, reflected as comma-separated code:colour pairs. */
  get colors(): string | null { return this.getAttribute("colors"); }
  set colors(value: string | null | undefined) { write(this, "colors", value); }
  /** Show map capital markers; false aliases turn them off. The capital text field is separate. */
  get capital(): boolean { return this.hasAttribute("capital") ? !["off", "false", "no", "0"].includes((this.getAttribute("capital") ?? "").trim().toLowerCase()) : this.#options.capital ?? true; }
  set capital(value: boolean | string | null | undefined) { write(this, "capital", value); }
  /** Optional host SVG loaders; assigning them redraws the card. */
  get options(): KuniCardOptions { return this.#options; }
  set options(value: KuniCardOptions) { this.#options = value ?? {}; this.refresh(); }
  #options: KuniCardOptions = {};
  #root: ShadowRoot | null = null;
  #revision = 0;
  #scheduled = false;
  #watcher: MutationObserver | null = null;
  connectedCallback(): void {
    this.#root ??= this.attachShadow({ mode: "open" });
    this.#watcher ??= new MutationObserver(() => this.refresh());
    this.#watcher.observe(this.ownerDocument.documentElement, { attributes: true, attributeFilter: ["lang"] });
    this.refresh();
  }
  disconnectedCallback(): void { this.#revision += 1; this.#watcher?.disconnect(); this.#watcher = null; }
  attributeChangedCallback(): void { this.refresh(); }
  /** Redraw the card, coalescing attribute updates into one load. */
  refresh(): void {
    if (!this.isConnected || this.#scheduled) return;
    this.#scheduled = true;
    queueMicrotask(() => { this.#scheduled = false; void this.#draw(); });
  }
  #tell(type: string, detail: unknown): void { this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail })); }
  #text(tag: string, value: string): HTMLElement { const element = this.ownerDocument.createElement(tag); element.textContent = value; return element; }
  #svg(value: string, label: string): SVGElement | null {
    const parsed = new DOMParser().parseFromString(value, "image/svg+xml");
    if (parsed.querySelector("parsererror") || parsed.documentElement.localName !== "svg") return null;
    const svg = this.ownerDocument.importNode(parsed.documentElement, true) as unknown as SVGElement;
    for (const node of svg.querySelectorAll("script,foreignObject,iframe,object,embed,image")) node.remove();
    for (const node of [svg, ...svg.querySelectorAll("*")]) for (const attr of [...node.attributes]) {
      if (/^on/i.test(attr.name) || (/^(?:href|xlink:href)$/i.test(attr.name) && !attr.value.startsWith("#"))) node.removeAttribute(attr.name);
    }
    for (const style of svg.querySelectorAll("style")) {
      if (/@import/i.test(style.textContent ?? "") || [...(style.textContent ?? "").matchAll(/url\(([^)]*)\)/gi)].some((match) => !match[1].trim().replace(/^["']|["']$/g, "").startsWith("#"))) style.remove();
      else style.textContent = (style.textContent ?? "").replaceAll(':root:not([data-theme="light"])', ':host(:not([theme="light"]))').replaceAll(':root[data-theme="dark"]', ':host([theme="dark"])');
    }
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", label); return svg;
  }
  async #draw(): Promise<void> {
    const revision = ++this.#revision; this.removeAttribute("data-ready");
    const code = this.code.trim().toUpperCase().replace(/_/g, "-");
    try {
      const parentCode = code.split("-")[0]; const parent = country(parentCode);
      if (!parent) throw new Error("Choose a country code or an ISO subdivision code.");
      const subdivision = code.includes("-") ? (await loadSubdivisions(parent.alpha2))?.find((one) => one.code === code) : null;
      if (code.includes("-") && !subdivision) throw new Error("That subdivision code is not in Kuni.");
      const one = subdivision ?? parent;
      const fact = subdivision ? (await loadSubdivisionFacts(parent.alpha2))?.find((one) => one.code === code) : facts(parent.alpha2);
      if (!this.isConnected || revision !== this.#revision) return;
      const language = (this.getAttribute("lang") ?? this.closest("[lang]")?.getAttribute("lang") ?? this.ownerDocument.documentElement.lang).toLowerCase().startsWith("ja") ? "ja" : "en";
      const requested = this.fields.split(/[\s,]+/).filter(Boolean);
      if (requested.some((name) => !KUNI_CARD_FIELDS.includes(name as typeof KUNI_CARD_FIELDS[number]))) throw new Error("Choose field names listed by KUNI_CARD_FIELDS.");
      const fields = [...new Set(requested)];
      this.style.colorScheme = this.theme === "dark" || this.theme === "light" ? this.theme : "light dark";
      const width = Number(this.width); this.style.width = `${this.width !== null && Number.isFinite(width) && width >= 100 ? Math.min(width, 2000) : ({ small: 240, medium: 360, large: 480 }[this.size] ?? 360)}px`;
      const style = this.ownerDocument.createElement("style"); style.textContent = STYLE;
      const article = this.#text("article", ""); article.className = "card"; article.setAttribute("aria-label", this.label ?? one.name[language] ?? one.name.en);
      this.#root!.replaceChildren(style, article);
      const displayNumber = (value: number | null | undefined, year: number | null | undefined): string => value === null || value === undefined ? "—" : `${String(value).split(".").map((part, index) => index === 0 ? part.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : part).join(".")}${year ? ` (${year})` : ""}`;
      const capital = subdivision ? (fact && "capital" in fact ? fact.capital : null) : parent.capital;
      const values: Record<string, string> = {
        ioc: parent.ioc ?? "—",
        codes: subdivision ? subdivision.code : `${parent.alpha2} · ${parent.alpha3} · ${parent.numeric}`,
        capital: capital?.[language] ?? capital?.en ?? "—",
        population: displayNumber(fact?.population, fact?.populationYear),
        area: fact?.areaKm2 === null || fact?.areaKm2 === undefined ? "—" : `${displayNumber(fact.areaKm2, fact.areaYear)} km²${"areaOf" in fact && fact.areaOf === "land" ? language === "ja" ? "（陸地のみ）" : " (land only)" : ""}`,
        continent: continentName(parent.continent, language) ?? "—", subregion: parent.subregion ? subregionName(parent.subregion, language) ?? "—" : "—",
        currency: parent.currency?.join(", ") ?? "—", languages: parent.languages?.join(", ") ?? "—", "calling-code": parent.callingCode ?? "—", tld: parent.tld ? `.${parent.tld}` : "—", zones: parent.zones?.join(", ") ?? "—",
      };
      // Country capital is in the main country record; subdivision facts carry its own seat.
      if (!subdivision) values.capital = parent.capital?.[language] ?? parent.capital?.en ?? "—";
      const colors = this.hasAttribute("colors") ? readCardColors(this.colors) : this.#options.colors ?? {};
      if (colors === null) throw new Error(language === "ja" ? "地域コードと16進数の色を、コード:色の形式で指定してください。" : "Colours must be code:hex-colour pairs.");
      const artwork: Promise<void>[] = [];
      for (const field of fields) {
        if (field === "name") { const title = this.#text("h2", one.name[language] ?? one.name.en); title.dataset.field = field; article.append(title); continue; }
        if (field === "flag" || field === "map") {
          const box = this.#text("div", language === "ja" ? "読み込み中…" : "Loading…"); box.className = field; box.dataset.field = field; article.append(box);
          const load = field === "flag" ? (this.#options.flag ?? flagSvg)(subdivision ? code : parent.alpha2) : (this.#options.map ?? mapSvg)(subdivision ? code : parent.alpha2, language, { colors, capital: this.capital });
          artwork.push(load.then((value) => {
            if (!this.isConnected || revision !== this.#revision) return;
            const svg = value ? this.#svg(value, `${labels[language][field]}: ${one.name[language] ?? one.name.en}`) : null;
            box.replaceChildren(svg ?? this.#text("p", language === "ja" ? "表示できません。" : "Unavailable."));
          }).catch(() => {
            if (!this.isConnected || revision !== this.#revision) return;
            box.replaceChildren(this.#text("p", language === "ja" ? "表示できません。" : "Unavailable.")); this.#tell("kuni-error", { code: subdivision ? code : parent.alpha2, part: field, message: "Artwork unavailable" });
          })); continue;
        }
        const row = this.#text("dl", ""); row.dataset.field = field;
        const term = this.#text("dt", labels[language][field as keyof typeof labels.en]);
        if (subdivision && ["continent", "subregion", "currency", "languages", "calling-code", "tld", "zones", "ioc"].includes(field)) term.append(this.#text("span", language === "ja" ? "（国）" : " (country)"));
        row.append(term, this.#text("dd", values[field])); article.append(row);
      }
      await Promise.all(artwork);
      if (!this.isConnected || revision !== this.#revision) return;
      this.setAttribute("data-ready", "true"); this.#tell("kuni-load", { code: subdivision ? code : parent.alpha2, country: parent.alpha2, fields });
    } catch (error) {
      if (!this.isConnected || revision !== this.#revision) return;
      const message = error instanceof Error ? error.message : String(error); const status = this.#text("p", message); status.setAttribute("role", "status"); this.#root!.replaceChildren(status); this.#tell("kuni-error", { code, message });
    }
  }
}
const STYLE = `:host{display:block;max-width:100%;box-sizing:border-box;font-family:system-ui;color:CanvasText}:host([hidden]){display:none}.card{padding:16px;border:1px solid color-mix(in srgb,CanvasText 25%,transparent);border-radius:12px;background:Canvas;display:grid;gap:12px;min-width:0;box-sizing:border-box}h2,p,dl,dd{margin:0}h2{font-size:1.3rem;line-height:1.3}dl{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:12px;line-height:1.4}dt{font-weight:600}dd{text-align:end;overflow-wrap:anywhere}.flag{height:48px}.flag svg{display:block;width:auto;height:100%;max-width:100%}.map{height:180px}.map svg{width:100%;height:100%;display:block}:host([size=small]) .flag{height:32px}:host([size=small]) .map{height:120px}:host([size=large]) .flag{height:64px}:host([size=large]) .map{height:240px}`;

/**
 * Register `<kuni-card>` or a host's own tag, preserving an existing definition. Safe without a browser.
 * @param tag - The tag to register; kuni-card by default.
 * @returns Nothing; the element is registered once when a browser is present.
 * @example
 * ```ts
 * import { defineCard } from "@johnmorrisdotca/kuni/element";
 * console.log(defineCard());
 * ```
 */
export function defineCard(tag = "kuni-card"): void {
  if (typeof customElements === "undefined" || customElements.get(tag) !== undefined) return;
  customElements.define(tag, tag === "kuni-card" ? KuniCard : class extends KuniCard {});
}
