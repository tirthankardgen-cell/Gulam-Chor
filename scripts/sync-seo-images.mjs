import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = join(root, "public");
const imageExtension = /\.(avif|bmp|gif|ico|jpe?g|png|svg|tiff?|webp)$/i;

function imagesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return imagesIn(path);
    if (!entry.isFile() || !imageExtension.test(entry.name)) return [];
    return ["/" + relative(publicRoot, path).split(/[\\/]/).map(encodeURIComponent).join("/")];
  });
}

// Bundle a build-time inventory: serverless sitemap regeneration needs no filesystem scan.
const images = imagesIn(publicRoot).sort();
const destination = join(root, "src/lib/sitemap-images.json");
const json = JSON.stringify(images, null, 2) + "\n";
if (!existsSync(destination) || readFileSync(destination, "utf8") !== json) writeFileSync(destination, json);
console.log(`Sitemap: ${images.length} public images, including favicons and app icons.`);
