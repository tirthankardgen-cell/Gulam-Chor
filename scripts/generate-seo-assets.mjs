import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../public/", import.meta.url));
const logo = readFileSync(join(root, "favicon.svg"));
const ink = "#263b34";
mkdirSync(join(root, "icons"), { recursive: true });

// Real raster/ICO fallbacks for search results, Apple home screens and app launchers.
const faviconSizes = [16, 32, 48];
const faviconPngs = await Promise.all(faviconSizes.map((size) => sharp(logo, { density: 192 }).resize(size, size).png().toBuffer()));
const icoHeader = Buffer.alloc(6 + 16 * faviconSizes.length);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(faviconSizes.length, 4);
let offset = icoHeader.length;
for (const [index, size] of faviconSizes.entries()) {
  const entry = 6 + index * 16;
  icoHeader[entry] = size; icoHeader[entry + 1] = size;
  icoHeader.writeUInt16LE(1, entry + 4); icoHeader.writeUInt16LE(32, entry + 6);
  icoHeader.writeUInt32LE(faviconPngs[index].length, entry + 8); icoHeader.writeUInt32LE(offset, entry + 12);
  offset += faviconPngs[index].length;
  writeFileSync(join(root, `icons/favicon-${size}.png`), faviconPngs[index]);
}
writeFileSync(join(root, "favicon.ico"), Buffer.concat([icoHeader, ...faviconPngs]));

for (const [file, size, proportion] of [
  ["apple-touch-icon.png", 180, .78], ["icons/icon-192.png", 192, .78],
  ["icons/icon-512.png", 512, .78], ["icons/icon-maskable-512.png", 512, .56],
]) {
  const inner = Math.round(size * proportion);
  const image = await sharp(logo, { density: 576 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: ink } })
    .composite([{ input: image, gravity: "centre" }]).png().toFile(join(root, file));
}

// Use the site's original artwork. This JPEG remains readable in a 1200×630 share card.
const background = await sharp(join(root, "art/studies/courtyard.svg")).resize(1200, 630, { fit: "cover" }).png().toBuffer();
const portrait = await sharp(join(root, "art/studies/jack.svg")).resize(150, 250, { fit: "cover" }).png().toBuffer();
const card = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="228" height="342"><rect x="2" y="2" width="224" height="338" rx="12" fill="#f0e2bc" stroke="#cfac72" stroke-width="4"/><rect x="11" y="11" width="206" height="320" rx="7" fill="none" stroke="#b79a67"/><image href="data:image/png;base64,${portrait.toString("base64")}" x="39" y="46" width="150" height="250"/><g fill="#294f4c" font-family="Georgia,serif" font-size="30"><text x="18" y="40">J</text><text x="15" y="69">♠</text><text x="195" y="322" transform="rotate(180 206 308)">J</text></g></svg>`);
const front = await sharp(card).rotate(8, { background: "#00000000" }).png().toBuffer();
const back = await sharp(join(root, "art/studies/card-back.svg")).resize(228, 342).rotate(-12, { background: "#00000000" }).png().toBuffer();
const copy = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><linearGradient id="shade"><stop stop-color="#183b31" stop-opacity=".97"/><stop offset=".64" stop-color="#1b3b31" stop-opacity=".88"/><stop offset="1" stop-color="#1b3b31" stop-opacity=".48"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#shade)"/><rect x="24" y="24" width="1152" height="582" rx="18" fill="none" stroke="#e3bc784d"/>
<g fill="#f5e6c5"><text x="156" y="88" font-family="Arial,sans-serif" font-size="20" letter-spacing="3">THE GREAT INDIAN CARD GAME</text>
<text x="66" y="244" font-family="Georgia,serif" font-weight="bold" font-size="96">GULAM</text><text x="66" y="344" font-family="Georgia,serif" font-weight="bold" font-size="96">CHOR.</text>
<text x="70" y="407" font-family="Arial,sans-serif" font-size="29">Play online with 2–6 friends.</text>
<text x="70" y="445" font-family="Arial,sans-serif" font-size="20" fill="#d9c9a7">Private rooms. No downloads. Just one more round.</text>
<rect x="68" y="494" width="387" height="53" rx="5" fill="#e5c590"/><text x="91" y="527" font-family="Arial,sans-serif" font-size="17" font-weight="bold" letter-spacing="1" fill="#263b34">ONE JACK. EVERYONE’S PROBLEM.</text>
<text x="70" y="584" font-family="Arial,sans-serif" font-size="17" fill="#cfb992">gulamchor.vihar.online</text></g></svg>`);
await sharp(background).composite([
  { input: copy }, { input: await sharp(logo).resize(76, 76).png().toBuffer(), left: 65, top: 45 },
  { input: back, left: 761, top: 151 }, { input: front, left: 866, top: 134 },
]).jpeg({ quality: 90, mozjpeg: true }).toFile(join(root, "og-gulam-chor.jpg"));
console.log("Generated the share image, favicon, Apple icon and app icons.");
