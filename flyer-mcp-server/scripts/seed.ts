// 初期 doc を生成: エディタの initialDoc を data/initialDoc.json と editor/doc.json に書き出す。
// 実行: npm run seed  （tsx 経由。型のみ依存のため React 等は読み込まれない）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initialDoc } from "../../editor/src/data/doc.ts";

const here = path.dirname(fileURLToPath(import.meta.url));      // flyer-mcp-server/scripts
const SERVER = path.resolve(here, "..");                        // flyer-mcp-server
const ROOT = path.resolve(SERVER, "..");                        // プロジェクト直下
const json = JSON.stringify(initialDoc, null, 2);

fs.mkdirSync(path.join(SERVER, "data"), { recursive: true });
fs.writeFileSync(path.join(SERVER, "data", "initialDoc.json"), json);

const editorDoc = path.join(ROOT, "editor", "doc.json");
if (!fs.existsSync(editorDoc)) fs.writeFileSync(editorDoc, json);

console.log("seeded:");
console.log("  " + path.join(SERVER, "data", "initialDoc.json"));
console.log("  " + editorDoc + (fs.existsSync(editorDoc) ? "" : " (skipped)"));
