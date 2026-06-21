// 1点だけ描画してPNG保存（MCPのプレビュー用）。
// env: BASE, OUT(保存先), OUTPUT(scroll|flyer), TONE(elegant|passion), SCALE(既定2), CLIP(任意:縦長の上部高さpx)
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.BASE || "http://localhost:5173";
const OUTPUT = process.env.OUTPUT || "flyer";
const TONE = process.env.TONE || "elegant";
const SCALE = Number(process.env.SCALE || (OUTPUT === "flyer" ? 2 : 1.4));
const CLIP = process.env.CLIP ? Number(process.env.CLIP) : 0;
const OUT = process.env.OUT || path.resolve(ROOT, "../output/editor/preview.png");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const docPath = path.resolve(ROOT, "doc.json");
const docJson = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf-8") : null;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  deviceScaleFactor: SCALE,
  viewport: { width: OUTPUT === "flyer" ? 900 : 1100, height: 1200 },
});
const page = await ctx.newPage();
if (docJson) await page.addInitScript((d) => localStorage.setItem("jack12doc.v1", d), docJson);
const VQ = process.env.VARIANT ? `&variant=${process.env.VARIANT}` : "";
await page.goto(`${BASE}/?render=1&output=${OUTPUT}&tone=${TONE}${VQ}`, { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(300);

const el = await page.$(OUTPUT === "flyer" ? ".flyer" : ".scroll");
const box = await el.boundingBox();
if (CLIP && OUTPUT === "scroll") {
  await page.screenshot({ path: OUT, clip: { x: box.x, y: box.y, width: box.width, height: Math.min(CLIP, box.height) } });
} else {
  await el.screenshot({ path: OUT });
}
await browser.close();
console.log(JSON.stringify({ out: OUT, width: Math.round(box.width), height: Math.round(box.height), clipped: !!(CLIP && OUTPUT === "scroll") }));
