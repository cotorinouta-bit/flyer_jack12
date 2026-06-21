// JACK12 フライヤー書き出し: 画面(renderモード)をChromiumで撮影し PDF/PNG/JPG を生成。
// 使い方: 開発サーバ(npm run dev)を起動した状態で `npm run export`。
// 編集内容を反映するには、エディタの「保存(JSON)」で得た doc.json を editor/ 直下に置く。
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.BASE || "http://localhost:5173";
const OUT = path.resolve(ROOT, "../output/editor");
fs.mkdirSync(OUT, { recursive: true });

const docPath = path.resolve(ROOT, "doc.json");
const docJson = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf-8") : null;
if (docJson) console.log("doc.json を読み込みました（編集内容を反映）");
else console.log("doc.json なし → 初期内容で書き出します");

let combos = [
  ["scroll", "elegant"], ["scroll", "passion"],
  ["flyer", "elegant"], ["flyer", "passion"],
];
// ONLY="scroll:elegant,flyer:passion" で対象を絞り込み（MCPから利用）
if (process.env.ONLY) {
  const want = new Set(process.env.ONLY.split(",").map((s) => s.trim()));
  combos = combos.filter(([o, t]) => want.has(`${o}:${t}`));
}

// FORMATS="pdf" や "jpg,png" で出力形式を絞り込み（既定は全形式）
const ALL_FMT = ["pdf", "png", "jpg"];
let formats = ALL_FMT;
if (process.env.FORMATS) {
  const want = new Set(process.env.FORMATS.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
  const f = ALL_FMT.filter((x) => want.has(x));
  if (f.length) formats = f;
}
console.log("出力形式:", formats.join(", "));

const browser = await chromium.launch(
  process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : undefined
);
for (const [output, tone] of combos) {
  const dsf = output === "flyer" ? 3 : 2;
  const ctx = await browser.newContext({
    deviceScaleFactor: dsf,
    viewport: { width: output === "flyer" ? 900 : 1100, height: 1200 },
  });
  const page = await ctx.newPage();
  if (docJson) await page.addInitScript((d) => localStorage.setItem("jack12doc.v1", d), docJson);
  const vq = process.env.VARIANT ? `&variant=${process.env.VARIANT}` : "";
  await page.goto(`${BASE}/?render=1&output=${output}&tone=${tone}${vq}`, { waitUntil: "networkidle" });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(350);

  const sel = output === "flyer" ? ".flyer" : ".scroll";
  const el = await page.$(sel);
  const box = await el.boundingBox();
  const base = path.join(OUT, `jack12_${output}_${tone}`);

  if (formats.includes("png")) await el.screenshot({ path: base + ".png" });
  if (formats.includes("jpg")) await el.screenshot({ path: base + ".jpg", type: "jpeg", quality: 92 });
  if (formats.includes("pdf")) {
    if (output === "flyer") {
      await page.pdf({ path: base + ".pdf", width: "210mm", height: "297mm", printBackground: true });
    } else {
      await page.pdf({ path: base + ".pdf", width: `${Math.ceil(box.width)}px`, height: `${Math.ceil(box.height)}px`, printBackground: true });
    }
  }
  console.log("✓", path.basename(base), formats.map((f) => "." + f).join(" "), `(${Math.round(box.width)}x${Math.round(box.height)})`);
  await ctx.close();
}
await browser.close();
console.log("完了 →", OUT);
