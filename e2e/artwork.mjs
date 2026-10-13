import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export async function artwork(page) {
  const requests = [];
  await page.route("https://cdn.jsdelivr.net/npm/**", (route) => {
    const match = /@johnmorrisdotca\/(hata|chizu)@1\/dist\/(.*)$/.exec(new URL(route.request().url()).pathname);
    requests.push(route.request().url());
    if (!match) return route.fulfill({ status: 404, body: "" });
    const root = dirname(fileURLToPath(import.meta.url));
    const file = match[1] === "hata" ? join(root, "fixtures", `hata-${match[2].split("/").at(-1)}`) : join(root, "..", "node_modules", "@johnmorrisdotca", "chizu", "dist", match[2]);
    return route.fulfill({ status: existsSync(file) ? 200 : 404, contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body: existsSync(file) ? readFileSync(file) : "" });
  });
  return requests;
}
