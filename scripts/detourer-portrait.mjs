/**
 * Détoure le portrait couleur pris devant un mur volt (2026-11-24) et l'écrit
 * en WebP transparent pour le héros. Lancement : `bun scripts/detourer-portrait.mjs <source> <sortie>`.
 *
 * Le mur est reconnu à sa teinte (le vert domine franchement le rouge et le
 * bleu), l'alpha est progressif pour garder les mèches, le vert qui déborde
 * sur les bords est retiré, puis le masque est rongé de 3 px et adouci pour
 * effacer le liseré.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const [source, sortie] = process.argv.slice(2);
if (!source || !sortie) throw new Error("Usage : bun scripts/detourer-portrait.mjs <source> <sortie.webp>");

const navigateur = await chromium.launch({ executablePath: process.env.CHROME_HEADLESS });
const page = await navigateur.newPage();
const donnee = `data:image/jpeg;base64,${readFileSync(source).toString("base64")}`;
const resultat = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const toile = document.createElement("canvas");
  toile.width = W;
  toile.height = H;
  const ctx = toile.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;
  const alpha = new Float32Array(W * H);
  for (let i = 0; i < W * H; i += 1) {
    const r = d[i * 4];
    const g = d[i * 4 + 1];
    const b = d[i * 4 + 2];
    const vert = g - Math.max(r * 1.02, b * 1.5);
    alpha[i] = g < 60 ? 1 : Math.min(1, Math.max(0, 1 - (vert - 2) / 14));
    const plafond = Math.max(r, b);
    if (g > plafond) d[i * 4 + 1] = plafond;
  }
  const ronger = (a, rayon) => {
    const t = new Float32Array(W * H);
    for (let y = 0; y < H; y += 1)
      for (let x = 0; x < W; x += 1) {
        let m = 1;
        for (let k = -rayon; k <= rayon; k += 1) m = Math.min(m, a[y * W + Math.min(W - 1, Math.max(0, x + k))]);
        t[y * W + x] = m;
      }
    const o = new Float32Array(W * H);
    for (let y = 0; y < H; y += 1)
      for (let x = 0; x < W; x += 1) {
        let m = 1;
        for (let k = -rayon; k <= rayon; k += 1) m = Math.min(m, t[Math.min(H - 1, Math.max(0, y + k)) * W + x]);
        o[y * W + x] = m;
      }
    return o;
  };
  const flou = (a) => {
    const o = new Float32Array(W * H);
    for (let y = 1; y < H - 1; y += 1)
      for (let x = 1; x < W - 1; x += 1) {
        let s = 0;
        for (let j = -1; j <= 1; j += 1) for (let i = -1; i <= 1; i += 1) s += a[(y + j) * W + x + i];
        o[y * W + x] = s / 9;
      }
    return o;
  };
  const final = flou(ronger(alpha, 3));
  for (let i = 0; i < W * H; i += 1) d[i * 4 + 3] = Math.round(final[i] * 255);
  ctx.putImageData(image, 0, 0);
  return toile.toDataURL("image/webp", 0.86);
}, donnee);
writeFileSync(sortie, Buffer.from(resultat.split(",")[1], "base64"));
await navigateur.close();
console.log(`✅ ${sortie}`);
