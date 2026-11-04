/** Original, deterministic SVG colour studies. Replace through art-direction/. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "public/art/studies");
mkdirSync(output, { recursive: true });
let seed = 137;
function rnd(a, b) { seed = (seed * 1664525 + 1013904223) >>> 0; return a + (seed / 4294967296) * (b - a); }
const poly = (points, fill, extra = "") => `<path d="M${points.map((p) => p.join(",")).join(" L")}Z" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
function patches(x, y, w, h, count, colors) {
  return Array.from({ length: count }, () => {
    const px = rnd(x, x + w), py = rnd(y, y + h), size = rnd(6, 40);
    return poly([[px, py], [px + size, py - 3], [px + size * 0.7, py + size * 0.4], [px - 5, py + size * 0.65]], colors[Math.floor(rnd(0, colors.length))], `opacity="${rnd(0.12, 0.45).toFixed(2)}"`);
  }).join("");
}
function window(x, y, w, h, blue = false) {
  const frame = blue ? "#457f81" : "#ba8053", dark = blue ? "#25484a" : "#5d4134";
  return `<g>${rect(x - 13, y - 16, w + 26, h + 34, frame)}<path d="M${x},${y + h}V${y + w / 2}Q${x + w / 2},${y - 25} ${x + w},${y + w / 2}V${y + h}Z" fill="${dark}"/>${Array.from({ length: 5 }, (_, i) => rect(x + 6 + i * w / 5, y + w / 2, 3, h - w / 2, frame, 'opacity=".75"')).join("")}${rect(x - 19, y + h + 4, w + 38, 12, "#684634")}${rect(x - 16, y + h + 3, w + 32, 4, "#e6ba78")}</g>`;
}
function pot(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="11" rx="55" ry="12" fill="#493b29" opacity=".3"/><path d="M-35-50H35L27 2Q0 22-27 2Z" fill="#9d4d34"/><path d="M-29-46H5L0 11Q-20 9-22 0Z" fill="#c3744b"/><ellipse cy="-50" rx="37" ry="9" fill="#79442e"/><path d="M0-50Q-20-100-65-103Q-42-76-4-72M0-47Q2-120 44-132Q48-91 8-73M3-55Q34-104 72-86Q58-62 10-62M-2-61Q-18-145-44-153Q-51-109-6-71" fill="#405b36"/><path d="M2-56Q18-127 23-155" fill="none" stroke="#707844" stroke-width="4"/></g>`;
}
function tea(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="7" rx="17" ry="5" fill="#403b2c" opacity=".3"/><path d="M-14-34H14L10 3Q0 9-10 3Z" fill="#dac39a" fill-opacity=".65" stroke="#eccda0" stroke-width="2"/><path d="M-12-20H12L9 3Q0 7-9 3Z" fill="#a16c3a"/><ellipse cy="-20" rx="12" ry="3" fill="#cba468"/><path d="M-3-42Q-12-58-4-68M6-46Q14-60 6-72" fill="none" stroke="#f3d7ab" stroke-width="2" opacity=".45"/></g>`;
}
let scene = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1200" viewBox="0 0 1920 1200"><defs>
<linearGradient id="sky" x2="0" y2="1"><stop stop-color="#728b96"/><stop offset=".62" stop-color="#c5b394"/><stop offset="1" stop-color="#efba79"/></linearGradient>
<linearGradient id="earth" x2=".3" y2="1"><stop stop-color="#be8956"/><stop offset="1" stop-color="#78513b"/></linearGradient>
<linearGradient id="wall" x2="1" y2=".3"><stop stop-color="#d69d62"/><stop offset="1" stop-color="#ad6e42"/></linearGradient>
<radialGradient id="sun"><stop stop-color="#f6d69a" stop-opacity=".6"/><stop offset="1" stop-color="#f6d69a" stop-opacity="0"/></radialGradient>
<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter>
<pattern id="weave" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 0L18 18M-9 0L9 18M9 0L27 18" stroke="#cbb389" stroke-width="4"/><path d="M0 18L18 0M-9 18L9 0M9 18L27 0" stroke="#877047" stroke-width="3"/></pattern>
<clipPath id="leftwall"><path d="M0 190L409 261L433 918L0 1000Z"/></clipPath>
<clipPath id="rightwall"><path d="M1440 340L1920 230V1014L1440 878Z"/></clipPath>
</defs>
${rect(0, 0, 1920, 1200, "url(#sky)")}
<ellipse cx="1270" cy="355" rx="410" ry="310" fill="url(#sun)"/><circle cx="1250" cy="332" r="57" fill="#edd19a" opacity=".85"/>
${poly([[395,590],[630,428],[798,482],[1024,446],[1270,590]],"#bc9a7c")}
${poly([[750,614],[1040,461],[1170,506],[1359,430],[1630,637]],"#b28e72")}
${poly([[410,615],[635,477],[694,497],[645,520],[717,577],[790,590]],"#d1aa86")}
${poly([[1087,523],[1190,572],[1327,478],[1247,620]],"#ceab88")}
<g fill="#dbc4a0" opacity=".56"><path d="M437 228L535 224L558 214L616 226L736 235L703 244H472Z"/><path d="M1100 165H1185L1205 146L1239 159L1304 164L1390 181H1110Z"/><path d="M874 353L935 345L995 353L1097 357L961 363Z"/></g>
<g opacity=".72">${rect(463, 601, 143, 157, "#c3986c")}${rect(475, 581, 125, 23, "#ba8e62")}${window(504, 625, 30, 60)}${rect(1122, 580, 206, 220, "#cc9c67")}${rect(1160, 528, 134, 60, "#d4a870")}${window(1165, 615, 35, 58)}${window(1240, 615, 35, 58)}<path d="M1265 530V455" stroke="#665d44" stroke-width="4"/><path d="M1264 452L1320 471L1264 481" fill="#bf784b"/></g>
${rect(355, 717, 1135, 195, "#b78153")}${rect(349, 705, 1149, 20, "#d8a56d")}${rect(353, 727, 1143, 10, "#9b6b45")}
${patches(355,740,1120,160,125,["#deb279","#865b3d","#c59663"])}
${rect(0, 895, 1920, 305, "url(#earth)")}
<g fill="none" stroke="#70533d" stroke-width="2" opacity=".45"><path d="M0 980L1920 946M0 1094L1920 1036M180 1200L754 896M730 1200L953 896M1250 1200L1150 896M1875 1200L1365 896"/></g>
${poly([[0,1000],[514,900],[748,915],[324,1200],[0,1200]],"#594c38",'opacity=".3"')}
${poly([[1920,988],[1460,878],[1248,935],[1510,1200],[1920,1200]],"#61402c",'opacity=".3"')}
${poly([[0,190],[409,261],[433,918],[0,1000]],"url(#wall)")}
<g clip-path="url(#leftwall)">${patches(0,230,430,745,230,["#f0c388","#855e41","#b47b4f"])}<path d="M0 588L423 607M0 601L423 620" stroke="#946943" stroke-width="8"/>${window(52, 335, 80, 140)}${window(253, 358, 80, 128)}${window(78, 682, 84, 194,true)}${window(290, 677, 56, 130,true)}</g>
${poly([[0,170],[421,244],[430,268],[0,208]],"#805a3f")}${poly([[0,163],[423,237],[421,249],[0,181]],"#e1b777")}
${poly([[409,268],[474,298],[484,888],[432,920]],"#8e613e")}
<g stroke="#987143" fill="#e6b77b"><path d="M0 288L407 344" stroke-width="12"/><path d="M10 318L413 371" stroke-width="5"/></g>
${poly([[1440,340],[1920,230],[1920,1014],[1440,878]],"#b45c3f")}
<g clip-path="url(#rightwall)">${patches(1430,280,490,730,230,["#dc9765","#813f32","#dfad7a"])}<g stroke="#854e3b" stroke-width="3" opacity=".45">${Array.from({length:15},(_,i)=>`<path d="M1420 ${370+i*42}L1920 ${260+i*50}"/>`).join("")}</g></g>
${poly([[1421,332],[1920,218],[1920,245],[1440,359]],"#723f30")}${poly([[1416,320],[1920,208],[1920,225],[1418,344]],"#d8945c")}
${window(1532, 487, 114, 166, true)}${window(1768, 427, 112, 185, true)}
<path d="M1657 919V769Q1715 672 1772 761V949Z" fill="#613e2d"/><path d="M1671 918V776Q1714 706 1755 772V942Z" fill="#304b42"/><path d="M1713 744V933" stroke="#896a40" stroke-width="5"/>
<path d="M1471 685L1903 635L1920 664L1460 717Z" fill="#ce9564"/>
<path d="M1480 712L1917 659L1920 715L1480 768Z" fill="#593d2b" opacity=".3"/>
<path d="M1767 259V132M1750 142L1824 138" stroke="#695f42" stroke-width="4"/>
<g stroke="#ad8057" stroke-width="7"><path d="M484 714V823M531 714V823M578 714V823M625 714V823M672 714V823"/></g>
<path d="M460 722H694M460 807H694" stroke="#725435" stroke-width="6"/>
<g><path d="M0 830Q74 761 108 651T198 352Q232 263 310 166L287 147Q194 220 161 325L136 512Q94 617 0 660Z" fill="#423d2d"/><path d="M20 795L130 590L181 352L225 245L174 462L151 635L67 837Z" fill="#675037"/><path d="M159 424Q102 312 20 241L0 211Q120 271 182 374M182 333Q302 269 412 188L420 160Q286 205 203 287" fill="#423d2d"/></g>
`;
// Individually drawn canopy facets create a dry gouache colour study.
for (let i = 0; i < 550; i++) {
  const angle = rnd(0, Math.PI * 2), radius = Math.sqrt(rnd(0, 1));
  const x = 115 + Math.cos(angle) * radius * 500, y = 85 + Math.sin(angle) * radius * 335;
  const size = rnd(15, 48), palette = ["#283c30", "#354630", "#4d5633", "#697044", "#7f7c47", "#a18d51", "#253c33"];
  scene += poly([[x,y],[x+size*.55,y-size*.35],[x+size,y+size*.16],[x+size*.8,y+size*.8],[x+size*.25,y+size]],palette[Math.floor(rnd(0,palette.length))]);
}
scene += `<path d="M388 202Q1050 321 1539 324" fill="none" stroke="#67583c" stroke-width="3"/>`;
for (let i = 0; i < 34; i++) {
  const x = 405 + i * 33.4, t = i / 34, y = 207 + 168 * t - 50 * t * t;
  scene += `<path d="M${x} ${y}l-9 19 10 14 9-14Z" fill="${i % 3 === 0 ? "#ac6335" : "#d39a40"}"/><circle cx="${x}" cy="${y+7}" r="7" fill="#e0aa4b"/>`;
}
scene += `${pot(1468,913,1.2)}${pot(1845,1070,2.1)}${pot(380,962,1.25)}
<g transform="translate(488 972)"><path d="M-149 50L29-8L244 16L64 79Z" fill="#4c3928" opacity=".3"/><path d="M-141-40L15-76L161-49L4-7Z" fill="#97734c"/><path d="M-133-37L15-66L150-46L1-15Z" fill="url(#weave)"/><path d="M-141-40L-138 51M4-7L7 84M161-49L165 34M15-76L16-20" stroke="#694731" stroke-width="15"/><path d="M-142-40L3-6L163-49M-142-40L15-76L163-49" fill="none" stroke="#b08650" stroke-width="10"/></g>
<g transform="translate(1090 1050)"><ellipse cx="40" cy="45" rx="223" ry="65" fill="#57412f" opacity=".3"/><path d="M-174-67L33-115L224-56L11 9Z" fill="#987449"/><path d="M-160-65L33-104L208-53L12-1Z" fill="url(#weave)"/><path d="M-174-67L-166 54M11 9L14 113M224-56L224 65M33-115L36-48" stroke="#64442c" stroke-width="18"/><path d="M-175-67L12 10L225-56M-174-67L33-115L224-56" fill="none" stroke="#ad8050" stroke-width="14"/>
<path d="M-70-39L-12-52L15-35L-42-20Z" fill="#e4cf9d"/><path d="M-6-42L45-55L70-37L21-24Z" fill="#d8c59b"/><path d="M21-65L62-73L90-57L45-46Z" fill="#6c4936" stroke="#cba477" stroke-width="2"/><path d="M-40-32l5-6 5 3-4 7Z" fill="#924738"/>
${tea(137,-59,.9)}${tea(-111,-73,.8)}</g>
<g transform="translate(260 958)"><path d="M-81-22L68-49L99-24L-51 8Z" fill="#6e4d34"/><path d="M-74-20V66M81-20V47M-50 5V90" stroke="#523e2b" stroke-width="10"/>${tea(29,-31,.95)}<path d="M-48-63Q-70-47-56-31Q-29-22-12-40L-15-60Z" fill="#ad7750"/><ellipse cx="-31" cy="-64" rx="18" ry="7" fill="#6b4c35"/><path d="M-51-55Q-81-78-73-40L-57-38" fill="none" stroke="#ad7750" stroke-width="8"/></g>
<path d="M941 302Q952 291 963 302Q973 290 984 300M1040 254Q1048 246 1057 254Q1066 248 1074 253" stroke="#576568" stroke-width="3" fill="none" opacity=".7"/>
${patches(0,930,1920,260,160,["#b78b59","#dfad72","#5e4635"])}
${rect(0,0,1920,1200,"transparent",'filter="url(#paper)"')}
</svg>`;
writeFileSync(resolve(output, "courtyard.svg"), scene);

const block = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><g fill="none" stroke="#d4b174" stroke-width=".8" opacity=".22"><path d="M48 15C25 34 25 55 48 71C71 55 71 34 48 15Z"/><path d="M48 24V69M48 44C22 21 22 54 48 58M48 44C74 21 74 54 48 58"/><circle cx="48" cy="80" r="2"/><path d="M0 48L6 42L12 48L6 54ZM84 48L90 42L96 48L90 54Z"/></g></svg>`;
writeFileSync(resolve(output, "block-print.svg"), block);

const back = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360" viewBox="0 0 240 360"><defs><pattern id="b" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M16 4Q-1 16 16 28Q33 16 16 4Z" fill="none" stroke="#d2b578" stroke-width=".8" opacity=".35"/><circle cx="16" cy="16" r="2" fill="#d2b578" opacity=".3"/></pattern></defs><rect width="240" height="360" rx="12" fill="#eee0bb"/><rect x="7" y="7" width="226" height="346" rx="7" fill="#914735"/><rect x="17" y="17" width="206" height="326" rx="3" fill="#254b49" stroke="#d5b276" stroke-width="2"/><rect x="24" y="24" width="192" height="312" fill="url(#b)"/><path d="M120 91C92 110 78 126 76 151L50 180L76 209C78 234 92 250 120 269C148 250 162 234 164 209L190 180L164 151C162 126 148 110 120 91Z" fill="#254b49" stroke="#dab97c" stroke-width="2"/><path d="M120 111Q76 144 94 179Q66 178 75 201Q96 220 120 197Q144 220 165 201Q174 178 146 179Q164 144 120 111Z" fill="#d5b276"/><path d="M112 194L101 226H139L128 194" fill="#d5b276"/><path d="M120 128Q93 153 109 174" stroke="#254b49" stroke-width="3" fill="none"/><g fill="#d5b276"><circle cx="35" cy="36" r="4"/><circle cx="205" cy="36" r="4"/><circle cx="35" cy="324" r="4"/><circle cx="205" cy="324" r="4"/></g></svg>`;
writeFileSync(resolve(output, "card-back.svg"), back);

const jack = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="500" viewBox="0 0 360 500"><defs><pattern id="j" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M16 4L20 12L28 16L20 20L16 28L12 20L4 16L12 12Z" fill="#c49953" opacity=".3"/></pattern></defs><rect width="360" height="500" fill="#e5d3a5"/><path d="M30 500V158Q40 96 95 84Q120 36 180 22Q240 36 265 84Q320 96 330 158V500Z" fill="#b56643"/><path d="M42 500V160Q54 107 104 98Q129 51 180 39Q231 51 256 98Q306 107 318 160V500Z" fill="#cf9a61"/><rect x="42" y="43" width="276" height="457" fill="url(#j)"/><path d="M26 500L51 369Q74 342 129 328L235 329Q292 348 313 377L344 500Z" fill="#356365"/><path d="M145 312V350Q181 393 218 350V309Z" fill="#b9804f"/><path d="M119 336L163 359L180 468L86 500L65 374Z" fill="#ead3a0"/><path d="M229 335L198 363L180 468L277 500L298 376Z" fill="#e1bf7e"/><path d="M83 372L167 474M277 372L194 473" stroke="#a26543" stroke-width="10"/><path d="M137 198L236 199L246 282Q234 333 188 349Q141 335 119 290Z" fill="#d9a363"/><path d="M123 213L143 237L153 310L182 339Q137 330 119 290Z" fill="#b67c4b"/><path d="M125 209Q91 216 116 260L131 257M235 207Q264 211 246 252L235 257" fill="#c99158"/><path d="M146 242Q159 234 174 243M201 243Q216 233 230 240" fill="none" stroke="#493c2e" stroke-width="5"/><path d="M146 253L171 251M204 251L229 251" stroke="#493c2e" stroke-width="3"/><circle cx="160" cy="251" r="4" fill="#342e26"/><circle cx="215" cy="251" r="4" fill="#342e26"/><path d="M186 249L178 280L194 283" fill="none" stroke="#9c633d" stroke-width="3"/><path d="M186 289Q168 273 150 290Q137 298 128 277Q121 313 160 309L185 298Q212 317 231 307Q246 299 239 279Q229 300 215 291Q198 276 186 289" fill="#3d342a"/><path d="M170 316Q187 324 204 315" stroke="#8e543b" stroke-width="3" fill="none"/><path d="M103 214Q92 137 143 114Q196 70 250 139L255 214Q186 176 103 214Z" fill="#ae4d37"/><path d="M103 211Q171 139 248 142M107 184Q162 125 230 115M136 215Q192 175 249 177" stroke="#e0a15c" stroke-width="13" fill="none"/><path d="M112 163Q132 126 182 110" stroke="#f0bf76" stroke-width="6" fill="none"/><path d="M207 94Q202 58 225 46Q233 75 221 97" fill="#466f61"/><path d="M216 83L227 58" stroke="#c7b476" stroke-width="2"/><ellipse cx="214" cy="177" rx="14" ry="19" fill="#e3bb6e" stroke="#794734" stroke-width="3"/><ellipse cx="214" cy="177" rx="6" ry="10" fill="#4f7870"/><path d="M139 352Q170 400 230 352" stroke="#cca657" stroke-width="8" fill="none"/><g fill="#e9ca88"><circle cx="165" cy="384" r="5"/><circle cx="182" cy="389" r="5"/><circle cx="199" cy="384" r="5"/></g><path d="M318 500L298 319L307 282L318 319L341 500" fill="#b78a44"/><path d="M294 320L321 320" stroke="#e2bb68" stroke-width="5"/></svg>`;
writeFileSync(resolve(output, "jack.svg"), jack);

const portraits = [
  { id: "you", bg: "#8e754d", cloth: "#d5ba86", skin: "#bd885b", hair: "#35362a", type: "man" },
  { id: "dadi", bg: "#977c75", cloth: "#b98b99", skin: "#c69365", hair: "#d8cbb1", type: "elder" },
  { id: "meera", bg: "#657e70", cloth: "#d2a258", skin: "#c58b57", hair: "#36332b", type: "woman" },
  { id: "raju", bg: "#a8845d", cloth: "#497477", skin: "#b98053", hair: "#352e26", type: "man" },
  { id: "amma", bg: "#a16c53", cloth: "#b85e42", skin: "#bd885c", hair: "#393831", type: "woman" },
  { id: "kabir", bg: "#6f8587", cloth: "#ded1af", skin: "#b5845c", hair: "#3e342c", type: "man" },
];
for (const p of portraits) {
  const woman = p.type !== "man";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="${p.bg}"/><circle cx="120" cy="118" r="104" fill="#e0b879" opacity=".14"/><path d="M26 240L36 191Q61 160 120 160Q179 160 204 191L214 240Z" fill="${p.cloth}"/>${woman ? `<path d="M48 194Q34 126 60 64Q83 30 122 31Q190 30 190 99L193 195L162 177L69 179Z" fill="${p.hair}"/>` : `<path d="M64 100Q54 31 113 30Q180 26 178 111Z" fill="${p.hair}"/>`}<path d="M98 148V183Q120 201 141 181V146Z" fill="${p.skin}"/><ellipse cx="120" cy="108" rx="53" ry="66" fill="${p.skin}"/><path d="M68 114Q64 45 113 39Q143 30 169 61Q138 68 105 58Q88 77 77 108Z" fill="${p.hair}"/>${woman ? `<path d="M122 42Q181 40 173 128L164 101L162 70Z" fill="${p.hair}"/><circle cx="120" cy="93" r="4" fill="#8f3d31"/><circle cx="69" cy="129" r="6" fill="none" stroke="#dfb765" stroke-width="4"/><circle cx="172" cy="129" r="6" fill="none" stroke="#dfb765" stroke-width="4"/>` : ""}<path d="M85 102Q96 94 107 101M134 101Q146 94 156 102" stroke="#54402f" stroke-width="3" fill="none"/><path d="M90 109H104M136 109H150" stroke="#40392d" stroke-width="3"/><circle cx="98" cy="109" r="2" fill="#302f26"/><circle cx="143" cy="109" r="2" fill="#302f26"/><path d="M120 109L115 127L124 128" stroke="#92613e" stroke-width="2" fill="none"/><path d="M105 143Q120 153 137 141" stroke="#80513a" stroke-width="3" fill="none"/>${p.id === "raju" ? '<path d="M119 133Q100 128 98 140Q108 146 119 137Q132 147 145 137Q138 126 124 133Z" fill="#3b3128"/>' : ""}${p.type === "elder" ? '<g fill="none" stroke="#cdb48a" stroke-width="3"><circle cx="98" cy="111" r="18"/><circle cx="143" cy="111" r="18"/><path d="M116 111H125"/></g>' : ""}<path d="M77 183L106 206L121 185L138 206L163 181M119 190V240" stroke="#705b3e" stroke-opacity=".5" stroke-width="3" fill="none"/>${woman ? `<path d="M56 162L124 240H166L73 167Z" fill="${p.cloth}" stroke="#dbc090" stroke-width="3"/>` : ""}</svg>`;
  writeFileSync(resolve(output, `${p.id}.svg`), svg);
}

const emblem = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect x="16" y="10" width="84" height="104" rx="9" fill="#b97747" transform="rotate(-13 58 62)"/><rect x="30" y="13" width="78" height="104" rx="7" fill="#ead8af" stroke="#e9c991" stroke-width="2"/><rect x="37" y="20" width="64" height="90" rx="3" fill="#294f4c"/><path d="M69 33Q43 50 50 65Q36 64 42 78Q53 89 69 76Q85 89 96 78Q102 64 88 65Q95 50 69 33Z" fill="#e5be77"/><path d="M64 74L58 94H80L74 74Z" fill="#e5be77"/><path d="M59 67Q64 60 69 67Q75 60 81 67Q83 74 72 73L69 70L66 73Q55 74 59 67" fill="#7f4131"/></svg>`;
writeFileSync(resolve(output, "logo.svg"), emblem);
writeFileSync(resolve(root, "public/favicon.svg"), emblem);
console.log("Original SVG studies written to public/art/studies/.");
