# Embed a country or subdivision card

[Open the builder](https://johnmorrisdotca.github.io/kuni/builder.html) to choose fields, preview a card and copy a custom element, iframe, module, React 19, Vue, Svelte, Angular, plain HTML block or iframe URL. The builder carries the setup in its link and updates frame height when the card loads.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kuni@1/dist/element-define.js"></script>
<kuni-card code="JP" fields="name flag map capital population area"></kuni-card>
<kuni-card code="JP-13" fields="name codes flag map capital population"></kuni-card>
```

The element entry exports `KuniCard`, `defineCard(tag?)`, `KUNI_CARD_FIELDS`, `KUNI_CARD_OPTION_KEYS`, `readCardColors(text)` and the `KuniCardOptions` type. Importing either entry on a server is safe. `defineCard` preserves an existing definition. The definition entry uses the same class as the element entry in both ESM and CommonJS.

| Attribute | Values and default |
| --- | --- |
| `code` | a country code (`JP`, `JPN`, `392`) or full ISO subdivision code (`JP-13`); JP by default |
| `fields` | space- or comma-separated names from `KUNI_CARD_FIELDS`, in display order; default `name codes flag map capital population area currency` |
| `lang` | `en` or `ja`; nearest language or page language by default |
| `theme` | `light`, `dark`, `auto` (default) |
| `size` | `small`, `medium`, `large`; widths 240, 360, 480 pixels, medium by default |
| `width` | explicit pixel width; the card fits a narrower parent |
| `label` | optional spoken label; always text |
| `colors` | comma-separated code:hex-colour pairs, such as `JP:#2f6b4f,JP-13:#8a3b3b`; unspecified places keep the theme colour |
| `capital` | map capital markers, on by default; off/false/no/0 omit them |

Fields are `name`, `codes`, `flag`, `map`, `capital`, `population`, `area`, `continent`, `subregion`, `currency`, `languages`, `calling-code`, `tld`, `zones` and optional `ioc`. Population and area retain the source's year; country land-only areas say so. Subdivisions use their own names, seat, population and area. Fields inherited from the country, such as currency or calling code, are marked “country”. Unknown values remain an em dash. The card creates no live clock or location request.

Every attribute has a reflected property; `fields` also accepts a list of field names. `options.flag(code)` and `options.map(code, language)` can supply trusted SVG strings from the host instead of the default loaders. The drawing options `colors` and `capital` can also be assigned on `options`; their attribute forms override host defaults. Coverage is checked against the real option keys. Native language changes redraw the card, disconnecting cancels stale work, and a late artwork load cannot replace a new code's card.

Flags are Hata's actual SVG flag modules, and maps are Chizu's country or division maps, with the matching subdivision framed and highlighted. They load only when their fields are requested, from jsDelivr, with no runtime npm dependency. Missing artwork says “Unavailable” while the names and facts remain usable. A host can request only `name codes capital` to use the card entirely from its own Kuni files. Default artwork loaders use major pins; the package's own builder pin follows the version in package.json. No static image of a whole assembled card exists, so the builder offers the element and iframe forms.

The transparent, `noindex` iframe is `embed/?code=JP&fields=name+flag+map+capital&size=medium`. Query choices, code syntax, field names, language, theme and numeric width are validated. Invalid query values are ignored; a nonexistent country or subdivision is reported as a status message. It stores nothing and requests no external content other than jsDelivr. Its static card has no motion and no controls that need a pointer.

`kuni-load` bubbles across shadow boundaries with `{ code, country, fields }`. `kuni-error` carries `{ code, message }`, with `part: "flag"` or `"map"` for unavailable artwork. The iframe forwards the identical JSON-safe detail as `{ type: event.type, detail: event.detail }`. A host must check `event.origin === "https://johnmorrisdotca.github.io"` and `event.source === iframe.contentWindow` before using a message. No personal data is included.

The optional ioc field displays the released native IOC code, or an em dash
when none is recorded. On a subdivision card it is marked as the country's
value. Current cards use current countries only; withdrawn ISO records remain
in the separate kuni/withdrawn API and do not enter the picker.

## Map colours and markers

The capital-marker setting affects the map only; the `capital` text field remains available. `colors` accepts 3, 4, 6 or 8 digit hex colours keyed by the map region/ISO code. Invalid pairs are rejected; the frame ignores invalid query values. `readCardColors(text)` returns a validated map or null. A host's `options.colors` can use the native Chizu CSS colour forms. Maps still use native Chizu drawing and built-in feature layers, requested only when a map is shown. A custom `options.map(code, language, drawing)` receives `{ colors, capital }` as the optional third argument; existing two-argument loaders remain compatible and should honour drawing options when supplied.

```html
<kuni-card code="JP" fields="name map capital" colors="JP:#2f6b4f" capital="off"></kuni-card>
```

The builder previews the same colours/markers and retains them in copied code, frame URLs and setup links. [Japanese guide](embed-colours-ja.md).
