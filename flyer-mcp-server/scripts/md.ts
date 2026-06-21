// Markdown 原稿のファイル往復 CLI。
//   npm run md:export  → output/editor/flyer.md を書き出す
//   npm run md:import  → output/editor/flyer.md を読み込み doc.json を差し替える
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toMarkdown, fromMarkdown } from "../src/lib.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..");
const DOC = path.join(ROOT, "editor", "doc.json");
const MD = process.env.MD || path.join(ROOT, "output", "editor", "flyer.md");
const INITIAL = path.join(here, "..", "data", "initialDoc.json");

const cmd = process.argv[2];
if (!fs.existsSync(DOC)) {
  if (fs.existsSync(INITIAL)) fs.copyFileSync(INITIAL, DOC);
  else { console.error("doc.json も初期データもありません。npm run seed を実行してください。"); process.exit(1); }
}
const doc = JSON.parse(fs.readFileSync(DOC, "utf-8"));

if (cmd === "export") {
  fs.mkdirSync(path.dirname(MD), { recursive: true });
  fs.writeFileSync(MD, toMarkdown(doc));
  console.log("書き出しました →", MD);
} else if (cmd === "import") {
  if (!fs.existsSync(MD)) { console.error("Markdown が見つかりません:", MD); process.exit(1); }
  const res = fromMarkdown(fs.readFileSync(MD, "utf-8"), doc);
  if (res.changed > 0) fs.writeFileSync(DOC, JSON.stringify(doc, null, 2));
  console.log(`差し替え: ${res.changed}件 変更` +
    (res.unknown.length ? ` / 不明パス ${res.unknown.length}` : "") +
    (res.nonText.length ? ` / 非テキスト ${res.nonText.length}` : ""));
  res.diffs.slice(0, 20).forEach((d) => console.log("  ✓ " + d.path));
} else {
  console.error('使い方: npm run md:export | npm run md:import');
  process.exit(1);
}
