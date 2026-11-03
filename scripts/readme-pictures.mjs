// Takes the pictures the README shows, from the built demo in `site/`: `pnpm screenshots:readme` (builds the demo,
// then runs this). The shared part is readme-pictures-lib.mjs, the same file in every package of the family. The page
// is served to a browser without a port, never fetched from the live site, and is the same each run: every panel
// starts from its own example, and motion is reduced. It waits on the page saying it is ready, never on a clock.
// Output: docs/images/hero-<desk|phone>-<light|dark>.webp.
import { takePictures } from "./readme-pictures-lib.mjs";

const READY = 'main[data-ready="true"]';

await takePictures({
  shots: [
    ...["find","list","code","search"].map(subject=>({subject,views:["desk"],url:"/?lang=en&help=off",ready:READY,target:`[data-testid="${subject}-panel"]`})),
    // From the top of the page, so the header, the language chooser, the cloth patches and the first panels show.
    // On a phone, in Japanese.
    {
      subject: "hero",
      views: ["desk", "phone"],
      url: "/?lang=en&help=off",
      ready: READY,
      height: 1100,
      async prepare(page, { view }) {
        if (view === "phone") {
          await page.goto("http://kuni.test/?lang=ja&help=off");
          await page.waitForSelector(READY);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
      },
    },
  ],
  // The family's thumbnail, dark thumbnail and icon (scripts/family-thumbnail.mjs): four countries as the Country view
  // draws them, each outline (Chizu's) with its capital marked, under it the ISO code and the English and Japanese names
  // from Kuni's own data; the icon is Japan's main islands alone.
  thumbnail: {
    url: "/?lang=en&help=off",
    ready: READY,
    target: "#thumbnail-stage",
    icon: { target: "#thumbnail-icon" },
    label: "Kuni 国",
    async prepare(page) {
      await page.evaluate(async () => {
        const { country } = await import("./dist/index.js");
        const { facts } = await import("./dist/facts.js");
        const { outline } = await import("./shared.js");
        const tile = async (code, size, named) => {
          const one = country(code);
          const svg = await outline(code, one.name.en, facts(code).capitalPoint ?? undefined);
          svg.setAttribute("style", `width:${size}px;height:${size}px;display:block`);
          const figure = document.createElement("figure");
          figure.setAttribute("style", "margin:0;display:flex;flex-direction:column;align-items:center;gap:14px");
          figure.append(svg);
          if (named) {
            const caption = document.createElement("figcaption");
            caption.setAttribute("style", "text-align:center;font-size:30px;line-height:1.25;color:var(--ink)");
            caption.innerHTML = `<b style="font-size:40px;letter-spacing:.04em">${one.alpha2}</b><br>${one.name.en}<br>${one.name.ja}`;
            figure.append(caption);
          }
          return figure;
        };
        const stage = document.createElement("div");
        stage.id = "thumbnail-stage";
        stage.setAttribute("style", "display:flex;align-items:flex-end;gap:36px;padding:12px;width:max-content");
        for (const code of ["JP", "CA", "IT", "BR"]) stage.append(await tile(code, 260, true));
        const icon = document.createElement("div");
        icon.id = "thumbnail-icon";
        icon.setAttribute("style", "padding:8px;width:max-content");
        icon.append(await tile("JP", 440, false));
        document.body.replaceChildren(stage, icon);
        // Japan's four main islands, without the far southern islands that would leave them small at 40 px.
        const svg = icon.querySelector("svg");
        const box = svg.getBBox();
        svg.setAttribute("viewBox", `${box.x + box.width * 0.28} ${box.y} ${box.width * 0.72} ${box.height * 0.75}`);
      });
    },
  },
});
