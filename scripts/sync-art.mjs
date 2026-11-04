import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(resolve(root, "art-direction/asset-manifest.json"), "utf8"));
const ready = {};
for (const asset of manifest.assets) {
  const path = resolve(root, asset.output);
  if (existsSync(path)) ready[asset.id] = "/" + asset.output.replace(/^public\//, "");
}
mkdirSync(resolve(root, "src/lib"), { recursive: true });
writeFileSync(resolve(root, "src/lib/generated-art.json"), JSON.stringify(ready, null, 2) + "\n");
console.log(`Artwork: ${Object.keys(ready).length}/${manifest.assets.length} generated assets ready. Original SVG studies fill the remaining slots.`);
